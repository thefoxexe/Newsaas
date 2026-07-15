import type { BrandKit } from "../domain/brand-kit";
import type { TextConstraints } from "../domain/text-constraints";
import type { Prompt } from "./llm-client";

const CONCEPT_COUNT = 5;

// All 5 templates deliberately share identical text constraints/timing
// (see SHARED_TEMPLATE_TEXT_CONSTRAINTS in ../domain/text-constraints) —
// the model only has to pick *which one* fits each concept's angle, not
// worry about different limits per template.
const TEMPLATE_GUIDE = `- "dark-neon" : fond sombre, typographie tres grasse, accent neon. Direction percutante/directe. Choix par defaut, marche pour n'importe quel angle.
- "light-gradient" : fond clair avec degrade doux, typographie fine, cartes flottantes. Direction premium/epuree. A privilegier pour un positionnement haut de gamme ou tech.
- "color-blocks" : chaque scene a son propre aplat de couleur vive, typographie tres grasse, mots-cles surlignes comme au marqueur. Direction pop/energique, marche bien pour un ton jeune ou fun.
- "editorial" : composition alignee a gauche, typographie plus sobre, mots-cles en italique, fines lignes de separation. Direction premium/magazine, discrete. A privilegier pour un positionnement raffine ou une marque etablie.
- "split-duotone" : ecran divise en deux zones de couleur fixes, mots-cles entre crochets colores. Direction graphique/affiche. A privilegier pour un angle qui oppose deux idees (avant/apres, probleme/solution).`;

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

  const businessTypeLabel =
    brandKit.businessType === "ecommerce"
      ? "e-commerce (vente de produits physiques)"
      : brandKit.businessType === "saas"
        ? "SaaS / logiciel"
        : brandKit.businessType === "service"
          ? "prestation de service"
          : "inconnu";

  const user = `Voici les donnees extraites du site de la marque :

Type d'activite detecte : ${businessTypeLabel}${brandKit.businessType === null ? " (deduis-le toi-meme si possible depuis les signaux ci-dessous : tagline, titres, services, url)" : ""}
Tagline : ${brandKit.copy.tagline ?? "aucune"}
Titres releves sur le site : ${brandKit.copy.headings.join(" | ") || "aucun"}
Avis clients releves : ${brandKit.copy.reviewSnippets.join(" | ") || "aucun"}
Services releves : ${brandKit.services.join(" | ") || "aucun"}
Produits (index utilisable pour productImageIndex) :
${productLines || "  aucun produit detecte"}

Tache :
1. Analyse le positionnement de cette marque.
2. Propose ${CONCEPT_COUNT} concepts publicitaires distincts, chacun avec un angle different
   (ex: lever une objection, exploiter un avis client, jouer sur l'urgence, comparer, etc).
3. Pour chaque concept, choisis le template le plus adapte a son angle. Privilegie un template
   pense pour le type d'activite detecte quand il correspond bien a l'angle, sans t'y forcer si un
   autre template sert mieux cet angle precis :
${TEMPLATE_GUIDE}
4. Chaque concept est decoupe en exactement 4 scenes courtes qui s'enchainent (pas une seule
   composition qui dure) : "hook" (accroche), "proof" (avis client ou argument choc), "feature"
   (met en avant un produit precis si un produit pertinent existe, sinon un deuxieme argument
   fort), "cta" (appel a l'action final avec le nom de la marque).

Contraintes de format pour chaque scene (le rendu echouera si elles sont depassees) :
- text : maximum ${textConstraints.scene.maxChars} caracteres, une seule phrase courte et percutante.
- highlight : optionnel, un mot ou groupe de mots qui doit etre un extrait EXACT de "text" (pas de
  reformulation) pour etre mis en couleur accent - null si aucun mot ne doit ressortir.
- productImageIndex : uniquement sur la scene "feature". Un index valide du tableau de produits
  ci-dessus si l'angle beneficie de montrer un produit precis, sinon null. Toujours null sur les
  3 autres scenes.
- recommendedTemplate : "dark-neon", "light-gradient", "color-blocks", "editorial" ou "split-duotone" (voir description ci-dessus).

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
      "recommendedTemplate": "dark-neon" | "light-gradient" | "color-blocks" | "editorial" | "split-duotone",
      "scenes": [
        { "role": "hook", "text": string, "highlight": string | null, "productImageIndex": null },
        { "role": "proof", "text": string, "highlight": string | null, "productImageIndex": null },
        { "role": "feature", "text": string, "highlight": string | null, "productImageIndex": number | null },
        { "role": "cta", "text": string, "highlight": string | null, "productImageIndex": null }
      ]
    }
  ]
}`;

  return { system: SYSTEM_PROMPT, user };
}
