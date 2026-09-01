"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { Bell, CheckCheck, Undo2 } from "lucide-react";
import { notificationsByMonth, unseenIds, type Notification } from "@/lib/notifications";
import { monthLabel } from "@/lib/transactions-view";
import { dismissAllNotifications, restoreNotifications } from "@/app/app/notifications-actions";
import { OverspendNotice } from "@/components/overspend-notice";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useMiseAJour } from "@/components/mise-a-jour";

// LES DÉPASSEMENTS : le panneau qui les liste, et les deux portes qui l'ouvrent.
//
// Un bandeau par montant dépassé. Dans le shell et non plus au-dessus du tableau
// de l'Historique : ces alertes valent pour toute l'app et pour tous les comptes,
// alors que le bandeau d'avant ne parlait que du compte affiché et n'existait que
// sur une page. Un dépassement est un constat, pas une question — il n'y a rien à
// y faire, seulement à le savoir ; relever un budget se fait à la main, dans les
// cases des mois concernés.
//
// Un dépassement acquitté ne quitte pas ce panneau : il y reste en gris. Le faire
// disparaître effaçait la seule trace de ce qui s'est passé ce mois-ci, alors que
// « vu » veut dire « je sais », pas « ça n'a pas eu lieu ». Seul le compteur des
// portes ne retient que ce qui reste à voir : c'est lui l'alerte.
//
// LE PANNEAU VIT AU-DESSUS DE SES PORTES, pas dedans. Il s'ouvre depuis la barre
// sur grand écran et depuis la roue flottante sur téléphone, et ces deux endroits
// sont trop loin l'un de l'autre dans l'arbre pour partager un état autrement.
// Une porte n'est qu'un bouton qui dit « ouvre » ; ce qui est marqué comme vu ne
// dépend pas de par où l'on est entré.

type Ctx = {
  /** Ce qui reste à voir. C'est ce nombre-là que les portes affichent. */
  restants: number;
  ouvrir: () => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

/** Rend `null` là où il n'y a pas de dépassements à montrer — la démo. */
export function useNotificationsOptional(): Ctx | null {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({
  items,
  children,
}: {
  /** `null` en démonstration : il n'y a alors ni panneau ni porte. */
  items: Notification[] | null;
  children: React.ReactNode;
}) {
  const { pendant, enCours } = useMiseAJour();
  const [ouvert, setOuvert] = useState(false);
  // Ce qu'on vient de changer à l'écran, sans attendre le serveur : le clic doit se
  // voir tout de suite. Une table id → vu, et non deux ensembles, parce que le geste
  // va dans les deux sens. Le rafraîchissement qui suit ramène la même chose depuis la
  // base, et la table devient redondante sans jamais contredire.
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const marquer = (ids: string[], vu: boolean) =>
    setLocal((cur) => ({ ...cur, ...Object.fromEntries(ids.map((id) => [id, vu])) }));

  // Le lot acquitté d'un seul geste, tant que le panneau reste ouvert : c'est lui que
  // « Annuler » rétablit. Fermer le panneau l'oublie — un retour en arrière se propose
  // dans la foulée du geste, pas trois écrans plus tard.
  const [dernierLot, setDernierLot] = useState<string[] | null>(null);

  const affichees = (items ?? []).map((n) => (n.id in local ? { ...n, seen: local[n.id] } : n));
  const restants = unseenIds(affichees);
  const parMois = notificationsByMonth(affichees);

  const ouvrir = useCallback(() => setOuvert(true), []);
  const valeur: Ctx | null = items ? { restants: restants.length, ouvrir } : null;

  const toutVoir = () => {
    const lot = restants;
    marquer(lot, true);
    setDernierLot(lot);
    pendant(() => dismissAllNotifications(lot));
  };

  const annuler = () => {
    const lot = dernierLot ?? [];
    marquer(lot, false);
    setDernierLot(null);
    pendant(() => restoreNotifications(lot));
  };

  return (
    <NotificationsContext.Provider value={valeur}>
      {children}
      {items && (
        <Sheet
          open={ouvert}
          onOpenChange={(o) => {
            setOuvert(o);
            if (!o) setDernierLot(null);
          }}
        >
          <SheetContent side="right" className="w-full gap-0 sm:max-w-sm">
            <SheetHeader className="border-b">
              <SheetTitle>Dépassements</SheetTitle>
              <SheetDescription>
                {affichees.length === 0
                  ? "Aucun budget dépassé."
                  : restants.length === 0
                    ? `${affichees.length} budget${affichees.length > 1 ? "s" : ""} dépassé${affichees.length > 1 ? "s" : ""}, tous vus.`
                    : `${restants.length} à voir sur ${affichees.length} budget${affichees.length > 1 ? "s" : ""} dépassé${affichees.length > 1 ? "s" : ""}.`}
              </SheetDescription>
              {/* Tout acquitter d'un geste : quand une avalanche de dépassements arrive en
                  même temps (un mois qu'on rattrape après coup), les fermer un par un est
                  une corvée sans information.
                  Une fois le geste fait, le même bouton propose de le défaire — à la même
                  place, tant que le panneau reste ouvert. Le reste du temps il s'éteint :
                  il n'y a rien à acquitter ni rien à reprendre. */}
              {dernierLot !== null ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-1 self-start"
                  disabled={enCours}
                  onClick={annuler}
                >
                  <Undo2 className="size-4" />
                  Annuler
                </Button>
              ) : (
                restants.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-1 self-start"
                    disabled={enCours}
                    onClick={toutVoir}
                  >
                    <CheckCheck className="size-4" />
                    Tout marquer comme vu
                  </Button>
                )
              )}
            </SheetHeader>
            <div className="flex flex-col gap-4 overflow-y-auto p-4">
              {parMois.map((groupe) => (
                <div key={groupe.month} className="flex flex-col gap-2">
                  {/* Le mois en tête de son groupe : un dépassement se lit d'abord par
                      « quand ». Même micro-typographie que les étiquettes du tableau. */}
                  <p className="legende">{monthLabel(groupe.month)}</p>
                  {groupe.items.map((n) => (
                    <OverspendNotice
                      key={n.id}
                      id={n.id}
                      name={n.name}
                      month={n.month}
                      amount={n.amount}
                      accountName={n.accountName}
                      seen={n.seen}
                      onDone={() => marquer([n.id], true)}
                      onRestore={() => marquer([n.id], false)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </NotificationsContext.Provider>
  );
}

// La porte de la barre produit, sur grand écran. Sur téléphone c'est la roue
// flottante qui ouvre le même panneau.
export function NotificationsButton() {
  const alertes = useNotificationsOptional();
  if (!alertes) return null;
  return (
    // Un bouton avec son mot, pas une icône seule : « une cloche » ne dit pas de
    // quoi elle parle, et le compte seul encore moins.
    <button
      type="button"
      onClick={alertes.ouvrir}
      className="text-barre-texte hover:bg-barre-appui hover:text-foreground relative inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[0.8125rem] font-semibold transition-colors duration-150 sm:px-2.5"
    >
      <Bell className="size-4" />
      <span>Dépassements</span>
      {/* Le compte de ce qui reste à voir : c'est une rupture, donc c'est
          rouge, et posé contre le mot plutôt que perché sur l'icône — un
          nombre qu'on doit lire ne se met pas en exposant. */}
      {alertes.restants > 0 && (
        <span className="bg-tension flex min-w-[1.125rem] items-center justify-center rounded-full px-1.5 text-[0.6875rem] leading-[1.125rem] font-bold text-white">
          {alertes.restants}
        </span>
      )}
    </button>
  );
}
