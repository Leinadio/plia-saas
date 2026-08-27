import Image from "next/image";

import { DotPattern } from "@/components/ui/dot-pattern";

export function LandingProblem() {
  return (
    <section
      id="probleme"
      className="relative overflow-hidden border-y border-white/10 bg-[var(--landing-problem-bg)] text-[var(--landing-problem-ink)]"
    >
      <div
        className="absolute inset-y-0 right-0 hidden w-[60%] lg:block"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 32%, black 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 32%, black 100%)",
        }}
      >
        <Image
          src="/plia-budget-person.png"
          alt="Une personne souriante organise ses factures et son budget autour d’une table"
          fill
          sizes="60vw"
          className="object-cover object-center opacity-75 saturate-[0.72] contrast-[1.08]"
        />
        <div className="absolute inset-0 bg-sarcelle/20 mix-blend-color" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--landing-problem-bg)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--landing-problem-bg)] to-transparent" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(90deg, var(--landing-problem-bg) 0%, var(--landing-problem-bg) 36%, transparent 76%)",
        }}
      />
      <DotPattern
        width={28}
        height={28}
        cr={0.65}
        className="text-white/10 [mask-image:linear-gradient(to_left,black,transparent_72%)]"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center px-5 py-20 sm:px-8 lg:min-h-[38rem] lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-28">
        <div className="max-w-2xl text-center lg:justify-self-center">
          <p className="text-xs font-bold tracking-[0.14em] text-[var(--landing-problem-muted)] uppercase">
            Le problème
          </p>
          <h2 className="mx-auto mt-5 max-w-[18ch] text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
            Vous savez combien il reste. Pas combien vous pouvez dépenser.
          </h2>
          <p className="mx-auto mt-5 max-w-[50ch] text-base leading-7 text-[var(--landing-problem-muted)]">
            Entre charges fixes, achats du quotidien et dépenses qui arrivent
            plus tard, le solde du jour ne raconte qu&apos;une partie de
            l&apos;histoire.
          </p>
          <p className="mx-auto mt-8 max-w-[46ch] border-t border-white/20 pt-5 text-sm leading-6 text-[var(--landing-problem-muted)]">
            Un solde positif peut déjà être presque entièrement réservé aux
            charges et aux budgets du mois.
          </p>
        </div>

        <div
          className="relative -mx-5 -mb-20 mt-10 aspect-[5/4] overflow-hidden sm:-mx-8 lg:hidden"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 14%, black 88%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 14%, black 88%, transparent 100%)",
          }}
        >
          <Image
            src="/plia-budget-person.png"
            alt="Une personne souriante organise ses factures et son budget autour d’une table"
            fill
            sizes="100vw"
            className="object-cover opacity-80 saturate-[0.72] contrast-[1.08]"
          />
          <div className="absolute inset-0 bg-sarcelle/15 mix-blend-color" />
        </div>
      </div>
    </section>
  );
}
