"use client";

import { Play } from "lucide-react";
import { useDemoExperience } from "@/components/demo-experience-provider";
import { isDemoMode } from "@/lib/onboarding-mode";

export function DemoStatusBand() {
  const experience = useDemoExperience();
  if (!isDemoMode(experience.mode)) return null;

  return (
    <div className="border-filet bg-sarcelle-voile text-sarcelle-encre flex min-h-9 shrink-0 items-center justify-center gap-2 border-b px-3 text-center text-xs font-semibold sm:text-sm">
      <span>Démonstration</span>
      <span aria-hidden>·</span>
      <span>Aucune donnée réelle</span>
      {experience.tour.paused && !experience.tour.finished && (
        <button
          type="button"
          className="ml-1 inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 underline underline-offset-2"
          onClick={experience.resume}
        >
          <Play className="size-3" aria-hidden />
          Reprendre le guide
        </button>
      )}
    </div>
  );
}
