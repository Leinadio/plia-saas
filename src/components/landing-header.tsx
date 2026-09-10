import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import styles from "./landing.module.css";
import headerStyles from "./landing-header.module.css";

export function LandingBrand() {
  return (
    <Link href="/" aria-label="Plia, accueil" className={styles.brand}>
      <span className={styles.brandMark} aria-hidden>
        P
      </span>
      Plia
    </Link>
  );
}

export function LandingHeader({ audience = false }: { audience?: boolean }) {
  const home = audience ? "/" : "";
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
          <a href={`${home}#offre`} title="Voir l’offre sur l’accueil">
            L’offre <ArrowDown aria-hidden />
          </a>
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
