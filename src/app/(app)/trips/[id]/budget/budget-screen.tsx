"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Receipt, CalendarRange, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  BudgetDonut,
  PerDayBarChart,
  BudgetProgress,
} from "@/components/budget/budget-charts";
import { EXPENSE_CATEGORIES } from "@/config/category-colors";
import { formatMoney, formatDate } from "@/lib/format";
import { api, ApiClientError } from "@/lib/api";
import type { Budget } from "@/lib/budget";

type ExpenseRow = {
  id: string;
  stopId: string;
  stopCity: string;
  category: string;
  description: string;
  amount: number;
  date: string | null;
};

type StopRow = { id: string; cityName: string; startDate: string; endDate: string };

export function BudgetScreen({
  tripId,
  budget,
  stops,
  expenses,
}: {
  tripId: string;
  budget: Budget;
  stops: StopRow[];
  expenses: ExpenseRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExpenseRow | null>(null);
  const [budgetInput, setBudgetInput] = useState(
    budget.budgetTotal !== null ? String(budget.budgetTotal) : "",
  );

  async function addExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const stopId = String(form.get("stopId"));

    try {
      await api.post(`/api/stops/${stopId}/expenses`, {
        category: String(form.get("category")),
        description: String(form.get("description")).trim(),
        amount: Number(form.get("amount")),
        date: form.get("date") ? String(form.get("date")) : undefined,
      });
      toast.success("Expense added.");
      setAdding(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not add that expense.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeExpense() {
    if (!pendingDelete) return;
    setSaving(true);
    try {
      await api.del(`/api/expenses/${pendingDelete.id}`);
      toast.success("Expense removed.");
      setPendingDelete(null);
      router.refresh();
    } catch {
      toast.error("Could not remove that expense.");
    } finally {
      setSaving(false);
    }
  }

  async function saveBudgetTotal() {
    setSaving(true);
    try {
      await api.patch(`/api/trips/${tripId}`, {
        budgetTotal: budgetInput === "" ? null : Number(budgetInput),
      });
      toast.success("Budget updated.");
      router.refresh();
    } catch {
      toast.error("Could not update the budget.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Receipt}
          label="Total cost"
          value={formatMoney(budget.totals.grand)}
          tone={budget.overBudget ? "danger" : "default"}
        />
        <StatCard
          icon={TrendingUp}
          label="Average per day"
          value={formatMoney(budget.avgPerDay)}
          hint={`Across ${budget.nights} ${budget.nights === 1 ? "night" : "nights"}`}
        />
        <StatCard
          icon={CalendarRange}
          label="Over-budget days"
          value={budget.overBudgetDays}
          tone={budget.overBudgetDays > 0 ? "danger" : "success"}
          hint={budget.budgetTotal === null ? "Set a budget below" : undefined}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost per day</CardTitle>
            </CardHeader>
            <CardContent>
              <PerDayBarChart budget={budget} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle>Expenses</CardTitle>
              {stops.length > 0 && (
                <Button size="sm" variant="soft" onClick={() => setAdding((v) => !v)}>
                  <Plus />
                  Add expense
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {stops.length === 0 ? (
                <p className="text-[13px] text-foreground-subtle">
                  Add a city stop first — expenses are recorded against a stop.
                </p>
              ) : (
                <>
                  {adding && (
                    <form
                      onSubmit={addExpense}
                      className="mb-4 flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface-muted/50 p-4"
                    >
                      <FormError message={error} />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Stop" htmlFor="stopId" required>
                          <Select id="stopId" name="stopId" required>
                            {stops.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.cityName}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <Field label="Category" htmlFor="category" required>
                          <Select id="category" name="category" required>
                            {EXPENSE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c.charAt(0) + c.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      </div>

                      <Field label="Description" htmlFor="description" required>
                        <Input
                          id="description"
                          name="description"
                          placeholder="Train from Paris to Rome"
                          maxLength={120}
                          required
                        />
                      </Field>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Amount" htmlFor="amount" required>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="120"
                            required
                          />
                        </Field>
                        <Field
                          label="Date"
                          htmlFor="date"
                          hint="Optional — undated costs land on day 1."
                        >
                          <Input id="date" name="date" type="date" />
                        </Field>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setAdding(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" loading={saving}>
                          Add expense
                        </Button>
                      </div>
                    </form>
                  )}

                  {expenses.length === 0 ? (
                    <EmptyState
                      icon={Receipt}
                      title="No expenses yet"
                      description="Add transport, stay and meal costs to see the full picture beyond activities."
                      className="py-8"
                    />
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {expenses.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{e.description}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline">
                                {e.category.charAt(0) + e.category.slice(1).toLowerCase()}
                              </Badge>
                              <span className="text-[11px] text-foreground-subtle">
                                {e.stopCity}
                                {e.date ? ` · ${formatDate(e.date)}` : ""}
                              </span>
                            </div>
                          </div>
                          <span className="tnum text-sm font-semibold">
                            {formatMoney(e.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(e)}
                            aria-label={`Remove ${e.description}`}
                            className="rounded-[var(--radius-sm)] p-1.5 text-foreground-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Where it goes</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetDonut budget={budget} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget target</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <BudgetProgress budget={budget} />

              <div className="flex items-end gap-2">
                <Field label="Total budget" htmlFor="budgetTotal" className="flex-1">
                  <Input
                    id="budgetTotal"
                    type="number"
                    min={0}
                    value={budgetInput}
                    onChange={(ev) => setBudgetInput(ev.target.value)}
                    placeholder="Not set"
                  />
                </Field>
                <Button variant="secondary" onClick={saveBudgetTotal} loading={saving}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Remove this expense?"
        description={pendingDelete?.description}
        confirmLabel="Remove"
        loading={saving}
        onConfirm={removeExpense}
      />
    </div>
  );
}
