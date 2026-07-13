"use client";

import Link from "next/link";
import { PLAN_LIMITS } from "@/src/entitlements/plans";
import { useLanguage } from "./i18n/language-context";
import { SiteNav } from "./site-nav";
import { UrlAnalyzer } from "./url-analyzer";
import { DemoCarousel } from "./demo-carousel";
import { DISPLAY_PLANS as PLANS } from "./plans-display";

function LandingContent() {
  const { t } = useLanguage();

  return (
    <>
      <SiteNav />
      <main className="relative overflow-hidden">
        <div
          aria-hidden
          className="glow-primary pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 blur-3xl"
        />

        <section className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center sm:pt-32">
          <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t.hero.badge}
          </span>

          <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            {t.hero.title1}
            <br />
            <span className="text-gradient">{t.hero.titleHighlight}</span> {t.hero.title2}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">{t.hero.subtitle}</p>

          <UrlAnalyzer />
        </section>

        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-10 text-center sm:grid-cols-4">
            {[
              { k: t.stats.time, v: t.stats.timeLabel },
              { k: t.stats.concepts, v: t.stats.conceptsLabel },
              { k: t.stats.formats, v: t.stats.formatsLabel },
              { k: t.stats.deterministic, v: t.stats.deterministicLabel },
            ].map((stat) => (
              <div key={stat.v}>
                <p className="font-display text-3xl font-bold text-primary">{stat.k}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted">{stat.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="comment-ca-marche" className="mx-auto max-w-6xl px-6 py-28">
          <div className="reveal text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.how.eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t.how.title}</h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {t.how.steps.map((step, i) => (
              <div key={step.title} className="reveal">
                <p className="font-display text-5xl font-bold text-border-strong">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="demos" className="py-4">
          <div className="reveal mx-auto max-w-3xl px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.demos.eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t.demos.title}</h2>
            <p className="mt-4 text-muted">{t.demos.subtitle}</p>
          </div>
          <div className="mt-4">
            <DemoCarousel />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-28">
          <div className="reveal rounded-card border border-border bg-surface p-8 sm:p-12">
            <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">{t.compare.title}</h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-card border border-border bg-background p-6">
                <p className="font-display font-semibold text-muted">{t.compare.ugcTitle}</p>
                <p className="mt-3 text-foreground">{t.compare.ugcBody}</p>
              </div>
              <div className="relative rounded-card border border-primary bg-background p-6">
                <span className="absolute -top-3 left-6 rounded-pill bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  ReelJolt
                </span>
                <p className="mt-2 font-display font-semibold text-primary">{t.compare.usTitle}</p>
                <p className="mt-3 text-foreground">{t.compare.usBody}</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.features.map((feature) => (
              <div key={feature.title} className="reveal card-hover rounded-card border border-border bg-surface p-6">
                <div className="h-8 w-8 rounded-md bg-primary/15" />
                <h3 className="mt-4 font-display font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

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
                      {limits.maxBrands === null
                        ? t.pricing.unlimitedBrands
                        : `${limits.maxBrands} ${t.pricing.brand}`}
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
                      plan.highlight
                        ? "bg-primary text-primary-foreground"
                        : "border border-border-strong text-foreground"
                    }`}
                  >
                    {t.pricing.choose} {plan.id}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-28">
          <div className="reveal text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.faq.eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t.faq.title}</h2>
          </div>
          <div className="mt-12 divide-y divide-border">
            {t.faq.items.map((item) => (
              <details key={item.q} className="reveal group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display font-semibold">
                  {item.q}
                  <span className="ml-4 text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-28">
          <div className="reveal relative overflow-hidden rounded-card border border-border bg-surface px-8 py-16 text-center">
            <div
              aria-hidden
              className="glow-secondary pointer-events-none absolute -bottom-32 left-1/2 h-72 w-72 -translate-x-1/2 blur-3xl"
            />
            <h2 className="relative font-display text-3xl font-bold sm:text-4xl">{t.finalCta.title}</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-muted">{t.finalCta.body}</p>
            <Link
              href="/sign-up"
              className="relative mt-8 inline-block rounded-pill bg-primary px-8 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              {t.finalCta.button}
            </Link>
          </div>
        </section>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted sm:flex-row">
            <p className="flex items-center gap-2 font-display font-semibold text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                R
              </span>
              ReelJolt
            </p>
            <p>
              &copy; {new Date().getFullYear()} ReelJolt. {t.footer.rights}
            </p>
            <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground">
              {t.footer.signIn}
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}

export default function LandingPage() {
  return <LandingContent />;
}
