import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  finishAuth: vi.fn(),
  syncConnections: vi.fn(),
  revalidatePath: vi.fn(),
  requireUserId: vi.fn(),
}));

vi.mock("@/enablebanking/connection", () => ({ finishAuth: mocks.finishAuth }));
vi.mock("@/enablebanking/sync-connections", () => ({ syncConnections: mocks.syncConnections }));
vi.mock("@/enablebanking/client", () => ({ ebGet: vi.fn() }));
vi.mock("@/db/index", () => ({ db: vi.fn(() => ({ test: true })) }));
vi.mock("@/lib/current-user", () => ({ requireUserId: mocks.requireUserId }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { GET } from "@/app/api/callback/route";

describe("le retour de la banque pendant la prise en main", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user-1");
    mocks.finishAuth.mockResolvedValue(42);
    mocks.syncConnections.mockResolvedValue({ imported: 7, banques: 1 });
  });

  it("ramène directement à Vue d’ensemble avec le résultat de l'import", async () => {
    const response = await GET(
      new NextRequest("https://localhost:3000/api/callback?code=ok&state=state"),
    );

    expect(response.headers.get("location")).toBe(
      "https://localhost:3000/app/historique?connected=1&imported=7",
    );
  });
});
