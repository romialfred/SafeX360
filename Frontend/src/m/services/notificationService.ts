/**
 * notificationService — Notifications push (FCM) + locales (rappels).
 *
 * Push (recue serveur) :
 *   - Reception de l'alarme tir T-10 push depuis le backend
 *   - Validation/rejet d'inspection par l'equipe
 *   - SOS coordinateur (uniquement pour roles HSE_LEAD)
 *
 * Local (programmee cote client) :
 *   - Rappel "Inspection planifiee dans 30 min"
 *   - Rappel "Soumettre votre inspection en cours" si inactivite 4 h
 *
 * Le module reste tolerant si Capacitor n'est pas installe (fallback :
 * juste un console.log). Les permissions sont demandees au boot via
 * registerPushNotifications().
 */

import axiosInstance from '../../interceptors/AxiosInterceptor';

interface RegisterResult {
    granted: boolean;
    token?: string;
    error?: string;
}

/**
 * Demande les permissions notifications + recupere le token FCM.
 * A appeler une seule fois au boot de l'app mobile.
 */
export async function registerPushNotifications(userId?: number): Promise<RegisterResult> {
    try {
        const mod = await import(/* @vite-ignore */ '@capacitor/push-notifications').catch(
            () => null,
        );
        if (!mod) {
            return { granted: false, error: 'Plugin absent (mode web)' };
        }
        const { PushNotifications } = mod;
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== 'granted') {
            return { granted: false, error: 'Permission refusee' };
        }
        await PushNotifications.register();
        // Le token arrive en asynchrone via listener
        return new Promise<RegisterResult>((resolve) => {
            const handle = PushNotifications.addListener('registration', async (token: any) => {
                const value = token?.value as string;
                if (value && userId) {
                    // Enregistrer le token cote backend pour ciblage
                    try {
                        await axiosInstance.post(
                            '/hns/mobile/push-token',
                            { token: value, platform: 'android' },
                            { headers: { 'X-User-Id': String(userId) } },
                        );
                    } catch (_e) {
                        // Backend pas pret : on ignore — le token est conserve cote device
                    }
                }
                if (typeof (await handle).remove === 'function') {
                    (await handle).remove();
                }
                resolve({ granted: true, token: value });
            });
            // Listener d'erreur registrationError
            PushNotifications.addListener('registrationError', (err: any) => {
                resolve({ granted: false, error: String(err?.error ?? err) });
            });
        });
    } catch (e: any) {
        return { granted: false, error: e?.message ?? 'Exception' };
    }
}

/**
 * Programme une notification locale (rappel cote client). Le user peut
 * la voir meme si l'app est fermee (Capacitor declenche l'OS).
 */
export async function scheduleLocalNotification(opts: {
    id: number;
    title: string;
    body: string;
    /** Date d'apparition (timestamp ms). */
    at: number;
    /** Donnee custom (deep link, action). */
    extra?: Record<string, unknown>;
}): Promise<void> {
    try {
        const mod = await import(/* @vite-ignore */ '@capacitor/local-notifications').catch(
            () => null,
        );
        if (!mod) {
            console.warn('[notif] Plugin local notif absent — fallback no-op');
            return;
        }
        const { LocalNotifications } = mod;
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
            const ask = await LocalNotifications.requestPermissions();
            if (ask.display !== 'granted') return;
        }
        await LocalNotifications.schedule({
            notifications: [
                {
                    id: opts.id,
                    title: opts.title,
                    body: opts.body,
                    schedule: { at: new Date(opts.at) },
                    extra: opts.extra ?? {},
                    smallIcon: 'ic_stat_notification',
                },
            ],
        });
    } catch (e) {
        console.warn('[notif] scheduleLocalNotification failed', e);
    }
}

/**
 * Annule une notification locale par id (utile si l'inspection est
 * deja terminee, plus besoin du rappel).
 */
export async function cancelLocalNotification(id: number): Promise<void> {
    try {
        const mod = await import(/* @vite-ignore */ '@capacitor/local-notifications').catch(
            () => null,
        );
        if (!mod) return;
        await mod.LocalNotifications.cancel({ notifications: [{ id }] });
    } catch {
        // ignore
    }
}
