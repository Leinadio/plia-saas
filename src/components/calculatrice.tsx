"use client";
import { createContext, useCallback, useContext, useState, useSyncExternalStore } from "react";
import { Calculator } from "lucide-react";
import {
  CLE_BROUILLON, ecrireBrouillon, lireBrouillon,
  type LigneCalcul, type MontantAttrape, type Position,
} from "@/lib/calculatrice";
import { CalculatriceFenetre } from "@/components/calculatrice-fenetre";
import { cn } from "@/lib/utils";

// LA CALCULATRICE DE BROUILLON : son état, et la porte pour l'ouvrir.
//
// Elle vit au niveau du shell, pas dans une page : on attrape un montant dans
// l'Historique, on va voir le tableau de bord, on en attrape un autre, et le
// ruban est toujours là. Une calculatrice qui se viderait en changeant d'écran
// ne servirait à rien — c'est justement d'un écran à l'autre qu'on compare.
//
// Rien de ce qu'elle contient ne touche au budget. Aucun calcul de l'app ne la
// lit ; elle ne sait qu'additionner ce qu'on lui donne.

// --- Le brouillon, gardé dans le navigateur ---------------------------------
// C'est le STOCKAGE qui porte la vérité, pas un état React. Deux raisons.
//
// D'abord l'hydratation : le serveur ne connaît pas le stockage du navigateur.
// Un état initialisé en le lisant donnerait deux rendus différents des deux
// côtés, et React refuserait le raccord. useSyncExternalStore sait exactement
// dire ça — « rien du côté serveur, ceci du côté navigateur » — et c'est ce à
// quoi il sert.
//
// Ensuite la simplicité : une seule source, écrite d'un côté et relue de
// l'autre, plutôt qu'un état à tenir en phase avec un stockage par un effet.
const VIDE: LigneCalcul[] = [];
const abonnes = new Set<() => void>();
// getSnapshot doit rendre la MÊME référence tant que rien n'a changé, sinon React
// se croit en retard et boucle. D'où ce cache, indexé sur le texte brut.
let brutEnCache: string | null = null;
let lignesEnCache: LigneCalcul[] = VIDE;

function sAbonner(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

function lireLignes(): LigneCalcul[] {
  const brut = window.localStorage.getItem(CLE_BROUILLON);
  if (brut !== brutEnCache) {
    brutEnCache = brut;
    lignesEnCache = lireBrouillon(brut);
  }
  return lignesEnCache;
}

function ecrireLignes(lignes: LigneCalcul[]): void {
  window.localStorage.setItem(CLE_BROUILLON, ecrireBrouillon(lignes));
  for (const f of abonnes) f();
}

type Ctx = {
  ouverte: boolean;
  ouvrir: () => void;
  fermer: () => void;
  lignes: LigneCalcul[];
  ajouter: (m: MontantAttrape) => void;
  modifier: (id: string, champs: Partial<LigneCalcul>) => void;
  retirer: (id: string) => void;
  vider: () => void;
  position: Position | null;
  poser: (p: Position) => void;
};

const CalculatriceContext = createContext<Ctx | null>(null);

export function useCalculatrice(): Ctx {
  const ctx = useContext(CalculatriceContext);
  if (!ctx) throw new Error("useCalculatrice doit être utilisé dans <CalculatriceProvider>");
  return ctx;
}

export function CalculatriceProvider({ children }: { children: React.ReactNode }) {
  const [ouverte, setOuverte] = useState(false);
  // La position ne se garde pas d'une visite à l'autre : où l'on pose la fenêtre
  // dépend de ce qu'on regarde à ce moment-là, pas d'une préférence.
  const [position, setPosition] = useState<Position | null>(null);
  const lignes = useSyncExternalStore(sAbonner, lireLignes, () => VIDE);

  const ajouter = useCallback((m: MontantAttrape) => {
    ecrireLignes([
      ...lireLignes(),
      { id: crypto.randomUUID(), libelle: m.libelle, montant: m.montant, operateur: "+" },
    ]);
    setOuverte(true);
  }, []);

  const modifier = useCallback((id: string, champs: Partial<LigneCalcul>) => {
    ecrireLignes(lireLignes().map((x) => (x.id === id ? { ...x, ...champs } : x)));
  }, []);

  const retirer = useCallback((id: string) => {
    ecrireLignes(lireLignes().filter((x) => x.id !== id));
  }, []);

  const vider = useCallback(() => ecrireLignes([]), []);

  return (
    <CalculatriceContext.Provider
      value={{
        ouverte,
        ouvrir: () => setOuverte(true),
        fermer: () => setOuverte(false),
        lignes, ajouter, modifier, retirer, vider,
        position, poser: setPosition,
      }}
    >
      {children}
      {ouverte && <CalculatriceFenetre />}
    </CalculatriceContext.Provider>
  );
}

// Le bouton de la barre produit. Il porte le compte de lignes du brouillon : une
// calculatrice fermée sur un calcul en cours doit le dire, sinon on la rouvre
// pour rien ou, pire, on oublie qu'on avait commencé.
export function CalculatriceButton() {
  const { ouverte, ouvrir, fermer, lignes } = useCalculatrice();
  return (
    <button
      type="button"
      onClick={() => (ouverte ? fermer() : ouvrir())}
      aria-pressed={ouverte}
      title="Calculatrice de brouillon"
      className={cn(
        "relative flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[0.8125rem] font-semibold transition-colors duration-150 sm:px-2.5",
        ouverte
          ? "bg-sarcelle-voile text-sarcelle-encre"
          : "text-barre-texte hover:bg-barre-appui hover:text-foreground",
      )}
    >
      <Calculator className="size-4 shrink-0" />
      <span className="hidden lg:inline">Calculatrice</span>
      {/* Le compte des lignes en attente : sarcelle et non rouge, parce qu'un
          brouillon en cours n'est pas une alerte. */}
      {lignes.length > 0 && (
        <span className="bg-sarcelle flex min-w-[1.125rem] items-center justify-center rounded-full px-1.5 text-[0.6875rem] leading-[1.125rem] font-bold text-white">
          {lignes.length}
        </span>
      )}
    </button>
  );
}
