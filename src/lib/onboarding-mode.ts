export type OnboardingMode = "automatic-demo" | "replay-demo" | "real";

export function wantsReplay(cookieValue: string | undefined): boolean {
  return cookieValue === "1";
}

export function resolveOnboardingMode(input: {
  completed: boolean;
  replayCookie: boolean;
}): OnboardingMode {
  if (!input.completed) return "automatic-demo";
  return input.replayCookie ? "replay-demo" : "real";
}

export function isDemoMode(mode: OnboardingMode): boolean {
  return mode !== "real";
}
