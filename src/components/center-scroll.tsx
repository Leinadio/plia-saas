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
    // L'épine, et surtout : est-elle figée ? Elle ne l'est plus en dessous de 640 px,
    // où elle défile avec les chiffres. Là, sauter au mois courant emporterait les
    // noms hors de l'écran AVANT qu'on ait rien lu — on ouvrirait le tableau sur des
    // colonnes de montants sans étiquette. Le tableau s'ouvre donc à son bord gauche,
    // sur les noms, et c'est le doigt qui va chercher les mois.
    //
    // La question se pose au calque et non à la largeur de la fenêtre : le point de
    // rupture est écrit dans la classe de l'épine, c'est elle qui fait foi.
    const epine = c.querySelector<HTMLElement>("[data-epine]");
    if (!epine || getComputedStyle(epine).position !== "sticky") return;
    const cRect = c.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    // La colonne figée cache le bord gauche : on s'arrête à sa droite, sinon le mois
    // commencerait dessous.
    const left = c.scrollLeft + (tRect.left - cRect.left) - epine.getBoundingClientRect().width;
    c.scrollLeft = Math.max(0, left);
  }, []);
  return (
    <div ref={ref} className={cn("overflow-x-auto", className)}>
      {children}
    </div>
  );
}
