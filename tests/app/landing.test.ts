import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth", () => ({
  auth: () => ({ api: { getSession: mocks.getSession } }),
}));

vi.mock("@/components/landing-page", () => ({
  LandingContent: () => null,
}));

import { LandingContent } from "@/components/landing-page";
import LandingPage from "@/app/page";

describe("la landing publique", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.redirect.mockReset();
  });

  it("reste disponible quand la vérification de session échoue", async () => {
    mocks.getSession.mockRejectedValue(new Error("base indisponible"));

    await expect(LandingPage()).resolves.toMatchObject({ type: LandingContent });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("présente la maîtrise des finances sur plusieurs mois", async () => {
    const { LandingContent: ActualLandingContent } = await vi.importActual<
      typeof import("@/components/landing-page")
    >("@/components/landing-page");

    const html = renderToStaticMarkup(createElement(ActualLandingContent));
    const visibleText = html.replace(/<[^>]+>/g, "");

    expect(visibleText).toContain(
      "Pilotez vos finances sans perdre de vue les mois à venir.",
    );
  });
});
