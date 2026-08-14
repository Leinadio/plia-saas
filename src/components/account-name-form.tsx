"use client";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMiseAJour } from "@/components/mise-a-jour";

// Le nom affiché, seule chose modifiable ici. L'adresse ne se change pas d'un champ :
// c'est elle qui sert à se connecter, et la changer sans la vérifier fermerait la porte
// à celui qui se trompe d'une lettre.
export function AccountNameForm({ nom }: { nom: string }) {
  // La poutre affiche ce nom et vient du serveur : sans rafraîchissement elle
  // garderait l'ancien jusqu'à la prochaine navigation complète. « En cours »
  // couvre donc l'enregistrement ET le redessin de la poutre.
  const { pendant, enCours: pending } = useMiseAJour();
  const [name, setName] = useState(nom);

  async function enregistrer() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await pendant(async () => {
      const res = await authClient.updateUser({ name: trimmed });
      if (res.error) {
        toast.error(res.error.message ?? "Impossible d'enregistrer");
        return;
      }
      toast.success("Nom enregistré");
    });
  }

  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label className="font-normal">Nom</Label>
      <div className="flex items-center gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="cursor-pointer"
          disabled={pending || !name.trim() || name.trim() === nom}
          onClick={enregistrer}
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
