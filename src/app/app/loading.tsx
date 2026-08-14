import { SqueletteTableauDeBord } from "@/components/squelettes";

// Ce que le tableau de bord montre pendant qu'il se calcule. Next affiche ce
// fichier dès le clic, avant même que le serveur ait commencé à répondre : c'est
// lui qui remplace la seconde d'écran figé par une seconde d'écran qui se monte.
export default function Loading() {
  return <SqueletteTableauDeBord />;
}
