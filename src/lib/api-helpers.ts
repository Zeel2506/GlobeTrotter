// The pattern every API route handler follows. Keeps handlers 10-liners.
//
//   export async function POST(req: NextRequest) {
//     return handle(async () => {
//       const { user } = await requireRole();
//       const body = await parseBody(req, createSchema);
//       const row = await prisma.trip.create({ data: { ...body, userId: user.id } });
//       return ok(row, 201);
//     });
//   }
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ── Response shapes: always { data } or { error } ──────────────────────────
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Wrap a handler body; converts thrown ApiError/ZodError into JSON errors. */
export async function handle(fn: () => Promise<NextResponse>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: z.flattenError(err).fieldErrors },
        { status: 422 },
      );
    }
    console.error("[api]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Auth / role guard ───────────────────────────────────────────────────────
export type SessionUser = { id: string; name: string; email: string; role: string };

/** Throws 401 if not logged in, 403 if role not allowed. Omit roles = any logged-in user. */
export async function requireRole(roles?: string[]) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) throw new ApiError(401, "Not authenticated");
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    throw new ApiError(403, "You don't have permission to do this");
  }
  return { user };
}

/** Like requireRole() but returns null instead of throwing — for optionally-authed routes. */
export async function optionalUser(): Promise<SessionUser | null> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  return user?.id ? user : null;
}

// ── Validation ──────────────────────────────────────────────────────────────
export async function parseBody<S extends z.ZodType>(
  req: NextRequest,
  schema: S,
): Promise<z.infer<S>> {
  const json = await req.json().catch(() => {
    throw new ApiError(400, "Invalid JSON body");
  });
  return schema.parse(json);
}

/** Parse + validate query params with a zod schema (coercion lives in the schema). */
export function parseQuery<S extends z.ZodType>(req: NextRequest, schema: S): z.infer<S> {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams));
}

/** Common list-endpoint params: ?q=&page=&pageSize= */
export function parseListQuery(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 20) || 20));
  return {
    q: sp.get("q")?.trim() || undefined,
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/** Standard paginated envelope so every list endpoint looks the same. */
export function page<T>(rows: T[], total: number, p: { page: number; pageSize: number }) {
  return ok({ rows, total, page: p.page, pageSize: p.pageSize });
}

// ── CSV export (admin tables) ───────────────────────────────────────────────
export function csv<T extends Record<string, unknown>>(
  rows: T[],
  columns: (keyof T)[],
  filename: string,
) {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [
    columns.map(escape).join(","),
    ...rows.map((r) => columns.map((c) => escape(r[c])).join(",")),
  ].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// ── Activity log + notifications ────────────────────────────────────────────
export async function logActivity(input: {
  action: string;
  entityType: string;
  entityId: string;
  message: string;
  userId: string;
}) {
  await prisma.activityLog.create({ data: input });
}

export async function notify(input: {
  userIds: string[];
  title: string;
  body?: string;
  link?: string;
}) {
  if (input.userIds.length === 0) return;
  await prisma.notification.createMany({
    data: input.userIds.map((userId) => ({
      userId,
      title: input.title,
      body: input.body,
      link: input.link,
    })),
  });
}
