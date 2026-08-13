import "./globals.css";
import { Archivo, Azeret_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

export const metadata = { title: "Plia" };

// Deux fontes, deux rôles, une seule idée : l'app est une pièce d'appareillage,
// pas un document. next/font les télécharge à la construction et les sert depuis
// l'app — aucun appel réseau à l'exécution.
//
// Archivo est variable sur l'axe de chasse. Resserrée (wdth 86, cf. .font-display
// dans globals.css) elle donne la capitale gravée des plaques d'atelier ; à sa
// chasse normale elle porte l'interface courante.
const ui = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-ui",
});

// Azeret Mono pour TOUT ce qui est chiffre, mesure ou état. Ses formes carrées
// viennent de la lecture d'instrument, et sa chasse fixe fait que la virgule et
// les milliers tombent au même endroit d'une ligne à l'autre : une colonne de
// montants se lit verticalement, d'un coup d'œil.
const num = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-num",
});

// Le contrat de la refonte, écrit une fois et rendu dans la page : ce que cette
// app a décidé d'être, et ce qu'elle refuse d'être. Il survit à la construction,
// donc il reste vérifiable après coup.
const CONTRAT = `<!--
THESIS: Un budget est une structure en tenségrité — des mâts qui portent (le solde
acquis, les revenus), des câbles qui tirent (les dépenses engagées, les reports).
Refuse la carte arrondie et la courbe de tendance du tableau de bord bancaire.
OWN-WORLD: Sol béton #e6e3df, structure carbone #0d000f, un seul accent — rouge de
tension #d7262e — et du cendre pour le dormant. Angles coupés à 45°, filets d'un
pixel, étiquettes en pastilles noires capitales, chiffres en mono technique alignés
à droite.
STORY: L'utilisateur voit où le câble fléchit le plus, sait quel mois casse, et va
corriger le poste responsable.
FIRST VIEWPORT: Poutre carbone (Plia, trois destinations) ; plan de charge pleine
largeur — un mât par mois posé sur la ligne du zéro, câble tendu entre eux, mât
rompu là où le solde passe dessous ; bande de relevés ; puis entrées et sorties en
deux tables denses.
FORM: Colonne en tenségrité, challenger choisi par l'utilisateur contre le tirage
(assigné 4/7), clé 4ed98fa0 ; composition B approuvée.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, and DESIGN.md
-->`;

const themeScript =
  "document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${ui.variable} ${num.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Rien d'autre ici que l'enveloppe. Le shell de l'application (rail de
          navigation, bandeau, notifications) vit sous src/app/app/layout.tsx,
          derrière la porte de session. */}
      <body>
        {/* Le contrat de direction de la refonte, posé dans le HTML livré et non
            en commentaire JSX : React ne rend pas les commentaires JSX, et un
            contrat que la construction efface n'est vérifiable par personne. */}
        <div hidden dangerouslySetInnerHTML={{ __html: CONTRAT }} />
        {children}
        {/* Les accusés de réception des actions confirmées (voir toastSucces).
            Ici plutôt que dans le shell : un toast peut suivre une connexion. */}
        <Toaster />
      </body>
    </html>
  );
}
