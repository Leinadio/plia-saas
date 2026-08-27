import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  Check,
  Landmark,
  WalletCards,
} from "lucide-react";

import { BentoGrid } from "@/components/ui/bento-grid";
import { AnimatedList } from "@/components/ui/animated-list";
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

const bankMovements = [
  { name: "Virement salaire", category: "Revenu", amount: "+ 2 450,00 €", positive: true },
  { name: "Supermarché", category: "Courses", amount: "− 68,42 €", positive: false },
  { name: "Prélèvement énergie", category: "Logement", amount: "− 94,10 €", positive: false },
  { name: "Billet de train", category: "Transport", amount: "− 46,00 €", positive: false },
];

const pricingTiers = [
  {
    name: "Essentiel",
    price: "12,99 €",
    description: "Pour comprendre vos opérations et reprendre la main sur votre budget courant.",
    features: [
      "Suivi des opérations",
      "Budgets mensuels",
      "Vue globale du solde",
      "Catégorisation des dépenses",
    ],
    emphasized: false,
  },
  {
    name: "Équilibre",
    price: "25,99 €",
    description: "Pour suivre vos budgets et anticiper sereinement les dépenses qui arrivent.",
    features: [
      "Comptes bancaires reliés",
      "Projection sur plusieurs mois",
      "Enveloppes mensuelles",
      "Alertes de dépassement",
    ],
    emphasized: true,
  },
  {
    name: "Horizon",
    price: "34,99 €",
    description: "Pour garder une vision complète de tous vos comptes et de vos prochains mois.",
    features: [
      "Tous vos comptes bancaires",
      "Projection longue durée",
      "Enveloppes et alertes avancées",
      "Historique financier complet",
    ],
    emphasized: false,
  },
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
      <div className="relative px-5 pt-6 sm:px-7 sm:pt-7">
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

        <div className="relative z-10 mt-8 h-64 overflow-hidden rounded-t-lg border border-b-0 border-filet bg-surface sm:h-72">
          <Image
            src="/plia-projection-detail.png"
            alt="Projection détaillée des revenus, dépenses et soldes de janvier et février 2027"
            fill
            sizes="(min-width: 768px) 58vw, 100vw"
            className="object-cover object-top"
          />
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
    <article className="carte overflow-hidden p-0 md:col-span-5">
      <div className="p-5 pb-0 sm:p-7 sm:pb-0">
        <Landmark className="size-5 text-ardoise" aria-hidden />
        <h3 className="mt-4 text-2xl font-bold tracking-[-0.025em]">Toutes vos opérations au même endroit.</h3>
        <p className="mt-2 text-sm leading-6 text-ardoise">
          Plia rassemble vos mouvements issus de plus de 150 banques compatibles pour vous aider à les comprendre et les organiser.
        </p>
        <p className="mt-3 text-xs text-ardoise-claire">Exemple illustratif</p>
      </div>

      <div className="relative mt-6 h-52 overflow-hidden border-y border-filet bg-creuse">
        <AnimatedList
          delay={700}
          aria-label="Exemples d’opérations bancaires synchronisées"
          className="gap-0 divide-y divide-filet"
        >
          {bankMovements.map((movement) => (
            <div
              key={movement.name}
              className="flex items-center justify-between gap-4 bg-surface px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{movement.name}</p>
                <p className="mt-0.5 text-xs text-ardoise">{movement.category}</p>
              </div>
              <p
                className={`shrink-0 text-sm font-semibold tabular-nums ${movement.positive ? "text-portant" : "text-foreground"}`}
              >
                {movement.amount}
              </p>
            </div>
          ))}
        </AnimatedList>
        <div className="from-creuse pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t to-transparent" />
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
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
            Comprenez vos finances dans les deux sens.
          </h2>
          <p className="mx-auto mt-5 max-w-[62ch] text-base leading-7 text-ardoise">
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
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mx-auto max-w-[18ch] text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
              Trois gestes. Puis une réponse claire.
            </h2>
            <p className="mx-auto mt-5 max-w-[48ch] text-base leading-7 text-ardoise">
              Vous gardez la main sur vos décisions. Plia s&apos;occupe de rendre leurs conséquences visibles.
            </p>
          </div>

          <ol className="mx-auto mt-12 max-w-5xl divide-y divide-filet border-y border-filet">
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
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
            Trois niveaux pour piloter à votre façon.
          </h2>
          <p className="mx-auto mt-5 max-w-[62ch] text-base leading-7 text-ardoise">
            Ces tarifs sont provisoires. Ils permettent de comparer les niveaux en attendant l&apos;offre définitive.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={
                tier.emphasized
                  ? "flex flex-col rounded-xl bg-foreground p-6 text-background shadow-flottante sm:p-8"
                  : "carte flex flex-col p-6 sm:p-8"
              }
            >
              <p className="text-lg font-semibold">{tier.name}</p>
              <p className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-bold tracking-[-0.04em] tabular-nums">
                  {tier.price}
                </span>
                <span className={tier.emphasized ? "pb-1 text-sm text-background/60" : "pb-1 text-sm text-ardoise"}>
                  / mois
                </span>
              </p>
              <p className={tier.emphasized ? "mt-5 min-h-18 text-sm leading-6 text-background/70" : "mt-5 min-h-18 text-sm leading-6 text-ardoise"}>
                {tier.description}
              </p>
              <Button
                asChild
                size="lg"
                className={tier.emphasized ? "mt-7 w-full bg-background text-foreground hover:bg-creuse" : "mt-7 w-full"}
              >
                <Link href="/connexion">Choisir {tier.name}</Link>
              </Button>
              <ul className={tier.emphasized ? "mt-8 space-y-4 border-t border-background/15 pt-6" : "mt-8 space-y-4 border-t border-filet pt-6"}>
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className={tier.emphasized ? "flex items-start gap-3 text-sm leading-6 text-background/75" : "flex items-start gap-3 text-sm leading-6 text-ardoise"}
                  >
                    <span className={tier.emphasized ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-background/10 text-background" : "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-portant-voile text-portant"}>
                      <Check className="size-3" aria-hidden />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <LandingFaq />

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <div className="relative overflow-hidden rounded-xl bg-foreground px-6 py-12 text-center text-background shadow-flottante sm:px-10 sm:py-16">
          <DotPattern
            width={26}
            height={26}
            cr={0.7}
            className="text-background/15 [mask-image:linear-gradient(to_left,black,transparent_80%)]"
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
              Le prochain mois arrive déjà. Regardez-le venir.
            </h2>
            <p className="mx-auto mt-5 max-w-[55ch] text-base leading-7 text-background/70">
              Commencez avec votre vrai compte bancaire et construisez un budget qui suit votre rythme.
            </p>
          </div>
          <Button asChild size="lg" className="relative z-10 mt-8 shrink-0 bg-background text-foreground hover:bg-creuse">
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
