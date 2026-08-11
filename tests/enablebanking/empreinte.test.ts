// --- Dire ce qu'on a signé, sans dire avec quoi ---------------------------------
//
// « Wrong signature » est le message le plus décourageant d'Enable Banking : il dit
// que la signature ne correspond pas, jamais laquelle des deux moitiés est en cause.
// Et sur un serveur, on ne peut plus relire ses propres réglages — une valeur marquée
// secrète chez l'hébergeur ne se réaffiche pas.
//
// D'où cette description : assez précise pour comparer avec ce qu'on croit avoir posé,
// assez avare pour ne rien apprendre à qui la lirait. Longueurs, premiers et derniers
// caractères, et rien du milieu.
import { expect, test } from "vitest";
import { decrireIdentifiants } from "../../src/enablebanking/empreinte";

const CLE = `-----BEGIN PRIVATE KEY-----
MIIJQgIBADANBgkqhkiG9w0BAQEFAASCCSwwggkoAgEAAoICAQDaBcDeF
GhIjKlMnOpQrStUvWxYz0123456789abcdefghijklmnopqrstuvwxyzA
-----END PRIVATE KEY-----`;

test("décrit les deux moitiés par leur taille et leurs bords", () => {
  const texte = decrireIdentifiants("deb1abcd-1234-5678-9012-abcdefabbfa1", CLE);

  expect(texte).toContain("36 caractères");
  expect(texte).toContain("deb1…bfa1");
  expect(texte).toContain("114 caractères");
  expect(texte).toContain("MIIJQg…vwxyzA");
});

// Le milieu ne doit jamais sortir : c'est là qu'est le secret.
test("ne laisse jamais filtrer le milieu de la clé", () => {
  const texte = decrireIdentifiants("deb1abcd-1234-5678-9012-abcdefabbfa1", CLE);

  expect(texte).not.toContain("GhIjKlMnOpQr");
  expect(texte).not.toContain("0123456789");
});

// Le coupable le plus banal d'un copier-coller depuis une page web, et le plus
// invisible : un espace ou un retour à la ligne accroché au bout. Il suffit à faire
// rejeter la signature, et rien ne le montre.
test("signale un espace parasite autour de l'identifiant", () => {
  expect(decrireIdentifiants("deb1abcd-1234-5678-9012-abcdefabbfa1\n", CLE)).toContain(
    "espace ou retour à la ligne parasite",
  );
  expect(decrireIdentifiants(" deb1abcd-1234-5678-9012-abcdefabbfa1", CLE)).toContain(
    "espace ou retour à la ligne parasite",
  );
  expect(decrireIdentifiants("deb1abcd-1234-5678-9012-abcdefabbfa1", CLE)).not.toContain(
    "espace ou retour à la ligne parasite",
  );
});

// Une moitié absente est un cas à part : ce n'est plus une signature qui ne correspond
// pas, c'est un réglage qui n'est jamais arrivé jusqu'au serveur.
test("dit clairement ce qui manque", () => {
  expect(decrireIdentifiants(undefined, CLE)).toContain("identifiant absent");
  expect(decrireIdentifiants("deb1abcd-1234-5678-9012-abcdefabbfa1", undefined)).toContain(
    "clé absente",
  );
});

// La clé peut arriver aplatie sur une seule ligne, ou avec ses retours à la ligne
// écrits en toutes lettres. Les deux se lisent très bien — la description doit donc
// donner la même taille dans les trois cas, sans quoi elle enverrait sur une fausse
// piste.
test("décrit de la même façon une clé aplatie ou échappée", () => {
  const surUneLigne = CLE.replace(/\n/g, "");
  const echappee = CLE.replace(/\n/g, "\\n");

  expect(decrireIdentifiants("a", surUneLigne)).toContain("114 caractères");
  expect(decrireIdentifiants("a", echappee)).toContain("114 caractères");
});
