"use client";

import Link from "next/link";
import { useLanguage } from "./i18n/language-context";

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted sm:flex-row">
        <p className="flex items-center gap-2 font-display font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">R</span>
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
  );
}
