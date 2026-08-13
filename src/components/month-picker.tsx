"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "@/lib/transactions-view";
import { cn } from "@/lib/utils";

// « 2026-07 » → « Juillet ». L'année s'affiche à part, en chasse fixe et en
// retrait, pour que le nom du mois porte seul le titre. Recopié de
// history-grid.tsx, qui n'est pas modifié par ce travail : le même objet doit
// se reconnaître d'une vue à l'autre.
function monthName(ym: string): string {
  return monthLabel(ym).replace(/\s+\d{4}$/, "");
}

// Le mois affiché par la vue simple, et une flèche de chaque côté. Des liens et
// non des boutons : le mois vit dans l'adresse, donc il survit à un
// rechargement et se partage. Les autres paramètres sont conservés — la plage
// du tableau (from/to) ne doit pas être effacée en naviguant ici.
export function MonthPicker({ mois, precedent, suivant }: {
  mois: string;
  // null quand la borne de la frise est atteinte : la flèche est alors éteinte
  // plutôt que masquée, sinon le nom du mois sauterait d'un cran.
  precedent: string | null;
  suivant: string | null;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const lien = (m: string) => {
    const p = new URLSearchParams(params.toString());
    p.set("mois", m);
    return `${pathname}?${p.toString()}`;
  };

  const fleche = (cible: string | null, sens: "avant" | "apres") => {
    const classes = "flex size-9 shrink-0 items-center justify-center rounded-md";
    const Icone = sens === "avant" ? ChevronLeft : ChevronRight;
    const label = sens === "avant" ? "Mois précédent" : "Mois suivant";
    if (!cible) {
      return (
        <span aria-hidden className={cn(classes, "text-muted-foreground/30")}>
          <Icone className="size-5" />
        </span>
      );
    }
    return (
      <Link href={lien(cible)} aria-label={label} className={cn(classes, "hover:bg-muted")}>
        <Icone className="size-5" />
      </Link>
    );
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {fleche(precedent, "avant")}
      <div className="flex min-w-44 items-baseline justify-center gap-2">
        <span className="font-display text-xl capitalize">{monthName(mois)}</span>
        <span className="text-muted-foreground/70 font-mono text-xs">{mois.slice(0, 4)}</span>
      </div>
      {fleche(suivant, "apres")}
    </div>
  );
}
