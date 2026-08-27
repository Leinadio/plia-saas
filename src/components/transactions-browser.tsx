"use client";
import { useMemo, useState } from "react";
import { X, ChevronDown, ChevronRight, Search } from "lucide-react";
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
import { Input, champClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GroupSelectField } from "@/components/group-select-field";
import { groupsForMonth } from "@/lib/group-options";
import { TruncatedText } from "@/components/truncated-text";
import { TxnCommentField } from "@/components/txn-comment-field";
import { AddTransactionSheet } from "@/components/add-transaction-sheet";
import { Badge } from "@/components/ui/badge";
import { ManualTxnActions } from "@/components/manual-txn-actions";
import { IgnoreTxnToggle } from "@/components/ignore-txn-toggle";

// --- LE RELEVÉ, EN CARTE -----------------------------------------------------
//
// C'était un tableau de six colonnes, replié en grille de deux étages sous 640 px
// par une pile de sélecteurs `max-sm:` — deux mises en page dans un seul balisage,
// et le montant qui attendait hors de l'écran dès qu'un libellé était long.
//
// C'est maintenant une carte par compte, et une LIGNE par opération : la date et
// le libellé à gauche, le montant à droite, et dessous ce qu'on fait de
// l'opération — la ranger, la sortir des calculs, la commenter. La même ligne à
// toutes les largeurs : rien à replier, rien à cacher.

// Sur téléphone la date se dit en jour et mois : l'année est celle de la bande
// juste au-dessus, et « 2026-08-02 » prenait la place du libellé.
const jourCourt = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

// startMonth / endMonth : durée de vie du groupe, pour ne proposer au rattachement
// d'une transaction que les groupes qui vivent son mois.
type ClientGroup = OwnableGroup & {
  name: string;
  startMonth?: string | null;
  endMonth?: string | null;
  lines: { id: number; name: string }[];
};

