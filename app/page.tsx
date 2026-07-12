import Link from "next/link";
import { PLAN_LIMITS } from "@/src/entitlements/plans";
import { UrlAnalyzer } from "./url-analyzer";
import { DemoCarousel } from "./demo-carousel";

const PLANS: Array<{ id: "starter" | "growth" | "scale"; price: number; highlight?: boolean }> = [
  { id: "starter", price: 29 },
  { id: "growth", price: 79, highlight: true },
  { id: "scale", price: 199 },
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section className="text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
          Colle l&apos;URL de ta boutique.
          <br />
          <span className="text-primary">5 pubs vidéo</span> en 30 secondes.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          ReelJolt extrait ta direction artistique réelle — tes couleurs, ta typo, tes produits — et compose des pubs
          motion-design prêtes pour Meta, TikTok et YouTube. Zéro brief, zéro avatar IA.
        </p>

        <UrlAnalyzer />
      </section>

      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold">De vraies sorties de notre moteur</h2>
        <p className="mt-2 text-center text-muted">
          Pas de mockup, pas de vidéo stock. Trois secteurs différents, trois DA différentes — chaque pub ci-dessous
          est un fichier produit par le pipeline réel, telle quelle.
        </p>
      </section>

      <div className="mt-10">
        <DemoCarousel />
      </div>

      <section className="mt-24 rounded-card border border-border bg-surface p-8">
        <h2 className="text-center text-2xl font-bold">Motion design, pas des avatars IA</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-card border border-border bg-surface-elevated p-6">
            <p className="font-semibold text-muted">Les outils UGC (Creatify, Arcads, AdCreative...)</p>
            <p className="mt-2 text-foreground">
              Génèrent de faux humains qui parlent devant une caméra. C&apos;est saturé et ça se voit.
            </p>
          </div>
          <div className="rounded-card border border-primary bg-surface-elevated p-6">
            <p className="font-semibold text-primary">ReelJolt</p>
            <p className="mt-2 text-foreground">
              Compose avec ta vraie typo, tes vraies couleurs, tes vraies photos produit — animées par notre moteur.
              Déterministe, reproductible, ne bave pas.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold">Tarifs</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const limits = PLAN_LIMITS[plan.id];
            return (
              <div
                key={plan.id}
                className={`rounded-card border p-6 ${plan.highlight ? "border-primary bg-surface-elevated" : "border-border bg-surface"}`}
              >
                <p className="text-sm uppercase tracking-wide text-muted">{plan.id}</p>
                <p className="mt-2 text-3xl font-extrabold">
                  CHF {plan.price}
                  <span className="text-base font-normal text-muted"> / mois</span>
                </p>
                <ul className="mt-6 space-y-2 text-sm text-foreground">
                  <li>{limits.creditsPerPeriod} vidéos / mois</li>
                  <li>{limits.maxBrands === Infinity ? "Marques illimitées" : `${limits.maxBrands} marque(s)`}</li>
                  <li>{limits.watermark ? "Avec filigrane" : "Sans filigrane"}</li>
                  <li>Résolution {limits.maxResolution}</li>
                </ul>
                <Link
                  href="/sign-up"
                  className="mt-6 block rounded-pill bg-primary px-4 py-2 text-center font-semibold text-primary-foreground"
                >
                  Choisir {plan.id}
                </Link>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm text-muted">Annuel = 2 mois offerts. Plan Free : 3 vidéos/mois, gratuit.</p>
      </section>

      <footer className="mt-24 text-center text-sm text-muted">
        <Link href="/sign-in" className="underline">
          Se connecter
        </Link>
      </footer>
    </main>
  );
}
