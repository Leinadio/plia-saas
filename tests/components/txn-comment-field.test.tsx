// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TxnCommentField } from "@/components/txn-comment-field";
import { AccountNameForm } from "@/components/account-name-form";
import { FilDAttente, MiseAJourProvider } from "@/components/mise-a-jour";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const effects = vi.hoisted(() => ({ refresh: vi.fn(), setComment: vi.fn(), updateUser: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: effects.refresh }) }));
vi.mock("@/app/app/transactions/actions", () => ({ setComment: effects.setComment }));
vi.mock("@/lib/auth-client", () => ({ authClient: { updateUser: effects.updateUser } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function saisir(value: string) {
  const input = container.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  return input;
}

const renderComment = (comment: string | null) => root.render(<MiseAJourProvider>
  <FilDAttente />
  <TxnCommentField txnId="transaction" comment={comment} />
</MiseAJourProvider>);

it.each(["Enter", "blur"])("enregistre le commentaire (%s) sans recharger une deuxième fois le budget", async (validation) => {
  let finish!: () => void;
  effects.setComment.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
  await act(async () => renderComment("À vérifier"));
  await act(async () => container.querySelector<HTMLButtonElement>("button")!.click());
  const input = await saisir("Remboursé");
  await act(async () => {
    if (validation === "Enter") input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    else input.blur();
  });
  expect(effects.setComment).toHaveBeenCalledExactlyOnceWith("transaction", "Remboursé");
  expect(container.querySelector("button")!.disabled).toBe(true);
  expect(container.querySelector('[role="progressbar"]')!.getAttribute("aria-hidden")).toBe("false");

  // L'action revalide déjà les pages et apporte le commentaire enregistré.
  await act(async () => { renderComment("Remboursé"); finish(); });
  expect(container.querySelector("button")!.textContent).toBe("Remboursé");
  expect(container.querySelector("button")!.disabled).toBe(false);
  expect(container.querySelector('[role="progressbar"]')!.getAttribute("aria-hidden")).toBe("true");
  expect(effects.refresh).not.toHaveBeenCalled();
});

it.each(["Escape", "inchangé"])("évite toute écriture pour un commentaire %s", async (validation) => {
  await act(async () => renderComment("À vérifier"));
  await act(async () => container.querySelector<HTMLButtonElement>("button")!.click());
  const input = await saisir(validation === "Escape" ? "Abandonné" : "À vérifier");
  await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", {
    key: validation === "Escape" ? "Escape" : "Enter", bubbles: true,
  })));
  expect(container.querySelector("button")!.textContent).toBe("À vérifier");
  expect(effects.setComment).not.toHaveBeenCalled();
  expect(effects.refresh).not.toHaveBeenCalled();
});

it("rafraîchit toujours le nom du profil après une modification par l'API d'authentification", async () => {
  let finish!: () => void;
  effects.updateUser.mockReturnValue(new Promise(resolve => { finish = () => resolve({ data: {}, error: null }); }));
  await act(async () => root.render(<MiseAJourProvider><AccountNameForm nom="Daniel" /></MiseAJourProvider>));
  await saisir("Dan");
  await act(async () => container.querySelector<HTMLButtonElement>("button")!.click());
  expect(effects.updateUser).toHaveBeenCalledExactlyOnceWith({ name: "Dan" });
  expect(effects.refresh).not.toHaveBeenCalled();
  await act(async () => finish());
  expect(effects.refresh).toHaveBeenCalledTimes(1);
  expect(container.querySelector("button")!.disabled).toBe(false);
});