// UNE OPÉRATION. La même ligne à toutes les largeurs : la date et le libellé à
// gauche, le montant à droite, et dessous ce qu'on fait de l'opération.
//
// Déclarée au module et non dans le composant parent : une fonction de composant
// recréée à chaque rendu remonte son sous-arbre au lieu de le mettre à jour — et
// le champ de commentaire perdrait le curseur à chaque frappe.
function Ligne({
  t, compte, groupes, accounts, formGroups, statut,
}: {
  t: TxnView;
  // Vrai dans la vue filtrée, qui mélange les comptes : ailleurs, l'onglet ouvert
  // dit déjà de quel compte il s'agit.
  compte?: boolean;
  groupes: { id: number; name: string; direction: "in" | "out"; lines: { id: number; name: string }[] }[];
  accounts: { id: string; label: string }[];
  formGroups: { id: number; name: string; accountId: string; direction: "in" | "out"; startMonth?: string | null; endMonth?: string | null }[];
  statut: string;
}) {
  return (
    <li className={cn("hover:bg-survol px-4 py-3 transition-colors sm:px-5", t.ignored && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-ardoise-claire shrink-0 text-xs tabular-nums">
              <span className="sm:hidden">{jourCourt(t.date)}</span>
              <span className="hidden sm:inline">{t.date}</span>
            </span>
            <TruncatedText text={t.label} className="max-w-full text-sm font-medium sm:max-w-[420px]" />
            {t.manual && <Badge variant="attente">manuel · en attente</Badge>}
            {t.ignored && <Badge>hors calcul</Badge>}
          </div>
          {compte && <span className="text-ardoise-claire text-xs">{t.accountLabel}</span>}
          {t.note && <span className="text-muted-foreground text-xs">{t.note}</span>}
          {/* Le commentaire vient juste sous le libellé. */}
          <TxnCommentField txnId={t.id} comment={t.comment} className="max-w-full sm:max-w-[420px]" />
        </div>
        {/* Un montant est une force : celui qui retranche tire, et il est rouge.
            Celui qui ajoute porte, et il est vert. Une opération hors calcul est
            barrée et rendue au cendre. */}
        <span
          className={cn(
            "montant shrink-0 text-sm",
            t.ignored ? "text-ardoise-claire line-through" : t.amount < 0 ? "text-tension-encre" : "text-portant",
          )}
        >
          {formatEur(t.amount)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <GroupSelectField
          txnId={t.id}
          groups={groupes}
          defaultGroupId={t.groupId}
          defaultLineId={t.lineId}
          disabled={t.ignored}
          className="max-w-64"
        />
        <IgnoreTxnToggle txnId={t.id} ignored={t.ignored} size="icon-sm" />
        {t.manual && <ManualTxnActions txn={t} accounts={accounts} groups={formGroups} />}
        <span className="text-ardoise-claire ml-auto hidden text-xs sm:block">
          <TruncatedText text={statut} className="max-w-[220px]" />
        </span>
      </div>
    </li>
  );
}

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
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <AddTransactionSheet accounts={accounts} groups={formGroups} />
        </div>
        <div className="carte px-5 py-10 text-center">
          <p className="titre-carte">Aucune opération</p>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
            Rien n&apos;est encore arrivé de la banque. Synchronise dans Réglages, ou
            ajoute une opération à la main.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <AddTransactionSheet accounts={accounts} groups={formGroups} />
      </div>

      {/* LE PUPITRE DE FILTRES, sur sa propre carte : les filtres sont un outil, pas
          des champs qui flottent au-dessus du relevé. Sur téléphone, deux colonnes
          réglées plutôt qu'un retour à la ligne libre — à 390 px, six champs de
          largeurs différentes retombent en escalier. */}
      <div className="carte grid grid-cols-2 gap-2 px-3 py-3 sm:flex sm:flex-wrap sm:items-center sm:px-4">
        <div className="relative col-span-2 w-full sm:w-64">
          <Search className="text-ardoise-claire pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Rechercher un libellé…"
            value={filters.text}
            onChange={(e) => set({ text: e.target.value })}
            className="pl-9"
          />
        </div>
        <select
          value={filters.group === "all" ? "all" : filters.group === "none" ? "none" : String(filters.group)}
          onChange={(e) => {
            const v = e.target.value;
            set({ group: v === "all" || v === "none" ? v : Number(v) });
          }}
          className={cn(champClass, "col-span-2 w-full max-w-full sm:w-auto")}
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
          className="w-full sm:w-24"
        />
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Max €"
          value={filters.amountMax ?? ""}
          onChange={(e) => set({ amountMax: numOrNull(e.target.value) })}
          className="w-full sm:w-24"
        />
        <Input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => set({ dateFrom: e.target.value || null })}
          className="w-full sm:w-40"
        />
        <Input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => set({ dateTo: e.target.value || null })}
          className="w-full sm:w-40"
        />
        {active && (
          <Button variant="ghost" size="sm" className="col-span-2 sm:col-span-1" onClick={() => setFilters(EMPTY_FILTERS)}>
            <X className="size-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      {active ? (
        <div className="carte overflow-hidden">
          {/* Ce que le filtre a trouvé, en tête de sa carte : trois mesures et un
              compte. */}
          <div className="border-filet bg-creuse flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-4 py-3 sm:px-5">
            <span className="legende">
              {summary.count} opération{summary.count > 1 ? "s" : ""}
            </span>
            <span className="flex items-baseline gap-2">
              <span className="legende">Sorties</span>
              <span className="montant text-tension-encre text-sm">{formatEur(-summary.out)}</span>
            </span>
            <span className="flex items-baseline gap-2">
              <span className="legende">Entrées</span>
              <span className="montant text-portant text-sm">{formatEur(summary.in)}</span>
            </span>
            <span className="flex items-baseline gap-2">
              <span className="legende">Net</span>
              <span className={cn("montant text-sm", summary.net < 0 && "text-tension-encre")}>
                {formatEur(summary.net)}
              </span>
            </span>
          </div>
          {results.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm sm:px-5">
              Aucun résultat. Élargis les filtres, ou réinitialise-les.
            </p>
          ) : (
            <ul className="divide-filet divide-y">
              {results.map((t) => (
                <Ligne
                  key={t.id}
                  t={t}
                  compte
                  groupes={groupsOfTxn(t)}
                  accounts={accounts}
                  formGroups={formGroups}
                  statut={statusLabel(t)}
                />
              ))}
            </ul>
          )}
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
            <TabsContent key={accountId} value={accountId} className="flex flex-col gap-3">
              {/* Une carte à en-tête sans une seule ligne se lit comme un chargement
                  qui n'a pas abouti. Une phrase dit mieux ce qui se passe. Les trois
                  mois sont dans le texte parce que c'est la fenêtre que les banques
                  fournissent : sans cette précision on croit à une synchro
                  incomplète. */}
              {group.items.length === 0 ? (
                <div className="carte px-5 py-10 text-center">
                  <p className="titre-carte">Rien sur ce compte</p>
                  <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
                    Aucune opération sur les trois derniers mois — c&apos;est tout ce que
                    la banque fournit.
                  </p>
                </div>
              ) : (
                groupByMonth(group.items).map((m) => {
                  const key = `${accountId}:${m.month}`;
                  const isCollapsed = collapsed.has(key);
                  // Les non comptabilisées comptent dans le total du mois mais dans
                  // aucun calcul. Replié, le mois n'en disait rien : on lisait un
                  // nombre d'opérations dont une partie ne pesait sur rien.
                  const nonComptees = m.items.filter((t) => t.ignored).length;
                  return (
                    <div key={m.month} className="carte overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleMonth(key)}
                        aria-expanded={!isCollapsed}
                        className={cn(
                          "hover:bg-survol flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-left transition-colors sm:px-5",
                          !isCollapsed && "border-filet border-b",
                        )}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="text-ardoise-claire size-4 shrink-0" />
                        ) : (
                          <ChevronDown className="text-ardoise-claire size-4 shrink-0" />
                        )}
                        <span className="titre-carte">{m.label}</span>
                        <span className="text-ardoise-claire text-xs">
                          {m.items.length} opération{m.items.length > 1 ? "s" : ""}
                        </span>
                        {nonComptees > 0 && (
                          <span className="pastille">{nonComptees} hors calcul</span>
                        )}
                      </button>
                      {!isCollapsed && (
                        <ul className="divide-filet divide-y">
                          {m.items.map((t) => (
                            <Ligne
                              key={t.id}
                              t={t}
                              groupes={groupsOfTxn(t)}
                              accounts={accounts}
                              formGroups={formGroups}
                              statut={statusLabel(t)}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
