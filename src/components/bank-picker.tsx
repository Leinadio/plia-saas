"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader,
  DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
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
  // Le squelette reste au moins une seconde. Le catalogue revient parfois en quelques
  // dizaines de millisecondes, et un squelette qui clignote se lit moins bien que pas
  // de squelette du tout : on saurait qu'il s'est passé quelque chose sans savoir quoi.
  const [delaiEcoule, setDelaiEcoule] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  // Le compte à rebours seulement. La remise à zéro se fait à l'ouverture, dans le
  // gestionnaire du tiroir : écrire un état au corps d'un effet enchaîne un rendu de
  // plus pour rien.
  useEffect(() => {
    if (!ouvert) return;
    const t = setTimeout(() => setDelaiEcoule(true), 1000);
    return () => clearTimeout(t);
  }, [ouvert]);

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

  const charge = banques !== null && delaiEcoule;
  const resultats = charge ? chercheBanques(banques, recherche) : [];

  return (
    // À droite plutôt qu'en bas : le tiroir latéral laisse voir les banques déjà
    // connectées pendant qu'on en cherche une autre.
    <Drawer
      direction="right"
      open={ouvert}
      onOpenChange={(o) => {
        setOuvert(o);
        if (o) setDelaiEcoule(false);
      }}
    >
      <DrawerTrigger asChild>
        <Button className="cursor-pointer">Connecter une banque</Button>
      </DrawerTrigger>
      <DrawerContent>
        {/* Le panneau tient toute la hauteur : la liste défile à l'intérieur, l'en-tête
            et le pied restent en place. */}
        <div className="flex h-full flex-col gap-4 px-4 pb-4">
          <DrawerHeader className="px-0">
            <DrawerTitle>Connecter une banque</DrawerTitle>
            <DrawerDescription>
              Tapez les premières lettres. Vous serez ensuite redirigé vers votre banque
              pour autoriser la lecture de vos comptes.
            </DrawerDescription>
          </DrawerHeader>

          <Input
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="BNP, Crédit Agricole du Languedoc, Boursorama…"
          />

          {!charge && (
            // Des lignes à la place des noms : la liste garde sa forme pendant que le
            // catalogue arrive, plutôt que de sauter d'un texte à une liste.
            <div className="plate flex min-h-0 flex-1 flex-col gap-2 p-3">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          )}
          {charge && resultats.length === 0 && (
            <p className="text-muted-foreground text-sm">Aucune banque ne correspond.</p>
          )}
          {resultats.length > 0 && (
            // flex-1 et min-h-0 : la liste prend la hauteur qui reste et défile
            // dedans. Sans min-h-0 elle refuserait de rétrécir sous son contenu et
            // pousserait le pied du tiroir hors de l'écran.
            <ul className="plate min-h-0 flex-1 divide-y overflow-y-auto">
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

          <DrawerFooter className="px-0">
            <DrawerClose asChild>
              <Button variant="ghost" className="cursor-pointer">Annuler</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
