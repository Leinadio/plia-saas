// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Le tableau monte des champs qui parlent au routeur (commentaire, rattachement) :
// ils ne sont pas le sujet ici.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
  usePathname: () => "/app/historique",
  useSearchParams: () => new URLSearchParams(),
}));
import { HistoryGrid } from "../../src/components/history-grid";
import { TooltipProvider } from "../../src/components/ui/tooltip";
import type { HistorySection, HistoryRow, HistoryTxn, MonthCell, SoldeColumn, PlannedSoldes } from "../../src/lib/history";
import type { AccountForecast } from "../../src/lib/forecast";
import { sectionNode } from "../../src/lib/history-detail";
import { flattenNodes, cellsForNode } from "../../src/lib/history-nav";
import type { DetailNode } from "../../src/lib/history-explain";
import { FORMAT_MONTANT, decoderMontant } from "../../src/lib/calculatrice";

// LE PANNEAU DÉSIGNE, LE TABLEAU DÉPLIE. Cliquer une transaction dans le calcul
// doit la faire apparaître dans le grand tableau : elle vit sous un groupe replié,
// et le tableau ouvre ce qu'il faut pour la montrer.

const MOIS = ["2026-08"];

function cell(p: Partial<MonthCell> = {}): MonthCell {
  return { budgeted: 0, depense: 0, recu: 0, balance: 0, ...p };
}

// L'identifiant d'une transaction synchronisée porte son compte et sa référence,
// séparés par « :: » (TXN_ID_SEP). C'est la forme réelle, et c'est elle qui avait
// cassé la lecture des clés de case : les fixtures en démonstration n'ont pas de
// séparateur, donc rien ne le montrait.
const recette: HistoryTxn = {
  id: "cpt-1::2026082100112233", date: "2026-08-21", label: "REEQUILIBRAGE", amount: 4.5,
  month: "2026-08", groupId: 7, lineId: null,
};
const sortie: HistoryTxn = {
  id: "cpt-1::2026081200998877", date: "2026-08-12", label: "COURSES", amount: -12.5,
  month: "2026-08", groupId: 8, lineId: null,
};

function row(p: Partial<HistoryRow> & { id: number }): HistoryRow {
  return { name: `G${p.id}`, direction: "out", cells: [cell()], aliveMonths: [true], subRows: [], txns: [], ...p };
}

// Une rémunération découpée en postes : la transaction est masquée DEUX fois dans
// le tableau (sous le groupe, puis sous le poste) alors que le panneau la montre
// directement sous le groupe.
const recetteDePoste: HistoryTxn = {
  id: "cpt-1::2026080700334455", date: "2026-08-07", label: "VIREMENT INSTANTANE", amount: 33.76,
  month: "2026-08", groupId: 9, lineId: 91,
};

const revenus: HistorySection = {
  kind: "income",
  rows: [row({ id: 7, name: "Rémunération supplémentaire", direction: "in", cells: [cell({ recu: 4.5 })], txns: [recette] })],
  totals: [cell({ recu: 4.5 })],
};
const revenusAPostes: HistorySection = {
  kind: "income",
  rows: [row({
    id: 9, name: "Rémunération Principale", direction: "in", cells: [cell({ recu: 33.76 })],
    subRows: [{ id: 91, name: "Virements", cells: [cell({ recu: 33.76 })], aliveMonths: [true], txns: [recetteDePoste] }],
  })],
  totals: [cell({ recu: 33.76 })],
};
const depenses: HistorySection = {
  kind: "expense",
  rows: [row({ id: 8, name: "Courses", cells: [cell({ depense: 12.5 })], txns: [sortie] })],
  totals: [cell({ depense: 12.5 })],
};

const solde: SoldeColumn = { openings: [0], closings: [0], rowRunning: { 7: [4.5], 8: [-12.5] }, uncategorizedRunning: null };
const planned: PlannedSoldes = {
  prevuClosings: [null], depassClosings: [null], prevuRowRunning: {}, depassRowRunning: {},
  uncatPrevuRunning: {}, uncatDepassRunning: {},
};
const forecast = {
  accountId: "a1", balance: 0, currentEstimate: 0, nextEstimate: 0, overspendTotal: 0,
  nextEstimateWithOverspend: 0, groups: [], currentSteps: [], nextSteps: [], overspendSteps: [],
} as unknown as AccountForecast;

