"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";

type FieldErrors = Record<string, string[] | undefined>;

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIssues({});
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    };

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      // 422 carries per-field issues, 409 means the email is taken.
      if (body.issues) setIssues(body.issues as FieldErrors);
      setError(body.error ?? "Could not create your account. Please try again.");
      setLoading(false);
      return;
    }

    // Sign straight in so the user never re-types what they just entered.
    const signed = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    if (signed?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
      <FormError message={error} />

      <Field label="Name" htmlFor="name" error={issues.name} required>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Zeel Patel"
          minLength={2}
          maxLength={80}
          required
        />
      </Field>

      <Field label="Email" htmlFor="email" error={issues.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={issues.password}
        hint="At least 6 characters."
        required
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={6}
          maxLength={72}
          required
        />
      </Field>

      <Button type="submit" size="lg" loading={loading} className="mt-1">
        Create account
      </Button>
    </form>
  );
}
