import { Link } from 'react-router-dom';
import {
    IconAlertTriangle,
    IconClipboardCheck,
    IconShieldExclamation,
    IconHelmet,
    IconCertificate,
    IconChartBar,
    IconBell,
    IconCalendarTime,
    IconBook,
    IconBolt,
    IconSettings,
    IconUsers,
    IconArrowRight,
} from '@tabler/icons-react';
import DocsShell, {
    DocSection,
    Callout,
} from '../../UtilityComp/DocsShell';
import { DOCS_NAVIGATION } from '../../../Data/DocsNavigation';

/**
 * FeatureOverview — Cartographie fonctionnelle complète SafeX 360.
 *
 * LOT 41 : refonte avec DocsShell.
 * Inventaire structuré des 12 modules métier avec leurs fonctionnalités clés.
 */

interface ModuleFeature {
    id: string;
    title: string;
    icon: any;
    color: string;
    bg: string;
    description: string;
    features: string[];
    iso?: string[];
    route?: string;
}

const MODULES: ModuleFeature[] = [
    {
        id: 'incidents',
        title: 'Gestion des incidents',
        icon: IconAlertTriangle,
        color: 'text-red-700',
        bg: 'bg-red-50 border-red-200',
        description: 'Toute la chaîne de gestion des événements HSE — de la déclaration en 90 secondes à la clôture documentée.',
        features: [
            'Déclaration rapide (Quick Mode 90s) et déclaration complète',
            'Investigation guidée avec analyse causale (5 Pourquoi, Ishikawa)',
            'Lessons learned et capitalisation',
            'Pièces jointes (photos, témoignages, schémas anatomiques)',
            'Suivi temps réel et notifications automatiques',
        ],
        iso: ['ISO 45001 §10.2'],
        route: '/incidents',
    },
    {
        id: 'audits',
        title: 'Audits & inspections',
        icon: IconClipboardCheck,
        color: 'text-indigo-700',
        bg: 'bg-indigo-50 border-indigo-200',
        description: 'Planification annuelle, exécution sur terrain et suivi des recommandations selon ISO 19011.',
        features: [
            'Plan annuel d\'audit (programme)',
            'Exécution avec checklist par zone',
            'Recommandations et plans d\'action',
            'Suivi des actions correctives jusqu\'à la clôture',
            'Rapports d\'audit générés automatiquement',
        ],
        iso: ['ISO 19011', 'ISO 45001 §9.2'],
        route: '/audit-management',
    },
    {
        id: 'risks',
        title: 'Gestion des risques',
        icon: IconShieldExclamation,
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        description: 'Identification, évaluation et traitement des risques HSE selon la méthodologie ISO 31000.',
        features: [
            'Registre des risques avec catégorisation',
            'Matrice de criticité 5×5 (Probabilité × Impact)',
            'Évaluation périodique et historique',
            'Plans de traitement et hiérarchie des mesures',
            'Registre des risques chimiques (CMR, REACH)',
        ],
        iso: ['ISO 31000', 'ISO 45001 §6.1.2'],
        route: '/risks-overview',
    },
    {
        id: 'ppe',
        title: 'Équipements de protection (EPI)',
        icon: IconHelmet,
        color: 'text-yellow-700',
        bg: 'bg-yellow-50 border-yellow-200',
        description: 'Catalogue, dotation et suivi des EPI par employé avec gestion des stocks.',
        features: [
            'Catalogue EPI avec fiches techniques',
            'Dotation individuelle par employé',
            'Demandes de remplacement et approbation',
            'Gestion des stocks et alertes seuils',
            'Historique des dotations et durée de vie',
        ],
        iso: ['ISO 45001 §8.1.2'],
        route: '/ppe-management',
    },
    {
        id: 'compliance',
        title: 'Conformité réglementaire',
        icon: IconCertificate,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        description: 'Suivi des exigences légales applicables et statuts de conformité par site.',
        features: [
            'Registre des exigences réglementaires',
            'Attribution des exigences aux employés/postes',
            'Documents probants (certificats, autorisations)',
            'Échéancier des renouvellements',
            'Tableau de bord conformité par site',
        ],
        iso: ['ISO 45001 §6.1.3', 'ISO 14001 §6.1.3'],
        route: '/compliance-dashboard',
    },
    {
        id: 'communications',
        title: 'Communication HSE',
        icon: IconBell,
        color: 'text-rose-700',
        bg: 'bg-rose-50 border-rose-200',
        description: 'Diffusion ciblée d\'alertes, notes de service et causeries sécurité avec accusés réception.',
        features: [
            'Notifications ciblées par département / zone',
            'Causeries sécurité avec scénarios prédéfinis',
            'Accusés de réception trackés',
            'Programmation temporelle (envoi différé / récurrent)',
            'Tableau de bord engagement',
        ],
        iso: ['ISO 45001 §7.4'],
        route: '/communication-dashboard',
    },
    {
        id: 'planning',
        title: 'Planning HSE',
        icon: IconCalendarTime,
        color: 'text-violet-700',
        bg: 'bg-violet-50 border-violet-200',
        description: 'Programmation annuelle des activités HSE par thème mensuel.',
        features: [
            'Grille annuelle (12 mois × 7 catégories)',
            'Thèmes mensuels (Sécurité routière, Risques chimiques, etc.)',
            'Activités planifiées avec responsable',
            'Vue Gantt et calendrier mensuel',
            'Indicateurs de réalisation',
        ],
        iso: ['ISO 45001 §6.2'],
        route: '/hs-activities-planning',
    },
    {
        id: 'reports',
        title: 'Rapports & analytics',
        icon: IconChartBar,
        color: 'text-teal-700',
        bg: 'bg-teal-50 border-teal-200',
        description: 'KPI HSE, rapports périodiques et analyses de tendances pour pilotage stratégique.',
        features: [
            'Tableau de bord exécutif',
            'Rapports mensuels et trimestriels',
            'Analyse de tendances multi-périodes',
            'Indicateurs LTIFR, TRIFR, sévérité',
            'Export PDF et Excel',
        ],
        iso: ['ISO 45001 §9.1.1'],
        route: '/monthly-reports',
    },
    {
        id: 'knowledge',
        title: 'Centre de connaissances',
        icon: IconBook,
        color: 'text-sky-700',
        bg: 'bg-sky-50 border-sky-200',
        description: 'Documentation, guides, procédures et bibliothèque ISO.',
        features: [
            'Guides utilisateur par module',
            'Documents ISO de référence',
            'Procédures internes versionnées',
            'Recherche full-text',
            'Cartographie ISO ↔ modules',
        ],
        iso: ['ISO 45001 §7.5'],
        route: '/how-to',
    },
    {
        id: 'preventive',
        title: 'Activités préventives',
        icon: IconBolt,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        description: 'Inspections générales, tournées de management, cartes MBA.',
        features: [
            'PGI (Programme général d\'inspections)',
            'Tournées de management (Steering tours)',
            'Cartes MBA (Management By Activity)',
            'Réunions HSE périodiques',
            'Capitalisation des observations terrain',
        ],
        iso: ['ISO 45001 §8.1.2'],
        route: '/PGI',
    },
    {
        id: 'admin',
        title: 'Administration',
        icon: IconSettings,
        color: 'text-slate-700',
        bg: 'bg-slate-50 border-slate-200',
        description: 'Configuration système, référentiels métiers et paramètres globaux.',
        features: [
            'Référentiels (catégories, types, gravité, sites)',
            'Configuration des modules',
            'Cibles & prévisions HSE',
            'Paramètres globaux',
            'Logs et audit trail',
        ],
        iso: [],
        route: '/settings',
    },
    {
        id: 'users',
        title: 'Gestion des utilisateurs',
        icon: IconUsers,
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200',
        description: 'Comptes, rôles et permissions granulaires.',
        features: [
            'Création et modification des comptes',
            'Rôles métiers (Auditeur, Responsable, Direction)',
            'Permissions par module',
            'Historique des connexions',
            'Réinitialisation mots de passe',
        ],
        iso: ['ISO 27001 §A.9'],
        route: '/users-management',
    },
];

