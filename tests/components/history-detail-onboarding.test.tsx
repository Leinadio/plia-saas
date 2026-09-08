// @vitest-environment jsdom

import { createElement, act } from "react";
import { createRoot } from "react-dom/client";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { HistoryDetailSidebar } from "../../src/components/history-detail-sidebar";
import { CellAmount } from "../../src/components/history-grid";
import { DEMO_IDS } from "../../src/lib/demo-finances";
import type { CellDetail } from "../../src/lib/history-explain";
import { SidebarProvider } from "../../src/components/ui/sidebar";

it("marque le contenu du panneau lorsque le détail est ouvert", () => {
  const html = renderToStaticMarkup(
    createElement(
      SidebarProvider,
      undefined,
      createElement(HistoryDetailSidebar, {
        detail: { title: "Dépensé", nodes: [], result: 42 },
        onClose: () => {},
      }),
    ),
  );

  expect(html).toContain('data-onboarding-target="amount-detail-panel"');
});

async function clickCoursesSpentCell(
  onSelect: (detail: CellDetail) => void,
  onDetailOpened?: () => void,
) {
  const detail: CellDetail = { title: "Dépensé", subtitle: "Courses", nodes: [], result: 216.3 };
  const coursesSpentCell = `group:${DEMO_IDS.courses}::depense::1`;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(createElement("table", undefined,
    createElement("tbody", undefined, createElement("tr", undefined,
      createElement(CellAmount, {
        detail, onSelect, cellKey: coursesSpentCell,
        onOnboardingSelect: onDetailOpened,
      }, "216,30"))),
  )));
  await act(async () => container.querySelector("button")!.click());
  await act(async () => root.unmount());
  container.remove();
}

it("clique Courses pour ouvrir d'abord le détail puis signaler le guide seulement en démo", async () => {
  const calls: string[] = [];
  const onSelect = vi.fn(() => calls.push("detail"));
  const onDetailOpened = vi.fn(() => calls.push("tour"));

  await clickCoursesSpentCell(onSelect, onDetailOpened);

  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ title: "Dépensé", subtitle: "Courses", cellRef: `group:${DEMO_IDS.courses}::depense::1` }));
  expect(onDetailOpened).toHaveBeenCalledOnce();
  expect(calls).toEqual(["detail", "tour"]);

  calls.length = 0;
  await clickCoursesSpentCell(onSelect);

  expect(calls).toEqual(["detail"]);
});
