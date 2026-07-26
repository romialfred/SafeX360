import React, { useEffect, useMemo, useState } from 'react';
import {
    IconArrowLeft,
    IconSearch,
    IconChevronDown,
    IconChevronRight,
    IconLayoutGrid,
    IconRefresh,
    IconCheck,
    IconX,
    IconAlertCircle,
    IconStack3,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
    getCompanyActivations,
    setCompanyModuleStatus,
} from '../../../services/ModuleManagementService';
import { getModuleCatalog, type ModuleCatalogCategory } from '../../../services/UserTraceabilityService';
import { getAllCompanies } from '../../../services/HrmsService';
import { errorNotification, successNotification, extractErrorMessage } from '../../../utility/NotificationUtility';

interface ModuleManagerProps {
    onBackToSettings: () => void;
}

/* ============================================================================
   Module Manager — Matrice mines × modules (activation PAR MINE)
   ----------------------------------------------------------------------------
     • Colonnes = Mines · Lignes = modules du ModuleCatalog (source unique) par
       catégorie collapsible · Cellules = toggles (mineId, moduleKey).
     • Persistance SERVEUR par mine : GET /modules/company/activations charge la
       matrice ; chaque toggle → PUT /modules/company/{mineId}/{module}?status=.
       Défaut ACTIF (absence de ligne = actif). Fini le localStorage et le flag
       global : une mine peut avoir un jeu de modules différent d'une autre.
     • Les modules activés ici pilotent la grille de création d'utilisateurs et
       la visibilité du menu (mêmes clés de catalogue partout).
   ========================================================================= */

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

type Mine = {
    id: number;
    name?: string;
    shortName?: string;
    country?: string;
    region?: string;
};

type ModuleDef = {
    id: string;
    name: string;
    category: string;
    description: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const buildCellKey = (mineId: number, moduleId: string) => `${mineId}:${moduleId}`;

// Modules socle : toujours actifs, non désactivables par mine (aligné serveur).
const LOCKED_MODULES = new Set(['home', 'usersManagement', 'settings', 'modulesManagement']);

const resolveMineName = (m: Mine) => m.name || m.shortName || `Mine #${m.id}`;
const resolveMineCode = (m: Mine) => {
    const name = resolveMineName(m);
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 3).toUpperCase();
};

// Palette catégories — clés du ModuleCatalog serveur (source unique).
const CATEGORY_TONES: Record<string, { dot: string; bgRow: string; ringActive: string }> = {
    general:         { dot: 'bg-slate-500',   bgRow: 'bg-slate-50/40',   ringActive: 'ring-slate-300' },
    incidents:       { dot: 'bg-orange-500',  bgRow: 'bg-orange-50/30',  ringActive: 'ring-orange-300' },
    errorManagement: { dot: 'bg-indigo-500',  bgRow: 'bg-indigo-50/30',  ringActive: 'ring-indigo-300' },
    preventive:      { dot: 'bg-emerald-500', bgRow: 'bg-emerald-50/30', ringActive: 'ring-emerald-300' },
    corrective:      { dot: 'bg-cyan-500',    bgRow: 'bg-cyan-50/30',    ringActive: 'ring-cyan-300' },
    risks:           { dot: 'bg-red-500',     bgRow: 'bg-red-50/30',     ringActive: 'ring-red-300' },
    ppe:             { dot: 'bg-amber-500',   bgRow: 'bg-amber-50/30',   ringActive: 'ring-amber-300' },
    audits:          { dot: 'bg-indigo-500',  bgRow: 'bg-indigo-50/30',  ringActive: 'ring-indigo-300' },
    compliance:      { dot: 'bg-green-600',   bgRow: 'bg-green-50/30',   ringActive: 'ring-green-300' },
    documentation:   { dot: 'bg-violet-600',  bgRow: 'bg-violet-50/30',  ringActive: 'ring-violet-300' },
    communication:   { dot: 'bg-pink-500',    bgRow: 'bg-pink-50/30',    ringActive: 'ring-pink-300' },
    performance:     { dot: 'bg-blue-500',    bgRow: 'bg-blue-50/30',    ringActive: 'ring-blue-300' },
    administration:  { dot: 'bg-red-600',     bgRow: 'bg-red-50/30',     ringActive: 'ring-red-300' },
    mineManaged:     { dot: 'bg-amber-700',   bgRow: 'bg-amber-50/30',   ringActive: 'ring-amber-400' },
};

