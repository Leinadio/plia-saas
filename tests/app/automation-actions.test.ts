import { beforeEach, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/pg";
import { dbFrom, type Db } from "../../src/db/pg";
const context = vi.hoisted(() => ({
  db: null as Db | null,
  user: "u",
  refresh: vi.fn(),
}));
vi.mock("../../src/lib/current-user", () => ({
  pourMoi: <T>(fn: (db: Db, userId: string) => Promise<T>) =>
    context.db!.pourUtilisateur(context.user, (d) => fn(d, context.user)),
}));
vi.mock("next/cache", () => ({ revalidatePath: context.refresh }));
import {
  saveAutomationRule,
  previewAutomationRule,
  applyAutomationPreview,
} from "../../src/app/app/automatisations/actions";
import { addTransaction } from "../../src/app/app/transactions/actions";
import { appNotifications } from "../../src/lib/app-notifications";
const input = {
  accountId: "a",
  label: "carrefour",
  direction: "out" as const,
  minAmount: null,
  maxAmount: null,
  groupId: 1,
  lineId: null,
};
beforeEach(async () => {
  context.user = "u";
  context.db = dbFrom(await createTestDb());
  context.refresh.mockClear();
  await context.db.run(
    "INSERT INTO accounts(id,name,balance,currency,user_id) VALUES('a','Courant',1000,'EUR','u')",
  );
  await context.db.run(
    "INSERT INTO groups(id,account_id,name,direction) VALUES(1,'a','Courses','out')",
  );
  await context.db.run(
    "INSERT INTO onboarding_status(user_id,demo_active) VALUES('u',false)",
  );
});
it("refuse les écritures en démonstration", async () => {
  await context.db!.run("UPDATE onboarding_status SET demo_active=true");
  expect(await saveAutomationRule(input)).toMatchObject({ ok: false });
  expect(await context.db!.all("SELECT * FROM automation_rules")).toHaveLength(
    0,
  );
});
it("refuse un compte étranger et masque les détails techniques", async () => {
  context.user = "v";
  await context.db!.run(
    "INSERT INTO onboarding_status(user_id,demo_active) VALUES('v',false)",
  );
  expect(await saveAutomationRule(input)).toMatchObject({ ok: false });
});
it("création → aperçu → application rafraîchit aussi les notifications du shell", async () => {
  const r = await saveAutomationRule(input);
  if (!r.ok) throw Error(r.error);
  await context.db!.run(
    "INSERT INTO transactions(id,account_id,date,amount,label) VALUES('t','a','2026-09-17',-42,'CARREFOUR')",
  );
  const p = await previewAutomationRule(r.data.id);
  if (!p.ok) throw Error(p.error);
  expect(
    await applyAutomationPreview(r.data.id, p.data.revision, ["t"]),
  ).toEqual({ ok: true, data: 1 });
  expect(context.refresh).toHaveBeenCalledWith("/app", "layout");
  expect(
    (await appNotifications()).filter((n) => n.kind === "automation"),
  ).toHaveLength(1);
});
it("une nouvelle saisie sans budget bénéficie des règles et de sa notification", async () => {
  await saveAutomationRule(input);
  await addTransaction({
    accountId: "a",
    date: "2026-09-17",
    amount: 42,
    label: "CARREFOUR",
    direction: "out",
    groupId: null,
    lineId: null,
  });
  expect(await context.db!.all("SELECT group_id FROM transactions")).toEqual([
    { group_id: 1 },
  ]);
  expect(await context.db!.all("SELECT * FROM automation_events")).toHaveLength(
    1,
  );
});
