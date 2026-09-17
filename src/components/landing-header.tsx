"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}
const getScrolled = () => window.scrollY > 120;
const serverScrolled = () => false;

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
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    getScrolled,
    serverScrolled,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const panel = panelRef.current;
    if (!shell || !panel) return;
    const root = document.documentElement;
    const previous = root.style.getPropertyValue("--public-header-height");
    const measure = () => {
      const height = panel.getBoundingClientRect().height;
      if (!height) return;
      // Reserve the same space before and after the bar becomes fixed.
      shell.style.height = `${height}px`;
      root.style.setProperty("--public-header-height", `${height}px`);
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(panel);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      if (previous) root.style.setProperty("--public-header-height", previous);
      else root.style.removeProperty("--public-header-height");
    };
  }, []);

  return (
    <div ref={shellRef} className={headerStyles.shell} data-scrolled={scrolled}>
      <div ref={panelRef} className={headerStyles.panel}>
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
