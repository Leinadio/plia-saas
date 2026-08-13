"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2 } from "lucide-react";
import type { LineManageInfo } from "@/lib/history-explain";
import { editGroupLine, removeGroupLine, setLinePeriod, linePeriodImpact } from "@/app/app/historique/actions";
import { groupPeriodLabel } from "@/lib/group-period-label";
import { PeriodEditBlock } from "@/components/history-blocks/period-edit-block";
import { SidebarHeader, SidebarContent } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toastSucces } from "@/components/history-blocks/toast";

// Vue de gestion d'une ligne de récurrent, ouverte par le crayon au survol de la
// ligne dans le tableau. Son nom, seule propriété qui vaille pour tous les mois, et
// sa suppression. Aucun montant : il est daté et se fixe depuis la case
// « Budget dép. » de la ligne, au mois de la colonne — exactement comme pour
// une enveloppe, et pour la même raison (voir BudgetEditBlock).
// Plus de jour du mois non plus : il ne pilotait aucun calcul, et il n'a plus de sens
// maintenant que n'importe quelle dépense peut avoir des sous-postes — « Boulangerie,
// le combien ? ». La colonne a été retirée de la base (migrateDropLineDay).
export function LineManageBlock({ info, onClose }: { info: LineManageInfo; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(info.name);
  // Même raison que pour un groupe : l'instantané du panneau ne se rafraîchit pas.
  const [periode, setPeriode] = useState({ startMonth: info.startMonth, endMonth: info.endMonth });
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    await fn();
    setBusy(false);
    router.refresh();
  };
  return (
    <>
      <SidebarHeader className="gap-0 border-b p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Gérer la ligne</p>
            <h2 className="font-semibold">{info.name}</h2>
            {/* Sa durée de vie, dite comme dans la colonne de gauche du tableau : on
                doit lire la même chose des deux côtés. */}
            <p className="text-muted-foreground/70 text-[10px] tracking-[0.12em] uppercase">
              {groupPeriodLabel(periode.startMonth, periode.endMonth)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent className="space-y-6 p-4">
        <div className="flex flex-col gap-2">
          <Label className="font-normal">Nom de la ligne</Label>
          <div className="flex items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 flex-1" />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy || !name.trim() || name.trim() === info.name}
              onClick={() => run(() => editGroupLine(info.lineId, name.trim()))}
            >
              Enregistrer
            </Button>
          </div>
        </div>
        {/* Sa durée de vie, comme pour un groupe : c'est ici qu'on résilie un
            abonnement sans emporter la dépense qui le porte, ni son passé. */}
        <PeriodEditBlock
          current={periode}
          month={info.month}
          stripMin={info.stripMin}
          stripMax={info.stripMax}
          changes={info.changes}
          askAmount
          impactOf={(s, e) => linePeriodImpact(info.lineId, s, e)}
          onSave={async (s, e, a) => {
            await run(() => setLinePeriod(info.lineId, s, e, a));
            setPeriode({ startMonth: s, endMonth: e });
          }}
        />
        <div className="border-t pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" size="sm" variant="ghost" disabled={busy} className="text-tension-ink hover:text-tension">
                <Trash2 className="size-4" />
                Supprimer la ligne
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette ligne ?</AlertDialogTitle>
                <AlertDialogDescription>
                  La ligne et tous ses montants seront supprimés du groupe.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-tension text-white hover:brightness-110"
                  onClick={() =>
                    run(async () => {
                      await removeGroupLine(info.lineId);
                      toastSucces("Ligne supprimée");
                      onClose();
                    })
                  }
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarContent>
    </>
  );
}
