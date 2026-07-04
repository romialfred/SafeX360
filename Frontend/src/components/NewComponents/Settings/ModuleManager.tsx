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
import { moduleConfigurations, updateModuleStatus as updateModuleStatusLocal } from '../data/ModuleConfig';
import {
    createModuleFeature,
    getAllModuleFeatures,
    getModuleFeatureByKey,
    updateModuleFeatureStatus,
    type ModuleFeatureDto,
} from '../../../services/ModuleManagementService';
import { getAllCompanies } from '../../../services/HrmsService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';

interface ModuleManagerProps {
    onBackToSettings: () => void;
}

/* ============================================================================
   LOT 46 — Module Manager v2 — Matrice mines × modules
   ----------------------------------------------------------------------------
   Refonte complète : passage d'une liste plate à une matrice 2D où :
     • Colonnes = Mines (sticky droite, header sticky top)
     • Lignes   = Modules groupés par catégorie collapsible
     • Cellules = Toggles individuels (mineId, moduleId) → ACTIVE/INACTIVE

   État persistant :
     • localStorage key `safex360-module-matrix` → Map<"mineId:moduleId", bool>
     • Init via API getAllModuleFeatures (état global du module pour toutes mines)
     • Au toggle d'une cellule : update locale immédiate, persist en localStorage,
       puis save API si toutes les mines convergent vers le même état (sinon en
       attente d'évolution backend pour stockage par mine).

   Design : matrice sticky, KPIs premium, recherche, filtres catégorie/mine,
            actions de masse (Tout activer/désactiver par mine ou catégorie).
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

const MATRIX_STORAGE_KEY = 'safex360-module-matrix';
const idToKey = (id: string) => id.replace(/-/g, '_');

const buildCellKey = (mineId: number, moduleId: string) => `${mineId}:${moduleId}`;

const resolveMineName = (m: Mine) => m.name || m.shortName || `Mine #${m.id}`;
const resolveMineCode = (m: Mine) => {
    const name = resolveMineName(m);
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 3).toUpperCase();
};

const loadMatrixFromStorage = (): Record<string, boolean> => {
    try {
        const raw = localStorage.getItem(MATRIX_STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

const saveMatrixToStorage = (matrix: Record<string, boolean>) => {
    try {
        localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(matrix));
    } catch {
        /* storage error — ignore silently */
    }
};

// Palette catégories — accents subtils pour différencier visuellement les sections
const CATEGORY_TONES: Record<string, { dot: string; bgRow: string; ringActive: string }> = {
    'Prevention Activities':  { dot: 'bg-emerald-500', bgRow: 'bg-emerald-50/30', ringActive: 'ring-emerald-300' },
    'Monitoring Activities':  { dot: 'bg-sky-500',     bgRow: 'bg-sky-50/30',     ringActive: 'ring-sky-300' },
    'Actions Managers':       { dot: 'bg-orange-500',  bgRow: 'bg-orange-50/30',  ringActive: 'ring-orange-300' },
    'Risk Management':        { dot: 'bg-red-500',     bgRow: 'bg-red-50/30',     ringActive: 'ring-red-300' },
    'PPE Management':         { dot: 'bg-amber-500',   bgRow: 'bg-amber-50/30',   ringActive: 'ring-amber-300' },
    'Audits Management':      { dot: 'bg-indigo-500',  bgRow: 'bg-indigo-50/30',  ringActive: 'ring-indigo-300' },
    'Compliance Management':  { dot: 'bg-green-600',   bgRow: 'bg-green-50/30',   ringActive: 'ring-green-300' },
    'Knowledge Center':       { dot: 'bg-cyan-500',    bgRow: 'bg-cyan-50/30',    ringActive: 'ring-cyan-300' },
    'Safety Communication':   { dot: 'bg-pink-500',    bgRow: 'bg-pink-50/30',    ringActive: 'ring-pink-300' },
    // LOT 48 — Catégorie urgences : rouge profond pour la distinguer de Risk (rouge clair)
    'Emergency Management':   { dot: 'bg-red-700',     bgRow: 'bg-red-50/40',     ringActive: 'ring-red-400' },
    // LOT Dosimétrie & Expositions — violet/indigo signature radioprotection
    'Dosimetry & Exposures':  { dot: 'bg-violet-600',  bgRow: 'bg-violet-50/30',  ringActive: 'ring-violet-300' },
    // LOT Blast Management — navy + amber : amber profond pour le risque, navy
    // pour la rigueur reglementaire. Choix esthetique pour eviter le rouge
    // (deja pris par Risk + Emergency) tout en signalant la criticite.
    'Blast Management':       { dot: 'bg-amber-700',   bgRow: 'bg-amber-50/30',   ringActive: 'ring-amber-400' },
};

