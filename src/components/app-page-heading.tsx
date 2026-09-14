"use client";

import { usePathname } from "next/navigation";

const pages = {
  historique: { title: "Votre budget, en perspective.", description: "Ce qui rentre, ce qui sort, ce qu’il vous restera." },
  transactions: { title: "Chaque mouvement, au clair.", description: "Retrouvez vos opérations et donnez-leur la bonne place." },
  compte: { title: "Votre espace personnel.", description: "Les informations qui vous accompagnent dans Planora." },
  settings: { title: "À votre façon.", description: "Vos banques, vos comptes et vos préférences, au même endroit." },
} as const;

export function AppPageHeading() {
  const pathname = usePathname();
  const key = pathname.split("/").at(-1) as keyof typeof pages;
  const page = pages[key] ?? pages.historique;
  return (
    <div className="app-page-heading">
      <div>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>
      <svg className="app-heading-curves" viewBox="0 0 520 100" fill="none" aria-hidden="true">
        <path d="M-20 66C104 6 150 98 292 58S451 17 540 47" />
        <path d="M-20 82C104 22 150 114 292 74S451 33 540 63" />
      </svg>
    </div>
  );
}
