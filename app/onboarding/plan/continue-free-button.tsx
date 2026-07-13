"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ContinueFreeButton({ label }: { label: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick(): Promise<void> {
    setSubmitting(true);
    await fetch("/api/onboarding/choose-free", { method: "POST" });
    router.push("/app");
  }

  return (
    <button
      onClick={handleClick}
      disabled={submitting}
      className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground disabled:opacity-50"
    >
      {submitting ? "..." : label}
    </button>
  );
}
