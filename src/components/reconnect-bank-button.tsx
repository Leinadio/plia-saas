"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ReconnectBankButton({ connectionId, bankName }: { connectionId: number; bankName: string }) {
  const [pending, setPending] = useState(false);
  async function reconnect() {
    setPending(true);
    try {
      const response = await fetch("/api/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error ?? "La banque n'a pas répondu.");
      window.location.assign(data.url);
    } catch (error) {
      toast.error(`Reconnexion impossible : ${error instanceof Error ? error.message : "le serveur n'a pas répondu."}`);
      setPending(false);
    }
  }
  return (
    <Button variant="secondary" size="sm" onClick={reconnect} disabled={pending} aria-label={`Reconnecter ${bankName}`} className="cursor-pointer">
      <RefreshCw className="size-4" />
      {pending ? "Ouverture…" : "Reconnecter"}
    </Button>
  );
}
