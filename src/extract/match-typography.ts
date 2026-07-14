import { GOOGLE_FONTS_CATALOG } from "./google-fonts-catalog";

export type TypographyResult = {
  headingFamily: string;
  bodyFamily: string;
  googleFontMatch: string | null;
  fallbackStack: string;
};

const DEFAULT_FALLBACK_STACK = "system-ui, -apple-system, sans-serif";

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function majorityVote(values: string[], fallback: string): string {
  if (values.length === 0) {
    return fallback;
  }

  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let winner = values[0] as string;
  let winnerCount = 0;
  for (const [value, count] of counts) {
    if (count > winnerCount) {
      winner = value;
      winnerCount = count;
    }
  }

  return winner;
}

export function matchGoogleFont(familyName: string): string | null {
  const normalized = normalize(familyName);
  return GOOGLE_FONTS_CATALOG.find((entry) => normalize(entry) === normalized) ?? null;
}

export function matchTypography(headingFamilies: string[], bodyFamilies: string[]): TypographyResult {
  const headingFamily = majorityVote(headingFamilies, "sans-serif");
  const bodyFamily = majorityVote(bodyFamilies, "sans-serif");

  return {
    headingFamily,
    bodyFamily,
    googleFontMatch: matchGoogleFont(headingFamily),
    fallbackStack: DEFAULT_FALLBACK_STACK,
  };
}
