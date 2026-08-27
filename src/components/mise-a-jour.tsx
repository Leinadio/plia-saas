"use client";
import { createContext, useContext, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// --- CE QUI DIT QU'UNE ÉCRITURE EST EN COURS ---------------------------------
// Toute modification de l'app suit le même chemin : une action serveur écrit en
// base, puis la page entière se recalcule côté serveur — toutes les chaînes de
// solde, tous les mois, tous les totaux. Ça prend une seconde, parfois deux.
//
// Ce temps-là n'était signalé nulle part. Le bouton se réactivait aussitôt son
// action finie, alors que les chiffres à l'écran étaient encore les anciens :
// on voyait un formulaire se fermer, puis rien, puis les montants qui sautaient
// tout seuls. Rien ne disait « ça travaille », donc tout avait l'air cassé.
//
// D'où ce point unique. Un seul useTransition pour toute l'app : il reste en
// cours jusqu'à ce que les NOUVEAUX chiffres soient réellement affichés, pas
// jusqu'à ce que l'écriture soit finie. C'est cette différence qui compte — la
// personne attend de voir son montant, pas que la base l'ait accepté.

type MiseAJour = {
  // Redemander la page au serveur. À utiliser quand l'action a déjà été faite
  // ailleurs (une action serveur appelée par un formulaire, par exemple).
  rafraichir: () => void;
  // Faire le travail ET redemander la page, le tout compté comme une seule
  // attente. La promesse rendue se dénoue quand le travail est fini, pendant
  // que le rafraîchissement, lui, continue de courir.
  pendant: (travail: () => Promise<unknown>) => Promise<void>;
  // Comme `pendant`, mais sans redemander la page : pour les actions serveur qui
  // font déjà revalidatePath. Leur réponse RAMÈNE l'écran refait ; un
  // rafraîchissement par-dessus, c'est un aller-retour complet payé pour rien.
  attendre: (travail: () => Promise<unknown>) => Promise<void>;
  // Vrai tant que quelque chose est en vol.
  enCours: boolean;
};

const Contexte = createContext<MiseAJour | null>(null);

function useMoteur(): MiseAJour {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  return useMemo(
    () => ({
      enCours,
      rafraichir: () => demarrer(() => router.refresh()),
      pendant: (travail) =>
        new Promise<void>((fini) => {
          demarrer(async () => {
            try {
              await travail();
            } finally {
              router.refresh();
              fini();
            }
          });
        }),
      attendre: (travail) =>
        new Promise<void>((fini) => {
          demarrer(async () => {
            try {
              await travail();
            } finally {
              fini();
            }
          });
        }),
    }),
    [enCours, router],
  );
}

export function MiseAJourProvider({ children }: { children: React.ReactNode }) {
  const moteur = useMoteur();
  return <Contexte.Provider value={moteur}>{children}</Contexte.Provider>;
}

// Hors du shell de l'app (l'écran de connexion, la landing), il n'y a pas de
// fournisseur : le composant retombe alors sur son propre moteur, local. Les
// deux crochets sont appelés à chaque rendu, donc l'ordre ne bouge jamais.
export function useMiseAJour(): MiseAJour {
  const partage = useContext(Contexte);
  const local = useMoteur();
  return partage ?? local;
}

// LE FIL D'ATTENTE. Sous la barre produit, un segment sarcelle court d'un bord à
// l'autre tant que le serveur recalcule. Deux pixels, toujours présents : une
// barre qui apparaîtrait décalerait tout l'écran d'un cran à chaque
// enregistrement. Sarcelle et non rouge : ce n'est pas une alerte, c'est une
// machine qui travaille — la couleur de la commande, pas celle d'une rupture.
export function FilDAttente() {
  const { enCours } = useMiseAJour();
  return (
    <div
      role="progressbar"
      aria-label="Mise à jour en cours"
      aria-hidden={!enCours}
      className={cn("bg-filet h-0.5 shrink-0", enCours && "fil-attente")}
    />
  );
}

// LE VOILE D'ATTENTE. Posé sur une carte pendant que ses chiffres se refont :
// ils s'éteignent d'un cran et cessent de répondre au clic, le temps que les
// nouveaux arrivent. Ils restent lisibles — on ne cache pas un montant, on dit
// seulement qu'il n'est plus à jour.
export function VoileDAttente({ children, className }: { children: React.ReactNode; className?: string }) {
  const { enCours } = useMiseAJour();
  return (
    <div
      aria-busy={enCours}
      className={cn(
        "transition-opacity duration-200 motion-reduce:transition-none",
        enCours && "pointer-events-none opacity-55",
        className,
      )}
    >
      {children}
    </div>
  );
}
