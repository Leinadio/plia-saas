// LE RÉCAPITULATIF D'UN COMPTE.
//
// Le tableau de bord montrait une seule structure, tous comptes confondus : un
// plan de charge, une bande de relevés, deux tables. Additionner ainsi le compte
// courant et le livret disait un solde que personne ne peut dépenser, et un
// dépassement dont on ne savait plus lequel des deux comptes l'avait creusé.
//
// Ce module fabrique le même récapitulatif, mais pour UN compte : c'est le tri
// qui compte ici, et c'est lui que ces tests surveillent.
import { describe, expect, it } from "vitest";
import { recapCompte } from "../../src/lib/recap-compte";
import { monthRange } from "../../src/lib/history";
import type { Group, Txn } from "../../src/lib/forecast";
import { seedDated } from "./dated-fixtures";

const COURANT = "2026-07";
const MOIS = monthRange(COURANT, "2026-12");

// Deux comptes, chacun avec sa rentrée et sa dépense. Les identifiants ne se
// croisent nulle part : si un chiffre du compte A contient quoi que ce soit de B,
// c'est que le tri a lâché.
const courses: Group = { id: 1, accountId: "a1", name: "Courses", direction: "out", monthlyAmount: 300, lines: [] };
const salaire: Group = { id: 2, accountId: "a1", name: "Salaire", direction: "in", monthlyAmount: 2000, lines: [] };
const epargne: Group = { id: 3, accountId: "a2", name: "Versement", direction: "out", monthlyAmount: 100, lines: [] };
const interets: Group = { id: 4, accountId: "a2", name: "Intérêts", direction: "in", monthlyAmount: 40, lines: [] };
const groupes = [courses, salaire, epargne, interets];

function tx(p: Partial<Txn>): Txn {
  return { id: "t", date: "2026-07-05", amount: -10, label: "", accountId: "a1", groupId: null, ...p };
}

const recap = (accountId: string, balance: number, txns: Txn[], groups = groupes) => {
  const { dated, datedLines } = seedDated(groups);
  return recapCompte(accountId, balance, groups, txns, MOIS, COURANT, dated, datedLines);
};

