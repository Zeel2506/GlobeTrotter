"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    if (res?.error) {
      // authorize() returns null for bad password, unknown email AND a
      // deactivated account — they are deliberately indistinguishable here.
      setError("That email and password combination didn't work.");
      setLoading(false);
      return;
    }

    // refresh() so the server layout re-reads the new session before we land.
    router.push(callbackUrl || "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
      <FormError message={error} />

      <Field label="Email" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          minLength={6}
          required
        />
      </Field>

      <Button type="submit" size="lg" loading={loading} className="mt-1">
        Log in
      </Button>
    </form>
  );
}
