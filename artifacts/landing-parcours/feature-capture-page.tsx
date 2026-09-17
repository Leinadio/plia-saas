import { notFound } from "next/navigation";
import { FeatureCapture } from "./feature-capture";
export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{ scene?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { scene = "budgets" } = await searchParams;
  return <FeatureCapture scene={scene} />;
}
