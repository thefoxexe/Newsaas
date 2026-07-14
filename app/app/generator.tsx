"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

type TemplateId = "kinetic-type" | "product-reveal" | "review-slam";

type Concept = {
  id: string;
  angle: string;
  hook: string;
  body: string[];
  cta: string;
  templateId: TemplateId;
  productImageIndex: number | null;
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

// Static, generic previews (placeholder AA/BB text, neutral colors) so the
// picker shows the actual layout/animation choreography of each design
// without implying real brand colors — those only apply at real render
// time. As more templates ship, add an entry here and drop its preview
// PNG in public/template-previews/.
const TEMPLATES: Array<{ id: TemplateId; previewSrc: string }> = [
  { id: "kinetic-type", previewSrc: "/template-previews/kinetic-type.png" },
  { id: "product-reveal", previewSrc: "/template-previews/product-reveal.png" },
  { id: "review-slam", previewSrc: "/template-previews/review-slam.png" },
];

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
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);

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

  async function launchRender(
    conceptId: string,
    templateId: TemplateId,
    format: (typeof FORMATS)[number],
  ): Promise<void> {
    setQuotaError(null);
    const response = await fetch("/api/renders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conceptId, templateId, format }),
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

  const activeConcept = concepts.find((c) => c.id === activeConceptId) ?? null;

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

      <div className="reveal relative mt-6 overflow-hidden rounded-card border border-primary/25 bg-gradient-to-br from-primary/10 via-surface to-surface p-6">
        <div aria-hidden className="glow-primary pointer-events-none absolute -right-12 -top-16 h-40 w-40 opacity-30 blur-2xl" />

        <span className="relative inline-flex items-center gap-1.5 rounded-pill bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
          <span aria-hidden>✨</span>
          {t.customPromptBadge}
        </span>
        <textarea
          disabled
          placeholder={t.customPromptPlaceholder}
          rows={2}
          className="relative mt-4 w-full resize-none rounded-card border border-border-strong bg-background/40 px-4 py-3 text-sm text-foreground/70 outline-none placeholder:text-muted"
        />
        <button
          disabled
          className="relative mt-3 cursor-not-allowed rounded-pill border border-primary/40 px-5 py-2 text-sm font-semibold text-primary/70"
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
            href="/app/settings"
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
                  <div className="mt-4">
                    <button
                      onClick={() => setActiveConceptId(concept.id)}
                      className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                    >
                      {t.templatePicker.next}
                    </button>
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

      {activeConcept && (
        <GenerationModal
          concept={activeConcept}
          t={t}
          onClose={() => setActiveConceptId(null)}
          onSubmit={async (templateId, format) => {
            setActiveConceptId(null);
            await launchRender(activeConcept.id, templateId, format);
          }}
        />
      )}
    </div>
  );
}

function GenerationModal({
  concept,
  t,
  onClose,
  onSubmit,
}: {
  concept: Concept;
  t: GeneratorText;
  onClose: () => void;
  onSubmit: (templateId: TemplateId, format: (typeof FORMATS)[number]) => void;
}) {
  const [step, setStep] = useState<"template" | "format">("template");
  // Falls back to kinetic-type instead of preselecting a disabled card in
  // the (should-be-impossible-post-generation-validation, but not
  // DB-enforced) case of a product-reveal concept with no product.
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(
    concept.templateId === "product-reveal" && concept.productImageIndex === null ? "kinetic-type" : concept.templateId,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{concept.angle}</p>
            <p className="mt-1 font-display text-lg font-bold">
              {step === "template" ? t.templatePicker.chooseTemplate : t.templatePicker.chooseFormat}
            </p>
          </div>
          <button onClick={onClose} aria-label={t.templatePicker.close} className="text-muted hover:text-foreground">
            ✕
          </button>
        </div>

        {step === "template" && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TEMPLATES.map((template) => {
              const disabled = template.id === "product-reveal" && concept.productImageIndex === null;
              const recommended = template.id === concept.templateId;
              const selected = template.id === selectedTemplateId;
              return (
                <button
                  key={template.id}
                  disabled={disabled}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`relative overflow-hidden rounded-card border p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-border-strong"
                  }`}
                >
                  {recommended && !disabled && (
                    <span className="absolute left-3 top-3 z-10 rounded-pill bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      {t.templatePicker.recommended}
                    </span>
                  )}
                  <div className="relative aspect-[9/16] w-full overflow-hidden rounded-md bg-background">
                    <Image
                      src={template.previewSrc}
                      alt={t.templatePicker.names[template.id]}
                      fill
                      sizes="(max-width: 640px) 90vw, 220px"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold">{t.templatePicker.names[template.id]}</p>
                  <p className="mt-0.5 text-xs text-muted">{t.templatePicker.descriptions[template.id]}</p>
                  {disabled && <p className="mt-1 text-xs text-danger">{t.templatePicker.needsProduct}</p>}
                </button>
              );
            })}
          </div>
        )}

        {step === "format" && (
          <div className="mt-6 flex flex-wrap gap-3">
            {FORMATS.map((format) => (
              <button
                key={format}
                onClick={() => onSubmit(selectedTemplateId, format)}
                className="rounded-pill border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
              >
                {format}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          {step === "format" ? (
            <button onClick={() => setStep("template")} className="text-sm text-muted hover:text-foreground">
              {t.templatePicker.back}
            </button>
          ) : (
            <span />
          )}
          {step === "template" && (
            <button
              onClick={() => setStep("format")}
              className="rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              {t.templatePicker.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
