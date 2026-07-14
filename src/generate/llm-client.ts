import Anthropic from "@anthropic-ai/sdk";

export type Prompt = {
  system: string;
  user: string;
};

export interface LlmClient {
  complete(prompt: Prompt): Promise<string>;
}

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
// The 4-scene-per-concept format (see build-prompt.ts) is significantly
// more verbose per concept than the old flat hook/body/cta shape — 4096
// measured too tight for a full 5-concept batch (silently truncated to 3
// concepts, still valid JSON since the model closed the array early
// rather than getting cut off mid-object). Bumped with real headroom
// rather than the exact minimum measured, since French copy runs longer
// than English.
const MAX_TOKENS = 8192;

export class AnthropicLlmClient implements LlmClient {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey = process.env["ANTHROPIC_API_KEY"], model = process.env["ANTHROPIC_MODEL"] ?? DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(prompt: Prompt): Promise<string> {
    // Prefilling the assistant turn with "{" forces Claude to continue
    // straight into JSON instead of wrapping it in a markdown code fence —
    // structural prevention instead of stripping fences after the fact.
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: MAX_TOKENS,
      system: prompt.system,
      messages: [
        { role: "user", content: prompt.user },
        { role: "assistant", content: "{" },
      ],
    });

    const continuation = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return `{${continuation}`;
  }
}
