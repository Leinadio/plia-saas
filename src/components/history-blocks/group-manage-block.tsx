"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2 } from "lucide-react";
import type { GroupManageInfo } from "@/lib/history-explain";
import {
  renameGroupAction,
  setGroupPlannedAction,
  deleteGroupAction,
  setGroupPeriod,
  groupPeriodImpact,
} from "@/app/app/historique/actions";
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

// Vue de gestion d'un groupe (ouverte depuis l'icône au survol d'une ligne de
// groupe) : renommer le groupe, gérer les lignes d'un récurrent (nom, jour, ajout,
// suppression) et supprimer le groupe. Aucun montant ici, volontairement : un montant
// est daté, et ce panneau n'affiche aucun mois — il ne pourrait donc afficher qu'un
// montant vrai pour un seul mois parmi d'autres, ce qui se lisait comme « le » montant
// du groupe et contredisait ce que montrait le tableau. Les montants se fixent depuis
// leur case « Budget dép. », au mois de la colonne (voir BudgetEditBlock).
// Chaque action revalide côté serveur ; on rafraîchit ensuite la vue.
//
// `inline` : rendu sur place, dans le dépliage d'un poste, au lieu
// du panneau de droite. L'en-tête tombe alors — le nom du poste et sa durée sont
// déjà écrits juste au-dessus, les répéter dirait deux fois la même chose — et la
// croix de fermeture avec, puisqu'on referme en repliant le poste.
export function GroupManageBlock({ info, onClose, inline }: { info: GroupManageInfo; onClose: () => void; inline?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(info.name);
  // Durée du groupe, en état local : `info` est un instantané capturé à l'ouverture du
  // panneau que router.refresh() ne remplace pas. Sans ça, l'étiquette du titre
  // continuerait d'annoncer « depuis toujours » juste après qu'on l'a arrêté.
  const [periode, setPeriode] = useState({ startMonth: info.startMonth, endMonth: info.endMonth });
  // Bloc de la dépense, en état local pour la même raison que la période : le panneau
  // doit dire tout de suite où la dépense vient d'atterrir. Absent pour un revenu.
  const [prevue, setPrevue] = useState(info.planned);
  const run = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    router.refresh();
    return result;
  };
  const entete = (
      <SidebarHeader className="gap-0 border-b p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Gérer le groupe</p>
            <h2 className="font-semibold">{info.name}</h2>
            {/* Sa durée de vie, dite comme dans la colonne de gauche du tableau :
                « depuis toujours », « depuis juillet 2026 », « ce mois uniquement »,
                ou la plage. */}
            <p className="text-muted-foreground/70 text-[10px] tracking-[0.12em] uppercase">
              {groupPeriodLabel(periode.startMonth, periode.endMonth)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>
      </SidebarHeader>
  );
  const contenu = (
    <>
        {/* Renommer */}
        <div className="flex flex-col gap-2">
          <Label className="font-normal">Nom du groupe</Label>
          <div className="flex items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 flex-1" />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy || !name.trim() || name.trim() === info.name}
              onClick={() => run(() => renameGroupAction(info.groupId, name))}
            >
              Renommer
            </Button>
          </div>
        </div>

        {/* Son bloc dans le tableau. Le classement se pose à la création, mais il se
            regrette : une dépense qu'on croyait exceptionnelle se met à revenir tous
            les mois. Le geste ne touche à rien d'autre, donc il se défait en le
            refaisant dans l'autre sens. Un revenu n'a pas de bloc : rien ne s'affiche. */}
        {prevue !== undefined && (
          <div className="flex flex-col gap-2">
            <Label className="font-normal">Bloc du tableau</Label>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">{prevue ? "Dépenses prévues" : "Dépenses non prévues"}</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={async () => {
                  await run(() => setGroupPlannedAction(info.groupId, !prevue));
                  setPrevue(!prevue);
                }}
              >
                {prevue ? "Déplacer vers les non prévues" : "Déplacer vers les prévues"}
              </Button>
            </div>
          </div>
        )}

        {/* Sa durée de vie. C'est ici qu'on arrête un groupe permanent — le seul autre
            moyen était de le supprimer, ce qui emportait aussi tout son passé. */}
        <PeriodEditBlock
          current={periode}
          month={info.month}
          stripMin={info.stripMin}
          stripMax={info.stripMax}
          changes={info.changes}
          askAmount={info.lines.length === 0}
          impactOf={(s, e) => groupPeriodImpact(info.groupId, s, e)}
          onSave={async (s, e, a) => {
            await run(() => setGroupPeriod(info.groupId, s, e, a));
            setPeriode({ startMonth: s, endMonth: e });
          }}
        />

        {/* Suppression du groupe */}
        <div className="border-t pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                className="text-tension-ink hover:text-tension"
              >
                <Trash2 className="size-4" />
                Supprimer le groupe
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce groupe ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le groupe sera supprimé et ses transactions repasseront en Non catégorisés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-tension text-white hover:brightness-110"
                  onClick={() =>
                    run(async () => {
                      await deleteGroupAction(info.groupId);
                      toastSucces("Groupe supprimé");
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
    </>
  );
  // En ligne : pas d'en-tête, et l'espacement vertical porté par le conteneur du
  // dépliage plutôt que par le rembourrage du panneau.
  if (inline) return <div className="flex flex-col gap-6">{contenu}</div>;
  return (
    <>
      {entete}
      <SidebarContent className="space-y-6 p-4">{contenu}</SidebarContent>
    </>
  );
}
