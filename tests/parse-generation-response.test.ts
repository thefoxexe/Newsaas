import { describe, expect, it } from "vitest";
import { parseGenerationResponse } from "../src/generate/parse-generation-response";

const validPayload = {
  analysis: {
    audience: "urbains 25-35",
    positioning: "premium accessible",
    painPoints: ["prix percu comme eleve"],
    objections: ["delai de livraison"],
    toneOfVoice: "direct, sans jargon",
  },
  concepts: [
    {
      id: "concept-1",
      angle: "lever l'objection prix",
      recommendedTemplate: "dark-neon",
      scenes: [
        { role: "hook", text: "Ta veste te lache", highlight: null, productImageIndex: null },
        { role: "proof", text: "Coupe impeccable", highlight: "impeccable", productImageIndex: null },
        { role: "feature", text: "Tient 4 saisons", highlight: null, productImageIndex: 0 },
        { role: "cta", text: "Decouvrir", highlight: null, productImageIndex: null },
      ],
    },
  ],
};

describe("parseGenerationResponse", () => {
  it("parses a well-formed response", () => {
    const result = parseGenerationResponse(JSON.stringify(validPayload));
    expect(result.ok).toBe(true);
  });

  it("rejects text that isn't JSON", () => {
    const result = parseGenerationResponse("Sure, here is the JSON:\n" + JSON.stringify(validPayload));
    expect(result.ok).toBe(false);
  });

  it("rejects JSON that doesn't match the expected shape", () => {
    const result = parseGenerationResponse(JSON.stringify({ analysis: {}, concepts: [] }));
    expect(result.ok).toBe(false);
  });

  it("rejects an empty concepts array", () => {
    const result = parseGenerationResponse(JSON.stringify({ ...validPayload, concepts: [] }));
    expect(result.ok).toBe(false);
  });
});
