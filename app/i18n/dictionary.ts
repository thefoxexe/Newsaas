export const LOCALES = ["en", "fr", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  de: "DE",
};

type Dictionary = {
  nav: { demos: string; how: string; pricing: string; signIn: string; cta: string };
  hero: {
    badge: string;
    title1: string;
    titleHighlight: string;
    title2: string;
    subtitle: string;
    inputPlaceholder: string;
    inputSubmit: string;
    inputSubmitting: string;
    inputHint: string;
    analyzing: string;
    failed: string;
    detected: string;
    ctaClaim: string;
    submitError: string;
  };
  stats: { time: string; timeLabel: string; concepts: string; conceptsLabel: string; formats: string; formatsLabel: string; deterministic: string; deterministicLabel: string };
  how: { eyebrow: string; title: string; steps: Array<{ title: string; body: string }> };
  demos: { eyebrow: string; title: string; subtitle: string };
  compare: { title: string; ugcTitle: string; ugcBody: string; usTitle: string; usBody: string };
  features: Array<{ title: string; body: string }>;
  pricing: { eyebrow: string; title: string; subtitle: string; popular: string; choose: string; taglines: Record<"starter" | "growth" | "scale", string>; perMonth: string; videosPerMonth: string; unlimitedBrands: string; brand: string; withWatermark: string; noWatermark: string; resolution: string };
  faq: { eyebrow: string; title: string; items: Array<{ q: string; a: string }> };
  finalCta: { title: string; body: string; button: string };
  footer: { rights: string; signIn: string };
  appNav: { library: string; brands: string; settings: string; signOut: string };
  generator: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    analyze: string;
    analyzing: string;
    extracting: string;
    failed: string;
    submitError: string;
    brandKitLabel: string;
    generateConcepts: string;
    regenerateConcepts: string;
    regenerateConceptsHint: string;
    generatingConcepts: string;
    renderPending: string;
    renderFailed: string;
    quotaAlert: string;
    queueFull: string;
    conceptsError: string;
    retry: string;
    onboardingTitle: string;
    onboardingBody: string;
    onboardingCta: string;
    customPromptBadge: string;
    customPromptPlaceholder: string;
    customPromptButton: string;
    templatePicker: {
      next: string;
      back: string;
      close: string;
      recommended: string;
      chooseTemplate: string;
      chooseFormat: string;
      names: Record<"dark-neon" | "light-gradient" | "color-blocks" | "editorial" | "split-duotone" | "unboxed", string>;
      descriptions: Record<"dark-neon" | "light-gradient" | "color-blocks" | "editorial" | "split-duotone" | "unboxed", string>;
    };
  };
  libraryPage: {
    title: string;
    empty: string;
    inProgress: string;
    failed: string;
    deleteButton: string;
    deleteConfirm: string;
  };
  authPages: {
    signInTitle: string;
    signUpTitle: string;
    name: string;
    email: string;
    password: string;
    signInButton: string;
    signUpButton: string;
    noAccount: string;
    hasAccount: string;
    checkEmailTitle: string;
    checkEmailBody: string;
    unexpectedError: string;
  };
  brandsPage: { title: string; empty: string };
  // Slim, reusable atomic labels shared by the settings plan-switch modal
  // and the (separate) onboarding plan-selection page — the standalone
  // /app/billing page these used to belong to no longer exists, this is
  // just what's still shared between the two remaining call sites.
  billingPage: {
    monthly: string;
    annual: string;
    checkoutError: string;
    manageError: string;
    videosPerMonth: string;
  };
  settingsPage: {
    title: string;
    name: string;
    email: string;
    signOut: string;
    deleteAccount: string;
    deleteWarning: string;
    confirmDelete: string;
    cancel: string;
    currentPlan: string;
    creditsUsed: string;
    renewsOn: string;
    freeBannerTitle: string;
    freeBannerBody: string;
    manageSubscriptionLink: string;
    modalTitle: string;
    modalSubtitle: string;
    topPlanMessage: string;
    downgradeLink: string;
    close: string;
  };
  onboardingPlanPage: {
    title: string;
    subtitle: string;
    continueFree: string;
  };
  brandsPageExtra: {
    addBusiness: string;
    addBusinessPlaceholder: string;
    limitReached: string;
    upgradeCta: string;
    searchPlaceholder: string;
    edit: string;
    delete: string;
    deleteConfirm: string;
    deleteLocked: string;
  };
  brandReviewPage: {
    title: string;
    subtitle: string;
    extracting: string;
    failedTitle: string;
    failedBody: string;
    nameLabel: string;
    taglineLabel: string;
    servicesLabel: string;
    addService: string;
    removeService: string;
    logoLabel: string;
    save: string;
    saving: string;
    limitReached: string;
    upgradeCta: string;
    genericError: string;
  };
};

