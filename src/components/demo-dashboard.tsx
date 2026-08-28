"use client";

import { RecapitulatifCompte } from "@/components/recapitulatif-compte";
import { useDemoExperience } from "@/components/demo-experience-provider";

export function DemoDashboard() {
  const { projection } = useDemoExperience();

  return (
    <RecapitulatifCompte
      recap={projection.dashboard}
      horizonOnboardingTarget="horizon"
      monthProjectionOnboardingTarget="month-projection"
      envelopesOnboardingTarget="envelopes"
    />
  );
}
