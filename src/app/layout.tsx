import "./globals.css";
import { Bricolage_Grotesque, Schibsted_Grotesk } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";

export const metadata = { title: "Plia" };

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
THESIS: Un écran de cartes claires, et UNE masse d'encre : le pied du grand tableau.
L'Historique reste un relevé à colonnes de mois — c'est la forme du produit et elle ne
se discute pas — mais il vit désormais dans une carte, ses familles de colonnes se
distinguent par la densité d'une même ardoise, et l'accent ne sert qu'à commander.
Ailleurs, chaque poste est une ligne à jauge : ce qui est entamé, ce qui reste, et ce
qui a débordé au-delà du bord.
OWN-WORLD: Sol clair légèrement cyan #edf1f2, cartes blanches arrondies à 12 px
cerclées d'un filet et posées sur une ombre courte, encre bleu-ardoise #17222b.
Une sarcelle #0b6e75 qui ne sert QU'À COMMANDER, et trois sens qui ne teintent
que des montants, des pastilles ovales et la jauge : vert portant, rouge tension,
sable attente. Schibsted Grotesk seule, tabulaire.
STORY: L'utilisateur voit quelles enveloppes ont débordé, de combien, et où le
solde atterrit à la fin de chaque mois — puis il va corriger le poste responsable.
FIRST VIEWPORT: Barre produit blanche (Plia, trois destinations, synchro,
calculatrice, notifications) ; sur le tableau de bord, carte d'horizon — une colonne
par mois posée sur la ligne du zéro, le montant écrit au-dessus — puis les relevés et
les enveloppes du mois ; sur l'Historique, la frise des mois et le grand tableau dans
sa carte, fermé par son pied d'encre.
FORM: L'enveloppe. Direction épinglée par l'utilisateur — famille des logiciels de
travail à cartes, sans copier aucun d'eux. Le grand tableau de l'Historique a été
retiré puis rappelé, à sa demande : ce sont les couleurs qui devaient changer, pas lui.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, and DESIGN.md
-->`;

const LANDING_CONTRAT = `<!--
THESIS: La lumière en mouvement. Voir venir ses dépenses laisse de la place aux projets ; une photographie sculpturale remplace le héros logiciel générique.
OWN-WORLD: Verre cintré vert et corail, lumière naturelle, menthe #edf5f0, encre #17222b, commandes #126b5b ; Bricolage Grotesque en titres, Schibsted pour lire. Courbes continues, chiffres sur fonds opaques.
STORY: La personne qui pilote le budget du foyer découvre ses mois à venir, explore les vrais écrans, comprend les enveloppes et la connexion bancaire, puis commence. Offre premium proposée, prix explicitement provisoire.
FIRST VIEWPORT: Promesse monumentale et action à gauche ; verre photographié à droite, aperçu chiffré au pied. Sur mobile, promesse et action précèdent l’image. Une lumière suit le changement de vue ; mouvement réduit respecté.
FORM: Verre coloré des intérieurs contemporains, candidat 7 ; seed 29f966f4, direction choisie par l’utilisateur, code-led.
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
          dangerouslySetInnerHTML={{ __html: `${CONTRAT}${LANDING_CONTRAT}` }}
        />
        {children}
        {/* Les accusés de réception des actions confirmées (voir toastSucces).
            Ici plutôt que dans le shell : un toast peut suivre une connexion. */}
        <Toaster />
      </body>
    </html>
  );
}
