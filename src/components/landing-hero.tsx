"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useReducedMotion, useScroll, useTransform } from "motion/react";

import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { Highlighter } from "@/components/ui/highlighter";

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const videoY = useTransform(
    scrollYProgress,
    [0, 0.75],
    reducedMotion ? [0, 0] : [0, -18],
  );
  const videoRotateX = useTransform(
    scrollYProgress,
    [0, 0.75],
    reducedMotion ? [0, 0] : [3, 0],
  );
  const videoScale = useTransform(
    scrollYProgress,
    [0, 0.75],
    reducedMotion ? [1, 1] : [0.975, 1],
  );
  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 text-center sm:px-8 sm:pb-28 sm:pt-24 lg:px-10 lg:pt-28"
    >
      <DotPattern
        width={24}
        height={24}
        cr={0.7}
        className="-z-10 text-filet-fort [mask-image:radial-gradient(62%_48%_at_50%_28%,black,transparent)]"
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <h1 className="mx-auto max-w-[14ch] text-[clamp(2.75rem,7vw,5.75rem)] leading-[0.94] font-bold tracking-[-0.04em] text-balance">
          Pilotez{" "}
          <Highlighter
            action="underline"
            color="var(--hero-soulignement)"
            strokeWidth={2.5}
            animationDuration={reducedMotion ? 0 : 750}
            iterations={2}
            padding={3}
            isView
          >
            vos finances
          </Highlighter>{" "}
          sans perdre de vue{" "}
          <Highlighter
            action="highlight"
            color="var(--hero-surlignage)"
            animationDuration={reducedMotion ? 0 : 850}
            iterations={1}
            padding={4}
            isView
          >
            les mois à venir.
          </Highlighter>
        </h1>
        <p className="mx-auto mt-7 max-w-[68ch] text-base leading-7 text-ardoise sm:text-lg sm:leading-8">
          Suivez ce qui entre, maîtrisez ce qui sort, répartissez votre budget
          par enveloppes puis projetez votre solde sur plusieurs mois.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="group w-full sm:w-auto">
            <Link href="/connexion">
              Commencer avec Plia
              <ArrowRight
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <a href="#demonstration">Voir la démonstration</a>
          </Button>
        </div>
        <p className="mt-4 text-xs leading-5 text-ardoise-claire">
          Connexion bancaire par Enable Banking. Pas d&apos;import CSV à préparer.
        </p>
      </div>

      <div
        id="demonstration"
        className="mx-auto mt-16 max-w-6xl scroll-mt-8 sm:mt-20"
      >
        <HeroVideoDialog
          animationStyle="from-center"
          videoSrc="/plia-demo.mp4"
          thumbnailSrc="/plia-demo.svg"
          thumbnailAlt="Aperçu illustratif de la projection Plia"
          triggerStyle={{
            y: videoY,
            rotateX: videoRotateX,
            scale: videoScale,
            transformPerspective: 1400,
          }}
          className="w-full rounded-xl bg-surface shadow-flottante [&>button]:w-full [&>button]:origin-top [&>button]:will-change-transform [&_img]:rounded-xl [&_img]:border-0 [&_img]:shadow-none"
        />
      </div>
    </section>
  );
}
