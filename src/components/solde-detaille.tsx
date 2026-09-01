"use client";
import { createContext, useContext, useState } from "react";
import { Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";

// DÉTAILLER LES MOUVEMENTS DE SOLDE. Un seul réglage, deux endroits éloignés : le
// bouton vit dans la barre d'outils au-dessus de la frise, à côté du détail du
// calcul, et le tableau qui obéit vit sous la frise. Trop loin l'un de l'autre pour
// se passer un état par les props — d'où ce fournisseur, qui ne porte qu'un booléen.
//
// Ce que le réglage répare : dans les colonnes de solde, une case rouge veut dire
// soit « cette ligne retranche », soit « le solde est négatif », et rien ne distingue
// les deux quand ils tombent ensemble. Détaillé, le mouvement se lit au-dessus et le
// solde signé en dessous. Le tableau y gagne en hauteur, ce qui est le prix à payer :
// d'où un choix, et pas une imposition.

type Ctx = { detaille: boolean; basculer: (v: boolean) => void };

const SoldeDetailleContext = createContext<Ctx | null>(null);

/** Rend `null` là où personne n'a monté le fournisseur : au tableau de se débrouiller. */
export function useSoldeDetailleOptional(): Ctx | null {
  return useContext(SoldeDetailleContext);
}

export function SoldeDetailleProvider({ children }: { children: React.ReactNode }) {
  const [detaille, setDetaille] = useState(false);
  return (
    <SoldeDetailleContext.Provider value={{ detaille, basculer: setDetaille }}>
      {children}
    </SoldeDetailleContext.Provider>
  );
}

// Le bouton, à poser dans la barre d'outils. Allumé, il porte la sarcelle pleine :
// c'est un état qui dure, pas une commande qu'on lance — et il faut pouvoir dire d'un
// coup d'œil pourquoi le tableau a doublé de hauteur.
export function SoldeDetailleToggle() {
  const etat = useSoldeDetailleOptional();
  if (!etat) return null;
  return (
    <Button
      type="button"
      size="sm"
      variant={etat.detaille ? "default" : "outline"}
      aria-pressed={etat.detaille}
      onClick={() => etat.basculer(!etat.detaille)}
    >
      <Rows3 />
      Détailler les mouvements de solde
    </Button>
  );
}
