// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({ push: vi.fn(), mobile: false, search: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/historique",
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mocks.mobile }));

const { HistoryPeriodFrame } = await import("@/components/history-period-frame");

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
beforeEach(() => { mocks.mobile = false; mocks.search = ""; mocks.push.mockClear(); });

describe("le chargement d'une nouvelle période", () => {
  it("remplace le tableau par son skeleton dès le second clic", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<HistoryPeriodFrame min="2026-06" max="2026-12" from="2026-08" to="2026-10" current="2026-08">
        <div data-history-table="">Ancien tableau</div>
      </HistoryPeriodFrame>);
    });

    const month = (label: string) => Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent?.trim() === label) as HTMLButtonElement;

    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Choisir la période"]')!.click());
    await act(async () => month("sept.").click());
    expect(container.querySelector("[data-history-table]")).not.toBeNull();

    await act(async () => month("nov.").click());
    expect(container.querySelector("[data-history-table]")).toBeNull();
    expect(container.querySelector("[data-history-table-skeleton]")).not.toBeNull();
    expect(container.textContent).toContain("sept. 2026");
    expect(container.textContent).toContain("nov. 2026");
    expect(mocks.push).toHaveBeenCalledWith("/app/historique?from=2026-09&to=2026-11");
    expect(Array.from(document.querySelectorAll("button")).every((button) => button.disabled)).toBe(true);

    await act(async () => root.unmount());
    container.remove();
  });
});

describe("la même période sur téléphone et ordinateur", () => {
  let root: ReturnType<typeof createRoot>;
  let container: HTMLDivElement;
  const button = (name: string) => Array.from(document.querySelectorAll("button"))
    .find(b => b.getAttribute("aria-label") === name || b.textContent?.trim() === name)!;
  beforeEach(() => {
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

  it.each([false, true])("conserve le compte et charge le même tableau (mobile : %s)", async (mobile) => {
    mocks.mobile = mobile;
    mocks.search = "account=cic&from=2026-08&to=2026-10&mobileMonth=2026-09&mobileMetric=soldeDepass&mobileIncomeMetric=recu&mobileExpenseMetric=dep&mobileBalanceMetric=soldeReel";
    await act(async () => root.render(<HistoryPeriodFrame min="2026-06" max="2026-12" from="2026-08" to="2026-10" current="2026-09">
      <div data-history-table="">Tableau</div>
    </HistoryPeriodFrame>));
    expect(container.querySelector('select[aria-label="Mois affiché"]')).toBeNull();
    expect(button("Comparer")).toBeUndefined();
    expect(container.querySelector("[data-history-table]")).not.toBeNull();
    await act(async () => button("Choisir la période").click());
    await act(async () => button("sept.").click());
    await act(async () => button("nov.").click());
    const query = new URL(mocks.push.mock.calls[0][0], "http://localhost").searchParams;
    expect(Object.fromEntries(query)).toEqual({ account: "cic", from: "2026-09", to: "2026-11" });
    expect(container.querySelector("[data-history-table]")).toBeNull();
    expect(container.querySelector("[data-history-table-skeleton]")).not.toBeNull();
    expect(container.querySelector("[role=status]")?.textContent).toContain("Chargement du relevé");
  });
});
