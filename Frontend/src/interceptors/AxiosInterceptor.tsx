
import axios, { AxiosResponse } from 'axios';
import navigateToLogin from './Navigation';
import { errorNotification } from '../utility/NotificationUtility';
import store from '../Store';
import { COMPANY_SELECTION_STORAGE_KEY } from '../slices/CompanySelectionSlice';
import { startRequest, endRequest } from '../utility/loadingBus';

// Détection Capacitor natif SANS import applicatif (le bridge injecte
// window.Capacitor avant l'exécution du bundle).
const isNativeApp = typeof window !== 'undefined'
    && Boolean((window as any).Capacitor?.isNativePlatform?.());

// APK : le WebView est servi depuis https://localhost — un baseURL vide y
// renvoyait le index.html local avec un statut 200 sur TOUS les appels API.
// Conséquences observées : « utilisateur fantôme » connecté d'office,
// déconnexion impossible (la sonde /auth/me re-répondait 200), listes en
// v.map crash (HTML au lieu de tableaux). En natif, on vise donc TOUJOURS
// le gateway (VITE_API_URL du build --mode mobile, sinon URL de prod).
const NATIVE_GATEWAY_URL = 'https://safex360-gateway.onrender.com';

const apiUrl = import.meta.env.DEV
    ? (import.meta.env.VITE_API_URL || '')
    : (isNativeApp ? (import.meta.env.VITE_API_URL || NATIVE_GATEWAY_URL) : '');
const axiosInstance = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
    // Plafond de securite a 20 minutes (le defaut axios est 0 = illimite).
    // Utile pour les soumissions lourdes (investigation + preuves base64) et
    // les cold starts Render : au-dela, notifyError affiche « delai depasse »
    // plutot qu'un blocage indefini.
    timeout: 20 * 60 * 1000,
});


/**
 * Extension de la configuration axios : `background`.
 *
 * Déclarée ici plutôt que forcée par un cast à chaque appel — le drapeau devient
 * ainsi une option de premier ordre, connue du compilateur et documentée pour
 * quiconque écrira un futur sondage.
 */
declare module 'axios' {
    interface AxiosRequestConfig {
        /**
         * Requête de FOND (sondage périodique d'un écran temps réel).
         * N'alimente pas le compteur du sablier global : sans cela,
         * « Chargement… » réapparaissait toutes les 4 à 5 s sur des écrans que
         * l'utilisateur ne quitte jamais (Salle de Crise, console SOS…).
         */
        background?: boolean;
    }
}

// Une requête de fond n'est pas comptée à l'aller : elle ne doit pas l'être non
// plus au retour, sinon le compteur passerait sous zéro et le sablier ne
// s'afficherait PLUS JAMAIS. Les deux côtés lisent donc le même drapeau.
const isBackground = (cfg: unknown): boolean =>
    Boolean(cfg && (cfg as { background?: boolean }).background);

const endRequestFor = (cfg: unknown) => {
    if (!isBackground(cfg)) endRequest();
};

