"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input, Textarea, Select, SearchInput } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { api, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/cn";

export type AdminCityRow = {
  id: string;
  name: string;
  country: string;
  region: string;
  costIndex: number;
  popularity: number;
  description: string | null;
  imageUrl: string | null;
  activityCount: number;
  stopCount: number;
};

type Draft = {
  name: string;
  country: string;
  region: string;
  costIndex: string;
  popularity: string;
  description: string;
  imageUrl: string;
};

const EMPTY: Draft = {
  name: "",
  country: "",
  region: "",
  costIndex: "50",
  popularity: "50",
  description: "",
  imageUrl: "",
};

export function CitiesTable({ rows, regions }: { rows: AdminCityRow[]; regions: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");

  const [editing, setEditing] = useState<AdminCityRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string[] | undefined>>({});

  const [deleting, setDeleting] = useState<AdminCityRow | null>(null);
  const [removing, setRemoving] = useState(false);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((c) => {
      if (region && c.region !== region) return false;
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) || c.country.toLowerCase().includes(term)
      );
    });
  }, [rows, q, region]);

  function openCreate() {
    setDraft(EMPTY);
    setError(null);
    setIssues({});
    setCreating(true);
  }

  function openEdit(city: AdminCityRow) {
    setDraft({
      name: city.name,
      country: city.country,
      region: city.region,
      costIndex: String(city.costIndex),
      popularity: String(city.popularity),
      description: city.description ?? "",
      imageUrl: city.imageUrl ?? "",
    });
    setError(null);
    setIssues({});
    setEditing(city);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setIssues({});

    const body = {
      name: draft.name.trim(),
      country: draft.country.trim(),
      region: draft.region.trim(),
      costIndex: Number(draft.costIndex),
      popularity: Number(draft.popularity),
      description: draft.description.trim() || undefined,
      imageUrl: draft.imageUrl.trim() || undefined,
    };

    try {
      if (editing) {
        await api.patch(`/api/cities/${editing.id}`, body);
        toast.success(`Updated ${body.name}`);
      } else {
        await api.post("/api/cities", body);
        toast.success(`Added ${body.name}`);
      }
      setEditing(null);
      setCreating(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setIssues(err.issues ?? {});
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await api.del(`/api/cities/${deleting.id}`);
      toast.success(`Deleted ${deleting.name}`);
      setDeleting(null);
      router.refresh();
    } catch (err) {
      // A city referenced by a trip stop returns 409 — surface that verbatim
      // rather than pretending the delete worked.
      toast.error(err instanceof ApiClientError ? err.message : "Could not delete.");
    } finally {
      setRemoving(false);
    }
  }

  const open = creating || editing !== null;

  return (
    <>
      <div className="rounded-[var(--radius)] border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
          <div className="min-w-52 flex-1">
            <SearchInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onClear={() => setQ("")}
              placeholder="Search city or country"
              className="h-9 text-[13px]"
              aria-label="Search cities"
            />
          </div>

          <Select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            aria-label="Filter by region"
            className="h-9 w-auto min-w-40 text-[13px]"
          >
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>

          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            Add city
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[12px] uppercase tracking-wide text-foreground-subtle">
                <th scope="col" className="px-4 py-2.5 font-medium">City</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Region</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Cost index</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Popularity</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Activities</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">In use</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-foreground-subtle">
                    No cities match that search.
                  </td>
                </tr>
              )}

              {visible.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/50"
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-[12px] text-foreground-subtle">{c.country}</p>
                  </td>
                  <td className="px-4 py-2.5 text-foreground-muted">{c.region}</td>
                  <td className="tnum px-4 py-2.5 text-right">{c.costIndex}</td>
                  <td className="tnum px-4 py-2.5 text-right">{c.popularity}</td>
                  <td className="tnum px-4 py-2.5 text-right">{c.activityCount}</td>
                  <td className="px-4 py-2.5 text-right">
                    {c.stopCount > 0 ? (
                      <Badge variant="primary">{c.stopCount} stops</Badge>
                    ) : (
                      <span className="text-foreground-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDeleting(c)}
                        // A city in use cannot be deleted; the API enforces it,
                        // this just avoids offering an action that will fail.
                        disabled={c.stopCount > 0}
                        title={c.stopCount > 0 ? "In use by a trip stop" : undefined}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-4 py-2.5 text-[12px] text-foreground-subtle">
          Showing {visible.length} of {rows.length} cities
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <form onSubmit={save}>
            <DialogHeader>
              <DialogTitle>{editing ? `Edit ${editing.name}` : "Add a city"}</DialogTitle>
              <DialogDescription>
                Cities feed search, recommendations and every cost estimate.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
              <FormError message={error} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="c-name" error={issues.name} required>
                  <Input
                    id="c-name"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Country" htmlFor="c-country" error={issues.country} required>
                  <Input
                    id="c-country"
                    value={draft.country}
                    onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <Field label="Region" htmlFor="c-region" error={issues.region} required>
                <Input
                  id="c-region"
                  list="admin-regions"
                  value={draft.region}
                  onChange={(e) => setDraft({ ...draft, region: e.target.value })}
                  required
                />
                <datalist id="admin-regions">
                  {regions.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Cost index"
                  htmlFor="c-cost"
                  hint="1–100, relative daily cost"
                  error={issues.costIndex}
                  required
                >
                  <Input
                    id="c-cost"
                    type="number"
                    min={1}
                    max={100}
                    value={draft.costIndex}
                    onChange={(e) => setDraft({ ...draft, costIndex: e.target.value })}
                    required
                  />
                </Field>
                <Field
                  label="Popularity"
                  htmlFor="c-pop"
                  hint="0–100, drives recommendations"
                  error={issues.popularity}
                  required
                >
                  <Input
                    id="c-pop"
                    type="number"
                    min={0}
                    max={100}
                    value={draft.popularity}
                    onChange={(e) => setDraft({ ...draft, popularity: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <Field label="Description" htmlFor="c-desc" error={issues.description}>
                <Textarea
                  id="c-desc"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>

              <Field
                label="Image URL"
                htmlFor="c-img"
                hint="Leave blank to use the deterministic gradient fallback."
                error={issues.imageUrl}
              >
                <Input
                  id="c-img"
                  value={draft.imageUrl}
                  onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "Save changes" : "Add city"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "city"}?`}
        description="This also removes its activities. A city used by any trip stop cannot be deleted."
        confirmLabel="Delete city"
        loading={removing}
        onConfirm={remove}
      />
    </>
  );
}
