export class LlmResponseParseError extends Error {
  constructor(reason: string) {
    super(`could not parse the LLM response as valid JSON: ${reason}`);
    this.name = "LlmResponseParseError";
  }
}

export class LlmConstraintViolationError extends Error {
  constructor(conceptId: string, field: string, reason: string) {
    super(`concept "${conceptId}" violates "${field}": ${reason}`);
    this.name = "LlmConstraintViolationError";
  }
}
