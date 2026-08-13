import { toast } from "sonner";

// Accusé de réception d'une action confirmée. Une confirmation ferme sa fenêtre et
// laisse l'écran tel quel : sans ce mot, rien ne dit que le clic a porté — surtout
// pour un changement qui se voit ailleurs (le tableau) ou pas du tout (une durée
// rallongée vers des mois hors de la fenêtre affichée).
export const toastSucces = (message: string) => toast.success(message);
