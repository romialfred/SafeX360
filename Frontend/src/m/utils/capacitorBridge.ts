/**
 * capacitorBridge — Acces aux plugins Capacitor en runtime via window.
 *
 * En APK Android, Capacitor injecte `window.Capacitor` + `window.Capacitor.Plugins.*`
 * automatiquement au demarrage de la WebView. Cela evite tout `import()` statique
 * de `@capacitor/*` (qui crasherait le build/dev Vite cote web car les packages
 * Capacitor ne sont installes que lors du build APK).
 *
 * Reference officielle :
 *   https://capacitorjs.com/docs/web-runtime  (Capacitor.Plugins.{Name})
 *
 * Usage :
 *   const Camera = getCapacitorPlugin<any>('Camera');
 *   if (Camera) { const photo = await Camera.getPhoto({...}); }
 */

interface CapacitorGlobal {
    isNativePlatform?: () => boolean;
    getPlatform?: () => 'ios' | 'android' | 'web';
    Plugins?: Record<string, any>;
}

function getWindow(): (Window & { Capacitor?: CapacitorGlobal }) | null {
    return typeof window === 'undefined' ? null : (window as any);
}

/** True si l'app tourne dans la WebView native (APK Android / iOS). */
export function isNativePlatform(): boolean {
    const w = getWindow();
    return Boolean(w?.Capacitor?.isNativePlatform?.());
}

/** Renvoie 'web' / 'android' / 'ios'. Defaut 'web' si Capacitor absent. */
export function getPlatform(): 'web' | 'android' | 'ios' {
    const w = getWindow();
    return (w?.Capacitor?.getPlatform?.() ?? 'web') as 'web' | 'android' | 'ios';
}

/**
 * Renvoie un plugin Capacitor exporte sous window.Capacitor.Plugins[name],
 * ou null si on est sur web sans Capacitor (cas dev/prod standard).
 *
 * @param name nom du plugin (Camera, Geolocation, PushNotifications, etc.)
 */
export function getCapacitorPlugin<T = any>(name: string): T | null {
    const w = getWindow();
    return (w?.Capacitor?.Plugins?.[name] as T) ?? null;
}
