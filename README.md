# REELJOLT

Générateur de pubs vidéo motion-design. Voir `docs/SPEC_REVIEW.md` pour la fiche technique complète et les décisions de conception.

## État actuel

**Phases 1-5 : faites et vérifiées en conditions réelles**, bout en bout — landing page → analyse DA gratuite (Playwright) → inscription → génération de 5 concepts (Claude) → rendu vidéo (Playwright + ffmpeg) → lecture du MP4 dans le navigateur. Auth (email/mot de passe + Google/GitHub), DB Postgres (Supabase), quotas, Stripe (Checkout, Portal, webhooks idempotents) sont tous branchés et testés.

**Ce qui reste ouvert** : les 4 templates additionnels (Phase 7 — un seul, `kinetic-type`, existe), le stockage vidéo réel (actuellement un stockage disque local temporaire, R2/S3 pas encore branché), et le déploiement effectif (voir §Déploiement).

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

## Lancer l'application web en local

```bash
npm install
cp .env.example .env   # puis remplir DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, ANTHROPIC_API_KEY, STRIPE_SECRET_KEY
npx drizzle-kit generate && psql "$DATABASE_URL" -f src/db/migrations/000X_*.sql   # une fois par nouvelle migration
npm run dev       # l'app web sur http://localhost:3000
npm run worker    # dans un second terminal — traite les extractions et les rendus en attente
```

L'app web (auth, pages, Stripe, DB) et le worker (Playwright + ffmpeg) sont deux processus séparés — voir §Architecture.

## Commandes utiles

```bash
npm run typecheck   # tsc --noEmit, strict, zéro any
npm run lint         # eslint, zéro warning ignoré
npm test             # vitest — logique métier + un test d'intégration réel (rendu + ffmpeg)
npm run build        # build Next.js de production
```

Les tests d'intégration (`tests/*.integration.test.ts`) ne tournent que si `PLAYWRIGHT_CHROMIUM_EXECUTABLE` (et pour certains, `DATABASE_URL`) est défini dans l'environnement — ils lancent un vrai Chromium (et un vrai ffmpeg pour le rendu), et vérifient : que deux rendus du même JSON produisent un MP4 strictement identique (même hash MD5), que l'extraction sur deux pages locales de test produit un `BrandKit` cohérent, et que les réservations de crédits/webhooks Stripe fonctionnent contre une vraie base Postgres.

## Architecture de déploiement

**L'app web et le worker de rendu sont deux déploiements séparés, volontairement.** Playwright (Chromium) et ffmpeg ne tournent pas correctement sur des functions serverless (taille des binaires, pas de navigateur persistant) — ce n'est pas une limitation de Netlify en particulier, c'est vrai de tout hébergement serverless. Le spec le prévoyait déjà (§3 : `RenderWorker` est une brique à part du reste de l'API).

