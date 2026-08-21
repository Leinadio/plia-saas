import Link from "next/link";
import { listAccounts } from "../../db/repositories/accounts";
import { listTransactions, sumIgnoredByAccount, type TxnView } from "../../db/repositories/transactions";
import { listGroups } from "../../db/repositories/groups";
import { listBudgetAmounts } from "../../db/repositories/budget-amounts";
import { listLineAmounts } from "../../db/repositories/line-amounts";
import { monthRange, addMonthsKey, toDatedBudgets, toDatedLineAmounts } from "../../lib/history";
import type { Group, Txn } from "../../lib/forecast";
import { currentMonthKey } from "../../lib/current-month";
import { accountLabel, effectiveBalance } from "../../lib/account";
import { recapCompte } from "../../lib/recap-compte";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RecapitulatifCompte } from "@/components/recapitulatif-compte";

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
  const { accounts, ignoredByAccount, allTxns, allGroups, datedBudgets, datedLines } =
    await pourMoi(async (database, userId) => ({
      accounts: await listAccounts(database, userId),
      ignoredByAccount: await sumIgnoredByAccount(database),
      allTxns: (await listTransactions(database, userId)).map(toTxn) as Txn[],
      allGroups: (await listGroups(database, userId)) as Group[],
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

  // UN RÉCAPITULATIF PAR COMPTE. Le tableau de bord montrait la somme de tout :
  // un solde que personne ne peut dépenser d'un bloc, et un dépassement dont on
  // ne savait plus quel compte l'avait creusé. Chaque compte porte maintenant sa
  // propre structure, calculée sur ses seuls postes et ses seules opérations.
  const recaps = accounts.map((a) => ({
    compte: a,
    recap: recapCompte(
      a.id,
      // Le solde de la banque privé de ce qui est hors calcul : c'est LUI qui
      // ancre tout ce qui suit.
      effectiveBalance(a.balance, ignoredByAccount[a.id]),
      allGroups, allTxns, months, currentMonth, datedBudgets, datedLines,
    ),
  }));

  // Un seul compte : pas d'onglet. Un onglet solitaire ne se choisit pas, il ne
  // fait qu'ajouter une ligne à cliquer au-dessus de la seule chose à voir.
  if (recaps.length === 1) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
        <RecapitulatifCompte recap={recaps[0].recap} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
      <Tabs defaultValue={accounts[0].id}>
        {/* Les onglets de comptes défilent plutôt que de se tasser : sur un écran
            étroit, quatre noms de comptes ne tiennent pas côte à côte, et aucun ne
            doit disparaître. */}
        <div className="max-w-full overflow-x-auto">
          <TabsList>
            {recaps.map(({ compte }) => (
              <TabsTrigger key={compte.id} value={compte.id}>
                {accountLabel(compte)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {recaps.map(({ compte, recap }) => (
          <TabsContent key={compte.id} value={compte.id} className="flex flex-col gap-4">
            <RecapitulatifCompte recap={recap} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
