import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  Check,
  Landmark,
  WalletCards,
} from "lucide-react";

import { BentoGrid } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { LandingFaq } from "@/components/landing-faq";
import { LandingHero } from "@/components/landing-hero";
import { LandingProblem } from "@/components/landing-problem";

const envelopeRows = [
  { name: "Courses", spent: "312 €", rest: "88 €", width: "78%" },
  { name: "Transport", spent: "96 €", rest: "54 €", width: "64%" },
  { name: "Logiciels", spent: "74 €", rest: "26 €", width: "74%" },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span
        aria-hidden
        className="bg-encre text-surface flex size-9 items-center justify-center rounded-[0.625rem] text-lg font-bold shadow-carte"
      >
        P
      </span>
      <span className="text-xl font-bold tracking-[-0.02em]">Plia</span>
    </Link>
  );
}

function ForecastCard() {
  return (
    <article className="carte relative overflow-hidden p-0 md:col-span-7">
      <div className="relative min-h-72 px-5 pt-6 sm:px-7 sm:pt-7">
        <DotPattern
          width={22}
          height={22}
          cr={0.8}
          className="text-filet-fort [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
        />
        <div className="relative z-10 max-w-md">
          <CalendarRange className="size-5 text-ardoise" aria-hidden />
          <h3 className="mt-4 text-2xl font-bold tracking-[-0.025em]">Du mois passé aux mois à venir.</h3>
          <p className="mt-2 max-w-[48ch] text-sm leading-6 text-ardoise">
            Retrouvez l&apos;évolution de votre solde, comprenez les écarts puis visualisez sa trajectoire.
          </p>
          <p className="mt-3 text-xs text-ardoise-claire">Exemple illustratif</p>
        </div>

        <div className="absolute inset-x-5 bottom-0 z-10 overflow-hidden rounded-t-lg border border-b-0 border-filet bg-surface sm:inset-x-7">
          <div className="grid grid-cols-[1.2fr_repeat(3,1fr)] border-b border-filet bg-creuse px-3 py-2 text-[0.6875rem] font-semibold text-ardoise">
            <span>Mois</span>
            <span className="text-right">Août</span>
            <span className="text-right">Sept.</span>
            <span className="text-right">Oct.</span>
          </div>
          {[
            ["Entrées", "+ 3 240 €", "+ 1 850 €", "+ 4 360 €"],
            ["Sorties", "− 2 920 €", "− 2 900 €", "− 2 880 €"],
            ["Solde fin", "2 430 €", "1 380 €", "2 860 €"],
          ].map((row) => (
            <div key={row[0]} className="grid grid-cols-[1.2fr_repeat(3,1fr)] border-b border-filet px-3 py-2.5 text-xs last:border-b-0">
              <span className="font-semibold">{row[0]}</span>
              {row.slice(1).map((value, index) => (
                <span key={value} className={`text-right font-semibold tabular-nums ${row[0] === "Entrées" ? "text-portant" : index === 1 && row[0] === "Solde fin" ? "text-attente" : ""}`}>
                  {value}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function EnvelopeCard() {
  return (
    <article className="carte p-5 sm:p-7 md:col-span-5">
      <WalletCards className="size-5 text-ardoise" aria-hidden />
      <h3 className="mt-4 text-2xl font-bold tracking-[-0.025em]">Des budgets qui gardent leur histoire.</h3>
      <p className="mt-2 text-sm leading-6 text-ardoise">
        Chaque reste ou dépassement se reporte pour refléter la réalité de vos dépenses.
      </p>
      <div className="mt-6 space-y-4">
        {envelopeRows.map((row) => (
          <div key={row.name}>
            <div className="flex items-baseline justify-between gap-4 text-xs">
              <span className="font-semibold">{row.name}</span>
              <span className="text-ardoise tabular-nums">
                {row.spent} dépensés · <strong className="text-foreground">{row.rest} restants</strong>
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-creuse">
              <div className="h-full rounded-full bg-encre" style={{ width: row.width }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function BankCard() {
  return (
    <article className="carte p-5 sm:p-7 md:col-span-5">
      <Landmark className="size-5 text-ardoise" aria-hidden />
      <h3 className="mt-4 text-2xl font-bold tracking-[-0.025em]">Toutes vos opérations au même endroit.</h3>
      <p className="mt-2 text-sm leading-6 text-ardoise">
        Plia récupère vos mouvements bancaires pour vous aider à les comprendre et les organiser.
      </p>
      <div className="mt-6 rounded-lg bg-creuse p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Compte courant</p>
            <p className="mt-0.5 text-xs text-ardoise">Connexion via Enable Banking</p>
          </div>
          <span className="bg-portant-voile text-portant rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.04em] uppercase">
            Relié
          </span>
        </div>
      </div>
    </article>
  );
}

function DecisionCard() {
  return (
    <article className="relative overflow-hidden rounded-xl bg-foreground p-5 text-background shadow-levee sm:p-7 md:col-span-7">
      <div className="relative z-10 grid min-h-64 gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="max-w-lg text-3xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-4xl">
            Comprendre hier pour mieux décider demain.
          </p>
          <p className="mt-4 max-w-md text-sm leading-6 text-background/70">
            Identifiez ce qui a pesé sur votre budget, puis voyez ce que vous pouvez encore dépenser sereinement.
          </p>
        </div>
        <div className="rounded-lg bg-background/10 px-4 py-3 sm:text-right">
          <p className="text-xs text-background/70">Marge avant le prochain revenu</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">1 380 €</p>
          <p className="mt-1 text-[0.6875rem] text-background/70">Exemple illustratif</p>
        </div>
      </div>
    </article>
  );
}

export function LandingContent() {
  return (
    <main className="min-h-svh overflow-hidden">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Brand />
        <nav aria-label="Navigation principale" className="hidden items-center gap-7 md:flex">
          <a className="text-sm font-semibold text-ardoise transition-colors hover:text-foreground" href="#pourquoi">
            Pourquoi Plia
          </a>
          <a className="text-sm font-semibold text-ardoise transition-colors hover:text-foreground" href="#fonctionnement">
            Comment ça marche
          </a>
          <a className="text-sm font-semibold text-ardoise transition-colors hover:text-foreground" href="#tarifs">
            Tarifs
          </a>
          <a className="text-sm font-semibold text-ardoise transition-colors hover:text-foreground" href="#faq">
            FAQ
          </a>
        </nav>
        <Button asChild variant="outline">
          <Link href="/connexion">Se connecter</Link>
        </Button>
      </header>

      <LandingHero />
      <LandingProblem />

      <section id="pourquoi" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="max-w-3xl">
          <h2 className="text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
            Comprenez vos finances dans les deux sens.
          </h2>
          <p className="mt-5 max-w-[62ch] text-base leading-7 text-ardoise">
            Plia relie vos opérations passées, vos budgets actuels et vos prévisions pour vous donner une vision complète de votre argent.
          </p>
        </div>

        <BentoGrid className="mt-12 auto-rows-auto grid-cols-1 gap-4 md:grid-cols-12">
          <ForecastCard />
          <EnvelopeCard />
          <BankCard />
          <DecisionCard />
        </BentoGrid>
      </section>

      <section id="fonctionnement" className="border-y border-filet bg-surface">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-10 lg:py-28">
          <div>
            <h2 className="max-w-[12ch] text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
              Trois gestes. Puis une réponse claire.
            </h2>
            <p className="mt-5 max-w-[48ch] text-base leading-7 text-ardoise">
              Vous gardez la main sur vos décisions. Plia s&apos;occupe de rendre leurs conséquences visibles.
            </p>
          </div>

          <ol className="divide-y divide-filet border-y border-filet">
            <li className="grid gap-3 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
              <p className="font-semibold">Relier</p>
              <p className="leading-7 text-ardoise">Connectez votre banque avec Enable Banking pour faire venir le solde et les opérations.</p>
            </li>
            <li className="grid gap-3 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
              <p className="font-semibold">Ranger</p>
              <p className="leading-7 text-ardoise">Ajustez vos enveloppes et reclassez une dépense en un clic quand Plia s&apos;est trompé.</p>
            </li>
            <li className="grid gap-3 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
              <p className="font-semibold">Décider</p>
              <p className="leading-7 text-ardoise">Regardez la projection et sachez ce que vous pouvez dépenser sans fragiliser les mois suivants.</p>
            </li>
          </ol>
        </div>
      </section>

      <section id="tarifs" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="max-w-3xl">
          <h2 className="text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
            Un tarif lisible. Dès qu&apos;il est arrêté.
          </h2>
          <p className="mt-5 max-w-[62ch] text-base leading-7 text-ardoise">
            Le prix et le modèle commercial de Plia sont encore en préparation. Ils seront affichés ici clairement avant toute souscription.
          </p>
        </div>

        <div className="carte mt-12 grid overflow-hidden p-0 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="border-filet bg-foreground px-6 py-9 text-background sm:px-9 sm:py-11 lg:border-r">
            <p className="text-lg font-semibold">Plia</p>
            <p className="mt-6 text-4xl font-bold tracking-[-0.035em]">Tarif à venir</p>
            <p className="mt-4 max-w-[38ch] text-sm leading-6 text-background/70">
              Aucun faux prix d&apos;appel : le montant sera publié quand l&apos;offre sera prête.
            </p>
            <Button asChild size="lg" className="mt-8 bg-background text-foreground hover:bg-creuse">
              <Link href="/connexion">Découvrir Plia</Link>
            </Button>
          </div>

          <div className="px-6 py-9 sm:px-9 sm:py-11">
            <p className="font-semibold">Ce que Plia réunit déjà</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Connexion bancaire via Enable Banking",
                "Enveloppes reportées d’un mois à l’autre",
                "Projection du solde sur plusieurs mois",
                "Alertes en cas de dépassement",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-ardoise">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-portant-voile text-portant">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <LandingFaq />

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <div className="relative overflow-hidden rounded-xl bg-foreground px-6 py-12 text-background shadow-flottante sm:px-10 sm:py-16 lg:flex lg:items-end lg:justify-between lg:gap-12">
          <DotPattern
            width={26}
            height={26}
            cr={0.7}
            className="text-background/15 [mask-image:linear-gradient(to_left,black,transparent_80%)]"
          />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
              Le prochain mois arrive déjà. Regardez-le venir.
            </h2>
            <p className="mt-5 max-w-[55ch] text-base leading-7 text-background/70">
              Commencez avec votre vrai compte bancaire et construisez un budget qui suit votre rythme.
            </p>
          </div>
          <Button asChild size="lg" className="relative z-10 mt-8 shrink-0 bg-background text-foreground hover:bg-creuse lg:mt-0">
            <Link href="/connexion">
              Commencer avec Plia
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-filet">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-ardoise sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <Brand />
          <p className="max-w-xl leading-5 md:text-right">
            Les données reflètent la dernière synchronisation bancaire. Une reconnexion est demandée environ tous les 90 jours.
          </p>
        </div>
      </footer>
    </main>
  );
}