// Tous les chemins de l'arbre, pour ouvrir le panneau en grand.
function tousLesChemins(noeuds: DetailNode[], prefixe = ""): Set<string> {
  const out = new Set<string>();
  noeuds.forEach((n, i) => {
    const chemin = prefixe ? `${prefixe}.${i}` : `${i}`;
    out.add(chemin);
    for (const c of tousLesChemins(n.children ?? [], chemin)) out.add(c);
  });
  return out;
}

// Ce que le panneau désigne quand on clique la ligne d'une transaction : on repasse
// par les vrais constructeurs, pour que le test tienne si les clés changent.
function caseDeLaTransaction(sec: HistorySection, label: string): string[] {
  const racine = sectionNode(sec, 0, "2026-08", "recu");
  const ligne = flattenNodes([racine], tousLesChemins([racine])).find((r) => r.node.label.includes(label));
  if (!ligne) throw new Error(`transaction « ${label} » absente du panneau`);
  const cells = cellsForNode(ligne.node, undefined);
  if (!cells) throw new Error(`transaction « ${label} » sans case visée`);
  return cells;
}

function elementGrille(selected: string[], sections: HistorySection[] = [revenus, depenses], overrides: Partial<React.ComponentProps<typeof HistoryGrid>> = {}) {
  return (
    createElement(TooltipProvider, undefined, createElement(HistoryGrid, {
      months: MOIS,
      currentMonth: "2026-08",
      stripMin: "2026-01",
      stripMax: "2026-12",
      forecast,
      sections,
      overspend: [0],
      grand: [cell({ recu: 4.5, depense: 12.5 })],
      groups: [],
      solde,
      planned,
      onSelect: () => {},
      selected,
      anchor: null,
      accountId: "a1",
      ...overrides,
    }))
  );
}

function grille(...args: Parameters<typeof elementGrille>) {
  return renderToStaticMarkup(elementGrille(...args));
}

