// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const api = vi.hoisted(() => ({
  save: vi.fn(),
  preview: vi.fn(),
  apply: vi.fn(),
  toggle: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("../../src/app/app/automatisations/actions", () => ({
  saveAutomationRule: api.save,
  previewAutomationRule: api.preview,
  applyAutomationPreview: api.apply,
  toggleAutomationRule: api.toggle,
  removeAutomationRule: api.remove,
}));
import { AutomationPanel } from "../../src/components/automation-panel";
const rule = {
  id: 1,
  revision: 1,
  enabled: true,
  accountId: "a",
  label: "Carrefour",
  direction: "out" as const,
  minAmount: null,
  maxAmount: null,
  groupId: 1,
  lineId: null,
};
let root: Root;
let el: HTMLDivElement;
afterEach(async () => {
  if (root) await act(() => root.unmount());
  el?.remove();
  vi.clearAllMocks();
});
async function mount(demo = false) {
  el = document.createElement("div");
  document.body.append(el);
  root = createRoot(el);
  await act(() =>
    root.render(
      createElement(AutomationPanel, {
        accounts: [{ id: "a", name: "Courant" }],
        groups: [
          {
            id: 1,
            accountId: "a",
            name: "Courses",
            direction: "out",
            monthlyAmount: 100,
            startMonth: null,
            endMonth: null,
            planned: true,
            lines: [],
          },
        ],
        initialRules: [rule],
        demo,
      }),
    ),
  );
}
async function click(label: string) {
  const b = [...el.querySelectorAll("button")].find((b) =>
    b.textContent?.includes(label),
  );
  expect(b).toBeTruthy();
  await act(() => b!.click());
}
it("affiche un aperçu sans rattacher avant le clic explicite", async () => {
  api.preview.mockResolvedValue({
    ok: true,
    data: {
      revision: 1,
      hasMore: false,
      transactions: [
        {
          id: "t",
          label: "CARREFOUR",
          amount: -42,
          date: "2026-09-17",
          budgetMonth: null,
          accountId: "a",
        },
      ],
    },
  });
  api.apply.mockResolvedValue({ ok: true, data: 1 });
  await mount();
  await click("Voir les correspondances");
  expect(api.apply).not.toHaveBeenCalled();
  expect(el.textContent).toContain("42,00");
  await click("Rattacher 1 transaction");
  expect(api.apply).toHaveBeenCalledWith(1, 1, ["t"]);
  expect(el.textContent).toContain("1 transaction rattachée");
});
it("garde l’aperçu et affiche une erreur si l’application échoue", async () => {
  api.preview.mockResolvedValue({
    ok: true,
    data: {
      revision: 1,
      hasMore: false,
      transactions: [
        {
          id: "t",
          label: "CARREFOUR",
          amount: -42,
          date: "2026-09-17",
          budgetMonth: null,
          accountId: "a",
        },
      ],
    },
  });
  api.apply.mockResolvedValue({ ok: false, error: "Relancez l’aperçu." });
  await mount();
  await click("Voir les correspondances");
  await click("Rattacher 1 transaction");
  expect(el.querySelector('[role="alert"]')?.textContent).toContain("Relancez");
  expect(el.textContent).toContain("CARREFOUR");
});
it("demande une confirmation locale avant de supprimer", async () => {
  api.remove.mockResolvedValue({ ok: true });
  await mount();
  await click("Supprimer");
  expect(api.remove).not.toHaveBeenCalled();
  await click("Confirmer la suppression");
  expect(api.remove).toHaveBeenCalledWith(1);
});
it("la démonstration ne propose pas de mutation", async () => {
  await mount(true);
  expect(el.textContent).toContain("démonstration");
  expect(
    [...el.querySelectorAll("button")].some(
      (b) => b.textContent?.includes("Nouvelle règle") && !b.disabled,
    ),
  ).toBe(false);
});
