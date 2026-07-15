"use client";

import { LocaleDropdown } from "./i18n/locale-dropdown";
import { useLanguage } from "./i18n/language-context";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLanguage();
  return <LocaleDropdown value={locale} onSelect={setLocale} />;
}
