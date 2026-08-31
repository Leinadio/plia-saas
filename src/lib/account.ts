// Solde d'un compte tel que l'app doit le voir : celui de la banque, moins les vraies
// opérations mises hors calcul, plus les saisies manuelles que la banque ne connaît
// pas encore. La même ancre nourrit le réel, le prévu et le scénario de dépassement.
export function effectiveBalance(
  balance: number,
  ignoredTotal: number | undefined,
  manualTotal: number | undefined = undefined,
): number {
  return balance - (ignoredTotal ?? 0) + (manualTotal ?? 0);
}

export function accountDisplayName(a: { name: string; custom_name: string | null }): string {
  return a.custom_name && a.custom_name.trim() !== "" ? a.custom_name : a.name;
}

export function accountLabel(a: {
  name: string;
  custom_name: string | null;
  iban_masked: string | null;
}): string {
  const base = accountDisplayName(a);
  return a.iban_masked ? `${base} ${a.iban_masked}` : base;
}

// LES INITIALES D'UNE PERSONNE. La pastille du menu de compte est le seul endroit
// de l'app où quelque chose désigne quelqu'un : une silhouette générique n'y
// désigne personne, deux lettres si.
//
// Le nom retombe parfois sur l'adresse électronique (personne n'a rempli le champ),
// d'où la découpe sur tout ce qui n'est pas une lettre plutôt que sur l'espace
// seul : « daniel.dupont@example.com » donne bien DD.
export function initiales(nom: string): string {
  const mots = nom.split(/[^\p{L}]+/u).filter(Boolean).slice(0, 2);
  // Rien de lisible dans ce qu'on nous a donné : une pastille vide ressemble à un
  // trou dans la barre, un point d'interrogation dit qu'on ne sait pas.
  if (mots.length === 0) return "?";
  return mots.map((m) => m[0].toLocaleUpperCase("fr-FR")).join("");
}
