
import axios, { AxiosResponse } from 'axios';
import navigateToLogin from './Navigation';
import { errorNotification } from '../utility/NotificationUtility';
import store from '../Store';
import { COMPANY_SELECTION_STORAGE_KEY } from '../slices/CompanySelectionSlice';

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
axiosInstance.interceptors.request.use(
    (config) => {
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

export const setupResponseInterceptor = (navigate: any, dispatch: any) => {
    axiosInstance.interceptors.response.use(
        (response: AxiosResponse) => {
            return response;
        },
        (error) => {
            if (error.response && error.response.status === 401) {
                errorNotification("Session Expired, Please login again to continue");
                navigateToLogin(navigate, dispatch);

            }
            else throw error;
        }
    );
};

export default axiosInstance;


