import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    IconHelpCircle,
    IconSearch,
    IconBook,
    IconLayoutGrid,
    IconLifebuoy,
    IconChevronRight,
    IconArrowRight,
    IconRocket,
    IconAlertTriangle,
    IconShieldExclamation,
    IconHelmet,
    IconClipboardCheck,
    IconCertificate,
    IconUsersGroup,
    IconClock,
    IconMail,
    IconKeyboard,
    IconBook2,
    IconFileText,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import IsoBadge, { type IsoNorm } from '../../UtilityComp/IsoBadge';

/**
 * Guide — Centre d'aide SafeX 360 (refonte premium 2026-06).
 *
 * Page client-facing unifiée, alignée sur le design system de la plateforme
 * (cartes blanches rounded-xl border-slate-200, titres serif Source Serif 4,
 * accent teal/emerald, typographie compacte). Auto-portée : ne dépend plus du
 * DocsShell ni d'aucun contenu développeur (architecture, API, schéma BDD).
 *
 * Trois onglets (segmented control) :
 *   1. Guides pratiques        — recherche + filtre catégorie + cartes guides
 *   2. Aperçu des fonctionnalités — cartographie des modules métier + normes ISO
 *   3. Ressources & support    — contact, normes ISO (IsoBadge), raccourcis clavier
 *
 * Route : /how-to (inchangée). Export par défaut : Guide (inchangé).
 */

// ─────────────────────────────────────────────────────────────────────────────
//  Données — guides pratiques (contenu réaliste, aucun lien factice)
// ─────────────────────────────────────────────────────────────────────────────

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface HelpGuide {
    id: string;
    title: string;
    description: string;
    duration: string;
    difficulty: Difficulty;
    tags: string[];
    to?: string;
}

interface GuideCategory {
    id: string;
    name: string;
    description: string;
    icon: typeof IconRocket;
    guides: HelpGuide[];
}

