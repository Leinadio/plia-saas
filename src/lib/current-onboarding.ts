import { readDemoStatus, type DemoStatus } from "../db/repositories/onboarding-status";
import { pourMoi } from "./current-user";
import { resolveOnboardingMode, type OnboardingMode } from "./onboarding-mode";

export type CurrentDemoStatus = DemoStatus & { mode: OnboardingMode };

export async function currentDemoStatus(): Promise<CurrentDemoStatus> {
  const status = await pourMoi((database, userId) => readDemoStatus(database, userId));
  return {
    ...status,
    mode: resolveOnboardingMode({
      demoActive: status.demoActive,
      completed: status.completedAt !== null,
    }),
  };
}

export async function currentOnboardingCompletion(): Promise<boolean> {
  return (await currentDemoStatus()).completedAt !== null;
}

export async function currentOnboardingMode(): Promise<OnboardingMode> {
  return (await currentDemoStatus()).mode;
}
