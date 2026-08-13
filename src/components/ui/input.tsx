import * as React from "react"

import { cn } from "@/lib/utils"

// Un champ est une plaque de commande évidée : deux angles coupés, un filet d'un
// pixel, aucun rayon. Le texte reste à 16 px sous 768 px — en dessous, iOS zoome
// à la mise au point. L'état d'erreur découle d'aria-invalid, jamais d'une classe
// posée à la main : c'est d'abord une information d'accessibilité.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "plate plate-cut h-9 w-full min-w-0 px-3 py-1 text-base transition-all outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:[--plate-rule:var(--tension)] focus-visible:ring-[2px] focus-visible:ring-ring/60",
        "aria-invalid:[--plate-rule:var(--destructive)] aria-invalid:ring-[2px] aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
