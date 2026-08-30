import { redirect } from "next/navigation";

export default async function DashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string | string[]; imported?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (typeof params.connected === "string") query.set("connected", params.connected);
  if (typeof params.imported === "string") query.set("imported", params.imported);

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  redirect(`/app/historique${suffix}`);
}
