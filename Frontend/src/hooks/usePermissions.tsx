/**
 * usePermissions — Hook React qui expose les permissions modules de l'utilisateur logue.
 *
 * Utilisation :
 *   const perms = usePermissions();
 *   if (perms.canSee('incidentManagement')) { ... }
 *
 * Charge le profil via /hrms/me/profile au montage (ou utilise le cache du FirstLoginGuard).
 * Recharge automatique apres invalidateProfileCache() suite a une mise a jour.
 */

import { useEffect, useState, useCallback } from 'react';
import { getMyProfile, MyProfile } from '../services/UserManagementService';
import { getCachedProfile } from '../routes/FirstLoginGuard';

export interface PermissionsAPI {
    profile: MyProfile | null;
    loading: boolean;
    allowedModules: Set<string>;
    role: string;
    /** Indique si l'utilisateur peut acceder au moduleId. */
    canSee: (moduleId: string) => boolean;
    /** Indique si l'utilisateur a un role admin (acces total). */
    isAdmin: boolean;
    /** Force le rechargement du profil. */
    reload: () => Promise<void>;
}

export function usePermissions(): PermissionsAPI {
    const [profile, setProfile] = useState<MyProfile | null>(getCachedProfile());
    const [loading, setLoading] = useState<boolean>(!profile);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = await getMyProfile();
            setProfile(p);
        } catch (e) {
            // Ignore — l'utilisateur sera redirige par le guard
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!profile) {
            load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const allowedModules = new Set<string>(
        (profile?.allowedModules || '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
    );

    const role = profile?.role || 'EMPLOYEE';
    const isAdmin = role === 'SYSTEM_ADMINISTRATOR' || role === 'Administrator';

    const canSee = (moduleId: string): boolean => {
        if (isAdmin) return true;
        return allowedModules.has(moduleId);
    };

    return {
        profile,
        loading,
        allowedModules,
        role,
        canSee,
        isAdmin,
        reload: load,
    };
}
