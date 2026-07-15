"use client";

import Link from "next/link";
import { PLAN_LIMITS } from "@/src/entitlements/plans";
import { useLanguage } from "./i18n/language-context";
import { DISPLAY_PLANS as PLANS } from "./plans-display";

export function PricingSection() {
  const { t } = useLanguage();

  return (
    <section id="tarifs" className="mx-auto max-w-6xl px-6 py-28">
      <div className="reveal text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.pricing.eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t.pricing.title}</h2>
        <p className="mt-4 text-muted">{t.pricing.subtitle}</p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const limits = PLAN_LIMITS[plan.id];
          return (
            <div
              key={plan.id}
              className={`reveal card-hover relative flex flex-col rounded-card border p-8 ${
                plan.highlight ? "border-primary bg-surface-elevated" : "border-border bg-surface"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {t.pricing.popular}
                </span>
              )}
              <p className="text-sm uppercase tracking-wide text-muted">{plan.id}</p>
              <p className="mt-1 text-sm text-muted">{t.pricing.taglines[plan.id]}</p>
              <p className="mt-6 font-display text-4xl font-bold">
                ${plan.price}
                <span className="text-base font-normal text-muted"> {t.pricing.perMonth}</span>
              </p>
              <ul className="mt-8 flex-1 space-y-3 text-sm text-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {limits.creditsPerPeriod} {t.pricing.videosPerMonth}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {limits.maxBrands === null ? t.pricing.unlimitedBrands : `${limits.maxBrands} ${t.pricing.brand}`}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {limits.watermark ? t.pricing.withWatermark : t.pricing.noWatermark}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t.pricing.resolution} {limits.maxResolution}
                </li>
              </ul>
              <Link
                href="/sign-up"
                className={`mt-8 block rounded-pill px-4 py-3 text-center font-semibold transition-transform hover:scale-[1.02] ${
                  plan.highlight ? "bg-primary text-primary-foreground" : "border border-border-strong text-foreground"
                }`}
              >
                {t.pricing.choose} {plan.id}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
