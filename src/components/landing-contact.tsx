import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getContactConfig } from "@/lib/contact/email";
import { ContactForm } from "./contact-form";
import styles from "./contact.module.css";
export function LandingContact() {
  return (
    <section
      id="contact"
      className={styles.landing}
      aria-labelledby="contact-heading"
    >
      <div className={styles.intro}>
        <h1 id="contact-heading">
          Une question ?<br />
          <span>On vous écoute.</span>
        </h1>
        <p>
          Une précision sur Planora, une idée à partager ou un souci rencontré ?
          Prenez un moment pour nous écrire.
        </p>
        <div className={styles.faqLink}>
          <p>À propos des offres ou de la connexion bancaire…</p>
          <Link href="/#faq">
            Les réponses aux questions fréquentes{" "}
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </div>
      <ContactForm source="landing" available={getContactConfig() !== null} />
    </section>
  );
}