export const DICTIONARY: Record<Locale, Dictionary> = {
  en: {
    nav: { demos: "Demos", how: "How it works", pricing: "Pricing", signIn: "Sign in", cta: "Try it free" },
    hero: {
      badge: "Deterministic render engine — no random AI generation",
      title1: "Paste your store's URL.",
      titleHighlight: "5 video ads",
      title2: "in 30 seconds.",
      subtitle:
        "ReelJolt extracts your real brand identity and composes motion-design ads ready for Meta, TikTok, and YouTube. No brief to write, no AI avatar.",
      inputPlaceholder: "https://your-store.com",
      inputSubmit: "Analyze for free",
      inputSubmitting: "Analyzing...",
      inputHint: "No credit card required · results in seconds",
      analyzing: "Analyzing your brand identity...",
      failed: "We couldn't analyze this site. Try another URL, or create an account to fix the brand kit by hand.",
      detected: "Brand identity detected for",
      ctaClaim: "See my 5 ads — create an account",
      submitError: "Something went wrong. Check your connection and try again.",
    },
    stats: {
      time: "30s",
      timeLabel: "per generation",
      concepts: "5",
      conceptsLabel: "concepts / URL",
      formats: "3",
      formatsLabel: "native formats",
      deterministic: "100%",
      deterministicLabel: "deterministic",
    },
    how: {
      eyebrow: "How it works",
      title: "From URL to ad, no brief needed",
      steps: [
        { title: "Paste your URL", body: "We scrape your store live: logo, palette, typography, product photos, positioning." },
        { title: "We compose 5 concepts", body: "Claude generates 5 distinct ad angles from your real brand identity." },
        { title: "Video render in 30s", body: "Our motion-design engine animates every concept into an MP4 ready for Meta, TikTok, YouTube." },
      ],
    },
    demos: {
      eyebrow: "Real output from the engine",
      title: "No mockups. No stock footage.",
      subtitle:
        "Different industries, different brand identities — every ad below is a file produced by the real pipeline, untouched.",
    },
    compare: {
      title: "Motion design, not AI avatars",
      ugcTitle: "UGC tools (Creatify, Arcads, AdCreative…)",
      ugcBody: "Generate fake humans talking to a camera. It's saturated, and audiences spot it in a second.",
      usTitle: "Our approach",
      usBody:
        "Composed with your real typography, real colors, real product photos — animated by our engine. Deterministic, reproducible, never glitchy.",
    },
    features: [
      { title: "100% real brand identity", body: "Your colors, your typography, your product photos — never a generic template." },
      { title: "Deterministic render", body: "Same input, same video, down to the byte. Reproducible, auditable, no surprises." },
      { title: "Zero AI avatars", body: "Pure motion design: animated typography, shapes, transitions. No synthetic face glitching out." },
      { title: "3 native formats", body: "9:16, 1:1, 16:9 generated directly — no rough after-the-fact cropping." },
    ],
    pricing: {
      eyebrow: "Pricing",
      title: "A plan for every pace",
      subtitle: "Annual = 2 months free. Free plan: 3 videos/month, free, no card required.",
      popular: "Most popular",
      choose: "Choose",
      taglines: { starter: "Test the channel", growth: "Most popular", scale: "Scale your acquisition" },
      perMonth: "/ month",
      videosPerMonth: "videos / month",
      unlimitedBrands: "Unlimited brands",
      brand: "brand(s)",
      withWatermark: "With watermark",
      noWatermark: "No watermark",
      resolution: "resolution",
    },
    faq: {
      eyebrow: "Frequently asked questions",
      title: "Everything you need to know",
      items: [
        {
          q: "Does it work with any store?",
          a: "Yes, as long as the URL is public. We extract the logo, dominant colors, typography, and product photos automatically — you can fix anything by hand afterward.",
        },
        {
          q: "Are the videos really ready to publish?",
          a: "Yes: H.264, faststart, native 9:16 / 1:1 / 16:9 formats. Download and publish straight to Meta Ads, TikTok Ads, or YouTube.",
        },
        {
          q: "Why no talking AI avatar?",
          a: "Because feeds are already saturated with them and audiences spot them instantly. We bet on clean motion design built on your real brand identity instead.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Yes, anytime from the Stripe billing portal built into your account — no email required.",
        },
      ],
    },
    finalCta: {
      title: "Ready to see your 5 ads?",
      body: "Paste your store's URL at the top of the page, or create an account directly — 3 free videos, no credit card.",
      button: "Try it free",
    },
    footer: { rights: "All rights reserved.", signIn: "Sign in" },
    appNav: {
      library: "Library",
      brands: "Brands",
      settings: "Settings",
      signOut: "Sign out",
    },
    generator: {
      title: "Generator",
      subtitle: "Paste a URL, validate the brand identity, pick your concepts, launch the render.",
      inputPlaceholder: "https://your-store.com",
      analyze: "Analyze",
      analyzing: "Analyzing...",
      extracting: "Analyzing your brand identity...",
      failed: "The analysis failed for this brand.",
      submitError: "Something went wrong submitting this URL. Check your connection and try again.",
      brandKitLabel: "Brand identity",
      generateConcepts: "Generate 5 concepts",
      regenerateConcepts: "Regenerate 5 concepts",
      regenerateConceptsHint: "Old concepts you haven't rendered a finished video from yet will be replaced.",
      generatingConcepts: "Generating...",
      renderPending: "Rendering...",
      renderFailed: "The render failed.",
      quotaAlert: "Can't launch this render (quota reached?)",
      queueFull: "Render queue is full right now — try again in a few minutes.",
      conceptsError: "Couldn't generate concepts. Try again.",
      retry: "Retry",
      onboardingTitle: "Your 5 ads are ready.",
      onboardingBody: "Pick a plan to render them in full HD, without watermark, and unlock more videos every month.",
      onboardingCta: "See plans",
      customPromptBadge: "Coming soon",
      customPromptPlaceholder: "Describe a specific angle you want the AI to focus on...",
      customPromptButton: "Generate with this angle",
      templatePicker: {
        next: "Next",
        back: "Back",
        close: "Close",
        recommended: "Recommended",
        chooseTemplate: "Pick a design",
        chooseFormat: "Pick a format",
        names: {
          "dark-neon": "Dark neon",
          "light-gradient": "Light gradient",
          "color-blocks": "Color blocks",
          editorial: "Editorial",
          "split-duotone": "Split duotone",
          unboxed: "Unboxed",
        },
        descriptions: {
          "dark-neon": "Bold dark scenes with a punchy accent color, one word at a time.",
          "light-gradient": "Soft light scenes with a floating product card, clean and premium.",
          "color-blocks": "Every scene in its own bold flat color, marker-style highlights.",
          editorial: "Left-aligned, restrained typography, italic emphasis — a magazine feel.",
          "split-duotone": "Screen split into two fixed color zones, bracketed keyword tags.",
          unboxed: "Full-bleed product photo, ticket-style price tag, kraft-paper tones.",
        },
      },
    },
    libraryPage: {
      title: "Library",
      empty: "No videos generated yet.",
      inProgress: "In progress...",
      failed: "Render failed",
      deleteButton: "Delete",
      deleteConfirm: "Delete this render?",
    },
    authPages: {
      signInTitle: "Sign in",
      signUpTitle: "Create your account",
      name: "Name",
      email: "Email",
      password: "Password",
      signInButton: "Sign in",
      signUpButton: "Create my account",
      noAccount: "No account yet?",
      hasAccount: "Already have an account?",
      checkEmailTitle: "Check your inbox",
      checkEmailBody: "We sent a confirmation link to",
      unexpectedError: "Something went wrong. Please try again.",
    },
    brandsPage: { title: "Brands", empty: "No brand saved yet." },
    billingPage: {
      monthly: "Monthly",
      annual: "Annual",
      checkoutError: "Couldn't start checkout. Try again in a moment.",
      manageError: "No Stripe subscription to manage yet.",
      videosPerMonth: "videos/month",
    },
    settingsPage: {
      title: "Settings",
      name: "Name",
      email: "Email",
      signOut: "Sign out",
      deleteAccount: "Delete my account",
      deleteWarning: "This action is permanent.",
      confirmDelete: "Confirm deletion",
      cancel: "Cancel",
      currentPlan: "Current plan",
      creditsUsed: "credits used this month",
      renewsOn: "Renews on",
      freeBannerTitle: "You're on the free plan.",
      freeBannerBody: "1 video/month, 1 business, watermarked.",
      manageSubscriptionLink: "Manage subscription",
      modalTitle: "Upgrade your plan",
      modalSubtitle: "More videos, more businesses, no watermark.",
      topPlanMessage: "You're already on our top plan.",
      downgradeLink: "Back to the free plan",
      close: "Close",
    },
    onboardingPlanPage: {
      title: "Choose your plan",
      subtitle: "Pick the plan that fits how many businesses you'll be creating ads for.",
      continueFree: "Continue with the free plan (1 video/month, 1 business, watermarked)",
    },
    brandsPageExtra: {
      addBusiness: "Add a business",
      addBusinessPlaceholder: "https://your-store.com",
      limitReached: "You've reached your plan's business limit.",
      upgradeCta: "Upgrade to add more businesses",
      searchPlaceholder: "Search your businesses...",
      edit: "Edit",
      delete: "Delete",
      deleteConfirm: "Delete this business? Its concepts and rendered videos will be deleted too.",
      deleteLocked: "Your plan allows 1 business, which can't be deleted or swapped. Upgrade to manage several.",
    },
    brandReviewPage: {
      title: "Review your business",
      subtitle: "Check what we found, fix anything that's missing, then save it.",
      extracting: "Analyzing your brand identity...",
      failedTitle: "The analysis didn't work for this URL.",
      failedBody: "No problem — fill in what you can by hand below.",
      nameLabel: "Business name",
      taglineLabel: "Tagline / context",
      servicesLabel: "Services",
      addService: "Add a service",
      removeService: "Remove",
      logoLabel: "Logo URL",
      save: "Save business",
      saving: "Saving...",
      limitReached: "You've reached your plan's business limit.",
      upgradeCta: "Upgrade to add more businesses",
      genericError: "Something went wrong saving this business. Try again.",
    },
  },
  fr: {
    nav: { demos: "Démos", how: "Comment ça marche", pricing: "Tarifs", signIn: "Se connecter", cta: "Essayer gratuitement" },
    hero: {
      badge: "Moteur de rendu déterministe — pas de génération IA aléatoire",
      title1: "Colle l'URL de ta boutique.",
      titleHighlight: "5 pubs vidéo",
      title2: "en 30 secondes.",
      subtitle:
        "ReelJolt extrait ta direction artistique réelle et compose des pubs motion-design prêtes pour Meta, TikTok et YouTube. Zéro brief à écrire, zéro avatar IA.",
      inputPlaceholder: "https://ta-boutique.com",
      inputSubmit: "Analyser gratuitement",
      inputSubmitting: "Analyse...",
      inputHint: "Aucune carte bancaire requise · résultat en quelques secondes",
      analyzing: "Analyse de la direction artistique en cours...",
      failed: "On n'a pas réussi à analyser ce site. Réessaie avec une autre URL, ou crée un compte pour corriger la DA à la main.",
      detected: "Direction artistique détectée pour",
      ctaClaim: "Voir mes 5 pubs — créer un compte",
      submitError: "Un problème est survenu. Vérifie ta connexion et réessaie.",
    },
    stats: {
      time: "30s",
      timeLabel: "par génération",
      concepts: "5",
      conceptsLabel: "concepts / URL",
      formats: "3",
      formatsLabel: "formats natifs",
      deterministic: "100%",
      deterministicLabel: "déterministe",
    },
    how: {
      eyebrow: "Comment ça marche",
      title: "De l'URL à la pub, sans brief",
      steps: [
        { title: "Colle ton URL", body: "On scrape ta boutique en live : logo, palette, typo, photos produit, positionnement." },
        { title: "On compose 5 concepts", body: "Claude génère 5 angles publicitaires distincts à partir de ta vraie direction artistique." },
        { title: "Rendu vidéo en 30s", body: "Notre moteur motion-design anime chaque concept en MP4 prêt pour Meta, TikTok, YouTube." },
      ],
    },
    demos: {
      eyebrow: "Sorties réelles du moteur",
      title: "Pas de mockup. Pas de vidéo stock.",
      subtitle:
        "Trois secteurs, trois directions artistiques différentes — chaque pub ci-dessous est un fichier produit par le pipeline réel, telle quelle.",
    },
    compare: {
      title: "Motion design, pas des avatars IA",
      ugcTitle: "Outils UGC (Creatify, Arcads, AdCreative…)",
      ugcBody: "Génèrent de faux humains qui parlent devant une caméra. C'est saturé, et l'audience le reconnaît en une seconde.",
      usTitle: "Notre approche",
      usBody:
        "Compose avec ta vraie typo, tes vraies couleurs, tes vraies photos produit — animées par notre moteur. Déterministe, reproductible, ça ne bave jamais.",
    },
    features: [
      { title: "DA 100% réelle", body: "Tes couleurs, ta typo, tes photos produit — jamais un template générique." },
      { title: "Rendu déterministe", body: "Même input, même vidéo, au byte près. Reproductible, auditable, sans surprise." },
      { title: "Zéro avatar IA", body: "Motion design pur : typographie animée, formes, transitions. Pas de visage synthétique qui bave." },
      { title: "3 formats natifs", body: "9:16, 1:1, 16:9 générés directement — pas de recadrage approximatif après coup." },
    ],
    pricing: {
      eyebrow: "Tarifs",
      title: "Un plan pour chaque cadence",
      subtitle: "Annuel = 2 mois offerts. Plan Free : 3 vidéos/mois, gratuit, sans carte.",
      popular: "Le plus choisi",
      choose: "Choisir",
      taglines: { starter: "Pour tester le canal", growth: "Le plus choisi", scale: "Pour scaler l'acquisition" },
      perMonth: "/ mois",
      videosPerMonth: "vidéos / mois",
      unlimitedBrands: "Marques illimitées",
      brand: "marque(s)",
      withWatermark: "Avec filigrane",
      noWatermark: "Sans filigrane",
      resolution: "Résolution",
    },
    faq: {
      eyebrow: "Questions fréquentes",
      title: "Tout ce qu'il faut savoir",
      items: [
        {
          q: "Est-ce que ça marche avec n'importe quelle boutique ?",
          a: "Oui, tant que l'URL est publique. On extrait le logo, les couleurs dominantes, la typo et les photos produit automatiquement — tu peux tout corriger à la main ensuite.",
        },
        {
          q: "Les vidéos sont-elles vraiment prêtes à publier ?",
          a: "Oui : H.264, faststart, formats natifs 9:16 / 1:1 / 16:9. Tu télécharges et tu publies directement sur Meta Ads, TikTok Ads ou YouTube.",
        },
        {
          q: "Pourquoi pas d'avatar IA qui parle ?",
          a: "Parce que ça sature déjà les feeds et que ça se reconnaît en une seconde. On mise sur du motion design propre, construit sur ta vraie identité de marque.",
        },
        {
          q: "Je peux annuler quand je veux ?",
          a: "Oui, à tout moment depuis le portail de facturation Stripe intégré à ton compte, sans email à envoyer.",
        },
      ],
    },
    finalCta: {
      title: "Prêt à voir tes 5 pubs ?",
      body: "Colle l'URL de ta boutique en haut de page, ou crée un compte directement — 3 vidéos gratuites, sans carte bancaire.",
      button: "Essayer gratuitement",
    },
    footer: { rights: "Tous droits réservés.", signIn: "Se connecter" },
    appNav: {
      library: "Bibliothèque",
      brands: "Marques",
      settings: "Réglages",
      signOut: "Se déconnecter",
    },
    generator: {
      title: "Générateur",
      subtitle: "Colle une URL, valide la DA, choisis tes concepts, lance le rendu.",
      inputPlaceholder: "https://ta-boutique.com",
      analyze: "Analyser",
      analyzing: "Analyse...",
      extracting: "Analyse de la direction artistique en cours...",
      failed: "L'analyse a échoué pour cette marque.",
      submitError: "Un problème est survenu en envoyant cette URL. Vérifie ta connexion et réessaie.",
      brandKitLabel: "Direction artistique",
      generateConcepts: "Générer 5 concepts",
      regenerateConcepts: "Régénérer 5 concepts",
      regenerateConceptsHint: "Les anciens concepts sans vidéo terminée seront remplacés.",
      generatingConcepts: "Génération...",
      renderPending: "Rendu en cours...",
      renderFailed: "Le rendu a échoué.",
      quotaAlert: "Impossible de lancer ce rendu (quota atteint ?)",
      queueFull: "La file d'attente est pleine — réessaie dans quelques minutes.",
      conceptsError: "Impossible de générer les concepts. Réessaie.",
      retry: "Réessayer",
      onboardingTitle: "Tes 5 pubs sont prêtes.",
      onboardingBody: "Choisis un plan pour les rendre en HD, sans filigrane, et débloquer plus de vidéos chaque mois.",
      onboardingCta: "Voir les plans",
      customPromptBadge: "Bientôt disponible",
      customPromptPlaceholder: "Décris un angle spécifique à mettre en avant...",
      customPromptButton: "Générer avec cet angle",
      templatePicker: {
        next: "Suivant",
        back: "Retour",
        close: "Fermer",
        recommended: "Recommandé",
        chooseTemplate: "Choisis un style",
        chooseFormat: "Choisis un format",
        names: {
          "dark-neon": "Sombre néon",
          "light-gradient": "Clair dégradé",
          "color-blocks": "Aplats de couleur",
          editorial: "Éditorial",
          "split-duotone": "Duotone divisé",
          unboxed: "Déballage",
        },
        descriptions: {
          "dark-neon": "Scènes sombres percutantes, un mot en couleur à la fois.",
          "light-gradient": "Scènes claires en douceur, carte produit flottante, épuré et premium.",
          "color-blocks": "Chaque scène dans son propre aplat de couleur, mots surlignés au marqueur.",
          editorial: "Aligné à gauche, typographie sobre, accent en italique — esprit magazine.",
          "split-duotone": "Écran divisé en deux zones de couleur fixes, mots-clés entre crochets.",
          unboxed: "Photo produit plein cadre, étiquette de prix façon ticket, tons papier kraft.",
        },
      },
    },
    libraryPage: {
      title: "Bibliothèque",
      empty: "Aucune vidéo générée pour l'instant.",
      inProgress: "En cours...",
      failed: "Échec du rendu",
      deleteButton: "Supprimer",
      deleteConfirm: "Supprimer ce rendu ?",
    },
    authPages: {
      signInTitle: "Se connecter",
      signUpTitle: "Créer ton compte",
      name: "Nom",
      email: "Email",
      password: "Mot de passe",
      signInButton: "Se connecter",
      signUpButton: "Créer mon compte",
      noAccount: "Pas encore de compte ?",
      hasAccount: "Déjà un compte ?",
      checkEmailTitle: "Vérifie ta boîte mail",
      checkEmailBody: "On a envoyé un lien de confirmation à",
      unexpectedError: "Une erreur inattendue est survenue. Réessaie.",
    },
    brandsPage: { title: "Marques", empty: "Aucune marque enregistrée pour l'instant." },
    billingPage: {
      monthly: "Mensuel",
      annual: "Annuel",
      checkoutError: "Impossible de lancer le paiement. Réessaie dans un instant.",
      manageError: "Aucun abonnement Stripe à gérer pour l'instant.",
      videosPerMonth: "vidéos/mois",
    },
    settingsPage: {
      title: "Réglages",
      name: "Nom",
      email: "Email",
      signOut: "Se déconnecter",
      deleteAccount: "Supprimer mon compte",
      deleteWarning: "Cette action est définitive.",
      confirmDelete: "Confirmer la suppression",
      cancel: "Annuler",
      currentPlan: "Plan actuel",
      creditsUsed: "crédits utilisés ce mois",
      renewsOn: "Renouvellement le",
      freeBannerTitle: "Tu es sur le plan gratuit.",
      freeBannerBody: "1 vidéo/mois, 1 entreprise, avec filigrane.",
      manageSubscriptionLink: "Gérer l'abonnement",
      modalTitle: "Passer à un plan supérieur",
      modalSubtitle: "Plus de vidéos, plus d'entreprises, sans filigrane.",
      topPlanMessage: "Tu es déjà sur notre plan le plus complet.",
      downgradeLink: "Revenir au plan gratuit",
      close: "Fermer",
    },
    onboardingPlanPage: {
      title: "Choisis ton plan",
      subtitle: "Choisis le plan adapté au nombre d'entreprises pour lesquelles tu vas créer des pubs.",
      continueFree: "Continuer avec le plan gratuit (1 vidéo/mois, 1 entreprise, avec filigrane)",
    },
    brandsPageExtra: {
      addBusiness: "Ajouter une entreprise",
      addBusinessPlaceholder: "https://ta-boutique.com",
      limitReached: "Tu as atteint la limite d'entreprises de ton plan.",
      upgradeCta: "Passer à un plan supérieur pour en ajouter",
      searchPlaceholder: "Rechercher tes entreprises...",
      edit: "Modifier",
      delete: "Supprimer",
      deleteConfirm: "Supprimer cette entreprise ? Ses concepts et vidéos rendues seront aussi supprimés.",
      deleteLocked: "Ton plan autorise 1 entreprise, qui ne peut être ni supprimée ni remplacée. Passe à un plan supérieur pour en gérer plusieurs.",
    },
    brandReviewPage: {
      title: "Vérifie ton entreprise",
      subtitle: "Vérifie ce qu'on a trouvé, corrige ce qui manque, puis enregistre.",
      extracting: "Analyse de la direction artistique en cours...",
      failedTitle: "L'analyse n'a pas fonctionné pour cette URL.",
      failedBody: "Pas de souci — remplis ce que tu peux à la main ci-dessous.",
      nameLabel: "Nom de l'entreprise",
      taglineLabel: "Slogan / contexte",
      servicesLabel: "Services",
      addService: "Ajouter un service",
      removeService: "Retirer",
      logoLabel: "URL du logo",
      save: "Enregistrer l'entreprise",
      saving: "Enregistrement...",
      limitReached: "Tu as atteint la limite d'entreprises de ton plan.",
      upgradeCta: "Passer à un plan supérieur pour en ajouter",
      genericError: "Un problème est survenu en enregistrant cette entreprise. Réessaie.",
    },
  },
  de: {
    nav: { demos: "Demos", how: "So funktioniert's", pricing: "Preise", signIn: "Anmelden", cta: "Kostenlos testen" },
    hero: {
      badge: "Deterministische Render-Engine — keine zufällige KI-Generierung",
      title1: "Füge die URL deines Shops ein.",
      titleHighlight: "5 Video-Ads",
      title2: "in 30 Sekunden.",
      subtitle:
        "ReelJolt extrahiert deine echte Markenidentität und erstellt Motion-Design-Ads für Meta, TikTok und YouTube. Kein Briefing, kein KI-Avatar.",
      inputPlaceholder: "https://dein-shop.com",
      inputSubmit: "Kostenlos analysieren",
      inputSubmitting: "Analyse läuft...",
      inputHint: "Keine Kreditkarte nötig · Ergebnis in Sekunden",
      analyzing: "Markenidentität wird analysiert...",
      failed: "Diese Seite konnte nicht analysiert werden. Versuch eine andere URL oder erstelle ein Konto, um das Brand Kit manuell anzupassen.",
      detected: "Markenidentität erkannt für",
      ctaClaim: "Meine 5 Ads ansehen — Konto erstellen",
      submitError: "Etwas ist schiefgelaufen. Prüfe deine Verbindung und versuch es erneut.",
    },
    stats: {
      time: "30s",
      timeLabel: "pro Generierung",
      concepts: "5",
      conceptsLabel: "Konzepte / URL",
      formats: "3",
      formatsLabel: "native Formate",
      deterministic: "100%",
      deterministicLabel: "deterministisch",
    },
    how: {
      eyebrow: "So funktioniert's",
      title: "Von der URL zur Anzeige, ganz ohne Briefing",
      steps: [
        { title: "URL einfügen", body: "Wir scannen deinen Shop live: Logo, Farbpalette, Typografie, Produktfotos, Positionierung." },
        { title: "5 Konzepte entstehen", body: "Claude generiert 5 unterschiedliche Werbewinkel aus deiner echten Markenidentität." },
        { title: "Video-Render in 30s", body: "Unsere Motion-Design-Engine animiert jedes Konzept zu einem MP4, bereit für Meta, TikTok, YouTube." },
      ],
    },
    demos: {
      eyebrow: "Echte Ausgaben der Engine",
      title: "Keine Mockups. Kein Stock-Material.",
      subtitle:
        "Verschiedene Branchen, verschiedene Markenidentitäten — jede Anzeige unten ist eine Datei aus der echten Pipeline, unverändert.",
    },
    compare: {
      title: "Motion Design, keine KI-Avatare",
      ugcTitle: "UGC-Tools (Creatify, Arcads, AdCreative…)",
      ugcBody: "Erzeugen gefälschte Menschen, die vor einer Kamera sprechen. Das ist gesättigt und wird sofort erkannt.",
      usTitle: "Unser Ansatz",
      usBody:
        "Zusammengestellt mit deiner echten Typografie, echten Farben, echten Produktfotos — animiert von unserer Engine. Deterministisch, reproduzierbar, nie fehlerhaft.",
    },
    features: [
      { title: "100% echte Markenidentität", body: "Deine Farben, deine Typografie, deine Produktfotos — nie eine generische Vorlage." },
      { title: "Deterministisches Rendering", body: "Gleicher Input, gleiches Video, bis aufs Byte. Reproduzierbar, prüfbar, keine Überraschungen." },
      { title: "Null KI-Avatare", body: "Reines Motion Design: animierte Typografie, Formen, Übergänge. Kein synthetisches Gesicht, das ruckelt." },
      { title: "3 native Formate", body: "9:16, 1:1, 16:9 direkt generiert — kein grobes Zuschneiden im Nachhinein." },
    ],
    pricing: {
      eyebrow: "Preise",
      title: "Ein Plan für jedes Tempo",
      subtitle: "Jährlich = 2 Monate gratis. Free-Plan: 3 Videos/Monat, kostenlos, keine Karte nötig.",
      popular: "Am beliebtesten",
      choose: "Wählen",
      taglines: { starter: "Den Kanal testen", growth: "Am beliebtesten", scale: "Akquise skalieren" },
      perMonth: "/ Monat",
      videosPerMonth: "Videos / Monat",
      unlimitedBrands: "Unbegrenzte Marken",
      brand: "Marke(n)",
      withWatermark: "Mit Wasserzeichen",
      noWatermark: "Ohne Wasserzeichen",
      resolution: "Auflösung",
    },
    faq: {
      eyebrow: "Häufige Fragen",
      title: "Alles, was du wissen musst",
      items: [
        {
          q: "Funktioniert das mit jedem Shop?",
          a: "Ja, solange die URL öffentlich ist. Wir extrahieren automatisch Logo, dominante Farben, Typografie und Produktfotos — danach kannst du alles manuell anpassen.",
        },
        {
          q: "Sind die Videos wirklich veröffentlichungsbereit?",
          a: "Ja: H.264, Faststart, native Formate 9:16 / 1:1 / 16:9. Herunterladen und direkt bei Meta Ads, TikTok Ads oder YouTube veröffentlichen.",
        },
        {
          q: "Warum kein sprechender KI-Avatar?",
          a: "Weil Feeds davon schon überfüllt sind und das sofort erkannt wird. Wir setzen stattdessen auf sauberes Motion Design auf Basis deiner echten Markenidentität.",
        },
        {
          q: "Kann ich jederzeit kündigen?",
          a: "Ja, jederzeit über das in dein Konto integrierte Stripe-Kundenportal — keine E-Mail nötig.",
        },
      ],
    },
    finalCta: {
      title: "Bereit für deine 5 Ads?",
      body: "Füge die URL deines Shops oben ein oder erstelle direkt ein Konto — 3 kostenlose Videos, keine Kreditkarte.",
      button: "Kostenlos testen",
    },
    footer: { rights: "Alle Rechte vorbehalten.", signIn: "Anmelden" },
    appNav: {
      library: "Bibliothek",
      brands: "Marken",
      settings: "Einstellungen",
      signOut: "Abmelden",
    },
    generator: {
      title: "Generator",
      subtitle: "URL einfügen, Markenidentität prüfen, Konzepte wählen, Rendering starten.",
      inputPlaceholder: "https://dein-shop.com",
      analyze: "Analysieren",
      analyzing: "Analyse läuft...",
      extracting: "Markenidentität wird analysiert...",
      failed: "Die Analyse ist für diese Marke fehlgeschlagen.",
      submitError: "Beim Senden dieser URL ist etwas schiefgelaufen. Prüfe deine Verbindung und versuch es erneut.",
      brandKitLabel: "Markenidentität",
      generateConcepts: "5 Konzepte generieren",
      regenerateConcepts: "5 Konzepte neu generieren",
      regenerateConceptsHint: "Alte Konzepte ohne fertiges Video werden ersetzt.",
      generatingConcepts: "Generierung läuft...",
      renderPending: "Rendering läuft...",
      renderFailed: "Das Rendering ist fehlgeschlagen.",
      quotaAlert: "Dieses Rendering kann nicht gestartet werden (Kontingent erreicht?)",
      queueFull: "Die Render-Warteschlange ist gerade voll — versuche es in ein paar Minuten erneut.",
      conceptsError: "Konzepte konnten nicht generiert werden. Versuch es erneut.",
      retry: "Erneut versuchen",
      onboardingTitle: "Deine 5 Ads sind fertig.",
      onboardingBody: "Wähle einen Plan, um sie in HD ohne Wasserzeichen zu rendern und jeden Monat mehr Videos freizuschalten.",
      onboardingCta: "Pläne ansehen",
      customPromptBadge: "Demnächst verfügbar",
      customPromptPlaceholder: "Beschreibe einen bestimmten Winkel, auf den die KI sich konzentrieren soll...",
      customPromptButton: "Mit diesem Winkel generieren",
      templatePicker: {
        next: "Weiter",
        back: "Zurück",
        close: "Schließen",
        recommended: "Empfohlen",
        chooseTemplate: "Design wählen",
        chooseFormat: "Format wählen",
        names: {
          "dark-neon": "Dunkel neon",
          "light-gradient": "Hell verlauf",
          "color-blocks": "Farbblöcke",
          editorial: "Editorial",
          "split-duotone": "Geteilt duoton",
          unboxed: "Ausgepackt",
        },
        descriptions: {
          "dark-neon": "Wirkungsvolle dunkle Szenen, ein Wort nach dem anderen in Akzentfarbe.",
          "light-gradient": "Sanfte helle Szenen mit schwebender Produktkarte, clean und hochwertig.",
          "color-blocks": "Jede Szene in ihrer eigenen kräftigen Farbe, Textmarker-Hervorhebung.",
          editorial: "Linksbündig, zurückhaltende Typografie, Betonung kursiv — Magazin-Gefühl.",
          "split-duotone": "Bildschirm in zwei feste Farbzonen geteilt, Schlüsselwörter in Klammern.",
          unboxed: "Produktfoto randlos im Hintergrund, Preisschild im Ticket-Stil, Kraftpapier-Töne.",
        },
      },
    },
    libraryPage: {
      title: "Bibliothek",
      empty: "Noch keine Videos generiert.",
      inProgress: "Läuft...",
      failed: "Rendering fehlgeschlagen",
      deleteButton: "Löschen",
      deleteConfirm: "Diesen Render löschen?",
    },
    authPages: {
      signInTitle: "Anmelden",
      signUpTitle: "Konto erstellen",
      name: "Name",
      email: "E-Mail",
      password: "Passwort",
      signInButton: "Anmelden",
      signUpButton: "Konto erstellen",
      noAccount: "Noch kein Konto?",
      hasAccount: "Schon ein Konto?",
      checkEmailTitle: "Prüfe dein Postfach",
      checkEmailBody: "Wir haben einen Bestätigungslink gesendet an",
      unexpectedError: "Etwas ist schiefgelaufen. Versuch es erneut.",
    },
    brandsPage: { title: "Marken", empty: "Noch keine Marke gespeichert." },
    billingPage: {
      monthly: "Monatlich",
      annual: "Jährlich",
      checkoutError: "Zahlung konnte nicht gestartet werden. Versuch es gleich nochmal.",
      manageError: "Noch kein Stripe-Abo zum Verwalten.",
      videosPerMonth: "Videos/Monat",
    },
    settingsPage: {
      title: "Einstellungen",
      name: "Name",
      email: "E-Mail",
      signOut: "Abmelden",
      deleteAccount: "Konto löschen",
      deleteWarning: "Diese Aktion ist endgültig.",
      confirmDelete: "Löschung bestätigen",
      cancel: "Abbrechen",
      currentPlan: "Aktueller Plan",
      creditsUsed: "Credits diesen Monat verwendet",
      renewsOn: "Verlängerung am",
      freeBannerTitle: "Du bist im kostenlosen Plan.",
      freeBannerBody: "1 Video/Monat, 1 Unternehmen, mit Wasserzeichen.",
      manageSubscriptionLink: "Abo verwalten",
      modalTitle: "Upgrade deinen Plan",
      modalSubtitle: "Mehr Videos, mehr Unternehmen, kein Wasserzeichen.",
      topPlanMessage: "Du bist bereits auf unserem besten Plan.",
      downgradeLink: "Zurück zum kostenlosen Plan",
      close: "Schließen",
    },
    onboardingPlanPage: {
      title: "Wähle deinen Plan",
      subtitle: "Wähle den Plan passend zur Anzahl der Unternehmen, für die du Ads erstellen wirst.",
      continueFree: "Mit dem kostenlosen Plan fortfahren (1 Video/Monat, 1 Unternehmen, mit Wasserzeichen)",
    },
    brandsPageExtra: {
      addBusiness: "Unternehmen hinzufügen",
      addBusinessPlaceholder: "https://dein-shop.com",
      limitReached: "Du hast das Unternehmenslimit deines Plans erreicht.",
      upgradeCta: "Upgrade, um mehr Unternehmen hinzuzufügen",
      searchPlaceholder: "Deine Unternehmen durchsuchen...",
      edit: "Bearbeiten",
      delete: "Löschen",
      deleteConfirm: "Dieses Unternehmen löschen? Seine Konzepte und gerenderten Videos werden ebenfalls gelöscht.",
      deleteLocked: "Dein Plan erlaubt 1 Unternehmen, das weder gelöscht noch ausgetauscht werden kann. Upgrade, um mehrere zu verwalten.",
    },
    brandReviewPage: {
      title: "Überprüfe dein Unternehmen",
      subtitle: "Prüfe, was wir gefunden haben, korrigiere Fehlendes und speichere dann.",
      extracting: "Markenidentität wird analysiert...",
      failedTitle: "Die Analyse hat für diese URL nicht funktioniert.",
      failedBody: "Kein Problem — fülle unten aus, was du kannst, von Hand.",
      nameLabel: "Unternehmensname",
      taglineLabel: "Slogan / Kontext",
      servicesLabel: "Dienstleistungen",
      addService: "Dienstleistung hinzufügen",
      removeService: "Entfernen",
      logoLabel: "Logo-URL",
      save: "Unternehmen speichern",
      saving: "Speichern...",
      limitReached: "Du hast das Unternehmenslimit deines Plans erreicht.",
      upgradeCta: "Upgrade, um mehr Unternehmen hinzuzufügen",
      genericError: "Beim Speichern dieses Unternehmens ist etwas schiefgelaufen. Versuch es erneut.",
    },
  },
};
