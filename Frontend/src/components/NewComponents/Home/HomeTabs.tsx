/**
 * HomeTabs — Page d'accueil organisée en 6 onglets thématiques.
 *
 * Au lieu d'afficher les 21 modules en grille plate, on les regroupe
 * dans 6 grandes familles métier alignées sur les normes ISO :
 *   - Pilotage         : reporting + analytics + planification
 *   - Sécurité         : ISO 45001 (prévention + maîtrise + intervention)
 *   - Santé            : ISO 45001 §9.2 (surveillance médicale)
 *   - Environnement    : ISO 14001 (à venir Phase 9)
 *   - Système ISO      : ISO 9001 + 19011 (audit qualité)
 *   - Administration   : configuration plateforme
 *
 * Le composant réutilise les `moduleGroups` exportés de Home.tsx (aucune
 * duplication). Il filtre par `tab.moduleIds` et rend les mêmes tuiles
 * que la version originale. Les modules ne figurant dans aucun onglet
 * apparaissent sous "Autres".
 *
 * REGLE D'OR : aucun lien existant n'est cassé. Le router pointe vers
 * cette nouvelle page (HomePage), qui charge HomeTabs qui à son tour
 * réutilise Home.tsx. Si l'utilisateur n'a pas javascript activé ou
 * un problème survient, le fallback est Home.tsx classique.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text } from '@mantine/core';
import { IconChevronRight, IconApps } from '@tabler/icons-react';
import { moduleGroups, type ModuleCard } from './Home';
import { HOME_TABS, type HomeTabId, type HomeTab } from './homeCategories';
import { isModuleEnabled } from '../data/ModuleConfig';
import ModuleSubscriptionModal from './ModuleSubscriptionModal';

const ACCENT_HEX: Record<string, string> = {
    'preventives-activities': '#10b981',
    'preventives-activities-2': '#3b82f6',
    'actions-managers': '#f97316',
    'pending-actions-hub': '#14b8a6',
    'risk-management': '#ef4444',
    'ppe-management': '#eab308',
    'audits-management': '#6366f1',
    'compliance-management': '#10b981',
    'planning': '#f59e0b',
    'knowledge-management': '#06b6d4',
    'communication-management': '#ec4899',
    'reports': '#14b8a6',
    'help': '#8b5cf6',
    'iso-documents': '#64748b',
    'parameters': '#64748b',
    'emergency-management': '#b91c1c',
    'admin': '#0d9488',
    'users-management-hub': '#ea580c',
    'modules-management': '#4f46e5',
    'dosimetry': '#7c3aed',
    'blast': '#b45309',
};

/**
 * Onglet synthese "Toutes les applications" — affiche TOUS les modules dans
 * l'ordre du moduleGroups d'origine. Ajoute en tete de la liste d'onglets
 * pour offrir une vue d'ensemble sans naviguer dans les categories.
 */
const ALL_APPS_TAB: HomeTab = {
    id: 'all' as HomeTabId,
    label: 'Toutes les applications',
    icon: IconApps,
    description: 'Vue d’ensemble exhaustive des modules de la plateforme SafeX 360',
    accentHex: '#0F766E', // teal-700 — couleur identite SafeX
    moduleIds: [], // place-holder — la liste reelle est calculee dynamiquement
};

