import { useEffect, useState } from 'react';
import { listEmergencyPermissionsForUser } from '../../services/EmergencyService';

/** Rôles plateforme habilités à clore comme un coordinateur. */
const ADMIN_ROLES = ['ADMINISTRATOR', 'SYSTEM_ADMINISTRATOR', 'ADMIN'];

/**
 * useCanCloseEmergency — l'utilisateur courant peut-il CLORE une alerte générale
 * ou un SOS ? Réservé aux COORDINATEURS des urgences (permission COORDINATOR)
 * et aux ADMINISTRATEURS plateforme. Le backend applique la même règle (autorité
 * INSPECTION_ADMIN ou permission COORDINATOR) ; ce hook ne fait que masquer /
 * afficher le bouton.
 */
export function useCanCloseEmergency(userId?: number | string | null, role?: string | null) {
    const isAdmin = !!role && ADMIN_ROLES.includes(String(role).toUpperCase());
    const [isCoordinator, setIsCoordinator] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const uid = Number(userId);
        if (!uid) {
            setIsCoordinator(false);
            setLoading(false);
            return;
        }
        let alive = true;
        setLoading(true);
        listEmergencyPermissionsForUser(uid)
            .then((perms) => {
                if (!alive) return;
                setIsCoordinator(Array.isArray(perms) && perms.some((p) => p.permission === 'COORDINATOR'));
            })
            .catch(() => { if (alive) setIsCoordinator(false); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [userId]);

    return { canClose: isCoordinator || isAdmin, isCoordinator, isAdmin, loading };
}
