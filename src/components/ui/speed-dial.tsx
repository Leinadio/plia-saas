"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// LA ROUE DES OUTILS (speed dial). Un seul bouton posé au coin de l'écran, et
// les commandes qui en sortent quand on l'ouvre. Repris d'animata
// (animata.design/docs/fabs/speed-dial) : même ouverture en éventail, même
// décalage d'un item à l'autre, même clavier — flèches, Début, Fin, Échap.
//
// Sur téléphone, la barre du haut n'a de place que pour se repérer : la marque,
// les deux destinations, rafraîchir, le compte. Tout ce qui est un OUTIL — la
// démo, le guide, la calculatrice — descend ici, sous le pouce. C'est la seule
// zone de l'écran qu'on atteint sans changer sa prise du téléphone.
//
// Chaque commande garde son mot à côté de son icône : trois ronds muets au
// milieu de l'écran ne se distinguent pas, et on les ouvrirait pour voir.

type Direction = "up" | "down" | "left" | "right";

export interface SpeedDialAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  /** Une commande qui reste allumée (la démo, la calculatrice ouverte). */
  active?: boolean;
  /** Un compte posé contre le mot — le brouillon en cours, par exemple. */
  badge?: number;
  /** Le ton du compte : sarcelle par défaut, rouge quand il dit une rupture. */
  badgeTon?: "sarcelle" | "tension";
  disabled?: boolean;
}

interface SpeedDialProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: Direction;
  actionButtons: SpeedDialAction[];
  /** Le nom du bouton principal quand il est fermé. */
  triggerLabel?: string;
}

const menuAnchorClass: Record<Direction, string> = {
  up: "bottom-full right-0 mb-3 origin-bottom-right",
  down: "top-full right-0 mt-3 origin-top-right",
  left: "right-full top-1/2 mr-3 -translate-y-1/2 origin-right",
  right: "left-full top-1/2 ml-3 -translate-y-1/2 origin-left",
};

const menuLayoutClass: Record<Direction, string> = {
  up: "flex flex-col-reverse items-end gap-2",
  down: "flex flex-col items-end gap-2",
  left: "flex flex-row-reverse items-center gap-2",
  right: "flex flex-row items-center gap-2",
};

function arrowKeysForDirection(direction: Direction) {
  if (direction === "up") return { prev: "ArrowDown", next: "ArrowUp" };
  if (direction === "down") return { prev: "ArrowUp", next: "ArrowDown" };
  if (direction === "left") return { prev: "ArrowRight", next: "ArrowLeft" };
  return { prev: "ArrowLeft", next: "ArrowRight" };
}

export function SpeedDial({
  direction = "up",
  actionButtons,
  triggerLabel = "Ouvrir les outils",
  className,
  ...props
}: SpeedDialProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  // Un clic ailleurs referme : la roue n'est pas une barre, elle ne reste pas
  // ouverte pendant qu'on lit la page.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
  }, [open]);

  const focusItem = (index: number) => {
    const count = actionButtons.length;
    if (count === 0) return;
    itemRefs.current[(index + count) % count]?.focus();
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const { prev, next } = arrowKeysForDirection(direction);
    const activeIndex = itemRefs.current.findIndex((node) => node === document.activeElement);

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
      case "Home":
        event.preventDefault();
        itemRefs.current[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        itemRefs.current[actionButtons.length - 1]?.focus();
        break;
      default:
        if (event.key === prev) {
          event.preventDefault();
          focusItem(activeIndex <= 0 ? actionButtons.length - 1 : activeIndex - 1);
        } else if (event.key === next) {
          event.preventDefault();
          focusItem(activeIndex < 0 ? 0 : activeIndex + 1);
        }
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex", className)}
      data-direction={direction}
      data-speed-dial
      {...props}
    >
      <button
        ref={triggerRef}
        type="button"
        className="bg-sarcelle shadow-flottante focus-visible:ring-ring focus-visible:ring-offset-background relative z-20 flex size-13 shrink-0 touch-manipulation items-center justify-center rounded-full text-white transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={open ? "Fermer les outils" : triggerLabel}
        onClick={toggle}
      >
        <span
          aria-hidden="true"
          className={cn(
            "speed-dial-trigger-icon flex items-center justify-center transition-transform duration-150 ease-out",
            open && "rotate-45",
          )}
        >
          <Plus className="size-6" strokeWidth={2.25} />
        </span>
      </button>

      {open ? (
        <ul
          id={menuId}
          role="menu"
          aria-orientation={direction === "up" || direction === "down" ? "vertical" : "horizontal"}
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute z-10 m-0 list-none p-0",
            menuAnchorClass[direction],
            menuLayoutClass[direction],
          )}
        >
          {actionButtons.map((action, index) => (
            <li
              key={action.key}
              role="none"
              className="speed-dial-item list-none"
              style={{ "--i": index } as React.CSSProperties}
            >
              <button
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                // Une commande qui reste allumée est une case à cocher du menu,
                // pas un simple item : c'est la seule façon de dire « en cours »
                // à qui ne voit pas la pastille sarcelle.
                role={action.active === undefined ? "menuitem" : "menuitemcheckbox"}
                aria-checked={action.active}
                disabled={action.disabled}
                className={cn(
                  "shadow-levee focus-visible:ring-ring focus-visible:ring-offset-background flex h-11 shrink-0 touch-manipulation items-center gap-2 rounded-full border py-0 pr-4 pl-3 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97] disabled:opacity-50",
                  action.active
                    ? "bg-sarcelle-voile border-sarcelle-voile text-sarcelle-encre"
                    : "bg-card border-filet text-foreground",
                )}
                onClick={() => {
                  action.action();
                  close();
                }}
              >
                <span
                  aria-hidden="true"
                  className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-5"
                >
                  {action.icon}
                </span>
                <span>{action.label}</span>
                {action.badge !== undefined && action.badge > 0 && (
                  <span
                    className={cn(
                      "flex min-w-[1.125rem] items-center justify-center rounded-full px-1.5 text-[0.6875rem] leading-[1.125rem] font-bold text-white",
                      action.badgeTon === "tension" ? "bg-tension" : "bg-sarcelle",
                    )}
                  >
                    {action.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
