"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddBusinessForm({
  placeholder,
  addLabel,
  genericErrorLabel,
}: {
  placeholder: string;
  addLabel: string;
  genericErrorLabel: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [genericError, setGenericError] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setGenericError(false);

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        setGenericError(true);
        return;
      }

      // This only ever runs an extraction — it isn't counted against the
      // plan's business limit until the review form's explicit save, which
      // is where the limit is actually enforced.
      const { id } = (await response.json()) as { id: string };
      router.push(`/app/brands/${id}/review`);
    } catch {
      setGenericError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded-pill border border-border-strong bg-surface p-2 shadow-[0_20px_60px_-25px_rgb(0_0_0/0.7)] sm:flex-row"
      >
        <input
          type="url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-pill bg-transparent px-5 py-3 text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-pill bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {submitting ? "..." : addLabel}
        </button>
      </form>

      {genericError && <p className="mt-3 text-sm text-danger">{genericErrorLabel}</p>}
    </div>
  );
}