describe("repli des revenus", () => {
  const nonRanges: HistorySection = {
    kind: "uncategorized", uncatDirection: "in", rows: [],
    txns: [{ ...recette, id: "recette-non-rangee", groupId: null }],
    totals: [cell({ recu: 4.5 })],
  };

  it.each([false, true])("replie et rouvre les revenus sans toucher aux dépenses ni au total (mobile : %s)", async (isMobile) => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const mobile = isMobile ? { month: "2026-08", metric: null, onMonthChange: () => {} } : undefined;
    try {
      await act(async () => root.render(elementGrille([], [revenus, nonRanges, depenses], { mobile })));
      const fold = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Ce qui rentre");
      expect(fold).toBeDefined();
      const total = container.querySelector('[data-history-total="income"]')!.textContent;
      await act(async () => fold!.click());
      expect(fold!.getAttribute("aria-expanded")).toBe("false");
      expect(container.querySelector('[data-cellkey="group:7::recu::0"]')).toBeNull();
      expect(container.querySelector('[data-cellkey="section:uncat-in::recu::0"]')).toBeNull();
      expect(container.querySelector('[data-cellkey="group:8::depense::0"]')).not.toBeNull();
      expect(container.querySelector('[data-history-total="income"]')!.textContent).toBe(total);
      await act(async () => fold!.click());
      expect(fold!.getAttribute("aria-expanded")).toBe("true");
      expect(container.querySelector('[data-cellkey="group:7::recu::0"]')).not.toBeNull();
      expect(container.querySelector('[data-cellkey="section:uncat-in::recu::0"]')).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it.each([
    { section: revenusAPostes, reference: `txn:${recetteDePoste.id}::recu::0` },
    { section: nonRanges, reference: "txn:recette-non-rangee::recu::0" },
  ])("révèle $reference désigné dans le détail malgré le repli", async ({ section, reference }) => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const mobile = { month: "2026-08", metric: null, onMonthChange: () => {} };
    try {
      await act(async () => root.render(elementGrille([], [section], { mobile })));
      const fold = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Ce qui rentre");
      expect(fold).toBeDefined();
      await act(async () => fold!.click());
      expect(fold!.getAttribute("aria-expanded")).toBe("false");
      await act(async () => root.render(elementGrille([reference], [section], { mobile })));
      expect(fold!.getAttribute("aria-expanded")).toBe("true");
      expect(container.querySelector(`[data-cellkey="${reference}"]`)).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});

describe("balance dans le total des dépenses", () => {
  it("sépare les deux tableaux et retire les colonnes étrangères à leur sens", () => {
    const el = document.createElement("div");
    el.innerHTML = grille([]);
    const income = el.querySelector('[data-history-section-table="income"]')!;
    const expense = el.querySelector('[data-history-section-table="expense"]')!;
    expect(income).not.toBeNull();
    expect(expense).not.toBeNull();
    const headings = (table: Element) => Array.from(table.querySelectorAll("th")).map(th => th.textContent);
    expect(headings(income)).toEqual(["", "Attendu", "Reçu", "Réel", "Prévu", "Si dép."]);
    expect(headings(expense)).toEqual(["", "Budget", "Dépensé", "Remboursements / apports", "Balance", "Réel", "Prévu", "Si dép."]);
    expect(income.querySelector('[data-cellkey="group:7::budget::0"]')).toBeNull();
    expect(income.querySelector('[data-cellkey="group:7::depense::0"]')).toBeNull();
    expect(expense.querySelector('[data-cellkey="group:8::revenus::0"]')).toBeNull();
    expect(income.querySelector('[data-cellkey="group:7::solde::0"]')).not.toBeNull();
    expect(expense.querySelector('[data-cellkey="group:8::solde::0"]')).not.toBeNull();
    expect(income.querySelector('[data-cellkey="group:7::recu::0"]')!.closest("tr")!.children).toHaveLength(7);
    expect(expense.querySelector('[data-cellkey="group:8::depense::0"]')!.closest("tr")!.children).toHaveLength(8);
  });

  it.each([false, true])("conserve le montant et son calcul dans le total (mobile : %s)", async (mobile) => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const onSelect = vi.fn();
    const expense = { ...depenses, totals: [cell({ budgeted: 10, depense: 12.5, balance: -2.5 })] };
    try {
      await act(async () => root.render(elementGrille([], [revenus, expense], {
        onSelect,
        ...(mobile ? { mobile: { month: "2026-08", metric: null, onMonthChange: () => {} } } : {}),
      })));
      expect(container.textContent).not.toContain("Balance dépenses");
      const total = Array.from(container.querySelectorAll("tr")).find(tr => tr.textContent?.includes("Total Dépenses"))!;
      const balance = total.querySelector<HTMLElement>('[data-cellkey="section:expense::reste::0"]');
      expect(balance).not.toBeNull();
      expect(balance!.textContent?.replace(/\s/g, "")).toContain("-2,50");
      await act(async () => balance!.querySelector<HTMLButtonElement>("button:last-child")!.click());
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
        result: -2.5,
        nodes: expect.arrayContaining([
          expect.objectContaining({ label: "Budget", amount: 10, ref: "section:expense::budget::0" }),
          expect.objectContaining({ label: "Dépensé", amount: -12.5, ref: "section:expense::depense::0" }),
        ]),
      }));
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});

describe("cartes des sections sur mobile", () => {
  const mobile = { month: "2026-08", metric: null, onMonthChange: () => {} };

  it("réunit les montants en cinq cartes et conserve les opérations non catégorisées", () => {
    const uncat: HistorySection = { kind: "uncategorized", uncatDirection: "out", rows: [], totals: [cell({ depense: 3, balance: -3 })], txns: [{ ...sortie, id: "uncat-1", groupId: null, amount: -3 }] };
    const el = document.createElement("div");
    el.innerHTML = grille([], [revenus, depenses, uncat], { mobile });
    const cards = el.querySelectorAll("[data-history-card]");
    expect(cards).toHaveLength(5);
    expect(cards[0].textContent).toContain("Août 2026");
    expect(cards[0].textContent).toContain("Solde de fin de mois");
    expect(cards[0].textContent).toContain("Estimé fin de mois");
    expect(cards[1].textContent).toContain("Argent de départ");
    expect(cards[2].textContent).toContain("Ce qui rentre");
    expect(cards[2].textContent).toContain("Total revenus");
    expect(cards[3].textContent).toContain("Ce qui sort");
    expect(cards[3].textContent).toContain("Total Dépenses");
    expect(cards[3].textContent).toContain("Dépenses non catégorisées");
    expect(cards[4].textContent).not.toContain("Total du mois");
    expect(cards[4].textContent).toContain("Total dépassement hors budget");
    expect(el.querySelector("tbody tbody")).toBeNull();
  });

  it.each([null, "soldeReel"] as const)("masque le bloc bancaire en attente sur tous les écrans (mobile : %s), sans changer les soldes", metric => {
    const pendingSolde = { ...solde, pending: [6.48] };
    const el = document.createElement("div");
    el.innerHTML = grille([], [revenus, depenses], { mobile: { ...mobile, metric }, solde: pendingSolde });
    expect(el.textContent).not.toContain("Opérations bancaires en attente");
    expect(el.querySelector('[data-cellkey="opening::solde::0"]')).not.toBeNull();
    const desktop = document.createElement("div");
    desktop.innerHTML = grille([], [revenus, depenses], { solde: pendingSolde });
    expect(desktop.textContent).not.toContain("Opérations bancaires en attente");
    expect(desktop.querySelectorAll("[data-history-section-table]")).toHaveLength(2);
    expect(desktop.querySelector("[data-history-card]")).toBeNull();
    expect(el.querySelector('[data-cellkey="opening::solde::0"]')?.textContent).toContain(
      desktop.querySelector('[data-cellkey="opening::solde::0"]')!.textContent!,
    );
  });
});

describe("désigner une transaction depuis le panneau", () => {
  it.each([false, true])("affiche un seul argent de départ et conserve son calcul (mobile : %s)", async mobile => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    const root = createRoot(container);
    const onSelect = vi.fn();
    try {
      await act(async () => root.render(elementGrille([], [revenus, depenses], {
        onSelect,
        solde: { ...solde, openings: [6.55], bookedBalance: 50 },
        ...(mobile ? { mobile: { month: "2026-08", metric: null, onMonthChange: () => {} } } : {}),
      })));
      const opening = container.querySelector('[data-history-opening]')!;
      expect(opening.querySelectorAll('[data-cellkey^="opening::"]')).toHaveLength(1);
      const amount = opening.querySelector('[data-cellkey="opening::solde::0"]')!;
      expect(amount.textContent).toContain("6,55");
      if (mobile) {
        expect(opening.textContent).toContain("Argent de départ");
        expect(opening.textContent).not.toMatch(/Solde réel|Solde prévu|Si dépassement/);
      } else {
        const head = amount.closest("th")!;
        expect(head).not.toBeNull();
        expect(head.textContent).toContain("Août");
        expect(head.textContent).toContain("solde aujourd'hui");
        expect(opening.textContent).toContain("Argent de départ");
        expect(container.querySelector("tbody [data-history-opening]")).toBeNull();
      }
      await act(async () => amount.querySelector<HTMLButtonElement>(mobile ? ".history-mobile-number button" : "button")!.click());
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ title: "Argent de départ", result: 6.55 }));
    } finally {
      await act(async () => root.unmount());
    }
  });

  it("conserve le calcul et le glisser du départ propre à chaque mois dans l'en-tête", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    const root = createRoot(container);
    const onSelect = vi.fn();
    try {
      await act(async () => root.render(elementGrille([], [], {
        months: ["2026-08", "2026-09", "2026-10"], currentMonth: "2026-09", onSelect,
        grand: [cell(), cell(), cell()],
        solde: { ...solde, openings: [6.55, 100, 150], closings: [100, 120, 200], bookedBalance: 50 },
        planned: { ...planned, prevuClosings: [100, 150, 200], depassClosings: [100, 150, 200] },
      })));
      for (const [index, value, previous] of [[0, 6.55, undefined], [1, 100, "grand::solde::0"], [2, 150, "estime::solde::1"]] as const) {
        const amount = container.querySelector(`thead [data-cellkey="opening::solde::${index}"]`)!;
        expect(amount).not.toBeNull();
        const button = amount.querySelector<HTMLButtonElement>("button")!;
        await act(async () => button.click());
        const detail = onSelect.mock.calls.at(-1)![0];
        expect(detail.result).toBe(value);
        expect(detail.cellRef).toBe(`opening::solde::${index}`);
        expect(detail.nodes[0].ref).toBe(previous);
        expect(detail.nodes.reduce((sum: number, node: DetailNode) => sum + node.amount, 0)).toBeCloseTo(value, 2);
        const dataTransfer = { setData: vi.fn(), effectAllowed: "none" };
        const drag = new Event("dragstart", { bubbles: true });
        Object.defineProperty(drag, "dataTransfer", { value: dataTransfer });
        await act(async () => button.dispatchEvent(drag));
        expect(button.draggable).toBe(true);
        expect(dataTransfer.setData.mock.calls[0][0]).toBe(FORMAT_MONTANT);
        expect(decoderMontant(dataTransfer.setData.mock.calls[0][1])).toMatchObject({ montant: value });
        expect(dataTransfer.effectAllowed).toBe("copy");
      }
    } finally {
      await act(async () => root.unmount());
    }
  });

  it.each(["soldePrevu", "soldeDepass"])("retrouve l'argent de départ depuis le calcul %s", column => {
    const el = document.createElement("div");
    el.innerHTML = grille([`opening::${column}::0`]);
    expect(el.querySelector('[data-cellkey="opening::solde::0"]')?.classList.contains("case-active")).toBe(true);
  });

  it("conserve un remboursement sortant d'un revenu sous Reçu", () => {
    const returned = { ...recette, id: "returned-income", amount: -2 };
    const income = { ...revenus, rows: [{ ...revenus.rows[0], txns: [recette, returned] }] };
    const el = document.createElement("div");
    el.innerHTML = grille(["txn:returned-income::depense::0"], [income, depenses]);
    const amount = el.querySelector('[data-cellkey="txn:returned-income::depense::0"]');
    expect(amount).not.toBeNull();
    expect(amount!.textContent).toContain("-2,00");
    expect(amount!.closest("[data-history-section-table]")?.getAttribute("data-history-section-table")).toBe("income");
  });

  it.each([false, true])("retire le total du mois et conserve les soldes et totaux des sections (mobile : %s)", mobile => {
    const el = document.createElement("div");
    el.innerHTML = grille([], [revenus, depenses], {
      ...(mobile ? { mobile: { month: "2026-08", metric: null, onMonthChange: () => {} } } : {}),
    });
    expect(el.textContent).not.toContain("Total du mois");
    for (const label of ["Total revenus", "Total Dépenses", "Solde de fin de mois", "Estimé fin de mois", "Total dépassement hors budget"]) {
      expect(el.textContent).toContain(label);
    }
    expect(el.querySelector('[data-cellkey="grand::solde::0"]')).not.toBeNull();
    for (const column of ["revenus", "budget", "depense", "recu"]) {
      expect(el.querySelector(`[data-cellkey="grand::${column}::0"]`)).toBeNull();
    }
  });

  it("déplie le poste de dépense et montre sa transaction", () => {
    expect(grille([`txn:${sortie.id}::depense::0`])).toContain("COURSES");
  });

  it("déplie le poste de revenu et montre sa transaction", () => {
    expect(grille([`txn:${recette.id}::recu::0`])).toContain("REEQUILIBRAGE");
  });

  it("déplie le groupe ET le poste d'une rémunération découpée", () => {
    const cases = caseDeLaTransaction(revenusAPostes, "VIREMENT INSTANTANE");
    expect(grille(cases, [revenusAPostes])).toContain("VIREMENT INSTANTANE");
  });

  it("désigne bien la case de la transaction, pas celle du total", () => {
    expect(caseDeLaTransaction(revenus, "REEQUILIBRAGE")).toEqual([`txn:${recette.id}::recu::0`]);
    expect(caseDeLaTransaction(revenusAPostes, "VIREMENT INSTANTANE")).toEqual([`txn:${recetteDePoste.id}::recu::0`]);
  });

  it("garde les montants à côté du nom et avant les transactions sur ordinateur", () => {
    const el = document.createElement("div");
    el.innerHTML = grille([`txn:${sortie.id}::depense::0`], [depenses]);
    const amount = el.querySelector('[data-cellkey="group:8::depense::0"]')!;
    const headingRow = amount.closest("tr")!;
    expect(headingRow.firstElementChild?.textContent).toContain("Courses");
    expect(headingRow.nextElementSibling?.hasAttribute("data-history-transaction")).toBe(true);
  });
});

