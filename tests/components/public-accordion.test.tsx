// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { PublicAccordion } from "@/components/public-accordion";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
it("ouvre et referme chaque réponse sans exposer les liens repliés au clavier", async () => {
  const node = document.createElement("div");
  document.body.append(node);
  const root = createRoot(node);
  try {
    await act(async () =>
      root.render(
        <div>
          <PublicAccordion question="Mes données ?"><a href="/securite">Protection</a></PublicAccordion>
          <PublicAccordion question="Ma banque ?">Lecture seule.</PublicAccordion>
        </div>,
      ),
    );
    const buttons = [...node.querySelectorAll("button")];
    const region = document.getElementById(
      buttons[0].getAttribute("aria-controls")!,
    )!;
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");
    expect(region.hasAttribute("inert")).toBe(true);
    await act(async () => buttons[0].click());
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
    expect(region.hasAttribute("inert")).toBe(false);
    expect(buttons[1].getAttribute("aria-expanded")).toBe("false");
    await act(async () => buttons[0].click());
    expect(region.getAttribute("aria-hidden")).toBe("true");
    expect(region.hasAttribute("inert")).toBe(true);
  } finally {
    await act(async () => root.unmount());
    node.remove();
  }
});
