import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { DetailSidebarProvider } from "@/components/detail-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationsButton } from "@/components/notifications-button";
import { SyncButton } from "@/components/sync-button";
import { appNotifications } from "@/lib/app-notifications";

// Le shell de l'application, et le seul point de passage vers elle. Tout ce qui vit
// sous /app traverse ce fichier, donc une seule vérification suffit là où il en
// faudrait une par page. Ce qui est en dehors reste public : la landing et l'écran
// de connexion n'ont ni barre latérale ni session.
//
// ATTENTION. Cette porte dit qui entre. Elle ne dit pas ce que chacun voit. Les
// requêtes du budget ne filtrent encore sur personne, donc deux comptes connectés
// liraient les mêmes données. C'est le chantier suivant et il touche 79 fonctions.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/connexion");
  const notifications = appNotifications(session.user.id);
  // La sidebar de detail (droite) englobe le shell : elle occupe sa propre colonne,
  // donc l'en-tete et le contenu se retrecissent a son ouverture.
  return (
    <DetailSidebarProvider>
      {/* flex-1 min-w-0 : le shell de gauche est une colonne de la rangee
          exterieure ; sans lui il ne se retrecit pas quand le detail s'ouvre. */}
      <SidebarProvider className="h-svh min-w-0 flex-1 overflow-hidden">
        <AppSidebar user={{ name: session.user.name || session.user.email, email: session.user.email }} />
        {/* min-w-0 : sans lui, un contenu large (grand tableau) empeche l'inset
            de retrecir sous sa taille min-content et deborde sous la sidebar.
            mr-0 quand le detail est ouvert : son p-2 fait deja l'ecart.
            overflow-hidden : clippe le contenu aux coins arrondis de la carte. */}
        {/* lg et non md : sous 1024 le panneau de détail passe PAR-DESSUS le contenu
            (voir DetailSidebarProvider). La carte doit alors garder sa marge de
            droite, sinon elle se colle au bord de l'écran dès qu'un montant est
            ouvert. */}
        <SidebarInset className="min-w-0 overflow-hidden lg:group-data-[detail=open]/detail:mr-0">
          {/* shrink-0 : l'en-tete reste en place, c'est le contenu qui defile.
              Pas de fond propre : il laisse voir celui de la carte. Avec bg-card
              il etait de la meme couleur que le shell, ce qui masquait les coins
              arrondis de la carte. */}
          <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2 sm:px-4">
            <SidebarTrigger />
            {/* ml-auto : les deux boutons se posent à droite de l'en-tête, à
                l'opposé de l'ouverture du menu. Rafraîchir d'abord, puis ce que le
                rafraîchissement a pu faire apparaître. */}
            <div className="ml-auto flex items-center gap-2">
              <SyncButton />
              <NotificationsButton items={notifications} />
            </div>
          </header>
          {/* Marges resserrées sur téléphone : 24 px de chaque côté, c'est un sixième
              d'un écran de 375 px pris sur des tableaux de chiffres. */}
          <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DetailSidebarProvider>
  );
}
