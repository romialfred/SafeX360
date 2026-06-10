import PPEManagementDashboard from './PPEManagementDashboard';

/**
 * Point d'entrée du module Gestion des EPI (route /ppe-management).
 * Les sous-pages (création, entrée de stock, demandes, détail employé)
 * sont des routes dédiées — voir Router.tsx.
 */
const PPEManagement = () => <PPEManagementDashboard />;

export default PPEManagement;
