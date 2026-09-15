// --- Modèle de colonnes par type de mois -----------------------------------
// Les colonnes affichées dépendent de la position du mois par rapport au mois
// courant : un mois passé garde les colonnes réelles, le mois courant y ajoute
// les projections (prévu / dépassement), un mois futur ne montre plus le réel.
export type MonthType = "past" | "current" | "future";
export type ColKey =
  | "budgetRem" | "budgetDep" | "dep" | "recu" | "reste"
  | "soldeReel" | "soldePrevu" | "soldeDepass";

export function monthType(m: string, currentMonth: string): MonthType {
  return m < currentMonth ? "past" : m === currentMonth ? "current" : "future";
}

export function monthColumns(type: MonthType): ColKey[] {
  const base: ColKey[] = ["budgetRem", "budgetDep", "dep", "recu", "reste", "soldeReel", "soldePrevu"];
  // Sur les mois de projection, « Solde si dépassement » ne dirait que la même chose
  // que « Solde prévu » (les dépassements permanents sont passés dans le budget) : on
  // ne l'affiche que sur les mois passés et le mois en cours.
  return type === "future" ? base : [...base, "soldeDepass"];
}

export const COL_LABEL: Record<ColKey, string> = {
  budgetRem: "Budget rém.",
  budgetDep: "Budget dép.",
  dep: "Dép.",
  recu: "Reçu",
  reste: "Reste / manque",
  soldeReel: "Opérations réelles",
  soldePrevu: "Selon vos budgets",
  soldeDepass: "Dépassements inclus",
};

// Explication complète de chaque colonne, affichée dans le side panel quand on clique
// son en-tête (un paragraphe par entrée).
export const COL_INFO: Record<ColKey, string[]> = {
  budgetRem: [
    "L’argent que vous comptez recevoir ce mois-ci. Il s’agit d’une prévision : la colonne Reçu montre ce qui est réellement arrivé sur le compte.",
    "Un revenu récurrent est repris les mois suivants. Une rentrée prévue uniquement pour ce mois ne l’est pas.",
  ],
  budgetDep: [
    "La somme que vous prévoyez de consacrer à cette enveloppe ce mois-ci. Dépensé montre les sorties réelles ; Reste / manque indique la marge dans cette enveloppe.",
    "Définir un budget ne déplace pas d’argent. Les colonnes de trésorerie à droite montrent son effet sur vos prévisions.",
  ],
  dep: [
    "La somme entière sortie du compte pour cette enveloppe. Les remboursements sont affichés séparément : ils ne sont pas déduits de ce montant.",
    "Par exemple, vous payez 150 € et recevez un remboursement de 80 € : Dépensé affiche 150 €, Remboursements / apports affiche 80 €.",
  ],
  recu: [
    "La somme réellement arrivée sur le compte pour ce revenu. Attendu indique ce que vous comptiez recevoir ; Reçu indique les opérations connues.",
    "Si vous rendez un trop-perçu, cette sortie apparaît dans les opérations du revenu. Le parcours de trésorerie tient compte de l’entrée et du retour.",
  ],
  reste: [
    "La marge de cette enveloppe : budget moins dépensé, plus remboursements et apports. Ce montant n’est pas votre solde bancaire. Un nombre positif indique une marge ; un nombre négatif indique un dépassement.",
    "Par exemple : 100 € de budget, 150 € dépensés et 80 € remboursés donnent 30 € de marge.",
    "Une dépense entièrement remboursée est terminée : sa réservation de budget est clôturée, le reste revient à zéro. Si le remboursement dépasse la dépense, seul l’excédent reçu reste disponible. Le détail du calcul précise les budgets clôturés.",
  ],
  soldeReel: [
    "Ce parcours reconstitue votre trésorerie à partir de l’argent de départ et des opérations connues. Chaque ligne montre le mouvement net de l’enveloppe, puis le montant restant après cette étape.",
    "Par exemple : 1 000 € avant l’enveloppe, 120 € retirés, 880 € restants. Un remboursement compense la dépense. Si le mouvement est nul, la case reste vide et le calcul continue avec le montant précédent.",
    "Les étapes suivent l’ordre des enveloppes dans le tableau, pas les dates des opérations. Seul le résultat final du mois courant correspond à la trésorerie actuelle, connue à la dernière synchronisation bancaire.",
    "Sur un mois passé, le résultat est la trésorerie en fin de mois. Sur un mois futur, l’estimation de fin du mois courant est prolongée sans opérations futures : il ne s’agit pas d’un solde bancaire déjà connu.",
  ],
  soldePrevu: [
    "Ce parcours montre la trésorerie prévue si les revenus attendus sont reçus et si les budgets définis sont dépensés. Il part de l’argent de départ, ajoute les revenus prévus et retire les budgets, enveloppe après enveloppe.",
    "Chaque case sépare le mouvement prévu du montant restant à cette étape. Le résultat final est une prévision de fin de mois, pas l’argent disponible aujourd’hui.",
    "Une dépense intégralement remboursée est terminée : son budget n’est plus retiré ce mois-ci. Un remboursement supérieur à la dépense laisse son excédent. Les budgets des mois suivants restent ceux que vous avez définis.",
    "Le premier mois futur part de l’estimation de fin du mois courant. Ensuite, chaque prévision de fin de mois devient le point de départ du suivant.",
  ],
  soldeDepass: [
    "Ce parcours reprend vos budgets et retire aussi les dépassements déjà constatés. Il permet de voir leur effet sur la trésorerie prévue, enveloppe après enveloppe.",
    "Par exemple : un budget de 100 €, une dépense nette de 130 €. Le parcours Selon vos budgets retire 100 € ; le parcours Dépassements inclus retire 130 €. Le résultat reste une prévision, car d’autres revenus et dépenses peuvent encore arriver.",
    "Un remboursement réduit la dépense nette et peut couvrir le dépassement. Une dépense intégralement remboursée ne retire plus d’argent dans ce calcul.",
    "Les dépassements ne sont pas reconduits automatiquement sur les mois futurs. Leur prévision suit les budgets définis pour ces mois.",
  ],
};
