# ADFORGE

Générateur de pubs vidéo motion-design. Voir `docs/SPEC_REVIEW.md` pour la fiche technique complète et les décisions de conception.

## État actuel

**Phase 1** (§12 du spec) : moteur de rendu en CLI, sans DB/web/auth. Un template (`kinetic-type`), trois formats (`9:16`, `1:1`, `16:9`). Entrée : deux fichiers JSON (`BrandKit`, `AdConcept`). Sortie : un MP4 H.264/yuv420p déterministe.

**Phase 2** : `BrandExtractor`, une URL → un `BrandKit` JSON via Playwright (couleurs pondérées par surface/proéminence, typo, logo, produits JSON-LD, copy, score de confiance).

**Phases 3 à 7** : pas commencées. Phase 3 (génération de concepts via l'API Claude) a besoin d'une clé `ANTHROPIC_API_KEY` que cet environnement n'a pas — je ne voulais pas livrer du code d'appel LLM sans pouvoir le vérifier par une vraie requête, au même niveau de rigueur que les phases 1 et 2. Les phases 4+ (web, DB, auth, queue, Stripe) ont aussi besoin de décisions/accès (voir `docs/SPEC_REVIEW.md`) avant de pouvoir avancer sérieusement.

## Lancer le projet en local

```bash
npm install
npx playwright install chromium   # une fois, si Chromium n'est pas déjà installé
npm run render -- --brand fixtures/brand-kit.sample.json --concept fixtures/ad-concept.sample.json --format 9:16 --out out/ad.mp4
npm run extract -- --url https://exemple-boutique.com --out out/brand-kit.json
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
  templates/    templates HTML/CSS/manifest.json, un dossier par template
  cli.ts        rendu : BrandKit + AdConcept JSON -> MP4
  extract-cli.ts extraction : URL -> BrandKit JSON
fixtures/       BrandKit et AdConcept d'exemple
tests/          tests unitaires (logique pure) + tests d'intégration
tests/fixtures/ pages HTML construites à la main pour tester l'extraction
                (pas des captures de vrais sites — voir docs/SPEC_REVIEW.md, §2)
```

## Déterminisme du rendu

Le spec suggère `page.clock` de Playwright pour figer le temps. En pratique, `page.clock` ne pilote que `Date`/`setTimeout`/`requestAnimationFrame` — pas les animations CSS (`@keyframes`), qui tournent sur le compositeur. Le pipeline utilise à la place `document.getAnimations()` : chaque animation est mise en pause dès le chargement de la page, puis son `currentTime` est fixé explicitement avant chaque capture de frame. C'est une API standard du navigateur (Web Animations API), et le résultat est vérifié par test : deux rendus du même JSON produisent des fichiers strictement identiques.

## Extraction de DA

Couleurs pondérées par surface visible et boostées pour les éléments prominents (`button`, `.btn`, `[class*="cta"]`) via une distance perceptuelle approximée (formule "redmean"). Typo choisie par vote majoritaire sur les polices réellement résolues (`document.fonts.check`), avec un match Google Fonts contre une liste statique **volontairement réduite** — voir `src/extract/google-fonts-catalog.ts` : le vrai catalogue nécessite une clé API Google Fonts, décision non prise (`docs/SPEC_REVIEW.md`, §2). Timeout dur de 20s avec attente en deux temps (`domcontentloaded` puis `networkidle` en best-effort) pour ne pas rester bloqué sur des sites dont les trackers ne cessent jamais de faire du polling.

## Ce qui n'est pas encore construit

Génération de concepts LLM (Phase 3, bloquée sur une clé `ANTHROPIC_API_KEY`), web/DB/auth/queue/Stripe (Phases 4-5), landing page (Phase 6), les 4 autres templates (Phase 7). Fixtures HTML capturées sur 5 vraies boutiques (au lieu des 2 fixtures construites à la main actuelles) — voir `docs/SPEC_REVIEW.md`.
