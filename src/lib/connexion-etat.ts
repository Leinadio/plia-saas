// Une autorisation bancaire vaut 90 jours, c'est la DSP2 qui le borne. Passé ce terme
// la banque referme l'accès et la synchronisation cesse — sans rien dire si l'écran ne
// le dit pas. D'où ce compte à rebours.
export type EtatConnexion = {
  etat: "valide" | "bientot" | "expiree" | "inconnue";
  jours: number;
};

// Le seuil d'alerte : reconnecter demande de repasser par sa banque et de valider avec
// son téléphone, ce qui ne se fait pas entre deux portes. Une semaine laisse le temps.
const BIENTOT = 7;

export function etatConnexion(validUntil: string | null, maintenant: Date): EtatConnexion {
  // Une connexion créée dont la banque n'a jamais rendu d'autorisation : elle n'a pas
  // de terme, donc pas de compte à rebours à afficher.
  if (!validUntil) return { etat: "inconnue", jours: 0 };
  const restant = new Date(validUntil).getTime() - maintenant.getTime();
  if (restant <= 0) return { etat: "expiree", jours: 0 };
  const jours = Math.ceil(restant / (24 * 3600 * 1000));
  return { etat: jours <= BIENTOT ? "bientot" : "valide", jours };
}
