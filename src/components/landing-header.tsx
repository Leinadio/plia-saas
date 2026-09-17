import Link from "next/link";
import { PlanoraMark } from "./planora-mark";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import styles from "./landing.module.css";
import headerStyles from "./landing-header.module.css";

export function LandingBrand() {
  return (
    <Link href="/" aria-label="Planora, accueil" className={styles.brand}>
      <PlanoraMark className={styles.brandMark} />
      Planora
    </Link>
  );
}

export function LandingHeader({
  audience = false,
  homeLinks = false,
  contact = false,
}: {
  audience?: boolean;
  homeLinks?: boolean;
  contact?: boolean;
}) {
  const home = audience || homeLinks ? "/" : "";
  return (
    <header className={`${styles.header} ${headerStyles.header}`}>
      <LandingBrand />
      <div className={headerStyles.center}>
        <nav
          aria-label="Sections de l’accueil"
          className={headerStyles.sections}
        >
          <a
            href={`${home}#demonstration`}
            title="Voir le produit sur l’accueil"
          >
            Le produit <ArrowDown aria-hidden />
          </a>
          <a
            href={`${home}#fonctionnement`}
            title="Voir le fonctionnement sur l’accueil"
          >
            Fonctionnement <ArrowDown aria-hidden />
          </a>
          <a href={`${home}#offre`} title="Voir les offres sur l’accueil">
            Les offres <ArrowDown aria-hidden />
          </a>
          <Link
            href="/contact"
            title="Nous écrire"
            aria-current={contact ? "page" : undefined}
          >
            Contact <ArrowUpRight aria-hidden />
          </Link>
        </nav>
        <div className={headerStyles.pageGroup}>
          <span className={headerStyles.separator} aria-hidden>
            /
          </span>
          <Link
            href="/pour-qui"
            className={headerStyles.pageLink}
            aria-current={audience ? "page" : undefined}
          >
            Pour qui ? <ArrowUpRight aria-hidden />
          </Link>
        </div>
      </div>
      <Link href="/connexion" className={styles.headerLogin}>
        Se connecter <ArrowUpRight aria-hidden />
      </Link>
    </header>
  );
}
