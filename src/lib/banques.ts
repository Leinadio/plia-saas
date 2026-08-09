// Chercher sa banque dans un catalogue qui en compte 128 pour la seule France. La
// moitié est faite de caisses régionales aux noms presque identiques (Crédit Agricole
// du Languedoc, de Normandie, des Savoie…), donc une liste déroulante ne suffit pas :
// il faut pouvoir taper.
export type Banque = { name: string; country: string };

// Sans accents et en minuscules : personne ne les tape dans un champ de recherche, et
// surtout pas au bon endroit. « societe generale » doit trouver « Société Générale ».
function aplati(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function chercheBanques(catalogue: Banque[], recherche: string): Banque[] {
  const q = aplati(recherche.trim());
  const retenues = q === "" ? [...catalogue] : catalogue.filter((b) => aplati(b.name).includes(q));
  // L'ordre alphabétique plutôt que celui du catalogue, qui n'en a aucun.
  return retenues.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
