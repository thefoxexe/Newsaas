import type { LogoCandidate } from "./page-signals";

export type Logo = {
  url: string;
  hasTransparency: boolean;
};

const TRANSPARENT_EXTENSIONS = [".svg", ".png", ".webp"];

// File extension is a cheap proxy for "has an alpha channel" — good enough
// to decide V1 layout defaults, not a substitute for actually decoding the
// image. A JPEG can't be transparent; a PNG usually carries transparency
// for a logo asset.
function guessHasTransparency(url: string): boolean {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  return TRANSPARENT_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export function pickLogo(
  iconHrefs: string[],
  ogImage: string | null,
  headerCandidates: LogoCandidate[],
): Logo | null {
  const bestIcon = iconHrefs[0];
  if (bestIcon !== undefined) {
    return { url: bestIcon, hasTransparency: guessHasTransparency(bestIcon) };
  }

  if (ogImage !== null) {
    return { url: ogImage, hasTransparency: guessHasTransparency(ogImage) };
  }

  const headerLogo = headerCandidates.find(
    (candidate) =>
      candidate.src.toLowerCase().includes("logo") || candidate.alt.toLowerCase().includes("logo"),
  );

  return headerLogo ? { url: headerLogo.src, hasTransparency: guessHasTransparency(headerLogo.src) } : null;
}