// ────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ────────────────────────────────────────────────────────────────────────────

function ToggleSwitch({
    checked,
    onChange,
    disabled,
    size = 'sm',
}: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
}) {
    const dims = size === 'md'
        ? { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-4' }
        : { track: 'w-8 h-[18px]', thumb: 'w-3 h-3', translate: 'translate-x-[14px]' };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={onChange}
            className={`relative inline-flex ${dims.track} flex-shrink-0 rounded-full transition-colors duration-200 ring-1 ring-inset ${
                checked
                    ? 'bg-emerald-500 ring-emerald-600/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]'
                    : 'bg-slate-200 ring-slate-300/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-105'}`}
        >
            <span
                aria-hidden="true"
                className={`absolute top-1/2 -translate-y-1/2 left-0.5 inline-block ${dims.thumb} rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                    checked ? dims.translate : 'translate-x-0'
                }`}
            />
        </button>
    );
}

// LOT 47 — KpiCard supprimé (tuiles retirées sur demande utilisateur).

// ────────────────────────────────────────────────────────────────────────────
// Composant principal
// ────────────────────────────────────────────────────────────────────────────

const ModuleManager: React.FC<ModuleManagerProps> = ({ onBackToSettings }) => {
    // Chrome de l'écran : namespace 'moduleManager'. Libellés catégories/modules :
    // namespace 'navigation' (mêmes clés que la grille de création → source unique).
    const { t } = useTranslation('moduleManager');
    const tMsg = t;
    const tNav = useTranslation('navigation').t;
    const tcat = (category: string) => tNav(`userMgmt.create.categories.${category}`, { defaultValue: category });
    const tmodN = (moduleId: string) => tNav(`userMgmt.create.modules.${moduleId}`, { defaultValue: moduleId });

    // ── Données ──
    const [mines, setMines] = useState<Mine[]>([]);
    const [catalog, setCatalog] = useState<ModuleCatalogCategory[]>([]);
    // Matrice mine×module : true = ACTIF. Persistée côté serveur (per-mine).
    const [matrix, setMatrix] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});

    // ── UI state ──
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedMineFilter, setSelectedMineFilter] = useState<number | 'all'>('all');
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    // Modules à plat, dérivés du catalogue serveur (id = clé du ModuleCatalog).
    const moduleDefs: ModuleDef[] = useMemo(
        () => catalog.flatMap((c) => c.modules.map((m) => ({
            id: m.key, name: m.key, category: c.category, description: '',
        }))),
        [catalog],
    );

    // ── Chargement initial : mines + catalogue + activations par mine ──
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [companiesRes, catRes, activations] = await Promise.all([
                    getAllCompanies().catch(() => []),
                    getModuleCatalog().catch(() => [] as ModuleCatalogCategory[]),
                    getCompanyActivations().catch(() => []),
                ]);
                const minesList: Mine[] = Array.isArray(companiesRes) ? companiesRes : [];
                setMines(minesList);
                setCatalog(Array.isArray(catRes) ? catRes : []);

                // Défaut ACTIF ; on n'écrase que par les désactivations/réactivations
                // explicites renvoyées par le serveur.
                const init: Record<string, boolean> = {};
                minesList.forEach((mine) => {
                    (Array.isArray(catRes) ? catRes : []).forEach((c) => {
                        c.modules.forEach((m) => { init[buildCellKey(mine.id, m.key)] = true; });
                    });
                });
                activations.forEach((a) => {
                    init[buildCellKey(a.companyId, a.module)] = a.status === 'ACTIVE';
                });
                setMatrix(init);
            } catch (err) {
                errorNotification(extractErrorMessage(err, tMsg('messages.updateFailed')));
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Catégories disponibles ──
    const categories = useMemo(() => {
        return Array.from(new Set(moduleDefs.map((m) => m.category)));
    }, [moduleDefs]);

    // ── Modules filtrés par recherche + catégorie ──
    const filteredModules = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return moduleDefs.filter((m) => {
            const nameFr = tmodN(m.id).toLowerCase();
            const matchesSearch = !term
                || nameFr.includes(term)
                || m.id.toLowerCase().includes(term);
            const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [moduleDefs, searchTerm, selectedCategory]);

    // ── Modules groupés par catégorie ──
    const groupedModules = useMemo(() => {
        const groups: Record<string, ModuleDef[]> = {};
        filteredModules.forEach((m) => {
            if (!groups[m.category]) groups[m.category] = [];
            groups[m.category].push(m);
        });
        return groups;
    }, [filteredModules]);

    // ── Mines visibles (filtrage) ──
    const visibleMines = useMemo(() => {
        if (selectedMineFilter === 'all') return mines;
        return mines.filter((m) => m.id === selectedMineFilter);
    }, [mines, selectedMineFilter]);

    // ── KPIs ──
    const kpis = useMemo(() => {
        const totalCells = moduleDefs.length * mines.length;
        let active = 0;
        for (const mine of mines) {
            for (const mod of moduleDefs) {
                if (matrix[buildCellKey(mine.id, mod.id)]) active++;
            }
        }
        const coverage = totalCells > 0 ? Math.round((active / totalCells) * 100) : 0;
        return {
            totalCells,
            active,
            inactive: totalCells - active,
            coverage,
            modules: moduleDefs.length,
            mines: mines.length,
        };
    }, [matrix, moduleDefs, mines]);

    // ── Statistiques par catégorie / par mine (sticky info) ──
    const getCategoryStats = (category: string, mineId?: number) => {
        const mods = moduleDefs.filter((m) => m.category === category);
        if (mineId !== undefined) {
            const active = mods.filter((m) => matrix[buildCellKey(mineId, m.id)]).length;
            return { active, total: mods.length };
        }
        const totalCells = mods.length * mines.length;
        let active = 0;
        mines.forEach((mine) => {
            mods.forEach((m) => {
                if (matrix[buildCellKey(mine.id, m.id)]) active++;
            });
        });
        return { active, total: totalCells };
    };

    const getMineStats = (mineId: number) => {
        const total = moduleDefs.length;
        const active = moduleDefs.filter((m) => matrix[buildCellKey(mineId, m.id)]).length;
        return { active, total };
    };

    // ── Toggle individuel — persistance PAR MINE côté serveur ──
    const persistCell = async (mineId: number, moduleId: string, enabled: boolean) => {
        const key = buildCellKey(mineId, moduleId);
        setSaving((prev) => ({ ...prev, [key]: true }));
        try {
            await setCompanyModuleStatus(mineId, moduleId, enabled ? 'ACTIVE' : 'INACTIVE');
            return true;
        } catch (e: any) {
            // Rollback optimiste : on remet l'état précédent sur échec.
            setMatrix((prev) => ({ ...prev, [key]: !enabled }));
            errorNotification(e?.response?.data?.message || tMsg('messages.updateFailed'));
            return false;
        } finally {
            setSaving((prev) => {
                const copy = { ...prev };
                delete copy[key];
                return copy;
            });
        }
    };

    const handleToggleCell = async (mineId: number, moduleId: string) => {
        const key = buildCellKey(mineId, moduleId);
        const next = !(matrix[key] ?? true);
        setMatrix((prev) => ({ ...prev, [key]: next })); // optimiste
        await persistCell(mineId, moduleId, next);
    };

    // ── Actions de masse — chaque cellule est persistée côté serveur ──
    const handleToggleMineColumn = async (mineId: number, enable: boolean) => {
        setMatrix((prev) => {
            const u = { ...prev };
            moduleDefs.forEach((m) => { u[buildCellKey(mineId, m.id)] = enable; });
            return u;
        });
        await Promise.all(moduleDefs.map((m) => persistCell(mineId, m.id, enable)));
        const mineName = resolveMineName(mines.find((mn) => mn.id === mineId)!);
        successNotification(
            enable
                ? tMsg('messages.enableAllMine', { mine: mineName })
                : tMsg('messages.disableAllMine', { mine: mineName })
        );
    };

    const handleToggleCategoryRow = async (category: string, enable: boolean) => {
        const catMods = moduleDefs.filter((m) => m.category === category);
        setMatrix((prev) => {
            const u = { ...prev };
            catMods.forEach((m) => { mines.forEach((mine) => { u[buildCellKey(mine.id, m.id)] = enable; }); });
            return u;
        });
        await Promise.all(catMods.flatMap((m) => mines.map((mine) => persistCell(mine.id, m.id, enable))));
        successNotification(
            enable
                ? tMsg('messages.enableCategory', { category: tcat(category) })
                : tMsg('messages.disableCategory', { category: tcat(category) })
        );
    };

    const toggleCategoryCollapse = (category: string) => {
        const next = new Set(collapsedCategories);
        if (next.has(category)) next.delete(category);
        else next.add(category);
        setCollapsedCategories(next);
    };

    // Recharge la matrice depuis le serveur (tout est déjà persisté au toggle).
    const handleResetMatrix = async () => {
        try {
            const activations = await getCompanyActivations();
            const init: Record<string, boolean> = {};
            mines.forEach((mine) => {
                moduleDefs.forEach((m) => { init[buildCellKey(mine.id, m.id)] = true; });
            });
            activations.forEach((a) => { init[buildCellKey(a.companyId, a.module)] = a.status === 'ACTIVE'; });
            setMatrix(init);
            successNotification(tMsg('messages.matrixReset'));
        } catch (e: any) {
            errorNotification(e?.response?.data?.message || tMsg('messages.updateFailed'));
        }
    };

    // ── Render ──
    if (loading) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto">
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                    <IconLayoutGrid size={32} className="text-slate-300 mx-auto mb-3 animate-pulse" />
                    <p className="text-[13px] text-slate-500">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (mines.length === 0) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto">
                <button
                    type="button"
                    onClick={onBackToSettings}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-slate-600 hover:bg-slate-100 transition-colors mb-4"
                >
                    <IconArrowLeft size={14} stroke={1.6} />
                    {t('header.back')}
                </button>
                <div className="bg-white rounded-xl border border-amber-200 p-8 text-center shadow-sm">
                    <IconAlertCircle size={32} className="text-amber-500 mx-auto mb-3" />
                    <h3 className="text-[15px] text-slate-800 font-medium mb-1.5"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                        {t('noMines.title')}
                    </h3>
                    <p className="text-[13px] text-slate-500 max-w-md mx-auto">
                        {t('noMines.body')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto bg-slate-50/30 min-h-full">

            {/* ─── Breadcrumb premium ─── */}
            <div className="flex items-center gap-1.5 text-[11px] mb-2">
                <button
                    type="button"
                    onClick={onBackToSettings}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-[0.16em] font-medium"
                >
                    <IconArrowLeft size={11} stroke={2} />
                    {t('header.back')}
                </button>
                <IconChevronRight size={10} className="text-slate-300 mx-0.5" />
                <span className="uppercase tracking-[0.16em] text-slate-500 font-medium">
                    {t('breadcrumb.platform')}
                </span>
                <IconChevronRight size={10} className="text-slate-300" />
                <span className="uppercase tracking-[0.16em] text-slate-800 font-medium">
                    {t('breadcrumb.page')}
                </span>
            </div>

            {/* LOT 48 P6.h — Hero card premium : logo + titre + KPI tiles + action Reset */}
            <header className="mb-3 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Bloc titre */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                            <IconStack3 size={20} stroke={1.8} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1
                                className="text-slate-900 leading-tight"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: 'clamp(22px, 2.4vw, 28px)',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {t('header.title')}
                            </h1>
                            <p className="text-[12.5px] text-slate-600 mt-1 max-w-xl leading-snug">
                                {t('header.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Recherche + filtre catégorie + reset */}
                    <div className="flex items-center gap-2 flex-1 lg:flex-initial lg:max-w-[520px]">
                        <div className="relative flex-1 min-w-[150px]">
                            <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('toolbar.searchPlaceholder')}
                                className="w-full pl-8 pr-3 py-1.5 text-[11.5px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="inline-flex items-center gap-1 bg-slate-50/60 border border-slate-200 rounded-md pl-2 pr-0.5 hover:bg-white hover:border-slate-300 transition-colors flex-shrink-0">
                            <span className="text-[9px] uppercase tracking-[0.12em] text-slate-500 font-medium">{t('toolbar.categoryLabel')}</span>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-transparent border-0 py-1 pr-1.5 text-[11px] text-slate-800 focus:outline-none cursor-pointer max-w-[130px]"
                            >
                                <option value="all">{t('toolbar.allCategories')} ({categories.length})</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>{tcat(c)}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={handleResetMatrix}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-all flex-shrink-0"
                            title={t('toolbar.reset')}
                        >
                            <IconRefresh size={14} stroke={1.6} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── MATRICE ─── */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[12.5px]" style={{ minWidth: '720px' }}>
                        {/* En-tête sticky : mines en colonnes
                            LOT 48 P6.i — Refonte single-row : code + nom + stats + actions tout sur
                            UNE seule ligne (avant : 4 lignes empilées) + background gradient teal/indigo
                            qui le distingue clairement du corps blanc de la matrice. */}
                        <thead className="sticky top-0 z-20">
                            <tr>
                                <th
                                    className="text-left px-4 py-2.5 border-b-2 border-indigo-200 sticky left-0 z-30"
                                    style={{
                                        minWidth: '300px',
                                        width: '300px',
                                        background: 'linear-gradient(90deg, #eef2ff 0%, #e0e7ff 100%)',
                                    }}
                                >
                                    <span className="text-[10.5px] uppercase tracking-[0.14em] text-indigo-900 font-bold">
                                        {t('table.columnModule')}
                                    </span>
                                </th>
                                {visibleMines.map((mine) => {
                                    const stats = getMineStats(mine.id);
                                    const allActive = stats.active === stats.total;
                                    const noneActive = stats.active === 0;
                                    return (
                                        <th
                                            key={mine.id}
                                            className="text-center border-b-2 border-indigo-200 px-3 py-2.5"
                                            style={{
                                                minWidth: '180px',
                                                background: 'linear-gradient(90deg, #e0e7ff 0%, #eef2ff 100%)',
                                            }}
                                        >
                                            {/* SINGLE-ROW : code + nom + stats + actions tout en ligne */}
                                            <div className="flex items-center justify-center gap-2 flex-nowrap">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-[9.5px] font-bold shadow-sm flex-shrink-0">
                                                    {resolveMineCode(mine)}
                                                </span>
                                                <span
                                                    className="text-[12px] font-semibold text-slate-800 leading-none truncate"
                                                    title={resolveMineName(mine)}
                                                >
                                                    {resolveMineName(mine)}
                                                </span>
                                                <span className="inline-flex items-center text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-white/70 border border-indigo-200/60 flex-shrink-0">
                                                    <span className="text-emerald-700 font-bold">{stats.active}</span>
                                                    <span className="text-slate-400 mx-0.5">/</span>
                                                    <span className="text-slate-600">{stats.total}</span>
                                                </span>
                                                <span className="text-[9.5px] font-semibold text-teal-700 bg-teal-50/80 px-1.5 py-0.5 rounded border border-teal-200/60 flex-shrink-0">
                                                    {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% Couvert.
                                                </span>
                                                {/* Mini-actions inline */}
                                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleMineColumn(mine.id, true)}
                                                        disabled={allActive}
                                                        title={t('table.enableAllMine')}
                                                        className={`w-5 h-5 rounded text-emerald-700 bg-white/60 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center transition-colors ${
                                                            allActive ? 'opacity-30 cursor-not-allowed' : ''
                                                        }`}
                                                    >
                                                        <IconCheck size={11} stroke={2.4} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleMineColumn(mine.id, false)}
                                                        disabled={noneActive}
                                                        title={t('table.disableAllMine')}
                                                        className={`w-5 h-5 rounded text-red-700 bg-white/60 hover:bg-red-100 border border-red-200 flex items-center justify-center transition-colors ${
                                                            noneActive ? 'opacity-30 cursor-not-allowed' : ''
                                                        }`}
                                                    >
                                                        <IconX size={11} stroke={2.4} />
                                                    </button>
                                                </div>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        <tbody>
                            {Object.entries(groupedModules).map(([category, mods]) => {
                                const isCollapsed = collapsedCategories.has(category);
                                const tone = CATEGORY_TONES[category] || {
                                    dot: 'bg-slate-500',
                                    bgRow: 'bg-slate-50/40',
                                    ringActive: 'ring-slate-300',
                                };
                                const catStats = getCategoryStats(category);

                                return (
                                    <React.Fragment key={category}>
                                        {/* En-tête de catégorie (cliquable, sticky col-1) */}
                                        <tr className="bg-slate-100/60 hover:bg-slate-100">
                                            <td
                                                className="px-4 py-2 border-b border-slate-200 sticky left-0 bg-slate-100/60 z-10 cursor-pointer"
                                                onClick={() => toggleCategoryCollapse(category)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isCollapsed ? (
                                                        <IconChevronRight size={13} stroke={1.8} className="text-slate-600" />
                                                    ) : (
                                                        <IconChevronDown size={13} stroke={1.8} className="text-slate-600" />
                                                    )}
                                                    <span className={`w-1.5 h-1.5 rounded-full ${tone.dot} flex-shrink-0`} />
                                                    <span
                                                        className="text-[12.5px] text-slate-800 font-semibold"
                                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                                                    >
                                                        {tcat(category)}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 ml-1">
                                                        {t('table.categoryStats', { count: mods.length, active: catStats.active, total: catStats.total })}
                                                    </span>
                                                </div>
                                            </td>
                                            {visibleMines.map((mine) => {
                                                const cs = getCategoryStats(category, mine.id);
                                                const allActive = cs.active === cs.total;
                                                const noneActive = cs.active === 0;
                                                return (
                                                    <td
                                                        key={mine.id}
                                                        className="text-center px-2 py-2 border-b border-slate-200"
                                                    >
                                                        <div className="inline-flex items-center gap-1">
                                                            <span className="text-[10.5px] font-mono text-slate-600">
                                                                {cs.active}/{cs.total}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleCategoryRow(category, !allActive);
                                                                }}
                                                                title={allActive ? t('table.disableAll') : t('table.enableAll')}
                                                                className={`p-0.5 rounded transition-colors ${
                                                                    allActive
                                                                        ? 'text-red-500 hover:bg-red-50'
                                                                        : noneActive
                                                                            ? 'text-emerald-600 hover:bg-emerald-50'
                                                                            : 'text-slate-400 hover:bg-slate-100'
                                                                }`}
                                                            >
                                                                {allActive ? <IconX size={11} stroke={2.2} /> : <IconCheck size={11} stroke={2.2} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>

                                        {/* Lignes modules (si catégorie non collapsée) */}
                                        {!isCollapsed && mods.map((mod, idx) => {
                                            const moduleNameFr = tmodN(mod.id);
                                            return (
                                                <tr
                                                    key={mod.id}
                                                    className={`hover:bg-slate-50 transition-colors ${
                                                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                                    }`}
                                                >
                                                    <td
                                                        className={`px-4 py-2.5 border-b border-slate-100 sticky left-0 z-10 ${
                                                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3 pl-5">
                                                            <span className={`mt-1.5 w-1 h-1 rounded-full ${tone.dot} flex-shrink-0`} />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[13px] text-slate-800 leading-tight">
                                                                    {moduleNameFr}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {visibleMines.map((mine) => {
                                                        const key = buildCellKey(mine.id, mod.id);
                                                        const locked = LOCKED_MODULES.has(mod.id);
                                                        const enabled = locked ? true : (matrix[key] ?? true);
                                                        const isSaving = saving[key];
                                                        return (
                                                            <td
                                                                key={mine.id}
                                                                className="text-center px-2 py-2 border-b border-slate-100"
                                                            >
                                                                <div className="inline-flex items-center justify-center"
                                                                    title={locked ? t('lockedModule', { defaultValue: 'Module socle — toujours actif' }) : undefined}>
                                                                    {isSaving ? (
                                                                        <span className="w-3.5 h-3.5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                                                                    ) : (
                                                                        <ToggleSwitch
                                                                            checked={enabled}
                                                                            disabled={locked}
                                                                            onChange={() => { if (!locked) handleToggleCell(mine.id, mod.id); }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer info matrice */}
                <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-[11.5px] text-slate-500 flex-wrap gap-2">
                    <p>
                        {t('footer.summary', {
                            modules: filteredModules.length,
                            mines: visibleMines.length,
                            active: kpis.active,
                            total: kpis.totalCells,
                        })}
                    </p>
                    <p className="text-[11px] text-slate-500">
                        {t('footer.persistence')}
                    </p>
                </div>
            </div>

            {/* ─── Note explicative ─── */}
            <div className="mt-3 bg-sky-50/60 border border-sky-100 rounded-lg p-3 flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-sky-100 text-sky-600 flex-shrink-0">
                    <IconAlertCircle size={14} stroke={1.6} />
                </span>
                <div className="text-[12.5px] text-slate-700 leading-relaxed">
                    <p className="font-medium text-slate-800 mb-0.5">
                        {t('note.title')}
                    </p>
                    <p>
                        {t('note.body')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ModuleManager;