const GUIDE_CATEGORIES: GuideCategory[] = [
    {
        id: 'getting-started',
        name: 'Démarrage',
        description: 'Premiers pas pour prendre en main la plateforme HSE.',
        icon: IconRocket,
        guides: [
            {
                id: 'platform-overview',
                title: 'Présentation de la plateforme',
                description:
                    'Comprendre la structure de SafeX 360 : barre latérale, en-tête, espace de travail et bouton SOS.',
                duration: '5 min de lecture',
                difficulty: 'beginner',
                tags: ['présentation', 'navigation', 'bases'],
            },
            {
                id: 'first-login',
                title: 'Votre première connexion',
                description:
                    "Connexion initiale, changement du mot de passe provisoire et accès au tableau de bord HSE.",
                duration: '3 min de lecture',
                difficulty: 'beginner',
                tags: ['connexion', 'compte', 'mot de passe'],
            },
            {
                id: 'navigation-basics',
                title: 'Bases de la navigation',
                description:
                    "Naviguer efficacement entre les 12 modules métier via le menu latéral repliable.",
                duration: '3 min de lecture',
                difficulty: 'beginner',
                tags: ['navigation', 'menu', 'interface'],
            },
        ],
    },
    {
        id: 'incidents',
        name: 'Gestion des incidents',
        description: 'Déclaration, investigation et actions correctives.',
        icon: IconAlertTriangle,
        guides: [
            {
                id: 'report-incident',
                title: 'Déclarer un incident',
                description:
                    "Procédure pas à pas pour déclarer un incident (mode rapide 90 s ou déclaration complète) avec pièces jointes.",
                duration: '6 min de lecture',
                difficulty: 'beginner',
                tags: ['incident', 'déclaration', 'sécurité'],
                to: '/incidents/report',
            },
            {
                id: 'investigation-process',
                title: "Mener une investigation",
                description:
                    "Conduire une analyse causale rigoureuse (5 Pourquoi, Ishikawa) et documenter les conclusions.",
                duration: '10 min de lecture',
                difficulty: 'intermediate',
                tags: ['investigation', 'analyse', 'cause racine'],
                to: '/investigation',
            },
            {
                id: 'corrective-actions',
                title: 'Suivre les actions correctives',
                description:
                    "Créer, assigner et suivre les actions correctives de l'identification jusqu'à la clôture vérifiée.",
                duration: '8 min de lecture',
                difficulty: 'intermediate',
                tags: ['actions', 'suivi', 'clôture'],
                to: '/corrective',
            },
        ],
    },
    {
        id: 'risks',
        name: 'Gestion des risques',
        description: 'Évaluation des risques et registre chimique.',
        icon: IconShieldExclamation,
        guides: [
            {
                id: 'risk-assessment',
                title: "Évaluer un risque",
                description:
                    "Cotation d'un risque via la matrice de criticité 5×5 (probabilité × sévérité) selon ISO 31000.",
                duration: '9 min de lecture',
                difficulty: 'intermediate',
                tags: ['risque', 'matrice', 'méthodologie'],
                to: '/risks-overview',
            },
            {
                id: 'chemical-register',
                title: 'Renseigner le registre chimique',
                description:
                    "Identifier et coter les risques chimiques (classification SGH, n° CAS) et tracer les fiches.",
                duration: '12 min de lecture',
                difficulty: 'advanced',
                tags: ['chimique', 'SGH', 'fiches'],
                to: '/chemical-register',
            },
            {
                id: 'control-measures',
                title: 'Mettre en œuvre les mesures de maîtrise',
                description:
                    "Appliquer la hiérarchie des contrôles (STOP) et planifier le suivi de leur efficacité.",
                duration: '7 min de lecture',
                difficulty: 'intermediate',
                tags: ['contrôles', 'hiérarchie', 'STOP'],
            },
        ],
    },
    {
        id: 'ppe',
        name: 'Équipements de protection',
        description: "Demande, dotation et suivi des EPI.",
        icon: IconHelmet,
        guides: [
            {
                id: 'ppe-request',
                title: "Demander un EPI",
                description:
                    "Soumettre une demande d'équipement de protection individuelle et suivre son approbation.",
                duration: '4 min de lecture',
                difficulty: 'beginner',
                tags: ['epi', 'demande', 'dotation'],
                to: '/ppe-request',
            },
            {
                id: 'ppe-monitoring',
                title: "Suivre la conformité des EPI",
                description:
                    "Surveiller les dotations par employé, les durées de vie et les seuils de réapprovisionnement.",
                duration: '8 min de lecture',
                difficulty: 'intermediate',
                tags: ['suivi', 'conformité', 'stock'],
                to: '/ppe-monitoring',
            },
        ],
    },
    {
        id: 'audits',
        name: 'Audits & conformité',
        description: 'Planification, exécution et conformité réglementaire.',
        icon: IconClipboardCheck,
        guides: [
            {
                id: 'audit-planning',
                title: "Planifier le programme d'audit annuel",
                description:
                    "Construire le plan annuel d'audit fondé sur les risques et les KPI, selon ISO 19011.",
                duration: '11 min de lecture',
                difficulty: 'intermediate',
                tags: ['audit', 'planification', 'programme'],
                to: '/audit-program',
            },
            {
                id: 'conducting-audits',
                title: 'Exécuter un audit terrain',
                description:
                    "Dérouler une checklist par zone, consigner les constats et générer le rapport d'audit.",
                duration: '14 min de lecture',
                difficulty: 'advanced',
                tags: ['audit', 'exécution', 'checklist'],
                to: '/audit-management',
            },
            {
                id: 'compliance-tracking',
                title: 'Suivre la conformité réglementaire',
                description:
                    "Tenir le registre des exigences légales, attacher les documents probants et suivre les échéances.",
                duration: '9 min de lecture',
                difficulty: 'intermediate',
                tags: ['conformité', 'exigences', 'documents'],
                to: '/compliance-dashboard',
            },
        ],
    },
    {
        id: 'administration',
        name: 'Administration',
        description: 'Comptes, rôles, permissions et référentiels.',
        icon: IconUsersGroup,
        guides: [
            {
                id: 'user-management',
                title: 'Gérer les utilisateurs',
                description:
                    "Créer des comptes, attribuer des rôles métiers et régler les permissions par module.",
                duration: '10 min de lecture',
                difficulty: 'advanced',
                tags: ['utilisateurs', 'rôles', 'permissions'],
                to: '/users-admin',
            },
            {
                id: 'module-configuration',
                title: 'Configurer les modules',
                description:
                    "Activer les modules, personnaliser les référentiels (catégories, sites, gravité) et les paramètres.",
                duration: '8 min de lecture',
                difficulty: 'intermediate',
                tags: ['modules', 'référentiels', 'paramètres'],
                to: '/settings',
            },
        ],
    },
];

