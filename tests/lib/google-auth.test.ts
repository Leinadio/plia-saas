import { afterEach, describe, expect, it, vi } from "vitest";
import { getGoogleProvider, googleAuthError } from "@/lib/google-auth";

afterEach(() => vi.unstubAllEnvs());

describe("la configuration Google", () => {
  it.each([
    ["", ""],
    ["client", ""],
    ["", "secret"],
    ["  ", "secret"],
  ])("reste indisponible sans les deux identifiants (%s)", (client, secret) => {
    vi.stubEnv("GOOGLE_CLIENT_ID", client);
    vi.stubEnv("GOOGLE_CLIENT_SECRET", secret);
    expect(getGoogleProvider()).toBeNull();
  });
  it("utilise les identifiants serveur et ne demande que l’identité", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", " client.apps.googleusercontent.com ");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", " secret ");
    expect(getGoogleProvider()).toEqual({
      clientId: "client.apps.googleusercontent.com",
      clientSecret: "secret",
      prompt: "select_account",
      accessType: "online",
    });
  });
});

describe("le retour de Google", () => {
  it("reste silencieux sans erreur", () =>
    expect(googleAuthError(undefined)).toBe(""));
  it("explique une annulation", () =>
    expect(googleAuthError("access_denied")).toContain("annulée"));
  it("protège un compte existant non associé", () =>
    expect(googleAuthError("account_not_linked")).toContain("mot de passe"));
  it("ne montre jamais une erreur brute reçue dans l’URL", () => {
    expect(googleAuthError("private-token-and-details")).not.toContain(
      "private-token",
    );
    expect(googleAuthError("state_mismatch")).toContain("réessayer");
  });
});
