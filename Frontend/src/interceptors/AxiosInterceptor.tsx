
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
        startRequest();
        return config;
    },
    (error) => {
        endRequest();
        return Promise.reject(error);
    }
);
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        endRequest();
        return response;
    },
    async (error) => {
        endRequest();
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
        // Le module Dosimetrie (/hns/dosimetry/*) utilise un parametrage
        // mineId du body et n'accepte pas l'ajout automatique de companyId
        // en query string par cet interceptor (interferes avec @RequestBody
        // et le filtre Spring de RBAC dosimetry). Skip auto-injection ici.
        const url = config.url ?? '';
        if (url.includes('/hns/dosimetry/')) {
            return config;
        }

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
const AUTH_PROBE_PATHS = ['/hrms/auth/me', '/hrms/me/profile', '/hns/users/permissions/me'];

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
        (error) => {
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
                navigateToLogin(navigate, dispatch);
                return Promise.reject(error);
            }

            return Promise.reject(error);
        }
    );
};

export default axiosInstance;


