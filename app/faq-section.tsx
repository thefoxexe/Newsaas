"use client";

import { useLanguage } from "./i18n/language-context";

export function FaqSection() {
  const { t } = useLanguage();

  return (
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
  );
}
