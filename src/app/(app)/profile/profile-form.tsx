"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUploadField } from "@/components/ui/image-upload";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { api, ApiClientError } from "@/lib/api";

/** PDF screen 12 lists a language preference; these are the locales we label. */
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी — Hindi" },
  { value: "gu", label: "ગુજરાતી — Gujarati" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語 — Japanese" },
];

type ProfileUser = {
  name: string;
  email: string;
  role: string;
  photoUrl: string | null;
  languagePref: string;
};

export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [photoUrl, setPhotoUrl] = useState<string | null>(user.photoUrl);
  const [languagePref, setLanguagePref] = useState(user.languagePref);
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string[] | undefined>>({});

  const dirty =
    name !== user.name ||
    email !== user.email ||
    photoUrl !== user.photoUrl ||
    languagePref !== user.languagePref ||
    password.length > 0;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setIssues({});

    try {
      await api.patch("/api/profile", {
        name,
        email,
        photoUrl,
        languagePref,
        ...(password ? { password } : {}),
      });
      setPassword("");
      toast.success("Profile updated");
      // The JWT still carries the previous name/email until it refreshes.
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
        setIssues(err.issues ?? {});
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await api.del("/api/profile");
      toast.success("Account deleted");
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setConfirmOpen(false);
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not delete your account.",
      );
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <form onSubmit={onSave} className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Your details</h2>
            {user.role === "ADMIN" && <Badge variant="primary">Admin</Badge>}
          </div>

          <FormError message={formError} />

          <ImageUploadField
            value={photoUrl}
            onChange={setPhotoUrl}
            name={name || "Traveller"}
            label="Profile photo"
          />

          <Field label="Full name" htmlFor="name" error={issues.name} required>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
            />
          </Field>

          <Field label="Email" htmlFor="email" error={issues.email} required>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field
            label="Language preference"
            htmlFor="language"
            hint="Used for dates and number formatting across your trips."
            error={issues.languagePref}
          >
            <select
              id="language"
              value={languagePref}
              onChange={(e) => setLanguagePref(e.target.value)}
              className="h-10 w-full rounded-[var(--radius)] border border-border bg-surface px-3 text-[15px] outline-none transition-colors focus-visible:border-primary"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="New password"
            htmlFor="password"
            hint="Leave blank to keep your current password."
            error={issues.password}
          >
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </Field>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!dirty} loading={saving}>
              <Save className="size-4" />
              Save changes
            </Button>
            {dirty && !saving && (
              <span className="text-[13px] text-foreground-subtle">Unsaved changes</span>
            )}
          </div>
        </form>
      </Card>

      <Card className="border-danger/30 p-6">
        <h2 className="text-lg font-semibold text-danger">Danger zone</h2>
        <p className="mt-1 text-[14px] text-foreground-muted">
          Deleting your account permanently removes your trips, stops, activities and expenses.
          This cannot be undone.
        </p>
        <Button
          type="button"
          variant="danger"
          className="mt-4"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-4" />
          Delete account
        </Button>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete your account?"
        description="Every trip you have planned will be deleted along with it. Type DELETE to confirm."
        confirmLabel="Delete account"
        confirmPhrase="DELETE"
        loading={deleting}
        onConfirm={onDelete}
      />
    </div>
  );
}
