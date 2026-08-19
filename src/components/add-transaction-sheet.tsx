"use client";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { addTransaction, editTransaction } from "@/app/app/transactions/actions";
import type { ManualFormInput } from "@/lib/manual-txn";
import { groupsForMonth, postesPourSaisie } from "@/lib/group-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useMiseAJour } from "@/components/mise-a-jour";

type AccountOpt = { id: string; label: string };
type GroupOpt = {
  id: number; name: string; accountId: string; direction: "in" | "out";
  // Durée de vie : on ne propose que les groupes qui vivent le mois de la date saisie.
  startMonth?: string | null; endMonth?: string | null;
};
type EditData = {
  id: string; accountId: string; date: string; direction: "in" | "out";
  amount: number; label: string; groupId: number | null;
};

export function AddTransactionSheet({ accounts, groups, edit }: { accounts: AccountOpt[]; groups: GroupOpt[]; edit?: EditData }) {
  const [open, setOpen] = useState(false);
  const { pendant, enCours: isPending } = useMiseAJour();

  const [accountId, setAccountId] = useState(edit?.accountId ?? accounts[0]?.id ?? "");
  const [date, setDate] = useState(edit?.date ?? "");
  const [direction, setDirection] = useState<"in" | "out">(edit?.direction ?? "out");
  const [amount, setAmount] = useState(edit ? String(Math.abs(edit.amount)) : "");
  const [label, setLabel] = useState(edit?.label ?? "");
  const [groupId, setGroupId] = useState<number | null>(edit?.groupId ?? null);

  // Le compte et la durée de vie filtrent ; le sens de la saisie, lui, ne filtre
  // plus — il range en deux sections. Une entrée peut se poser sur une dépense :
  // c'est un remboursement, et il la diminue (cf. postesPourSaisie).
  const mois = /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : null;
  const sections = postesPourSaisie(groups, accountId, mois, edit?.groupId ?? null);

  const submit = () => {
    const form: ManualFormInput = {
      accountId, date, direction, amount: Number(amount.replace(",", ".")),
      label, groupId, lineId: null,
    };
    pendant(async () => {
      if (edit) await editTransaction(edit.id, form);
      else await addTransaction(form);
      setOpen(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {edit ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" />Modifier</Button>
        ) : (
          <Button size="sm"><Plus className="size-4" />Ajouter une transaction</Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{edit ? "Modifier la transaction" : "Nouvelle transaction"}</SheetTitle>
          <SheetDescription>Saisie manuelle, en attente de synchronisation bancaire.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <label className="flex flex-col gap-1 text-sm">
            Compte
            <select value={accountId} onChange={(e) => { setAccountId(e.target.value); setGroupId(null); }}
              className="plate plate-cut h-9 px-3 text-sm">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </label>

          <div className="flex gap-2">
            {/* Changer de sens ne lâche plus le poste choisi : les deux sens
                proposent les mêmes, et une entrée posée sur une dépense est
                exactement ce qu'on vient chercher. */}
            <Button type="button" variant={direction === "out" ? "default" : "outline"} size="sm"
              onClick={() => setDirection("out")}>Sortie</Button>
            <Button type="button" variant={direction === "in" ? "default" : "outline"} size="sm"
              onClick={() => setDirection("in")}>Entrée</Button>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Date
            {/* Changer de date peut retirer le groupe choisi de la liste (il ne vit
                pas ce mois-là) : on le lâche, plutôt que de garder un choix invisible
                qui partirait quand même à l'enregistrement. */}
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                const v = e.target.value;
                setDate(v);
                const m = /^\d{4}-\d{2}/.test(v) ? v.slice(0, 7) : null;
                const duCompte = groups.filter((g) => g.accountId === accountId);
                if (m && groupId !== null && !groupsForMonth(duCompte, m).some((g) => g.id === groupId)) {
                  setGroupId(null);
                }
              }}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Montant (€)
            <Input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0,00"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Libellé
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Rémunération juillet" />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Groupe
            <select value={groupId ?? ""} onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
              className="plate plate-cut h-9 px-3 text-sm">
              <option value="">Non catégorisé</option>
              {sections.map((sec) => (
                <optgroup key={sec.label} label={sec.label}>
                  {sec.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>

          <Button onClick={submit} disabled={isPending || !accountId || !date || !amount}>
            {edit ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
