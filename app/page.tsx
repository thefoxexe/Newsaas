import Link from "next/link";
import { PLAN_LIMITS } from "@/src/entitlements/plans";
import { SiteNav } from "./site-nav";
import { UrlAnalyzer } from "./url-analyzer";
import { DemoCarousel } from "./demo-carousel";

const PLANS: Array<{ id: "starter" | "growth" | "scale"; price: number; highlight?: boolean; tagline: string }> = [
  { id: "starter", price: 29, tagline: "Pour tester le canal" },
  { id: "growth", price: 79, highlight: true, tagline: "Le plus choisi" },
  { id: "scale", price: 199, tagline: "Pour scaler l'acquisition" },
];

const STEPS = [
  {
    n: "01",
    title: "Colle ton URL",
    body: "On scrape ta boutique en live : logo, palette, typo, photos produit, positionnement.",
  },
  {
    n: "02",
    title: "On compose 5 concepts",
    body: "Claude génère 5 angles publicitaires distincts à partir de ta vraie direction artistique.",
  },
  {
    n: "03",
    title: "Rendu vidéo en 30s",
    body: "Notre moteur motion-design anime chaque concept en MP4 prêt pour Meta, TikTok, YouTube.",
  },
];

const FEATURES = [
  {
    title: "DA 100% réelle",
    body: "Tes couleurs, ta typo, tes photos produit — jamais un template générique.",
  },
  {
    title: "Rendu déterministe",
    body: "Même input, même vidéo, au byte près. Reproductible, auditable, sans surprise.",
  },
  {
    title: "Zéro avatar IA",
    body: "Motion design pur : typographie animée, formes, transitions. Pas de visage synthétique qui bave.",
  },
  {
    title: "3 formats natifs",
    body: "9:16, 1:1, 16:9 générés directement — pas de recadrage approximatif après coup.",
  },
];

