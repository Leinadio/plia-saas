// LA FENÊTRE DE DATES QUE LA BANQUE VEUT BIEN NOUS DONNER.
//
// On demande deux ans d'historique à toutes les banques : elles bornent
// elles-mêmes ce qu'elles rendent, et demander large évite de s'arrêter avant
// elles. Le CIC, lui, ne se contente pas de borner — il REFUSE la demande, avec
// un 422, dès qu'on remonte plus loin que quatre-vingt-dix jours.
//
// Et ce refus dit exactement où est la limite : « You can not request
// transactions more than 90 days in the past ». On la jetait, pour redemander
// sans aucune fenêtre et laisser la banque appliquer son défaut. Chaque
// synchronisation payait donc un aller-retour perdu et écrivait une erreur, pile
// comprise, pour une négociation parfaitement normale.
//
// On lit maintenant la limite dans le refus, et on redemande ce qui est permis.

// Une limite en jours, annoncée par la banque dans son refus. La phrase est en
// anglais et vient d'elle : on la lit telle qu'elle l'écrit.
const LIMITE = /more than (-?\d+) days? in the past/i;

// Le refus doit être CELUI de la période. Une panne ou une signature refusée n'ont
// aucune fenêtre à renégocier : elles doivent remonter telles quelles.
const PERIODE = /WRONG_TRANSACTIONS_PERIOD/;

const JOUR = 86_400_000;

// La date de début à redemander, ou null quand il n'y a rien à renégocier —
// l'appelant retombe alors sur la demande sans fenêtre, comme avant.
export function fenetreAcceptee(erreur: unknown, aujourdhui: Date): string | null {
  const texte = texteDe(erreur);
  if (!PERIODE.test(texte)) return null;
  const trouve = LIMITE.exec(texte);
  if (!trouve) return null;
  const jours = Number(trouve[1]);
  // Une limite qui ne laisse rien à demander (zéro) ou qui enverrait la date dans
  // le futur (négative) : on ne fabrique pas une demande impossible à partir d'une
  // réponse absurde.
  if (!Number.isFinite(jours) || jours < 1) return null;
  // Un jour de moins que la limite annoncée. La banque vient de refuser tout net
  // les quatre-vingt-dix jours qu'on lui demandait : sa borne s'entend bornes
  // comprises, ou son jour ne commence pas à la même heure que le nôtre. Cette
  // marge d'un jour suffit à ne plus jamais retomber sur ce refus.
  return new Date(aujourdhui.getTime() - (jours - 1) * JOUR).toISOString().slice(0, 10);
}

// Le refus voyage tantôt dans le message, tantôt dans le corps de la réponse
// (EnableBankingError porte les deux) : on cherche dans tout ce qu'on a.
function texteDe(erreur: unknown): string {
  if (typeof erreur === "string") return erreur;
  if (erreur instanceof Error) {
    const corps = (erreur as Error & { body?: unknown }).body;
    return typeof corps === "string" ? `${erreur.message} ${corps}` : erreur.message;
  }
  return "";
}
