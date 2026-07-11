# ADFORGE

Générateur de pubs vidéo motion-design. Voir `docs/SPEC_REVIEW.md` pour la fiche technique complète et les décisions de conception.

## État actuel

**Phase 1** (§12 du spec) : moteur de rendu en CLI, sans DB/web/auth. Un template (`kinetic-type`), trois formats (`9:16`, `1:1`, `16:9`). Entrée : deux fichiers JSON (`BrandKit`, `AdConcept`). Sortie : un MP4 H.264/yuv420p déterministe.

## Lancer le projet en local

```bash
npm install
npx playwright install chromium   # une fois, si Chromium n'est pas déjà installé
npm run render -- --brand fixtures/brand-kit.sample.json --concept fixtures/ad-concept.sample.json --format 9:16 --out out/ad.mp4
```

ffmpeg doit être installé sur la machine (`apt install ffmpeg` / `brew install ffmpeg`), avec le support `libx264`.

Si la version npm de `playwright` ne correspond pas au build Chromium déjà présent sur la machine, définir `PLAYWRIGHT_CHROMIUM_EXECUTABLE` (voir `.env.example`) plutôt que de relancer un téléchargement.

## Commandes utiles

```bash
npm run typecheck   # tsc --noEmit, strict, zéro any
npm run lint         # eslint, zéro warning ignoré
npm test             # vitest — logique métier + un test d'intégration réel (rendu + ffmpeg)
```

Le test d'intégration (`tests/render-video.integration.test.ts`) ne tourne que si `PLAYWRIGHT_CHROMIUM_EXECUTABLE` est défini dans l'environnement — il lance un vrai Chromium et un vrai ffmpeg, et vérifie que deux rendus du même JSON produisent un MP4 strictement identique (même hash MD5).

## Structure

```
src/
  domain/     types + schémas Zod (BrandKit, AdConcept, Format) — aucune IO
  render/     pipeline de rendu (chargement de template, injection de données,
              capture de frames, encodage vidéo) — IO isolée derrière des interfaces
              (FrameCapturer, VideoEncoder) injectées dans renderVideo
  templates/  templates HTML/CSS/manifest.json, un dossier par template
  cli.ts      point d'entrée CLI
fixtures/     BrandKit et AdConcept d'exemple
tests/        tests unitaires (logique pure) + un test d'intégration
```

## Déterminisme du rendu

Le spec suggère `page.clock` de Playwright pour figer le temps. En pratique, `page.clock` ne pilote que `Date`/`setTimeout`/`requestAnimationFrame` — pas les animations CSS (`@keyframes`), qui tournent sur le compositeur. Le pipeline utilise à la place `document.getAnimations()` : chaque animation est mise en pause dès le chargement de la page, puis son `currentTime` est fixé explicitement avant chaque capture de frame. C'est une API standard du navigateur (Web Animations API), et le résultat est vérifié par test : deux rendus du même JSON produisent des fichiers strictement identiques.

## Ce qui n'est pas encore construit

Extraction de DA, génération de concepts LLM, web/DB/auth/Stripe, les 4 autres templates — voir les phases 2 à 7 du spec.
