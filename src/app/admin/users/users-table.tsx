"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, User as UserIcon, Check, Ban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { api, ApiClientError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  tripCount: number;
};

type Filter = "all" | "admins" | "suspended";

export function UsersTable({
  rows: initial,
  currentUserId,
}: {
  rows: AdminUserRow[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((u) => {
      if (filter === "admins" && u.role !== "ADMIN") return false;
      if (filter === "suspended" && u.isActive) return false;
      if (!term) return true;
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    });
  }, [rows, q, filter]);

  async function patch(user: AdminUserRow, body: { isActive?: boolean; role?: string }) {
    setPending(user.id);
    const previous = rows;
    // Optimistic: the table is the only feedback surface, so it should move at once.
    setRows((all) => all.map((u) => (u.id === user.id ? { ...u, ...body } : u)));

    try {
      await api.patch(`/api/admin/users/${user.id}`, body);
      toast.success(`Updated ${user.name}`);
    } catch (err) {
      setRows(previous);
      toast.error(err instanceof ApiClientError ? err.message : "Update failed.");
    } finally {
      setPending(null);
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `All ${rows.length}` },
    { key: "admins", label: "Admins" },
    { key: "suspended", label: "Suspended" },
  ];

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="h-9 pl-9 text-[13px]"
            aria-label="Search users"
          />
        </div>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] font-medium transition-colors",
                filter === f.key
                  ? "bg-foreground text-background"
                  : "text-foreground-muted hover:bg-surface-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[12px] uppercase tracking-wide text-foreground-subtle">
              <th scope="col" className="px-4 py-2.5 font-medium">User</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Role</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Trips</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Joined</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-foreground-subtle">
                  No users match that search.
                </td>
              </tr>
            )}

            {visible.map((u) => {
              const isSelf = u.id === currentUserId;
              const busy = pending === u.id;

              return (
                <tr
                  key={u.id}
                  className={cn(
                    "border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/50",
                    !u.isActive && "opacity-60",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} className="size-8" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {u.name}
                          {isSelf && (
                            <span className="ml-1.5 text-[12px] text-foreground-subtle">(you)</span>
                          )}
                        </p>
                        <p className="truncate text-[12px] text-foreground-subtle">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-2.5">
                    <Badge variant={u.role === "ADMIN" ? "primary" : "neutral"}>
                      {u.role === "ADMIN" ? (
                        <ShieldCheck className="size-3" />
                      ) : (
                        <UserIcon className="size-3" />
                      )}
                      {u.role}
                    </Badge>
                  </td>

                  <td className="px-4 py-2.5">
                    <Badge variant={u.isActive ? "success" : "danger"}>
                      {u.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </td>

                  <td className="tnum px-4 py-2.5 text-right">{u.tripCount}</td>

                  <td className="px-4 py-2.5 text-foreground-muted">
                    {formatDate(u.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isSelf || busy}
                        title={isSelf ? "You cannot change your own role" : undefined}
                        onClick={() =>
                          patch(u, { role: u.role === "ADMIN" ? "USER" : "ADMIN" })
                        }
                      >
                        {u.role === "ADMIN" ? "Make user" : "Make admin"}
                      </Button>
                      <Button
                        size="sm"
                        variant={u.isActive ? "secondary" : "primary"}
                        disabled={isSelf || busy}
                        title={isSelf ? "You cannot suspend your own account" : undefined}
                        onClick={() => patch(u, { isActive: !u.isActive })}
                      >
                        {u.isActive ? (
                          <>
                            <Ban className="size-3.5" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <Check className="size-3.5" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
