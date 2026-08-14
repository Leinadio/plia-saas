import { cn } from "@/lib/utils"

// La barre de tirage : ce qui occupe la place d'une valeur pas encore arrivée.
// Carrée, comme tout ce qui est plaque dans ce produit, et teintée au voile —
// la même matière que les fonds de colonnes du grand tableau, pour qu'un écran
// en cours de chargement soit visiblement le MÊME écran, en attente d'encre.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("tirage", className)} {...props} />
}

export { Skeleton }
