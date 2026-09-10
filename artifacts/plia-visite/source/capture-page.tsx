import { notFound } from "next/navigation";
import { AppTopbar } from "@/components/app-topbar";
import { DemoHistory } from "@/components/demo-history";
import { DemoExperienceProvider } from "@/components/demo-experience-provider";
import { DemoStatusBand } from "@/components/demo-status-band";
import { DetailSidebarProvider } from "@/components/detail-sidebar";
import { CalculatriceProvider, CalculatriceButton } from "@/components/calculatrice";
import { MiseAJourProvider, FilDAttente } from "@/components/mise-a-jour";
import { freshTourVisit } from "@/lib/onboarding-tour";

// Temporary recording entry: original demo components, no account or database.
// This route is removed after recording and is never available in production.
export default function VideoPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  const visit = freshTourVisit();
  visit.tour.finished = true;
  visit.tour.paused = true;
  return (
    <DemoExperienceProvider mode="replay-demo" initialVisit={visit}>
      <CalculatriceProvider>
        <DetailSidebarProvider>
          <MiseAJourProvider>
            <div className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
              <AppTopbar user={{ name: "Compte Démo", email: "demo@example.invalid" }} outils={<CalculatriceButton />} />
              <DemoStatusBand />
              <FilDAttente />
              <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
                <DemoHistory />
              </main>
            </div>
          </MiseAJourProvider>
        </DetailSidebarProvider>
      </CalculatriceProvider>
    </DemoExperienceProvider>
  );
}
