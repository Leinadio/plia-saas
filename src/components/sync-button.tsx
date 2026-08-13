"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { syncMessage } from "@/lib/sync-message";

// Rafraîchit les transactions depuis la banque, depuis l'en-tête. Le même appel que le
// bouton « Synchroniser » des Réglages (POST /api/sync) : c'est le geste qu'on fait le
// plus souvent, il n'avait rien à faire au fond d'une page de configuration.
//
// Pas une server action mais l'API existante : la synchronisation parle à Enable
// Banking et peut durer, et cette route sait déjà rendre le compte de ce qui est entré
// comme les erreurs de la banque. Une fois finie, router.refresh() recharge la page
// courante — sans quoi le tableau montrerait encore l'avant.
export function SyncButton() {
  const router = useRouter();
  const [appel, setAppel] = useState(false);
  // router.refresh rend la main tout de suite : le nouveau rendu arrive après. Sans
  // cette transition le bouton redevenait actif alors que le tableau montrait encore
  // l'avant, et on croyait la synchronisation sans effet. isPending ne retombe qu'une
  // fois le rendu reçu et affiché.
  const [rendu, startTransition] = useTransition();
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
      startTransition(() => router.refresh());
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
      // Mêmes formes que le bouton voisin des dépassements : ils vont par paire dans
      // la poutre, et deux dessins différents les feraient lire comme deux natures.
      className="text-beam-foreground hover:text-beam-bright hover:bg-beam-accent inline-flex items-center gap-1.5 px-2 py-1.5 font-mono text-[0.6875rem] tracking-[0.08em] uppercase transition-colors disabled:opacity-50"
    >
      <RefreshCw className={cn("size-4", enCours && "animate-spin")} />
      <span className="hidden sm:inline">{enCours ? "Synchro…" : "Rafraîchir"}</span>
    </button>
  );
}