// Préfixe étoiles pour ne pas reposer uniquement sur la couleur (a11y).
const DIFFICULTY_META: Record<Difficulty, { label: string; chip: string }> = {
    beginner: { label: '★ Débutant', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    intermediate: { label: '★★ Intermédiaire', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    advanced: { label: '★★★ Avancé', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Données — aperçu des fonctionnalités (modules métier)
// ─────────────────────────────────────────────────────────────────────────────

interface ModuleFeature {
    id: string;
    title: string;
    description: string;
    icon: typeof IconRocket;
    features: string[];
    iso: IsoNorm[];
    to: string;
}

const MODULES: ModuleFeature[] = [
    {
        id: 'incidents',
        title: 'Gestion des incidents',
        description: 'De la déclaration en 90 secondes à la clôture documentée.',
        icon: IconAlertTriangle,
        features: ['Déclaration rapide & complète', 'Investigation guidée (5 Pourquoi, Ishikawa)', 'Lessons learned'],
        iso: ['ISO 45001'],
        to: '/incidents',
    },
    {
        id: 'audits',
        title: 'Audits & inspections',
        description: 'Planification annuelle, exécution terrain et suivi des recommandations.',
        icon: IconClipboardCheck,
        features: ["Plan annuel d'audit", 'Checklist par zone', 'Recommandations & plans d\'action'],
        iso: ['ISO 19011', 'ISO 45001'],
        to: '/audit-management',
    },
    {
        id: 'risks',
        title: 'Gestion des risques',
        description: 'Identification, évaluation et traitement selon ISO 31000.',
        icon: IconShieldExclamation,
        features: ['Registre des risques', 'Matrice de criticité 5×5', 'Registre chimique (SGH)'],
        iso: ['ISO 31000', 'ISO 45001'],
        to: '/risks-overview',
    },
    {
        id: 'ppe',
        title: 'Équipements de protection',
        description: 'Catalogue, dotation et suivi des EPI par employé.',
        icon: IconHelmet,
        features: ['Catalogue & fiches techniques', 'Dotation individuelle', 'Gestion des stocks'],
        iso: ['ISO 45001'],
        to: '/ppe-management',
    },
    {
        id: 'compliance',
        title: 'Conformité réglementaire',
        description: 'Suivi des exigences légales applicables par site.',
        icon: IconCertificate,
        features: ['Registre des exigences', 'Documents probants', 'Échéancier des renouvellements'],
        iso: ['ISO 45001', 'ISO 14001'],
        to: '/compliance-dashboard',
    },
    {
        id: 'reports',
        title: 'Rapports & analytics',
        description: 'KPI HSE, rapports périodiques et analyses de tendances.',
        icon: IconFileText,
        features: ['Tableau de bord exécutif', 'Indicateurs LTIFR / TRIFR', 'Export PDF & Excel'],
        iso: ['ISO 45001'],
        to: '/monthly-reports',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Données — ressources & support
// ─────────────────────────────────────────────────────────────────────────────

const ISO_REFERENCES: { norm: IsoNorm; usage: string }[] = [
    { norm: 'ISO 45001', usage: 'Santé & sécurité au travail — incidents, EPI, conformité.' },
    { norm: 'ISO 14001', usage: 'Management environnemental — conformité, aspects & impacts.' },
    { norm: 'ISO 9001', usage: 'Management de la qualité — maîtrise documentaire.' },
    { norm: 'ISO 19011', usage: "Lignes directrices pour l'audit des systèmes de management." },
    { norm: 'ISO 31000', usage: 'Management du risque — évaluation et traitement.' },
];

const SHORTCUTS: { keys: string; label: string }[] = [
    { keys: 'Ctrl + K', label: 'Recherche globale' },
    { keys: 'G puis D', label: 'Aller au tableau de bord' },
    { keys: 'G puis I', label: 'Aller aux incidents' },
    { keys: 'Échap', label: 'Fermer une fenêtre ou un panneau' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

type TabKey = 'guides' | 'features' | 'resources';

const TABS: { key: TabKey; label: string; icon: typeof IconBook }[] = [
    { key: 'guides', label: 'Guides pratiques', icon: IconBook },
    { key: 'features', label: 'Aperçu des fonctionnalités', icon: IconLayoutGrid },
    { key: 'resources', label: 'Ressources & support', icon: IconLifebuoy },
];

const Guide = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('guides');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string>('all');

    const matchesSearch = (g: HelpGuide): boolean => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            g.title.toLowerCase().includes(q) ||
            g.description.toLowerCase().includes(q) ||
            g.tags.some((t) => t.toLowerCase().includes(q))
        );
    };

    const filteredCategories = useMemo(() => {
        return GUIDE_CATEGORIES.map((cat) => ({
            ...cat,
            guides: cat.guides.filter(matchesSearch),
        })).filter((cat) => {
            if (category !== 'all' && cat.id !== category) return false;
            return cat.guides.length > 0;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, category]);

    const totalResults = filteredCategories.reduce((n, c) => n + c.guides.length, 0);

    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: "Centre d'aide" },
                ]}
                icon={<IconHelpCircle size={22} stroke={2} />}
                iconColor="cyan"
                title="Centre d'aide"
                subtitle="Guides, fonctionnalités et ressources de la plateforme HSE SafeX 360"
            />

            {/* Segmented control */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {TABS.map((tab) => {
                    const isActive = tab.key === activeTab;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            aria-pressed={isActive}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
                                isActive
                                    ? 'bg-gradient-to-br from-teal-500 to-emerald-400 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <tab.icon size={15} stroke={1.8} aria-hidden="true" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'guides' && (
                <GuidesTab
                    search={search}
                    setSearch={setSearch}
                    category={category}
                    setCategory={setCategory}
                    filteredCategories={filteredCategories}
                    totalResults={totalResults}
                />
            )}
            {activeTab === 'features' && <FeaturesTab />}
            {activeTab === 'resources' && <ResourcesTab />}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Onglet 1 — Guides pratiques
// ─────────────────────────────────────────────────────────────────────────────

const GuidesTab = ({
    search,
    setSearch,
    category,
    setCategory,
    filteredCategories,
    totalResults,
}: {
    search: string;
    setSearch: (v: string) => void;
    category: string;
    setCategory: (v: string) => void;
    filteredCategories: GuideCategory[];
    totalResults: number;
}) => (
    <div className="space-y-5">
        {/* Barre recherche + filtre */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative md:col-span-2">
                    <IconSearch
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        aria-label="Rechercher dans les guides"
                        placeholder="Rechercher un guide, un mot-clé…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition"
                    />
                </div>
                <select
                    aria-label="Filtrer par catégorie"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition"
                >
                    <option value="all">Toutes les catégories</option>
                    {GUIDE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
                <p className="text-[14px] text-slate-700">Aucun guide ne correspond à votre recherche.</p>
                <p className="text-[12.5px] text-slate-500 mt-1">Essayez un autre mot-clé ou réinitialisez le filtre.</p>
            </div>
        ) : (
            <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500 px-0.5">
                {totalResults} {totalResults > 1 ? 'guides disponibles' : 'guide disponible'}
            </p>
        )}

        {filteredCategories.map((cat) => (
            <section key={cat.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                        <cat.icon size={16} stroke={1.8} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h2
                            className="text-slate-800 leading-tight"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '15px' }}
                        >
                            {cat.name}
                        </h2>
                        <p className="text-[12px] text-slate-500 leading-snug">{cat.description}</p>
                    </div>
                    <span className="ml-auto text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                        {cat.guides.length}
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {cat.guides.map((g) => {
                        const diff = DIFFICULTY_META[g.difficulty];
                        const Wrapper = g.to ? Link : 'div';
                        const wrapperProps = g.to ? { to: g.to } : {};
                        return (
                            <Wrapper
                                key={g.id}
                                {...(wrapperProps as any)}
                                className={`group block px-5 py-4 transition-colors ${
                                    g.to ? 'hover:bg-slate-50/70 cursor-pointer' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[14px] font-medium text-slate-800 group-hover:text-teal-700 transition-colors">
                                            {g.title}
                                        </h3>
                                        <p className="text-[12.5px] text-slate-600 mt-0.5 leading-relaxed">
                                            {g.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                            <span
                                                className={`text-[11px] px-2 py-0.5 rounded-full border ${diff.chip}`}
                                            >
                                                {diff.label}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
                                                <IconClock size={12} aria-hidden="true" />
                                                {g.duration}
                                            </span>
                                            {g.tags.map((t) => (
                                                <span
                                                    key={t}
                                                    className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200"
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {g.to && (
                                        <IconArrowRight
                                            size={16}
                                            className="flex-shrink-0 mt-1 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all"
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                            </Wrapper>
                        );
                    })}
                </div>
            </section>
        ))}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Onglet 2 — Aperçu des fonctionnalités
// ─────────────────────────────────────────────────────────────────────────────

const FeaturesTab = () => (
    <div className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
            <h2
                className="text-slate-800"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '15px' }}
            >
                Cartographie fonctionnelle
            </h2>
            <p className="text-[12.5px] text-slate-600 mt-1 leading-relaxed max-w-3xl">
                Les modules métier de SafeX 360 et les normes ISO qu'ils couvrent. Cliquez sur un module
                pour l'ouvrir directement.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((mod) => (
                <Link
                    key={mod.id}
                    to={mod.to}
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:border-teal-200 hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                            <mod.icon size={18} stroke={1.8} aria-hidden="true" />
                        </span>
                        <h3
                            className="text-slate-800 group-hover:text-teal-700 transition-colors leading-tight"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '14.5px' }}
                        >
                            {mod.title}
                        </h3>
                    </div>
                    <div className="px-5 py-4 flex-1 flex flex-col">
                        <p className="text-[12.5px] text-slate-600 leading-relaxed">{mod.description}</p>
                        <ul className="mt-3 space-y-1.5">
                            {mod.features.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-[12.5px] text-slate-700">
                                    <span className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-teal-500" />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-auto pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                {mod.iso.map((n) => (
                                    <IsoBadge key={n} norm={n} size="sm" />
                                ))}
                            </div>
                            <span className="inline-flex items-center gap-1 text-[12px] text-teal-700 group-hover:text-teal-900">
                                Ouvrir
                                <IconArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                            </span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Onglet 3 — Ressources & support
// ─────────────────────────────────────────────────────────────────────────────

const ResourcesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Support */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                    <IconLifebuoy size={16} stroke={1.8} aria-hidden="true" />
                </span>
                <h2
                    className="text-slate-800"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '15px' }}
                >
                    Contacter le support
                </h2>
            </div>
            <div className="p-5 space-y-4">
                <p className="text-[12.5px] text-slate-600 leading-relaxed">
                    Notre équipe support accompagne les responsables HSE, auditeurs et administrateurs.
                    Réponse sous 1 jour ouvré.
                </p>
                <a
                    href="mailto:support@safex360.com"
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:border-teal-200 hover:bg-teal-50/40 transition-colors group"
                >
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-50 text-teal-700 ring-1 ring-slate-200">
                        <IconMail size={16} stroke={1.8} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-slate-800 group-hover:text-teal-700 transition-colors">
                            support@safex360.com
                        </span>
                        <span className="block text-[11.5px] text-slate-500">
                            Assistance fonctionnelle &amp; technique
                        </span>
                    </span>
                </a>
                <div className="flex items-center gap-2 text-[12px] text-slate-500">
                    <IconClock size={13} aria-hidden="true" />
                    Disponible du lundi au vendredi, 8h–17h GMT.
                </div>
            </div>
        </section>

        {/* Raccourcis clavier */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                    <IconKeyboard size={16} stroke={1.8} aria-hidden="true" />
                </span>
                <h2
                    className="text-slate-800"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '15px' }}
                >
                    Raccourcis &amp; astuces
                </h2>
            </div>
            <ul className="p-5 space-y-2.5">
                {SHORTCUTS.map((s) => (
                    <li key={s.keys} className="flex items-center justify-between gap-3">
                        <span className="text-[12.5px] text-slate-700">{s.label}</span>
                        <kbd className="text-[11px] font-mono px-2 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                            {s.keys}
                        </kbd>
                    </li>
                ))}
            </ul>
        </section>

        {/* Référentiel ISO */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                    <IconCertificate size={16} stroke={1.8} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h2
                        className="text-slate-800"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '15px' }}
                    >
                        Normes ISO de référence
                    </h2>
                    <p className="text-[12px] text-slate-500 leading-snug">
                        Cadres normatifs sur lesquels s'appuie la plateforme.
                    </p>
                </div>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ISO_REFERENCES.map((ref) => (
                    <div
                        key={ref.norm}
                        className="flex items-start gap-3 rounded-lg border border-slate-200 p-3.5"
                    >
                        <IsoBadge norm={ref.norm} size="md" />
                        <div className="min-w-0">
                            <p className="text-[13px] font-medium text-slate-800">{ref.norm}</p>
                            <p className="text-[12px] text-slate-600 leading-relaxed mt-0.5">{ref.usage}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap gap-2.5">
                <Link
                    to="/iso-documents"
                    className="inline-flex items-center gap-1.5 text-[12.5px] text-teal-700 hover:text-teal-900 transition-colors group"
                >
                    <IconBook2 size={14} aria-hidden="true" />
                    Documents ISO de référence
                    <IconChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </Link>
                <Link
                    to="/iso-mapping"
                    className="inline-flex items-center gap-1.5 text-[12.5px] text-teal-700 hover:text-teal-900 transition-colors group"
                >
                    <IconClipboardCheck size={14} aria-hidden="true" />
                    Cartographie ISO ↔ modules
                    <IconChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </Link>
            </div>
        </section>
    </div>
);

export default Guide;
