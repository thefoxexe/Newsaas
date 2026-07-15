import { describe, expect, it } from "vitest";
import { generateConcepts } from "../src/generate/generate-concepts";
import type { LlmClient, Prompt } from "../src/generate/llm-client";
import type { GenerationResponse } from "../src/generate/parse-generation-response";
import type { BrandKit } from "../src/domain/brand-kit";
import type { TextConstraints } from "../src/domain/text-constraints";
import type { Scene } from "../src/domain/ad-concept";

const textConstraints: TextConstraints = {
  scene: { maxChars: 40 },
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
  services: [],
  businessType: null,
  screenshotUrl: null,
};

function validScenes(overrides: Partial<Record<Scene["role"], Partial<Scene>>> = {}): Scene[] {
  const base: Record<Scene["role"], Scene> = {
    hook: { role: "hook", text: "Ta veste te lache", highlight: null, productImageIndex: null },
    proof: { role: "proof", text: "Coupe impeccable", highlight: "impeccable", productImageIndex: null },
    feature: { role: "feature", text: "Tient 4 saisons", highlight: null, productImageIndex: 0 },
    cta: { role: "cta", text: "Decouvrir", highlight: null, productImageIndex: null },
  };
  return (["hook", "proof", "feature", "cta"] as const).map((role) => ({ ...base[role], ...overrides[role] }));
}

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
      recommendedTemplate: "dark-neon",
      scenes: validScenes(),
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

  it("rejects a concept whose hook exceeds the shared per-scene constraint, even if the JSON is valid", async () => {
    const tooLongHook = JSON.stringify({
      analysis: validPayload.analysis,
      concepts: [
        {
          ...validPayload.concepts[0],
          scenes: validScenes({ hook: { text: "Cette accroche est beaucoup trop longue pour tenir dans une scene" } }),
        },
      ],
    });

    const client = new ScriptedLlmClient([tooLongHook, tooLongHook]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.name).toBe("LlmConstraintViolationError");
  });

  it("drops only the concept that violates a constraint, keeping the rest of the batch", async () => {
    const mixed = JSON.stringify({
      analysis: validPayload.analysis,
      concepts: [
        { ...validPayload.concepts[0], id: "concept-1" },
        {
          ...validPayload.concepts[0],
          id: "concept-2",
          scenes: validScenes({ proof: { text: "Cette ligne est beaucoup trop longue pour tenir dans une scene" } }),
        },
        { ...validPayload.concepts[0], id: "concept-3" },
      ],
    });

    const client = new ScriptedLlmClient([mixed]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.concepts.map((c) => c.id)).toEqual(["concept-1", "concept-3"]);
    expect(client.calls).toBe(1);
  });

  it("rejects a feature scene's productImageIndex that is out of range for the brand's products", async () => {
    const outOfRange = JSON.stringify({
      analysis: validPayload.analysis,
      concepts: [{ ...validPayload.concepts[0], scenes: validScenes({ feature: { productImageIndex: 5 } }) }],
    });

    const client = new ScriptedLlmClient([outOfRange, outOfRange]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(false);
  });

  it("rejects a concept missing one of the 4 fixed scene roles", async () => {
    const missingRole = JSON.stringify({
      analysis: validPayload.analysis,
      concepts: [
        { ...validPayload.concepts[0], scenes: validScenes().map((s) => (s.role === "cta" ? { ...s, role: "proof" } : s)) },
      ],
    });

    const client = new ScriptedLlmClient([missingRole, missingRole]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(false);
  });

  it("keeps a concept but nulls out a highlight that isn't an exact substring of its scene's text", async () => {
    const badHighlight = JSON.stringify({
      analysis: validPayload.analysis,
      concepts: [{ ...validPayload.concepts[0], scenes: validScenes({ hook: { highlight: "not in the text" } }) }],
    });

    const client = new ScriptedLlmClient([badHighlight]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const hookScene = result.value.concepts[0]?.scenes.find((s) => s.role === "hook");
    expect(hookScene?.highlight).toBeNull();
  });

  it("keeps a concept but nulls out a productImageIndex on a non-feature scene", async () => {
    const strayIndex = JSON.stringify({
      analysis: validPayload.analysis,
      concepts: [{ ...validPayload.concepts[0], scenes: validScenes({ hook: { productImageIndex: 0 } }) }],
    });

    const client = new ScriptedLlmClient([strayIndex]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const hookScene = result.value.concepts[0]?.scenes.find((s) => s.role === "hook");
    expect(hookScene?.productImageIndex).toBeNull();
  });

  it("accepts a feature scene with no productImageIndex (no product tie-in)", async () => {
    const noProduct = JSON.stringify({
      analysis: validPayload.analysis,
      concepts: [{ ...validPayload.concepts[0], scenes: validScenes({ feature: { productImageIndex: null } }) }],
    });

    const client = new ScriptedLlmClient([noProduct]);
    const result = await generateConcepts(brandKit, client, textConstraints);

    expect(result.ok).toBe(true);
  });
});