// axiosInstance.interceptors.request.use(
//     (config: InternalAxiosRequestConfig) => {
//         const token = localStorage.getItem('token');
//         if (token && config.headers) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );
// Compteur global de requêtes en vol — alimente le sablier d'attente
// (GlobalLoadingIndicator). Enregistré en premier pour compter TOUTES les
// requêtes, y compris celles qui court-circuitent l'injection companyId.
axiosInstance.interceptors.request.use(
    (config) => {
        // Les requêtes de FOND (sondages périodiques des écrans temps réel :
        // urgences, console SOS, salle de crise…) ne doivent PAS allumer le
        // sablier : elles se répètent toutes les 4 à 5 s et faisaient
        // réapparaître « Chargement… » en boucle alors que l'utilisateur ne
        // quittait pas sa page. Seules les actions qu'il déclenche comptent.
        // Opt-in explicite via `{ background: true }` — par défaut, rien ne change.
        if (!isBackground(config)) startRequest();
        return config;
    },
    (error) => {
        endRequestFor(error?.config);
        return Promise.reject(error);
    }
);
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        endRequestFor(response.config);
        return response;
    },
    async (error) => {
        endRequestFor(error?.config);
        // Cold-start Render : au tout premier chargement, la gateway/HRMS peut
        // renvoyer un 5xx transitoire le temps de se réveiller — observé sur les
        // sondes d'auth (/hrms/auth/me) qui échouent puis repassent au 2e essai.
        // On retente UNE fois, après un court délai, uniquement pour ces sondes.
        const cfg: any = error.config;
        const status = error.response?.status;
        if (cfg && typeof status === 'number' && status >= 500
            && isAuthProbe(cfg.url) && !cfg.__authProbeRetried) {
            cfg.__authProbeRetried = true;
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return axiosInstance.request(cfg);
        }
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.request.use(
    (config) => {
        // NB : le module Dosimetrie (/hns/dosimetry/*) n'est PLUS exclu de
        // l'injection de companyId. Ses controleurs scaffoldes exigent le
        // parametre `companyId` ; sans lui, un utilisateur « toutes mines »
        // (companyId injecte a null par CompanyScopeFilter) recevait un 400 sur
        // toute creation/edition (worker, dosimetre, dose, seuil). Les
        // controleurs plus recents lisent mineId dans le corps et ignorent
        // simplement ce parametre de requete additionnel.
        const url = config.url ?? '';

        const state = store.getState();
        let companyId = state.companySelection?.selectedCompanyId ?? null;

        if ((companyId === null || companyId === undefined) && typeof window !== "undefined") {
            try {
                const storedValue = window.localStorage.getItem(COMPANY_SELECTION_STORAGE_KEY);
                if (storedValue !== null && storedValue !== "null") {
                    const parsedId = Number(storedValue);
                    if (!Number.isNaN(parsedId)) {
                        companyId = parsedId;
                    }
                }
            } catch (_error) {
                // Ignore storage access issues
            }
        }

        // N'injecte QUE si l'appelant n'a pas déjà fixé companyId (params ou
        // query inline) : sinon l'URL porterait DEUX companyId et Spring
        // résoudrait le premier — divergence création/lecture selon la source.
        const alreadySet = (config.params && config.params.companyId !== undefined)
            || url.includes('companyId=');
        if (!alreadySet && companyId !== null && companyId !== undefined && !Number.isNaN(Number(companyId))) {
            const numericCompanyId = Number(companyId);
            config.params = {
                ...(config.params || {}),
                companyId: numericCompanyId,
            };
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Sondes d'authentification : ces endpoints renvoient légitimement 401 quand
 * l'utilisateur n'est PAS connecté (page de login, premier chargement). Leurs
 * appelants gèrent déjà ce 401 (useAuth → user null, FirstLoginGuard → /login,
 * usePermissions → profil null). L'intercepteur global NE DOIT PAS rediriger
 * sur ces 401, sinon : 401 → navigate → re-montage → re-sonde → 401 → boucle
 * infinie (bug du spinner sans fin sur /login).
 */
// /hrms/auth/mfa/ : un code TOTP errone repond 401 — c'est une etape NORMALE du
// parcours MFA, deja expliquee dans la modale de connexion. Sans cette entree,
// l'intercepteur superposait un toast « Session expiree » a chaque code faux.
const AUTH_PROBE_PATHS = ['/hrms/auth/me', '/hrms/me/profile', '/hns/users/permissions/me', '/hrms/auth/mfa/'];

const isAuthProbe = (url?: string): boolean =>
    !!url && AUTH_PROBE_PATHS.some((p) => url.includes(p));

// Id de l'intercepteur 401 déjà enregistré : sans éjection préalable, chaque
// re-montage (StrictMode, navigation) empilerait un doublon → notifications
// et redirections multiples sur un seul 401.
let responseInterceptorId: number | null = null;

export const setupResponseInterceptor = (navigate: any, dispatch: any) => {
    if (responseInterceptorId !== null) {
        axiosInstance.interceptors.response.eject(responseInterceptorId);
    }
    responseInterceptorId = axiosInstance.interceptors.response.use(
        (response: AxiosResponse) => {
            return response;
        },
        async (error) => {
            const status = error.response?.status;
            const url: string | undefined = error.config?.url;

            // 401 sur une sonde d'auth : silencieux, l'appelant décide (pas de
            // notification ni de redirection — c'est l'état « non connecté »).
            if (status === 401 && isAuthProbe(url)) {
                return Promise.reject(error);
            }

            // 401 sur un appel applicatif réel = session réellement expirée.
            if (status === 401) {
                errorNotification("Session expirée, veuillez vous reconnecter");
                await navigateToLogin(navigate, dispatch);
                return Promise.reject(error);
            }

            return Promise.reject(error);
        }
    );
};

export default axiosInstance;


