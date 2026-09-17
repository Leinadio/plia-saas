import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import styles from "./landing-video.module.css";
import videoPoster from "../../public/landing/plia-video-poster.jpg";

export function LandingVideo() {
  return (
    <section
      id="visite-guidee"
      className={styles.section}
      aria-labelledby="video-heading"
    >
      <div className={styles.heading}>
        <p className={styles.eyebrow}>LA VISITE GUIDÉE · 1 MIN 14</p>
        <h2 id="video-heading">Planora, en action.</h2>
        <p className={styles.description}>
          Suivez vos dépenses, ajustez un budget et regardez les mois à venir.
          On vous montre.
        </p>
      </div>
      <figure>
        <HeroVideoDialog
          animationStyle="from-center"
          videoSrc="/videos/plia-visite-guidee.mp4?v=2"
          captionsSrc="/videos/plia-visite-guidee.vtt?v=2"
          thumbnailSrc={videoPoster.src}
          thumbnailAlt="Visite guidée de Planora : le tableau des revenus, dépenses et prévisions, avec des données de démonstration."
          className={styles.preview}
        />
      </figure>
    </section>
  );
}
