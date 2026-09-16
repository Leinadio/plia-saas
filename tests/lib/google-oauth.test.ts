import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { memoryAdapter } from "better-auth/adapters/memory";

const store = vi.hoisted(() => ({
  tables: { user: [], account: [], session: [], verification: [] } as Record<
    string,
    Record<string, unknown>[]
  >,
}));
vi.mock("@/db/index", () => ({
  poolPostgres: () => memoryAdapter(store.tables),
}));

beforeEach(() => {
  vi.resetModules();
  for (const key of Object.keys(store.tables)) store.tables[key] = [];
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
  vi.stubEnv(
    "BETTER_AUTH_SECRET",
    "google-oauth-test-only-secret-at-least-32-characters",
  );
  vi.stubEnv("GOOGLE_CLIENT_ID", "test-client.apps.googleusercontent.com");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function setup() {
  const { auth } = await import("@/lib/auth");
  const service = auth();
  const start = () =>
    service.handler(
      new Request("http://localhost:3000/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          provider: "google",
          callbackURL: "/app",
          errorCallbackURL: "/connexion",
        }),
      }),
    );
  const complete = async (startResponse: Response, error?: string) => {
    const url = new URL((await startResponse.json()).url);
    const query = new URLSearchParams({
      state: url.searchParams.get("state")!,
    });
    if (error) query.set("error", error);
    else query.set("code", "test-google-code");
    return service.handler(
      new Request("http://localhost:3000/api/auth/callback/google?" + query, {
        headers: {
          cookie: startResponse.headers
            .getSetCookie()
            .map((c) => c.split(";")[0])
            .join("; "),
        },
      }),
    );
  };
  return { service, start, complete };
}

function mockGoogle() {
  // Seul l’échange serveur du code est simulé ; state, PKCE, comptes et sessions
  // traversent le vrai moteur Better Auth avec son adaptateur mémoire officiel.
  const payload = {
    sub: "google-user-123",
    email: "camille@example.test",
    email_verified: true,
    name: "Camille",
    iss: "https://accounts.google.com",
    aud: "test-client.apps.googleusercontent.com",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };
  const token =
    Buffer.from('{"alg":"RS256"}').toString("base64url") +
    "." +
    Buffer.from(JSON.stringify(payload)).toString("base64url") +
    ".test-signature";
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url !== "https://oauth2.googleapis.com/token")
      throw new Error("Unexpected external request: " + url);
    return Response.json({
      access_token: "test-access-token",
      token_type: "Bearer",
      expires_in: 3600,
      id_token: token,
      scope: "openid email profile",
    });
  });
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

it("génère une demande Google avec state, PKCE, adresse de retour et aucun secret", async () => {
  const { start } = await setup();
  const response = await start();
  expect(response.status).toBe(200);
  const data = await response.json();
  const url = new URL(data.url);
  expect(url.origin).toBe("https://accounts.google.com");
  expect(url.searchParams.get("redirect_uri")).toBe(
    "http://localhost:3000/api/auth/callback/google",
  );
  expect(url.searchParams.get("state")).toBeTruthy();
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
  expect(url.searchParams.get("scope")?.split(" ").sort()).toEqual([
    "email",
    "openid",
    "profile",
  ]);
  expect(data.url).not.toContain("test-client-secret");
});

it("crée un compte Google puis reconnecte la même personne sans doublon", async () => {
  const { start, complete } = await setup();
  mockGoogle();
  const first = await complete(await start());
  expect(first.status).toBe(302);
  expect(first.headers.get("location")).toBe("/app");
  expect(first.headers.get("set-cookie")).toContain("session_token");
  expect(store.tables.user).toHaveLength(1);
  expect(store.tables.user[0]).toMatchObject({
    email: "camille@example.test",
    emailVerified: true,
  });
  expect(store.tables.account).toHaveLength(1);
  expect(store.tables.account[0].accessToken).not.toBe("test-access-token");
  const second = await complete(await start());
  expect(second.headers.get("location")).toBe("/app");
  expect(store.tables.user).toHaveLength(1);
  expect(store.tables.account).toHaveLength(1);
});

it("refuse de rattacher Google à un compte e-mail non vérifié", async () => {
  const { service, start, complete } = await setup();
  await service.api.signUpEmail({
    body: {
      name: "Camille",
      email: "camille@example.test",
      password: "test-password-123",
    },
  });
  mockGoogle();
  const response = await complete(await start());
  expect(response.headers.get("location")).toContain(
    "/connexion?error=account_not_linked",
  );
  expect(store.tables.user).toHaveLength(1);
  expect(store.tables.account).toHaveLength(1);
  expect(store.tables.account[0].providerId).toBe("credential");
});

it("une annulation ne crée ni compte ni session", async () => {
  const { start, complete } = await setup();
  const fetcher = mockGoogle();
  const response = await complete(await start(), "access_denied");
  expect(response.headers.get("location")).toContain(
    "/connexion?error=access_denied",
  );
  expect(store.tables.user).toHaveLength(0);
  expect(store.tables.session).toHaveLength(0);
  expect(fetcher).not.toHaveBeenCalled();
});

it("rejette un retour sans state valide", async () => {
  const { service } = await setup();
  const fetcher = mockGoogle();
  const response = await service.handler(
    new Request(
      "http://localhost:3000/api/auth/callback/google?code=forged&state=forged",
    ),
  );
  expect(response.headers.get("location")).toContain("/connexion?error=");
  expect(store.tables.user).toHaveLength(0);
  expect(fetcher).not.toHaveBeenCalled();
});
