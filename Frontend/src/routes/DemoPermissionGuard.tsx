import { JSX } from 'react';
import { useAppSelector } from '../slices/hooks';
import PermissionDenied from '../components/UtilityComp/PermissionDenied';

/**
 * Liste des logins (sub JWT) considérés comme "comptes démo" :
 * accès limité à certains modules sensibles.
 */
const DEMO_LOGINS: ReadonlySet<string> = new Set([
    'SAFEX360DEMO',
]);

interface DemoPermissionGuardProps {
    /** Libellé affiché à l'utilisateur si bloqué */
    moduleLabel: string;
    children: JSX.Element;
}

/**
 * Guard frontend qui bloque l'accès à un sous-arbre du Router
 * pour les comptes démo, tout en laissant le menu visible côté sidebar.
 *
 * Au clic, l'utilisateur démo voit l'écran "Accès restreint" plutôt que
 * la page réelle. Les autres comptes traversent normalement.
 */
export default function DemoPermissionGuard({ moduleLabel, children }: DemoPermissionGuardProps) {
    const user = useAppSelector((state: any) => state.user);
    const login: string | undefined = user?.sub || user?.login;
    const isDemo = !!login && DEMO_LOGINS.has(login);

    if (isDemo) {
        return <PermissionDenied moduleLabel={moduleLabel} />;
    }

    return children;
}
