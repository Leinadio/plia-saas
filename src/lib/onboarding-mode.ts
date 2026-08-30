export type OnboardingMode = "automatic-demo" | "replay-demo" | "real";

export function resolveOnboardingMode(input: {
  demoActive: boolean;
  completed: boolean;
}): OnboardingMode {
  if (!input.demoActive) return "real";
  return input.completed ? "replay-demo" : "automatic-demo";
}

export function isDemoMode(mode: OnboardingMode): boolean {
  return mode !== "real";
}
