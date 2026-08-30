import { Children, isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  currentOnboardingMode: vi.fn(),
  pourMoi: vi.fn(),
  listAccounts: vi.fn(),
  listTransactions: vi.fn(),
  sumIgnoredByAccount: vi.fn(),
  listGroups: vi.fn(),
  listBudgetAmounts: vi.fn(),
  listLineAmounts: vi.fn(),
  listDismissedNotifications: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/current-onboarding", () => ({ currentOnboardingMode: mocks.currentOnboardingMode }));
vi.mock("@/lib/current-user", () => ({ pourMoi: mocks.pourMoi }));
vi.mock("@/db/repositories/accounts", () => ({ listAccounts: mocks.listAccounts }));
vi.mock("@/db/repositories/transactions", () => ({
  listTransactions: mocks.listTransactions,
  sumIgnoredByAccount: mocks.sumIgnoredByAccount,
}));
vi.mock("@/db/repositories/groups", () => ({ listGroups: mocks.listGroups }));
vi.mock("@/db/repositories/budget-amounts", () => ({ listBudgetAmounts: mocks.listBudgetAmounts }));
vi.mock("@/db/repositories/line-amounts", () => ({ listLineAmounts: mocks.listLineAmounts }));
vi.mock("@/db/repositories/dismissed-notifications", () => ({
  listDismissedNotifications: mocks.listDismissedNotifications,
}));

const { default: DashboardRedirect } = await import("@/app/app/page");
const { default: HistoriquePage } = await import("@/app/app/historique/page");
const { FirstAccountOnboarding } = await import("@/components/first-account-onboarding");
const { ConnexionReussie } = await import("@/components/connexion-reussie");

describe("la route /app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentOnboardingMode.mockResolvedValue("real");
    mocks.pourMoi.mockImplementation(async (lire) => lire({}, "user-1"));
    mocks.listAccounts.mockResolvedValue([]);
    mocks.listTransactions.mockResolvedValue([]);
    mocks.sumIgnoredByAccount.mockResolvedValue({});
    mocks.listGroups.mockResolvedValue([]);
    mocks.listBudgetAmounts.mockResolvedValue([]);
    mocks.listLineAmounts.mockResolvedValue([]);
    mocks.listDismissedNotifications.mockResolvedValue([]);
  });

  it("redirige vers Vue d’ensemble en gardant le résultat de connexion", async () => {
    await DashboardRedirect({ searchParams: Promise.resolve({ connected: "1", imported: "42" }) });

    expect(mocks.redirect).toHaveBeenCalledWith("/app/historique?connected=1&imported=42");
  });

  it("ne garde que les paramètres texte de connexion", async () => {
    await DashboardRedirect({
      searchParams: Promise.resolve({ connected: ["1"], imported: "42" } as unknown as {
        connected?: string;
        imported?: string;
      }),
    });

    expect(mocks.redirect).toHaveBeenCalledWith("/app/historique?imported=42");
  });

  it("redirige sans paramètre quand il n’y a aucun résultat à transmettre", async () => {
    await DashboardRedirect({ searchParams: Promise.resolve({}) });

    expect(mocks.redirect).toHaveBeenCalledWith("/app/historique");
  });

  it("affiche les premiers pas après une connexion sans compte", async () => {
    const result = await HistoriquePage({ searchParams: Promise.resolve({ connected: "1" }) });

    expect(result.type).toBe(FirstAccountOnboarding);
    expect(result.props.connexionTerminee).toBe(true);
  });

  it("affiche le résultat de connexion avant la vue d’ensemble du compte", async () => {
    mocks.listAccounts.mockResolvedValue([{
      id: "account-1",
      name: "Compte courant",
      iban_masked: null,
      balance: 1200,
      currency: "EUR",
      last_synced: null,
      custom_name: null,
      user_id: "user-1",
      connection_id: 1,
    }]);

    const result = await HistoriquePage({ searchParams: Promise.resolve({ connected: "1", imported: "7" }) });
    const [notice] = Children.toArray(result.props.children);

    if (!isValidElement<{ imported?: string }>(notice)) throw new Error("Le bandeau de connexion doit être rendu");
    expect(notice.type).toBe(ConnexionReussie);
    expect(notice.props.imported).toBe("7");
  });
});
