// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeAll, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/historique",
  useRouter: () => ({ push: mocks.push }),
}));

const { HistoryPeriodFrame } = await import("@/components/history-period-frame");

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe("le chargement d'une nouvelle période", () => {
  it("remplace le tableau par son skeleton dès le second clic", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(
        HistoryPeriodFrame,
        { min: "2026-06", max: "2026-12", from: "2026-08", to: "2026-10", current: "2026-08" },
        createElement("div", { "data-history-table": "" }, "Ancien tableau"),
      ));
    });

    const month = (label: string) => Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.trim() === label) as HTMLButtonElement;

    await act(async () => month("sept.").click());
    expect(container.querySelector("[data-history-table]")).not.toBeNull();

    await act(async () => month("nov.").click());
    expect(container.querySelector("[data-history-table]")).toBeNull();
    expect(container.querySelector("[data-history-table-skeleton]")).not.toBeNull();
    expect(container.textContent).toContain("sept. 2026");
    expect(container.textContent).toContain("nov. 2026");
    expect(mocks.push).toHaveBeenCalledWith("/app/historique?from=2026-09&to=2026-11");
    expect(Array.from(container.querySelectorAll("button")).every((button) => button.disabled)).toBe(true);

    await act(async () => root.unmount());
    container.remove();
  });
});
