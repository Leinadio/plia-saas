// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HistoryWithDetail } from "@/components/history-with-detail";
import { buildDemoProjection } from "@/lib/demo-projection";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mocks = vi.hoisted(() => ({ mobile: false, setDetail: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mocks.mobile }));
vi.mock("@/components/detail-sidebar", () => ({ useDetailSidebar: () => ({
  setDetail: mocks.setDetail, selected: null, anchor: null, selectionScope: null,
}) }));
const history = buildDemoProjection("2026-09", { transportBudget: 120, monoprixGroupId: null }).history;

describe("le même relevé sur téléphone et ordinateur", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  const render = async (mobile: boolean) => {
    mocks.mobile = mobile;
    await act(async () => root.render(<TooltipProvider>
      <HistoryWithDetail key={String(mobile)} {...history} />
    </TooltipProvider>));
  };
  beforeEach(() => {
    mocks.setDetail.mockClear();
    HTMLElement.prototype.scrollIntoView = vi.fn();
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

  it("garde toutes les colonnes, les mois et les montants en passant au téléphone", async () => {
    const cells = () => Array.from(container.querySelectorAll("[data-cellkey]"), cell => [cell.getAttribute("data-cellkey"), cell.textContent]);
    const headings = () => Array.from(container.querySelectorAll("thead th"), cell => cell.textContent);
    await render(false);
    const desktopCells = cells();
    const desktopHeadings = headings();
    expect(desktopCells.length).toBeGreaterThan(0);
    expect(desktopHeadings.length).toBeGreaterThan(0);
    await render(true);
    expect(container.querySelector("[data-history-mobile]")).toBeNull();
    expect(container.querySelector('select[aria-label="Mois affiché"]')).toBeNull();
    expect(headings()).toEqual(desktopHeadings);
    expect(cells()).toEqual(desktopCells);
  });

  it("ouvre le calcul d’un montant du tableau sur téléphone", async () => {
    await render(true);
    const cellKey = "group:-20002::budget::1";
    const amount = container.querySelector<HTMLButtonElement>(`[data-cellkey="${cellKey}"] button[draggable]`)!;
    expect(amount).not.toBeNull();
    await act(async () => amount.click());
    expect(mocks.setDetail).toHaveBeenLastCalledWith(expect.objectContaining({ cellRef: cellKey, result: 350 }),
      `${history.accountId}:${history.months.join(",")}`);
  });
});
