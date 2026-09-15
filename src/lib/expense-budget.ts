// Un remboursement partiel réduit le coût net et peut créer un excédent de
// budget. Quand toutes les sorties sont remboursées, la dépense est terminée :
// son budget ne doit plus être réservé ni présenté comme disponible à dépenser.
// Un éventuel remboursement supérieur aux sorties reste un vrai apport.
export function expenseBudgetPosition(budget: number, netSpent: number, refunded: number) {
  const grossSpent = netSpent + refunded;
  const settled = refunded > 0 && grossSpent >= 0.005 && netSpent < 0.005;
  const net = Math.abs(netSpent) < 0.005 ? 0 : netSpent;
  return {
    balance: settled ? -net || 0 : budget - netSpent,
    plannedExpense: settled ? net : budget,
  };
}