describe("le relevé mobile conserve les montants et leurs références", () => {
  it.each([false, true])("affiche le retrait provisoire sous les non catégorisés (mobile : %s)", mobile => {
    const txn: HistoryTxn = { id: "pending-withdrawal", date: "", month: "2026-08", label: "RETRAIT CASH SERVICES", amount: -350, groupId: null, lineId: null, pending: true };
    const section: HistorySection = { kind: "uncategorized", uncatDirection: "out", rows: [], totals: [cell({ depense: 350, balance: -350 })], txns: [txn] };
    const el = document.createElement("div");
    el.innerHTML = grille([`txn:${txn.id}::depense::0`], [section], {
      solde: { ...solde, openings: [0], closings: [-350], pending: [0] },
      ...(mobile ? { mobile: { month: "2026-08", metric: null, onMonthChange: () => {} } } : {}),
    });
    const transaction = el.querySelector("[data-history-transaction]")!;
    expect(transaction.textContent).toContain("RETRAIT CASH SERVICES");
    expect(transaction.textContent).toContain("En attente");
    expect(transaction.textContent).toContain("350,00");
    expect(transaction.previousElementSibling?.textContent).toContain("Dépenses non catégorisées");
    expect(transaction.querySelectorAll("select")).toHaveLength(2);
    const month = transaction.querySelector<HTMLSelectElement>('select[aria-label="Mois où cette opération compte"]')!;
    expect(month.disabled).toBe(false);
    expect(month.value).toBe("2026-08");
    expect(month.textContent).not.toContain("sa date");
    expect(transaction.textContent).not.toContain("Commenter");
    expect(el.querySelector('[data-cellkey="bank-pending::solde::0"]')).toBeNull();
  });

  it("conserve l'écart bancaire dans les calculs sans afficher l'ancien bloc ni proposer de lien vers lui", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    const root = createRoot(container);
    const onSelect = vi.fn();
    try {
      await act(async () => root.render(elementGrille([], [], {
        onSelect,
        solde: { ...solde, openings: [-6.37], closings: [0.11], pending: [6.48] },
        planned: { ...planned, prevuClosings: [0.11], depassClosings: [0.11] },
      })));
      expect(container.textContent).not.toContain("Opérations bancaires en attente");
      expect(container.querySelector('[data-cellkey="opening::solde::0"]')?.textContent).toContain("6,37");
      for (const column of ["solde", "soldePrevu", "soldeDepass"]) {
        const closing = container.querySelector(`[data-cellkey="grand::${column}::0"]`)!;
        await act(async () => closing.querySelector<HTMLButtonElement>("button")!.click());
        const detail = onSelect.mock.calls.at(-1)![0];
        expect(detail.result).toBe(0.11);
        expect(detail.nodes.reduce((sum: number, node: DetailNode) => sum + node.amount, 0)).toBeCloseTo(0.11, 2);
        const nodes = flattenNodes(detail.nodes, tousLesChemins(detail.nodes));
        expect(nodes.some(({ node }) => node.ref?.startsWith("bank-pending::"))).toBe(false);
        if (column === "solde") expect(detail.nodes.map((node: DetailNode) => node.amount)).toEqual([-6.37, 6.48]);
      }
    } finally {
      await act(async () => root.unmount());
    }
  });

  it.each([
    { name: "enveloppe", sections: [depenses], title: "Courses", txn: sortie, total: "group:8::depense::0" },
    { name: "sous-poste", sections: [revenusAPostes], title: "Virements", txn: recetteDePoste, total: "subrow:91::recu::0" },
    { name: "non catégorisés", sections: [{ kind: "uncategorized", uncatDirection: "out", rows: [], totals: [cell({ depense: 12.5 })], txns: [{ ...sortie, groupId: null }] } as HistorySection], title: "Dépenses non catégorisées", txn: sortie, total: "section:uncategorized::depense::0" },
  ])("place les transactions juste sous le nom : $name", async ({ sections, title, txn, total }) => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      await act(async () => root.render(elementGrille([], sections, {
        mobile: { month: "2026-08", metric: null, onMonthChange: () => {} },
      })));
      // Le sous-poste demande d'abord l'ouverture de son enveloppe.
      if (title === "Virements") {
        await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Déplier le poste"]')!.click());
      }
      const heading = Array.from(container.querySelectorAll("td")).find(td => td.textContent?.includes(title) && td.querySelector('[aria-label="Déplier le poste"]'))!;
      await act(async () => heading.querySelector<HTMLButtonElement>("button")!.click());
      const headingRow = heading.closest("tr")!;
      expect(headingRow.nextElementSibling?.hasAttribute("data-history-transaction")).toBe(true);
      expect(headingRow.nextElementSibling?.textContent).toContain(txn.label);
      const amount = container.querySelector(`[data-cellkey="${total}"]`)!;
      expect(amount).not.toBeNull();
      expect(headingRow.nextElementSibling!.compareDocumentPosition(amount) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(container.querySelectorAll(`[data-cellkey="${total}"]`)).toHaveLength(1);
      await act(async () => heading.querySelector<HTMLButtonElement>("button")!.click());
      expect(container.querySelector("[data-history-transaction]")).toBeNull();
      expect(container.querySelector(`[data-cellkey="${total}"]`)).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
    }
  });

  const months = ["2026-08", "2026-09"];
  const expense: HistorySection = {
    ...depenses,
    rows: [row({ id: 8, name: "Courses", cells: [cell({ depense: 12.5 }), cell({ depense: 22.5 })], aliveMonths: [true, true], txns: [sortie] })],
    totals: [cell({ depense: 12.5 }), cell({ depense: 22.5 })],
  };
  const multiMonth = {
    months,
    grand: expense.totals,
    solde: { openings: [100, 87.5], closings: [87.5, 65], rowRunning: { 8: [87.5, 65] }, uncategorizedRunning: null },
    planned: { ...planned, prevuClosings: [100, 100], depassClosings: [87.5, 65] },
    overspend: [0, 0],
  };

  function documentMobile(metric: "dep" | null, selected: string[] = []) {
    const el = document.createElement("div");
    el.innerHTML = grille(selected, [expense], {
      ...multiMonth,
      mobile: { month: "2026-09", metric, onMonthChange: () => {} },
    });
    return el;
  }

  it("affiche septembre sans transformer ses références en celles d’août", () => {
    const el = documentMobile(null);
    expect(el.querySelector('[data-cellkey="group:8::depense::1"]')?.textContent).toContain("22,50");
    expect(el.querySelector('[data-cellkey="group:8::depense::0"]')).toBeNull();
    expect(el.querySelector('[data-cellkey="group:8::depense::1"]')?.textContent).toContain("Dépensé");
    expect(el.querySelector('[data-cellkey="grand::solde::1"]')).not.toBeNull();
  });

  it("compare les dépenses de chaque mois avec leurs propres références", () => {
    const el = documentMobile("dep");
    expect(el.querySelector('[data-cellkey="group:8::depense::0"]')?.textContent).toContain("12,50");
    expect(el.querySelector('[data-cellkey="group:8::depense::1"]')?.textContent).toContain("22,50");
    expect(el.querySelector('[data-cellkey="group:8::depense::0"]')?.textContent).toContain("Août 2026");
    expect(el.querySelector('[data-cellkey="group:8::depense::1"]')?.textContent).toContain("Septembre 2026");
    expect(el.querySelector('[data-cellkey="group:8::recu::1"]')).toBeNull();
  });

  it("ne montre pas les opérations d’août dans le relevé de septembre", () => {
    const el = documentMobile(null, [`txn:${sortie.id}::depense::0`]);
    expect(el.querySelector('[data-cellkey="txn:cpt-1::2026081200998877::depense::0"]')).toBeNull();
  });

  it("garde un poste terminé portant une opération dans le mois affiché", () => {
    const lateTxn = { ...sortie, id: "late", month: "2026-09", date: "2026-09-01" };
    const ended = { ...expense, rows: [{ ...expense.rows[0], aliveMonths: [true, false], txns: [lateTxn] }] };
    const html = grille(["txn:late::depense::1"], [ended], {
      ...multiMonth, mobile: { month: "2026-09", metric: null, onMonthChange: () => {} },
    });
    expect(html).toContain('data-cellkey="txn:late::depense::1"');
  });

  it("garde le mois futur dans la comparaison quand son indicateur est indisponible", () => {
    const html = grille([], [expense], {
      ...multiMonth, mobile: { month: "2026-09", metric: "soldeDepass", onMonthChange: () => {} },
    });
    expect(html).toContain('data-mobile-month="2026-09"');
    expect(html).toContain("Non applicable");
  });

  it("révèle une opération hors calcul désignée depuis son détail", () => {
    const html = grille([`txn:${sortie.id}::depense::0`], [], {
      ignoredBlocks: [{ direction: "out", txns: [sortie], totals: [cell({ depense: 12.5 })] }],
      mobile: { month: "2026-08", metric: null, onMonthChange: () => {} },
    });
    expect(html).toContain(`data-cellkey="txn:${sortie.id}::depense::0"`);
    const el = document.createElement("div");
    el.innerHTML = html;
    const transaction = el.querySelector("[data-history-transaction]")!;
    const amount = el.querySelector('[data-cellkey="section:ignored-out::depense::0"]')!;
    expect(transaction.previousElementSibling?.textContent).toContain("Non comptabilisées — Dépenses");
    expect(transaction.compareDocumentPosition(amount) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each(["section:expense::depense::0", "section:expense::budget::0", "estime::solde::0"])("révèle %s même hors indicateur comparé", (reference) => {
    const el = document.createElement("div");
    el.innerHTML = grille([reference], [expense], {
      ...multiMonth, mobile: { month: "2026-08", metric: "soldePrevu", onMonthChange: () => {} },
    });
    expect(el.querySelector(`[data-cellkey="${reference}"]`)).not.toBeNull();
  });

  it("retire un poste terminé sans opération même s’il était déplié le mois précédent", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const ended = { ...expense, rows: [{ ...expense.rows[0], aliveMonths: [true, false], cells: [cell({ depense: 12.5 }), cell()] }] };
    try {
      await act(async () => root.render(elementGrille([], [ended], { ...multiMonth, mobile: { month: "2026-08", metric: null, onMonthChange: () => {} } })));
      await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Déplier le poste"]')!.click());
      await act(async () => root.render(elementGrille([], [ended], { ...multiMonth, mobile: { month: "2026-09", metric: null, onMonthChange: () => {} } })));
      expect(container.textContent).not.toContain("Courses");
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("rouvre les dépenses repliées pour montrer l’opération désignée", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const mobile = { month: "2026-08", metric: null, onMonthChange: () => {} };
    try {
      await act(async () => root.render(elementGrille([], [depenses], { mobile })));
      const fold = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Ce qui sort")!;
      await act(async () => fold.click());
      await act(async () => root.render(elementGrille([`txn:${sortie.id}::depense::0`], [depenses], { mobile })));
      expect(container.querySelector(`[data-cellkey="txn:${sortie.id}::depense::0"]`)).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
