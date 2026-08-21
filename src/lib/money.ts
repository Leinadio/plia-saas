export function parseAmount(raw: string, creditDebit: "CRDT" | "DBIT"): number {
  const n = Number.parseFloat(raw);
  return creditDebit === "DBIT" ? -Math.abs(n) : Math.abs(n);
}

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatEur(n: number): string {
  // Intl uses narrow no-break space (U+202F) and no-break space (U+00A0); normalize to regular space.
  return EUR.format(n).replace(/[  ]/g, " ");
}

const EUR_COURT = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// LE MONTANT COURT : le même euro, sans ses centimes. Pour les endroits où six
// montants se partagent la largeur d'un téléphone — les annotations du plan de
// charge — et où « -2 342,80 € » ne tient tout simplement pas. On y lit une
// trajectoire sur six mois, pas une opération : les centimes n'y apprennent rien,
// et c'est eux ou le défilement horizontal.
export function formatEurCourt(n: number): string {
  // Un montant qui s'arrondit à zéro perd son signe : « -0 € » ferait croire à un
  // compte dans le rouge alors qu'il est à l'équilibre.
  const arrondi = Math.round(n);
  // Mêmes espaces insécables à normaliser que formatEur : fine (U+202F) et normale.
  return EUR_COURT.format(arrondi === 0 ? 0 : arrondi).replace(/[\u202f\u00a0]/g, " ");
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}
