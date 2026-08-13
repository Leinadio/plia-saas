"use client";
import { Fragment, useMemo, useState } from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { resolveOwnership, type OwnableGroup } from "@/lib/ownership";
import type { TxnView } from "@/db/repositories/transactions";
import { formatEur } from "@/lib/money";
import { cn } from "@/lib/utils";
import { groupByMonth } from "@/lib/transactions-view";
import {
  filterTransactions,
  summarize,
  hasActiveFilters,
  EMPTY_FILTERS,
  type TxnFilters,
} from "@/lib/transactions-filter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GroupSelectField } from "@/components/group-select-field";
import { groupsForMonth } from "@/lib/group-options";
import { TruncatedText } from "@/components/truncated-text";
import { TxnCommentField } from "@/components/txn-comment-field";
import { AddTransactionSheet } from "@/components/add-transaction-sheet";
import { Badge } from "@/components/ui/badge";
import { ManualTxnActions } from "@/components/manual-txn-actions";
import { IgnoreTxnToggle } from "@/components/ignore-txn-toggle";

// startMonth / endMonth : durée de vie du groupe, pour ne proposer au rattachement
// d'une transaction que les groupes qui vivent son mois.
type ClientGroup = OwnableGroup & {
  name: string;
  startMonth?: string | null;
  endMonth?: string | null;
  lines: { id: number; name: string }[];
};

