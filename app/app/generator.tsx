"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "../i18n/dictionary";
import { DICTIONARY } from "../i18n/dictionary";

type Brand = {
  id: string;
  name: string;
  brandKit: {
    colors: { primary: string; secondary: string; background: string; text: string };
    copy: { tagline: string | null };
  } | null;
};

type Concept = {
  id: string;
  angle: string;
  hook: string;
  body: string[];
  cta: string;
};

type RenderJob = {
  id: string;
  status: "queued" | "rendering" | "done" | "failed";
  outputUrl: string | null;
  errorCode: string | null;
  progress: number;
};

const FORMATS = ["9:16", "1:1", "16:9"] as const;
const COLOR_ROLES = ["primary", "secondary", "background", "text"] as const;

type GeneratorText = (typeof DICTIONARY)[Locale]["generator"];

// The generator is always scoped to a specific, already-saved brand now
// (see app/app/brands/[id]/generate/page.tsx) — there's no URL-to-analyze
// form here anymore, that lives on the Brands / review pages instead.
export function Generator({ brandId, t }: { brandId: string; t: GeneratorText }) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [generating, setGenerating] = useState(false);
  const [renders, setRenders] = useState<Record<string, RenderJob>>({});
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [conceptsError, setConceptsError] = useState(false);
  const [conceptsErrorDetail, setConceptsErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/brands/${brandId}`)
      .then(async (response) => {
        if (!response.ok) {
          if (!cancelled) setLoadError(true);
          return;
        }
        const { brand: fetched } = (await response.json()) as { brand: Brand };
        if (!cancelled) setBrand(fetched);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  async function generateConcepts(): Promise<void> {
    setGenerating(true);
    setConceptsError(false);
    setConceptsErrorDetail(null);

    try {
      const response = await fetch(`/api/brands/${brandId}/concepts`, { method: "POST" });
      if (!response.ok) {
        setConceptsError(true);
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setConceptsErrorDetail(body?.error ?? null);
        return;
      }
      const data = (await response.json()) as { concepts: Concept[] };
      setConcepts(data.concepts);
    } catch {
      setConceptsError(true);
    } finally {
      setGenerating(false);
    }
  }

  async function launchRender(conceptId: string, format: (typeof FORMATS)[number]): Promise<void> {
    setQuotaError(null);
    const response = await fetch("/api/renders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conceptId, format }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setQuotaError(body?.error === "queue_full" ? t.queueFull : t.quotaAlert);
      return;
    }

    const { id } = (await response.json()) as { id: string };
    setRenders((prev) => ({
      ...prev,
      [conceptId]: { id, status: "queued", outputUrl: null, errorCode: null, progress: 0 },
    }));
    void pollRender(conceptId, id);
  }

  async function pollRender(conceptId: string, renderId: string): Promise<void> {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const response = await fetch(`/api/renders/${renderId}`);
      if (!response.ok) return;
      const { render } = (await response.json()) as { render: RenderJob };
      setRenders((prev) => ({ ...prev, [conceptId]: render }));
      if (render.status === "done" || render.status === "failed") return;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (loadError) {
    return <p className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{t.submitError}</p>;
  }

  if (!brand?.brandKit) {
    return (
      <div className="flex items-center gap-3 text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        {t.extracting}
      </div>
    );
  }

  return (
    <div>
      <div className="reveal rounded-card border border-border bg-surface p-6">
        <p className="text-sm text-muted">
          {t.brandKitLabel} — {brand.name}
        </p>
        <div className="mt-3 flex gap-2">
          {COLOR_ROLES.map((role) => (
            <span
              key={role}
              className="h-10 w-10 rounded-full border border-border"
              style={{ backgroundColor: brand.brandKit?.colors[role] }}
              title={role}
            />
          ))}
        </div>
        {brand.brandKit.copy.tagline && <p className="mt-3 text-foreground">{brand.brandKit.copy.tagline}</p>}

        {concepts.length === 0 && (
          <div className="mt-5">
            <button
              onClick={generateConcepts}
              disabled={generating}
              className="rounded-pill bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {generating ? t.generatingConcepts : conceptsError ? t.retry : t.generateConcepts}
            </button>
            {conceptsError && (
              <div className="mt-2">
                <p className="text-sm text-danger">{t.conceptsError}</p>
                {conceptsErrorDetail && <p className="mt-1 font-mono text-xs text-danger/70">{conceptsErrorDetail}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="reveal mt-6 rounded-card border border-border bg-surface/60 p-6 opacity-60">
        <span className="rounded-pill bg-border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted">
          {t.customPromptBadge}
        </span>
        <textarea
          disabled
          placeholder={t.customPromptPlaceholder}
          rows={2}
          className="mt-3 w-full resize-none rounded-card border border-border bg-transparent px-4 py-3 text-sm text-muted outline-none placeholder:text-muted"
        />
        <button
          disabled
          className="mt-3 cursor-not-allowed rounded-pill border border-border px-5 py-2 text-sm font-semibold text-muted"
        >
          {t.customPromptButton}
        </button>
      </div>

      {quotaError && (
        <p className="mt-6 rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{quotaError}</p>
      )}

      {concepts.length > 0 && (
        <div className="reveal mt-6 flex flex-col items-start justify-between gap-4 rounded-card border border-primary/40 bg-primary/10 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-bold">{t.onboardingTitle}</p>
            <p className="mt-1 text-sm text-muted">{t.onboardingBody}</p>
          </div>
          <Link
            href="/app/billing"
            className="shrink-0 whitespace-nowrap rounded-pill bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            {t.onboardingCta}
          </Link>
        </div>
      )}

      {concepts.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {concepts.map((concept) => {
            const render = renders[concept.id];
            return (
              <div key={concept.id} className="card-hover rounded-card border border-border bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{concept.angle}</p>
                <p className="mt-2 font-display text-lg font-bold">{concept.hook}</p>
                <p className="mt-1 text-sm text-muted">{concept.body.join(" · ")}</p>
                <p className="mt-2 text-sm font-semibold text-primary">{concept.cta}</p>

                {!render && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {FORMATS.map((format) => (
                      <button
                        key={format}
                        onClick={() => launchRender(concept.id, format)}
                        className="rounded-pill border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                )}

                {render && (render.status === "queued" || render.status === "rendering") && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    {render.status === "rendering" ? `${t.renderPending} ${render.progress}%` : t.renderPending}
                  </div>
                )}

                {render?.status === "failed" && <p className="mt-4 text-sm text-danger">{t.renderFailed}</p>}

                {render?.status === "done" && render.outputUrl && (
                  <video src={render.outputUrl} controls className="mt-4 w-full rounded-card" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
