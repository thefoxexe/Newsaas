import { chromium } from "playwright";
import type { ColorSample, LogoCandidate, RawPageSignals } from "./page-signals";
import { ExtractionNavigationError, ExtractionTimeoutError } from "./errors";

export interface PageAnalyzer {
  analyze(url: string): Promise<RawPageSignals>;
}

const TOTAL_BUDGET_MS = 28_000;
const DOM_CONTENT_LOADED_TIMEOUT_MS = 20_000;
const NETWORK_IDLE_TIMEOUT_MS = 4_000;
const SETTLE_MS = 500;
const MAX_SCANNED_ELEMENTS = 3000;

// Playwright's default Chromium UA/fingerprint gets flagged as a bot by
// basic anti-scraping checks on a lot of real commercial sites (Cloudflare,
// PerimeterX, etc.), which is the most common real-world cause of a
// navigation timeout/failure here — not a bug in this code, but worth
// looking as close to a normal desktop Chrome visit as possible since we're
// only ever fetching a site's own public marketing page, the same thing a
// link-preview or SEO crawler does.
const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

type BrowserSignals = Omit<RawPageSignals, "sourceUrl">;

export class PlaywrightPageAnalyzer implements PageAnalyzer {
  private readonly executablePath: string | undefined;

  constructor(executablePath = process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"]) {
    this.executablePath = executablePath;
  }

  async analyze(url: string): Promise<RawPageSignals> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ExtractionTimeoutError(url, TOTAL_BUDGET_MS)), TOTAL_BUDGET_MS);
    });

    return Promise.race([this.run(url), timeout]);
  }

  private async run(url: string): Promise<RawPageSignals> {
    const browser = await chromium.launch({
      ...(this.executablePath === undefined ? {} : { executablePath: this.executablePath }),
      args: ["--disable-blink-features=AutomationControlled"],
    });

    try {
      const page = await browser.newPage({ userAgent: DESKTOP_USER_AGENT });

      // Basic headless-detection evasion: many real sites check
      // navigator.webdriver and refuse to render for anything that reports
      // true, which otherwise shows up here as a navigation timeout with no
      // indication of the real cause.
      await page.addInitScript({
        content: "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });",
      });

      // tsx/esbuild compiles this file with `keepNames`, which wraps named
      // functions in a `__name(fn, "fn")` helper call to preserve `.name` —
      // including collectSignals below. Playwright serializes it via
      // toString() and runs it in the page's isolated context, where that
      // helper doesn't exist, so every extraction throws a bare
      // ReferenceError. Defining a no-op stand-in before any evaluate call
      // fixes it without touching the collector's logic or types.
      await page.addInitScript({ content: "window.__name = window.__name || function (fn) { return fn; };" });

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: DOM_CONTENT_LOADED_TIMEOUT_MS });
      } catch (cause) {
        throw new ExtractionNavigationError(url, cause);
      }

      // Best-effort: many sites never truly go idle (trackers, chat widgets).
      await page.waitForLoadState("networkidle", { timeout: NETWORK_IDLE_TIMEOUT_MS }).catch(() => {
        /* proceed with whatever rendered so far */
      });
      await page.waitForTimeout(SETTLE_MS);

      const signals = await page.evaluate(collectSignals, MAX_SCANNED_ELEMENTS);

      return { sourceUrl: url, ...signals };
    } finally {
      await browser.close();
    }
  }
}

