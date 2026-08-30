import { createElement, type ReactElement } from "react";
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

function clickCoursesSpentCell(
  onSelect: (detail: CellDetail) => void,
  onDetailOpened?: () => void,
) {
  const detail: CellDetail = { title: "Dépensé", subtitle: "Courses", nodes: [], result: 216.3 };
  const coursesSpentCell = `group:${DEMO_IDS.courses}::depense::1`;
  const cell = CellAmount({
    children: "216,30",
    detail,
    onSelect,
    cellKey: coursesSpentCell,
    onOnboardingSelect: onDetailOpened,
  });
  const tableCell = (cell.type as (props: unknown) => ReactElement<{ children: ReactElement<{ onClick: () => void }> }>)(cell.props);
  const button = tableCell.props.children;

  button.props.onClick();
}

it("clique Courses pour ouvrir d'abord le détail puis signaler le guide seulement en démo", () => {
  const calls: string[] = [];
  const onSelect = vi.fn(() => calls.push("detail"));
  const onDetailOpened = vi.fn(() => calls.push("tour"));

  clickCoursesSpentCell(onSelect, onDetailOpened);

  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ title: "Dépensé", subtitle: "Courses", cellRef: `group:${DEMO_IDS.courses}::depense::1` }));
  expect(onDetailOpened).toHaveBeenCalledOnce();
  expect(calls).toEqual(["detail", "tour"]);

  calls.length = 0;
  clickCoursesSpentCell(onSelect);

  expect(calls).toEqual(["detail"]);
});
