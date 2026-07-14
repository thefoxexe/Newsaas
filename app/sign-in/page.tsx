"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/supabase/client";
import { useLanguage } from "../i18n/language-context";

export default function SignInPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/app");
    } catch {
      setError(t.authPages.unexpectedError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-24">
      <Link href="/" className="mx-auto mb-8 flex items-center gap-2 font-display text-lg font-bold tracking-tight">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">R</span>
        ReelJolt
      </Link>

      <h1 className="text-center font-display text-2xl font-bold">{t.authPages.signInTitle}</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder={t.authPages.email}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-pill border border-border bg-surface px-5 py-3 outline-none focus:border-primary"
        />
        <input
          type="password"
          required
          placeholder={t.authPages.password}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-pill border border-border bg-surface px-5 py-3 outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-pill bg-primary px-5 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {submitting ? "..." : t.authPages.signInButton}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t.authPages.noAccount}{" "}
        <Link href="/sign-up" className="text-foreground underline">
          {t.authPages.signUpButton}
        </Link>
      </p>
    </main>
  );
}
