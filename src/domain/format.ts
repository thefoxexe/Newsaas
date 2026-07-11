import { z } from "zod";

export const FormatSchema = z.enum(["9:16", "1:1", "16:9"]);

export type Format = z.infer<typeof FormatSchema>;

const DIMENSIONS_1080: Record<Format, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};

export function dimensionsFor(format: Format): { width: number; height: number } {
  return DIMENSIONS_1080[format];
}
