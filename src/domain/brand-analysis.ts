import { z } from "zod";

export const BrandAnalysisSchema = z.object({
  audience: z.string().min(1),
  positioning: z.string().min(1),
  painPoints: z.array(z.string().min(1)).min(1),
  objections: z.array(z.string().min(1)).min(1),
  toneOfVoice: z.string().min(1),
});

export type BrandAnalysis = z.infer<typeof BrandAnalysisSchema>;
