"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Rafraîchir toutes ses banques d'un coup. Le bouton de connexion, lui, vit dans
// BankPicker : connecter demande de choisir une banque parmi 128, synchroniser non.
export function SyncNowButton() {
  const [pending, setPending] = useState(false);

  async function sync() {
    setPending(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) toast.success(`${data.imported} transaction(s) importée(s).`);
      else toast.error(`Synchronisation impossible : ${data.error}`);
    } catch {
      toast.error("Synchronisation impossible : le serveur n'a pas répondu.");
    }
    setPending(false);
  }

  return (
    <Button onClick={sync} variant="secondary" disabled={pending} className="cursor-pointer">
      {pending ? "Synchronisation…" : "Synchroniser"}
    </Button>
  );
}
