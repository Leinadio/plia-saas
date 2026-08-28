import { cookies } from "next/headers";
import { isOnboardingComplete } from "../db/repositories/onboarding-status";
import { pourMoi } from "./current-user";
import { resolveOnboardingMode, wantsReplay, type OnboardingMode } from "./onboarding-mode";

export const ONBOARDING_REPLAY_COOKIE = "plia_onboarding_replay";

export async function currentOnboardingCompletion(): Promise<boolean> {
  return pourMoi((database, userId) => isOnboardingComplete(database, userId));
}

export async function currentOnboardingMode(): Promise<OnboardingMode> {
  const completed = await currentOnboardingCompletion();
  const cookie = (await cookies()).get(ONBOARDING_REPLAY_COOKIE);
  return resolveOnboardingMode({ completed, replayCookie: wantsReplay(cookie?.value) });
}
