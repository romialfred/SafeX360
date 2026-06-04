import { useLocation } from 'react-router-dom';

/**
 * useActivePageTitle — Détermine le titre du module métier actif
 * à partir de l'URL courante.
 *
 * LOT 41 fix : le header affichait "Tableau de bord HSE" en dur quel
 * que soit le module ouvert. Ce hook résout le titre réel en mappant
 * les préfixes d'URL vers le libellé métier.
 */

const ROUTE_TITLES: Array<{ match: string | RegExp; title: string }> = [
    // Dashboard / accueil
    { match: /^\/$/,                                title: 'Espace de pilotage' },
    { match: /^\/dashboard/,                        title: 'Tableau de bord' },

    // Surveillance des activités
    { match: /^\/incidents\/view-details/,          title: 'Détail incident' },
    { match: /^\/incidents/,                        title: 'Gestion des incidents' },
    { match: /^\/investigations/,                   title: 'Investigations' },
    { match: /^\/action-plans/,                     title: "Plans d'action" },

    // Activités préventives
    { match: /^\/non-conformity\/details/,          title: 'Détail non-conformité' },
    { match: /^\/non-conformity/,                   title: 'Non-conformités centrales' },
    { match: /^\/PGI/,                              title: 'Programme général d\'inspections' },
    { match: /^\/inspection-managers/,              title: 'Inspections managers' },
    { match: /^\/hs-meetings/,                      title: 'Réunions HSE' },
    { match: /^\/leadership-walk/,                  title: 'Tournées de management' },
    { match: /^\/mba-card/,                         title: 'Cartes MBA' },

    // Actions correctives & suivi
    { match: /^\/corrective/,                       title: 'Actions correctives' },
    { match: /^\/pending-actions/,                  title: 'Actions en attente' },
    { match: /^\/recommendations/,                  title: 'Recommandations' },
    { match: /^\/improvement-ideas/,                title: "Idées d'amélioration" },
    { match: /^\/adhoc-actions/,                    title: 'Actions adhoc' },

    // Audits
    { match: /^\/audit-management/,                 title: 'Gestion des audits' },
    { match: /^\/annual-audit-plan/,                title: 'Plan annuel d\'audit' },

    // Risques
    { match: /^\/risks-overview/,                   title: 'Vue globale des risques' },
    { match: /^\/risk-register/,                    title: 'Registre des risques' },
    { match: /^\/risk-assessment/,                  title: 'Évaluation des risques' },
    { match: /^\/chemical-register/,                title: 'Registre risques chimiques' },

    // EPI
    { match: /^\/ppe-management/,                   title: 'Gestion des EPI' },
    { match: /^\/ppe-monitoring/,                   title: 'Suivi des dotations EPI' },
    { match: /^\/ppe-request/,                      title: 'Demandes EPI' },

    // Conformité
    { match: /^\/compliance-dashboard/,             title: 'Conformité réglementaire' },
    { match: /^\/requirements/,                     title: 'Exigences réglementaires' },
    { match: /^\/position-assignments/,             title: 'Attributions par poste' },
    { match: /^\/employee-assignments/,             title: 'Attributions par employé' },
    { match: /^\/document-validation/,              title: 'Validation documents' },
    { match: /^\/document-management/,              title: 'Gestion documentaire' },

    // Communication
    { match: /^\/communication-dashboard/,          title: 'Communication HSE' },
    { match: /^\/hse-communications/,               title: 'Communications HSE' },
    { match: /^\/notifications-management/,         title: 'Notifications' },

    // Planning
    { match: /^\/hs-activities-planning/,           title: 'Planning HSE annuel' },
    { match: /^\/month-theme-subjects/,             title: 'Thèmes mensuels' },

    // Connaissances & aide
    { match: /^\/lesson-learn/,                     title: 'Retours d\'expérience' },
    { match: /^\/iso-mapping/,                      title: 'Cartographie ISO' },
    { match: /^\/iso-documents/,                    title: 'Documents ISO' },
    { match: /^\/how-to/,                           title: 'Centre de connaissances' },
    { match: /^\/features-overview/,                title: 'Vue d\'ensemble fonctionnelle' },
    { match: /^\/technical-docs/,                   title: 'Documentation technique' },
    { match: /^\/process-docs/,                     title: 'Processus métier' },

    // Rapports
    { match: /^\/monthly-reports/,                  title: 'Rapports mensuels' },
    { match: /^\/kpi-review/,                       title: 'Revue des KPI' },
    { match: /^\/performance-report/,               title: 'Rapport de performance' },
    { match: /^\/corporate-reports/,                title: 'Rapports corporate' },
    { match: /^\/executive-reports/,                title: 'Rapports exécutifs' },
    { match: /^\/trend-analysis/,                   title: 'Analyse de tendances' },

    // Administration
    { match: /^\/settings/,                         title: 'Administration' },
    { match: /^\/users-management/,                 title: 'Gestion des utilisateurs' },
    { match: /^\/targets-forecasts/,                title: 'Cibles et prévisions' },
    { match: /^\/module-management/,                title: 'Gestion des modules' },

    // Profil utilisateur
    { match: /^\/profile/,                          title: 'Mon profil' },
    { match: /^\/preferences/,                      title: 'Préférences' },
    { match: /^\/security/,                         title: 'Sécurité' },
    { match: /^\/notifications-settings/,           title: 'Paramètres notifications' },
    { match: /^\/about/,                            title: 'À propos' },
];

export function useActivePageTitle(): string {
    const { pathname } = useLocation();

    for (const entry of ROUTE_TITLES) {
        if (typeof entry.match === 'string') {
            if (pathname === entry.match) return entry.title;
        } else if (entry.match.test(pathname)) {
            return entry.title;
        }
    }
    return 'Espace de pilotage';
}
