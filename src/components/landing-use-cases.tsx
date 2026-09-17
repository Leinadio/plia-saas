"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import styles from "./landing-use-cases.module.css";

const stories = [
  {
    id: "weekend",
    label: "À deux",
    title: "Partir à deux. L’esprit plus léger.",
    description:
      "Vous préparez une escapade ? Fixez un budget pour le transport, l’hébergement et les sorties. Avec Planora, suivez vos dépenses et ce qu’il reste pour profiter du séjour.",
    alt: "Un couple souriant partage un café en terrasse pendant un week-end au bord de la mer.",
  },
  {
    id: "quotidien",
    label: "Au quotidien",
    title: "Faire les courses. Garder le cap.",
    description:
      "Vous gérez les dépenses du mois ? Choisissez un montant pour les courses, rattachez vos achats à ce budget et voyez ce qu’il reste avant le prochain passage au magasin.",
    alt: "Une femme souriante range des produits frais dans la cuisine de son appartement.",
  },
  {
    id: "activites",
    label: "Les activités",
    title: "Faire de la place à vos passions.",
    description:
      "Le vélo, le sport, les sorties entre amis… Prévoyez un budget pour vos activités. Planora vous aide à suivre l’équipement, les abonnements et les petits extras au même endroit.",
    alt: "Deux amis souriants font une pause avec leurs vélos dans un parc ensoleillé.",
  },
  {
    id: "projet",
    label: "Les projets",
    title: "Donner une place à vos projets.",
    description:
      "Envie de refaire une pièce ? Définissez un budget travaux et suivez les achats au fil du projet. Consultez les soldes estimés des mois à venir pour ajuster vos choix.",
    alt: "Un couple souriant repeint ensemble une pièce de son appartement.",
  },
  {
    id: "rentree",
    label: "La rentrée",
    title: "Une rentrée pleine d’envies. Un budget prêt.",
    description:
      "Fournitures, vêtements, activités des enfants… Prévoyez un budget pour chaque poste et rattachez-y vos achats. Vous gardez une vue claire sur ce qu’il reste à prévoir.",
    alt: "Une mère et sa fille souriantes préparent un cartable et des fournitures à la maison.",
  },
  {
    id: "logement",
    label: "Chez soi",
    title: "Votre premier chez-vous. Vos propres repères.",
    description:
      "Vous prenez votre premier appartement ? Définissez vos budgets loyer, courses et installation. Comparez vos dépenses au prévu pour trouver votre rythme dès les premiers mois.",
    alt: "Une jeune femme souriante s’installe dans son premier appartement avec l’aide d’une amie.",
  },
  {
    id: "imprevus",
    label: "Les imprévus",
    title: "Les imprévus arrivent. Vous voyez vos options.",
    description:
      "Une réparation qui n’était pas prévue ? Ajoutez la dépense, regardez son effet sur votre solde estimé et ajustez vos autres budgets pour décider de la suite.",
    alt: "Un homme souriant échange avec une réparatrice dans un atelier de vélos.",
  },
];

export function LandingUseCases() {
  const track = useRef<HTMLDivElement>(null);
  const selectedSlide = useRef(0);
  const trackWidth = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    trackWidth.current = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === trackWidth.current) return;
      trackWidth.current = element.clientWidth;
      element.scrollTo({
        left: selectedSlide.current * element.clientWidth,
        behavior: "instant",
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  function goTo(index: number) {
    if (!track.current) return;
    const next = Math.max(0, Math.min(stories.length - 1, index));
    track.current.scrollTo({
      left: next * track.current.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const destination = {
      ArrowLeft: active - 1,
      ArrowRight: active + 1,
      Home: 0,
      End: stories.length - 1,
    }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    goTo(destination);
  }
  return (
    <section
      id="vos-moments"
      className={styles.section}
      aria-labelledby="use-cases-heading"
      aria-roledescription="carrousel"
    >
      <header className={styles.header}>
        <h2 id="use-cases-heading">Pour tout ce qui fait votre vie.</h2>
        <p>
          Les habitudes du quotidien. Les envies qui grandissent. Et un budget
          pour leur faire une place.
        </p>
      </header>
      <div
        ref={track}
        id="use-cases-track"
        className={styles.track}
        tabIndex={0}
        aria-label="Situations d’usage de Planora, utilisez les flèches pour parcourir"
        onKeyDown={onKeyDown}
        onScroll={(event) => {
          const element = event.currentTarget;
          if (
            element.clientWidth === 0 ||
            element.clientWidth !== trackWidth.current
          )
            return;
          const index = Math.max(
            0,
            Math.min(
              stories.length - 1,
              Math.round(element.scrollLeft / element.clientWidth),
            ),
          );
          selectedSlide.current = index;
          setActive(index);
        }}
      >
        {stories.map((story, index) => (
          <article
            key={story.id}
            className={styles.slide}
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${index + 1} sur ${stories.length} : ${story.label}`}
            inert={index !== active}
          >
            <div className={styles.photo}>
              <Image
                src={`/landing/use-cases/${story.id}.webp`}
                alt={story.alt}
                fill
                sizes="(max-width: 700px) calc(100vw - 48px), (max-width: 1100px) calc(100vw - 72px), (max-width: 1440px) calc(100vw - 128px), 1312px"
                loading="lazy"
              />
            </div>
            <div className={styles.copy}>
              <h3>{story.title}</h3>
              <p>{story.description}</p>
              <Link href="#offre" className={styles.cta}>
                Réserver mon accès <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <div className={styles.navigation}>
        <div className={styles.choices} aria-label="Choisir une situation">
          {stories.map((story, index) => (
            <button
              key={story.id}
              type="button"
              aria-pressed={active === index}
              aria-controls="use-cases-track"
              onClick={() => goTo(index)}
            >
              {story.label}
            </button>
          ))}
        </div>
        <div className={styles.controls}>
          <span
            className={styles.counter}
            aria-live="polite"
            aria-atomic="true"
          >
            <span className={styles.srOnly}>Situation </span>
            {active + 1}
            <span aria-hidden="true"> / </span>
            <span className={styles.srOnly}> sur </span>
            {stories.length}
          </span>
          <button
            type="button"
            aria-label="Situation précédente"
            aria-controls="use-cases-track"
            disabled={active === 0}
            onClick={() => goTo(active - 1)}
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Situation suivante"
            aria-controls="use-cases-track"
            disabled={active === stories.length - 1}
            onClick={() => goTo(active + 1)}
          >
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
