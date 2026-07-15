"use client";

import { useState } from "react";
import Link from "next/link";

// The public landing nav's anchor links (#demos etc.) disappear below the
// md breakpoint with nothing to replace them — this fills that gap,
// modeled on app/app/mobile-nav.tsx's hamburger + slide-down panel, but
// with hash-anchor links instead of route Links since these are same-page
// scroll targets, not separate pages.
export function LandingMobileNav({
  items,
  signInLabel,
  signInHref,
  ctaLabel,
  ctaHref,
}: {
  items: Array<{ href: string; label: string }>;
  signInLabel: string;
  signInHref: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-pill border border-border text-foreground"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <nav className="fixed inset-x-0 top-[65px] z-40 border-b border-border bg-background px-6 py-4 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.8)]">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-card px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            <Link
              href={signInHref}
              onClick={() => setOpen(false)}
              className="block rounded-card px-4 py-3 text-center text-base font-semibold text-foreground transition-colors hover:bg-surface"
            >
              {signInLabel}
            </Link>
            <Link
              href={ctaHref}
              onClick={() => setOpen(false)}
              className="block rounded-pill bg-primary px-4 py-3 text-center text-base font-semibold text-primary-foreground"
            >
              {ctaLabel}
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
