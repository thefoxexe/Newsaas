import { describe, expect, it } from "vitest";
import { buildCopy } from "../src/extract/build-copy.js";

describe("buildCopy", () => {
  it("prefers og:description over the meta description for the tagline", () => {
    const copy = buildCopy("meta desc", "og desc", [], []);
    expect(copy.tagline).toBe("og desc");
  });

  it("falls back to the meta description when there is no og:description", () => {
    const copy = buildCopy("meta desc", null, [], []);
    expect(copy.tagline).toBe("meta desc");
  });

  it("returns null tagline when neither is present", () => {
    const copy = buildCopy(null, null, [], []);
    expect(copy.tagline).toBeNull();
  });

  it("caps headings and review snippets at 10 items", () => {
    const many = Array.from({ length: 15 }, (_, i) => `item ${i}`);
    const copy = buildCopy(null, null, many, many);
    expect(copy.headings).toHaveLength(10);
    expect(copy.reviewSnippets).toHaveLength(10);
  });
});
