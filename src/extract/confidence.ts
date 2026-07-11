export type ConfidenceInputs = {
  hasProducts: boolean;
  colorDominanceRatio: number;
  fontResolved: boolean;
  hasLogo: boolean;
};

const WEIGHTS = {
  products: 0.3,
  color: 0.3,
  font: 0.2,
  logo: 0.2,
} as const;

/**
 * Weighted signal used to decide whether to show the manual DA-correction
 * screen unprompted (see docs/SPEC_REVIEW.md, §2). Not a statistical model —
 * a deliberately simple, auditable heuristic over four extraction signals.
 */
export function computeConfidence(inputs: ConfidenceInputs): number {
  const colorScore = Math.min(1, Math.max(0, inputs.colorDominanceRatio));

  const score =
    WEIGHTS.products * (inputs.hasProducts ? 1 : 0) +
    WEIGHTS.color * colorScore +
    WEIGHTS.font * (inputs.fontResolved ? 1 : 0) +
    WEIGHTS.logo * (inputs.hasLogo ? 1 : 0);

  return Math.round(score * 100) / 100;
}
