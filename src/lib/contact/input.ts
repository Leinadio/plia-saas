export const CONTACT_SUBJECTS = {
  question: "Une question",
  problem: "Un problème rencontré",
  suggestion: "Une idée à partager",
  other: "Autre chose",
} as const;
export type ContactInput = {
  email: string;
  subject: keyof typeof CONTACT_SUBJECTS;
  message: string;
};
export class ContactError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function isContactEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length <= 254 &&
    /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value.trim())
  );
}
export function parseContact(value: unknown): ContactInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ContactError("Vérifiez les informations saisies.");
  const {
    email,
    subject,
    message,
    website = "",
  } = value as Record<string, unknown>;
  if (typeof website !== "string")
    throw new ContactError("Vérifiez les informations saisies.");
  if (website.trim()) return null;
  if (!isContactEmail(email))
    throw new ContactError("Saisissez une adresse e-mail valide.");
  if (typeof subject !== "string" || !Object.hasOwn(CONTACT_SUBJECTS, subject))
    throw new ContactError("Choisissez le sujet de votre message.");
  if (typeof message !== "string" || !message.trim() || message.length > 2000)
    throw new ContactError("Écrivez un message de 1 à 2 000 caractères.");
  return {
    email: email.trim().toLowerCase(),
    subject: subject as ContactInput["subject"],
    message: message.trim(),
  };
}
