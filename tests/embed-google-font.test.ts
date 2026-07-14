import { afterEach, describe, expect, it, vi } from "vitest";
import { extractLastFontFaceUrl, fetchEmbeddableFontFace } from "../src/render/embed-google-font";

const TWO_SUBSET_CSS = `
/* latin-ext */
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/poppins/v24/latin-ext.woff2) format('woff2');
  unicode-range: U+0100-02BA;
}
/* latin */
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/poppins/v24/latin.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
`;

describe("extractLastFontFaceUrl", () => {
  it("picks the URL from the last @font-face block (the plain latin subset)", () => {
    expect(extractLastFontFaceUrl(TWO_SUBSET_CSS)).toBe("https://fonts.gstatic.com/s/poppins/v24/latin.woff2");
  });

  it("returns null when there is no @font-face block at all", () => {
    expect(extractLastFontFaceUrl("body { color: red; }")).toBeNull();
  });
});

describe("fetchEmbeddableFontFace", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null immediately for a null family, without fetching anything", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchEmbeddableFontFace(null, [900]);

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the Google Fonts CSS request fails, instead of throwing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchEmbeddableFontFace("NotARealFontXYZ", [900]);

    expect(result).toBeNull();
  });

  it("embeds the fetched font as a base64 data URI covering the requested weight range", async () => {
    const fontBytes = new Uint8Array([1, 2, 3, 4]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(TWO_SUBSET_CSS) })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(fontBytes.buffer) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchEmbeddableFontFace("PoppinsTestFamily", [900]);

    expect(result).toContain("font-family: 'PoppinsTestFamily'");
    expect(result).toContain("font-weight: 400 900");
    expect(result).toContain(`base64,${Buffer.from(fontBytes).toString("base64")}`);
  });

  it("caches in-flight requests so the same family+weights only fetches once", async () => {
    const fontBytes = new Uint8Array([9, 9]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(TWO_SUBSET_CSS) })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(fontBytes.buffer) });
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      fetchEmbeddableFontFace("CachedFamily", [900]),
      fetchEmbeddableFontFace("CachedFamily", [900]),
    ]);

    expect(first).toBe(second);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
