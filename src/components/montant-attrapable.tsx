"use client";
import { FORMAT_MONTANT, encoderMontant } from "@/lib/calculatrice";
import { formatEur } from "@/lib/money";

// UN MONTANT QU'ON PEUT ATTRAPER et tirer dans la calculatrice de brouillon.
//
// Un composant à lui seul, et marqué client, parce que les tables qui l'affichent
// sont rendues sur le SERVEUR : un gestionnaire d'événement ne traverse pas cette
// frontière, et le poser directement dans une table serveur faisait tomber le
// rendu à chaque passage (« Event handlers cannot be passed to Client Component
// props »).
//
// Seul le montant devient client, pas la table autour : elle n'a aucune
// interactivité et n'a rien à faire dans le paquet envoyé au navigateur.
export function MontantAttrapable({ libelle, montant }: { libelle: string; montant: number }) {
  return (
    <span
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(FORMAT_MONTANT, encoderMontant({ libelle, montant }));
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      {formatEur(montant)}
    </span>
  );
}
