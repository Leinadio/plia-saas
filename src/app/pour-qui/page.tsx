import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  House,
  Plane,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";
import { PublicAccordion } from "@/components/public-accordion";
import { LandingBrand, LandingHeader } from "@/components/landing-header";
import landing from "@/components/landing.module.css";
import layout from "@/components/landing-layout.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "En solo ou à deux, un budget à votre rythme — Planora",
  description:
    "Vos dépenses du quotidien, vos loisirs, vos projets : définissez un budget pour chaque priorité. Découvrez Planora en solo ou pour organiser les dépenses de votre foyer.",
};

const exampleBudgets = [
  {
    name: "Vie quotidienne",
    detail: "Les dépenses à prévoir",
    amount: "850 €",
    Icon: House,
  },
  {
    name: "Sorties et loisirs",
    detail: "Une place pour en profiter",
    amount: "120 €",
    Icon: Wallet,
  },
  {
    name: "Projet vacances",
    detail: "Un départ qui se prépare",
    amount: "250 €",
    Icon: Plane,
  },
];

const coupleBenefits = [
  {
    Icon: House,
    title: "Un quotidien mieux prévu.",
    description:
      "Logement, transport, dépenses du foyer : définissez les budgets que vous souhaitez suivre, avec un montant pour chacun.",
  },
  {
    Icon: Plane,
    title: "Des projets qui prennent forme.",
    description:
      "Un voyage ou un emménagement se prépare dans votre budget. Détaillez les dépenses en sous-budgets et prévoyez les mois concernés.",
  },
  {
    Icon: CalendarDays,
    title: "Des choix plus faciles à partager.",
    description:
      "Appuyez-vous sur le prévu, le dépensé et le restant pour discuter de la suite. Vous voyez ce qui est possible avant de vous lancer.",
  },
];

