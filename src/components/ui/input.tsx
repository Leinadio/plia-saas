import * as React from "react"

import { cn } from "@/lib/utils"

// LA RECETTE D'UN CHAMP, écrite UNE fois. Elle est partagée avec les `<select>`
// natifs du produit, qui sont sa seule autre forme de champ : recopiée de fichier
// en fichier, elle avait déjà divergé — 14 px au lieu de 16 (donc un zoom iOS à la
// mise au point), pas de repli désactivé, pas d'éclaircissement à la mise au
// point. Un vocabulaire de formulaire ne se tient pas par la discipline, il se
// tient par une seule définition.
export const champClass =
  "bg-creuse border-filet-fort h-9 rounded-lg border px-3 text-base transition-[background-color,border-color,box-shadow] duration-150 outline-none " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm " +
  "focus-visible:bg-card focus-visible:border-sarcelle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sarcelle/25 " +
  "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25"

// UN CHAMP. Fond creusé, filet d'un pixel, coins arrondis à 8 px. Il s'éclaire en
// blanc et prend le filet sarcelle à la mise au point : un champ actif est une
// surface qui s'ouvre, pas un contour qui change de couleur.
//
// Le texte reste à 16 px sous 768 px — en dessous, iOS zoome à la mise au point.
// L'état d'erreur découle d'aria-invalid, jamais d'une classe posée à la main :
// c'est d'abord une information d'accessibilité.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        champClass,
        "w-full min-w-0 py-1",
        "selection:bg-sarcelle selection:text-white placeholder:text-ardoise-claire",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
