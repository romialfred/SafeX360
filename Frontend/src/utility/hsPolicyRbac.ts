import { isIncidentAccountable } from './incidentRbac';

/**
 * Gate UX du module Politique SST : publier/signer une politique est un acte de
 * DIRECTION. Les rôles concernés (admins + coordinateur/manager/officier HSE)
 * sont EXACTEMENT ceux qui portent la gouvernance incident — on réutilise donc
 * la SOURCE UNIQUE `incidentRbac` plutôt que de recopier la liste (une liste
 * dupliquée finit par diverger). La sécurité réelle reste serveur
 * (@PreAuthorize HS_POLICY_MANAGE + matrice passerelle) : ceci ne fait que
 * masquer des boutons.
 */
export const isHsPolicyManager = isIncidentAccountable;
