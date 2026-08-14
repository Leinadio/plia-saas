"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMiseAJour } from "@/components/mise-a-jour";

// Rafraîchir toutes ses banques d'un coup. Le bouton de connexion, lui, vit dans
// BankPicker : connecter demande de choisir une banque parmi 128, synchroniser non.
export function SyncNowButton() {
  const [appel, setAppel] = useState(false);
  // Même raison que dans SyncButton : le bouton reste occupé jusqu'à ce que la page
  // rafraîchie soit à l'écran, pas seulement jusqu'à la fin de l'appel réseau.
  const { rafraichir: redessiner, enCours: rendu } = useMiseAJour();
  const pending = appel || rendu;

  async function sync() {
    setAppel(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.imported} transaction(s) importée(s).`);
        // Le routeur de Next garde en cache les pages déjà visitées : sans ce
        // rafraîchissement, passer sur Transactions ou Tableau de bord réafficherait
        // la version d'avant la synchro, sans le compte qui vient d'arriver.
        redessiner();
      }
      else toast.error(`Synchronisation impossible : ${data.error}`);
    } catch {
      toast.error("Synchronisation impossible : le serveur n'a pas répondu.");
    }
    setAppel(false);
  }

  return (
    <Button onClick={sync} variant="secondary" disabled={pending} className="cursor-pointer">
      {pending ? "Synchronisation…" : "Synchroniser"}
    </Button>
  );
}
