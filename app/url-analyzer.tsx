"use client";

import { useState } from "react";
import Link from "next/link";

type BrandPreview = {
  status: "pending" | "extracting" | "done" | "failed";
  name: string;
  brandKit: {
    colors: { primary: string; secondary: string; background: string; text: string };
    typography: { headingFamily: string };
    copy: { tagline: string | null };
  } | null;
};

async function pollBrand(id: string, onUpdate: (brand: BrandPreview) => void): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(`/api/brands/${id}`);
    if (!response.ok) return;
    const { brand } = (await response.json()) as { brand: BrandPreview };
    onUpdate(brand);
    if (brand.status === "done" || brand.status === "failed") return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

export function UrlAnalyzer() {
  const [url, setUrl] = useState("");
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setBrand(null);

    const response = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    setSubmitting(false);
    if (!response.ok) return;

    const { id } = (await response.json()) as { id: string };
    setBrandId(id);
    window.localStorage.setItem("reeljolt:pending-brand-id", id);
    void pollBrand(id, setBrand);
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
          placeholder="https://ta-boutique.com"
          className="flex-1 rounded-pill bg-transparent px-5 py-3 text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-pill bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {submitting ? "Analyse..." : "Analyser gratuitement"}
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-muted">Aucune carte bancaire requise · résultat en quelques secondes</p>

      {brandId && (
        <div className="mx-auto mt-6 max-w-xl rounded-card border border-border bg-surface p-6 text-left">
          {!brand || brand.status === "pending" || brand.status === "extracting" ? (
            <div className="flex items-center gap-3 text-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Analyse de la direction artistique en cours...
            </div>
          ) : brand.status === "failed" ? (
            <p className="text-danger">
              On n&apos;a pas réussi à analyser ce site. Réessaie avec une autre URL, ou crée un compte pour corriger
              la DA à la main.
            </p>
          ) : (
            brand.brandKit && (
              <>
                <p className="text-sm text-muted">Direction artistique détectée pour {brand.name}</p>
                <div className="mt-3 flex gap-2">
                  {[brand.brandKit.colors.primary, brand.brandKit.colors.secondary, brand.brandKit.colors.background].map(
                    (color) => (
                      <span
                        key={color}
                        className="h-8 w-8 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ),
                  )}
                </div>
                <p className="mt-3 text-foreground">
                  {brand.brandKit.copy.tagline ?? "Positionnement détecté, prêt à générer."}
                </p>
                <Link
                  href="/sign-up"
                  className="mt-4 inline-block rounded-pill bg-primary px-5 py-2 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  Voir mes 5 pubs — créer un compte
                </Link>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
