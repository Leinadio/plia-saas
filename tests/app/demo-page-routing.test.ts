import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mode: "automatic-demo" as "automatic-demo" | "replay-demo" | "real",
  pourMoi: vi.fn(),
}));

vi.mock("@/lib/current-onboarding", () => ({
  currentOnboardingMode: vi.fn(async () => mocks.mode),
}));
vi.mock("@/lib/current-user", () => ({ pourMoi: mocks.pourMoi }));
vi.mock("@/components/demo-transactions", () => ({ DemoTransactions: () => "opérations de démonstration" }));
vi.mock("@/components/demo-history", () => ({ DemoHistory: () => "historique de démonstration" }));

const { default: TransactionsPage } = await import("@/app/app/transactions/page");
const { default: HistoriquePage } = await import("@/app/app/historique/page");

describe("les pages de démonstration", () => {
  it("ouvre les opérations sans lire les finances réelles", async () => {
    const result = await TransactionsPage();

    expect(result.type()).toBe("opérations de démonstration");
    expect(mocks.pourMoi).not.toHaveBeenCalled();
  });

  it("ouvre Vue d’ensemble sans lire les finances réelles", async () => {
    const result = await HistoriquePage({ searchParams: Promise.resolve({}) });

    expect(result.type()).toBe("historique de démonstration");
    expect(mocks.pourMoi).not.toHaveBeenCalled();
  });
});
