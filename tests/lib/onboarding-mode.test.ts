import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  onboardingRow: null as { user_id: string } | null,
  cookieValue: undefined as string | undefined,
  pourMoi: vi.fn(),
  readStatus: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (name === "plia_onboarding_replay" && mocks.cookieValue ? { value: mocks.cookieValue } : undefined),
  })),
}));

vi.mock("@/lib/current-user", () => ({
  pourMoi: mocks.pourMoi,
}));

import { currentOnboardingCompletion, currentOnboardingMode } from "@/lib/current-onboarding";
import { isDemoMode, resolveOnboardingMode, wantsReplay } from "@/lib/onboarding-mode";

describe("le choix du mode d'onboarding", () => {
  it.each([
    [{ completed: false, replayCookie: false }, "automatic-demo"],
    [{ completed: false, replayCookie: true }, "automatic-demo"],
    [{ completed: true, replayCookie: false }, "real"],
    [{ completed: true, replayCookie: true }, "replay-demo"],
  ] as const)("choisit %s", (input, expected) => {
    expect(resolveOnboardingMode(input)).toBe(expected);
  });

  it("accepte seulement la valeur 1 pour rejouer la démo", () => {
    expect(wantsReplay("1")).toBe(true);
    expect(wantsReplay(undefined)).toBe(false);
    expect(wantsReplay("")).toBe(false);
    expect(wantsReplay("true")).toBe(false);
  });

  it("reconnaît les deux modes de démo", () => {
    expect(isDemoMode("automatic-demo")).toBe(true);
    expect(isDemoMode("replay-demo")).toBe(true);
    expect(isDemoMode("real")).toBe(false);
  });
});

describe("le mode courant d'onboarding", () => {
  beforeEach(() => {
    mocks.onboardingRow = null;
    mocks.cookieValue = undefined;
    mocks.pourMoi.mockReset();
    mocks.readStatus.mockReset();
    mocks.readStatus.mockImplementation(async () => mocks.onboardingRow);
    mocks.pourMoi.mockImplementation((read) => read({ one: mocks.readStatus }, "u1"));
  });

  it.each([
    [false, undefined, "automatic-demo"],
    [false, "1", "automatic-demo"],
    [true, undefined, "real"],
    [true, "1", "replay-demo"],
  ] as const)("restitue %s avec le cookie %s", async (completed, cookieValue, expected) => {
    mocks.onboardingRow = completed ? { user_id: "u1" } : null;
    mocks.cookieValue = cookieValue;

    await expect(currentOnboardingMode()).resolves.toBe(expected);
  });

  it("lit l'achèvement via l'accès utilisateur avant toute donnée financière", async () => {
    mocks.onboardingRow = { user_id: "u1" };

    await expect(currentOnboardingCompletion()).resolves.toBe(true);
    expect(mocks.pourMoi).toHaveBeenCalledOnce();
    expect(mocks.readStatus).toHaveBeenCalledWith(
      "SELECT user_id FROM onboarding_status WHERE user_id = $1",
      ["u1"],
    );
  });
});
