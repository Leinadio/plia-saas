// --- La fenêtre de dates que la banque veut bien nous donner -----------------
//
// On demande deux ans d'historique. Le CIC en refuse plus de quatre-vingt-dix
// jours, et son refus le DIT : « You can not request transactions more than 90
// days in the past ». On jetait cette phrase et on redemandait sans fenêtre du
// tout, en laissant la banque appliquer son défaut — une erreur journalisée avec
// sa pile à chaque synchronisation, pour une négociation parfaitement normale.
//
// On lit maintenant la limite dans le refus et on redemande exactement ce qui est
// permis.
import { expect, test, describe } from "vitest";
import { fenetreAcceptee } from "../../src/enablebanking/periode";

const LE_22_AOUT = new Date("2026-08-22T10:00:00Z");

const refus422 = (jours: number) =>
  new Error(
    `Enable Banking HTTP 422: {"code":422,"message":"Wrong transactions period requested","detail":{"message":"You can not request transactions more than ${jours} days in the past","date_from":"2026-05-24"},"error":"WRONG_TRANSACTIONS_PERIOD"}`,
  );

describe("fenetreAcceptee", () => {
  test("rend la date de début que la banque accepte", () => {
    // 90 jours annoncés, 89 demandés : la banque vient de refuser tout net les 90
    // qu'on lui demandait, donc sa borne s'entend bornes comprises — ou son jour
    // ne commence pas à la même heure que le nôtre. Un jour de marge suffit à ne
    // plus jamais retomber sur ce refus.
    expect(fenetreAcceptee(refus422(90), LE_22_AOUT)).toBe("2026-05-25");
  });

  test("suit la limite annoncée, quelle qu'elle soit", () => {
    expect(fenetreAcceptee(refus422(30), LE_22_AOUT)).toBe("2026-07-24");
    expect(fenetreAcceptee(refus422(365), LE_22_AOUT)).toBe("2025-08-23");
  });

  test("ne rend rien quand le refus ne parle pas de période", () => {
    // Une panne, une signature refusée : rien à renégocier, la synchronisation doit
    // remonter l'incident tel quel.
    expect(fenetreAcceptee(new Error("Enable Banking HTTP 500: bad gateway"), LE_22_AOUT)).toBeNull();
    expect(fenetreAcceptee(new Error("Enable Banking HTTP 401: signature"), LE_22_AOUT)).toBeNull();
  });

  test("ne rend rien quand la banque refuse la période sans dire sa limite", () => {
    // On retombe alors sur la demande sans fenêtre, comme avant : mieux vaut le
    // défaut de la banque que rien du tout.
    expect(fenetreAcceptee(new Error("HTTP 400: date_from too far in the past"), LE_22_AOUT)).toBeNull();
  });

  test("ne se laisse pas dérouter par ce qui n'est pas une erreur", () => {
    expect(fenetreAcceptee(null, LE_22_AOUT)).toBeNull();
    expect(fenetreAcceptee("bonjour", LE_22_AOUT)).toBeNull();
  });

  test("refuse une limite absurde plutôt que de demander une date impossible", () => {
    // Zéro jour ne laisserait rien à demander, et un nombre négatif enverrait une
    // date dans le futur : dans les deux cas, on retombe sur la demande sans fenêtre.
    expect(fenetreAcceptee(refus422(0), LE_22_AOUT)).toBeNull();
    expect(fenetreAcceptee(refus422(-5), LE_22_AOUT)).toBeNull();
  });
});
