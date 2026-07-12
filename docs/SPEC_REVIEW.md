# Revue de la fiche technique REELJOLT (anciennement ADFORGE)

Le produit a été renommé **ReelJolt** (`reeljolt.com`) — le nom "Adforge" était déjà pris en `.com`. Le reste de ce document garde ses références historiques à "ADFORGE" telles quelles : c'est un journal, pas une page produit.

J'ai lu l'intégralité du document `Fiche technique — Générateur de pubs vidéo motion-design`. Avant d'écrire la moindre ligne de code, voici ce qui me semble ambigu, risqué, ou nécessite une décision de ta part — comme demandé au §0 : *"tu le dis et tu proposes une alternative"*.

Le repo est actuellement vide (aucun commit). Rien n'a été codé. Cette revue est le seul livrable de ce tour.

---

## 1. Décisions techniques non tranchées

Le §4 laisse deux choix ouverts avec un "ou". Ce sont des décisions structurantes (elles conditionnent l'archi de la Phase 4), pas des détails :

- **Queue de jobs — BullMQ+Redis vs Inngest.** Ce sont deux modèles opérationnels différents : BullMQ nous fait gérer Redis nous-mêmes (infra, monitoring, scaling des workers) ; Inngest est managé (zéro infra, mais dépendance à un tiers et modèle de pricing externe). Le §7 demande une notion de priorité de queue par plan (`basse/normale/haute/prioritaire`) — les deux systèmes le supportent, donc ce n'est pas ça qui tranche.
  **Proposition :** Inngest pour la V1, pour rester cohérent avec "zéro infra à gérer soi-même" tant qu'on n'a pas validé le produit. On migre vers BullMQ si on a besoin d'un contrôle plus fin sur la concurrence/priorité une fois le volume réel connu.
- **Auth — Better Auth vs Auth.js.** Recommandation : Better Auth (meilleur support TypeScript strict, moins de magie autour des sessions), mais c'est plus récent et moins éprouvé en prod. À confirmer avec toi avant la Phase 4.

Ces deux choix ne bloquent pas la Phase 1 (qui n'a ni DB ni queue ni auth), donc je peux avancer sans réponse immédiate — mais je veux les trancher avant la Phase 4.

## 2. Module A — BrandExtractor

- **`confidence` non défini.** Le score décide si on montre l'écran de correction manuelle spontanément — c'est un mécanisme central de l'UX, pas un détail. Il faut une formule concrète, par exemple une moyenne pondérée de : couverture JSON-LD produit trouvée, compacité du cluster de couleur dominant, succès de résolution de la police déclarée, présence d'un logo net. Je proposerai une implémentation testable en Phase 2, mais je le signale ici pour qu'on soit d'accord sur les critères avant que je fixe les poids.
- **Algorithme de clustering des couleurs non spécifié.** "Pondérer par surface visible × proéminence" et "clusteriser les couleurs proches" sont des intentions, pas un algorithme. Proposition : k-means (ou clustering glouton par seuil deltaE) en espace Lab, poids = aire du bounding box en pixels, exclusion des couleurs à deltaE < seuil du gris neutre. Je documenterai le seuil choisi et je le fixerai via fixtures (§5 du spec) plutôt qu'à l'intuition.
- **`networkidle` peut ne jamais se déclencher.** Beaucoup de sites e-commerce ont des trackers/chats/scripts qui pollent en continu et empêchent `networkidle` d'arriver — c'est un piège classique de Playwright. Le timeout dur de 20s couvre le cas, mais je propose explicitement une stratégie en deux temps : `domcontentloaded` + attente fixe courte (~2-3s) comme condition principale, `networkidle` en best-effort avec un timeout propre plus court que le budget total, pour ne pas cramer les 20s sur un seul site bavard.
- **Matching Google Fonts non spécifié.** Comment on résout `getComputedStyle().fontFamily` vers une entrée du catalogue Google Fonts ? Proposition : correspondance de chaîne normalisée (casse, espaces) contre la liste des familles Google Fonts, sinon `googleFontMatch: null` et on s'appuie sur le `fallbackStack`. Pas de matching visuel/perceptuel en V1 — trop complexe pour la valeur ajoutée.
- **Détourage produit (fond blanc → transparence) : dépendance non choisie.** Ça implique soit une lib locale (ex. `rembg`, nécessite un runtime Python/ML), soit une API tierce payante (remove.bg). Conformément à la règle "pas de dépendance ajoutée sans demander", je te demande validation avant de choisir — et je propose de le sortir de la Phase 2/3 (extraction déterministe testable) pour le traiter en tâche séparée, potentiellement optionnelle en V1 si le produit brut est déjà correct dans la majorité des cas.
- **Risque produit/légal : l'outil d'extraction est public, gratuit et illimité (§10).** Tel que décrit, n'importe qui peut coller l'URL d'un concurrent (pas juste "sa propre boutique") et en extraire la DA, le logo, les photos produit et les avis clients. C'est un scraper ouvert exposé sans authentification. Je recommande, avant la mise en ligne de la landing (Phase 6) :
  - un rate-limit par IP sur l'endpoint d'analyse gratuite,
  - pas de persistance des résultats au-delà de la session tant que l'utilisateur n'a pas créé de compte / sauvegardé la marque,
  - une mention claire sur la landing indiquant que l'outil est destiné à l'analyse de sa propre boutique.
  Ce n'est pas bloquant pour les Phases 1-3 (CLI, pas de public), mais je voulais le signaler maintenant plutôt qu'à la Phase 6.

## 3. Module B — ConceptGenerator

- **Modèle LLM non choisi.** Le tableau §4 dit juste "Anthropic API (Claude)". Le budget total annoncé est "moins de 30 secondes" pour tout le pipeline (extraction + analyse + génération de concepts), donc le choix du modèle a un impact direct sur la latence et le coût unitaire. Proposition : un modèle rapide de la famille Claude (Haiku) pour cette tâche de structuration JSON — le raisonnement demandé est borné et le format est strict, pas besoin du modèle le plus puissant. À confirmer avec toi, notamment si la qualité des hooks générés déçoit en pratique.
- **Cas d'échec silencieux non couvert : contenu source trop pauvre.** Si l'extraction a une confiance très basse et peu de copy exploitable, que produit-on ? Le spec prévoit un retry sur échec de parsing Zod, mais pas de comportement défini si le LLM produit un JSON valide mais creux (hooks génériques faute de matière). À trancher au moment de la Phase 3, avec de vraies fixtures.

## 4. Module C — moteur de rendu

- **Le budget de perf annoncé (moins de 25s pour 8s de vidéo en 1080p) est optimiste avec l'approche "screenshot par frame".** 8s à 30fps = 240 frames. Un `page.screenshot()` coûte typiquement 50-150ms selon la complexité du DOM — rien que la capture peut représenter 12 à 36 secondes, avant l'encodage ffmpeg. Je ne propose pas de changer l'architecture (le spec est explicite : "on contrôle tout le pipeline", et le déterminisme via `page.clock` est une vraie exigence produit) mais je veux le dire clairement : **c'est le risque technique n°1 du produit**, et il doit être mesuré dès la Phase 1, sur du matériel représentatif du prod, avant qu'on s'engage sur ce chiffre auprès des clients. Si les mesures de la Phase 1 dépassent largement la cible, les leviers seront : capture à un framerate interne plus bas + interpolation ffmpeg (`minterpolate`), parallélisation de plusieurs contextes Playwright par job, ou en dernier recours l'API CDP de screencast plutôt que des screenshots un par un.
- **Déterminisme pixel-perfect à travers les environnements.** Le rendu des polices et l'anti-aliasing peuvent varier selon l'OS et la build de Chromium. Pour que "frame N produit toujours le même pixel" soit vrai en pratique (dev, CI, prod), il faut figer une image Docker avec une version de Chromium précise pour tous les rendus — pas seulement s'appuyer sur ce que Playwright installe localement. Je le mentionne car ce n'est pas explicite dans le spec et c'est facile à louper.
- **Emplacement du watermark (plan free) non précisé.** Proposition : l'intégrer comme un élément du template HTML (comme le reste), pour rester dans le pipeline déterministe, plutôt qu'un post-traitement ffmpeg séparé qui casserait la garantie "un seul pipeline de rendu".

## 5. Abonnements / quotas

Section globalement solide et déjà bien pensée (transaction à l'acceptation du job, remboursement sur échec interne, Stripe source de vérité, idempotence par `event.id`). Un point à trancher :

- **Changement de plan en cours de cycle.** Stripe gère la proration de facturation, mais notre table `usage` n'a pas de règle définie pour ce cas : est-ce que les crédits restants sont recalculés immédiatement au nouveau quota, ou est-ce qu'on attend le prochain renouvellement ? À définir avant la Phase 5, ce n'est pas complexe mais ça doit être un choix explicite et testé, pas un comportement accidentel du code.

## 6. Ce qui ne bloque rien pour l'instant

Les points ci-dessus ne bloquent pas le démarrage de la **Phase 1** (script CLI local, un seul template `kinetic-type`, pas de DB/web/auth/queue) puisqu'elle ne touche à aucune des décisions ouvertes. Je peux l'attaquer dès validation de cette revue.

---

## Décisions à valider avant de continuer

1. Confirmer **Inngest** pour la queue (ou dire si tu préfères BullMQ+Redis dès le départ pour une raison que je n'ai pas).
2. Confirmer **Better Auth** pour l'auth (Phase 4).
3. Confirmer le modèle LLM **Haiku** pour `ConceptGenerator` (Phase 3), avec possibilité de repasser sur un modèle plus capable si la qualité déçoit.
4. Confirmer si je démarre le détourage produit (background removal) en V1 ou si on le sort du périmètre initial — et si oui, avec quelle dépendance (lib locale vs API tierce payante).
5. Valider les garde-fous anti-abus (rate-limit, pas de persistance sans compte) sur l'outil d'analyse gratuit avant la Phase 6.

Aucune de ces réponses n'est requise pour lancer la Phase 1. Dis-moi si tu veux que j'enchaîne dessus maintenant.

---

## Journal des décisions prises en cours de route

- **Stripe est en mode live sur le compte connecté (`BroNote.ch`).** Avant de créer le moindre produit, j'ai vérifié le catalogue existant : il contient des produits sans rapport avec ADFORGE (packs de crédits façon blackjack), confirmant qu'il s'agit du compte Stripe d'un autre business existant de l'utilisateur, pas d'un compte dédié. J'ai arrêté et demandé confirmation avant de créer quoi que ce soit. Réponse : créer en mode live, sur ce compte. Fait — Products/Prices `ADFORGE Starter/Growth/Scale` (mensuel + annuel) existent maintenant dans ce compte live, aux côtés des produits de l'autre business. Aucun Checkout réel n'a été déclenché.
- **Supabase : projet créé (`adforge`, eu-central-1, tier gratuit, 0 CHF/mois).** RLS est désactivé sur les 7 tables par défaut (avertissement de sécurité de l'outil Supabase). Je ne l'ai pas activé moi-même : l'activer sans policies bloquerait tout accès, et l'app ne passe pas par supabase-js/la clé anon (connexion Postgres directe côté serveur uniquement), donc le risque d'exposition via l'API REST auto-générée de Supabase est faible dans l'architecture actuelle — mais à trancher explicitement avant que quoi que ce soit d'autre touche ce projet Supabase (ex: si on active un jour Supabase Auth ou le SDK client).
- **`DATABASE_URL` n'est pas récupérable via les outils MCP Supabase** (le mot de passe de la base n'est montré qu'une fois, dans le dashboard). Les tests d'intégration qui en ont besoin (`reserve-credit`, `handle-webhook`) sont donc gated sur la variable d'environnement et skippés dans cette session — la logique elle-même a été vérifiée en exécutant les séquences SQL équivalentes directement contre la vraie base via `execute_sql`.
- **Le Chromium fourni dans ce bac à sable ne sait pas décoder le H.264.** En testant la lecture réelle des vidéos de démo dans un `<video>`, Chromium renvoyait `DEMUXER_ERROR_NO_SUPPORTED_STREAMS` — j'ai d'abord soupçonné un bug de notre pipeline (moov atom en fin de fichier) et ajouté `-movflags +faststart` (change légitime, gardé), mais le vrai test décisif a été de lire un fichier VP9/WebM de test dans le même Chromium : lecture immédiate et parfaite. C'est le build Chromium open-source de Playwright, sans codecs propriétaires et sans accès réseau pour récupérer le composant OpenH264 — ça n'a rien à voir avec les fichiers produits par notre moteur (validés par ailleurs via `ffprobe` : H.264/yuv420p corrects). Un vrai Chrome/Edge/Safari, ou même ce Chromium avec accès réseau normal, décode le H.264 nativement. Je n'ai donc pas pu vérifier par capture d'écran que les vidéos de démo *se lisent* dans un navigateur — seulement qu'elles sont valides et strictement déterministes (`render-video.integration.test.ts`, hash MD5 identique sur deux rendus).
- **Refonte complète de la landing page et du template `kinetic-type`** (l'utilisateur a jugé la V1 « dégueulasse » et les animations « moches »). Nouveau système de design (typo `Space Grotesk` / `Inter` via `next/font/google`, nav sticky, hero avec glow, bandeau stats, section « comment ça marche », carrousel démos en cadre téléphone, comparatif, grille features, pricing avec badge « le plus choisi », FAQ en accordéon, CTA final). Côté template vidéo : accent souligné sous le hook, second disque flottant en parallax, nudge post-atterrissage du CTA. En ajoutant ce second disque, j'ai d'abord essayé un carré à bordure tourné (`rotate()` + `border`) — `render-video.integration.test.ts` a détecté une régression de déterminisme (hash MD5 différent) quand la suite tournait en parallèle avec les autres tests, alors qu'un run isolé passait. Diagnostic : arêtes diagonales anti-aliasées par le GPU, non stables au bit près sous charge — même famille de bug que le `radial-gradient()`/`blur()` documenté plus haut. Remplacé par un second disque (fill plat, `border-radius:50%`, translate+scale uniquement) : déterminisme revalidé sur 3 exécutions consécutives de la suite complète.
