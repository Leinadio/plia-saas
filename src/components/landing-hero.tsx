import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Link2 } from "lucide-react";
import styles from "./landing.module.css";

export function LandingHero() {
  return (
    <section className={styles.hero} aria-labelledby="landing-title">
      <div className={styles.heroCopy}>
        <h1 id="landing-title">
          Faites de la place <span>à vos projets.</span>
        </h1>
        <p>
          Vos revenus, vos dépenses, vos mois à venir. Plia réunit votre budget
          pour voir ce qu’il restera, avant de décider.
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.primary} href="/connexion">
            Commencer avec Plia <ArrowUpRight aria-hidden />
          </Link>
          <a className={styles.textLink} href="#demonstration">
            Voir Plia en action <ArrowDown aria-hidden />
          </a>
        </div>
        <p className={styles.connectionNote}>
          <Link2 aria-hidden /> Relié à votre banque avec Enable Banking.
        </p>
      </div>
      <div className={styles.heroVisual}>
        <div className={styles.heroArt}>
          <Image
            src="/landing/lumiere-hero-v1.png"
            alt="La lumière traverse deux parois de verre courbe, vert et corail, dans un intérieur lumineux."
            fill
            sizes="(max-width: 700px) 100vw, 54vw"
            preload
            className={styles.artImage}
          />
        </div>
        <div className={styles.heroBalance}>
          <div className={styles.balanceTop}>
            <span>Voir plus loin.</span>
            <ArrowUpRight aria-hidden />
          </div>
          <p>Solde prévu en fin de mois</p>
          <dl>
            <div>
              <dt>Septembre</dt>
              <dd>
                3 502,90 <span>€</span>
              </dd>
            </div>
            <div>
              <dt>Octobre</dt>
              <dd>
                7 032,91 <span>€</span>
              </dd>
            </div>
            <div>
              <dt>Novembre</dt>
              <dd>
                8 762,92 <span>€</span>
              </dd>
            </div>
          </dl>
          <small>Exemple illustratif de budget</small>
        </div>
      </div>
    </section>
  );
}
