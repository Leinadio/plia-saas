import { pourMoi } from "@/lib/current-user";
import { readDemoStatus } from "@/db/repositories/onboarding-status";
import { listAccounts } from "@/db/repositories/accounts";
import { listGroups } from "@/db/repositories/groups";
import { listRules } from "@/lib/automation-service";
import { accountLabel } from "@/lib/account";
import { AutomationPanel } from "@/components/automation-panel";
export const metadata = { title: "Automatisation — Planora" };
export default async function AutomatisationsPage() {
  const props = await pourMoi(async (db, userId) => {
    const demo = (await readDemoStatus(db, userId)).demoActive;
    if (demo) return { demo, accounts: [], groups: [], initialRules: [] };
    const accounts = (await listAccounts(db, userId)).map((a) => ({
      id: a.id,
      name: accountLabel(a),
    }));
    const groups = await listGroups(db, userId);
    const initialRules = await listRules(db, userId);
    return { demo, accounts, groups, initialRules };
  });
  return <AutomationPanel {...props} />;
}