const FAQ = [
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
];

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <main className="relative overflow-hidden">
        <div
          aria-hidden
          className="glow-primary pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 blur-3xl"
        />

        <section className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center sm:pt-32">
          <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Moteur de rendu déterministe — pas de génération IA aléatoire
          </span>

          <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Colle l&apos;URL de ta boutique.
            <br />
            <span className="text-gradient">5 pubs vidéo</span> en 30 secondes.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
            ReelJolt extrait ta direction artistique réelle et compose des pubs motion-design prêtes pour Meta,
            TikTok et YouTube. Zéro brief à écrire, zéro avatar IA.
          </p>

          <UrlAnalyzer />
        </section>

        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-10 text-center sm:grid-cols-4">
            {[
              { k: "30s", v: "par génération" },
              { k: "5", v: "concepts / URL" },
              { k: "3", v: "formats natifs" },
              { k: "100%", v: "déterministe" },
            ].map((stat) => (
              <div key={stat.k}>
                <p className="font-display text-3xl font-bold text-primary">{stat.k}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted">{stat.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="comment-ca-marche" className="mx-auto max-w-6xl px-6 py-28">
          <div className="reveal text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Comment ça marche</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">De l&apos;URL à la pub, sans brief</h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="reveal">
                <p className="font-display text-5xl font-bold text-border-strong">{step.n}</p>
                <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="demos" className="py-4">
          <div className="reveal mx-auto max-w-3xl px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sorties réelles du moteur</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Pas de mockup. Pas de vidéo stock.
            </h2>
            <p className="mt-4 text-muted">
              Trois secteurs, trois directions artistiques différentes — chaque pub ci-dessous est un fichier produit
              par le pipeline réel, telle quelle, sans retouche.
            </p>
          </div>
          <div className="mt-4">
            <DemoCarousel />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-28">
          <div className="reveal rounded-card border border-border bg-surface p-8 sm:p-12">
            <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
              Motion design, pas des avatars IA
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-card border border-border bg-background p-6">
                <p className="font-display font-semibold text-muted">Outils UGC (Creatify, Arcads, AdCreative…)</p>
                <p className="mt-3 text-foreground">
                  Génèrent de faux humains qui parlent devant une caméra. C&apos;est saturé, et l&apos;audience le
                  reconnaît en une seconde.
                </p>
              </div>
              <div className="relative rounded-card border border-primary bg-background p-6">
                <span className="absolute -top-3 left-6 rounded-pill bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  ReelJolt
                </span>
                <p className="mt-2 font-display font-semibold text-primary">Notre approche</p>
                <p className="mt-3 text-foreground">
                  Compose avec ta vraie typo, tes vraies couleurs, tes vraies photos produit — animées par notre
                  moteur. Déterministe, reproductible, ça ne bave jamais.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="reveal card-hover rounded-card border border-border bg-surface p-6">
                <div className="h-8 w-8 rounded-md bg-primary/15" />
                <h3 className="mt-4 font-display font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="tarifs" className="mx-auto max-w-6xl px-6 py-28">
          <div className="reveal text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Tarifs</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Un plan pour chaque cadence</h2>
            <p className="mt-4 text-muted">Annuel = 2 mois offerts. Plan Free : 3 vidéos/mois, gratuit, sans carte.</p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const limits = PLAN_LIMITS[plan.id];
              return (
                <div
                  key={plan.id}
                  className={`reveal card-hover relative flex flex-col rounded-card border p-8 ${
                    plan.highlight ? "border-primary bg-surface-elevated" : "border-border bg-surface"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Le plus choisi
                    </span>
                  )}
                  <p className="text-sm uppercase tracking-wide text-muted">{plan.id}</p>
                  <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
                  <p className="mt-6 font-display text-4xl font-bold">
                    CHF {plan.price}
                    <span className="text-base font-normal text-muted"> / mois</span>
                  </p>
                  <ul className="mt-8 flex-1 space-y-3 text-sm text-foreground">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {limits.creditsPerPeriod} vidéos / mois
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {limits.maxBrands === Infinity ? "Marques illimitées" : `${limits.maxBrands} marque(s)`}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {limits.watermark ? "Avec filigrane" : "Sans filigrane"}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Résolution {limits.maxResolution}
                    </li>
                  </ul>
                  <Link
                    href="/sign-up"
                    className={`mt-8 block rounded-pill px-4 py-3 text-center font-semibold transition-transform hover:scale-[1.02] ${
                      plan.highlight
                        ? "bg-primary text-primary-foreground"
                        : "border border-border-strong text-foreground"
                    }`}
                  >
                    Choisir {plan.id}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-28">
          <div className="reveal text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Questions fréquentes</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Tout ce qu&apos;il faut savoir</h2>
          </div>
          <div className="mt-12 divide-y divide-border">
            {FAQ.map((item) => (
              <details key={item.q} className="reveal group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display font-semibold">
                  {item.q}
                  <span className="ml-4 text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-28">
          <div className="reveal relative overflow-hidden rounded-card border border-border bg-surface px-8 py-16 text-center">
            <div
              aria-hidden
              className="glow-secondary pointer-events-none absolute -bottom-32 left-1/2 h-72 w-72 -translate-x-1/2 blur-3xl"
            />
            <h2 className="relative font-display text-3xl font-bold sm:text-4xl">
              Prêt à voir tes 5 pubs ?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-muted">
              Colle l&apos;URL de ta boutique en haut de page, ou crée un compte directement — 3 vidéos gratuites,
              sans carte bancaire.
            </p>
            <Link
              href="/sign-up"
              className="relative mt-8 inline-block rounded-pill bg-primary px-8 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Essayer gratuitement
            </Link>
          </div>
        </section>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted sm:flex-row">
            <p className="flex items-center gap-2 font-display font-semibold text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                R
              </span>
              ReelJolt
            </p>
            <p>&copy; {new Date().getFullYear()} ReelJolt. Tous droits réservés.</p>
            <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground">
              Se connecter
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
