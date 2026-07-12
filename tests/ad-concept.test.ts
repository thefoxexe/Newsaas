import { describe, expect, it } from "vitest";
import { AdConceptSchema } from "../src/domain/ad-concept";

const validConcept = {
  id: "concept-1",
  angle: "lever l'objection prix",
  hook: "Ta veste te lache",
  body: ["Ligne un", "Ligne deux"],
  cta: "Decouvrir",
  recommendedTemplate: "kinetic-type",
  productImageIndex: 0,
};

describe("AdConceptSchema", () => {
  it("accepts a well-formed concept", () => {
    expect(AdConceptSchema.safeParse(validConcept).success).toBe(true);
  });

  it("rejects an unknown template id", () => {
    const invalid = { ...validConcept, recommendedTemplate: "does-not-exist" };
    expect(AdConceptSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects an empty body array", () => {
    const invalid = { ...validConcept, body: [] };
    expect(AdConceptSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects more than 4 body lines", () => {
    const invalid = { ...validConcept, body: ["a", "b", "c", "d", "e"] };
    expect(AdConceptSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts a null productImageIndex", () => {
    const withoutProduct = { ...validConcept, productImageIndex: null };
    expect(AdConceptSchema.safeParse(withoutProduct).success).toBe(true);
  });
});
