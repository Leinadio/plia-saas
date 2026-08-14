"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { UncatProvisionInfo } from "@/lib/history-explain";
import { monthLabel } from "@/lib/transactions-view";
import { formatEur } from "@/lib/money";
import { setUncatProvision, spreadUncatProvision } from "@/app/app/historique/actions";
import { SidebarHeader, SidebarContent } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastSucces } from "@/components/history-blocks/toast";
import { useMiseAJour } from "@/components/mise-a-jour";

// Vue d'édition de la provision des non catégorisés (ouverte depuis la case Budget
// dép. de la section non catégorisés) : fixe le montant daté du groupe 0, avec la
// même sémantique once/ongoing que le montant d'une enveloppe (voir
// GroupManageBlock ci-dessus). Pas de renommage, de lignes ni de suppression : le
// groupe 0 est un pseudo-groupe, pas une ligne de `groups`.
export function UncatProvisionBlock({ info, onClose }: { info: UncatProvisionInfo; onClose: () => void }) {
  // Occupé jusqu'à ce que le tableau derrière montre la nouvelle provision, et
  // pas seulement jusqu'à ce que l'écriture soit passée (voir mise-a-jour.tsx).
  const { pendant, enCours: busy } = useMiseAJour();
  const [amount, setAmount] = useState(() => String(info.currentAmount));
  // Montant tout juste appliqué : tant qu'il est là, on pose la question de la
  // propagation. Même règle que pour un budget d'enveloppe (voir BudgetEditBlock) :
  // on applique au mois cliqué, puis on demande pour les mois suivants.
  const [applique, setApplique] = useState<number | null>(null);
  const run = (fn: () => Promise<void>) => pendant(fn);
  const saisi = parseFloat(amount);
  return (
    <>
      <SidebarHeader className="gap-0 border-b p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Non catégorisés</p>
            <h2 className="font-semibold">Provision pour {monthLabel(info.month)}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent className="space-y-6 p-4">
        <div className="flex flex-col gap-2">
          <Label className="font-normal">Provision pour {monthLabel(info.month)}</Label>
          <div className="flex flex-wrap items-end gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setApplique(null);
              }}
              className="h-9 w-28 text-right tabular-nums"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy || !(saisi >= 0)}
              onClick={async () => {
                await run(() => setUncatProvision(info.accountId, info.month, saisi, "once"));
                setApplique(saisi);
              }}
            >
              {busy ? "Application…" : "Appliquer"}
            </Button>
          </div>
          {applique !== null && (
            <div className="plate mt-2 flex flex-col gap-2 p-3 text-sm">
              <p>
                {formatEur(applique)} appliqué à {monthLabel(info.month)}. Les mois suivants
                doivent-ils prendre ce montant ?
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={async () => {
                    await run(() => spreadUncatProvision(info.accountId, info.month, applique));
                    setApplique(null);
                    toastSucces("Montant appliqué aux mois suivants");
                  }}
                >
                  Oui, remplacer tous les mois suivants
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setApplique(null)}>
                  Non, {monthLabel(info.month).toLowerCase()} seulement
                </Button>
              </div>
            </div>
          )}
        </div>
      </SidebarContent>
    </>
  );
}
