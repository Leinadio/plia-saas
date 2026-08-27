"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAccountAction, deleteConnectionAction } from "./actions";

// --- Deux suppressions, une seule fenêtre ------------------------------------
//
// Retirer un compte ou débrancher une banque emporte des mois de budget et ne se
// défait pas. La confirmation en ligne d'avant (« Supprimer » puis « Confirmer »)
// disait la question sans dire la conséquence : on cliquait deux fois sans savoir ce
// qui partait. La fenêtre le nomme, et le mot « définitivement » y figure en toutes
// lettres.

function Confirmation({
  titre, description, libelle, onConfirm, enCours,
}: {
  titre: string;
  description: React.ReactNode;
  libelle: string;
  onConfirm: () => void;
  enCours: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={enCours}
          className="cursor-pointer text-tension-encre hover:text-tension"
        >
          <Trash2 className="size-4" />
          {libelle}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titre}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="cursor-pointer bg-tension text-white hover:brightness-110"
            onClick={onConfirm}
          >
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteAccountButton({ accountId, nom }: { accountId: string; nom: string }) {
  // useTransition et non un simple await : l'écran se redessine côté serveur après la
  // suppression, et sans lui le bouton redeviendrait actif avant que le compte ait
  // disparu de la liste.
  const [enCours, demarrer] = useTransition();

  return (
    <Confirmation
      libelle="Supprimer"
      enCours={enCours}
      titre={`Supprimer le compte ${nom} ?`}
      description={
        <>
          <span>
            Toutes ses opérations, ses dépenses, ses entrées et leurs montants seront
            supprimés.
          </span>
          <span className="font-medium">Cette action est irréversible.</span>
        </>
      }
      onConfirm={() =>
        demarrer(async () => {
          const form = new FormData();
          form.set("id", accountId);
          await deleteAccountAction(form);
          toast.success(`Compte ${nom} supprimé`);
        })
      }
    />
  );
}

export function DeleteConnectionButton({
  connectionId, banque, nbComptes,
}: {
  connectionId: number;
  banque: string;
  nbComptes: number;
}) {
  const [enCours, demarrer] = useTransition();

  return (
    <Confirmation
      libelle="Débrancher"
      enCours={enCours}
      titre={`Débrancher ${banque} ?`}
      description={
        <>
          <span>
            L&apos;autorisation de lecture sera retirée
            {nbComptes > 0
              ? `, et les ${nbComptes} compte(s) rapportés par cette banque seront supprimés avec toutes leurs opérations, leurs dépenses, leurs entrées et leurs montants.`
              : "."}
          </span>
          <span className="font-medium">Cette action est irréversible.</span>
        </>
      }
      onConfirm={() =>
        demarrer(async () => {
          const form = new FormData();
          form.set("id", String(connectionId));
          await deleteConnectionAction(form);
          toast.success(`${banque} débranchée`);
        })
      }
    />
  );
}
