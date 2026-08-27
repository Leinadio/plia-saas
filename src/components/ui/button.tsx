import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// UNE COMMANDE, DANS LE MONDE DES CARTES. Casse normale, coins arrondis à 8 px,
// hauteur 36 px : c'est un bouton de logiciel de travail, qui doit se reconnaître
// sans qu'on ait à l'apprendre. La sarcelle ne se pose QUE sur la commande
// principale et sur le lien — un montant n'est jamais sarcelle, une commande
// secondaire non plus.
const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-[background-color,box-shadow,color] duration-150 outline-none disabled:pointer-events-none disabled:opacity-45 aria-invalid:ring-2 aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-carte hover:bg-sarcelle-forte active:bg-sarcelle-forte",
        destructive:
          "bg-tension text-white shadow-carte hover:brightness-95 active:brightness-90",
        // La commande secondaire est une carte à hauteur de bouton : fond blanc,
        // filet d'un pixel, ombre courte. Elle se distingue de la principale par
        // sa matière, pas par une teinte plus pâle de la même couleur.
        outline:
          "bg-card text-foreground border border-filet shadow-carte hover:bg-survol hover:border-filet-fort",
        secondary:
          "bg-creuse text-foreground hover:bg-survol",
        ghost:
          "text-ardoise hover:bg-survol hover:text-foreground",
        link: "text-sarcelle-encre underline-offset-[3px] hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        xs: "h-6 gap-1 rounded-md px-1.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 rounded-md px-2.5 text-[0.8125rem]",
        lg: "h-10 px-5",
        icon: "size-9 px-0",
        "icon-xs": "size-6 rounded-md px-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-md px-0",
        "icon-lg": "size-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
