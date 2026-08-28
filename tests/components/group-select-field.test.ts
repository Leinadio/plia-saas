// Le menu de rattachement est du balisage : ce qui compte est ce que le navigateur
// reçoit (des optgroup, des titres inertes, des retraits), et aucun test de la
// logique de src/lib ne le prouve. On le rend donc pour de vrai, en statique.
// Vitest tourne en environnement node : renderToStaticMarkup suffit, il n'a pas
// besoin de DOM. Le routeur et l'action serveur sont remplacés, ils ne sont pas
// le sujet ici.
import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const effects = vi.hoisted(() => ({
  setGroup: vi.fn(async () => {}),
  pendant: vi.fn((work: () => Promise<unknown>) => work()),
  setValue: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useMemo: <T,>(create: () => T) => create(),
    useState: <T,>(initial: T): [T, (value: T) => void] => [initial, effects.setValue as (value: T) => void],
  };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
vi.mock("@/app/app/transactions/actions", () => ({ setGroup: effects.setGroup }));
vi.mock("@/components/mise-a-jour", () => ({
  useMiseAJour: () => ({ pendant: effects.pendant, enCours: false }),
}));

const { GroupSelectField, applyGroupSelection } = await import("../../src/components/group-select-field");

const rendu = (groups: Parameters<typeof GroupSelectField>[0]["groups"]) =>
  renderToStaticMarkup(
    createElement(GroupSelectField, { txnId: "t1", groups, defaultGroupId: null, defaultLineId: null }),
  );

const courses = { id: 1, name: "Courses", direction: "out" as const, lines: [] };
const sosh = {
  id: 2, name: "Sosh", direction: "out" as const,
  lines: [{ id: 10, name: "Internet" }],
};
const salaire = { id: 21, name: "Rémunération Principale", direction: "in" as const, lines: [] };

function selectInteractif({
  groups,
  onLocalChange,
}: {
  groups: Parameters<typeof GroupSelectField>[0]["groups"];
  onLocalChange?: (selection: { groupId: number | null; lineId: number | null }) => void;
}) {
  const element = GroupSelectField({
    txnId: "t1",
    groups,
    defaultGroupId: null,
    defaultLineId: null,
    onLocalChange,
  }) as unknown as {
    props: { onChange: (event: { currentTarget: { value: string } }) => void };
  };
  return element.props;
}

describe("GroupSelectField", () => {
  it("déclenche la branche locale depuis le select réel", () => {
    const changes: { groupId: number | null; lineId: number | null }[] = [];
    effects.setGroup.mockClear();
    effects.pendant.mockClear();
    effects.setValue.mockClear();

    selectInteractif({ groups: [sosh], onLocalChange: (selection) => changes.push(selection) })
      .onChange({ currentTarget: { value: "l:10" } });

    expect(changes).toEqual([{ groupId: 2, lineId: 10 }]);
    expect(effects.setValue).toHaveBeenCalledWith("l:10");
    expect(effects.pendant).not.toHaveBeenCalled();
    expect(effects.setGroup).not.toHaveBeenCalled();
  });

  it("déclenche la branche serveur depuis le select réel", () => {
    effects.setGroup.mockClear();
    effects.pendant.mockClear();
    effects.setValue.mockClear();

    selectInteractif({ groups: [courses] }).onChange({ currentTarget: { value: "g:1" } });

    expect(effects.setValue).toHaveBeenCalledWith("g:1");
    expect(effects.pendant).toHaveBeenCalledTimes(1);
    expect(effects.setGroup).toHaveBeenCalledWith("t1", 1, null);
  });

  it("transmet un choix local sans demander de sauvegarde serveur", () => {
    const calls: string[] = [];

    const route = applyGroupSelection({
      selection: { groupId: 1, lineId: null },
      onLocalChange: ({ groupId }) => calls.push(`local:${groupId}`),
      onServerChange: ({ groupId }) => calls.push(`server:${groupId}`),
    });

    expect(route).toBe("local");
    expect(calls).toEqual(["local:1"]);
  });

  it("transmet le choix au serveur sans rappel local", () => {
    const calls: string[] = [];

    const route = applyGroupSelection({
      selection: { groupId: 1, lineId: null },
      onServerChange: ({ groupId }) => calls.push(`server:${groupId}`),
    });

    expect(route).toBe("server");
    expect(calls).toEqual(["server:1"]);
  });

  // Une seule liste de dépenses, comme le tableau : plates et découpées y voisinent,
  // et c'est le titre inerte d'une découpée qui dit qu'on vise ses sous-postes.
  it("réunit les dépenses sous un seul titre", () => {
    const html = rendu([courses, sosh]);
    expect(html).toContain('<optgroup label="Dépenses">');
    expect(html).not.toContain('label="Récurrents"');
    expect(html).not.toContain('label="Enveloppes"');
  });

  it("donne aux rémunérations leur propre section, en tête", () => {
    const html = rendu([courses, sosh, salaire]);
    expect(html).toContain('<optgroup label="Revenus">');
    expect(html.indexOf('label="Revenus"')).toBeLessThan(html.indexOf('label="Dépenses"'));
    // Et elle ne traîne plus au milieu des dépenses.
    expect(html.indexOf("Rémunération Principale")).toBeLessThan(html.indexOf("Courses"));
  });

  it("laisse choisir une dépense plate", () => {
    expect(rendu([courses])).toContain('<option value="g:1">Courses</option>');
  });

  it("affiche le nom d'une dépense découpée en titre inerte, jamais choisissable", () => {
    const html = rendu([sosh]);
    expect(html).toContain('<option value="t:2" disabled="">Sosh</option>');
    expect(html).not.toContain('value="g:2"');
  });

  it("indente les lignes sous leur groupe", () => {
    expect(rendu([sosh])).toContain('<option value="l:10">   › Internet</option>');
  });

  it("garde « Non catégorisé » hors des sections, avec la valeur vide", () => {
    const html = rendu([sosh]);
    expect(html.indexOf('<option value="">Non catégorisé</option>')).toBeLessThan(
      html.indexOf("<optgroup"),
    );
  });
});
