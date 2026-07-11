import type { BrandKit } from "../domain/brand-kit.js";
import type { TextConstraints } from "../domain/text-constraints.js";
import type { Prompt } from "./llm-client.js";

const CONCEPT_COUNT = 5;

// Phase 7 will add more templates; until then every concept is rendered by
// kinetic-type, so there is no template choice for the model to make.
const FIXED_TEMPLATE_ID = "kinetic-type";

const SYSTEM_PROMPT = `Tu es un strategiste publicitaire specialise en direct-to-consumer e-commerce.
Tu ne rediges jamais une publicite directement : tu analyses le positionnement d'une marque,
puis tu proposes des angles publicitaires exploitables par un moteur de rendu automatique.

Regles strictes :
- Reponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou apres, sans balises markdown.
- N'invente aucun fait sur la marque au-dela de ce qui t'est fourni.
- Ecris dans la meme langue que le contenu de la marque fourni ci-dessous.`;

export function buildGenerationPrompt(brandKit: BrandKit, textConstraints: TextConstraints): Prompt {
  const productLines = brandKit.products
    .map((p, i) => `  [${i}] ${p.title}${p.price ? ` (${p.price})` : ""} - ${p.description ?? "sans description"}`)
    .join("\n");

  const user = `Voici les donnees extraites du site de la marque :

Tagline : ${brandKit.copy.tagline ?? "aucune"}
Titres releves sur le site : ${brandKit.copy.headings.join(" | ") || "aucun"}
Avis clients releves : ${brandKit.copy.reviewSnippets.join(" | ") || "aucun"}
Produits (index utilisable pour productImageIndex) :
${productLines || "  aucun produit detecte"}

Tache :
1. Analyse le positionnement de cette marque.
2. Propose ${CONCEPT_COUNT} concepts publicitaires distincts, chacun avec un angle different
   (ex: lever une objection, exploiter un avis client, jouer sur l'urgence, comparer, etc).

Contraintes de format pour chaque concept (le rendu echouera si elles sont depassees) :
- hook : maximum ${textConstraints.hook.maxChars} caracteres, phrase d'accroche qui arrete le scroll.
- body : ${textConstraints.body.maxLines} lignes maximum, chaque ligne fait au plus ${textConstraints.body.maxCharsPerLine} caracteres.
- cta : maximum ${textConstraints.cta.maxChars} caracteres.
- recommendedTemplate doit toujours valoir exactement "${FIXED_TEMPLATE_ID}".
- productImageIndex : un index valide du tableau de produits ci-dessus, ou null si aucun produit ne s'applique.

Reponds avec exactement cet objet JSON (pas de markdown, pas de commentaire) :
{
  "analysis": {
    "audience": string,
    "positioning": string,
    "painPoints": string[],
    "objections": string[],
    "toneOfVoice": string
  },
  "concepts": [
    {
      "id": string,
      "angle": string,
      "hook": string,
      "body": string[],
      "cta": string,
      "recommendedTemplate": "${FIXED_TEMPLATE_ID}",
      "productImageIndex": number | null
    }
  ]
}`;

  return { system: SYSTEM_PROMPT, user };
}
