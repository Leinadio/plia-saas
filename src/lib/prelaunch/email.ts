import { OFFERS, type OfferId } from "./offers";

type MailConfig = { apiKey: string; from: string; origin: string };

export function getMailConfig(): MailConfig {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PLANORA_EMAIL_FROM;
  const publicUrl = process.env.PLANORA_PUBLIC_URL;
  if (!apiKey || !from || !publicUrl) throw new Error("Envoi des confirmations non configuré.");
  const url = new URL(publicUrl);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) {
    throw new Error("PLANORA_PUBLIC_URL doit utiliser HTTPS.");
  }
  return { apiKey, from, origin: url.origin };
}

export async function sendReservationEmail(
  config: MailConfig,
  message: { email: string; offer: OfferId; token: string },
): Promise<void> {
  const offer = OFFERS[message.offer];
  const link = `${config.origin}/reservation/confirmer?token=${encodeURIComponent(message.token)}`;
  const text = [
    "Bonjour,",
    "Un budget plus clair commence ici. Confirmez votre adresse pour réserver votre accès à Planora.",
    `Votre choix : ${offer.name}. ${offer.terms}`,
    "La réservation est gratuite et ne déclenche aucun abonnement. Aucune carte bancaire n’est demandée." + (message.offer === "connected" ? " Les 12 mois du tarif de lancement commencent à l’activation de l’abonnement, pas aujourd’hui." : ""),
    `Confirmer ma réservation : ${link}`,
    "Ce lien est valable 24 heures. Nous vous préviendrons de l’ouverture à cette adresse.",
    "Vous n’avez pas fait cette demande ? Ignorez cet e-mail : rien ne sera confirmé.",
    "À bientôt,\nPlanora",
  ].join("\n\n");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: config.from, to: [message.email], subject: "Confirmez votre réservation Planora", text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Le service d’e-mail a refusé l’envoi.");
  const result = await response.json();
  if (typeof result.id !== "string") throw new Error("Envoi non confirmé par le service d’e-mail.");
}
