"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PlanoraMark } from "./planora-mark";
import { ArrowDown, ArrowUpRight, Menu, X } from "lucide-react";
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
  security = false,
}: {
  audience?: boolean;
  homeLinks?: boolean;
  contact?: boolean;
  security?: boolean;
}) {
  const home = audience || homeLinks ? "/" : "";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={headerStyles.shell}>
      <div className={headerStyles.panel}>
        <header
          className={`${styles.header} ${headerStyles.header}`}
          data-menu-open={menuOpen}
          onKeyDown={(event) => {
            if (event.key === "Escape" && menuOpen) {
              setMenuOpen(false);
              menuRef.current?.focus();
            }
          }}
        >
          <LandingBrand />
          <button
            ref={menuRef}
            type="button"
            className={headerStyles.menuButton}
            aria-controls="public-sections"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />} Menu
          </button>
          <nav
            id="public-sections"
            aria-label="Sections de l’accueil"
            className={headerStyles.sections}
          >
            <a
              href={`${home}#demonstration`}
              onClick={() => setMenuOpen(false)}
            >
              Le produit <ArrowDown aria-hidden />
            </a>
            <a
              href={`${home}#fonctionnement`}
              onClick={() => setMenuOpen(false)}
            >
              Fonctionnement <ArrowDown aria-hidden />
            </a>
            <a href={`${home}#offre`} onClick={() => setMenuOpen(false)}>
              Les offres <ArrowDown aria-hidden />
            </a>
          </nav>
          <div className={headerStyles.right}>
            <nav aria-label="Pages de Planora" className={headerStyles.pages}>
              <Link
                href="/pour-qui"
                aria-current={audience ? "page" : undefined}
              >
                Pour qui ? <ArrowUpRight aria-hidden />
              </Link>
              <Link
                href="/securite"
                aria-current={security ? "page" : undefined}
              >
                Sécurité <ArrowUpRight aria-hidden />
              </Link>
              <Link href="/contact" aria-current={contact ? "page" : undefined}>
                Contact <ArrowUpRight aria-hidden />
              </Link>
            </nav>
            <Link href="/reservation" className={headerStyles.reserve}>
              Réserver mon accès <ArrowUpRight aria-hidden />
            </Link>
          </div>
        </header>
      </div>
    </div>
  );
}