function collectSignals(maxScannedElements: number): BrowserSignals {
  function toAbsolute(value: string | null): string | null {
    if (value === null || value === "") return null;
    try {
      return new URL(value, document.baseURI).toString();
    } catch {
      return null;
    }
  }

  function rgbToHex(value: string): string | null {
    const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/.exec(value);
    if (!match) return null;
    const [, r, g, b, a] = match;
    if (a !== undefined && Number(a) === 0) return null;
    const toHex = (channel: string): string => Number(channel).toString(16).padStart(2, "0");
    return `#${toHex(r ?? "0")}${toHex(g ?? "0")}${toHex(b ?? "0")}`.toUpperCase();
  }

  const PROMINENT_SELECTOR = 'button, a[class*="btn" i], [class*="cta" i], input[type="submit"]';

  function collectColorSamples(): ColorSample[] {
    const samples: ColorSample[] = [];
    const elements = Array.from(document.querySelectorAll<HTMLElement>("*")).slice(0, maxScannedElements);

    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      const areaPx = rect.width * rect.height;
      if (areaPx <= 0) continue;

      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const isProminent = element.matches(PROMINENT_SELECTOR);

      const backgroundHex = rgbToHex(style.backgroundColor);
      if (backgroundHex) {
        samples.push({ color: backgroundHex, role: "background", areaPx, isProminent });
      }

      const textHex = rgbToHex(style.color);
      if (textHex && element.textContent && element.textContent.trim().length > 0) {
        samples.push({ color: textHex, role: "text", areaPx, isProminent });
      }
    }

    return samples;
  }

  // document.fonts.check only reports true for a font already loaded via
  // @font-face or installed on the OS. Without embedding real webfonts at
  // extraction time, this degrades to "first declared candidate" for most
  // custom fonts — acceptable for V1, revisit once real font files are
  // fetched (see the googleFontMatch decision in docs/SPEC_REVIEW.md, §2).
  function resolveRenderedFont(fontFamily: string): string {
    const candidates = fontFamily.split(",").map((f) => f.trim().replace(/^["']|["']$/g, ""));
    for (const candidate of candidates) {
      if (document.fonts.check(`16px "${candidate}"`)) {
        return candidate;
      }
    }
    return candidates[0] ?? "sans-serif";
  }

  function collectFontFamilies(selector: string): string[] {
    return Array.from(document.querySelectorAll<HTMLElement>(selector)).map((el) =>
      resolveRenderedFont(getComputedStyle(el).fontFamily),
    );
  }

  function collectJsonLdBlocks(): unknown[] {
    const blocks: unknown[] = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        blocks.push(JSON.parse(script.textContent ?? "null"));
      } catch {
        /* malformed JSON-LD is common in the wild; skip it */
      }
    });
    return blocks;
  }

  function collectIconHrefs(): string[] {
    return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'))
      .map((link) => ({ href: toAbsolute(link.getAttribute("href")), sizes: link.getAttribute("sizes") ?? "" }))
      .filter((entry): entry is { href: string; sizes: string } => entry.href !== null)
      .sort((a, b) => (parseInt(b.sizes, 10) || 0) - (parseInt(a.sizes, 10) || 0))
      .map((entry) => entry.href);
  }

  function collectHeaderLogoCandidates(): LogoCandidate[] {
    const header = document.querySelector("header") ?? document.body;
    return Array.from(header.querySelectorAll("img"))
      .map((img) => ({ src: toAbsolute(img.getAttribute("src")), alt: img.alt ?? "" }))
      .filter((entry): entry is LogoCandidate => entry.src !== null);
  }

  function collectHeadings(): string[] {
    return Array.from(document.querySelectorAll("h1, h2"))
      .map((el) => el.textContent?.trim() ?? "")
      .filter((text) => text.length > 0)
      .slice(0, 20);
  }

  function collectReviewSnippets(): string[] {
    return Array.from(document.querySelectorAll<HTMLElement>('[class*="review" i]'))
      .map((el) => el.textContent?.trim() ?? "")
      .filter((text) => text.length > 10 && text.length < 300)
      .slice(0, 20);
  }

  const meta = document.querySelector('meta[name="description"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');

  return {
    colorSamples: collectColorSamples(),
    headingFontFamilies: collectFontFamilies("h1, h2"),
    bodyFontFamilies: collectFontFamilies("p"),
    jsonLdBlocks: collectJsonLdBlocks(),
    metaDescription: meta ? meta.getAttribute("content") : null,
    ogDescription: ogDescription ? ogDescription.getAttribute("content") : null,
    iconHrefs: collectIconHrefs(),
    ogImage: toAbsolute(ogImage ? ogImage.getAttribute("content") : null),
    headerLogoCandidates: collectHeaderLogoCandidates(),
    headings: collectHeadings(),
    reviewLikeSnippets: collectReviewSnippets(),
  };
}