export default function AudiencePage() {
  return (
    <main className={`${landing.landing} ${layout.page} ${styles.page}`}>
      <LandingHeader audience />
      <section className={styles.hero} aria-labelledby="audience-heading">
        <div className={styles.heroCopy}>
          <h1 id="audience-heading">
            Votre vie change.
            <br />
            <span>Votre budget suit.</span>
          </h1>
          <p>
            En solo ou à deux, donnez une place à vos dépenses et à vos envies.
            Avec Planora, vous définissez un budget pour chaque priorité et
            gardez une vue sur la suite.
          </p>
          <div className={styles.actions}>
            <Link href="/reservation" className={landing.primary}>
              Réserver mon accès <ArrowUpRight aria-hidden />
            </Link>
            <a href="#vos-priorites" className={landing.textLink}>
              Trouver mon rythme <ArrowDown aria-hidden />
            </a>
          </div>
        </div>
        <figure className={styles.heroScene}>
          <div className={styles.heroPhoto}>
            <Image
              src="/landing/projets-foyer-v1.png"
              alt="Un couple prépare un départ en week-end dans son appartement lumineux."
              fill
              sizes="(max-width: 1440px) 100vw, 1312px"
              preload
            />
          </div>
          <figcaption>
            <span>De la place pour le quotidien.</span>
            <span>Et pour ce qui vous attend.</span>
          </figcaption>
        </figure>
        <nav
          id="vos-priorites"
          className={styles.profileNav}
          aria-label="Votre façon d’utiliser Planora"
        >
          <a href="#en-solo">
            <UserRound aria-hidden />
            <span>
              <strong>En solo</strong>
              <span>Mes envies. Mes choix.</span>
            </span>
            <ArrowDown aria-hidden />
          </a>
          <a href="#a-deux">
            <UsersRound aria-hidden />
            <span>
              <strong>À deux</strong>
              <span>Les dépenses du foyer. Nos projets.</span>
            </span>
            <ArrowDown aria-hidden />
          </a>
        </nav>
      </section>

      <section
        id="en-solo"
        className={styles.solo}
        aria-labelledby="solo-heading"
      >
        <div className={styles.intro}>
          <h2 id="solo-heading">
            En solo, vos priorités
            <br />
            <span>passent au premier plan.</span>
          </h2>
          <p>
            Le loyer, une sortie, les prochaines vacances : tout ne sert pas au
            même objectif. Choisissez combien consacrer à chaque budget, puis
            suivez vos dépenses sans tout recalculer de tête.
          </p>
        </div>
        <div className={styles.soloScene}>
          <div className={styles.soloPhoto}>
            <Image
              src="/landing/audience-solo-v1.png"
              alt="Une femme lit sur son balcon, dans un moment de calme."
              fill
              sizes="(max-width: 800px) 100vw, (max-width: 1440px) 40vw, 520px"
            />
          </div>
          <div className={styles.budgetExample}>
            <h3>
              Un mois.
              <br />
              <span>Vos priorités à vous.</span>
            </h3>
            <p className={styles.exampleNote}>
              Exemple fictif de budgets mensuels
            </p>
            <table className={styles.budgets}>
              <caption className={styles.srOnly}>
                Exemple de montants prévus pour trois budgets
              </caption>
              <thead>
                <tr>
                  <th scope="col">Mes budgets</th>
                  <th scope="col">Montant prévu</th>
                </tr>
              </thead>
              <tbody>
                {exampleBudgets.map(({ name, detail, amount, Icon }) => (
                  <tr key={name}>
                    <th scope="row">
                      <span className={styles.budgetName}>
                        <Icon aria-hidden />
                        <span>
                          {name}
                          <small>{detail}</small>
                        </span>
                      </span>
                    </th>
                    <td>{amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.exampleSummary}>
              Les opérations se rattachent à vos budgets. Vous retrouvez ce qui
              est prévu, ce qui est dépensé et ce qu’il reste.
            </p>
            <Link href="/#demonstration" className={styles.bandLink}>
              Voir les budgets en action <ArrowUpRight aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.lifeStages} aria-labelledby="stages-heading">
        <div className={styles.intro}>
          <h2 id="stages-heading">
            De nouvelles habitudes.
            <br />
            <span>À chaque nouveau départ.</span>
          </h2>
          <p>
            Pas besoin d’attendre d’avoir un grand projet ou un salaire plus
            élevé. Votre budget peut commencer avec la vie que vous avez
            aujourd’hui.
          </p>
          <div className={styles.stageList}>
            <article>
              <span className={styles.stageNumber} aria-hidden="true">
                01
              </span>
              <div>
                <h3>Un premier salaire, des repères à construire.</h3>
                <p>
                  Le loyer, les transports, les sorties : les premières dépenses
                  arrivent vite. Prévoyez un montant pour chaque poste et voyez
                  la place qu’il reste pour vos envies.
                </p>
              </div>
            </article>
            <article>
              <span className={styles.stageNumber} aria-hidden="true">
                02
              </span>
              <div>
                <h3>Un nouveau rythme, un budget à ajuster.</h3>
                <p>
                  Un déménagement, un changement de travail ou un abonnement de
                  plus : vos dépenses évoluent. Ajustez vos budgets et regardez
                  leur effet sur les mois à venir.
                </p>
              </div>
            </article>
            <article>
              <span className={styles.stageNumber} aria-hidden="true">
                03
              </span>
              <div>
                <h3>L’envie de savoir où passe votre argent.</h3>
                <p>
                  Rattachez vos opérations à vos budgets pour comparer ce que
                  vous aviez prévu et ce que vous avez réellement dépensé. Vous
                  repérez les écarts et choisissez ce que vous voulez changer.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        id="a-deux"
        className={styles.couple}
        data-full-bleed
        aria-labelledby="couple-heading"
      >
        <svg
          className={styles.curveTop}
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 55C320 110 520 0 840 28S1190 85 1440 20V80H0Z" />
        </svg>
        <div data-landing-container className={styles.coupleInner}>
          <div className={styles.intro}>
            <h2 id="couple-heading">
              À deux, préparez la suite
              <br />
              <span>sur des bases claires.</span>
            </h2>
            <p>
              Un chez-vous à aménager, des dépenses à anticiper, une envie de
              partir. Organisez les budgets du foyer que vous suivez pour
              aborder vos projets avec des chiffres concrets.
            </p>
          </div>
          <div className={styles.couplePhoto}>
            <Image
              src="/landing/audience-couple-v1.png"
              alt="Un couple choisit ensemble la peinture pour aménager son appartement."
              fill
              sizes="(max-width: 1440px) 100vw, 1312px"
            />
          </div>
          <div className={styles.benefits}>
            {coupleBenefits.map(({ Icon, title, description }) => (
              <article key={title}>
                <Icon aria-hidden />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <p className={styles.personalNote}>
            <UserRound aria-hidden />
            <span>
              <strong>
                Un compte personnel pour organiser les dépenses du foyer.
              </strong>{" "}
              L’accès partagé entre conjoints n’est pas proposé aujourd’hui.
            </span>
          </p>
        </div>
        <svg
          className={styles.curveBottom}
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 0H1440V30C1120 90 920 0 620 30S220 90 0 35Z" />
        </svg>
      </section>

      <section className={styles.seasons} aria-labelledby="seasons-heading">
        <div className={styles.intro}>
          <h2 id="seasons-heading">
            Les mois se suivent.
            <br />
            <span>Ils ne se ressemblent pas.</span>
          </h2>
          <p>
            Des vacances en été, une rentrée bien remplie, une réparation qui
            tombe mal. Un budget sert aussi à donner une place à ce qui ne
            revient pas tous les mois.
          </p>
        </div>
        <figure className={styles.seasonScene}>
          <div className={styles.seasonPhoto}>
            <Image
              src="/landing/use-cases/weekend.webp"
              alt="Un couple profite d’un café en terrasse pendant un séjour au bord de la mer."
              fill
              sizes="(max-width: 1440px) 100vw, 1312px"
            />
          </div>
          <figcaption>Un départ se prépare aussi dans votre budget.</figcaption>
        </figure>
        <div className={styles.seasonDetails}>
          <article>
            <h3>Avant les vacances.</h3>
            <p>
              Transport, hébergement, activités : détaillez votre projet en
              sous-budgets. Vous voyez le montant prévu pour chaque partie du
              voyage, puis les dépenses au fil des réservations.
            </p>
          </article>
          <article>
            <h3>À l’approche de la rentrée.</h3>
            <p>
              Une inscription au sport, du matériel, un abonnement annuel :
              prévoyez ces dépenses sur les mois concernés pour les retrouver
              aux côtés de vos charges habituelles.
            </p>
          </article>
          <article>
            <h3>Quand un imprévu arrive.</h3>
            <p>
              Une réparation dépasse le montant prévu ? Repérez le dépassement
              et consultez son effet sur votre trésorerie. Vous pouvez revoir
              vos priorités avec une vue sur la suite.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.practical} aria-labelledby="practical-heading">
        <div className={styles.intro}>
          <h2 id="practical-heading">
            Commencez simplement.
            <br />
            <span>Avancez à votre rythme.</span>
          </h2>
          <p>
            Quelques repères pour vous projeter dans votre utilisation de
            Planora.
          </p>
          <div className={styles.questions}>
            <PublicAccordion question="Je n’ai jamais fait de budget. Par où commencer ?">
              <p>
                Commencez par les dépenses que vous connaissez : logement,
                transport, loisirs. Créez un budget pour chaque poste et
                choisissez un montant prévu. Vous pourrez ensuite ajouter des
                sous-budgets et ajuster les montants à mesure que vos besoins se
                précisent.
              </p>
            </PublicAccordion>
            <PublicAccordion question="Est-ce utile si j’ai peu de marge dans mon budget ?">
              <p>
                Vous pouvez suivre les montants qui correspondent à votre
                situation, sans minimum. Comparer vos dépenses au prévu aide à
                identifier ce qui pèse dans votre mois. Planora vous donne de la
                visibilité ; il ne crée pas de marge supplémentaire à votre
                place.
              </p>
            </PublicAccordion>
            <PublicAccordion question="Mes revenus changent selon les mois. Puis-je adapter mes prévisions ?">
              <p>
                Vous pouvez renseigner vos revenus prévus et ajuster vos budgets
                mois par mois. Si un montant change, revoyez vos prévisions pour
                garder des repères cohérents. Les estimations dépendent des
                informations que vous renseignez et des opérations connues.
              </p>
            </PublicAccordion>
            <PublicAccordion question="Dois-je connecter ma banque pour utiliser Planora ?">
              <p>
                Non. Vous pouvez saisir vos opérations manuellement. La formule
                avec synchronisation bancaire permet de retrouver les opérations
                de vos comptes connectés, selon la dernière synchronisation.
                Dans les deux cas, c’est vous qui définissez vos budgets.
              </p>
            </PublicAccordion>
            <PublicAccordion question="Pouvons-nous utiliser le même compte à deux ?">
              <p>
                Planora permet d’organiser les dépenses du foyer depuis un
                compte personnel. Vous pouvez vous appuyer sur cette vue pour
                discuter de vos projets à deux. Un accès partagé avec deux
                connexions distinctes n’est pas proposé aujourd’hui.
              </p>
            </PublicAccordion>
          </div>
          <Link
            href="/contact"
            className={`${landing.textLink} ${styles.contactLink}`}
          >
            Parlons de votre situation <ArrowUpRight aria-hidden />
          </Link>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="start-heading">
        <h2 id="start-heading">
          Votre façon de vivre.
          <br />
          <span>Votre façon de budgétiser.</span>
        </h2>
        <p>
          Commencez par ce qui compte pour vous. Un budget pour le quotidien, un
          autre pour un projet : c’est vous qui choisissez.
        </p>
        <div className={styles.actions}>
          <Link href="/reservation" className={landing.primary}>
            Réserver mon accès <ArrowUpRight aria-hidden />
          </Link>
          <Link href="/#offre" className={landing.textLink}>
            Découvrir les formules <ArrowUpRight aria-hidden />
          </Link>
        </div>
        <p className={styles.reservationNote}>
          Pré-lancement · Réservation gratuite, sans carte bancaire.
        </p>
        <Link href="/securite" className={styles.securityLink}>
          <ShieldCheck aria-hidden />
          Comment vos données sont protégées <ArrowUpRight aria-hidden />
        </Link>
      </section>
      <footer className={landing.footer}>
        <LandingBrand />
        <p>Votre budget. Vos projets. Une vue d’avance.</p>
        <Link href="/#faq">
          Questions fréquentes <ArrowUpRight aria-hidden />
        </Link>
        <Link href="/contact">
          Nous contacter <ArrowUpRight aria-hidden />
        </Link>
      </footer>
    </main>
  );
}
