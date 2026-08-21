import { expect, test } from "vitest";
import { parseAmount, formatEur, formatEurCourt, monthKey } from "../../src/lib/money";

test("parseAmount signs debits negative", () => {
  expect(parseAmount("12.34", "DBIT")).toBe(-12.34);
  expect(parseAmount("50.00", "CRDT")).toBe(50);
});

test("formatEur formats French euros", () => {
  expect(formatEur(-12.3)).toBe("-12,30 €");
  expect(formatEur(1000)).toBe("1 000,00 €");
});

test("monthKey extracts YYYY-MM", () => {
  expect(monthKey("2026-07-04")).toBe("2026-07");
});

// LE MONTANT COURT. Six montants côte à côte sous les mâts du plan de charge, sur
// un écran de téléphone : chacun dispose d'une soixantaine de pixels. « -2 342,80 € »
// n'y tient pas, et c'est pour ça que le graphique se faisait défiler — alors qu'il
// est la première chose à voir en ouvrant l'app. Sans les centimes, il tient.
//
// Les centimes ne manquent à personne ici : on y lit une trajectoire sur six mois,
// pas une opération. Le montant exact reste écrit partout ailleurs.
test("formatEurCourt arrondit à l'euro et laisse tomber les centimes", () => {
  expect(formatEurCourt(-2342.8)).toBe("-2 343 €");
  expect(formatEurCourt(1000)).toBe("1 000 €");
  expect(formatEurCourt(12.3)).toBe("12 €");
});

test("formatEurCourt n'écrit pas un zéro négatif", () => {
  // -0,40 € arrondi vaut zéro : « -0 € » ferait croire à un compte dans le rouge.
  expect(formatEurCourt(-0.4)).toBe("0 €");
  expect(formatEurCourt(0)).toBe("0 €");
});
