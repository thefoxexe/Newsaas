"use client";

import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "../i18n/dictionary";
import { LOCALE_COOKIE } from "../i18n/locale-cookie";

export function AppLanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();

  function setLocale(next: Locale): void {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
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
  );
}
