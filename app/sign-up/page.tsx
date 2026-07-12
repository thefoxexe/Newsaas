"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/supabase/client";
import { claimPendingBrandIfAny } from "../claim-pending-brand";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is enabled in the Supabase project, signUp
    // succeeds but returns no session until the user clicks the link —
    // there's nothing to redirect into yet.
    if (!data.session) {
      setCheckEmail(true);
      return;
    }

    const brandId = await claimPendingBrandIfAny();
    router.push(brandId ? `/app?brand=${brandId}` : "/app");
  }

  if (checkEmail) {
    return (
      <main className="mx-auto max-w-sm px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Vérifie ta boîte mail</h1>
        <p className="mt-4 text-muted">
          On a envoyé un lien de confirmation à <strong>{email}</strong>. Clique dessus pour activer ton compte.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-center text-2xl font-bold">Créer un compte</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="text"
          required
          placeholder="Nom"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-pill border border-border bg-surface px-5 py-3 outline-none focus:border-primary"
        />
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
          minLength={8}
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
          {submitting ? "..." : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href="/sign-in" className="underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
