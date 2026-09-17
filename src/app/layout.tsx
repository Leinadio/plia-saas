import "./globals.css";
import { Bricolage_Grotesque, Schibsted_Grotesk } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";

export const metadata = { title: "Planora" };

// UNE SEULE FONTE, ET C'EST UN CHOIX. Schibsted Grotesk porte les titres, les
// libellés, les commandes et les montants. Un logiciel de travail n'a pas besoin
// d'un couple d'affichage : il a besoin d'une famille qui tienne à 11 px comme à
// 32 px, et dont les chiffres s'alignent. Celle-ci est un grotesque de presse —
// des formes ouvertes, une hauteur d'x généreuse, un caractère qui n'est ni
// l'anonymat d'une fonte système ni le maniérisme d'une fonte de marque.
//
// Variable, servie depuis l'app par next/font : aucun appel réseau à l'exécution.
// L'alignement des virgules vient de `font-variant-numeric: tabular-nums`, posé
// une fois sur le corps du document (cf. globals.css), et non d'une chasse fixe.
const ui = Schibsted_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

// La voix de la page publique ; l’interface du budget conserve sa fonte de travail.
const landingDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-display",
});

// Le contrat de la refonte, écrit une fois et rendu dans la page : ce que cette
// app a décidé d'être, et ce qu'elle refuse d'être. Il survit à la construction,
// donc il reste vérifiable après coup.
const CONTRAT = `<!--
THESIS: Une même harmonie sur la vitrine et le budget, avec le blanc comme respiration.
OWN-WORLD: Monde « La lumière en mouvement » conservé, seed 29f966f4.
Eucalyptus #126b5b pour les actions et revenus, bleu brume #547c91 pour les dépenses,
pêche #edc8b5 pour le contexte et les courbes. Texte et trésorerie anthracite.
Blanc #ffffff en clair. En sombre : anthracite #181a1e, cartes ardoise #22252a,
actions eucalyptus clair #82cfb0, revenus sauge, dépenses bleu brume et alertes corail.
Couleurs opaques et contrastées. Palette sombre approuvée le 17 septembre 2026.
STORY: Repérer le mois, lire les enveloppes, suivre la trésorerie puis ouvrir un montant.
FIRST VIEWPORT: Composition actuelle conservée ; l’accueil montre la promesse et le
verre photographié, le budget ses commandes et son tableau. Accent franc pour agir,
fonds légèrement teintés pour situer. Mêmes rôles sur téléphone et ordinateur.
FORM: Adaptation chromatique approuvée, code-led, harmony-colors-20260916.
Formes, fontes, espaces, textes, photos, mouvements et calculs conservés.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

const themeScript =
  "document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${ui.variable} ${landingDisplay.variable}`}
    >
      <head>
        <Script
          id="plia-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      {/* Rien d'autre ici que l'enveloppe. Le shell de l'application (barre
          produit, notifications, panneau de détail) vit sous
          src/app/app/layout.tsx, derrière la porte de session. */}
      <body>
        {/* Le contrat de direction de la refonte, posé dans le HTML livré et non
            en commentaire JSX : React ne rend pas les commentaires JSX, et un
            contrat que la construction efface n'est vérifiable par personne. */}
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html: CONTRAT,
          }}
        />
        {children}
        {/* Les accusés de réception des actions confirmées (voir toastSucces).
            Ici plutôt que dans le shell : un toast peut suivre une connexion. */}
        <Toaster />
      </body>
    </html>
  );
}
