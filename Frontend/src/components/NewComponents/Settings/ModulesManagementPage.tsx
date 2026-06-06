import { useNavigate } from 'react-router-dom';
import ModuleManager from './ModuleManager';

/**
 * ModulesManagementPage — wrapper plein écran du ModuleManager (LOT 48 P6.f).
 *
 * Suite à l'éclatement du module Administration en 4 modules de premier niveau
 * dans la sidebar, "Gestion des Modules" est désormais une page autonome
 * accessible directement via /modules-management (sans transiter par
 * l'ancienne page /settings).
 *
 * Le bouton "Retour" renvoie vers le tableau de bord de la plateforme.
 */
const ModulesManagementPage = () => {
    const navigate = useNavigate();
    return <ModuleManager onBackToSettings={() => navigate('/')} />;
};

export default ModulesManagementPage;
