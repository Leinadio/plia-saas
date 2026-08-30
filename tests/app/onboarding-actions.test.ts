import { beforeEach, describe, expect, it, vi } from "vitest";
import { freshTourVisit, reduceTour } from "@/lib/onboarding-tour";

const mocks = vi.hoisted(() => ({
  finish: vi.fn(),
  save: vi.fn(),
  setActive: vi.fn(),
  pourMoi: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/current-user", () => ({ pourMoi: mocks.pourMoi }));
vi.mock("@/db/repositories/onboarding-status", () => ({
  finishDemoGuide: mocks.finish,
  saveDemoVisit: mocks.save,
  setDemoActive: mocks.setActive,
}));

const {
  finishOnboarding,
  persistDemoVisit,
  restartDemoGuide,
  toggleDemo,
} = await import("@/app/app/onboarding-actions");

describe("les actions durables de la démonstration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pourMoi.mockImplementation((callback) => callback({ db: true }, "u1"));
  });

  it("active ou désactive le switch sans réinitialiser la visite", async () => {
    await expect(toggleDemo(false)).resolves.toEqual({ destination: "/app/historique" });

    expect(mocks.setActive).toHaveBeenCalledWith({ db: true }, "u1", false);
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app", "layout");
  });

  it("sauvegarde le document complet de la visite", async () => {
    const visit = freshTourVisit();
    await persistDemoVisit(visit);
    expect(mocks.save).toHaveBeenCalledWith({ db: true }, "u1", visit);
  });

  it("Guide active la démo et remet sa visite à l’étape 1", async () => {
    await expect(restartDemoGuide()).resolves.toEqual({
      destination: "/app/historique",
      visit: freshTourVisit(),
    });

    expect(mocks.setActive).toHaveBeenCalledWith({ db: true }, "u1", true);
    expect(mocks.save).toHaveBeenCalledWith({ db: true }, "u1", freshTourVisit());
  });

  it("Compris termine le guide sans éteindre la démo", async () => {
    const fresh = freshTourVisit();
    const visit = {
      ...fresh,
      tour: reduceTour({ ...fresh.tour, step: "ending-balance" }, { type: "FINISH" }),
    };
    await expect(finishOnboarding(visit)).resolves.toEqual({ destination: "/app/historique" });

    expect(mocks.finish).toHaveBeenCalledWith({ db: true }, "u1", visit, expect.any(String));
    expect(mocks.setActive).not.toHaveBeenCalledWith({ db: true }, "u1", false);
  });
});