export function TransactionsBrowser({ transactions, groups, accounts }: { transactions: TxnView[]; groups: ClientGroup[]; accounts: { id: string; label: string }[] }) {
  const [filters, setFilters] = useState<TxnFilters>(EMPTY_FILTERS);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleMonth = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const ownable: OwnableGroup[] = groups;
  const formGroups = groups.map((g) => ({ id: g.id, name: g.name, accountId: g.accountId, direction: g.direction, startMonth: g.startMonth, endMonth: g.endMonth }));

  const renderLabel = (t: TxnView) => (
    <span className="group/txn flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5">
        <TruncatedText text={t.label} className="max-w-[190px] sm:max-w-[380px]" />
        {t.manual && <Badge variant="outline">manuel · en attente</Badge>}
        {t.ignored && <Badge variant="outline">non comptabilisée</Badge>}
      </span>
      {t.note && <span className="text-muted-foreground text-xs">{t.note}</span>}
      {/* Le commentaire vient juste sous le libellé. */}
      <TxnCommentField txnId={t.id} comment={t.comment} className="max-w-[190px] sm:max-w-[380px]" />
    </span>
  );

  // Une transaction non comptabilisée reste lisible mais visiblement hors-jeu.
  const rowClass = (t: TxnView) => (t.ignored ? "text-muted-foreground" : undefined);
  // Un montant est une force : celui qui retranche tire, et il est rouge. Celui
  // qui ajoute porte, et il reste à l'encre. Une opération non comptabilisée est
  // hors structure : elle est barrée et rendue au cendre.
  const amountClass = (t: TxnView) =>
    cn(
      "text-right font-mono text-[0.8125rem] whitespace-nowrap",
      t.ignored ? "text-muted-foreground line-through" : t.amount < 0 && "text-tension-ink",
    );

  const groupName = (id: number) => groups.find((g) => g.id === id)?.name ?? "?";
  // Les groupes proposés à une transaction : ceux de son compte, et parmi eux ceux
  // qui vivent le mois de la transaction (cf. src/lib/group-options.ts).
  const groupsOfTxn = (t: TxnView) =>
    groupsForMonth(groups.filter((g) => g.accountId === t.accountId), t.date.slice(0, 7), t.groupId)
      // lines : le sélecteur en a besoin pour ne pas proposer comme destination une
      // dépense découpée (seuls ses sous-postes le sont). direction : pour ranger les
      // rémunérations dans leur propre section plutôt qu'avec les dépenses.
      .map((g) => ({ id: g.id, name: g.name, direction: g.direction, lines: g.lines }));
  const lineName = (id: number) => {
    for (const g of groups) {
      const l = g.lines.find((x) => x.id === id);
      if (l) return l.name;
    }
    return null;
  };

  const statusLabel = (t: TxnView): string => {
    const res = resolveOwnership(
      { id: t.id, date: t.date, amount: t.amount, label: t.label, accountId: t.accountId, groupId: t.groupId, excluded: t.excluded },
      ownable,
    );
    if (res.status === "manual") {
      const base = groupName(res.groupId);
      const ln = t.lineId !== null ? lineName(t.lineId) : null;
      return ln ? `${base} › ${ln}` : base;
    }
    return "non catégorisée";
  };

  // Un onglet par compte, et non par compte AYANT des opérations : les onglets se
  // construisent sur la liste des comptes, pas sur celle des transactions. Un compte
  // tout neuf ou dormant a bien un onglet, simplement vide. Sans ça il disparaissait de
  // cette page et on le croyait mal synchronisé, alors que les banques ne fournissent
  // qu'environ trois mois d'historique.
  const accountTxnGroups = useMemo(() => {
    const byAccount = new Map<string, { label: string; items: TxnView[] }>(
      accounts.map((a) => [a.id, { label: a.label, items: [] as TxnView[] }]),
    );
    for (const t of transactions) {
      // Un compte inconnu de la liste (supprimé entre-temps) garde sa place plutôt que
      // de faire disparaître ses opérations.
      const g = byAccount.get(t.accountId) ?? { label: t.accountLabel ?? "Compte", items: [] };
      g.items.push(t);
      byAccount.set(t.accountId, g);
    }
    return [...byAccount.entries()];
  }, [transactions, accounts]);

  const results = useMemo(() => {
    const filtered = filterTransactions(transactions, filters, ownable);
    return [...filtered].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, filters]);
  // Les non comptabilisées restent listées (pour pouvoir les réactiver) mais ne
  // pèsent pas dans le récapitulatif Sorties / Entrées / Net.
  const summary = useMemo(() => summarize(results.filter((t) => !t.ignored)), [results]);

  const set = (patch: Partial<TxnFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
  const active = hasActiveFilters(filters);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <AddTransactionSheet accounts={accounts} groups={formGroups} />
        </div>
        <p className="text-muted-foreground text-sm">
          Aucune transaction synchronisée. Ajoute-en une à la main ou synchronise dans Réglages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddTransactionSheet accounts={accounts} groups={formGroups} />
      </div>
      {/* La rangée de commandes, sur sa propre plaque : les filtres sont un
          pupitre, pas des champs qui flottent au-dessus du relevé. */}
      <div className="plate flex flex-wrap items-center gap-2 px-3 py-3">
        <Input
          placeholder="Rechercher un libellé…"
          value={filters.text}
          onChange={(e) => set({ text: e.target.value })}
          className="w-full sm:w-56"
        />
        <select
          value={filters.group === "all" ? "all" : filters.group === "none" ? "none" : String(filters.group)}
          onChange={(e) => {
            const v = e.target.value;
            set({ group: v === "all" || v === "none" ? v : Number(v) });
          }}
          className="plate plate-cut h-9 max-w-full px-3 text-sm"
        >
          <option value="all">Tous les groupes</option>
          <option value="none">Non catégorisées</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Min €"
          value={filters.amountMin ?? ""}
          onChange={(e) => set({ amountMin: numOrNull(e.target.value) })}
          className="w-24"
        />
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Max €"
          value={filters.amountMax ?? ""}
          onChange={(e) => set({ amountMax: numOrNull(e.target.value) })}
          className="w-24"
        />
        <Input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => set({ dateFrom: e.target.value || null })}
          className="w-40"
        />
        <Input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => set({ dateTo: e.target.value || null })}
          className="w-40"
        />
        {active && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
            <X className="size-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      {active ? (
        <div className="flex flex-col gap-2">
          {/* Le relevé du filtre : trois mesures gravées, sur la même grammaire
              que la bande du tableau de bord. */}
          <div className="plate flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <span className="caption">
              {summary.count} opération{summary.count > 1 ? "s" : ""}
            </span>
            <span className="flex items-baseline gap-2">
              <span className="caption">Sorties</span>
              <span className="text-tension-ink font-mono text-sm">{formatEur(-summary.out)}</span>
            </span>
            <span className="flex items-baseline gap-2">
              <span className="caption">Entrées</span>
              <span className="font-mono text-sm">{formatEur(summary.in)}</span>
            </span>
            <span className="flex items-baseline gap-2">
              <span className="caption">Net</span>
              <span className={cn("font-mono text-sm font-medium", summary.net < 0 && "text-tension-ink")}>
                {formatEur(summary.net)}
              </span>
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Compte</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Groupe</TableHead>
                <TableHead>Appartenance</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">Aucun résultat.</TableCell>
                </TableRow>
              ) : (
                results.map((t) => (
                  <TableRow key={t.id} className={rowClass(t)}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{t.date}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{t.accountLabel}</TableCell>
                    <TableCell>{renderLabel(t)}</TableCell>
                    <TableCell>
                      <GroupSelectField txnId={t.id} groups={groupsOfTxn(t)} defaultGroupId={t.groupId} defaultLineId={t.lineId} disabled={t.ignored} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <TruncatedText text={statusLabel(t)} className="max-w-[130px] sm:max-w-[200px]" />
                    </TableCell>
                    <TableCell className={amountClass(t)}>{formatEur(t.amount)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <IgnoreTxnToggle txnId={t.id} ignored={t.ignored} />
                      {t.manual && <ManualTxnActions txn={t} accounts={accounts} groups={formGroups} />}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Tabs defaultValue={accountTxnGroups[0]?.[0]}>
          {/* Les onglets défilent plutôt que de se tasser : aucun compte ne disparaît
              sur un écran étroit. */}
          <div className="max-w-full overflow-x-auto">
            <TabsList>
              {accountTxnGroups.map(([accountId, group]) => (
                <TabsTrigger key={accountId} value={accountId}>
                  {group.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {accountTxnGroups.map(([accountId, group]) => (
            <TabsContent key={accountId} value={accountId}>
              {/* Un tableau à en-têtes sans une seule ligne se lit comme un chargement
                  qui n'a pas abouti. Une phrase dit mieux ce qui se passe. Les trois mois
                  sont dans le texte parce que c'est la fenêtre que les banques
                  fournissent : sans cette précision on croit à une synchro incomplète. */}
              {group.items.length === 0 ? (
                <p className="text-muted-foreground py-6 text-sm">
                  Aucune opération sur ce compte sur les trois derniers mois.
                </p>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Groupe</TableHead>
                    <TableHead>Appartenance</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupByMonth(group.items).map((m) => {
                    const key = `${accountId}:${m.month}`;
                    const isCollapsed = collapsed.has(key);
                    // Les non comptabilisées comptent dans le total du mois mais dans
                    // aucun calcul. Replié, le mois n'en disait rien : on lisait un
                    // nombre d'opérations dont une partie ne pesait sur rien.
                    const nonComptees = m.items.filter((t) => t.ignored).length;
                    return (
                    <Fragment key={m.month}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleMonth(key)}>
                        <TableCell colSpan={6} className="bg-muted/70 py-2">
                          <span className="flex items-center gap-2">
                            {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                            <span className="chip">{m.label}</span>
                            <span className="caption">{m.items.length} opérations</span>
                            {nonComptees > 0 && (
                              <span className="chip chip-slack">
                                {nonComptees} hors calcul
                              </span>
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                      {!isCollapsed && m.items.map((t) => (
                        <TableRow key={t.id} className={rowClass(t)}>
                          <TableCell className="text-muted-foreground">{t.date}</TableCell>
                          <TableCell>{renderLabel(t)}</TableCell>
                          <TableCell>
                            <GroupSelectField txnId={t.id} groups={groupsOfTxn(t)} defaultGroupId={t.groupId} defaultLineId={t.lineId} disabled={t.ignored} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <TruncatedText text={statusLabel(t)} className="max-w-[130px] sm:max-w-[200px]" />
                          </TableCell>
                          <TableCell className={amountClass(t)}>{formatEur(t.amount)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                                  <IgnoreTxnToggle txnId={t.id} ignored={t.ignored} />
                            {t.manual && <ManualTxnActions txn={t} accounts={accounts} groups={formGroups} />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
