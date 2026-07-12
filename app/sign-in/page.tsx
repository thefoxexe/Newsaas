"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/src/auth/auth-client";
import { claimPendingBrandIfAny } from "../claim-pending-brand";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await authClient.signIn.email({ email, password });
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "Identifiants incorrects.");
      return;
    }

    const brandId = await claimPendingBrandIfAny();
    router.push(brandId ? `/app?brand=${brandId}` : "/app");
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-center text-2xl font-bold">Se connecter</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-pill border border-border bg-surface px-5 py-3 outline-none focus:border-primary"
        />
        <input
          type="password"
          required
          placeholder="Mot de passe"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-pill border border-border bg-surface px-5 py-3 outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-pill bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "..." : "Se connecter"}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/app" })}
          className="rounded-pill border border-border px-5 py-3 font-semibold"
        >
          Continuer avec Google
        </button>
        <button
          onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/app" })}
          className="rounded-pill border border-border px-5 py-3 font-semibold"
        >
          Continuer avec GitHub
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href="/sign-up" className="underline">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
