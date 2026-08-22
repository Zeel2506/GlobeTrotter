/**
 * Client-side fetch wrapper for the frozen API in docs/API_CONTRACT.md.
 * Every response is `{ data }` or `{ error, issues? }`, so unwrapping lives
 * here once instead of at 40 call sites.
 */

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiClientError(
      res.status,
      body?.error ?? "Something went wrong. Please try again.",
      body?.issues,
    );
  }

  return body?.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Build a query string, dropping empty/undefined values. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ── Shared response types, mirroring docs/API_CONTRACT.md ────────────────────

export type TripStatus = "upcoming" | "ongoing" | "past";

export type TripCard = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  coverPhotoUrl: string | null;
  status: TripStatus;
  stopCount: number;
  firstCityImage: string | null;
  firstCityName: string | null;
  totalCost: number;
  budgetTotal: number | null;
  isPublic: boolean;
};

export type Paged<T> = { rows: T[]; total: number; page: number; pageSize: number };

export type CityRow = {
  id: string;
  name: string;
  country: string;
  region: string;
  costIndex: number;
  popularity: number;
  description: string | null;
  imageUrl: string | null;
  _count?: { activities: number };
};

export type ActivityRow = {
  id: string;
  cityId: string;
  name: string;
  category: string;
  cost: number;
  durationHours: number;
  description: string | null;
  imageUrl: string | null;
  city?: { id: string; name: string; country: string };
};

export type DashboardPayload = {
  user: { name: string; photoUrl: string | null };
  upcoming: (TripCard & { daysUntil: number })[];
  recommended: CityRow[];
  budgetHighlights: {
    tripId: string;
    tripName: string;
    grand: number;
    budgetTotal: number | null;
    overBudget: boolean;
    overBudgetDays: number;
  } | null;
  recent: TripCard[];
  counts: { trips: number; cities: number; savedDestinations: number };
};

export type CityFacets = {
  countries: string[];
  regions: string[];
  costIndex: { min: number; max: number };
};
