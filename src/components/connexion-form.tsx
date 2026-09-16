"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlanoraMark } from "@/components/planora-mark";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn, signUp } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import styles from "./connexion-form.module.css";

// Le seul écran ouvert à quelqu'un qui n'est pas encore connecté. Un formulaire pour
// deux gestes, parce que ce sont les mêmes champs à un nom près : on s'inscrit ou on
// se connecte, et l'écran bascule sans changer de page.
//
export function ConnexionForm({
  googleAvailable,
  initialError = "",
}: {
  googleAvailable: boolean;
  initialError?: string;
}) {
  const router = useRouter();
  const [inscription, setInscription] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState(initialError);
  const busy = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      busy.current = false;
      setGooglePending(false);
      setPending(false);
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  async function continueWithGoogle() {
    if (!googleAvailable || busy.current) return;
    busy.current = true;
    setGooglePending(true);
    setError("");
    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: "/app",
        errorCallbackURL: "/connexion",
      });
      if (result.error || !result.data?.url)
        throw new Error("Google unavailable");
      // Better Auth effectue la redirection ; garder les commandes bloquées jusque-là.
    } catch {
      setError(
        "La connexion avec Google n’a pas abouti. Tu peux réessayer ou utiliser ton adresse e-mail.",
      );
      setGooglePending(false);
      busy.current = false;
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const res = inscription
        ? await signUp.email({ name: name.trim() || email, email, password })
        : await signIn.email({ email, password });
      if (res.error) {
        setError(
          res.error.message ?? "Connexion impossible. Tu peux réessayer.",
        );
        return;
      }
      toast.success(inscription ? "Compte créé" : "Bienvenue");
      router.push("/app");
      router.refresh();
    } catch {
      setError("La connexion a été interrompue. Tu peux réessayer.");
    } finally {
      setPending(false);
      busy.current = false;
    }
  }

  return (
    // Centré dans l'écran, et pas seulement horizontalement : posée en haut d'une
    // page vide, la carte laissait tout l'écran désert sous elle.
    <div className="planora-workspace app-auth flex min-h-svh items-center justify-center px-6 py-10 sm:px-10">
      <div className="app-auth-layout">
        <div className="app-auth-art" aria-hidden="true">
          <Image
            src="/landing/lumiere-hero-v1.png"
            alt=""
            fill
            sizes="(max-width: 767px) 0px, 50vw"
          />
          <div className="app-auth-welcome">
            <p>
              Vos finances,
              <br />
              plus simplement.
            </p>
          </div>
        </div>
        <div className="app-auth-form">
          <Link href="/" className="flex items-center gap-2.5">
            <PlanoraMark className="size-9 shrink-0" />
            <span className="text-2xl font-bold tracking-[-0.02em]">
              Planora
            </span>
          </Link>
          <Card className="w-full max-w-sm">
            <CardHeader>
              {/* Le titre ne répète pas le bouton : c'est le bouton qui nomme
              l'action, et le titre qui dit où l'on est. */}
              <CardTitle>
                <h1>
                  {inscription
                    ? "Crée ton compte"
                    : "Connecte-toi pour continuer"}
                </h1>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <p
                  className={styles.error}
                  role="alert"
                  tabIndex={-1}
                  ref={errorRef}
                >
                  {error}
                </p>
              )}
              <button
                type="button"
                className={styles.google}
                onClick={continueWithGoogle}
                disabled={!googleAvailable || pending || googlePending}
                aria-busy={googlePending}
                aria-describedby={
                  !googleAvailable ? "google-availability" : undefined
                }
              >
                <Image
                  src="/auth/google.svg"
                  alt=""
                  width={20}
                  height={20}
                  aria-hidden="true"
                />
                {googlePending
                  ? "Redirection vers Google…"
                  : "Continuer avec Google"}
              </button>
              {!googleAvailable && (
                <p id="google-availability" className={styles.availability}>
                  Google sera bientôt disponible. Tu peux utiliser ton adresse
                  e-mail.
                </p>
              )}
              <div className={styles.separator}>ou avec ton adresse e-mail</div>
              <form
                onSubmit={submit}
                className="flex flex-col gap-4"
                aria-busy={pending}
              >
                {inscription && (
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="signup-name" className="font-normal">
                      Nom
                    </Label>
                    <Input
                      id="signup-name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Daniel"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <Label htmlFor="login-email" className="font-normal">
                    Adresse e-mail
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="daniel@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="login-password" className="font-normal">
                    Mot de passe
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete={
                      inscription ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={pending || googlePending}
                  className="cursor-pointer"
                >
                  {pending
                    ? "Un instant…"
                    : inscription
                      ? "Créer mon compte"
                      : "Se connecter"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  disabled={pending || googlePending}
                  onClick={() => setInscription((v) => !v)}
                >
                  {inscription ? "J'ai déjà un compte" : "Créer un compte"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
