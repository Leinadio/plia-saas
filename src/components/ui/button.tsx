import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Une commande n'est pas un bouton d'application : c'est une touche de pupitre.
// Capitales en chasse fixe, angles coupés en diagonale, pas d'ombre et pas de
// rayon. Le trait rouge oblique du monde ne se pose pas ici : il est réservé à
// ce qui est actif ou sélectionné (navigation, ligne ouverte), sans quoi il
// deviendrait un motif au lieu d'un repère.
const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 font-mono text-[0.6875rem] font-medium tracking-[0.08em] whitespace-nowrap uppercase transition-all outline-none focus-visible:ring-[2px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 aria-invalid:ring-[2px] aria-invalid:ring-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "cut cut-sm bg-primary text-primary-foreground hover:bg-graphite dark:hover:bg-primary/85",
        destructive:
          "cut cut-sm bg-tension text-white hover:brightness-110 focus-visible:ring-tension",
        outline:
          "plate plate-cut text-foreground hover:[--plate-fill:var(--muted)] hover:[--plate-rule:var(--rule-strong)]",
        secondary:
          "plate plate-cut text-foreground [--plate-fill:var(--muted)] hover:[--plate-rule:var(--rule-strong)]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/60",
        link: "text-tension-ink normal-case tracking-normal underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 has-[>svg]:px-3",
        xs: "h-6 gap-1 px-2 text-[0.625rem] has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9 px-0",
        "icon-xs": "size-6 px-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 px-0",
        "icon-lg": "size-10 px-0",
      },
    },
    // Le trait rouge oblique du monde, posé dans l'angle gauche de la commande
    // pleine : c'est la marque de ce qui engage. Réservé aux deux tailles qui
    // portent du texte — dans une icône seule, il n'aurait pas la place, et sur
    // une action de ligne il ferait un motif au lieu d'un repère.
    compoundVariants: [
      { variant: "default", size: "default", class: "slash pl-7" },
      { variant: "default", size: "lg", class: "slash pl-8" },
    ],
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
