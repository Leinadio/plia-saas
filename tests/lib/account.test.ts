import { describe, expect, it, test } from "vitest";
import { accountDisplayName, accountLabel, initiales } from "../../src/lib/account";

test("accountDisplayName prefers the alias, falls back to the bank name", () => {
  expect(accountDisplayName({ name: "CIC", custom_name: "Joint" })).toBe("Joint");
  expect(accountDisplayName({ name: "CIC", custom_name: null })).toBe("CIC");
  expect(accountDisplayName({ name: "CIC", custom_name: "" })).toBe("CIC");
});

test("accountLabel appends the masked IBAN when present", () => {
  expect(accountLabel({ name: "CIC", custom_name: "Joint", iban_masked: "…1234" })).toBe("Joint …1234");
  expect(accountLabel({ name: "CIC", custom_name: null, iban_masked: "…1234" })).toBe("CIC …1234");
  expect(accountLabel({ name: "CIC", custom_name: null, iban_masked: null })).toBe("CIC");
});

// LES INITIALES. Le seul endroit de l'app où quelque chose désigne une personne
// est la pastille du menu de compte : une silhouette générique n'y désigne
// personne, deux lettres si.
describe("initiales", () => {
  it("prend la première lettre du prénom et celle du nom", () => {
    expect(initiales("Daniel Dupont")).toBe("DD");
  });

  it("se contente d'une lettre quand il n'y a qu'un mot", () => {
    expect(initiales("Daniel")).toBe("D");
  });

  // Le nom retombe sur l'adresse quand personne n'en a donné : la pastille doit
  // quand même porter quelque chose.
  it("ignore ce qui n'est pas une lettre", () => {
    expect(initiales("daniel.dupont@example.com")).toBe("DD");
  });

  it("ne garde que les deux premiers mots d'un nom qui en compte plus", () => {
    expect(initiales("Jean Paul Marie Dupont")).toBe("JP");
  });

  it("rend une lettre neutre plutôt que rien pour un nom vide", () => {
    expect(initiales("   ")).toBe("?");
  });

  it("met les initiales en capitales et garde les accents", () => {
    expect(initiales("étienne Ålesund")).toBe("ÉÅ");
  });
});
