import { describe, expect, it } from "vitest";
import { checkTextConstraints, type TextConstraints } from "../src/domain/text-constraints";

const constraints: TextConstraints = {
  hook: { maxChars: 10 },
  body: { maxLines: 2, maxCharsPerLine: 8 },
  cta: { maxChars: 5 },
};

describe("checkTextConstraints", () => {
  it("accepts a concept within every limit", () => {
    const result = checkTextConstraints(constraints, { hook: "Short", body: ["ok", "fine"], cta: "Go" });
    expect(result.ok).toBe(true);
  });

  it("flags a hook that is too long", () => {
    const result = checkTextConstraints(constraints, { hook: "Way too long", body: [], cta: "Go" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("hook");
  });

  it("flags too many body lines before checking their length", () => {
    const result = checkTextConstraints(constraints, { hook: "ok", body: ["a", "b", "c"], cta: "Go" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("body");
  });

  it("flags a cta that is too long", () => {
    const result = checkTextConstraints(constraints, { hook: "ok", body: [], cta: "Way too long" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("cta");
  });
});
