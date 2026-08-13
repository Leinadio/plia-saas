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
// Le second : les couleurs. L'app n'a pas de vert — un accusé de réception se dit
// en carbone, comme tout ce qui porte, et l'échec se dit en rouge de tension, la
// seule couleur du système. Les deux fonds sont des color-mix avec le popover :
// ils suivent le thème au lieu d'y plaquer une couleur d'écran.
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
          "--success-bg": "color-mix(in oklab, var(--carbon) 8%, var(--popover))",
          "--success-text": "var(--popover-foreground)",
          "--success-border": "var(--rule-strong)",
          "--error-bg": "color-mix(in oklab, var(--tension) 10%, var(--popover))",
          "--error-text": "var(--popover-foreground)",
          "--error-border": "var(--tension)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
