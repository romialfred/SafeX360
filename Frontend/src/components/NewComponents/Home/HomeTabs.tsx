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

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconChevronRight, IconApps, IconX, IconArrowUpRight, IconRotateClockwise } from '@tabler/icons-react';
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
    const { t } = useTranslation('home');
    // Résolveurs i18n : retombent sur le texte FR d'origine si une clé manque.
    const tabLabel = (id: string) => t(`tabs.${id}.label`);
    const tabDesc = (id: string) => t(`tabs.${id}.description`);
    const modTitle = (m: ModuleCard) => t(`modules.${m.id}.title`, { defaultValue: m.title });
    const modDesc = (m: ModuleCard) => t(`modules.${m.id}.description`, { defaultValue: m.description });
    const modItems = (m: ModuleCard): string[] => {
        const arr = t(`modules.${m.id}.items`, { returnObjects: true, defaultValue: [] }) as unknown;
        return Array.isArray(arr) && arr.length
            ? (arr as string[])
            : m.items.map((it) => (typeof it === 'string' ? it : it.label));
    };
    const [activeTabId, setActiveTabId] = useState<HomeTabId>('all' as HomeTabId);
    const [pendingSubscription, setPendingSubscription] = useState<ModuleCard | null>(null);
    // Module dont l'aperçu retourné (face arrière agrandie) est ouvert.
    const [flipped, setFlipped] = useState<ModuleCard | null>(null);

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

    // Aperçu retourné : verrouille le scroll de fond et ferme via Échap.
    useEffect(() => {
        if (!flipped) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setFlipped(null);
        };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [flipped]);

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
                        {t('header.title')}
                    </h1>
                    <p className="text-[13px] text-slate-500 mt-1 max-w-2xl">
                        {t('header.subtitle')}
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
                                    size={17}
                                    stroke={isActive ? 2.1 : 1.9}
                                    className={isActive ? '' : 'opacity-90'}
                                    style={{ color: tab.accentHex }}
                                />
                                <span
                                    className="text-[13.5px]"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: isActive ? 600 : 500,
                                    }}
                                >
                                    {tabLabel(tab.id)}
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
                            {tabLabel(activeTab.id)}
                        </h2>
                        <Text size="xs" className="text-slate-500 mt-0.5">
                            {tabDesc(activeTab.id)}
                        </Text>
                    </div>
                </div>

                {/* Grille de modules */}
                {visibleModules.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
                        <p className="text-[14px] font-medium text-slate-700">
                            {t('card.emptyTitle')}
                        </p>
                        <p className="text-[12.5px] text-slate-500 mt-1">
                            {t('card.emptyBody')}
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
                                <div
                                    key={module.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openModule(module)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openModule(module);
                                        }
                                    }}
                                    className={`cursor-pointer group relative text-left bg-white border border-slate-200 rounded-2xl p-4
                                                transition-all duration-300 will-change-transform hover:-translate-y-1 hover:scale-[1.02]
                                                hover:shadow-[0_16px_36px_-16px_rgba(15,23,42,0.35)]
                                                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 ${
                                        !enabled ? 'opacity-75' : ''
                                    }`}
                                    style={{ ['--accent']: accent } as React.CSSProperties}
                                    aria-label={`${t('card.open')} — ${modTitle(module)}`}
                                >
                                    {/* Barre d'accent supérieure — s'épaissit et s'étend au survol */}
                                    <span
                                        className="absolute top-0 left-4 right-4 h-0.5 rounded-b transition-all duration-300 group-hover:h-1 group-hover:left-0 group-hover:right-0"
                                        style={{ backgroundColor: accent }}
                                        aria-hidden="true"
                                    />

                                    {/* Bouton retournement → aperçu agrandi (n'ouvre pas le module) */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFlipped(module);
                                        }}
                                        className="absolute top-2.5 right-2.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-400
                                                   opacity-0 transition-all duration-200 hover:text-[color:var(--accent)] hover:border-[color:var(--accent)]
                                                   group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                                        aria-label={modTitle(module)}
                                        title={t('card.open')}
                                    >
                                        <IconRotateClockwise size={14} stroke={1.7} />
                                    </button>

                                    <div className="flex items-start gap-3 mb-2 pr-8">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
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
                                            {modTitle(module)}
                                        </h3>
                                    </div>

                                    <p className="text-[12.5px] text-slate-600 leading-relaxed line-clamp-3 mb-3">
                                        {modDesc(module)}
                                    </p>

                                    <div className="flex items-center justify-between text-[11.5px]">
                                        <span className="text-slate-500">
                                            {t('card.subModule', { count: module.items.length })}
                                        </span>
                                        <span
                                            className="inline-flex items-center gap-1 text-slate-600 group-hover:gap-1.5 transition-all"
                                            style={{ color: accent }}
                                        >
                                            {t('card.open')}
                                            <IconChevronRight size={12} stroke={2} />
                                        </span>
                                    </div>

                                    {!enabled && (
                                        <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                            {t('card.disabled')}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Indication ISO en bas */}
                <div className="text-center pt-4">
                    <p className="text-[10.5px] text-slate-400 uppercase tracking-[0.16em]">
                        {t('card.footer', { count: moduleGroups.length })}
                    </p>
                </div>
            </section>

            {/* ─── Aperçu retourné : face arrière agrandie (~2,5× la tuile) ─── */}
            {flipped && (() => {
                const accent = ACCENT_HEX[flipped.id] ?? '#0f766e';
                const FIcon = flipped.icon;
                const enabled = !flipped.requiredModuleId || isModuleEnabled(flipped.requiredModuleId);
                const subs = modItems(flipped);
                return (
                    <div
                        // z-[1100] = Z.modal : à z-[60] la modale passait SOUS le
                        // header fixe (z-200) — croix et boutons masqués/incliquables.
                        className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${t('flip.summary')} — ${modTitle(flipped)}`}
                        onClick={() => setFlipped(null)}
                    >
                        <style>{`
                            @keyframes safexBackdropIn { from { opacity: 0 } to { opacity: 1 } }
                            @keyframes safexFlipIn {
                                0%   { opacity: 0; transform: perspective(1600px) rotateY(-78deg) scale(.86); }
                                55%  { opacity: 1; }
                                100% { opacity: 1; transform: perspective(1600px) rotateY(0deg) scale(1); }
                            }
                        `}</style>

                        <div
                            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
                            style={{ animation: 'safexBackdropIn .2s ease both' }}
                        />

                        <div
                            onClick={(e) => e.stopPropagation()}
                            // max-h + scroll : sur écran court, les boutons « Ouvrir le
                            // module » / « Retour » étaient clippés par overflow-hidden.
                            className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
                            style={{
                                animation: 'safexFlipIn .55s cubic-bezier(.2,.7,.2,1) both',
                                transformOrigin: 'center',
                                borderTop: `4px solid ${accent}`,
                            }}
                        >
                            {/* En-tête teinté à la couleur du module */}
                            <div
                                className="px-7 pt-6 pb-5"
                                style={{ background: `linear-gradient(160deg, ${accent}1f, ${accent}08 45%, transparent 75%)` }}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                                        style={{ backgroundColor: accent + '24', color: accent }}
                                    >
                                        <FIcon size={28} stroke={1.7} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: accent }}>
                                            {t('flip.summary')}
                                        </p>
                                        <h2
                                            className="mt-0.5 leading-tight text-slate-900"
                                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '22px' }}
                                        >
                                            {modTitle(flipped)}
                                        </h2>
                                        <p className="mt-1 text-[12px] text-slate-500">
                                            {t('card.subModule', { count: subs.length })}
                                            {!enabled ? ` · ${t('card.disabled')}` : ''}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFlipped(null)}
                                        aria-label="Fermer l'aperçu"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                    >
                                        <IconX size={17} stroke={1.7} />
                                    </button>
                                </div>
                            </div>

                            {/* Corps structuré : titres de sections en couleur du module */}
                            <div className="space-y-5 px-7 pb-6 pt-2">
                                <section>
                                    <h3 className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]" style={{ color: accent }}>
                                        <span className="h-3 w-1 rounded-full" style={{ backgroundColor: accent }} />
                                        {t('flip.description')}
                                    </h3>
                                    <p className="text-[13.5px] leading-relaxed text-slate-700">{modDesc(flipped)}</p>
                                </section>

                                <section>
                                    <h3 className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]" style={{ color: accent }}>
                                        <span className="h-3 w-1 rounded-full" style={{ backgroundColor: accent }} />
                                        {t('flip.subModules')}
                                    </h3>
                                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {subs.map((label, i) => (
                                            <li
                                                key={i}
                                                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-[12.5px] text-slate-700"
                                            >
                                                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                                                <span className="truncate">{label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setFlipped(null)}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                    >
                                        <IconRotateClockwise size={14} stroke={1.7} style={{ transform: 'scaleX(-1)' }} />
                                        {t('flip.back')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const m = flipped;
                                            setFlipped(null);
                                            openModule(m);
                                        }}
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md active:translate-y-0"
                                        style={{ backgroundColor: accent }}
                                    >
                                        {t('flip.openModule')}
                                        <IconArrowUpRight size={15} stroke={1.9} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <ModuleSubscriptionModal
                isOpen={pendingSubscription !== null}
                moduleName={pendingSubscription?.title ?? ''}
                onClose={() => setPendingSubscription(null)}
            />
        </div>
    );
}
