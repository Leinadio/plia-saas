// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
vi.mock("@/components/mise-a-jour", () => ({
  useMiseAJour: () => ({ pendant: vi.fn(), enCours: false }),
}));
vi.mock("@/app/app/notifications-actions", () => ({
  dismissNotification: vi.fn(),
  restoreNotifications: vi.fn(),
}));
import { AutomationNotice } from "@/components/automation-notice";
it("ferme le panneau lors de la navigation vers les transactions", async () => {
  const el = document.createElement("div");
  document.body.append(el);
  const root = createRoot(el);
  const onNavigate = vi.fn();
  await act(() =>
    root.render(
      createElement(AutomationNotice, {
        notice: {
          id: "a::auto::1",
          kind: "automation",
          label: "CARREFOUR",
          accountName: "Courant",
          amount: -42,
          name: "Courses",
          month: "2026-09",
          seen: false,
          ruleLabel: "Carrefour",
          date: "2026-09-17",
          transactionId: "t",
        },
        onDone: vi.fn(),
        onRestore: vi.fn(),
        onNavigate,
      }),
    ),
  );
  const link = el.querySelector("a")!;
  link.addEventListener("click", (event) => event.preventDefault());
  await act(() => link.click());
  expect(onNavigate).toHaveBeenCalledOnce();
  expect(link.getAttribute("href")).toBe("/app/transactions");
  await act(() => root.unmount());
  el.remove();
});
