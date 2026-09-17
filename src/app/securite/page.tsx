import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Fingerprint,
  KeyRound,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { LandingBrand, LandingHeader } from "@/components/landing-header";
import { PlanoraMark } from "@/components/planora-mark";
import { PublicAccordion } from "@/components/public-accordion";
import landing from "@/components/landing.module.css";
import layout from "@/components/landing-layout.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sécurité et protection de vos données — Planora",
  description:
    "Découvrez comment Planora protège votre espace : connexion bancaire via un AISP, lecture seule, autorisation bancaire et données séparées entre utilisateurs.",
};

const protections = [
  {
    Icon: KeyRound,
    title: "Un accès lié à votre identité.",
    text: "Votre session identifie votre compte. Sans connexion, les pages et les actions qui utilisent vos données personnelles ne sont pas accessibles.",
  },
  {
    Icon: UserRound,
    title: "Vos données restent dans votre espace.",
    text: "Les comptes, les opérations et les budgets sont rattachés à leur propriétaire. Les contrôles d’accès de l’application et de la base séparent les données entre utilisateurs.",
  },
  {
    Icon: LockKeyhole,
    title: "Des échanges bancaires chiffrés.",
    text: "Planora communique avec le prestataire bancaire via HTTPS. Les requêtes sont authentifiées côté serveur ; les clés d’accès du service ne sont pas envoyées à votre navigateur.",
  },
];

