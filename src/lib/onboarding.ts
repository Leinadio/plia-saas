const SYNCHRO_A_REPRENDRE =
  "Banque reliée. La première synchronisation n’a pas abouti : utilisez Synchroniser pour réessayer.";

export function messageConnexionInitiale(imported?: string): string {
  if (imported === undefined) return SYNCHRO_A_REPRENDRE;

  const nombre = Number(imported);
  if (!Number.isInteger(nombre) || nombre < 0) return SYNCHRO_A_REPRENDRE;
  if (nombre === 0) return "Banque reliée. Aucune nouvelle opération à importer pour l’instant.";

  return `Banque reliée. ${nombre} opération${nombre > 1 ? "s" : ""} importée${nombre > 1 ? "s" : ""} : votre projection est prête.`;
}
