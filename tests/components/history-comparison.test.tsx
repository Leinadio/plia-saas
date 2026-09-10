// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryGrid } from "@/components/history-grid";
import { HistoryPeriodFrame } from "@/components/history-period-frame";
import { useHistoryMobileNavigation } from "@/components/history-mobile-navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { buildDemoProjection } from "@/lib/demo-projection";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mocks = vi.hoisted(() => ({ search: "", push: vi.fn(), onSelect: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/app/historique",
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => true }));
const history = buildDemoProjection("2026-09", { transportBudget: 120, monoprixGroupId: null }).history;
function Grid() {
  const mobile = useHistoryMobileNavigation()!;
  return <HistoryGrid {...history} mobile={mobile} onSelect={mocks.onSelect} />;
}

describe("comparaison mobile par section", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  const render = async (from = "2026-08", to = "2026-11") => {
    await act(async () => root.render(<TooltipProvider><HistoryPeriodFrame key={`${from}:${to}`} min="2026-06" max="2026-12" from={from} to={to} current="2026-09">
      <Grid />
    </HistoryPeriodFrame></TooltipProvider>));
  };
  const button = (name: string) => Array.from(container.querySelectorAll("button")).find(el => el.getAttribute("aria-label") === name || el.textContent?.trim() === name)!;
  const select = (name: string) => container.querySelector<HTMLSelectElement>(`select[aria-label="${name}"]`)!;
  const choices = (name: string) => container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
  const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
  const chosen = (name: string) => choices(name).getAttribute("data-selected-metric");
  const change = async (name: string, value: string) => {
    if (name === "Mois affiché") {
      await act(async () => { select(name).value = value; select(name).dispatchEvent(new Event("change", { bubbles: true })); });
    } else {
      expect(choices(name)).not.toBeNull();
      await act(async () => choices(name).click());
      expect(dialog()).not.toBeNull();
      await act(async () => dialog().querySelector<HTMLButtonElement>(`button[value="${value}"]`)!.click());
      expect(dialog()).toBeNull();
    }
  };
  const card = (name: string) => container.querySelector(`[data-history-card="${name}"]`)!;
  beforeEach(() => {
    mocks.search = ""; mocks.push.mockClear(); mocks.onSelect.mockClear();
    HTMLElement.prototype.scrollIntoView = vi.fn();
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

  it("propose uniquement les indicateurs adaptés dans chaque bloc", async () => {
    await render();
    await act(async () => button("Comparer").click());
    expect(container.querySelector("[data-history-comparison] select")).toBeNull();
    expect(choices("Comparer les revenus")).not.toBeNull();
    expect(container.querySelector('.history-comparison-choices')).toBeNull();
    expect(dialog()).toBeNull();
    for (const [name, values] of [
      ["Comparer les revenus", ["budgetRem", "recu"]],
      ["Comparer les dépenses", ["budgetDep", "dep", "reste", "recu"]],
      ["Comparer les soldes", ["soldeReel", "soldePrevu", "soldeDepass"]],
    ] as const) {
      await act(async () => choices(name).click());
      expect(Array.from(dialog().querySelectorAll<HTMLButtonElement>("button[value]"), option => option.value)).toEqual(values);
      expect(dialog().querySelectorAll("[data-comparison-description]")).toHaveLength(values.length);
      expect(dialog().querySelector('[aria-pressed="true"]')).not.toBeNull();
      await act(async () => dialog().querySelector<HTMLButtonElement>('[aria-label="Fermer"]')!.click());
      expect(dialog()).toBeNull();
    }
    expect(card("income").contains(choices("Comparer les revenus"))).toBe(true);
    expect(card("expense").contains(choices("Comparer les dépenses"))).toBe(true);
    expect(card("income").querySelector('[data-mobile-column="recu"]')).not.toBeNull();
    expect(card("income").querySelector('[data-mobile-column="dep"]')).toBeNull();
    expect(card("opening").textContent).toContain("Argent de départ");
  });

  it("intègre le choix au titre et ferme le panneau sans changer les données", async () => {
    await render();
    await act(async () => button("Comparer").click());
    const heading = card("expense").querySelector('[data-history-band]')!;
    expect(heading.textContent).toContain("Ce qui sort");
    expect(heading.textContent).toContain("Dépensé");
    expect(heading.contains(choices("Comparer les dépenses"))).toBe(true);
    await act(async () => choices("Comparer les dépenses").click());
    await act(async () => dialog().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(dialog()).toBeNull();
    expect(chosen("Comparer les dépenses")).toBe("dep");
    expect(button("Ce qui sort").getAttribute("aria-expanded")).toBe("true");
    await change("Comparer les dépenses", "reste");
    expect(heading.textContent).toContain("Reste");
    expect(heading.textContent).not.toContain("Dépensé");
  });

  it("compare le budget sans masquer les revenus et conserve les calculs et les totaux", async () => {
    await render();
    await act(async () => button("Comparer").click());
    await change("Comparer les dépenses", "budgetDep");
    expect(chosen("Comparer les revenus")).toBe("recu");
    expect(card("income").querySelector('[data-mobile-column="recu"]')).not.toBeNull();
    expect(card("expense").querySelector('[data-cellkey="group:-20002::budget::1"]')?.textContent).toContain("350,00");
    await change("Comparer les revenus", "budgetRem");
    expect(chosen("Comparer les dépenses")).toBe("budgetDep");
    expect(card("income").querySelector('[data-mobile-column="budgetRem"]')).not.toBeNull();
    await act(async () => container.querySelector<HTMLButtonElement>('[data-cellkey="group:-20002::budget::1"] .history-mobile-number button')!.click());
    expect(mocks.onSelect.mock.calls.at(-1)?.[0].cellRef).toBe("group:-20002::budget::1");
    await act(async () => button("Ce qui sort").click());
    expect(card("expense").querySelector('[data-cellkey="group:-20002::budget::1"]')).toBeNull();
    expect(card("expense").querySelector('[data-history-total] [data-mobile-column="budgetDep"]')).not.toBeNull();
    expect(chosen("Comparer les dépenses")).toBe("budgetDep");
    await act(async () => button("Par mois").click());
    expect(choices("Comparer les revenus")).toBeNull();
    await act(async () => button("Comparer").click());
    expect(chosen("Comparer les revenus")).toBe("budgetRem");
    expect(chosen("Comparer les dépenses")).toBe("budgetDep");
  });

  it("conserve les trois choix après un changement de période", async () => {
    await render();
    await act(async () => button("Comparer").click());
    await change("Comparer les revenus", "budgetRem");
    await change("Comparer les dépenses", "reste");
    await change("Comparer les soldes", "soldeDepass");
    await act(async () => button("sept.").click());
    await act(async () => button("oct.").click());
    const query = new URL(mocks.push.mock.calls[0][0], "http://localhost").searchParams;
    expect(query.get("mobileIncomeMetric")).toBe("budgetRem");
    expect(query.get("mobileExpenseMetric")).toBe("reste");
    expect(query.get("mobileMetric")).toBe("soldeDepass");
    mocks.search = query.toString();
    await render("2026-09", "2026-10");
    expect(chosen("Comparer les revenus")).toBe("budgetRem");
    expect(chosen("Comparer les dépenses")).toBe("reste");
    expect(chosen("Comparer les soldes")).toBe("soldeDepass");
  });

  it("ouvre les anciens liens Budget avec des revenus comparables", async () => {
    mocks.search = "mobileMetric=budgetDep&mobileIncomeMetric=dep&mobileExpenseMetric=inconnu";
    await render();
    expect(choices("Comparer les revenus")).not.toBeNull();
    expect(chosen("Comparer les revenus")).toBe("recu");
    expect(chosen("Comparer les dépenses")).toBe("budgetDep");
    expect(card("income").textContent).not.toContain("Non applicable");
  });


  it("intègre l’estimation cliquable au seul mois courant, sans deuxième liste", async () => {
    await render();
    await act(async () => button("Comparer").click());
    expect(card("summary").querySelectorAll('[data-mobile-column]')).toHaveLength(4);
    const current = card("summary").querySelector('[data-cellkey="grand::solde::1"]')!;
    const estimate = current.querySelector('[data-cellkey="estime::solde::1"]');
    expect(estimate).not.toBeNull();
    expect(estimate!.textContent).toContain("Estimé fin de mois");
    expect(card("summary").querySelectorAll('[data-cellkey^="estime::"]')).toHaveLength(1);
    expect(estimate!.querySelector("button button")).toBeNull();
    await act(async () => estimate!.querySelector<HTMLButtonElement>("button")!.click());
    expect(mocks.onSelect.mock.calls.at(-1)?.[0].cellRef).toBe("estime::solde::1");
    expect(mocks.onSelect.mock.calls.at(-1)?.[0].result).toBe(history.forecast.currentEstimate);
    await change("Comparer les soldes", "soldePrevu");
    expect(card("summary").querySelector('[data-cellkey^="estime::"]')).toBeNull();
    expect(card("summary").querySelectorAll('[data-mobile-column]')).toHaveLength(4);
  });

  it("retrouve les indicateurs après avoir chargé un autre mois depuis Par mois", async () => {
    await render();
    await act(async () => button("Comparer").click());
    await change("Comparer les revenus", "budgetRem");
    await change("Comparer les dépenses", "reste");
    await change("Comparer les soldes", "soldeDepass");
    await act(async () => button("Par mois").click());
    await change("Mois affiché", "2026-12");
    const query = new URL(mocks.push.mock.calls[0][0], "http://localhost").searchParams;
    expect(query.has("mobileMetric")).toBe(false);
    mocks.search = query.toString();
    await render("2026-08", "2026-12");
    expect(select("Mois affiché").value).toBe("2026-12");
    await act(async () => button("Comparer").click());
    expect(chosen("Comparer les revenus")).toBe("budgetRem");
    expect(chosen("Comparer les dépenses")).toBe("reste");
    expect(chosen("Comparer les soldes")).toBe("soldeDepass");
  });
});
