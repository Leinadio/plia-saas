import "./globals.css";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

export const metadata = { title: "Budget" };

// Trois fontes, trois rôles, une seule idée : l'app se lit comme un relevé de
// compte imprimé. next/font les télécharge à la construction et les sert depuis
// l'app — aucun appel réseau à l'exécution, ce qui compte pour une app locale.
//
// Fraunces, en display, uniquement sur les noms de mois et les titres de compte :
// une serif à fort contraste qui donne aux mois un statut de titre de chapitre.
// Employée avec parcimonie, elle ne touche jamais une donnée.
const display = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
  // Nom distinct du jeton Tailwind --font-display, sinon la variable de thème
  // se référencerait elle-même.
  variable: "--font-display-vf",
});

// IBM Plex Sans pour l'interface : dessinée pour la donnée, elle s'accorde
// nativement avec sa mono (mêmes proportions), et ce n'est ni Inter ni la pile
// système par défaut.
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans-ui",
});

// IBM Plex Mono pour TOUT ce qui est chiffre. C'est le pari de la refonte :
// une chasse fixe fait que la virgule, les centimes et les milliers tombent au
// même endroit d'une ligne à l'autre. Une colonne de montants se lit alors
// verticalement, d'un coup d'œil, comme sur un relevé papier.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-num",
});

const themeScript =
  "document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Rien d'autre ici que l'enveloppe. Le shell de l'application (barre latérale,
          en-tête, notifications) vit sous src/app/app/layout.tsx, derrière la porte de
          session. La landing et l'écran de connexion n'en veulent pas. */}
      <body>
        {children}
        {/* Les accusés de réception des actions confirmées (voir toastSucces).
            Ici plutôt que dans le shell : un toast peut suivre une connexion. */}
        <Toaster />
      </body>
    </html>
  );
}
