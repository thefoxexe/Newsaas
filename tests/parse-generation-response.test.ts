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
      hook: "Ta veste te lache",
      body: ["Tient 4 saisons"],
      cta: "Decouvrir",
      recommendedTemplate: "kinetic-type",
      productImageIndex: 0,
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
