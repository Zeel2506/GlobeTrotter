import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

// S1 — docs/SPEC.md. searchParams carries ?callbackUrl= set by the middleware
// when it bounces an unauthenticated request.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-foreground-muted">
        Log in to pick up where your itinerary left off.
      </p>

      <LoginForm callbackUrl={callbackUrl} />

      <p className="mt-6 text-center text-sm text-foreground-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
