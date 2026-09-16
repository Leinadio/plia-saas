/** Identifiants exclusivement serveur ; seule la disponibilité est passée au navigateur. */
export function getGoogleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    prompt: "select_account" as const,
    accessType: "online" as const,
  };
}

/** Les descriptions reçues du fournisseur ne sont jamais affichées directement. */
export function googleAuthError(code: string | undefined): string {
  if (!code) return "";
  if (code === "access_denied")
    return "La connexion Google a été annulée. Tu peux réessayer.";
  if (code === "account_not_linked")
    return "Cette adresse correspond déjà à un compte Planora. Connecte-toi avec ton mot de passe.";
  return "La connexion avec Google n’a pas abouti. Tu peux réessayer ou utiliser ton adresse e-mail.";
}
