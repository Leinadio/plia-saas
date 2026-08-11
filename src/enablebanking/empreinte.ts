// --- Dire ce qu'on a signé, sans dire avec quoi ---------------------------------
//
// « Wrong signature » est le message le plus décourageant d'Enable Banking : il dit que
// la signature ne correspond pas, jamais laquelle des deux moitiés est en cause. Et sur
// un serveur on ne peut plus relire ses propres réglages — une valeur marquée secrète
// chez l'hébergeur ne se réaffiche jamais.
//
// Cette description sert à comparer ce que le serveur a REÇU avec ce qu'on croit avoir
// posé. Elle donne des tailles et des bords, jamais le milieu : de quoi reconnaître une
// valeur, pas de quoi la reconstituer.

function bords(valeur: string, n: number): string {
  return valeur.length <= n * 2 ? valeur : `${valeur.slice(0, n)}…${valeur.slice(-n)}`;
}

// Le corps de la clé, débarrassé de ses marqueurs et de sa mise en forme. Une clé
// aplatie sur une seule ligne, ou dont les retours à la ligne sont écrits en toutes
// lettres, se lit très bien : la description doit donc les décrire à l'identique,
// sinon elle enverrait sur une fausse piste.
function corpsDeLaCle(pem: string): string {
  return pem
    .replace(/\\n/g, "\n")
    .replace(/-----(BEGIN|END) [A-Z ]*PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
}

export function decrireIdentifiants(appId: string | undefined, pem: string | undefined): string {
  const morceaux: string[] = [];

  if (!appId) {
    morceaux.push("identifiant absent");
  } else {
    const propre = appId.trim();
    const parasite = propre !== appId ? " — espace ou retour à la ligne parasite" : "";
    morceaux.push(`identifiant ${propre.length} caractères ${bords(propre, 4)}${parasite}`);
  }

  if (!pem) {
    morceaux.push("clé absente");
  } else {
    const corps = corpsDeLaCle(pem);
    morceaux.push(`clé ${corps.length} caractères ${bords(corps, 6)}`);
  }

  return morceaux.join(", ");
}