const TOC = MODULES.map((m) => ({ id: m.id, label: m.title }));

const FeatureOverview = () => {
    return (
        <DocsShell
            navigation={DOCS_NAVIGATION}
            activeId="platform-overview"
            breadcrumbs={[
                { label: 'Accueil', to: '/' },
                { label: 'Centre de connaissances', to: '/how-to' },
                { label: 'Vue d\'ensemble' },
            ]}
            title="Vue d'ensemble fonctionnelle"
            description="Cartographie complète des 12 modules métier SafeX 360, leurs fonctionnalités clés et les normes ISO associées."
            difficulty="beginner"
            toc={TOC}
            prevPage={{
                label: 'Démarrage avec SafeX 360',
                to: '/how-to',
                description: 'Guide d\'introduction',
            }}
            nextPage={{
                label: 'Cartographie ISO',
                to: '/iso-mapping',
                description: 'Modules ↔ clauses ISO',
            }}
        >
            <Callout tone="info" title="Comment lire cette page">
                Chaque section présente un module avec sa description, ses fonctionnalités principales,
                les clauses ISO qu'il couvre et un lien direct vers le module dans la plateforme.
                Pour la traçabilité normative, consultez la <Link to="/iso-mapping" className="text-sky-700 hover:underline">cartographie ISO</Link>.
            </Callout>

            {MODULES.map((mod) => (
                <DocSection key={mod.id} id={mod.id} title={mod.title}>
                    <div className="flex items-start gap-4 mb-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${mod.bg} border flex items-center justify-center`}>
                            <mod.icon size={22} className={mod.color} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] text-slate-700 leading-relaxed">
                                {mod.description}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 my-5">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mb-2">
                                Fonctionnalités clés
                            </p>
                            <ul className="space-y-1.5">
                                {mod.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                                        <span className="flex-shrink-0 mt-2 w-1 h-1 rounded-full bg-slate-400" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {mod.iso && mod.iso.length > 0 && (
                            <div className="sm:min-w-[180px]">
                                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mb-2">
                                    Conformité ISO
                                </p>
                                <ul className="space-y-1.5">
                                    {mod.iso.map((iso) => (
                                        <li key={iso} className="text-[12.5px] text-slate-700 inline-flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                            {iso}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {mod.route && (
                        <Link
                            to={mod.route}
                            className="inline-flex items-center gap-1.5 text-[13px] text-teal-700 hover:text-teal-900 transition-colors group"
                        >
                            Ouvrir le module
                            <IconArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                        </Link>
                    )}
                </DocSection>
            ))}
        </DocsShell>
    );
};

export default FeatureOverview;
