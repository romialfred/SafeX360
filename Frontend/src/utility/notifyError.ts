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
export function notifyError(err: any, fallback = "Une erreur est survenue"): void {
  // Extraction du message le plus parlant pour l'utilisateur final
  const message: string =
    err?.response?.data?.errorMessage ||
    err?.response?.data?.message ||
    err?.message ||
    fallback;

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
