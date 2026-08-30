import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { messageConnexionInitiale } from "@/lib/onboarding";

export function ConnexionReussie({ imported }: { imported?: string }): ReactNode {
  return (
    <div className="creux flex items-start gap-2.5 px-3 py-2.5 text-sm" role="status">
      <CheckCircle2 className="text-portant mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{messageConnexionInitiale(imported)}</span>
    </div>
  );
}
