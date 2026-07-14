"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Brand = {
  id: string;
  name: string;
  status: "pending" | "extracting" | "done" | "failed";
  brandKit: {
    colors: { primary: string; secondary: string; background: string; text: string };
    copy: { tagline: string | null };
    services: string[];
    logo: { url: string; hasTransparency: boolean } | null;
  } | null;
};

type ReviewText = {
  extracting: string;
  failedTitle: string;
  failedBody: string;
  nameLabel: string;
  taglineLabel: string;
  servicesLabel: string;
  addService: string;
  removeService: string;
  logoLabel: string;
  save: string;
  saving: string;
  limitReached: string;
  upgradeCta: string;
  genericError: string;
};

const COLOR_ROLES = ["primary", "secondary", "background", "text"] as const;

export function ReviewForm({ brandId, mode, t }: { brandId: string; mode: "save" | "edit"; t: ReviewText }) {
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [polling, setPolling] = useState(true);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [genericError, setGenericError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll(): Promise<void> {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (cancelled) return;
        try {
          const response = await fetch(`/api/brands/${brandId}`);
          if (!response.ok) return;
          const { brand: fetched } = (await response.json()) as { brand: Brand };
          if (cancelled) return;

          setBrand(fetched);
          setName(fetched.name);
          setTagline(fetched.brandKit?.copy.tagline ?? "");
          setServices(fetched.brandKit?.services ?? []);
          setLogoUrl(fetched.brandKit?.logo?.url ?? "");

          if (fetched.status === "done" || fetched.status === "failed") {
            setPolling(false);
            return;
          }
        } catch {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setPolling(false);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  async function handleSave(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setLimitReached(false);
    setGenericError(false);

    try {
      const response = await fetch(mode === "save" ? `/api/brands/${brandId}/save` : `/api/brands/${brandId}`, {
        method: mode === "save" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tagline,
          services: services.map((s) => s.trim()).filter((s) => s.length > 0),
          logoUrl,
        }),
      });

      if (response.status === 409) {
        setLimitReached(true);
        return;
      }
      if (!response.ok) {
        setGenericError(true);
        return;
      }

      router.push(mode === "save" ? `/app/brands/${brandId}/generate` : "/app/brands");
    } catch {
      setGenericError(true);
    } finally {
      setSaving(false);
    }
  }

  if (polling) {
    return (
      <div className="flex items-center gap-3 text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        {t.extracting}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      {brand?.status === "failed" && (
        <div className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3">
          <p className="text-sm font-semibold text-danger">{t.failedTitle}</p>
          <p className="mt-1 text-sm text-danger/80">{t.failedBody}</p>
        </div>
      )}

      {brand?.brandKit && (
        <div className="flex gap-2">
          {COLOR_ROLES.map((role) => (
            <span
              key={role}
              className="h-8 w-8 rounded-full border border-border"
              style={{ backgroundColor: brand.brandKit?.colors[role] }}
              title={role}
            />
          ))}
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">{t.nameLabel}</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="rounded-pill border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">{t.taglineLabel}</span>
        <input
          value={tagline}
          onChange={(event) => setTagline(event.target.value)}
          className="rounded-pill border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">{t.servicesLabel}</span>
        {services.map((service, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={service}
              onChange={(event) => {
                const next = [...services];
                next[index] = event.target.value;
                setServices(next);
              }}
              className="flex-1 rounded-pill border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setServices(services.filter((_, j) => j !== index))}
              className="rounded-pill border border-border px-3 text-sm text-muted hover:text-danger"
            >
              {t.removeService}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setServices([...services, ""])}
          className="self-start rounded-pill border border-border px-4 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
        >
          {t.addService}
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">{t.logoLabel}</span>
        <input
          value={logoUrl}
          onChange={(event) => setLogoUrl(event.target.value)}
          type="url"
          className="rounded-pill border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
        />
        {logoUrl && (
          <img src={logoUrl} alt="" className="mt-2 h-16 w-16 rounded-md border border-border object-contain" />
        )}
      </label>

      {limitReached && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-danger/40 bg-danger/10 px-4 py-3">
          <p className="text-sm text-danger">{t.limitReached}</p>
          <Link href="/app/billing" className="shrink-0 rounded-pill bg-danger px-4 py-1.5 text-sm font-semibold text-white">
            {t.upgradeCta}
          </Link>
        </div>
      )}
      {genericError && <p className="text-sm text-danger">{t.genericError}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-pill bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
      >
        {saving ? t.saving : t.save}
      </button>
    </form>
  );
}
