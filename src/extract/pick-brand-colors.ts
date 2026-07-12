import type { ColorSample } from "./page-signals";
import { clusterColors, type ColorCluster } from "./cluster-colors";

export type BrandColors = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string | null;
  dominanceRatio: number;
};

const FALLBACK_DARK_TEXT = "#0A0A0A";
const FALLBACK_LIGHT_TEXT = "#FAFAFA";

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function pickBrandColors(samples: ColorSample[]): BrandColors {
  const backgroundClusters = clusterColors(samples.filter((s) => s.role === "background"));
  const textClusters = clusterColors(samples.filter((s) => s.role === "text"));

  const background = backgroundClusters[0]?.color ?? "#FFFFFF";
  const nonNeutralCandidates = backgroundClusters.slice(1).filter((c) => !c.isNeutral);

  const primary = pickOrFallback(nonNeutralCandidates, 0, backgroundClusters[1]?.color ?? background);
  const secondary = pickOrFallback(nonNeutralCandidates, 1, primary);
  const accent = nonNeutralCandidates[2]?.color ?? null;

  const text =
    textClusters[0]?.color ??
    (relativeLuminance(background) > 0.5 ? FALLBACK_DARK_TEXT : FALLBACK_LIGHT_TEXT);

  const totalBackgroundWeight = backgroundClusters.reduce((sum, c) => sum + c.weight, 0);
  const dominanceRatio =
    totalBackgroundWeight === 0 ? 0 : (backgroundClusters[0]?.weight ?? 0) / totalBackgroundWeight;

  return { primary, secondary, background, text, accent, dominanceRatio };
}

function pickOrFallback(clusters: ColorCluster[], index: number, fallback: string): string {
  return clusters[index]?.color ?? fallback;
}
