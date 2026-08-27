"use client";
import { useEffect, useRef, useState } from "react";
import { GripHorizontal, Plus, Trash2, X } from "lucide-react";
import {
  FORMAT_MONTANT, decoderMontant, positionDansEcran, totalCalcul,
  type OperateurCalcul, type Position,
} from "@/lib/calculatrice";
import { formatEur } from "@/lib/money";
import { useCalculatrice } from "@/components/calculatrice";
import { cn } from "@/lib/utils";

// LA FENÊTRE DE LA CALCULATRICE. Une carte posée par-dessus l'écran, qu'on
// déplace par sa barre de titre, et dans laquelle on laisse tomber les montants
// des cartes du dessous.
//
// Flottante et non ancrée : les enveloppes sont la réserve de montants, et un
// panneau qui rétrécirait la page ferait sortir de l'écran ce qu'on est justement
// venu y prendre. Elle se pousse à l'endroit qui gêne le moins, et elle y reste.
// Elle porte l'ombre longue du monde : c'est la seule surface qui flotte
// vraiment, et c'est ce qui la distingue d'une carte posée dans la page.

const LARGEUR = 320;
// Hauteur retenue pour la garder attrapable, pas pour la contraindre : la fenêtre
// grandit avec ses lignes, mais on ne la laisse jamais descendre si bas que sa
// barre de titre passerait sous le bord de l'écran (cf. positionDansEcran).
const HAUTEUR_GARDE = 260;

// Les trois opérations, dans l'ordre où le bouton les fait tourner.
const SUITE: OperateurCalcul[] = ["+", "-", "×"];
const suivant = (o: OperateurCalcul) => SUITE[(SUITE.indexOf(o) + 1) % SUITE.length];

export function CalculatriceFenetre() {
  const { lignes, ajouter, modifier, retirer, vider, fermer, position, poser } = useCalculatrice();
  const [survol, setSurvol] = useState(false);
  // Décalage entre le coin de la fenêtre et le point saisi : sans lui, la fenêtre
  // saute pour coller son coin sous le curseur au premier pixel de déplacement.
  const prise = useRef<Position | null>(null);
  const boite = useRef<HTMLDivElement>(null);

  // Position de départ : en bas à droite, à l'écart des tableaux qui se lisent de
  // gauche à droite. Posée au montage seulement, jamais réimposée ensuite.
  useEffect(() => {
    if (position) return;
    poser(
      positionDansEcran(
        { x: window.innerWidth - LARGEUR - 24, y: window.innerHeight - HAUTEUR_GARDE - 24 },
        { largeur: LARGEUR, hauteur: HAUTEUR_GARDE },
        { largeur: window.innerWidth, hauteur: window.innerHeight },
      ),
    );
  }, [position, poser]);

  // Le déplacement se fait aux événements de POINTEUR, pas au drag & drop du
  // navigateur : celui-ci est déjà pris par les montants qu'on laisse tomber
  // dedans, et les deux gestes se marcheraient dessus. La capture fait suivre le
  // curseur même quand il sort de la barre de titre.
  const attraper = (e: React.PointerEvent) => {
    const r = boite.current?.getBoundingClientRect();
    if (!r) return;
    prise.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const deplacer = (e: React.PointerEvent) => {
    const p = prise.current;
    if (!p) return;
    poser(
      positionDansEcran(
        { x: e.clientX - p.x, y: e.clientY - p.y },
        { largeur: LARGEUR, hauteur: HAUTEUR_GARDE },
        { largeur: window.innerWidth, hauteur: window.innerHeight },
      ),
    );
  };

  const lacher = () => {
    prise.current = null;
  };

  const deposer = (e: React.DragEvent) => {
    e.preventDefault();
    setSurvol(false);
    const m = decoderMontant(e.dataTransfer.getData(FORMAT_MONTANT));
    // Rien de reconnaissable : on ne fabrique pas de ligne vide. Ce qui tombe ici
    // sans venir d'une case du tableau n'est pas un montant.
    if (m) ajouter(m);
  };

  const total = totalCalcul(lignes);

  return (
    <div
      ref={boite}
      role="dialog"
      aria-label="Calculatrice de brouillon"
      style={{ left: position?.x ?? 0, top: position?.y ?? 0, width: LARGEUR }}
      // invisible tant que la position n'est pas posée : sinon la fenêtre
      // apparaît une fraction de seconde en haut à gauche avant de sauter.
      className={cn(
        "carte shadow-flottante fixed z-50 flex flex-col overflow-hidden",
        !position && "invisible",
        survol && "ring-sarcelle border-sarcelle ring-2",
      )}
      onDragOver={(e) => {
        // Sans preventDefault, le navigateur refuse le dépôt : c'est ce qui dit
        // « ici, on peut lâcher ».
        e.preventDefault();
        setSurvol(true);
      }}
      onDragLeave={() => setSurvol(false)}
      onDrop={deposer}
    >
      {/* La barre de titre : la seule prise sur la fenêtre. */}
      <div
        onPointerDown={attraper}
        onPointerMove={deplacer}
        onPointerUp={lacher}
        onPointerCancel={lacher}
        className="border-filet bg-creuse flex cursor-grab touch-none items-center gap-2 border-b px-3 py-2 active:cursor-grabbing"
      >
        <GripHorizontal className="text-ardoise-claire size-4 shrink-0" aria-hidden />
        <span className="titre-carte">Brouillon</span>
        <button
          type="button"
          onClick={fermer}
          title="Fermer la calculatrice"
          className="text-ardoise hover:bg-survol hover:text-foreground ml-auto flex size-6 cursor-pointer items-center justify-center rounded-md transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="max-h-[50vh] overflow-y-auto px-3 py-2">
        {lignes.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Attrape un montant dans une carte et lâche-le ici.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {lignes.map((l, i) => (
              <li key={l.id} className="flex items-center gap-1.5">
                {/* L'opérateur tourne au clic : trois signes, un seul bouton. La
                    première ligne n'a rien au-dessus d'elle — son « fois » ne
                    multiplie rien — mais elle garde le bouton : on réordonne un
                    brouillon en supprimant, et le signe doit survivre. */}
                <button
                  type="button"
                  onClick={() => modifier(l.id, { operateur: suivant(l.operateur) })}
                  title="Changer l'opération"
                  className="border-filet-fort bg-creuse hover:bg-survol flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold"
                  aria-label={`Opération de la ligne ${i + 1} : ${l.operateur}`}
                >
                  {l.operateur}
                </button>
                {/* Le libellé arrive du tableau et se réécrit : c'est un brouillon,
                    on y note « loyer si on déménage » par-dessus le nom du poste. */}
                <input
                  value={l.libelle}
                  onChange={(e) => modifier(l.id, { libelle: e.target.value })}
                  aria-label={`Libellé de la ligne ${i + 1}`}
                  className="focus:border-sarcelle min-w-0 flex-1 border-b border-transparent bg-transparent py-0.5 text-sm outline-none focus-visible:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  value={l.montant}
                  onChange={(e) => modifier(l.id, { montant: Number(e.target.value) || 0 })}
                  aria-label={`Montant de la ligne ${i + 1}`}
                  className="montant focus:border-sarcelle w-20 shrink-0 border-b border-transparent bg-transparent py-0.5 text-right text-[0.8125rem] outline-none focus-visible:outline-none"
                />
                <button
                  type="button"
                  onClick={() => retirer(l.id)}
                  title="Retirer cette ligne"
                  className="text-ardoise-claire hover:text-tension-encre shrink-0 cursor-pointer"
                  aria-label={`Retirer la ligne ${i + 1}`}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Une ligne vide à la main : tout ne vient pas du tableau. Un loyer à venir,
          un devis reçu par courrier, un « et si je mettais 200 de côté ». */}
      <div className="border-filet flex items-center gap-1 border-t px-2 py-1.5">
        <button
          type="button"
          onClick={() => ajouter({ libelle: "", montant: 0 })}
          className="text-ardoise hover:bg-survol hover:text-foreground flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[0.8125rem] font-semibold transition-colors"
        >
          <Plus className="size-3.5" />
          Ligne
        </button>
        {lignes.length > 0 && (
          <button
            type="button"
            onClick={vider}
            className="text-ardoise hover:bg-survol hover:text-foreground flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[0.8125rem] font-semibold transition-colors"
          >
            <Trash2 className="size-3.5" />
            Vider
          </button>
        )}
      </div>

      {/* Le total, en pied creusé : c'est pour lui qu'on ouvre la fenêtre. */}
      <div className="border-filet bg-creuse flex items-baseline justify-between border-t px-3 py-2.5">
        <span className="legende">Total</span>
        <span className={cn("montant text-lg", total < 0 && "text-tension-encre")}>
          {formatEur(total)}
        </span>
      </div>
    </div>
  );
}
