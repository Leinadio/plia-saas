// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HistoryWithDetail } from "@/components/history-with-detail";
import { buildDemoProjection } from "@/lib/demo-projection";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const actions = vi.hoisted(() => ({ createGroup: vi.fn() }));
vi.mock("@/app/app/historique/actions", () => actions);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/components/detail-sidebar", () => ({
  useDetailSidebar: () => ({
    setDetail: vi.fn(),
    selected: null,
    anchor: null,
    selectionScope: null,
  }),
}));
vi.mock("@/components/history-grid", () => ({
  HistoryGrid: () => (
    <div>
      <h2>Ce qui rentre</h2>
      <h2>Ce qui sort</h2>
    </div>
  ),
}));
const history = buildDemoProjection("2026-09", {
  transportBudget: 120,
  monoprixGroupId: null,
}).history;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const button = (text: string) =>
  Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  )!;
const render = (
  overrides: Partial<React.ComponentProps<typeof HistoryWithDetail>> = {},
) =>
  act(async () => {
    root.render(
      <HistoryWithDetail
        {...history}
        groups={[]}
        sections={[]}
        {...overrides}
      />,
    );
  });
beforeEach(() => {
  vi.clearAllMocks();
  actions.createGroup.mockResolvedValue(123);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

it("remplace les deux sections par une invitation sans masquer l’accès aux opérations", async () => {
  await render();
  expect(container.textContent).not.toContain("Ce qui rentre");
  expect(container.textContent).not.toContain("Ce qui sort");
  expect(button("Créer mon premier budget")).toBeDefined();
  expect(container.querySelector('a[href="/app/transactions"]')).not.toBeNull();
  expect(container.textContent).toContain("Trésorerie actuelle");
});

it("conserve le tableau si un budget existe, même sans ligne dans la période affichée", async () => {
  await render({ groups: history.groups, sections: [] });
  expect(container.textContent).toContain("Ce qui rentre");
  expect(container.textContent).toContain("Ce qui sort");
  expect(button("Créer mon premier budget")).toBeUndefined();
});

it("préremplit une idée sans rien créer avant validation, puis crée sur le bon compte et mois", async () => {
  await render({ months: ["2026-11"], accountId: "compte-vide" });
  await act(async () => button("Un voyage").click());
  const form = container.querySelector("form")!;
  expect(form.querySelector<HTMLInputElement>('[name="name"]')!.value).toBe(
    "Vacances",
  );
  expect(actions.createGroup).not.toHaveBeenCalled();
  await act(async () => {
    const input = form.querySelector<HTMLInputElement>('[name="amount"]')!;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, "250");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  expect(actions.createGroup).toHaveBeenCalledWith(
    expect.objectContaining({
      accountId: "compte-vide",
      name: "Vacances",
      amount: 250,
      direction: "out",
      startMonth: "2026-11",
    }),
  );
  await render({ groups: history.groups, sections: history.sections });
  expect(container.textContent).toContain("Ce qui sort");
  expect(button("Créer mon premier budget")).toBeUndefined();
});

it("permet de commencer par un revenu et annule le brouillon quand le compte change", async () => {
  await render();
  await act(async () => button("Commencer par un revenu").click());
  expect(
    container.querySelector('input[placeholder="Ex: Salaire"]'),
  ).not.toBeNull();
  await render({ accountId: "autre-compte" });
  expect(container.querySelector("form")).toBeNull();
  expect(actions.createGroup).not.toHaveBeenCalled();
});
