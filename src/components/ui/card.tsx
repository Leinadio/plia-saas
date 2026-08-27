import * as React from "react";
import { cn } from "@/lib/utils";

// LA CARTE. La surface du produit, et la seule : blanche, arrondie à 12 px,
// cerclée d'un filet d'un pixel, posée sur une ombre courte. Rien ne s'imbrique —
// ce qui vit DANS une carte prend la surface creusée, jamais une deuxième carte.
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("carte text-card-foreground flex flex-col", className)}
      {...props}
    />
  );
}

// L'en-tête d'une carte est séparé de son contenu par un filet : c'est ce qui lui
// donne son assise quand la carte porte une liste.
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5", className)}
      {...props}
    />
  );
}

// Le titre d'une carte s'écrit, il ne se grave pas : casse normale, corps
// lisible, encre pleine.
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("titre-carte", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-4 py-4 sm:px-5", className)} {...props} />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
