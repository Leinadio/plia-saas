"use server";

import { revalidatePath } from "next/cache";
import {
  finishDemoGuide,
  saveDemoVisit,
  setDemoActive,
} from "@/db/repositories/onboarding-status";
import { freshTourVisit, reduceTour, type TourVisit } from "@/lib/onboarding-tour";
import { pourMoi } from "@/lib/current-user";

const destination = "/app/historique" as const;

function revalidateApp(): void {
  revalidatePath("/app", "layout");
}

export async function toggleDemo(active: boolean): Promise<{ destination: typeof destination }> {
  await pourMoi((database, userId) => setDemoActive(database, userId, active));
  revalidateApp();
  return { destination };
}

export async function persistDemoVisit(visit: TourVisit): Promise<void> {
  await pourMoi((database, userId) => saveDemoVisit(database, userId, visit));
}

export async function restartDemoGuide(): Promise<{
  destination: typeof destination;
  visit: TourVisit;
}> {
  const visit = freshTourVisit();
  await pourMoi(async (database, userId) => {
    await setDemoActive(database, userId, true);
    await saveDemoVisit(database, userId, visit);
  });
  revalidateApp();
  return { destination, visit };
}

export async function finishOnboarding(visit?: TourVisit): Promise<{ destination: typeof destination }> {
  const base = visit ?? freshTourVisit();
  const finished = base.tour.finished
    ? base
    : { ...base, tour: reduceTour(base.tour, { type: "FINISH" }) };
  await pourMoi((database, userId) => (
    finishDemoGuide(database, userId, finished, new Date().toISOString())
  ));
  revalidateApp();
  return { destination };
}
