"use client";

import Link from "next/link";
import { useLanguage } from "./i18n/language-context";

export function FinalCtaSection() {
  const { t } = useLanguage();

  return (
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
  );
}
