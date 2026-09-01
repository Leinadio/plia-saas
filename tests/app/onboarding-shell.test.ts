import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { freshTourVisit } from "@/lib/onboarding-tour";

const mocks = vi.hoisted(() => ({
  status: null as unknown as {
    mode: "automatic-demo" | "replay-demo" | "real";
    demoActive: boolean;
    completedAt: string | null;
    visit: ReturnType<typeof freshTourVisit>;
  },
  notifications: vi.fn(async () => ["notification"]),
}));

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: () => ({ api: { getSession: vi.fn(async () => ({ user: { name: "Daniel", email: "d@example.com" } })) } }),
}));
vi.mock("@/lib/current-onboarding", () => ({ currentDemoStatus: vi.fn(async () => mocks.status) }));
vi.mock("@/lib/app-notifications", () => ({ appNotifications: mocks.notifications }));
vi.mock("@/components/detail-sidebar", () => ({ DetailSidebarProvider: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/components/mise-a-jour", () => ({ MiseAJourProvider: ({ children }: { children: React.ReactNode }) => children, FilDAttente: () => null }));
vi.mock("@/components/calculatrice", () => ({ CalculatriceProvider: ({ children }: { children: React.ReactNode }) => children, CalculatriceButton: () => null }));
vi.mock("@/components/notifications-button", () => ({
  NotificationsButton: () => null,
  NotificationsProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/sync-button", () => ({ SyncButton: () => null }));

const { default: AppLayout } = await import("@/app/app/layout");

describe("le cadre de la démonstration", () => {
  beforeEach(() => vi.clearAllMocks());

  it("transmet la visite Postgres et ne lit pas les notifications réelles en démo", async () => {
    mocks.status = { mode: "automatic-demo", demoActive: true, completedAt: null, visit: freshTourVisit() };
    const layout = await AppLayout({ children: createElement("main") });

    expect(mocks.notifications).not.toHaveBeenCalled();
    expect(layout.props.initialVisit).toEqual(freshTourVisit());
  });

  it("charge les notifications quand le switch revient sur les données réelles", async () => {
    mocks.status = {
      mode: "real",
      demoActive: false,
      completedAt: "2026-08-30T10:00:00.000Z",
      visit: { ...freshTourVisit(), tour: { ...freshTourVisit().tour, finished: true } },
    };

    await AppLayout({ children: createElement("main") });
    expect(mocks.notifications).toHaveBeenCalledOnce();
  });
});
