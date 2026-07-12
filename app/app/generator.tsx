"use client";

import { useEffect, useState } from "react";

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

export function Generator({ initialBrandId }: { initialBrandId: string | null }) {
  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [generating, setGenerating] = useState(false);
  const [renders, setRenders] = useState<Record<string, RenderJob>>({});

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
    const response = await fetch(`/api/brands/${brand.id}/concepts`, { method: "POST" });
    setGenerating(false);
    if (!response.ok) return;
    const data = (await response.json()) as { concepts: Concept[] };
    setConcepts(data.concepts);
  }

  async function launchRender(conceptId: string, format: (typeof FORMATS)[number]): Promise<void> {
    const response = await fetch("/api/renders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conceptId, format }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      window.alert(body.message ?? "Impossible de lancer ce rendu (quota atteint ?)");
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
      <form onSubmit={submitUrl} className="flex gap-2">
        <input
          type="url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://ta-boutique.com"
          className="flex-1 rounded-pill border border-border bg-surface px-5 py-3 outline-none focus:border-primary"
        />
        <button type="submit" className="rounded-pill bg-primary px-6 py-3 font-semibold text-primary-foreground">
          Analyser
        </button>
      </form>

      {brand && (brand.status === "pending" || brand.status === "extracting") && (
        <p className="mt-6 text-muted">Analyse de {brand.name} en cours...</p>
      )}

      {brand?.status === "failed" && <p className="mt-6 text-danger">L&apos;analyse a échoué pour {brand.name}.</p>}

      {brand?.status === "done" && brand.brandKit && (
        <div className="mt-8">
          <div className="rounded-card border border-border bg-surface p-6">
            <p className="text-sm text-muted">Direction artistique — {brand.name}</p>
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
            {concepts.length === 0 && (
              <button
                onClick={generateConcepts}
                disabled={generating}
                className="mt-4 rounded-pill bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {generating ? "Génération..." : "Générer 5 concepts"}
              </button>
            )}
          </div>

          {concepts.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {concepts.map((concept) => {
                const render = renders[concept.id];
                return (
                  <div key={concept.id} className="rounded-card border border-border bg-surface p-5">
                    <p className="text-xs uppercase tracking-wide text-muted">{concept.angle}</p>
                    <p className="mt-1 font-bold">{concept.hook}</p>
                    <p className="mt-1 text-sm text-muted">{concept.body.join(" · ")}</p>
                    <p className="mt-2 text-sm font-semibold text-primary">{concept.cta}</p>

                    {!render && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {FORMATS.map((format) => (
                          <button
                            key={format}
                            onClick={() => launchRender(concept.id, format)}
                            className="rounded-pill border border-border px-3 py-1 text-sm"
                          >
                            {format}
                          </button>
                        ))}
                      </div>
                    )}

                    {render && (render.status === "queued" || render.status === "rendering") && (
                      <p className="mt-4 text-sm text-muted">Rendu en cours...</p>
                    )}

                    {render?.status === "failed" && <p className="mt-4 text-sm text-danger">Le rendu a échoué.</p>}

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