export default function SecurityPage() {
  return (
    <main className={`${landing.landing} ${layout.page} ${styles.page}`}>
      <LandingHeader homeLinks security />
      <section className={styles.hero} aria-labelledby="security-heading">
        <div>
          <h1 id="security-heading">
            Votre budget est personnel.
            <br />
            <span>Vos données le restent.</span>
          </h1>
          <p>
            Votre confiance se construit sur des faits. Une connexion bancaire
            autorisée par vous, un accès en lecture seule et un espace protégé
            pour vos données.
          </p>
          <a href="#connexion-bancaire" className={landing.textLink}>
            Comprendre la protection de mes données <ArrowDown aria-hidden />
          </a>
        </div>
        <div className={styles.promise}>
          <div className={styles.heroPhoto}>
            <Image
              src="/landing/audience-solo-v1.png"
              alt="Un moment de lecture au calme, sur une terrasse lumineuse."
              fill
              priority
              sizes="(max-width: 1056px) 100vw, 960px"
            />
          </div>
          <div className={styles.promiseBody}>
            <div className={styles.shield}>
              <ShieldCheck aria-hidden />
              <span>Votre espace Planora</span>
            </div>
            <ul>
              <li>
                <Check aria-hidden />
                <span>Votre autorisation avant la connexion</span>
              </li>
              <li>
                <Check aria-hidden />
                <span>Vos comptes consultés, aucun virement</span>
              </li>
              <li>
                <Check aria-hidden />
                <span>Vos données séparées de celles des autres</span>
              </li>
            </ul>
            <p>Votre argent reste chez votre banque.</p>
          </div>
        </div>
      </section>

      <section
        id="connexion-bancaire"
        className={styles.connectionSection}
        aria-labelledby="connection-heading"
      >
        <div className={styles.sectionIntro}>
          <h2 id="connection-heading">
            Une connexion autorisée.
            <br />
            <span>Un rôle pour chacun.</span>
          </h2>
          <p>
            Pour synchroniser vos comptes, Planora s’appuie sur un{" "}
            <abbr title="Account Information Service Provider">AISP</abbr> : un
            prestataire de services d’information sur les comptes, en anglais{" "}
            <span lang="en">Account Information Service Provider</span>.
          </p>
        </div>
        <ol className={styles.journey}>
          <li>
            <Landmark aria-hidden />
            <h3>Votre banque</h3>
            <p>
              Vous vous authentifiez dans le parcours de votre banque et
              autorisez l’accès aux comptes concernés. Vos identifiants
              bancaires ne sont pas saisis dans Planora.
            </p>
            <span className={styles.journeyLabel}>
              Vous donnez votre accord
            </span>
          </li>
          <li>
            <Fingerprint aria-hidden />
            <h3>Le prestataire AISP</h3>
            <p>
              Il fait le lien avec la banque pour récupérer les informations des
              comptes autorisés, comme les soldes et les opérations.
            </p>
            <span className={styles.journeyLabel}>
              Les informations sont transmises
            </span>
          </li>
          <li>
            <PlanoraMark className={styles.mark} />
            <h3>Votre espace Planora</h3>
            <p>
              Les opérations alimentent votre relevé. Vous les retrouvez pour
              suivre vos dépenses, organiser vos budgets et préparer la suite.
            </p>
            <span className={styles.journeyLabel}>
              Vous pilotez votre budget
            </span>
          </li>
        </ol>
        <div className={styles.readOnly}>
          <ShieldCheck aria-hidden />
          <p>
            <strong>
              Lire vos comptes ne permet pas de déplacer votre argent.
            </strong>{" "}
            La connexion utilisée par Planora sert à consulter les informations
            bancaires. Planora ne réalise aucun virement.
          </p>
        </div>
        <a
          className={styles.source}
          href="https://acpr.banque-france.fr/fr/professionnels/lacpr-vous-accompagne/parcours-fintech/contenus-pedagogiques/de-quel-statut-releve-mon-activite/jaccede-aux-api-des-banques-jinitie-des-ordres-pour-le-compte-de-mes-clients"
        >
          Comprendre le service d’information sur les comptes avec l’ACPR{" "}
          <ArrowUpRight aria-hidden />
        </a>
      </section>

      <section
        id="protection"
        className={styles.protection}
        data-full-bleed
        aria-labelledby="protection-heading"
      >
        <svg
          className={styles.curveTop}
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 55C320 110 520 0 840 28S1190 85 1440 20V80H0Z" />
        </svg>
        <div data-landing-container className={styles.protectionInner}>
          <div className={styles.protectionIntro}>
            <LockKeyhole aria-hidden />
            <h2 id="protection-heading">
              Des protections concrètes.
              <br />
              <span>À chaque accès.</span>
            </h2>
            <p>
              La protection ne repose pas seulement sur votre mot de passe.
              Plusieurs contrôles encadrent l’accès à votre espace et à vos
              informations.
            </p>
            <div className={styles.protectionPhoto}>
              <Image
                src="/landing/lumiere-hero-v1.png"
                alt="Des parois de verre courbes, vertes et ambrées, filtrent la lumière."
                fill
                sizes="(max-width: 856px) 100vw, 760px"
              />
            </div>
          </div>
          <div className={styles.protectionList}>
            {protections.map(({ Icon, title, text }) => (
              <article key={title}>
                <Icon aria-hidden />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
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

      <section className={styles.dataSection} aria-labelledby="data-heading">
        <div className={styles.sectionIntro}>
          <h2 id="data-heading">
            Des données pour votre budget.
            <br />
            <span>Un usage expliqué.</span>
          </h2>
          <p>
            Voici les principales informations utilisées dans votre espace et ce
            qu’elles permettent de faire.
          </p>
        </div>
        <dl className={styles.dataList}>
          <div>
            <dt>Votre compte Planora</dt>
            <dd>
              Votre nom, votre adresse e-mail et les informations de connexion
              permettent de vous identifier et de retrouver votre espace.
            </dd>
          </div>
          <div>
            <dt>Vos comptes bancaires</dt>
            <dd>
              Les références des comptes autorisés et leurs soldes permettent de
              relier vos opérations au bon compte et de suivre votre trésorerie.
            </dd>
          </div>
          <div>
            <dt>Vos opérations</dt>
            <dd>
              Les libellés, dates et montants permettent de consulter vos
              mouvements, de les rechercher et de les rattacher à vos budgets.
            </dd>
          </div>
          <div>
            <dt>Vos choix de budget</dt>
            <dd>
              Vos montants prévus, sous-budgets et règles de classement
              permettent d’organiser vos dépenses et de calculer les prévisions.
            </dd>
          </div>
        </dl>
        <p className={styles.dataNote}>
          La synchronisation reflète les dernières données récupérées auprès de
          la banque. Elle ne constitue pas un suivi en temps réel.
        </p>
      </section>

      <section className={styles.choices} aria-labelledby="choices-heading">
        <div>
          <h2 id="choices-heading">
            La connexion bancaire
            <br />
            <span>reste votre choix.</span>
          </h2>
          <p>
            La formule sans connexion bancaire permet de suivre un budget avec
            une saisie manuelle. Avec la formule connectée, l’accès aux
            informations bancaires passe par votre autorisation.
          </p>
          <Link href="/#offre" className={landing.textLink}>
            Comparer les deux formules <ArrowRight aria-hidden />
          </Link>
        </div>
        <div className={styles.questions}>
          <PublicAccordion question="Planora connaît-il mon mot de passe bancaire ?">
            <p>
              Vous ne saisissez pas votre mot de passe bancaire dans Planora.
              L’authentification et l’autorisation se font dans le parcours de
              votre banque. Planora reçoit les informations nécessaires à la
              connexion, puis les données des comptes autorisés.
            </p>
          </PublicAccordion>
          <PublicAccordion question="Pourquoi ma banque demande-t-elle une nouvelle autorisation ?">
            <p>
              L’autorisation bancaire a une durée limitée. Lorsque votre banque
              demande de la renouveler, vous repassez par son parcours pour
              permettre de nouvelles synchronisations.
            </p>
          </PublicAccordion>
          <PublicAccordion question="Un autre utilisateur peut-il consulter mon budget ?">
            <p>
              Les données de votre compte sont séparées de celles des autres
              utilisateurs. Les lectures et modifications vérifient à qui
              appartiennent les comptes, opérations et budgets concernés.
            </p>
          </PublicAccordion>
          <PublicAccordion question="Comment faire une demande concernant mes données ?">
            <p>
              Pour une demande d’accès, de correction ou de suppression de vos
              données, <Link href="/contact">contactez-nous</Link>. N’envoyez
              pas de mot de passe, de code bancaire ou de relevé complet dans
              votre message.
            </p>
          </PublicAccordion>
        </div>
      </section>

      <section
        className={styles.contact}
        aria-labelledby="security-contact-heading"
      >
        <ShieldCheck aria-hidden />
        <div>
          <h2 id="security-contact-heading">
            La confiance mérite
            <br />
            des réponses claires.
          </h2>
          <p>
            Une question sur vos données ou une inquiétude à nous signaler ?
            Parlons-en.
          </p>
        </div>
        <Link href="/contact" className={landing.primary}>
          Nous contacter <ArrowUpRight aria-hidden />
        </Link>
      </section>
      <footer className={landing.footer}>
        <LandingBrand />
        <p>Votre budget. Vos projets. Une vue d’avance.</p>
        <Link href="/">
          Retour à l’accueil <ArrowUpRight aria-hidden />
        </Link>
        <Link href="/contact">
          Nous contacter <ArrowUpRight aria-hidden />
        </Link>
      </footer>
    </main>
  );
}
