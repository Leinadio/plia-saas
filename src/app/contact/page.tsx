import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LandingBrand, LandingHeader } from "@/components/landing-header";
import { LandingContact } from "@/components/landing-contact";
import landing from "@/components/landing.module.css";
import layout from "@/components/landing-layout.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Contact — Planora",
  description: "Une question sur Planora, une idée ou un souci ? Écrivez-nous.",
};

export default function PublicContactPage() {
  return (
    <main className={`${landing.landing} ${layout.page}`}>
      <LandingHeader homeLinks contact />
      <LandingContact />
      <footer className={landing.footer}>
        <LandingBrand />
        <p>Votre budget. Vos projets. Une vue d’avance.</p>
        <Link href="/">
          Retour à l’accueil <ArrowUpRight aria-hidden />
        </Link>
        <Link href="/#faq">
          Questions fréquentes <ArrowUpRight aria-hidden />
        </Link>
      </footer>
    </main>
  );
}
