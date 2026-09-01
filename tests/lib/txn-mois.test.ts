import { describe, expect, it } from "vitest";
import { moisBudget, moisProposables, rattachementUtile } from "@/lib/txn-mois";

// LE MOIS OÙ UNE TRANSACTION COMPTE. La banque dit quand l'argent est passé ; le
// budget peut dire dans quel mois on veut le compter. Les deux coexistent.

describe("le mois où une transaction compte", () => {
  it("suit la date de la banque quand rien n'a été rattaché", () => {
    expect(moisBudget({ date: "2026-08-31" })).toBe("2026-08");
    expect(moisBudget({ date: "2026-08-31", budgetMonth: null })).toBe("2026-08");
  });

  it("suit le rattachement quand il y en a un", () => {
    expect(moisBudget({ date: "2026-08-31", budgetMonth: "2026-09" })).toBe("2026-09");
  });

  it("ignore un rattachement mal formé plutôt que de fausser un calcul", () => {
    // Une valeur abîmée en base ne doit pas faire disparaître une dépense d'un mois
    // sans la faire apparaître ailleurs : on retombe sur la date.
    expect(moisBudget({ date: "2026-08-31", budgetMonth: "septembre" })).toBe("2026-08");
    expect(moisBudget({ date: "2026-08-31", budgetMonth: "2026-13" })).toBe("2026-08");
    expect(moisBudget({ date: "2026-08-31", budgetMonth: "" })).toBe("2026-08");
  });
});

describe("ce qu'on garde en base comme rattachement", () => {
  it("ne garde rien quand le mois choisi est déjà celui de la date", () => {
    // Sinon une transaction non déplacée traînerait une valeur qui la ferait
    // paraître déplacée, et le jour où sa date changerait, le rattachement
    // fantôme la retiendrait dans l'ancien mois.
    expect(rattachementUtile("2026-08-31", "2026-08")).toBeNull();
  });

  it("garde le mois choisi quand il diffère de la date", () => {
    expect(rattachementUtile("2026-08-31", "2026-09")).toBe("2026-09");
    expect(rattachementUtile("2026-09-02", "2026-08")).toBe("2026-08");
  });

  it("efface le rattachement quand on ne choisit rien", () => {
    expect(rattachementUtile("2026-08-31", null)).toBeNull();
  });

  it("refuse un mois qui n'en est pas un", () => {
    expect(rattachementUtile("2026-08-31", "2026-99")).toBeNull();
    expect(rattachementUtile("2026-08-31", "n'importe quoi")).toBeNull();
  });
});

describe("les mois qu'on peut proposer pour une opération", () => {
  it("propose les mois autour de sa date, dans l'ordre", () => {
    // Rattacher, c'est décaler d'un cran ou deux — jamais envoyer une dépense à
    // l'autre bout de l'année. Une liste courte se lit d'un coup d'œil.
    expect(moisProposables("2026-08-31", null, 2)).toEqual([
      "2026-06", "2026-07", "2026-08", "2026-09", "2026-10",
    ]);
  });

  it("passe l'année sans se tromper", () => {
    expect(moisProposables("2026-01-15", null, 1)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });

  it("garde le rattachement en cours même s'il tombe hors de la fenêtre", () => {
    // Sinon le menu n'afficherait pas le mois où l'opération compte réellement, et
    // le premier clic ailleurs l'effacerait sans qu'on l'ait voulu.
    expect(moisProposables("2026-08-31", "2027-03", 1)).toEqual([
      "2026-07", "2026-08", "2026-09", "2027-03",
    ]);
  });

  it("ne double pas le mois quand le rattachement est déjà dans la fenêtre", () => {
    expect(moisProposables("2026-08-31", "2026-09", 1)).toEqual(["2026-07", "2026-08", "2026-09"]);
  });
});
