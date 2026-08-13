"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Défilement horizontal qui, au montage, amène l'élément marqué
// [data-current-month] contre le bord gauche de la zone visible, juste après la
// colonne figée s'il y en a une.
//
// Il le CENTRAIT, du temps où l'historique posait un tableau par mois : chaque
// tableau réécrivait ses en-têtes, donc un mois centré se lisait entier. Il n'y a
// plus qu'un tableau, dont la colonne des noms est figée à gauche : centrer le mois
// courant poussait le nom du mois et ses soldes hors de l'écran par la gauche, et
// ne laissait voir que des colonnes de chiffres. Calé à gauche, le mois s'ouvre par
// son nom.
export function CenterScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const target = c.querySelector<HTMLElement>("[data-current-month]");
    if (!target) return;
    const cRect = c.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    // La colonne figée cache le bord gauche : on s'arrête à sa droite, sinon le mois
    // commencerait dessous.
    const fige = c.querySelector<HTMLElement>("thead th.sticky, tbody td.sticky");
    const marge = fige ? fige.getBoundingClientRect().width : 0;
    const left = c.scrollLeft + (tRect.left - cRect.left) - marge;
    c.scrollLeft = Math.max(0, left);
  }, []);
  return (
    <div ref={ref} className={cn("overflow-x-auto", className)}>
      {children}
    </div>
  );
}
