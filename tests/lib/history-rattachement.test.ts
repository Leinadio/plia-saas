import { expect, describe, it } from "vitest";
import { computeHistory, computeSolde, computeOverspends, monthsWithData } from "../../src/lib/history";
import type { Group, Txn } from "../../src/lib/forecast";
import { seedDated, mergeDated } from "./dated-fixtures";

// RATTACHER UNE OPÉRATION À UN AUTRE MOIS. La banque dit le 31 août ; le budget peut
// dire septembre. La date ne bouge jamais — c'est le calcul qui la range ailleurs, et
// il doit la ranger ailleurs PARTOUT : enveloppes, totaux, chaîne de soldes,
// dépassements. Une dépense comptée dans deux mois différents selon la colonne serait
// pire que pas de rattachement du tout.

const courses: Group = {
  id: 1, accountId: "a1", name: "Courses", direction: "out", monthlyAmount: 100, lines: [],
};
const MOIS = ["2026-08", "2026-09"];

function tx(p: Partial<Txn>): Txn {
  return { id: "t", date: "2026-08-31", amount: -40, label: "MONOPRIX", accountId: "a1", groupId: 1, ...p };
}

const hist = (txns: Txn[]) => {
  const { dated, datedLines } = seedDated([courses]);
  return computeHistory([courses], txns, MOIS, "2026-09", mergeDated(dated), datedLines);
};

describe("une dépense rattachée au mois suivant", () => {
  it("quitte le mois de sa date et arrive dans celui qu'on a choisi", () => {
    const avant = hist([tx({})]);
    expect(avant[0].rows[0].cells[0].depense).toBe(40);
    expect(avant[0].rows[0].cells[1].depense).toBe(0);

    const apres = hist([tx({ budgetMonth: "2026-09" })]);
    expect(apres[0].rows[0].cells[0].depense).toBe(0);
    expect(apres[0].rows[0].cells[1].depense).toBe(40);
  });

  it("emporte sa ligne avec elle : elle se lit sous le mois de rattachement", () => {
    const sections = hist([tx({ budgetMonth: "2026-09" })]);
    expect(sections[0].rows[0].txns.map((t) => [t.date, t.month])).toEqual([["2026-08-31", "2026-09"]]);
  });

  it("déplace aussi le solde : le mois d'août ne la voit plus passer", () => {
    const sections = hist([tx({ budgetMonth: "2026-09" })]);
    const solde = computeSolde(sections, MOIS, "2026-09", 1000, 1000);
    // Août ne bouge plus, septembre porte les 40 euros.
    expect(solde.closings[0]).toBe(solde.openings[0]);
    expect(solde.closings[1]).toBe(solde.openings[1] - 40);
  });

  it("dépasse le budget du mois où on la range, pas de celui de sa date", () => {
    const { dated, datedLines } = seedDated([courses]);
    const over = computeOverspends(
      [courses], [tx({ amount: -150, budgetMonth: "2026-09" })], "2026-09", mergeDated(dated), datedLines,
    );
    expect(over.byMonth["2026-08"] ?? []).toEqual([]);
    expect((over.byMonth["2026-09"] ?? []).map((o) => o.amount)).toEqual([50]);
  });

  it("fait exister le mois de rattachement dans la frise", () => {
    // Sans ça, une opération rangée dans un mois où rien d'autre ne s'est passé
    // n'aurait aucune colonne où s'afficher.
    expect(monthsWithData([tx({ budgetMonth: "2026-12" })])).toEqual(["2026-12"]);
  });

  it("ne suit pas un poste qui ne vit pas le mois de rattachement", () => {
    // Le groupe s'arrête en août : la dépense rangée en septembre n'a plus de poste
    // et retombe chez les non catégorisés, comme n'importe quelle dépense orpheline.
    const borne: Group = { ...courses, startMonth: "2026-08", endMonth: "2026-08" };
    const { dated, datedLines } = seedDated([borne]);
    const sections = computeHistory([borne], [tx({ budgetMonth: "2026-09" })], MOIS, "2026-09", mergeDated(dated), datedLines);
    expect(sections.find((s) => s.kind === "expense")?.rows[0].cells[1].depense ?? 0).toBe(0);
    expect(sections.find((s) => s.kind === "uncategorized")?.totals[1].depense).toBe(40);
  });
});
