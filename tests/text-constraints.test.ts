import { describe, expect, it } from "vitest";
import { checkTextConstraints, type TextConstraints } from "../src/domain/text-constraints";

const constraints: TextConstraints = {
  scene: { maxChars: 10 },
};

describe("checkTextConstraints", () => {
  it("accepts scenes that are all within the limit", () => {
    const result = checkTextConstraints(constraints, [
      { role: "hook", text: "Short" },
      { role: "cta", text: "Go now" },
    ]);
    expect(result.ok).toBe(true);
  });

  it("flags the first scene whose text is too long", () => {
    const result = checkTextConstraints(constraints, [
      { role: "hook", text: "ok" },
      { role: "proof", text: "Way too long for this" },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("scene");
    expect(result.error.reason).toContain("proof");
  });
});
