"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./i18n/language-context";

export function UrlAnalyzer() {
  const { t } = useLanguage();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(false);

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        setSubmitError(true);
        return;
      }

      const { id } = (await response.json()) as { id: string };
      window.localStorage.setItem("reeljolt:pending-brand-id", id);
      router.push("/sign-up");
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-xl flex-col gap-2 rounded-pill border border-border-strong bg-surface p-2 shadow-[0_20px_60px_-25px_rgb(0_0_0/0.7)] sm:flex-row"
      >
        <input
          type="url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={t.hero.inputPlaceholder}
          className="flex-1 rounded-pill bg-transparent px-5 py-3 text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-pill bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {submitting ? t.hero.inputSubmitting : t.hero.inputSubmit}
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-muted">{t.hero.inputHint}</p>

      {submitError && (
        <p className="mx-auto mt-4 max-w-xl rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-center text-sm text-danger">
          {t.hero.submitError}
        </p>
      )}
    </div>
  );
}
