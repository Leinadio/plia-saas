// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryGrid } from "@/components/history-grid";
import { TooltipProvider } from "@/components/ui/tooltip";
import { buildDemoProjection } from "@/lib/demo-projection";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const actions = vi.hoisted(() => ({ createGroup: vi.fn(), addGroupLine: vi.fn(), renameGroupAction: vi.fn(), editGroupLine: vi.fn() }));
vi.mock("@/app/app/historique/actions", () => ({ ...actions }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), usePathname: () => "/app/historique", useSearchParams: () => new URLSearchParams() }));
const history = buildDemoProjection("2026-09", { transportBudget: 120, monoprixGroupId: null }).history;
const expense = history.sections.find(s => s.kind === "expense")!.rows[0];
expense.subRows = [{ id: -90001, name: "Sous-enveloppe test", cells: expense.cells, aliveMonths: [true, true, true, true], txns: [] }];
history.groups.find(g => g.id === expense.id)!.lines.push({ id: -90001, name: "Sous-enveloppe test", amount: 20, changes: [] });

describe("actions du relevé sur mobile", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  const onSelect = vi.fn();
  const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
  const button = (scope: ParentNode, name: string) => Array.from(scope.querySelectorAll<HTMLButtonElement>("button")).find(b => b.getAttribute("aria-label") === name || b.textContent?.trim() === name)!;
  const click = async (b: HTMLElement) => act(async () => b.click());
  const fill = async (input: HTMLInputElement, value: string) => act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const render = async (mode: "month" | "compare" | "desktop" = "month", accountId = history.accountId) => act(async () => root.render(<TooltipProvider>
    <HistoryGrid {...history} accountId={accountId} onSelect={onSelect} mobile={mode === "desktop" ? undefined : {
      month: "2026-10", metric: mode === "compare" ? "soldeReel" : null, onMonthChange: vi.fn(),
      comparison: { metrics: { income: "recu", expense: "dep", balance: "soldeReel" }, onChange: vi.fn() },
    }} />
  </TooltipProvider>));
  beforeEach(() => {
    vi.clearAllMocks(); actions.createGroup.mockResolvedValue(1); actions.addGroupLine.mockResolvedValue(2);
    actions.renameGroupAction.mockResolvedValue(undefined); actions.editGroupLine.mockResolvedValue(undefined);
    HTMLElement.prototype.scrollIntoView = vi.fn();
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

  it.each([ ["month", "Revenu", "in"], ["month", "Dépense", "out"], ["compare", "Revenu", "in"], ["compare", "Dépense", "out"] ] as const)("crée un %s %s depuis le panneau avec le mois consulté", async (mode, name, direction) => {
    await render(mode);
    await click(button(container, name));
    expect(dialog()).not.toBeNull();
    expect(container.querySelector("form")).toBeNull();
    const form = dialog()!.querySelector("form")!;
    await fill(form.querySelector('[name="name"]')!, "Nouvelle enveloppe");
    await fill(form.querySelector('[name="amount"]')!, "42");
    await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(actions.createGroup).toHaveBeenCalledWith(expect.objectContaining({ name: "Nouvelle enveloppe", amount: 42, direction, startMonth: "2026-10", accountId: history.accountId }));
    expect(dialog()).toBeNull();
  });

  it("ajoute une sous-enveloppe au bon parent sans déplier celui-ci", async () => {
    await render();
    const heading = container.querySelector(`[data-cellkey="group:${expense.id}::depense::2"]`)!.closest("tr")!;
    await click(button(heading, "Ajouter un sous-poste"));
    expect(dialog()).not.toBeNull();
    expect(dialog()!.textContent).toContain(expense.name);
    expect(button(heading, "Déplier le poste").getAttribute("aria-expanded")).toBe("false");
    const form = dialog()!.querySelector("form")!;
    await fill(form.querySelector('[name="name"]')!, "Sous-enveloppe créée");
    await fill(form.querySelector('[name="amount"]')!, "18");
    await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(actions.addGroupLine).toHaveBeenCalledWith(expense.id, "Sous-enveloppe créée", 18, "2026-10", "from", "2026-10");
    expect(dialog()).toBeNull();
  });

  it("gère une enveloppe et sa sous-enveloppe dans le panneau sans ouvrir le détail", async () => {
    await render();
    const heading = container.querySelector(`[data-cellkey="group:${expense.id}::depense::2"]`)!.closest("tr")!;
    await click(button(heading, "Gérer le groupe"));
    expect(dialog()).not.toBeNull(); expect(onSelect).not.toHaveBeenCalled();
    await fill(dialog()!.querySelector("input")!, "Nom modifié");
    await click(button(dialog()!, "Renommer"));
    expect(actions.renameGroupAction).toHaveBeenCalledWith(expense.id, "Nom modifié");
    await click(button(dialog()!, "Fermer"));
    await click(button(heading, "Déplier le poste"));
    await click(button(container, "Gérer la ligne"));
    expect(dialog()!.textContent).toContain("Sous-enveloppe test");
    await fill(dialog()!.querySelector("input")!, "Ligne modifiée");
    await click(button(dialog()!, "Enregistrer"));
    expect(actions.editGroupLine).toHaveBeenCalledWith(-90001, "Ligne modifiée");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("ferme le formulaire si le compte change pour éviter une écriture sur le mauvais relevé", async () => {
    await render(); await click(button(container, "Dépense"));
    expect(dialog()).not.toBeNull();
    await render("month", "autre-compte");
    expect(dialog()).toBeNull();
    expect(actions.createGroup).not.toHaveBeenCalled();
  });

  it("annule un ajout sans écrire et conserve les formulaires sur ordinateur", async () => {
    await render(); await click(button(container, "Dépense"));
    expect(dialog()).not.toBeNull(); await click(button(dialog()!, "Annuler"));
    expect(dialog()).toBeNull(); expect(actions.createGroup).not.toHaveBeenCalled();
    await render("desktop"); await click(button(container, "Dépense"));
    expect(dialog()).toBeNull(); expect(container.querySelector("form")).not.toBeNull();
    await click(button(container, "Gérer le groupe"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ groupManage: expect.any(Object) }));
  });
});
