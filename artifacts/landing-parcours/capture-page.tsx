import { notFound } from "next/navigation";
import { DemoHistory } from "@/components/demo-history";
import { DemoExperienceProvider } from "@/components/demo-experience-provider";
import { DetailSidebarProvider } from "@/components/detail-sidebar";
import { CalculatriceProvider } from "@/components/calculatrice";
import { MiseAJourProvider } from "@/components/mise-a-jour";
import { freshTourVisit } from "@/lib/onboarding-tour";

export default function CapturePreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  const visit = freshTourVisit();
  visit.tour.finished = true;
  visit.tour.paused = true;
  return (
    <DemoExperienceProvider mode="replay-demo" initialVisit={visit}>
      <CalculatriceProvider>
        <DetailSidebarProvider>
          <MiseAJourProvider>
            <main className="h-svh overflow-auto bg-background p-4 sm:p-6">
              <DemoHistory />
            </main>
          </MiseAJourProvider>
        </DetailSidebarProvider>
      </CalculatriceProvider>
    </DemoExperienceProvider>
  );
}
