import { SqueletteTransactions } from "@/components/squelettes";

// Le relevé se charge en entier, non comptabilisées comprises, et cherche en plus
// les doublons à rapprocher : le pupitre de filtres et les premiers mois tiennent
// la place pendant ce temps.
export default function Loading() {
  return <SqueletteTransactions />;
}
