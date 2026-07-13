import { cookies } from "next/headers";
import { LOCALES, DICTIONARY, type Locale } from "@/app/i18n/dictionary";
import { LOCALE_COOKIE } from "@/app/i18n/locale-cookie";

export { LOCALE_COOKIE };

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : "en";
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: DICTIONARY[locale] };
}
