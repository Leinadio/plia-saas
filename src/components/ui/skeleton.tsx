import { cn } from "@/lib/utils"

// LE TIRAGE : ce qui occupe la place d'une valeur pas encore arrivée. Une barre
// creusée, à l'emplacement et à la largeur exacte de ce qui la remplacera, qu'un
// reflet traverse lentement. Un écran de chargement doit être visiblement le MÊME
// écran, en attente d'encre — pas une grappe de rectangles génériques.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("tirage", className)} {...props} />
}

export { Skeleton }
