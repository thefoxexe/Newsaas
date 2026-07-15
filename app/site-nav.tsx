"use client";

import Link from "next/link";
import { useLanguage } from "./i18n/language-context";
import { LocaleSwitcher } from "./locale-switcher";
import { LandingMobileNav } from "./landing-mobile-nav";

export function SiteNav() {
  const { t } = useLanguage();

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
          <LocaleSwitcher />
          <Link href="/sign-in" className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:block">
            {t.nav.signIn}
          </Link>
          {/* Hidden below sm: at narrow phone widths there isn't room for
              logo + locale dropdown + this button + hamburger on one row,
              and longer translations (French/German) wrap inside the pill
              instead of fitting on one line. The mobile menu below already
              has its own full-width CTA, so nothing is lost. */}
          <Link
            href="/sign-up"
            className="hidden rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] sm:block"
          >
            {t.nav.cta}
          </Link>
          <LandingMobileNav
            items={links}
            signInLabel={t.nav.signIn}
            signInHref="/sign-in"
            ctaLabel={t.nav.cta}
            ctaHref="/sign-up"
          />
        </div>
      </div>
    </header>
  );
}
