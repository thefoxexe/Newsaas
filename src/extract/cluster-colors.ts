import type { ColorSample } from "./page-signals.js";

export type ColorCluster = {
  color: string;
  weight: number;
  isNeutral: boolean;
};

const PROMINENCE_MULTIPLIER = 6;
const NEUTRAL_SATURATION_THRESHOLD = 12;
const CLUSTER_DISTANCE_THRESHOLD = 40;

function parseHex(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

// "redmean" approximation of perceptual distance: cheap, no color-space
// conversion, good enough to decide whether two samples are "the same" color.
function colorDistance(a: string, b: string): number {
  const rgbA = parseHex(a);
  const rgbB = parseHex(b);
  const meanRed = (rgbA.r + rgbB.r) / 2;
  const deltaR = rgbA.r - rgbB.r;
  const deltaG = rgbA.g - rgbB.g;
  const deltaB = rgbA.b - rgbB.b;

  return Math.sqrt(
    (2 + meanRed / 256) * deltaR ** 2 + 4 * deltaG ** 2 + (2 + (255 - meanRed) / 256) * deltaB ** 2,
  );
}

function isNeutral(hex: string): boolean {
  const { r, g, b } = parseHex(hex);
  return Math.max(r, g, b) - Math.min(r, g, b) < NEUTRAL_SATURATION_THRESHOLD;
}

/**
 * Groups color samples into perceptual clusters, weighted by rendered
 * surface area and boosted for prominent elements (buttons, CTAs). Clusters
 * are returned sorted by weight, heaviest first.
 */
export function clusterColors(samples: ColorSample[]): ColorCluster[] {
  const clusters: ColorCluster[] = [];

  const sorted = [...samples].sort((a, b) => b.areaPx - a.areaPx);

  for (const sample of sorted) {
    const weight = sample.areaPx * (sample.isProminent ? PROMINENCE_MULTIPLIER : 1);
    const existing = clusters.find((cluster) => colorDistance(cluster.color, sample.color) < CLUSTER_DISTANCE_THRESHOLD);

    if (existing) {
      existing.weight += weight;
    } else {
      clusters.push({ color: sample.color, weight, isNeutral: isNeutral(sample.color) });
    }
  }

  return clusters.sort((a, b) => b.weight - a.weight);
}
