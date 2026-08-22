import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "../header";
import { UsersTable, type AdminUserRow } from "./users-table";

export const metadata: Metadata = { title: "Users · Admin" };
export const dynamic = "force-dynamic";

// S13's user-management half. Mutations go through PATCH /api/admin/users/[id],
// which is where the "cannot demote the last admin" rules live.
export default async function AdminUsersPage() {
  const session = await auth();
  const me = session!.user as { id: string };

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { trips: true } },
    },
  });

  const rows: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    tripCount: u._count.trips,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <AdminHeader
        title="Users"
        description="Activate or suspend accounts and change roles. You cannot change your own."
        csvHref="/api/admin/users?format=csv"
        csvLabel="Export users CSV"
      />
      <UsersTable rows={rows} currentUserId={me.id} />
    </div>
  );
}
