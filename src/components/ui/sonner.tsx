"use client";

import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Le composant shadcn, à deux écarts près.
//
// Le premier : pas de next-themes. L'app ne l'utilise pas — le thème sombre se pose
// par un script en ligne qui bascule une classe sur <html> d'après la préférence
// système (cf. layout.tsx). « system » dit à sonner de lire la même préférence, ce qui
// revient au même sans ajouter une dépendance pour une seule lecture.
//
// Le second : les couleurs. Un accusé de réception prend le voile du portant, un
// échec celui de la tension — les mêmes deux voiles que les pastilles d'état, pour
// qu'un message passager se lise dans le vocabulaire de l'écran qu'il survole.
// Aucun filet : le voile suffit à porter le sens, et l'ombre longue à décoller le
// message du contenu.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--portant-voile)",
          "--success-text": "var(--popover-foreground)",
          "--success-border": "transparent",
          "--error-bg": "var(--tension-voile)",
          "--error-text": "var(--popover-foreground)",
          "--error-border": "transparent",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
