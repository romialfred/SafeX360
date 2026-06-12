
import axios, { AxiosResponse } from 'axios';
import navigateToLogin from './Navigation';
import { errorNotification } from '../utility/NotificationUtility';
import store from '../Store';
import { COMPANY_SELECTION_STORAGE_KEY } from '../slices/CompanySelectionSlice';
import { startRequest, endRequest } from '../utility/loadingBus';

const apiUrl = import.meta.env.VITE_API_URL;
const axiosInstance = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
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
    (error) => {
        endRequest();
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

        if (companyId !== null && companyId !== undefined && !Number.isNaN(Number(companyId))) {
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

export const setupResponseInterceptor = (navigate: any, dispatch: any) => {
    axiosInstance.interceptors.response.use(
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


