"use client";

import { useRouter } from "next/navigation";
import { type Locale } from "../i18n/dictionary";
import { LOCALE_COOKIE } from "../i18n/locale-cookie";
import { LocaleDropdown } from "../i18n/locale-dropdown";

export function AppLanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();

  function setLocale(next: Locale): void {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  return <LocaleDropdown value={locale} onSelect={setLocale} />;
}
