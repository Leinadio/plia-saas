"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Le nom affiché, seule chose modifiable ici. L'adresse ne se change pas d'un champ :
// c'est elle qui sert à se connecter, et la changer sans la vérifier fermerait la porte
// à celui qui se trompe d'une lettre.
export function AccountNameForm({ nom }: { nom: string }) {
  const router = useRouter();
  const [name, setName] = useState(nom);
  const [pending, setPending] = useState(false);

  async function enregistrer() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPending(true);
    const res = await authClient.updateUser({ name: trimmed });
    setPending(false);
    if (res.error) {
      toast.error(res.error.message ?? "Impossible d'enregistrer");
      return;
    }
    toast.success("Nom enregistré");
    // La barre latérale affiche ce nom et vient du serveur : sans ce rafraîchissement
    // elle garderait l'ancien jusqu'à la prochaine navigation complète.
    router.refresh();
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
