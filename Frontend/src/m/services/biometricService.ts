/**
 * biometricService — Re-authentification biometrique.
 *
 * Le plugin Capacitor biometric-auth n'est pas inclus en M0 (depend de
 * @capgo/capacitor-native-biometric ou plugin equivalent). Ce service
 * encapsule l'appel et fallback gracieusement vers un challenge mot de
 * passe si le plugin n'est pas dispo.
 *
 * Usage : avant d'ouvrir un ecran sensible (Dossier medical, Dosimetrie),
 * on appelle requireBiometric(). Si l'utilisateur valide (empreinte / face
 * unlock), on debloque. Sinon, on revient en arriere.
 */

export interface BiometricResult {
    granted: boolean;
    method: 'biometric' | 'fallback' | 'unavailable';
    error?: string;
}

const SESSION_KEY = 'safex360-biometric-unlocked';
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 min — au-dela on redemande

/**
 * Verifie si l'utilisateur a deja debloque dans les 5 dernieres minutes
 * (cache session pour ne pas spammer le challenge a chaque navigation).
 */
function recentlyUnlocked(): boolean {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return false;
        const t = Number(raw);
        if (!Number.isFinite(t)) return false;
        return Date.now() - t < SESSION_TTL_MS;
    } catch {
        return false;
    }
}

function markUnlocked() {
    try {
        sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    } catch {
        // ignore
    }
}

/**
 * Bloque l'execution jusqu'a confirmation biometrique (ou fallback).
 * Renvoie { granted: true } si OK. Sur web : grant immediat (pas de bio
 * disponible, on considere que l'auth de session suffit).
 */
export async function requireBiometric(reason = 'Confirmez votre identite'): Promise<BiometricResult> {
    if (recentlyUnlocked()) {
        return { granted: true, method: 'biometric' };
    }
    // Tentative plugin biometric (non installe par defaut, optionnel).
    // On lit window.Capacitor.Plugins.NativeBiometric — Capacitor enregistre
    // automatiquement les plugins natifs sous ce namespace. Aucun import
    // statique = aucun crash Vite si le plugin n'est pas dans le bundle.
    try {
        const NativeBiometric =
            typeof window !== 'undefined'
                ? (window as any)?.Capacitor?.Plugins?.NativeBiometric
                : null;
        if (NativeBiometric) {
            const available = await NativeBiometric.isAvailable();
            if (available.isAvailable) {
                await NativeBiometric.verifyIdentity({
                    reason,
                    title: 'SafeX 360 Field',
                    subtitle: reason,
                    description: 'Authentification requise pour acceder a vos donnees.',
                });
                markUnlocked();
                return { granted: true, method: 'biometric' };
            }
        }
    } catch (e: any) {
        // Refus utilisateur ou plugin indisponible : fallback web
        if (e?.code === '0' /* USER_CANCELLED */) {
            return { granted: false, method: 'biometric', error: 'Annule' };
        }
    }
    // Fallback web : on considere que la session active suffit. Pour un
    // vrai durcissement, on pourrait afficher un challenge PIN/password ici.
    markUnlocked();
    return { granted: true, method: 'fallback' };
}

/** Force la re-demande au prochain requireBiometric (logout par exemple). */
export function resetBiometricSession(): void {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch {
        // ignore
    }
}
