import Link from "next/link";
import { listAccounts } from "../../db/repositories/accounts";
import { listTransactions, sumIgnoredByAccount, type TxnView } from "../../db/repositories/transactions";
import { listGroups } from "../../db/repositories/groups";
import { listBudgetAmounts } from "../../db/repositories/budget-amounts";
import { listLineAmounts } from "../../db/repositories/line-amounts";
import {
  computeHistory, computeSolde, grandTotals, monthlyOverspend, monthRange, addMonthsKey,
  toDatedBudgets, toDatedLineAmounts,
} from "../../lib/history";
import type { Group, Txn } from "../../lib/forecast";
import { monthPhrase, monthShort } from "../../lib/transactions-view";
import { currentMonthKey } from "../../lib/current-month";
import { effectiveBalance } from "../../lib/account";
import { PlanDeCharge } from "@/components/plan-de-charge";
import { RelevesBand } from "@/components/releves-band";
import { PosteTable } from "@/components/poste-table";

import { pourMoi } from "@/lib/current-user";

export const dynamic = "force-dynamic";

// Six mois : le mois courant et cinq devant. Assez pour voir venir une rentrée
// d'argent qui glisse, assez peu pour que six mâts tiennent sur un téléphone.
const PORTEE = 6;

export default async function Dashboard() {
  const currentMonth = currentMonthKey(new Date());
  const months = monthRange(currentMonth, addMonthsKey(currentMonth, PORTEE - 1));

  const toTxn = (t: TxnView): Txn => ({
    id: t.id, date: t.date, amount: t.amount, label: t.label,
    accountId: t.accountId, groupId: t.groupId, lineId: t.lineId,
    excluded: t.excluded, comment: t.comment,
  });
  // Tout ce que la page lit, en une fois et au nom de la personne connectée.
  // Une transaction non comptabilisée doit se comporter comme si elle n'existait
  // pas, y compris dans le solde affiché : le solde de la banque la contient, on la
  // retranche donc partout.
  const { accounts, ignoredByAccount, allTxns, groups, datedBudgets, datedLines } =
    await pourMoi(async (database, userId) => ({
      accounts: await listAccounts(database, userId),
      ignoredByAccount: await sumIgnoredByAccount(database),
      allTxns: (await listTransactions(database, userId)).map(toTxn) as Txn[],
      groups: (await listGroups(database, userId)) as Group[],
      datedBudgets: toDatedBudgets(await listBudgetAmounts(database)),
      datedLines: toDatedLineAmounts(await listLineAmounts(database)),
    }));

  if (accounts.length === 0) {
    return (
      <div className="plate mx-auto max-w-lg px-5 py-8 text-center">
        <p className="font-mono text-xs tracking-[0.09em] uppercase">Rien à porter</p>
        <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-sm">
          Aucun compte n&apos;est encore relié. Connecte ta banque et le plan de charge
          se dresse tout seul.
        </p>
        <Link
          href="/app/settings"
          className="cut cut-sm bg-primary text-primary-foreground mt-5 inline-flex h-9 items-center px-4 font-mono text-[0.6875rem] tracking-[0.08em] uppercase"
        >
          Connecter une banque
        </Link>
      </div>
    );
  }

  const balance = accounts.reduce(
    (s, a) => s + effectiveBalance(a.balance, ignoredByAccount[a.id]),
    0,
  );

  // Le même moteur que l'Historique, mais tous comptes confondus : ce que cette
  // page montre, c'est la structure entière, pas un compte à la fois.
  const sections = computeHistory(groups, allTxns, months, currentMonth, datedBudgets, datedLines);
  const solde = computeSolde(sections, months, currentMonth, balance);
  const totaux = grandTotals(sections, months.length);

  const mois = months.map((m, i) => ({
    key: m,
    label: monthShort(m, currentMonth),
    solde: solde.closings[i],
  }));

  const income = sections.find((s) => s.kind === "income");
  const expense = sections.find((s) => s.kind === "expense");
  const entrees = (income?.rows ?? []).filter((r) => r.aliveMonths[0]);
  const sorties = (expense?.rows ?? []).filter((r) => r.aliveMonths[0]);

  // Les cinq mesures du mois, dans le vocabulaire du produit. « Solde » est ce
  // que la banque dit aujourd'hui ; « projection » est là où le mois atterrit :
  // deux chiffres différents, et c'est l'écart entre eux qui fait décider.
  const depassement = monthlyOverspend(sections, months.length)[0];
  const releves = [
    { label: "Solde", valeur: balance },
    { label: `Entrées ${monthPhrase(currentMonth)}`, valeur: totaux[0].recu },
    { label: `Sorties ${monthPhrase(currentMonth)}`, valeur: -totaux[0].depense },
    { label: "Dépassement", valeur: -depassement },
    { label: "Projection", valeur: solde.closings[0] },
  ];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
      <PlanDeCharge mois={mois} />

      <RelevesBand releves={releves} />

      {/* Les deux tables du mois : ce qui porte à gauche, ce qui tire à droite. */}
      <div className="grid gap-4 xl:grid-cols-2">
        <PosteTable
          titre="Entrées"
          vide="Aucune entrée prévue ce mois-ci."
          colonnes={["Prévu", "Reçu"]}
          lignes={entrees.map((r) => ({
            id: r.id,
            nom: r.name,
            montants: [r.cells[0].budgeted, r.cells[0].recu],
            etat: r.cells[0].recu > 0 ? "acquis" : "attendu",
          }))}
        />
        <PosteTable
          titre="Sorties"
          vide="Aucune enveloppe ce mois-ci."
          colonnes={["Enveloppe", "Dépensé", "Reste"]}
          lignes={sorties.map((r) => ({
            id: r.id,
            nom: r.name,
            montants: [r.cells[0].budgeted, -r.cells[0].depense, r.cells[0].balance],
            etat:
              r.cells[0].balance < 0
                ? "dépassé"
                : r.cells[0].depense > 0
                  ? "engagé"
                  : "attendu",
          }))}
        />
      </div>
    </div>
  );
}
