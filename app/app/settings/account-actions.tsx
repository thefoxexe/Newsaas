"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
      }}
      className="rounded-pill border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-border-strong"
    >
      {label}
    </button>
  );
}

export function DeleteAccountButton({
  labels,
}: {
  labels: { deleteAccount: string; deleteWarning: string; confirmDelete: string; cancel: string };
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-pill border border-danger px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
      >
        {labels.deleteAccount}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-danger">{labels.deleteWarning}</p>
      <button
        onClick={async () => {
          await fetch("/api/account", { method: "DELETE" });
          router.push("/");
        }}
        className="rounded-pill bg-danger px-4 py-2 text-sm font-semibold text-white"
      >
        {labels.confirmDelete}
      </button>
      <button onClick={() => setConfirming(false)} className="text-sm text-muted underline">
        {labels.cancel}
      </button>
    </div>
  );
}
