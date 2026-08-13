import * as React from "react";
import { cn } from "@/lib/utils";

// Une carte est une plaque : quatre angles coupés, un filet d'un pixel qui suit
// la coupe, aucune ombre. Le relief du système ne vient pas de la lumière mais
// de la découpe et de la masse du carbone.
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("plate text-card-foreground flex flex-col gap-5 py-5", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-header" className={cn("flex flex-col gap-1.5 px-5", className)} {...props} />
  );
}

// Le titre d'une plaque se grave : capitales en chasse fixe, interlettrage
// ouvert. Ce n'est pas une phrase, c'est une inscription.
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-mono text-xs leading-none font-medium tracking-[0.09em] uppercase",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-5", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardContent };
