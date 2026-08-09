"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chercheBanques, type Banque } from "@/lib/banques";

// Choisir sa banque avant d'aller l'autoriser. Un champ de recherche et non une liste
// déroulante : le catalogue français compte 128 entrées dont une bonne moitié de
// caisses régionales aux noms presque identiques, impossibles à distinguer en faisant
// défiler.
//
// Le catalogue est demandé au serveur au premier dépliage, jamais au chargement de la
// page : c'est un appel réseau vers la banque, inutile tant que personne ne veut
// connecter quoi que ce soit.
export function BankPicker() {
  const [ouvert, setOuvert] = useState(false);
  const [banques, setBanques] = useState<Banque[] | null>(null);
  const [recherche, setRecherche] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert || banques !== null) return;
    fetch("/api/aspsps")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast.error(`Catalogue indisponible : ${d.error}`);
          setBanques([]);
        } else setBanques(d.banques);
      })
      .catch(() => {
        toast.error("Catalogue indisponible : le serveur n'a pas répondu.");
        setBanques([]);
      });
  }, [ouvert, banques]);

  async function connecter(b: Banque) {
    setPending(b.name);
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aspspName: b.name, aspspCountry: b.country }),
      });
      const data = await res.json();
      // La suite se passe chez la banque : on quitte l'application pour y valider.
      // assign plutôt qu'une affectation de window.location.href : la règle
      // d'immutabilité de React refuse d'écrire dans un objet global.
      if (data.url) window.location.assign(data.url);
      else {
        toast.error(`Connexion impossible : ${data.error ?? "erreur inconnue"}`);
        setPending(null);
      }
    } catch {
      toast.error("Connexion impossible : le serveur n'a pas répondu.");
      setPending(null);
    }
  }

  if (!ouvert) {
    return (
      <Button className="cursor-pointer" onClick={() => setOuvert(true)}>
        Connecter une banque
      </Button>
    );
  }

  const resultats = banques ? chercheBanques(banques, recherche) : [];

  return (
    <div className="flex max-w-md flex-col gap-3">
      <Input
        autoFocus
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Chercher ma banque (BNP, Crédit Agricole du Languedoc…)"
      />
      {banques === null && <p className="text-muted-foreground text-sm">Chargement du catalogue…</p>}
      {banques !== null && resultats.length === 0 && (
        <p className="text-muted-foreground text-sm">Aucune banque ne correspond.</p>
      )}
      {resultats.length > 0 && (
        // Hauteur bornée et défilement propre : sans recherche la liste fait 128 lignes
        // et pousserait tout le reste de la page hors de l'écran.
        <ul className="max-h-72 divide-y overflow-y-auto rounded-md border">
          {resultats.map((b) => (
            <li key={`${b.country}-${b.name}`}>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => connecter(b)}
                className="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm disabled:opacity-50"
              >
                <span>{b.name}</span>
                {pending === b.name && <span className="text-muted-foreground text-xs">Ouverture…</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="ghost" size="sm" className="self-start cursor-pointer" onClick={() => setOuvert(false)}>
        Annuler
      </Button>
    </div>
  );
}
