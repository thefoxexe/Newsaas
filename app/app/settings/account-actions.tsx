"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/auth/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
      }}
      className="rounded-pill border border-border px-4 py-2 text-sm font-semibold"
    >
      Se déconnecter
    </button>
  );
}

export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-pill border border-danger px-4 py-2 text-sm font-semibold text-danger"
      >
        Supprimer mon compte
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-danger">Cette action est définitive.</p>
      <button
        onClick={async () => {
          await fetch("/api/account", { method: "DELETE" });
          router.push("/");
        }}
        className="rounded-pill bg-danger px-4 py-2 text-sm font-semibold text-white"
      >
        Confirmer la suppression
      </button>
      <button onClick={() => setConfirming(false)} className="text-sm text-muted underline">
        Annuler
      </button>
    </div>
  );
}
