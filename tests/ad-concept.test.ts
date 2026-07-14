import { describe, expect, it } from "vitest";
import { AdConceptSchema } from "../src/domain/ad-concept";

const validConcept = {
  id: "concept-1",
  angle: "lever l'objection prix",
  recommendedTemplate: "dark-neon",
  scenes: [
    { role: "hook", text: "Ta veste te lache", highlight: null, productImageIndex: null },
    { role: "proof", text: "Coupe impeccable", highlight: "impeccable", productImageIndex: null },
    { role: "feature", text: "Veste technique", highlight: null, productImageIndex: 0 },
    { role: "cta", text: "Decouvrir", highlight: null, productImageIndex: null },
  ],
};

describe("AdConceptSchema", () => {
  it("accepts a well-formed concept", () => {
    expect(AdConceptSchema.safeParse(validConcept).success).toBe(true);
  });

  it("rejects an unknown template id", () => {
    const invalid = { ...validConcept, recommendedTemplate: "does-not-exist" };
    expect(AdConceptSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects fewer than 4 scenes", () => {
    const invalid = { ...validConcept, scenes: validConcept.scenes.slice(0, 3) };
    expect(AdConceptSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects more than 4 scenes", () => {
    const invalid = { ...validConcept, scenes: [...validConcept.scenes, validConcept.scenes[0]] };
    expect(AdConceptSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects an unknown scene role", () => {
    const invalid = {
      ...validConcept,
      scenes: [{ ...validConcept.scenes[0], role: "does-not-exist" }, ...validConcept.scenes.slice(1)],
    };
    expect(AdConceptSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts a null productImageIndex and a null highlight", () => {
    const withoutProduct = {
      ...validConcept,
      scenes: validConcept.scenes.map((s) => ({ ...s, highlight: null, productImageIndex: null })),
    };
    expect(AdConceptSchema.safeParse(withoutProduct).success).toBe(true);
  });
});
