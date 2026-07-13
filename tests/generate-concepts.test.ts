import { describe, expect, it } from "vitest";
import { generateConcepts } from "../src/generate/generate-concepts";
import type { LlmClient, Prompt } from "../src/generate/llm-client";
import type { GenerationResponse } from "../src/generate/parse-generation-response";
import type { BrandKit } from "../src/domain/brand-kit";
import type { TextConstraints } from "../src/domain/text-constraints";

const textConstraints: TextConstraints = {
  hook: { maxChars: 40 },
  body: { maxLines: 3, maxCharsPerLine: 28 },
  cta: { maxChars: 20 },
};

const brandKit: BrandKit = {
  sourceUrl: "https://example.com",
  colors: {
    primary: "#FF6B35",
    secondary: "#2E294E",
    background: "#0B0B0F",
    text: "#F5F5F0",
    accent: null,
    confidence: 0.8,
  },
  typography: {
    headingFamily: "Arial",
    bodyFamily: "Arial",
    googleFontMatch: null,
    fallbackStack: "sans-serif",
  },
  logo: null,
  products: [{ title: "Veste Aro", price: "CHF 129", imageUrl: "https://example.com/aro.jpg", description: null }],
  copy: { tagline: "Le vestiaire de la ville", headings: [], reviewSnippets: [] },
};

const validPayload: GenerationResponse = {
  analysis: {
    audience: "urbains 25-35",
    positioning: "premium accessible",
    painPoints: ["prix percu comme eleve"],
    objections: ["delai de livraison"],
    toneOfVoice: "direct",
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

const validResponse = JSON.stringify(validPayload);

class ScriptedLlmClient implements LlmClient {
  private callCount = 0;
  constructor(private readonly responses: string[]) {}

  complete(_prompt: Prompt): Promise<string> {
    const response = this.responses[this.callCount] ?? this.responses[this.responses.length - 1];
    this.callCount += 1;
    return Promise.resolve(response ?? "");
  }

  get calls(): number {
    return this.callCount;
  }
}

describe("generateConcepts", () => {
  it("returns the parsed response on the first successful call", async () => {
    const client = new ScriptedLlmClient([validResponse]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(true);
    expect(client.calls).toBe(1);
  });

  it("retries once after malformed JSON, then succeeds", async () => {
    const client = new ScriptedLlmClient(["not json at all", validResponse]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(true);
    expect(client.calls).toBe(2);
  });

  it("returns a typed error after two failed attempts", async () => {
    const client = new ScriptedLlmClient(["not json", "still not json"]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(false);
    expect(client.calls).toBe(2);
  });

  it("rejects a concept whose hook exceeds the template's constraints, even if the JSON is valid", async () => {
    const tooLongHook = JSON.stringify({
      analysis: validPayload.analysis,
      concepts: [
        { ...validPayload.concepts[0], hook: "Cette accroche est beaucoup trop longue pour le template" },
      ],
    });

    const client = new ScriptedLlmClient([tooLongHook, tooLongHook]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.name).toBe("LlmConstraintViolationError");
  });

  it("drops only the concept that violates a constraint, keeping the rest of the batch", async () => {
    const tooLongBody = JSON.stringify({
      analysis: validPayload.analysis,
      concepts: [
        { ...validPayload.concepts[0], id: "concept-1" },
        { ...validPayload.concepts[0], id: "concept-2", body: ["Cette ligne est beaucoup trop longue pour tenir"] },
        { ...validPayload.concepts[0], id: "concept-3" },
      ],
    });

    const client = new ScriptedLlmClient([tooLongBody]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.concepts.map((c) => c.id)).toEqual(["concept-1", "concept-3"]);
    expect(client.calls).toBe(1);
  });

  it("rejects a productImageIndex that is out of range for the brand's products", async () => {
    const outOfRange = JSON.stringify({
      analysis: validPayload.analysis,
      concepts: [{ ...validPayload.concepts[0], productImageIndex: 5 }],
    });

    const client = new ScriptedLlmClient([outOfRange, outOfRange]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(false);
  });
});
