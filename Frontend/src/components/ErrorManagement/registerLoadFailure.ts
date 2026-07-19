export type RegisterLoadFailureKind = 'timeout' | 'forbidden' | 'unavailable';

export interface RegisterLoadFailure {
    kind: RegisterLoadFailureKind;
    title: string;
    message: string;
}

interface HttpFailureLike {
    code?: string;
    message?: string;
    response?: { status?: number };
}

/** Transforme une erreur technique en état opérateur stable, sans confondre panne et registre vide. */
export const classifyRegisterLoadFailure = (error: unknown): RegisterLoadFailure => {
    const failure = (error ?? {}) as HttpFailureLike;
    const timedOut = failure.code === 'ECONNABORTED' || /timeout|délai/i.test(failure.message ?? '');

    if (timedOut) {
        return {
            kind: 'timeout',
            title: 'Délai de chargement dépassé',
            message: "Le registre n'a pas répondu dans le délai prévu. Vérifiez le réseau puis réessayez.",
        };
    }

    if (failure.response?.status === 401 || failure.response?.status === 403) {
        return {
            kind: 'forbidden',
            title: 'Accès au registre refusé',
            message: "Votre session ou vos droits ne permettent pas d'afficher ces événements.",
        };
    }

    return {
        kind: 'unavailable',
        title: 'Registre temporairement indisponible',
        message: "Les événements n'ont pas pu être chargés. Aucune donnée vide n'est déduite de cet échec.",
    };
};
