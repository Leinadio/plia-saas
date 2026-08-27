import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// LA PASTILLE D'ÉTAT. Un ovale plein en petites capitales, qui nomme un état —
// reçu, engagé, attendu, dépassé — et jamais une valeur. C'est le seul endroit du
// produit où une couleur de sens sert de FOND ; partout ailleurs elle ne teinte
// que de l'encre.
const badgeVariants = cva("pastille w-fit shrink-0", {
  variants: {
    variant: {
      default: "",
      portant: "pastille-portant",
      attente: "pastille-attente",
      sarcelle: "pastille-sarcelle",
      encre: "pastille-encre",
      secondary: "",
      destructive: "pastille-tension",
      outline: "",
    },
  },
  defaultVariants: { variant: "default" },
});

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
