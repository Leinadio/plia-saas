import { beforeEach, describe, expect, it, vi } from "vitest";
import { freshTourVisit } from "@/lib/onboarding-tour";

const mocks = vi.hoisted(() => ({
  status: null as null | {
    demoActive: boolean;
    completedAt: string | null;
    visit: ReturnType<typeof freshTourVisit>;
  },
  pourMoi: vi.fn(),
  readStatus: vi.fn(),
}));

vi.mock("@/lib/current-user", () => ({ pourMoi: mocks.pourMoi }));
vi.mock("@/db/repositories/onboarding-status", () => ({ readDemoStatus: mocks.readStatus }));

import { currentDemoStatus, currentOnboardingCompletion, currentOnboardingMode } from "@/lib/current-onboarding";
import { isDemoMode, resolveOnboardingMode } from "@/lib/onboarding-mode";

describe("le choix du mode de démonstration", () => {
  it.each([
    [{ demoActive: true, completed: false }, "automatic-demo"],
    [{ demoActive: true, completed: true }, "replay-demo"],
    [{ demoActive: false, completed: false }, "real"],
    [{ demoActive: false, completed: true }, "real"],
  ] as const)("choisit %s", (input, expected) => {
    expect(resolveOnboardingMode(input)).toBe(expected);
  });

  it("reconnaît les deux états de démonstration", () => {
    expect(isDemoMode("automatic-demo")).toBe(true);
    expect(isDemoMode("replay-demo")).toBe(true);
    expect(isDemoMode("real")).toBe(false);
  });
});

describe("l’état courant de démonstration", () => {
  beforeEach(() => {
    mocks.status = { demoActive: true, completedAt: null, visit: freshTourVisit() };
    mocks.pourMoi.mockReset();
    mocks.readStatus.mockReset();
    mocks.readStatus.mockImplementation(async () => mocks.status);
    mocks.pourMoi.mockImplementation((read) => read({ db: true }, "u1"));
  });

  it("donne au nouvel utilisateur la démo active à l’étape 1", async () => {
    await expect(currentDemoStatus()).resolves.toMatchObject({
      demoActive: true,
      completedAt: null,
      mode: "automatic-demo",
      visit: { tour: { step: "demo-account", finished: false } },
    });
    await expect(currentOnboardingMode()).resolves.toBe("automatic-demo");
    await expect(currentOnboardingCompletion()).resolves.toBe(false);
  });

  it("garde un utilisateur terminé sur le réel quand son switch est éteint", async () => {
    mocks.status = {
      demoActive: false,
      completedAt: "2026-08-30T10:00:00.000Z",
      visit: { ...freshTourVisit(), tour: { ...freshTourVisit().tour, finished: true } },
    };

    await expect(currentDemoStatus()).resolves.toMatchObject({ mode: "real", demoActive: false });
    await expect(currentOnboardingCompletion()).resolves.toBe(true);
  });

  it("lit seulement le statut cloisonné de l’utilisateur", async () => {
    await currentDemoStatus();
    expect(mocks.pourMoi).toHaveBeenCalledOnce();
    expect(mocks.readStatus).toHaveBeenCalledWith({ db: true }, "u1");
  });
});
