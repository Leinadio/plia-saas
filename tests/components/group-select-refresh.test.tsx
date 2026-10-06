// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { GroupSelectField } from "@/components/group-select-field";
import { FilDAttente, MiseAJourProvider } from "@/components/mise-a-jour";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const effects = vi.hoisted(() => ({ refresh: vi.fn(), setGroup: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: effects.refresh }) }));
vi.mock("@/app/app/transactions/actions", () => ({ setGroup: effects.setGroup }));

it("attend le classement puis utilise le rendu de l’action sans second chargement", async () => {
  let finish!: () => void;
  effects.setGroup.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const render = (groupId: number | null) => root.render(<MiseAJourProvider>
    <FilDAttente />
    <GroupSelectField txnId="transaction" montant={-25}
      groups={[{ id: 1, name: "Courses", direction: "out", lines: [] }]}
      defaultGroupId={groupId} defaultLineId={null} />
  </MiseAJourProvider>);
  try {
    await act(async () => render(null));
    const select = container.querySelector("select")!;
    await act(async () => {
      select.value = "g:1";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(select.value).toBe("g:1");
    expect(select.disabled).toBe(true);
    expect(container.querySelector('[role="progressbar"]')?.getAttribute("aria-hidden")).toBe("false");
    expect(effects.setGroup).toHaveBeenCalledExactlyOnceWith("transaction", 1, null);

    // La réponse de l’action apporte les nouvelles données à la page.
    await act(async () => { finish(); });
    await act(async () => render(1));
    expect(select.value).toBe("g:1");
    expect(select.disabled).toBe(false);
    expect(container.querySelector('[role="progressbar"]')?.getAttribute("aria-hidden")).toBe("true");
    expect(effects.refresh).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
