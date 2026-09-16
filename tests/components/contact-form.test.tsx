// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { ContactForm } from "@/components/contact-form";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => vi.unstubAllGlobals());
async function mount() {
  const node = document.createElement("div");
  document.body.append(node);
  const root = createRoot(node);
  await act(async () =>
    root.render(
      createElement(ContactForm, {
        initialEmail: "camille@example.fr",
        source: "application",
        available: true,
      }),
    ),
  );
  const message = node.querySelector("textarea")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(message, "Je souhaite comprendre mon budget.");
    message.dispatchEvent(new Event("input", { bubbles: true }));
  });
  return {
    node,
    cleanup: async () => {
      await act(async () => root.unmount());
      node.remove();
    },
  };
}
it("préremplit l’adresse et confirme uniquement après une réponse réussie", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
  vi.stubGlobal("fetch", fetcher);
  const view = await mount();
  try {
    expect(
      view.node.querySelector<HTMLInputElement>('input[type="email"]')?.value,
    ).toBe("camille@example.fr");
    await act(async () =>
      view.node
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({
      email: "camille@example.fr",
      message: "Je souhaite comprendre mon budget.",
      source: "application",
    });
    expect(view.node.textContent).toContain("Votre message a bien été envoyé");
    expect(document.activeElement?.textContent).toContain(
      "Votre message a bien été envoyé",
    );
  } finally {
    await view.cleanup();
  }
});
it("conserve le message en cas d’erreur et permet de réessayer", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: "L’envoi est momentanément indisponible." }),
          { status: 503 },
        ),
      ),
  );
  const view = await mount();
  try {
    await act(async () =>
      view.node
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(view.node.querySelector("textarea")?.value).toBe(
      "Je souhaite comprendre mon budget.",
    );
    expect(view.node.querySelector('[role="alert"]')?.textContent).toContain(
      "indisponible",
    );
    expect(view.node.textContent).not.toContain(
      "Votre message a bien été envoyé",
    );
  } finally {
    await view.cleanup();
  }
});
it("désactive l’envoi tant que le service n’est pas configuré", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const node = document.createElement("div");
  const root = createRoot(node);
  try {
    await act(async () =>
      root.render(
        createElement(ContactForm, { source: "landing", available: false }),
      ),
    );
    expect(node.querySelector("fieldset")?.disabled).toBe(true);
    expect(node.textContent).toContain("en cours d’activation");
    await act(async () =>
      node
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(fetcher).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});
