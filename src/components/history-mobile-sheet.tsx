"use client";

import type { ComponentProps, ReactNode } from "react";
import { X } from "lucide-react";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";

// Le même panneau pour comparer, créer et gérer sur téléphone.
export function HistoryMobileSheetContent({ title, description, section, children, ...props }: {
  title: string;
  description: string;
  section: "income" | "expense" | "balance";
  children: ReactNode;
} & Pick<ComponentProps<typeof SheetContent>, "onCloseAutoFocus">) {
  return <SheetContent side="bottom" showCloseButton={false} data-comparison-sheet={section}
    className="history-mobile-sheet history-comparison-sheet max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl" {...props}>
    <SheetHeader className="pr-16 text-left">
      <SheetTitle>{title}</SheetTitle>
      <SheetDescription>{description}</SheetDescription>
    </SheetHeader>
    <SheetClose asChild>
      <button type="button" aria-label="Fermer" className="history-mobile-icon absolute top-2 right-2"><X aria-hidden="true" /></button>
    </SheetClose>
    {children}
  </SheetContent>;
}