- **App web (Next.js) → Netlify.** `netlify.toml` + `@netlify/plugin-nextjs` sont déjà configurés. Étapes : connecter ce repo GitHub dans le dashboard Netlify (Add new site → Import an existing project), définir les variables d'environnement listées dans `.env.example` (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` = l'URL Netlify, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), puis déployer.
- **Auth = Supabase Auth**, pas un système maison. Google/GitHub se configurent entièrement dans le dashboard Supabase (Authentication > Providers) — pas de client id/secret côté Netlify.
- **Worker (`npm run worker`) → un hôte qui garde un processus vivant** (Fly.io, Railway, un petit VPS, un conteneur) — **confirmé pas encore déployé (2026-07-13)**, et sans lui rien ne se passe : les URLs soumises restent en `pending` pour toujours (pas d'extraction, pas de rendu), ce qui ressemble exactement à « l'app ne fait rien » — c'est très probablement tout ce que voit l'utilisateur en prod aujourd'hui. `Dockerfile.worker` (à la racine) empaquette tout ce qu'il faut (Node, Chromium via l'image Playwright officielle, ffmpeg) — construit et testé dans cette session (`docker build -f Dockerfile.worker .`, puis un vrai job d'extraction lancé dans le conteneur, passé de `pending` à `done`). Déploiement le plus rapide sur Railway :
  1. Nouveau projet Railway → « Deploy from GitHub repo » → ce repo.
  2. Settings → Build → Dockerfile Path : `Dockerfile.worker`.
  3. Variables : `DATABASE_URL`, `ANTHROPIC_API_KEY` (mêmes valeurs que Netlify).
  4. Settings → Networking → **Generate Domain** (nécessaire — voir point stockage vidéo ci-dessous). Railway injecte automatiquement `PORT` ; le worker écoute dessus.
  5. Une fois le domaine généré (ex. `reeljolt-worker-production.up.railway.app`), ajouter la variable `RENDER_PUBLIC_BASE_URL=https://reeljolt-worker-production.up.railway.app/renders` sur le service Railway, puis redéployer.
- **Stockage vidéo.** `src/storage/video-storage.ts` écrit sur disque local (`LocalDiskStorage`) — ça ne survit pas à un redéploiement Railway. Avant, le worker ne servait rien en HTTP (« pas de port à exposer »), ce qui aurait rendu les vidéos rendues en prod injoignables même une fois le worker déployé (le fichier n'existerait que sur le disque de Railway, jamais servi). Corrigé cette session : `src/storage/static-file-server.ts` fait tourner un petit serveur HTTP (avec support `Range` pour le scrubbing vidéo) dans le process du worker dès que `PORT` est défini — donc uniquement en prod/Railway, jamais en dev local où l'app Next.js sert déjà `public/renders` directement. Reste un pis-aller : les fichiers ne survivent pas à un redéploiement du worker. Remplacer par Cloudflare R2 (ou S3) reste la vraie solution avant un lancement — nécessite des identifiants que je n'ai pas.

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
  db/           schéma Drizzle (schema.ts) + migrations SQL versionnées + client Postgres
  entitlements/ logique de quotas : canGenerate (pure) et reserveRenderCredit/
                refundRenderCredit (transaction Postgres, verrou SELECT ... FOR UPDATE)
  billing/      Stripe : mapping plan <-> price lookup_key, parsing des webhooks
                (Zod, tolérant aux deux emplacements possibles de current_period_*),
                traitement idempotent, Checkout, Customer Portal
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

## Quotas et abonnements

`canGenerate` est une fonction pure testée sur chaque combinaison plan x limite de crédits x statut d'abonnement. `reserveRenderCredit` fait la vraie décrémentation dans une transaction Postgres (`SELECT ... FOR UPDATE` sur la ligne `usage` du user, pour que deux requêtes concurrentes ne passent pas toutes les deux) — vérifié contre la vraie base Supabase (réservations concurrentes, remboursement, plancher à 0). Le plan free n'a jamais de vrai abonnement Stripe derrière lui ; ses crédits se réinitialisent sur le mois calendaire plutôt que sur une période Stripe.

## Stripe

**Le compte Stripe connecté (`BroNote.ch`) est en mode live**, avec des produits existants sans rapport avec REELJOLT (confirmé avant de créer quoi que ce soit). Les produits/prix `REELJOLT Starter/Growth/Scale` (mensuel + annuel, 2 mois offerts) ont été créés en mode live sur ce compte, décision explicitement validée par l'utilisateur — voir `docs/SPEC_REVIEW.md`. Aucun Checkout réel n'a été déclenché : seuls le catalogue (Products/Prices) existe pour l'instant, pas de transaction.

Stripe reste la seule source de vérité de l'abonnement : `handleStripeWebhook` ne fait que mettre à jour un cache (`subscriptions`) à partir des événements `customer.subscription.*`, jamais l'inverse. Idempotence par `stripe_events.id` (`ON CONFLICT DO NOTHING`) — un événement rejoué (Stripe retente les webhooks) est un no-op, vérifié par test avec une vraie vérification de signature (`stripe.webhooks.generateTestHeaderString`).

## Ce qui n'est pas encore construit

L'app Next.js elle-même : auth, pages, queue de rendu asynchrone, routes HTTP pour Stripe (Phase 4-5 restant), landing page (Phase 6), les 4 autres templates (Phase 7). Fixtures HTML capturées sur 5 vraies boutiques (au lieu des 2 fixtures construites à la main actuelles) — voir `docs/SPEC_REVIEW.md`.
