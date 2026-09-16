import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getContactConfig } from "@/lib/contact/email";
import { ContactForm } from "@/components/contact-form";
import styles from "@/components/contact.module.css";
export const metadata = { title: "Contact — Planora" };
export default async function ContactPage() {
  const session = await auth().api.getSession({ headers: await headers() });
  if (!session) redirect("/connexion");
  return (
    <div className={styles.app}>
      <div className={styles.appIntro}>
        <h2>
          Un retour, une idée,
          <br />
          un coup de main ?
        </h2>
        <p>
          Dites-nous ce qui vous serait utile. Si quelque chose bloque, décrivez
          ce que vous essayiez de faire et ce qui s’est passé.
        </p>
        <p>
          Votre message ne joint aucune opération ni aucun montant de votre
          budget.
        </p>
      </div>
      <ContactForm
        source="application"
        initialEmail={session.user.email}
        available={getContactConfig() !== null}
      />
    </div>
  );
}
