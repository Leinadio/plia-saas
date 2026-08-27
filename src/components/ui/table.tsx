import * as React from "react";
import { cn } from "@/lib/utils";

// LE RELEVÉ TABULAIRE, ce qu'il en reste. Le produit ne se lit plus dans une
// grille : ses postes et ses mois sont des cartes. Cette primitive ne sert plus
// qu'aux listes vraiment tabulaires qui vivent DANS une carte — des lignes
// séparées par un filet, des montants à droite, des en-têtes en petites
// capitales. Pas de fond, pas de bordure : c'est la carte qui les porte.
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead data-slot="table-header" className={cn("[&_tr]:border-filet [&_tr]:border-b", className)} {...props} />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-filet hover:bg-survol border-b transition-colors duration-150", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn("legende h-8 px-2 text-left align-middle whitespace-nowrap", className)}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td data-slot="table-cell" className={cn("px-2 py-2 align-middle whitespace-nowrap", className)} {...props} />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
