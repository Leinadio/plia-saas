"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { syncMessage } from "@/lib/sync-message";
import { useMiseAJour } from "@/components/mise-a-jour";

// Rafraîchit les transactions depuis la banque, depuis l'en-tête. Le même appel que le
// bouton « Synchroniser » des Réglages (POST /api/sync) : c'est le geste qu'on fait le
// plus souvent, il n'avait rien à faire au fond d'une page de configuration.
//
// Pas une server action mais l'API existante : la synchronisation parle à Enable
// Banking et peut durer, et cette route sait déjà rendre le compte de ce qui est entré
// comme les erreurs de la banque. Une fois finie, la page se redemande au serveur
// courante — sans quoi le tableau montrerait encore l'avant.
export function SyncButton() {
  const [appel, setAppel] = useState(false);
  // Le rafraîchissement rend la main tout de suite : le nouveau rendu arrive après.
  // Sans l'attente partagée, le bouton redevenait actif alors que le tableau montrait
  // encore l'avant, et on croyait la synchronisation sans effet. `rendu` ne retombe
  // qu'une fois le rendu reçu et affiché — et pendant ce temps le fil de tension
  // court sous la poutre.
  const { rafraichir: redessiner, enCours: rendu } = useMiseAJour();
  const enCours = appel || rendu;

  const rafraichir = async () => {
    setAppel(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = (await res.json()) as { imported?: number; error?: string };
      if (!res.ok) {
        // Le seul refus qu'on sait traduire : pas de banque connectée. Le reste vient
        // de la banque et se dit tel quel, plutôt que d'être noyé dans un « erreur ».
        toast.error(
          data.error === "not_connected"
            ? "Aucune banque connectée. À faire dans Réglages."
            : `Synchronisation impossible : ${data.error ?? "erreur inconnue"}`,
        );
        return;
      }
      toast.success(syncMessage(Number(data.imported)));
      redessiner();
    } catch {
      toast.error("Serveur injoignable : la synchronisation n'a pas eu lieu.");
    } finally {
      setAppel(false);
    }
  };

  return (
    <button
      type="button"
      onClick={rafraichir}
      disabled={enCours}
      // Mêmes formes que ses voisins de la barre — calculatrice, dépassements,
      // compte : quatre commandes côte à côte, quatre dessins différents les
      // feraient lire comme quatre natures.
      className="text-barre-texte hover:bg-barre-appui hover:text-foreground inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[0.8125rem] font-semibold transition-colors duration-150 disabled:opacity-50 sm:px-2.5"
    >
      <RefreshCw className={cn("size-4", enCours && "animate-spin")} />
      <span className="hidden sm:inline">{enCours ? "Synchro…" : "Rafraîchir"}</span>
    </button>
  );
}
