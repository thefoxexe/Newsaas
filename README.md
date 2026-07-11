# ADFORGE

Générateur de pubs vidéo motion-design. Voir `docs/SPEC_REVIEW.md` pour la fiche technique complète et les décisions de conception.

## État actuel

**Phase 1** (§12 du spec) : moteur de rendu en CLI, sans DB/web/auth. Un template (`kinetic-type`), trois formats (`9:16`, `1:1`, `16:9`). Entrée : deux fichiers JSON (`BrandKit`, `AdConcept`). Sortie : un MP4 H.264/yuv420p déterministe.

**Phase 2** : `BrandExtractor`, une URL → un `BrandKit` JSON via Playwright (couleurs pondérées par surface/proéminence, typo, logo, produits JSON-LD, copy, score de confiance).

**Phase 3** : `ConceptGenerator`, un `BrandKit` → une `BrandAnalysis` + 5 `AdConcept` via l'API Claude. Chaîne complète vérifiée de bout en bout : URL → BrandKit → 5 concepts → 5 MP4 réels.

**Phases 4 à 7** : pas commencées — web/DB/auth/queue/Stripe, landing page, les 4 autres templates. Ont besoin des décisions/accès listés dans `docs/SPEC_REVIEW.md` avant de pouvoir avancer sérieusement.

## Lancer le projet en local

```bash
npm install
npx playwright install chromium   # une fois, si Chromium n'est pas déjà installé
npm run render -- --brand fixtures/brand-kit.sample.json --concept fixtures/ad-concept.sample.json --format 9:16 --out out/ad.mp4
npm run extract -- --url https://exemple-boutique.com --out out/brand-kit.json
npm run generate -- --brand out/brand-kit.json --out out/generation.json   # a besoin de ANTHROPIC_API_KEY
```

ffmpeg doit être installé sur la machine (`apt install ffmpeg` / `brew install ffmpeg`), avec le support `libx264`.

Si la version npm de `playwright` ne correspond pas au build Chromium déjà présent sur la machine, définir `PLAYWRIGHT_CHROMIUM_EXECUTABLE` (voir `.env.example`) plutôt que de relancer un téléchargement.

## Commandes utiles

```bash
npm run typecheck   # tsc --noEmit, strict, zéro any
npm run lint         # eslint, zéro warning ignoré
npm test             # vitest — logique métier + un test d'intégration réel (rendu + ffmpeg)
```

Les tests d'intégration (`tests/*.integration.test.ts`) ne tournent que si `PLAYWRIGHT_CHROMIUM_EXECUTABLE` est défini dans l'environnement — ils lancent un vrai Chromium (et un vrai ffmpeg pour le rendu), et vérifient : que deux rendus du même JSON produisent un MP4 strictement identique (même hash MD5), et que l'extraction sur deux pages locales de test produit un `BrandKit` cohérent.

## Structure

```
src/
  domain/       types + schémas Zod (BrandKit, AdConcept, Format) — aucune IO
  render/       pipeline de rendu (chargement de template, injection de données,
                capture de frames, encodage vidéo) — IO isolée derrière des interfaces
                (FrameCapturer, VideoEncoder) injectées dans renderVideo
  extract/      BrandExtractor (clustering de couleurs, typo, logo, produits JSON-LD,
                copy, confiance) — IO isolée derrière PageAnalyzer, implémenté par
                Playwright dans analyze-page.ts
  generate/     ConceptGenerator (prompt, appel LLM, parsing Zod strict, re-verification
                des contraintes de texte, un retry) — IO isolée derrière LlmClient,
                implémenté par l'API Anthropic dans llm-client.ts
  templates/    templates HTML/CSS/manifest.json, un dossier par template
  cli.ts        rendu : BrandKit + AdConcept JSON -> MP4
  extract-cli.ts extraction : URL -> BrandKit JSON
  generate-cli.ts generation : BrandKit JSON -> BrandAnalysis + 5 AdConcept JSON
fixtures/       BrandKit et AdConcept d'exemple
tests/          tests unitaires (logique pure) + tests d'intégration
tests/fixtures/ pages HTML construites à la main pour tester l'extraction
                (pas des captures de vrais sites — voir docs/SPEC_REVIEW.md, §2)
```

## Déterminisme du rendu

Le spec suggère `page.clock` de Playwright pour figer le temps. En pratique, `page.clock` ne pilote que `Date`/`setTimeout`/`requestAnimationFrame` — pas les animations CSS (`@keyframes`), qui tournent sur le compositeur. Le pipeline utilise à la place `document.getAnimations()` : chaque animation est mise en pause dès le chargement de la page, puis son `currentTime` est fixé explicitement avant chaque capture de frame. C'est une API standard du navigateur (Web Animations API), et le résultat est vérifié par test : deux rendus du même JSON produisent des fichiers strictement identiques.

## Extraction de DA

Couleurs pondérées par surface visible et boostées pour les éléments prominents (`button`, `.btn`, `[class*="cta"]`) via une distance perceptuelle approximée (formule "redmean"). Typo choisie par vote majoritaire sur les polices réellement résolues (`document.fonts.check`), avec un match Google Fonts contre une liste statique **volontairement réduite** — voir `src/extract/google-fonts-catalog.ts` : le vrai catalogue nécessite une clé API Google Fonts, décision non prise (`docs/SPEC_REVIEW.md`, §2). Timeout dur de 20s avec attente en deux temps (`domcontentloaded` puis `networkidle` en best-effort) pour ne pas rester bloqué sur des sites dont les trackers ne cessent jamais de faire du polling.

## Génération de concepts

Un seul appel Claude produit `BrandAnalysis` + 5 `AdConcept` en JSON strict. Le modèle enveloppe parfois sa réponse dans un bloc markdown malgré la consigne — plutôt que de "réparer" ça avec une regex après coup (interdit par le spec), la réponse assistant est préfixée avec `{` (voir `src/generate/llm-client.ts`), ce qui empêche structurellement l'ajout de markdown. Chaque concept est re-vérifié après parsing contre les contraintes de texte du template et contre le nombre réel de produits (`productImageIndex`) ; un échec déclenche un unique retry, puis une erreur typée. `recommendedTemplate` vaut toujours `"kinetic-type"` pour l'instant, seul template existant (Phase 7 ajoutera le choix réel).

## Ce qui n'est pas encore construit

Web/DB/auth/queue/Stripe (Phases 4-5), landing page (Phase 6), les 4 autres templates (Phase 7). Fixtures HTML capturées sur 5 vraies boutiques (au lieu des 2 fixtures construites à la main actuelles) — voir `docs/SPEC_REVIEW.md`.
