import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// L'étiquette gravée du monde : une pastille de carbone, capitales blanches en
// chasse fixe. Elle nomme un état ou une famille — jamais une valeur. Trois
// états seulement : engagé (carbone), dormant (évidé), rompu (rouge de tension).
const badgeVariants = cva("chip w-fit shrink-0", {
  variants: {
    variant: {
      default: "",
      secondary: "chip-slack",
      destructive: "chip-tension",
      outline: "chip-slack",
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
