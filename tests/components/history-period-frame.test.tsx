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

describe("la navigation sur téléphone", () => {
  let root: ReturnType<typeof createRoot>;
  let container: HTMLDivElement;
  const render = async (from = "2026-08", to = "2026-10") => {
    await act(async () => root.render(<HistoryPeriodFrame key={`${from}:${to}`} min="2026-06" max="2026-12" from={from} to={to} current="2026-09">
      <div data-history-table="">Tableau</div>
    </HistoryPeriodFrame>));
  };
  const button = (name: string) => Array.from(container.querySelectorAll("button"))
    .find(b => b.getAttribute("aria-label") === name || b.textContent?.trim() === name)!;
  const select = (name: string) => container.querySelector(`select[aria-label="${name}"]`) as HTMLSelectElement;
  const change = async (name: string, value: string) => {
    await act(async () => { const el = select(name); el.value = value; el.dispatchEvent(new Event("change", { bubbles: true })); });
  };
  beforeEach(() => {
    mocks.mobile = true;
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

  it("choisit le mois courant et change les mois chargés sans recharger", async () => {
    await render();
    expect(select("Mois affiché")?.value).toBe("2026-09");
    await act(async () => button("Mois suivant").click());
    expect(select("Mois affiché").value).toBe("2026-10");
    expect(container.querySelector("[data-history-table]")).not.toBeNull();
    expect(mocks.push).not.toHaveBeenCalled();
    await act(async () => button("Mois précédent").click());
    expect(select("Mois affiché").value).toBe("2026-09");
  });

  it("charge un mois hors période en conservant la plage et les autres paramètres", async () => {
    mocks.search = "from=2026-08&to=2026-10&account=cic";
    await render();
    await change("Mois affiché", "2026-12");
    const query = new URL(mocks.push.mock.calls[0][0], "http://localhost").searchParams;
    expect(Object.fromEntries(query)).toEqual({ from: "2026-08", to: "2026-12", account: "cic", mobileMonth: "2026-12",
      mobileIncomeMetric: "recu", mobileExpenseMetric: "dep", mobileBalanceMetric: "soldeReel" });
    expect(container.querySelector("[role=status]")?.textContent).toContain("Chargement");
    mocks.search = query.toString();
    await render("2026-08", "2026-12");
    expect(select("Mois affiché").value).toBe("2026-12");
    expect(button("Mois suivant").disabled).toBe(true);
  });

  it("conserve la comparaison après un changement de plage et le retour au mois", async () => {
    mocks.search = "mobileMetric=soldeDepass";
    await render();
    expect(button("Comparer")).toBeDefined();
    expect(button("Comparer").getAttribute("aria-pressed")).toBe("true");
    expect(select("Indicateur à comparer")).toBeNull();
    await act(async () => button("sept.").click());
    await act(async () => button("nov.").click());
    const query = new URL(mocks.push.mock.calls[0][0], "http://localhost").searchParams;
    expect(query.get("mobileMetric")).toBe("soldeDepass");
    mocks.search = query.toString();
    await render("2026-09", "2026-11");
    expect(button("Comparer").getAttribute("aria-pressed")).toBe("true");
    await act(async () => button("Par mois").click());
    expect(select("Mois affiché").value).toBe("2026-09");
    await act(async () => button("Comparer").click());
    expect(button("Comparer").getAttribute("aria-pressed")).toBe("true");
    expect(mocks.push).toHaveBeenCalledTimes(1);
  });

  it("prend le premier mois chargé si le mois courant est absent et respecte la borne basse", async () => {
    await render("2026-06", "2026-07");
    expect(select("Mois affiché")?.value).toBe("2026-06");
    expect(button("Mois précédent").disabled).toBe(true);
    expect(Array.from(select("Mois affiché").options, o => o.value)).toEqual([
      "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12",
    ]);
  });

  it("ignore une sélection mal formée dans le lien", async () => {
    mocks.search = "mobileMonth=2026-09-invalide&mobileMetric=inconnu";
    await render();
    expect(select("Mois affiché").value).toBe("2026-09");
  });
});
