// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConnexionForm } from "@/components/connexion-form";

const mocks = vi.hoisted(() => ({
  social: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/lib/auth-client", () => ({
  signIn: { social: mocks.social, email: mocks.login },
  signUp: { email: mocks.signup },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let node: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.resetAllMocks();
  node = document.createElement("div");
  document.body.append(node);
  root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount());
  node.remove();
});
async function mount(googleAvailable = true, initialError = "") {
  await act(async () =>
    root.render(
      createElement(ConnexionForm, { googleAvailable, initialError }),
    ),
  );
}
function button(text: string) {
  return Array.from(node.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  )!;
}

it("ouvre Google sans exiger les champs e-mail et mot de passe", async () => {
  mocks.social.mockResolvedValue({
    data: { url: "https://accounts.google.com", redirect: true },
    error: null,
  });
  await mount();
  await act(async () => button("Continuer avec Google").click());
  expect(mocks.social).toHaveBeenCalledWith({
    provider: "google",
    callbackURL: "/app",
    errorCallbackURL: "/connexion",
  });
  expect(mocks.login).not.toHaveBeenCalled();
  expect(button("Redirection vers Google").disabled).toBe(true);
});

it("propose le même parcours pour l’inscription", async () => {
  await mount();
  await act(async () => button("Créer un compte").click());
  expect(node.querySelector("h1")?.textContent).toBe("Crée ton compte");
  expect(button("Continuer avec Google")).toBeDefined();
});

it("empêche les doubles clics et les envois concurrents", async () => {
  mocks.social.mockReturnValue(new Promise(() => {}));
  await mount();
  await act(async () => {
    button("Continuer avec Google").click();
    button("Continuer avec Google").click();
  });
  expect(mocks.social).toHaveBeenCalledTimes(1);
  expect(button("Se connecter").disabled).toBe(true);
  expect(button("Créer un compte").disabled).toBe(true);
});

it("permet de relancer Google après un retour arrière du navigateur", async () => {
  mocks.social.mockResolvedValue({ data: { url: "https://accounts.google.com", redirect: true }, error: null });
  await mount();
  await act(async () => button("Continuer avec Google").click());
  expect(button("Redirection vers Google").disabled).toBe(true);
  await act(async () => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  expect(button("Continuer avec Google").disabled).toBe(false);
});

it.each(["provider", "network"])(
  "rend une erreur %s compréhensible et permet de réessayer",
  async (kind) => {
    if (kind === "provider")
      mocks.social.mockResolvedValue({
        error: { message: "private provider detail" },
      });
    else mocks.social.mockRejectedValue(new Error("network private detail"));
    await mount();
    await act(async () => button("Continuer avec Google").click());
    expect(node.querySelector('[role="alert"]')?.textContent).toContain(
      "réessayer",
    );
    expect(node.textContent).not.toContain("private");
    expect(button("Continuer avec Google").disabled).toBe(false);
    expect(document.activeElement).toBe(node.querySelector('[role="alert"]'));
  },
);

it("explique l’indisponibilité de Google et laisse l’e-mail accessible", async () => {
  await mount(false);
  expect(button("Continuer avec Google").disabled).toBe(true);
  expect(node.textContent).toContain("Google sera bientôt disponible");
  expect(button("Se connecter").disabled).toBe(false);
});

it("affiche l’erreur de retour et garde la connexion par e-mail", async () => {
  mocks.login.mockResolvedValue({ error: null });
  await mount(true, "La connexion Google a été annulée. Tu peux réessayer.");
  expect(node.querySelector('[role="alert"]')?.textContent).toContain(
    "annulée",
  );
  await act(async () =>
    node
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(mocks.login).toHaveBeenCalledTimes(1);
  expect(mocks.push).toHaveBeenCalledWith("/app");
});
