"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn, signUp } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Le seul écran ouvert à quelqu'un qui n'est pas encore connecté. Un formulaire pour
// deux gestes, parce que ce sont les mêmes champs à un nom près : on s'inscrit ou on
// se connecte, et l'écran bascule sans changer de page.
//
// Ce que cet écran NE fait pas encore : protéger quoi que ce soit. Les données du
// budget n'ont pas de propriétaire tant que la colonne n'existe pas, donc se connecter
// ne change rien à ce qu'on voit. C'est l'étape suivante, et c'est la plus lourde.
export default function ConnexionPage() {
  const router = useRouter();
  const [inscription, setInscription] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = inscription
      ? await signUp.email({ name: name.trim() || email, email, password })
      : await signIn.email({ email, password });
    setPending(false);
    if (res.error) {
      // Le message vient de Better Auth. On le montre tel quel plutôt que d'inventer
      // une phrase qui masquerait la vraie cause.
      toast.error(res.error.message ?? "Connexion impossible");
      return;
    }
    toast.success(inscription ? "Compte créé" : "Bienvenue");
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="flex justify-center py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{inscription ? "Créer un compte" : "Se connecter"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {inscription && (
              <div className="flex flex-col gap-1">
                <Label className="font-normal">Nom</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Daniel" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <Label className="font-normal">Email</Label>
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="daniel@example.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="font-normal">Mot de passe</Label>
              <Input
                type="password"
                required
                minLength={8}
                autoComplete={inscription ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={pending} className="cursor-pointer">
              {inscription ? "Créer mon compte" : "Se connecter"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => setInscription((v) => !v)}
            >
              {inscription ? "J'ai déjà un compte" : "Créer un compte"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
