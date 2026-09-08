// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { DetailSidebarProvider } from "@/components/detail-sidebar";
import { HistoryWithDetail } from "@/components/history-with-detail";
import { buildDemoProjection } from "@/lib/demo-projection";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => true }));
const captures = vi.hoisted(() => [] as { first: string; selected: string[] | null }[]);
vi.mock("@/components/history-grid", () => ({ HistoryGrid: (props: {
  months: string[]; selected: string[] | null; onSelect: (detail: unknown) => void;
}) => {
  captures.push({ first: props.months[0], selected: props.selected });
  return <button onClick={() => props.onSelect({ title: "Calcul", result: 42, cellRef: "group:7::solde::1",
    nodes: [{ label: "Montant lié", amount: 42, ref: "group:8::solde::1" }] })}>Ouvrir le calcul</button>;
} }));

it("ne transmet jamais une ancienne référence au relevé d’une nouvelle période", async () => {
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const initial = buildDemoProjection("2026-09", { transportBudget: 120, monoprixGroupId: null }).history;
  const render = async (months: string[]) => {
    await act(async () => root.render(<DetailSidebarProvider>
      <HistoryWithDetail key={months.join()} {...initial} months={months} />
    </DetailSidebarProvider>));
  };
  try {
    await render(initial.months);
    await act(async () => Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Ouvrir le calcul")!.click());
    const linked = Array.from(document.querySelectorAll("tr")).find(row => row.textContent?.includes("Montant lié"))!;
    await act(async () => linked.click());
    expect(captures.at(-1)?.selected).toEqual(["group:8::solde::1"]);
    captures.length = 0;
    await render(["2026-06", "2026-07", ...initial.months]);
    expect(captures.length).toBeGreaterThan(0);
    expect(captures.every(props => props.selected === null)).toBe(true);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