describe("recapCompte", () => {
  it("ne retient que les postes du compte demandé", () => {
    const r = recap("a1", 1000, []);
    expect(r.entrees.map((l) => l.nom)).toEqual(["Salaire"]);
    expect(r.sorties.map((l) => l.nom)).toEqual(["Courses"]);

    const autre = recap("a2", 500, []);
    expect(autre.entrees.map((l) => l.nom)).toEqual(["Intérêts"]);
    expect(autre.sorties.map((l) => l.nom)).toEqual(["Versement"]);
  });

  it("ne compte que les opérations du compte demandé", () => {
    const txns = [
      tx({ id: "1", amount: -120, groupId: 1, accountId: "a1" }),
      tx({ id: "2", amount: -80, groupId: 3, accountId: "a2" }),
      tx({ id: "3", amount: 2000, groupId: 2, accountId: "a1" }),
    ];
    const r = recap("a1", 1000, txns);
    // Sorties : [enveloppe, dépensé, reste]. 120 dépensés, pas 200.
    expect(r.sorties[0].montants).toEqual([300, -120, 180]);
    expect(r.entrees[0].montants).toEqual([2000, 2000]);
  });

  it("dit le solde du compte, pas celui de tous les comptes", () => {
    const r = recap("a1", 1000, []);
    expect(r.releves[0]).toEqual({ label: "Solde", valeur: 1000 });
  });

  it("chiffre les entrées, les sorties et le dépassement du mois pour ce compte seul", () => {
    const txns = [
      tx({ id: "1", amount: -400, groupId: 1, accountId: "a1" }), // 100 au-delà des 300
      tx({ id: "2", amount: 2000, groupId: 2, accountId: "a1" }),
      tx({ id: "3", amount: -900, groupId: 3, accountId: "a2" }), // pas dans ce compte
    ];
    const r = recap("a1", 1600, txns);
    const par = Object.fromEntries(r.releves.map((x) => [x.label, x.valeur]));
    expect(par["Entrées juillet 2026"]).toBe(2000);
    expect(par["Sorties juillet 2026"]).toBe(-400);
    expect(par["Dépassement"]).toBe(-100);
  });

  it("dresse un mât par mois, du mois courant aux suivants", () => {
    const r = recap("a1", 1000, []);
    expect(r.mois.map((m) => m.key)).toEqual(MOIS);
    expect(r.mois[0].label).toBe("juil.");
  });

  it("fait monter les mois à venir sur le prévu du compte, pas sur son solde d'aujourd'hui", () => {
    // 2000 de salaire contre 300 de courses : le compte gagne 1700 par mois.
    const r = recap("a1", 1000, [tx({ id: "1", amount: 2000, groupId: 2 })]);
    const soldes = r.mois.map((m) => m.solde);
    expect(soldes[1]).toBeGreaterThan(soldes[0]);
    expect(soldes[5]).toBeGreaterThan(soldes[1]);
  });

  it("grave l'état de chaque poste", () => {
    const txns = [
      tx({ id: "1", amount: -400, groupId: 1 }), // dépassé
      tx({ id: "2", amount: 2000, groupId: 2 }), // acquis
    ];
    const r = recap("a1", 1600, txns);
    expect(r.sorties[0].etat).toBe("dépassé");
    expect(r.entrees[0].etat).toBe("acquis");

    const vierge = recap("a1", 1000, []);
    expect(vierge.sorties[0].etat).toBe("attendu");
    expect(vierge.entrees[0].etat).toBe("attendu");

    const entame = recap("a1", 1000, [tx({ id: "1", amount: -50, groupId: 1 })]);
    expect(entame.sorties[0].etat).toBe("engagé");
  });

  it("écarte les postes qui ne vivent pas au mois courant", () => {
    const fini: Group = { ...courses, id: 5, name: "Ancien", endMonth: "2026-05" };
    const r = recap("a1", 1000, [], [...groupes, fini]);
    expect(r.sorties.map((l) => l.nom)).toEqual(["Courses"]);
  });

  it("rend un récapitulatif complet même pour un compte sans rien", () => {
    const r = recap("a3", 0, []);
    expect(r.entrees).toEqual([]);
    expect(r.sorties).toEqual([]);
    expect(r.mois).toHaveLength(MOIS.length);
    expect(r.releves).toHaveLength(5);
  });
});

// LA PROJECTION EST CELLE QUI TIENT COMPTE DES DÉPASSEMENTS.
//
// Le plan sans les débordements dit où l'on atterrirait si l'on n'avait rien
// dépassé — mais on a déjà dépassé, et l'argent est parti. La case doit annoncer
// le vrai atterrissage : le plan MOINS ce qui a débordé (la chaîne « si
// dépassement » du tableau).
describe("recapCompte : la projection", () => {
  const projection = (r: ReturnType<typeof recap>) =>
    r.releves.find((x) => x.label === "Projection")!.valeur;

  it("retire le dépassement du mois du montant projeté", () => {
    // Ouverture du mois à 0 : 1600 en banque après +2000 de salaire et -400 de
    // courses. Le plan seul fermerait à 0 + 2000 - 300 = 1700 ; mais 100 ont
    // débordé du budget des courses, donc on atterrit à 1600.
    const txns = [
      tx({ id: "1", amount: -400, groupId: 1 }),
      tx({ id: "2", amount: 2000, groupId: 2 }),
    ];
    expect(projection(recap("a1", 1600, txns))).toBe(1600);
  });

  it("vaut le plan tel quel quand rien n'a débordé", () => {
    // Mêmes postes, mais 250 dépensés sur un budget de 300 : aucun débordement,
    // la projection reste celle du plan.
    const txns = [
      tx({ id: "1", amount: -250, groupId: 1 }),
      tx({ id: "2", amount: 2000, groupId: 2 }),
    ];
    expect(projection(recap("a1", 1750, txns))).toBe(1700);
  });

  it("ne se laisse pas entamer par le dépassement d'un autre compte", () => {
    const txns = [
      tx({ id: "1", amount: -250, groupId: 1 }),
      tx({ id: "2", amount: 2000, groupId: 2 }),
      tx({ id: "3", amount: -900, groupId: 3, accountId: "a2" }), // 800 au-delà des 100
    ];
    expect(projection(recap("a1", 1750, txns))).toBe(1700);
  });
});
