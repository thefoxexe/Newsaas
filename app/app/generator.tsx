"use client";

import { useEffect, useState } from "react";
import type { Locale } from "../i18n/dictionary";
import { DICTIONARY } from "../i18n/dictionary";

type Brand = {
  id: string;
  name: string;
  status: "pending" | "extracting" | "done" | "failed";
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
};

const FORMATS = ["9:16", "1:1", "16:9"] as const;

type GeneratorText = (typeof DICTIONARY)[Locale]["generator"];

export function Generator({ initialBrandId, t }: { initialBrandId: string | null; t: GeneratorText }) {
  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [generating, setGenerating] = useState(false);
  const [renders, setRenders] = useState<Record<string, RenderJob>>({});
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [conceptsError, setConceptsError] = useState(false);

  useEffect(() => {
    if (initialBrandId) {
      void pollBrand(initialBrandId);
    }
  }, [initialBrandId]);

  async function pollBrand(id: string): Promise<void> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await fetch(`/api/brands/${id}`);
      if (!response.ok) return;
      const { brand: fetched } = (await response.json()) as { brand: Brand };
      setBrand(fetched);
      if (fetched.status === "done" || fetched.status === "failed") return;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  async function submitUrl(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setBrand(null);
    setConcepts([]);
    setQuotaError(null);

    const response = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) return;

    const { id } = (await response.json()) as { id: string };
    await pollBrand(id);
  }

  async function generateConcepts(): Promise<void> {
    if (!brand) return;
    setGenerating(true);
    setConceptsError(false);
    const response = await fetch(`/api/brands/${brand.id}/concepts`, { method: "POST" });
    setGenerating(false);
    if (!response.ok) {
      setConceptsError(true);
      return;
    }
    const data = (await response.json()) as { concepts: Concept[] };
    setConcepts(data.concepts);
  }

  async function launchRender(conceptId: string, format: (typeof FORMATS)[number]): Promise<void> {
    setQuotaError(null);
    const response = await fetch("/api/renders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conceptId, format }),
    });

    if (!response.ok) {
      setQuotaError(t.quotaAlert);
      return;
    }

    const { id } = (await response.json()) as { id: string };
    setRenders((prev) => ({ ...prev, [conceptId]: { id, status: "queued", outputUrl: null, errorCode: null } }));
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

  return (
    <div>
      <form
        onSubmit={submitUrl}
        className="flex flex-col gap-2 rounded-pill border border-border-strong bg-surface p-2 shadow-[0_20px_60px_-25px_rgb(0_0_0/0.7)] sm:flex-row"
      >
        <input
          type="url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={t.inputPlaceholder}
          className="flex-1 rounded-pill bg-transparent px-5 py-3 text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="rounded-pill bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          {t.analyze}
        </button>
      </form>

      {brand && (brand.status === "pending" || brand.status === "extracting") && (
        <div className="mt-6 flex items-center gap-3 text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          {t.extracting}
        </div>
      )}

      {brand?.status === "failed" && <p className="mt-6 text-danger">{t.failed}</p>}

      {quotaError && (
        <p className="mt-6 rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {quotaError}
        </p>
      )}

      {brand?.status === "done" && brand.brandKit && (
        <div className="mt-8">
          <div className="reveal rounded-card border border-border bg-surface p-6">
            <p className="text-sm text-muted">
              {t.brandKitLabel} — {brand.name}
            </p>
            <div className="mt-3 flex gap-2">
              {Object.entries(brand.brandKit.colors).map(([role, color]) => (
                <span
                  key={role}
                  className="h-10 w-10 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                  title={`${role}: ${color}`}
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
                {conceptsError && <p className="mt-2 text-sm text-danger">{t.conceptsError}</p>}
              </div>
            )}
          </div>

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
                        {t.renderPending}
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
      )}
    </div>
  );
}
