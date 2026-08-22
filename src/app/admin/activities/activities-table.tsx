"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { CategoryChip } from "@/components/category-chip";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { api, ApiClientError } from "@/lib/api";
import { formatMoney, formatDuration } from "@/lib/format";

export type AdminActivityRow = {
  id: string;
  name: string;
  category: string;
  cost: number;
  durationHours: number;
  description: string | null;
  cityId: string;
  cityName: string;
  country: string;
  usageCount: number;
};

type CityOption = { id: string; name: string; country: string };

const CATEGORIES = [
  "SIGHTSEEING",
  "FOOD",
  "ADVENTURE",
  "CULTURE",
  "NIGHTLIFE",
  "SHOPPING",
  "NATURE",
  "OTHER",
];

type Draft = {
  name: string;
  cityId: string;
  category: string;
  cost: string;
  durationHours: string;
  description: string;
};

const EMPTY: Draft = {
  name: "",
  cityId: "",
  category: "SIGHTSEEING",
  cost: "1000",
  durationHours: "2",
  description: "",
};

export function ActivitiesTable({
  rows,
  cities,
}: {
  rows: AdminActivityRow[];
  cities: CityOption[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cityId, setCityId] = useState("");
  const [category, setCategory] = useState("");

  const [editing, setEditing] = useState<AdminActivityRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string[] | undefined>>({});

  const [deleting, setDeleting] = useState<AdminActivityRow | null>(null);
  const [removing, setRemoving] = useState(false);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((a) => {
      if (cityId && a.cityId !== cityId) return false;
      if (category && a.category !== category) return false;
      if (!term) return true;
      return a.name.toLowerCase().includes(term) || a.cityName.toLowerCase().includes(term);
    });
  }, [rows, q, cityId, category]);

  function openCreate() {
    setDraft({ ...EMPTY, cityId: cities[0]?.id ?? "" });
    setError(null);
    setIssues({});
    setCreating(true);
  }

  function openEdit(a: AdminActivityRow) {
    setDraft({
      name: a.name,
      cityId: a.cityId,
      category: a.category,
      cost: String(a.cost),
      durationHours: String(a.durationHours),
      description: a.description ?? "",
    });
    setError(null);
    setIssues({});
    setEditing(a);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setIssues({});

    const body = {
      name: draft.name.trim(),
      cityId: draft.cityId,
      category: draft.category,
      cost: Number(draft.cost),
      durationHours: Number(draft.durationHours),
      description: draft.description.trim() || undefined,
    };

    try {
      if (editing) {
        await api.patch(`/api/activities/${editing.id}`, body);
        toast.success(`Updated ${body.name}`);
      } else {
        await api.post("/api/activities", body);
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
      await api.del(`/api/activities/${deleting.id}`);
      toast.success(`Deleted ${deleting.name}`);
      setDeleting(null);
      router.refresh();
    } catch (err) {
      // Scheduled in someone's itinerary → 409. Show the API's own wording.
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
          <div className="min-w-48 flex-1">
            <SearchInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onClear={() => setQ("")}
              placeholder="Search activity or city"
              className="h-9 text-[13px]"
              aria-label="Search activities"
            />
          </div>

          <Select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            aria-label="Filter by city"
            className="h-9 w-auto min-w-40 text-[13px]"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="h-9 w-auto min-w-40 text-[13px]"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>

          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            Add activity
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[12px] uppercase tracking-wide text-foreground-subtle">
                <th scope="col" className="px-4 py-2.5 font-medium">Activity</th>
                <th scope="col" className="px-4 py-2.5 font-medium">City</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Category</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Cost</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Duration</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Scheduled</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-foreground-subtle">
                    No activities match those filters.
                  </td>
                </tr>
              )}

              {visible.slice(0, 200).map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/50"
                >
                  <td className="max-w-[280px] px-4 py-2.5">
                    <p className="truncate font-medium">{a.name}</p>
                  </td>
                  <td className="px-4 py-2.5 text-foreground-muted">
                    {a.cityName}
                    <span className="text-foreground-subtle"> · {a.country}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <CategoryChip category={a.category} />
                  </td>
                  <td className="tnum px-4 py-2.5 text-right">{formatMoney(a.cost)}</td>
                  <td className="tnum px-4 py-2.5 text-right text-foreground-muted">
                    {formatDuration(a.durationHours)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {a.usageCount > 0 ? (
                      <Badge variant="primary">{a.usageCount}×</Badge>
                    ) : (
                      <span className="text-foreground-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(a)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDeleting(a)}
                        disabled={a.usageCount > 0}
                        title={a.usageCount > 0 ? "Scheduled in an itinerary" : undefined}
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
          Showing {Math.min(visible.length, 200)} of {rows.length} activities
          {visible.length > 200 && " — narrow the filters to see the rest"}
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
              <DialogTitle>{editing ? `Edit ${editing.name}` : "Add an activity"}</DialogTitle>
              <DialogDescription>
                An activity can only be scheduled in the city it belongs to.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
              <FormError message={error} />

              <Field label="Name" htmlFor="a-name" error={issues.name} required>
                <Input
                  id="a-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  required
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City" htmlFor="a-city" error={issues.cityId} required>
                  <Select
                    id="a-city"
                    value={draft.cityId}
                    onChange={(e) => setDraft({ ...draft, cityId: e.target.value })}
                    required
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}, {c.country}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Category" htmlFor="a-cat" error={issues.category} required>
                  <Select
                    id="a-cat"
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    required
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0) + c.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Cost (₹)"
                  htmlFor="a-cost"
                  hint="Per person"
                  error={issues.cost}
                  required
                >
                  <Input
                    id="a-cost"
                    type="number"
                    min={0}
                    step={10}
                    value={draft.cost}
                    onChange={(e) => setDraft({ ...draft, cost: e.target.value })}
                    required
                  />
                </Field>
                <Field
                  label="Duration (hours)"
                  htmlFor="a-dur"
                  error={issues.durationHours}
                  required
                >
                  <Input
                    id="a-dur"
                    type="number"
                    min={0.5}
                    max={24}
                    step={0.5}
                    value={draft.durationHours}
                    onChange={(e) => setDraft({ ...draft, durationHours: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <Field label="Description" htmlFor="a-desc" error={issues.description}>
                <Textarea
                  id="a-desc"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
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
                {editing ? "Save changes" : "Add activity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "activity"}?`}
        description="An activity already scheduled in someone's itinerary cannot be deleted."
        confirmLabel="Delete activity"
        loading={removing}
        onConfirm={remove}
      />
    </>
  );
}
