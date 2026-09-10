import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import styles from "./landing-video.module.css";

export function LandingVideo() {
  return (
    <section
      id="visite-guidee"
      className={styles.section}
      aria-labelledby="video-heading"
    >
      <div className={styles.heading}>
        <p className={styles.eyebrow}>LA VISITE GUIDÉE · 1 MIN 14</p>
        <h2 id="video-heading">Plia, en action.</h2>
        <p className={styles.description}>
          Suivez vos dépenses, ajustez un budget et regardez les mois à venir.
          On vous montre.
        </p>
      </div>
      <figure className={styles.figure}>
        <HeroVideoDialog
          animationStyle="from-center"
          videoSrc="/videos/plia-visite-guidee.mp4?v=2"
          captionsSrc="/videos/plia-visite-guidee.vtt?v=2"
          thumbnailSrc="/landing/plia-video-poster.jpg"
          thumbnailAlt="Visite guidée de Plia : une enveloppe ouverte et le détail des achats à droite."
          className={styles.preview}
        />
        <figcaption>
          Les vrais écrans de Plia · Données de démonstration · Voix générée par
          IA
        </figcaption>
      </figure>
    </section>
  );
}
