import { getEmployeeDropdown, getEmployeesWithDepartment } from '../services/EmployeeService';
import { getAllDepartments } from '../services/HrmsService';

/**
 * Préchargement des référentiels à la connexion.
 *
 * L'utilisateur demande que « tout ce qui peut être chargé en mémoire le soit à
 * la connexion ». On réchauffe donc ici, une fois la mine connue, les listes que
 * des dizaines d'écrans réclament (employés, départements). Elles atterrissent
 * dans le cache mémoire (referenceCache) : la PREMIÈRE navigation vers n'importe
 * quel écran qui en dépend est alors instantanée, sans aller-retour réseau.
 *
 * Volontairement « fire-and-forget » et tolérant à l'échec : le préchargement
 * est une OPTIMISATION, jamais un prérequis. S'il échoue (réseau, droits), les
 * écrans re-demanderont normalement la donnée — rien n'est cassé.
 */
export function preloadReferenceData(): void {
    // Chaque appel passe par cachedGet : dédup automatique si un écran demande
    // la même liste au même instant, et mise en cache pour les suivants.
    void Promise.allSettled([
        getEmployeeDropdown(),
        getEmployeesWithDepartment(),
        getAllDepartments(),
    ]);
}