export default function HomeTabs() {
    const navigate = useNavigate();
    const [activeTabId, setActiveTabId] = useState<HomeTabId>('all' as HomeTabId);
    const [pendingSubscription, setPendingSubscription] = useState<ModuleCard | null>(null);

    /** Liste complete des onglets : "Toutes" + 6 categories thematiques. */
    const ALL_TABS = useMemo<HomeTab[]>(() => [ALL_APPS_TAB, ...HOME_TABS], []);

    const activeTab = useMemo<HomeTab>(
        () => ALL_TABS.find((t) => t.id === activeTabId) ?? ALL_TABS[0],
        [activeTabId, ALL_TABS],
    );

    /** Modules visibles dans l'onglet actif, dans l'ordre declare. */
    const visibleModules = useMemo(() => {
        // Onglet "Toutes les applications" : retourne moduleGroups dans l'ordre d'origine
        if (activeTab.id === ('all' as HomeTabId)) {
            return moduleGroups;
        }
        return activeTab.moduleIds
            .map((id) => moduleGroups.find((m) => m.id === id))
            .filter((m): m is ModuleCard => Boolean(m));
    }, [activeTab]);

    /** Compte des modules par onglet (badge sur le tab). */
    const tabCounts = useMemo(() => {
        const counts: Record<string, number> = {
            all: moduleGroups.length,
            pilotage: 0, securite: 0, sante: 0, environnement: 0, iso: 0, admin: 0,
        };
        HOME_TABS.forEach((t) => {
            counts[t.id] = t.moduleIds.filter((id) =>
                moduleGroups.some((m) => m.id === id),
            ).length;
        });
        return counts;
    }, []);

    const openModule = (module: ModuleCard) => {
        if (module.requiredModuleId && !isModuleEnabled(module.requiredModuleId)) {
            setPendingSubscription(module);
            return;
        }
        navigate(module.url);
    };

    return (
        <div className="w-full space-y-5">
            {/* En-tête avec sous-titre ISO */}
            <header className="flex items-end justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                    <h1
                        className="text-slate-900 leading-tight"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '26px',
                        }}
                    >
                        Vos Applications
                    </h1>
                    <p className="text-[13px] text-slate-500 mt-1 max-w-2xl">
                        Plateforme intégrée Santé · Sécurité · Environnement
                    </p>
                </div>
            </header>

            {/* Barre d'onglets sticky */}
            <nav
                className="sticky top-0 z-10 bg-[#FAF8F3]/95 backdrop-blur-sm border-b border-slate-200 -mx-5 px-5 py-2"
                role="tablist"
                aria-label="Catégories de modules HSE"
            >
                <div className="flex gap-1 overflow-x-auto -mb-px">
                    {ALL_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = tab.id === activeTabId;
                        const count = tabCounts[tab.id];
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`tab-panel-${tab.id}`}
                                onClick={() => setActiveTabId(tab.id)}
                                className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-t-lg whitespace-nowrap transition-all border-b-2 ${
                                    isActive
                                        ? 'bg-white text-slate-900 border-current shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border-transparent'
                                }`}
                                style={isActive ? { borderColor: tab.accentHex } : undefined}
                            >
                                <Icon
                                    size={16}
                                    stroke={isActive ? 2 : 1.7}
                                    className={isActive ? '' : 'opacity-70'}
                                />
                                <span
                                    className="text-[13.5px]"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: isActive ? 600 : 500,
                                    }}
                                >
                                    {tab.label}
                                </span>
                                {count > 0 && (
                                    <span
                                        className={`text-[10.5px] px-1.5 py-0.5 rounded-full ${
                                            isActive
                                                ? 'bg-slate-100 text-slate-700'
                                                : 'bg-slate-200/70 text-slate-600'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Panneau actif */}
            <section
                role="tabpanel"
                id={`tab-panel-${activeTab.id}`}
                aria-labelledby={`tab-${activeTab.id}`}
                className="space-y-4"
            >
                <div className="flex items-start gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                            backgroundColor: activeTab.accentHex + '15',
                            color: activeTab.accentHex,
                        }}
                    >
                        <activeTab.icon size={20} stroke={1.8} />
                    </div>
                    <div className="min-w-0">
                        <h2
                            className="text-slate-900 leading-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '18px',
                            }}
                        >
                            {activeTab.label}
                        </h2>
                        <Text size="xs" className="text-slate-500 mt-0.5">
                            {activeTab.description}
                        </Text>
                    </div>
                </div>

                {/* Grille de modules */}
                {visibleModules.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
                        <p className="text-[14px] font-medium text-slate-700">
                            Aucun module dans cette catégorie pour le moment
                        </p>
                        <p className="text-[12.5px] text-slate-500 mt-1">
                            De nouveaux modules y seront ajoutés dans les prochaines phases.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visibleModules.map((module) => {
                            const Icon = module.icon;
                            const accent = ACCENT_HEX[module.id] ?? '#64748b';
                            const enabled =
                                !module.requiredModuleId || isModuleEnabled(module.requiredModuleId);

                            return (
                                <button
                                    key={module.id}
                                    type="button"
                                    onClick={() => openModule(module)}
                                    className={`cursor-pointer group relative text-left bg-white border border-slate-200 rounded-2xl p-4 transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 ${
                                        !enabled ? 'opacity-75' : ''
                                    }`}
                                    aria-label={`Ouvrir le module ${module.title}`}
                                >
                                    {/* Barre d'accent supérieure */}
                                    <span
                                        className="absolute top-0 left-4 right-4 h-0.5 rounded-b"
                                        style={{ backgroundColor: accent }}
                                        aria-hidden="true"
                                    />

                                    <div className="flex items-start gap-3 mb-2">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                backgroundColor: accent + '15',
                                                color: accent,
                                            }}
                                        >
                                            <Icon size={20} stroke={1.8} />
                                        </div>
                                        <h3
                                            className="text-slate-900 leading-snug min-w-0 flex-1"
                                            style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontWeight: 600,
                                                fontSize: '14.5px',
                                            }}
                                        >
                                            {module.title}
                                        </h3>
                                    </div>

                                    <p className="text-[12.5px] text-slate-600 leading-relaxed line-clamp-3 mb-3">
                                        {module.description}
                                    </p>

                                    <div className="flex items-center justify-between text-[11.5px]">
                                        <span className="text-slate-500">
                                            {module.items.length} sous-module
                                            {module.items.length > 1 ? 's' : ''}
                                        </span>
                                        <span
                                            className="inline-flex items-center gap-1 text-slate-600 group-hover:gap-1.5 transition-all"
                                            style={{ color: accent }}
                                        >
                                            Ouvrir
                                            <IconChevronRight size={12} stroke={2} />
                                        </span>
                                    </div>

                                    {!enabled && (
                                        <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                            Désactivé
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Indication ISO en bas */}
                <div className="text-center pt-4">
                    <p className="text-[10.5px] text-slate-400 uppercase tracking-[0.16em]">
                        SafeX 360 · Plateforme HSE ·{' '}
                        {moduleGroups.length} modules
                    </p>
                </div>
            </section>

            <ModuleSubscriptionModal
                isOpen={pendingSubscription !== null}
                moduleName={pendingSubscription?.title ?? ''}
                onClose={() => setPendingSubscription(null)}
            />
        </div>
    );
}