const CATEGORY_FR: Record<string, string> = {
    'Prevention Activities': 'Activités Préventives',
    'Monitoring Activities': 'Surveillance des Activités',
    'Actions Managers': 'Actions Correctives',
    'Risk Management': 'Gestion des Risques',
    'PPE Management': 'Gestion des EPI',
    'Audits Management': 'Gestion des Audits',
    'Compliance Management': 'Conformité Réglementaire',
    'Knowledge Center': 'Centre de Connaissances',
    'Safety Communication': 'Communication Sécurité',
    'Emergency Management': 'Gestion des Urgences',
    'Dosimetry & Exposures': 'Dosimétrie & Expositions',
    'Blast Management': 'Gestion des Dynamitages',
};

const MODULE_FR: Record<string, string> = {
    'Central Findings': 'Constats centraux',
    'Inspections Managers': 'Inspections HSE',
    'Meeting Managers': 'Réunions sécurité',
    'Leadership Walk': 'Tournées Leadership',
    'Incidents Management': 'Gestion des Incidents',
    'Investigations': 'Investigations',
    'Action Plans': "Plans d'actions",
    'Pending Actions': 'Actions en attente',
    'Action Plan': "Plan d'actions",
    'Recommendations': 'Recommandations',
    'Improvement Ideas': "Suggestions d'amélioration",
    'Risk Overview': "Vue d'ensemble risques",
    'Risk Register': 'Registre des risques',
    // LOT 48 — Sous-modules Emergency (mêmes libellés FR que dans la sidebar)
    'Emergency Dashboard': 'Tableau de bord',
    'SOS Tracking': 'Suivi SOS',
    'Assembly Points': 'Points de rassemblement',
    'Emergency Settings': 'Paramètres Urgences',
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
    const moduleDefs: ModuleDef[] = moduleConfigurations as ModuleDef[];

    // LOT 48 P6.h — i18n complet : namespace 'moduleManager' charge en FR/EN.
    // Helpers tcat/tmodN/tmodD : renvoient la traduction si presente, sinon fallback
    // au libelle anglais original de moduleConfigurations.
    const { t } = useTranslation('moduleManager');
    const tcat = (categoryEn: string) => t(`categories.${categoryEn}`, categoryEn);
    const tmodN = (moduleId: string, nameEn: string) => t(`modules.${moduleId}.name`, nameEn);
    const tmodD = (moduleId: string, descEn: string) => t(`modules.${moduleId}.description`, descEn);

    // ── Données ──
    const [mines, setMines] = useState<Mine[]>([]);
    const [remoteMap, setRemoteMap] = useState<Record<string, ModuleFeatureDto>>({});
    const [matrix, setMatrix] = useState<Record<string, boolean>>(loadMatrixFromStorage());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});

    // ── UI state ──
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedMineFilter, setSelectedMineFilter] = useState<number | 'all'>('all');
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    // ── Chargement initial : mines + flags modules ──
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [companiesRes, modulesRes] = await Promise.all([
                    getAllCompanies().catch(() => []),
                    getAllModuleFeatures().catch(() => []),
                ]);
                const minesList: Mine[] = Array.isArray(companiesRes) ? companiesRes : [];
                setMines(minesList);

                const map: Record<string, ModuleFeatureDto> = {};
                modulesRes.forEach((m) => {
                    map[m.module] = m;
                });
                setRemoteMap(map);

                // Initialiser la matrice : pour chaque (mine, module), s'il n'y a pas de valeur en localStorage,
                // on utilise l'état global du module en backend (toutes mines = même état).
                setMatrix((prev) => {
                    const init = { ...prev };
                    minesList.forEach((mine) => {
                        moduleDefs.forEach((mod) => {
                            const key = buildCellKey(mine.id, mod.id);
                            if (init[key] === undefined) {
                                const apiKey = idToKey(mod.id);
                                const remote = map[apiKey];
                                init[key] = remote ? remote.status === 'ACTIVE' : true;
                            }
                        });
                    });
                    saveMatrixToStorage(init);
                    return init;
                });
            } catch {
                errorNotification(t('messages.updateFailed'));
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
            const nameFr = tmodN(m.id, m.name).toLowerCase();
            const matchesSearch = !term
                || nameFr.includes(term)
                || m.name.toLowerCase().includes(term)
                || m.description.toLowerCase().includes(term);
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

    // ── Toggle individuel ──
    const handleToggleCell = async (mineId: number, moduleId: string) => {
        const key = buildCellKey(mineId, moduleId);
        const current = matrix[key] ?? true;
        const next = !current;

        // Optimistic update
        const optimisticMatrix = { ...matrix, [key]: next };
        setMatrix(optimisticMatrix);
        saveMatrixToStorage(optimisticMatrix);

        // Synchroniser le backend : on met à jour le module globalement si toutes les mines convergent
        const allMinesConverge = mines.every((m) => optimisticMatrix[buildCellKey(m.id, moduleId)] === next);
        if (allMinesConverge) {
            await persistModuleStatus(moduleId, next, key);
        }
    };

    // ── Persistance backend (status global du module) ──
    const persistModuleStatus = async (moduleId: string, enabled: boolean, cellKey: string) => {
        const apiKey = idToKey(moduleId);
        const existing = remoteMap[apiKey];
        setSaving((prev) => ({ ...prev, [cellKey]: true }));

        try {
            let updated: ModuleFeatureDto;
            const nextStatus = enabled ? 'ACTIVE' : 'INACTIVE';
            if (existing) {
                updated = await updateModuleFeatureStatus(existing.id, nextStatus);
            } else {
                try {
                    updated = await createModuleFeature({ module: apiKey, status: nextStatus });
                } catch (err: any) {
                    if (err?.response?.status === 409) {
                        const found = await getModuleFeatureByKey(apiKey);
                        updated = await updateModuleFeatureStatus(found.id, nextStatus);
                    } else {
                        throw err;
                    }
                }
            }
            setRemoteMap((prev) => ({ ...prev, [updated.module]: updated }));
            updateModuleStatusLocal(moduleId, enabled);
        } catch (e: any) {
            errorNotification(e?.response?.data?.message || t('messages.updateFailed'));
        } finally {
            setSaving((prev) => {
                const copy = { ...prev };
                delete copy[cellKey];
                return copy;
            });
        }
    };

    // ── Actions de masse ──
    const handleToggleMineColumn = (mineId: number, enable: boolean) => {
        const updated = { ...matrix };
        moduleDefs.forEach((m) => {
            updated[buildCellKey(mineId, m.id)] = enable;
        });
        setMatrix(updated);
        saveMatrixToStorage(updated);
        const mineName = resolveMineName(mines.find((mn) => mn.id === mineId)!);
        successNotification(
            enable
                ? t('messages.enableAllMine', { mine: mineName })
                : t('messages.disableAllMine', { mine: mineName })
        );
    };

    const handleToggleCategoryRow = (category: string, enable: boolean) => {
        const updated = { ...matrix };
        moduleDefs.filter((m) => m.category === category).forEach((m) => {
            mines.forEach((mine) => {
                updated[buildCellKey(mine.id, m.id)] = enable;
            });
        });
        setMatrix(updated);
        saveMatrixToStorage(updated);
        successNotification(
            enable
                ? t('messages.enableCategory', { category: tcat(category) })
                : t('messages.disableCategory', { category: tcat(category) })
        );
    };

    const toggleCategoryCollapse = (category: string) => {
        const next = new Set(collapsedCategories);
        if (next.has(category)) next.delete(category);
        else next.add(category);
        setCollapsedCategories(next);
    };

    const handleResetMatrix = () => {
        const init: Record<string, boolean> = {};
        mines.forEach((mine) => {
            moduleDefs.forEach((m) => {
                const apiKey = idToKey(m.id);
                const remote = remoteMap[apiKey];
                init[buildCellKey(mine.id, m.id)] = remote ? remote.status === 'ACTIVE' : true;
            });
        });
        setMatrix(init);
        saveMatrixToStorage(init);
        successNotification(t('messages.matrixReset'));
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
                                            const moduleNameFr = tmodN(mod.id, mod.name);
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
                                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                                                    {tmodD(mod.id, mod.description)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {visibleMines.map((mine) => {
                                                        const key = buildCellKey(mine.id, mod.id);
                                                        const enabled = matrix[key] ?? true;
                                                        const isSaving = saving[key];
                                                        return (
                                                            <td
                                                                key={mine.id}
                                                                className="text-center px-2 py-2 border-b border-slate-100"
                                                            >
                                                                <div className="inline-flex items-center justify-center">
                                                                    {isSaving ? (
                                                                        <span className="w-3.5 h-3.5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                                                                    ) : (
                                                                        <ToggleSwitch
                                                                            checked={enabled}
                                                                            onChange={() => handleToggleCell(mine.id, mod.id)}
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
