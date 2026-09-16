import { beforeEach, expect, it } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
import {
  saveRule,
  listRules,
  previewRule,
  applyRulePreview,
  applyNewTransactions,
  setRuleEnabled,
  deleteRule,
  listAutomationNotifications,
} from "../../src/lib/automation-service";
import { type RuleInput } from "../../src/lib/automation";
import { syncAll } from "../../src/enablebanking/sync";
let db: Db;
const input: RuleInput = {
  accountId: "a",
  label: "carrefour",
  direction: "out",
  minAmount: 10,
  maxAmount: 100,
  groupId: 1,
  lineId: null,
};
const asUser = <T>(fn: (d: Db) => Promise<T>) => db.pourUtilisateur("u", fn);
async function txn(id: string, patch: Record<string, unknown> = {}) {
  const t = {
    account_id: "a",
    date: "2026-09-12",
    amount: -42,
    label: "CB CARREFOUR",
    group_id: null,
    line_id: null,
    excluded: false,
    ignored: false,
    ...patch,
  };
  await db.run(
    `INSERT INTO transactions (id,account_id,date,amount,label,group_id,line_id,excluded,ignored) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, ...Object.values(t)],
  );
}
beforeEach(async () => {
  db = dbFrom(await createTestDb());
  await db.run(
    "INSERT INTO accounts(id,name,balance,currency,user_id) VALUES ('a','Courant',1000,'EUR','u'),('b','Autre',1000,'EUR','v'),('c','Épargne',1000,'EUR','u')",
  );
  await db.run(
    "INSERT INTO groups(id,account_id,name,direction,start_month,end_month) VALUES (1,'a','Courses','out','2026-01',null),(2,'b','Secret','out',null,null),(3,'a','Salaire','in',null,null),(4,'c','Autre compte','out',null,null)",
  );
});
it("création sans effet rétroactif, aperçu puis application et notification persistante", async () => {
  await txn("t1");
  const rule = await asUser((d) => saveRule(d, "u", input));
  expect(
    await db.one("SELECT group_id FROM transactions WHERE id=$1", ["t1"]),
  ).toEqual({ group_id: null });
  const preview = await asUser((d) => previewRule(d, "u", rule.id));
  expect(preview.transactions.map((t) => t.id)).toEqual(["t1"]);
  expect(
    await asUser((d) =>
      applyRulePreview(d, "u", rule.id, preview.revision, ["t1"]),
    ),
  ).toBe(1);
  expect(
    await db.one("SELECT group_id FROM transactions WHERE id=$1", ["t1"]),
  ).toEqual({ group_id: 1 });
  expect(await asUser((d) => listAutomationNotifications(d, "u"))).toEqual([
    expect.objectContaining({
      kind: "automation",
      label: "CB CARREFOUR",
      name: "Courses",
      amount: -42,
      seen: false,
    }),
  ]);
  expect(
    await asUser((d) =>
      applyRulePreview(d, "u", rule.id, preview.revision, ["t1"]),
    ),
  ).toBe(0);
  expect(await db.all("SELECT * FROM automation_events")).toHaveLength(1);
});
it("les nouveaux imports suivent la règle une seule fois", async () => {
  await asUser((d) => saveRule(d, "u", input));
  await txn("new");
  expect(await asUser((d) => applyNewTransactions(d, "u", ["new"]))).toBe(1);
  expect(await asUser((d) => applyNewTransactions(d, "u", ["new"]))).toBe(0);
});
it("ne retouche ni les choix existants, ni les exclusions, ni les ignorées", async () => {
  await asUser((d) => saveRule(d, "u", input));
  await txn("assigned", { group_id: 1 });
  await txn("excluded", { excluded: true });
  await txn("ignored", { ignored: true });
  expect(
    await asUser((d) =>
      applyNewTransactions(d, "u", ["assigned", "excluded", "ignored"]),
    ),
  ).toBe(0);
});
it("la première règle créée gagne et les règles en pause ne participent pas", async () => {
  const r1 = await asUser((d) => saveRule(d, "u", input));
  const r2 = await asUser((d) => saveRule(d, "u", { ...input, label: "CB" }));
  await txn("t");
  expect(
    (await asUser((d) => previewRule(d, "u", r2.id))).transactions,
  ).toEqual([]);
  await asUser((d) => setRuleEnabled(d, "u", r1.id, false));
  expect(
    (await asUser((d) => previewRule(d, "u", r2.id))).transactions,
  ).toHaveLength(1);
});
it("refuse un aperçu périmé après modification de la règle", async () => {
  const r = await asUser((d) => saveRule(d, "u", input));
  await txn("t");
  const p = await asUser((d) => previewRule(d, "u", r.id));
  await asUser((d) =>
    saveRule(d, "u", { ...input, label: "CAR" }, r.id, r.revision),
  );
  await expect(
    asUser((d) => applyRulePreview(d, "u", r.id, p.revision, ["t"])),
  ).rejects.toThrow("modifiée");
  expect(await db.all("SELECT * FROM automation_events")).toHaveLength(0);
});
it("applique seulement les opérations montrées et encore admissibles", async () => {
  const r = await asUser((d) => saveRule(d, "u", input));
  await txn("t");
  const p = await asUser((d) => previewRule(d, "u", r.id));
  await txn("arrived-later");
  await db.run("UPDATE transactions SET excluded=true WHERE id='t'");
  expect(
    await asUser((d) => applyRulePreview(d, "u", r.id, p.revision, ["t"])),
  ).toBe(0);
  expect(
    (
      await db.all<{ group_id: number | null }>(
        "SELECT group_id FROM transactions",
      )
    ).every((t) => t.group_id === null),
  ).toBe(true);
});
it("ne réapplique pas automatiquement après un retrait manuel du budget", async () => {
  await asUser((d) => saveRule(d, "u", input));
  await txn("t");
  await asUser((d) => applyNewTransactions(d, "u", ["t"]));
  await db.run("UPDATE transactions SET group_id=null WHERE id='t'");
  expect(await asUser((d) => applyNewTransactions(d, "u", ["t"]))).toBe(0);
});
it("respecte le mois du budget, les dates du budget et celles du sous-poste", async () => {
  await db.run(
    "UPDATE groups SET start_month='2026-10',end_month='2026-11' WHERE id=1",
  );
  await db.run(
    "INSERT INTO group_lines(id,group_id,name,amount,keyword,start_month,end_month) VALUES(1,1,'Supermarché',100,'','2026-10','2026-10')",
  );
  await asUser((d) => saveRule(d, "u", { ...input, lineId: 1 }));
  await txn("september");
  await txn("october");
  await txn("november", { date: "2026-11-01" });
  await db.run(
    "UPDATE transactions SET budget_month='2026-10' WHERE id='october'",
  );
  expect(
    await asUser((d) =>
      applyNewTransactions(d, "u", ["september", "october", "november"]),
    ),
  ).toBe(1);
  expect(
    await db.one(
      "SELECT group_id,line_id FROM transactions WHERE id='october'",
    ),
  ).toEqual({ group_id: 1, line_id: 1 });
});
it.each([
  { groupId: 2 },
  { groupId: 4 },
  { groupId: 3 },
  { lineId: 999 },
  { accountId: "b", groupId: 2 },
])("refuse une destination incohérente ou étrangère %j", async (patch) => {
  await expect(
    asUser((d) => saveRule(d, "u", { ...input, ...patch })),
  ).rejects.toThrow();
});
it("impose un sous-poste quand le budget en contient", async () => {
  await db.run(
    "INSERT INTO group_lines(group_id,name,amount,keyword) VALUES(1,'Alimentation',100,'')",
  );
  await expect(asUser((d) => saveRule(d, "u", input))).rejects.toThrow();
});
it("les politiques de base isolent règles et notifications", async () => {
  const r = await asUser((d) => saveRule(d, "u", input));
  await txn("t");
  await asUser((d) => applyNewTransactions(d, "u", ["t"]));
  await db.pourUtilisateur("v", async (d) => {
    expect(await listRules(d, "v")).toEqual([]);
    expect(await listAutomationNotifications(d, "v")).toEqual([]);
    expect(await d.all("SELECT * FROM automation_rules")).toEqual([]);
    expect(await d.all("SELECT * FROM automation_events")).toEqual([]);
    await expect(previewRule(d, "v", r.id)).rejects.toThrow();
  });
});
it("une suppression ou pause ne change pas les rattachements ni leur historique", async () => {
  const r = await asUser((d) => saveRule(d, "u", input));
  await txn("t");
  await asUser((d) => applyNewTransactions(d, "u", ["t"]));
  await asUser((d) => deleteRule(d, "u", r.id));
  expect(await asUser((d) => listRules(d, "u"))).toEqual([]);
  expect(await asUser((d) => listAutomationNotifications(d, "u"))).toHaveLength(
    1,
  );
  expect(
    await db.one("SELECT group_id FROM transactions WHERE id='t'"),
  ).toEqual({ group_id: 1 });
});
it("conserve le statut vu dans les notifications de rattachement", async () => {
  await asUser((d) => saveRule(d, "u", input));
  await txn("t");
  await asUser((d) => applyNewTransactions(d, "u", ["t"]));
  const [n] = await asUser((d) => listAutomationNotifications(d, "u"));
  await db.run(
    "INSERT INTO dismissed_notifications(user_id,id,dismissed_at) VALUES('u',$1,'2026-09-17')",
    [n.id],
  );
  expect(
    (await asUser((d) => listAutomationNotifications(d, "u")))[0].seen,
  ).toBe(true);
});
it("une erreur de notification annule le rattachement", async () => {
  await asUser((d) => saveRule(d, "u", input));
  await txn("t");
  await db.run(
    "ALTER TABLE automation_events ADD CONSTRAINT simulate_failure CHECK (amount > 0)",
  );
  try {
    await expect(
      asUser((d) => applyNewTransactions(d, "u", ["t"])),
    ).rejects.toThrow();
  } finally {
    await db.run(
      "ALTER TABLE automation_events DROP CONSTRAINT simulate_failure",
    );
  }
  expect(
    await db.one("SELECT group_id FROM transactions WHERE id='t'"),
  ).toEqual({ group_id: null });
});
it("la synchronisation bancaire applique la règle après import, sans doublon", async () => {
  await asUser((d) => saveRule(d, "u", input));
  const ebGet = async <T>(path: string): Promise<T> =>
    (path.includes("/transactions")
      ? {
          transactions: [
            {
              entry_reference: "bank",
              booking_date: "2026-09-12",
              transaction_amount: { amount: "42", currency: "EUR" },
              credit_debit_indicator: "DBIT",
              remittance_information: ["CARREFOUR"],
            },
          ],
        }
      : {}) as T;
  const deps = {
    ebGet,
    accountUids: ["a"],
    accountName: "Courant",
    userId: "u",
  };
  await syncAll(db, deps);
  await syncAll(db, deps);
  expect(
    await db.one("SELECT group_id FROM transactions WHERE id='a::bank'"),
  ).toEqual({ group_id: 1 });
  expect(await db.all("SELECT * FROM automation_events")).toHaveLength(1);
});

it("borne l’aperçu à 200 et traite le reste seulement après un nouvel aperçu", async () => {
  const rule = await asUser((d) => saveRule(d, "u", input));
  await db.run(
    "INSERT INTO transactions(id,account_id,date,amount,label) SELECT 'batch-' || n, 'a','2026-09-01',-42,'CARREFOUR' FROM generate_series(1,201) n",
  );
  const preview = await asUser((d) => previewRule(d, "u", rule.id));
  expect(preview.transactions).toHaveLength(200);
  expect(preview.hasMore).toBe(true);
  expect(
    await asUser((d) =>
      applyRulePreview(
        d,
        "u",
        rule.id,
        preview.revision,
        preview.transactions.map((t) => t.id),
      ),
    ),
  ).toBe(200);
  expect(
    (await asUser((d) => previewRule(d, "u", rule.id))).transactions,
  ).toHaveLength(1);
});
it("n’utilise plus un budget devenu découpé sans sous-poste choisi", async () => {
  await asUser((d) => saveRule(d, "u", input));
  await db.run(
    "INSERT INTO group_lines(group_id,name,amount,keyword) VALUES(1,'Alimentation',100,'')",
  );
  await txn("t");
  expect(await asUser((d) => applyNewTransactions(d, "u", ["t"]))).toBe(0);
});
it("la base refuse elle aussi un budget d’un autre compte dans une règle", async () => {
  await expect(
    asUser((d) =>
      d.run(
        "INSERT INTO automation_rules(account_id,label,direction,group_id) VALUES('a','Carrefour','out',4)",
      ),
    ),
  ).rejects.toThrow();
});
it("conserve une affectation manuelle réalisée pendant l’attente bancaire", async () => {
  await asUser((d) => saveRule(d, "u", input));
  await db.run(
    "INSERT INTO groups(id,account_id,name,direction) VALUES(5,'a','Choix manuel','out')",
  );
  let booked = false;
  const ebGet = async <T>(path: string): Promise<T> =>
    (path.includes("/transactions")
      ? {
          transactions: [
            {
              entry_reference: "bank",
              status: booked ? "BOOK" : "PDNG",
              booking_date: "2026-09-12",
              transaction_amount: { amount: "42", currency: "EUR" },
              credit_debit_indicator: "DBIT",
              remittance_information: ["CARREFOUR"],
            },
          ],
        }
      : {}) as T;
  const deps = {
    ebGet,
    accountUids: ["a"],
    accountName: "Courant",
    userId: "u",
  };
  await syncAll(db, deps);
  const row = await db.one<{ pending_transactions: Record<string, unknown>[] }>(
    "SELECT pending_transactions FROM accounts WHERE id=$1",
    ["a"],
  );
  await db.run(
    "UPDATE accounts SET pending_transactions=$1::jsonb WHERE id=$2",
    [
      JSON.stringify(
        row!.pending_transactions.map((t) => ({ ...t, groupId: 5 })),
      ),
      "a",
    ],
  );
  booked = true;
  await syncAll(db, deps);
  expect(
    await db.one("SELECT group_id FROM transactions WHERE id=$1", ["a::bank"]),
  ).toEqual({ group_id: 5 });
  expect(await db.all("SELECT * FROM automation_events")).toHaveLength(0);
});
