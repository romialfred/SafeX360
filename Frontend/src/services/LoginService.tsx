import axiosInstance from "../interceptors/AxiosInterceptor";

const loginUser = async (data: any) => {
    const result = await axiosInstance.post(`/hrms/auth/login`, data);
    // Un login réussi peut remplacer le compte encore présent sur un terminal
    // partagé. Purger les lectures de l'ancien compte avant de rendre la
    // nouvelle session au reste de l'application.
    const { purgeLocalSecurityState } = await import("../security/purgeLocalSecurityState");
    await purgeLocalSecurityState();
    return result.data;
}

const getUser = async () => {
    return axiosInstance.get(`/hrms/auth/me`)
        .then(result => result.data);
}

export type MfaEnrollment = { manualKey: string; otpAuthUri: string };
export type MfaRecoveryCodes = { recoveryCodes: string[]; loginRequired: boolean };

const startMfaEnrollment = async (challenge: string): Promise<MfaEnrollment> => {
    const result = await axiosInstance.post('/hrms/auth/mfa/enroll/start', { challenge });
    return result.data;
};

const confirmMfaEnrollment = async (challenge: string, code: string): Promise<MfaRecoveryCodes> => {
    const result = await axiosInstance.post('/hrms/auth/mfa/enroll/confirm', { challenge, code });
    return result.data;
};

const verifyMfa = async (challenge: string, code: string, recoveryCode?: string) => {
    const result = await axiosInstance.post('/hrms/auth/mfa/verify', {
        challenge,
        code: recoveryCode ? undefined : code,
        recoveryCode: recoveryCode || undefined,
    });
    const { purgeLocalSecurityState } = await import('../security/purgeLocalSecurityState');
    await purgeLocalSecurityState();
    return result.data;
};

const logoutUser = async () => {
    try {
        return await axiosInstance.post(`/hrms/auth/logout`)
            .then(result => result.data);
    } finally {
        // La fin de session locale doit rester effective meme si le serveur est
        // indisponible. Les saisies non synchronisees sont preservees par defaut.
        const { purgeLocalSecurityState } = await import("../security/purgeLocalSecurityState");
        await purgeLocalSecurityState();
    }
}

export { loginUser, getUser, logoutUser, startMfaEnrollment, confirmMfaEnrollment, verifyMfa };
