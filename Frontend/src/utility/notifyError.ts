/**
 * notifyError.ts
 * --------------
 * Helper centralise pour la gestion des erreurs cote frontend SafeX360.
 *
 * Objectifs :
 *  - Extraire un message d'erreur lisible depuis une reponse Axios/Fetch,
 *    une `Error` JS, ou n'importe quel objet inconnu.
 *  - Afficher la notification d'erreur Mantine via `errorNotification`.
 *  - Logger les details techniques (status HTTP, stack) en mode dev pour
 *    faciliter le debug.
 */

import { errorNotification } from "./NotificationUtility";

/**
 * Affiche une notification d'erreur en extrayant le message le plus pertinent
 * depuis l'objet erreur passe en argument.
 *
 * Ordre de priorite pour le message :
 *   1. `err.response.data.errorMessage` (format SafeX backend Spring Boot)
 *   2. `err.response.data.message`      (format generique d'erreur HTTP)
 *   3. `err.message`                    (erreur JS native, ex: `new Error("...")`)
 *   4. `fallback`                       (message par defaut fourni par l'appelant)
 *
 * En mode developpement (`import.meta.env.DEV`), un `console.error` detaille
 * est emis avec le status HTTP eventuel et le message brut pour faciliter le
 * diagnostic. Aucun log n'est emis en production pour eviter de polluer la
 * console des utilisateurs finaux.
 *
 * @param err      L'erreur capturee (Axios error, Error JS, objet inconnu...).
 * @param fallback Message a afficher si aucun message exploitable n'est trouve.
 *                 Par defaut : `"Une erreur est survenue"`.
 *
 * @example
 *   try {
 *     await axios.post("/api/incidents", payload);
 *   } catch (err) {
 *     notifyError(err, "Impossible d'enregistrer l'incident");
 *   }
 */
/**
 * Codes d'erreur metier SafeX (HSException) -> message francais lisible.
 * Evite d'exposer les codes techniques bruts a l'utilisateur.
 */
const CODE_MESSAGES: Record<string, string> = {
  COMPANY_ID_REQUIRED:
    "Aucune mine sélectionnée. Choisissez une mine spécifique (au lieu de « Toutes les Mines ») puis réessayez.",
  INCIDENT_NOT_FOUND: "L'incident lié est introuvable. Rechargez la page puis réessayez.",
  INVESTIGATION_NOT_FOUND: "L'investigation est introuvable. Rechargez la page puis réessayez.",
  INVESTIGATION_ALREADY_EXISTS: "Une investigation existe déjà pour cet incident.",
  INVESTIGATION_DETAILS_REQUIRED: "Les informations de l'investigation sont incomplètes.",
  WORK_PROCESS_REQUIRED: "Le processus de travail est obligatoire. Sélectionnez-en un puis réessayez.",
};

export function notifyError(err: any, fallback = "Une erreur est survenue"): void {
  // 1) Erreur reseau / timeout : aucune reponse HTTP recue.
  //    On ne renvoie PAS un message vide (l'ancien code affichait alors
  //    « Une erreur est survenue » sans indication actionnable).
  if (!err?.response) {
    const isTimeout =
      err?.code === "ECONNABORTED" || /timeout/i.test(err?.message ?? "");
    errorNotification(
      isTimeout
        ? "Le serveur met trop de temps à répondre (délai dépassé). Vérifiez votre connexion et réessayez."
        : "Service momentanément injoignable. Vérifiez votre connexion internet et réessayez."
    );
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error(`[notifyError] network/timeout code=${err?.code ?? "n/a"}`, err);
    }
    return;
  }

  // 2) Reponse HTTP recue : privilegie le code metier connu, sinon le message brut.
  const raw: string =
    err?.response?.data?.errorMessage ||
    err?.response?.data?.message ||
    err?.message ||
    fallback;
  const message = CODE_MESSAGES[raw] ?? raw ?? fallback;

  // Affichage de la notification Mantine (rouge)
  errorNotification(message);

  // Logging detaille uniquement en mode developpement.
  // `import.meta.env.DEV` est defini par Vite (true en dev, false en build prod).
  if (import.meta.env?.DEV) {
    const status = err?.response?.status;
    // On garde un seul console.error pour rester lisible dans la devtools.
    // eslint-disable-next-line no-console
    console.error(
      `[notifyError] status=${status ?? "n/a"} message="${err?.message ?? "n/a"}"`,
      err
    );
  }
}
