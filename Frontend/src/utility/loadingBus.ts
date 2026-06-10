/**
 * loadingBus — compteur global de requêtes API en vol.
 *
 * Alimenté par AxiosInterceptor (start/end sur chaque requête), consommé par
 * GlobalLoadingIndicator (sablier d'attente global). Pub/sub minimal sans
 * dépendance Redux pour éviter tout cycle d'import : utility → interceptors.
 */

type Listener = (pending: number) => void;

let pending = 0;
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l(pending));

/** Une requête API démarre. */
export const startRequest = () => {
    pending += 1;
    notify();
};

/** Une requête API se termine (succès ou erreur). */
export const endRequest = () => {
    pending = Math.max(0, pending - 1);
    notify();
};

/** Nombre de requêtes actuellement en vol. */
export const getPending = () => pending;

/** S'abonner aux changements ; retourne la fonction de désabonnement. */
export const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
