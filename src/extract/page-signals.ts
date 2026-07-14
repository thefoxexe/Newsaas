export type ColorSample = {
  color: string;
  role: "background" | "text";
  areaPx: number;
  isProminent: boolean;
};

export type LogoCandidate = {
  src: string;
  alt: string;
};

export type RawPageSignals = {
  sourceUrl: string;
  colorSamples: ColorSample[];
  headingFontFamilies: string[];
  bodyFontFamilies: string[];
  jsonLdBlocks: unknown[];
  metaDescription: string | null;
  ogDescription: string | null;
  iconHrefs: string[];
  ogImage: string | null;
  headerLogoCandidates: LogoCandidate[];
  headings: string[];
  reviewLikeSnippets: string[];
  serviceLikeSnippets: string[];
};
