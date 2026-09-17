"use client";

import { usePathname } from "next/navigation";

const pages = {
  automatisations: { title: "À chaque opération, sa place.", description: "Vos règles automatiques, vos budgets, vos choix." },
  historique: { title: "Votre budget, en perspective.", description: "Ce qui rentre, ce qui sort, ce qu’il vous restera." },
  transactions: { title: "Chaque mouvement, au clair.", description: "Retrouvez vos opérations et donnez-leur la bonne place." },
  compte: { title: "Votre espace personnel.", description: "Les informations qui vous accompagnent dans Planora." },
  settings: { title: "À votre façon.", description: "Vos banques, vos comptes et vos préférences, au même endroit." },
  contact: { title: "On vous écoute.", description: "Une question sur Planora ? Écrivez-nous." },
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
    </div>
  );
}
