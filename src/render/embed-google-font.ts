// Fetches a real Google Font file and returns it as a self-contained,
// base64-embedded @font-face CSS block — so the rendered HTML never depends
// on a live network fetch happening *inside* Chromium during render (the one
// I/O boundary is this Node-side fetch, done once and cached; the resulting
// HTML string is fully self-contained from then on, matching how everything
// else in this pipeline is inlined). Never throws: a font-embedding failure
// falls back to the existing generic-fallback-stack behavior for that brand,
// it must never break a render.
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 5000;

// Keyed by promise (not resolved value) so concurrent renders for the same
// brand — the worker now runs up to 2 renders at once, see src/worker.ts —
// de-duplicate into a single in-flight fetch instead of racing each other.
const cache = new Map<string, Promise<string | null>>();

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers: { "User-Agent": CHROME_UA }, signal: controller.signal });
    return response.ok ? response : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Google returns one @font-face block per Unicode subset (devanagari,
// latin-ext, latin, ...) for a single requested weight — verified live that
// the plain "latin" subset is always last, and its range (U+0000-00FF etc.)
// already covers the accented French/German characters this app needs
// (é, à, ç, ä, ö, ü, ß), so there's no need to embed the other subsets.
export function extractLastFontFaceUrl(css: string): string | null {
  const blocks = css.split("@font-face");
  const lastBlock = blocks[blocks.length - 1];
  if (!lastBlock) return null;

  const match = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/.exec(lastBlock);
  return match?.[1] ?? null;
}

async function fetchImpl(family: string, weights: number[]): Promise<string | null> {
  for (const weight of weights) {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
    const cssResponse = await fetchWithTimeout(cssUrl);
    if (!cssResponse) continue;

    const fontUrl = extractLastFontFaceUrl(await cssResponse.text());
    if (!fontUrl) continue;

    const fontResponse = await fetchWithTimeout(fontUrl);
    if (!fontResponse) continue;

    const bytes = Buffer.from(await fontResponse.arrayBuffer());
    const base64 = bytes.toString("base64");
    const lowWeight = Math.min(weight, 400);

    return `@font-face { font-family: '${family}'; font-style: normal; font-weight: ${lowWeight} ${weight}; font-display: swap; src: url(data:font/woff2;base64,${base64}) format('woff2'); }`;
  }

  return null;
}

export function fetchEmbeddableFontFace(family: string | null, weights: number[]): Promise<string | null> {
  if (!family) return Promise.resolve(null);

  const cacheKey = `${family}:${weights.join(",")}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const promise = fetchImpl(family, weights).catch(() => null);
  cache.set(cacheKey, promise);
  return promise;
}
