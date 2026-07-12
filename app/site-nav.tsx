"use client";

import Link from "next/link";
import { LOCALES, LOCALE_LABELS } from "./i18n/dictionary";
import { useLanguage } from "./i18n/language-context";

export function SiteNav() {
  const { locale, setLocale, t } = useLanguage();

  const links = [
    { href: "#demos", label: t.nav.demos },
    { href: "#comment-ca-marche", label: t.nav.how },
    { href: "#tarifs", label: t.nav.pricing },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            R
          </span>
          ReelJolt
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-pill border border-border p-0.5 text-xs font-semibold text-muted">
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={`rounded-pill px-2 py-1 transition-colors ${
                  locale === code ? "bg-primary text-primary-foreground" : "hover:text-foreground"
                }`}
              >
                {LOCALE_LABELS[code]}
              </button>
            ))}
          </div>
          <Link href="/sign-in" className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:block">
            {t.nav.signIn}
          </Link>
          <Link
            href="/sign-up"
            className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            {t.nav.cta}
          </Link>
        </div>
      </div>
    </header>
  );
}
