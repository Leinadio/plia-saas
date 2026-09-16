import { ConnexionForm } from "@/components/connexion-form";
import { getGoogleProvider, googleAuthError } from "@/lib/google-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion — Planora" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const query = await searchParams;
  const code = Array.isArray(query.error) ? query.error[0] : query.error;
  return (
    <ConnexionForm
      googleAvailable={getGoogleProvider() !== null}
      initialError={googleAuthError(code)}
    />
  );
}
