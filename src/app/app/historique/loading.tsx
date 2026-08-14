import { SqueletteHistorique } from "@/components/squelettes";

// L'écran le plus long à calculer de l'app : il relit toutes les transactions,
// tous les budgets datés, et rejoue les chaînes de solde sur la fenêtre entière.
// C'est donc ici que l'attente sans repère se voyait le plus.
export default function Loading() {
  return <SqueletteHistorique />;
}
