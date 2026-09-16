export const OFFERS = {
  manual: {
    name: "Sans connexion bancaire",
    price: "9,90",
    terms: "9,90 € par mois à l’ouverture de votre abonnement.",
    description: "Vous saisissez vos opérations. Planora vous aide à voir la suite.",
  },
  connected: {
    name: "Avec connexion bancaire",
    price: "19,90",
    terms: "19,90 € par mois pendant les 12 premiers mois d’abonnement, puis 29 € par mois.",
    description: "Vos opérations se synchronisent. Votre budget suit votre quotidien.",
  },
} as const;

export type OfferId = keyof typeof OFFERS;
export type ReservationInput = { email: string; offer: OfferId; need: string };

export function isOffer(value: unknown): value is OfferId {
  return value === "manual" || value === "connected";
}

export function parseReservation(value: unknown): ReservationInput {
  if (!value || typeof value !== "object") throw new Error("Vérifiez les informations saisies.");
  const { email, offer, need = "" } = value as Record<string, unknown>;
  if (typeof email !== "string" || email.trim().length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email.trim())) {
    throw new Error("Saisissez une adresse e-mail valide.");
  }
  if (!isOffer(offer)) throw new Error("Choisissez une formule.");
  if (typeof need !== "string" || need.length > 500) throw new Error("Limitez votre réponse à 500 caractères.");
  return { email: email.trim().toLowerCase(), offer, need: need.trim() };
}
