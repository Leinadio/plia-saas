import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppTopbar } from "@/components/app-topbar";
import { DetailSidebarProvider } from "@/components/detail-sidebar";
import { NotificationsButton } from "@/components/notifications-button";
import { SyncButton } from "@/components/sync-button";
import { appNotifications } from "@/lib/app-notifications";

// Le shell de l'application, et le seul point de passage vers elle. Tout ce qui vit
// sous /app traverse ce fichier, donc une seule vérification suffit là où il en
// faudrait une par page. Ce qui est en dehors reste public : la landing et l'écran
// de connexion n'ont ni bandeau ni session.
//
// ATTENTION. Cette porte dit qui entre. Elle ne dit pas ce que chacun voit. Les
// requêtes du budget ne filtrent encore sur personne, donc deux comptes connectés
// liraient les mêmes données. C'est le chantier suivant et il touche 79 fonctions.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth().api.getSession({ headers: await headers() });
  if (!session) redirect("/connexion");
  const notifications = await appNotifications();
  // Le panneau de détail (droite) englobe le shell : il occupe sa propre colonne,
  // donc la poutre et le contenu se rétrécissent à son ouverture.
  return (
    <DetailSidebarProvider>
      {/* min-w-0 : sans lui, un contenu large (le grand tableau) empêche la colonne
          de rétrécir sous sa taille min-content et déborde sous le panneau.
          overflow-hidden : c'est le contenu qui défile, pas le shell — la poutre
          reste en place. */}
      <div className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopbar user={{ name: session.user.name || session.user.email, email: session.user.email }}>
          <SyncButton />
          <NotificationsButton items={notifications} />
        </AppTopbar>
        {/* Marges resserrées sur téléphone : 12 px de chaque côté, parce que tout
            ce qu'on prendrait de plus serait pris sur des colonnes de chiffres. */}
        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">{children}</div>
      </div>
    </DetailSidebarProvider>
  );
}
