import { Children, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Schibsted_Grotesk: () => ({ variable: "font-ui" }),
}));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));

const { default: RootLayout } = await import("@/app/layout");

describe("la mise en page principale", () => {
  it("charge le thème avec le composant prévu par Next.js", () => {
    const root = RootLayout({ children: null });
    const head = Children.toArray(root.props.children)[0];

    expect(isValidElement(head)).toBe(true);
    if (!isValidElement<{ children: unknown }>(head)) return;
    const themeLoader = Children.only(head.props.children);

    expect(isValidElement(themeLoader)).toBe(true);
    if (!isValidElement<{ id?: string; strategy?: string }>(themeLoader)) return;
    expect(themeLoader.type).not.toBe("script");
    expect(themeLoader.props.id).toBe("plia-theme");
    expect(themeLoader.props.strategy).toBe("beforeInteractive");
  });
});
