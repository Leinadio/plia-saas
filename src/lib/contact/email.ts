import { getMailConfig } from "@/lib/prelaunch/email";
import { CONTACT_SUBJECTS, isContactEmail, type ContactInput } from "./input";
export type ContactConfig = {
  apiKey: string;
  from: string;
  to: string;
  origin: string;
};
export function getContactConfig(): ContactConfig | null {
  try {
    const mail = getMailConfig();
    const to = process.env.PLANORA_CONTACT_TO;
    if (!isContactEmail(to) || /[\r\n]/.test(mail.from)) return null;
    const url = new URL(mail.origin);
    if (
      url.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        url.protocol === "http:" &&
        url.hostname === "localhost"
      )
    )
      return null;
    return { ...mail, to: to.trim().toLowerCase() };
  } catch {
    return null;
  }
}
export async function sendContactEmail(
  config: ContactConfig,
  input: ContactInput,
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      reply_to: input.email,
      subject: "Planora — " + CONTACT_SUBJECTS[input.subject],
      text: [
        "Nouveau message depuis le formulaire Planora.",
        "Adresse de réponse déclarée : " + input.email,
        "Sujet : " + CONTACT_SUBJECTS[input.subject],
        input.message,
      ].join("\n\n"),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Le service d’e-mail a refusé l’envoi.");
  const result = await response.json();
  if (typeof result?.id !== "string" || !result.id.trim())
    throw new Error("Envoi non confirmé.");
}
