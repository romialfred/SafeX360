/**
 * DosimetryThresholdsPage — Module Dosimetrie & Expositions (Phase 5).
 *
 * Page premium de gestion des seuils dosimetriques parametrables, conforme au
 * pattern SafeX 360 (cf. DosimetryParametersPage — Phase 1).
 *
 * Couvre les besoins :
 *   1. Header        : breadcrumb + hero card violet/indigo + KPI seuils/mines.
 *   2. Filtres       : par mine / par categorie / par grandeur + toggle actifs.
 *   3. Tableau seuils : inline edit (double-clic), tri sur toutes colonnes,
 *                       confirmation modale si modification > 50 % de la CIPR.
 *   4. Modal d'ajout : Select mine + categorie + grandeur, 4 NumberInput,
 *                      Textarea justification, RBAC DOSIMETRY_ADMIN.
 *   5. Footer aide   : tableau recapitulatif CIPR 103 / AIEA GSR Part 3.
 *
 * Donnees : DosimetryService.getAllThresholds() avec fallback gracieux sur les
 * valeurs CIPR 103 / AIEA GSR Part 3 (alignees sur le seed V005 du backend).
 *
 * RBAC : DOSIMETRY_ADMIN gate les actions "Reinitialiser CIPR/AIEA",
 * "Ajouter seuil personnalise" et l'edition inline. L'enforcement reel reste
 * cote backend (Spring @PreAuthorize) — la verification UI est defensive.
 *
 * i18n : namespace `dosimetry`, sous-tree `thresholdsPage.*`.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Modal,
    Select,
    NumberInput,
    Textarea,
    Button,
    Group,
    Switch,
    Tooltip,
} from '@mantine/core';
import {
    IconAlertOctagon,
    IconChevronRight,
    IconRefresh,
    IconPlus,
    IconPencil,
    IconCheck,
    IconX,
    IconArrowUp,
    IconArrowDown,
    IconCircleCheck,
    IconCircleOff,
    IconInfoCircle,
    IconShieldLock,
    IconBuildingFactory2,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import {
    getAllThresholds,
    createThreshold,
    updateThreshold,
    type ThresholdDTO,
    type ThresholdGrandeur,
} from '../../services/DosimetryService';
import { getAllActiveLocations } from '../../services/LocationService';

// ─────────────────────────────────────────────────────────────────────────────
//  Constantes metier — Valeurs CIPR 103 / AIEA GSR Part 3
//
//  SOURCE DE VERITE : Backend/Health-Safety/src/main/resources/db/migration/
//                     V005__dosimetry_seed_cipr_aiea.sql
//
//  Toute divergence avec V005 est un finding P1 conformite (CIPR 103 / AIEA).
// ─────────────────────────────────────────────────────────────────────────────

type PersonCategory = 'WORKER_A' | 'WORKER_B' | 'APPRENTICE' | 'PREGNANCY' | 'PUBLIC';

const ALL_CATEGORIES: PersonCategory[] = ['WORKER_A', 'WORKER_B', 'APPRENTICE', 'PREGNANCY', 'PUBLIC'];
const ALL_GRANDEURS: ThresholdGrandeur[] = ['HP10', 'HP007', 'HP3'];

/** Fallback aligne sur V005 — affiche si le backend renvoie une liste vide. */
const CIPR_REFERENCE: ThresholdDTO[] = [
    // WORKER_A
    { id: -1, mineId: null, grandeur: 'HP10', personCategory: 'WORKER_A', doseConstraint: 15, investigationLevel: 18, actionLevel: 20, regulatoryLimit: 20, unit: 'mSv', referenceFramework: 'CIPR_103', active: true },
    { id: -2, mineId: null, grandeur: 'HP007', personCategory: 'WORKER_A', doseConstraint: 400, investigationLevel: 450, actionLevel: 500, regulatoryLimit: 500, unit: 'mSv', referenceFramework: 'CIPR_103', active: true },
    { id: -3, mineId: null, grandeur: 'HP3', personCategory: 'WORKER_A', doseConstraint: 15, investigationLevel: 18, actionLevel: 20, regulatoryLimit: 20, unit: 'mSv', referenceFramework: 'CIPR_103', active: true },
    // WORKER_B
    { id: -4, mineId: null, grandeur: 'HP10', personCategory: 'WORKER_B', doseConstraint: null, investigationLevel: null, actionLevel: null, classificationThreshold: 6, regulatoryLimit: null, unit: 'mSv', referenceFramework: 'AIEA_GSR_PART3', active: true },
    // APPRENTICE
    { id: -5, mineId: null, grandeur: 'HP10', personCategory: 'APPRENTICE', doseConstraint: null, investigationLevel: null, actionLevel: null, regulatoryLimit: 6, unit: 'mSv', referenceFramework: 'CIPR_103', active: true },
    // PREGNANCY
    { id: -6, mineId: null, grandeur: 'HP10', personCategory: 'PREGNANCY', doseConstraint: null, investigationLevel: null, actionLevel: null, regulatoryLimit: 1, unit: 'mSv', referenceFramework: 'CIPR_103', active: true },
    // PUBLIC
    { id: -7, mineId: null, grandeur: 'HP10', personCategory: 'PUBLIC', doseConstraint: null, investigationLevel: null, actionLevel: null, regulatoryLimit: 1, unit: 'mSv', referenceFramework: 'AIEA_GSR_PART3', active: true },
];

/** Reference CIPR par (categorie, grandeur, champ) pour le calcul de deviation > 50 %. */
function findReferenceValue(
    category: string,
    grandeur: string,
    field: keyof Pick<ThresholdDTO, 'doseConstraint' | 'investigationLevel' | 'actionLevel' | 'classificationThreshold' | 'regulatoryLimit'>,
): number | null {
    const ref = CIPR_REFERENCE.find((r) => r.personCategory === category && r.grandeur === grandeur);
    if (!ref) return null;
    const v = ref[field];
    return typeof v === 'number' ? v : null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper — tolerant : accepte permissions[], authorities[], roles[].
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) candidates.push(...user.authorities.map((a: any) => a?.authority ?? a));
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Types locaux
// ─────────────────────────────────────────────────────────────────────────────

interface MineOption {
    id: number;
    name: string;
}

type SortableColumn =
    | 'mine'
    | 'category'
    | 'grandeur'
    | 'doseConstraint'
    | 'investigationLevel'
    | 'actionLevel'
    | 'classificationThreshold'
    | 'regulatoryLimit'
    | 'framework'
    | 'status';

interface SortState {
    column: SortableColumn;
    direction: 'asc' | 'desc';
}

type EditableField = 'doseConstraint' | 'investigationLevel' | 'actionLevel' | 'classificationThreshold' | 'regulatoryLimit';

interface InlineEditState {
    thresholdId: number | string;
    field: EditableField;
    draft: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const DosimetryThresholdsPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    // Principe plateforme : aucune sélection ARBITRAIRE de mine. La mine vient du
    // header (sélecteur global) ; un seuil est soit « global » (toutes les mines)
    // soit rattaché à la MINE ACTIVE. Jamais de champ mine requis.
    const activeMineId = useAppSelector((state: any) => state.companySelection?.selectedCompanyId ?? null);
    const canAdmin = hasDosimetryPermission(user, 'DOSIMETRY_ADMIN');

    const [thresholds, setThresholds] = useState<ThresholdDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [mines, setMines] = useState<MineOption[]>([]);
    // Option unique = la mine active du header (résolue depuis la liste des mines).
    const activeMine = mines.find((m) => String(m.id) === String(activeMineId)) || null;
    const activeMineOptions = activeMine ? [{ value: String(activeMine.id), label: activeMine.name }] : [];

    // Filtres
    const [filterMine, setFilterMine] = useState<string>('all'); // 'all' | 'global' | mineId-string
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterGrandeur, setFilterGrandeur] = useState<string>('all');
    const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(true);

    // Tri
    const [sort, setSort] = useState<SortState>({ column: 'category', direction: 'asc' });

    // Inline edit
    const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
    const [pendingDeviation, setPendingDeviation] = useState<null | {
        threshold: ThresholdDTO;
        field: EditableField;
        nextValue: number | null;
        referenceValue: number;
    }>(null);

    // Modal d'ajout
    const [addModalOpened, setAddModalOpened] = useState(false);

    // ───── Chargement initial : seuils + mines ─────
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        Promise.allSettled([
            getAllThresholds(),
            getAllActiveLocations().catch(() => []),
        ])
            .then(([thRes, locRes]) => {
                if (cancelled) return;
                // 1) Seuils
                if (thRes.status === 'fulfilled') {
                    const data = thRes.value;
                    const list: ThresholdDTO[] = Array.isArray(data) ? data : (data?.content ?? []);
                    if (list.length > 0) {
                        setThresholds(list);
                        setLoadError(null);
                    } else {
                        setThresholds(CIPR_REFERENCE);
                        setLoadError(null);
                    }
                } else {
                    setThresholds(CIPR_REFERENCE);
                    setLoadError(t('thresholdsPage.loadError'));
                }
                // 2) Mines
                if (locRes.status === 'fulfilled') {
                    const raw: any[] = Array.isArray(locRes.value) ? locRes.value : [];
                    setMines(
                        raw
                            .filter((m) => m?.id != null && m?.name)
                            .map((m) => ({ id: Number(m.id), name: String(m.name) })),
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [t]);

    // ───── Indexation des mines par id ─────
    const mineNameById = useMemo(() => {
        const map = new Map<number, string>();
        mines.forEach((m) => map.set(m.id, m.name));
        return map;
    }, [mines]);

    // ───── KPI : couverture multi-tenant ─────
    const minesCoveredCount = useMemo(() => {
        const set = new Set<number>();
        thresholds.forEach((th) => {
            if (th.mineId != null) set.add(th.mineId);
        });
        return set.size;
    }, [thresholds]);

    // ───── Filtrage + tri ─────
    const visibleThresholds = useMemo(() => {
        const filtered = thresholds.filter((th) => {
            if (filterActiveOnly && th.active === false) return false;
            if (filterMine !== 'all') {
                if (filterMine === 'global') {
                    if (th.mineId != null) return false;
                } else {
                    const idNum = Number(filterMine);
                    if (th.mineId !== idNum) return false;
                }
            }
            if (filterCategory !== 'all' && th.personCategory !== filterCategory) return false;
            if (filterGrandeur !== 'all' && th.grandeur !== filterGrandeur) return false;
            return true;
        });

        const sorted = [...filtered].sort((a, b) => {
            const dir = sort.direction === 'asc' ? 1 : -1;
            const va = readSortValue(a, sort.column, mineNameById, t);
            const vb = readSortValue(b, sort.column, mineNameById, t);
            if (va === vb) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;
            return va > vb ? dir : -dir;
        });

        return sorted;
    }, [thresholds, filterMine, filterCategory, filterGrandeur, filterActiveOnly, sort, mineNameById, t]);

    const toggleSort = (col: SortableColumn) => {
        setSort((prev) =>
            prev.column === col
                ? { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { column: col, direction: 'asc' },
        );
    };

    // ───── Reset filtres ─────
    const handleClearFilters = () => {
        setFilterMine('all');
        setFilterCategory('all');
        setFilterGrandeur('all');
        setFilterActiveOnly(true);
    };

    // ───── Reset CIPR/AIEA (RBAC DOSIMETRY_ADMIN) ─────
    const handleResetReference = () => {
        if (!canAdmin) {
            errorNotification(t('thresholdsPage.actions.resetDenied'));
            return;
        }
        // Phase 5 : pas d'endpoint backend (POST /threshold/reset-reference).
        // On bascule sur le seed CIPR en local + notification d'info.
        setThresholds(CIPR_REFERENCE);
        setLoadError(t('thresholdsPage.resetNotAvailable'));
        successNotification(t('thresholdsPage.resetSuccess'));
    };

    // ───── Inline edit ─────
    const startEdit = (th: ThresholdDTO, field: EditableField) => {
        if (!canAdmin || th.id == null) return;
        setInlineEdit({ thresholdId: th.id, field, draft: (th[field] as number | null) ?? null });
    };

    const cancelEdit = () => setInlineEdit(null);

    const persistEdit = async (th: ThresholdDTO, field: EditableField, nextValue: number | null) => {
        // Patch local optimiste + appel backend.
        const patched: ThresholdDTO = { ...th, [field]: nextValue };
        setThresholds((prev) =>
            prev.map((row) => (row.id === th.id ? patched : row)),
        );
        setInlineEdit(null);
        try {
            if (typeof th.id === 'number' && th.id > 0) {
                await updateThreshold(patched);
                successNotification(t('thresholdsPage.modal.saveSuccess'));
            } else {
                // Reference CIPR (id negatif) : pas de persistance, edition locale only.
                successNotification(t('thresholdsPage.modal.saveSuccess'));
            }
        } catch (_err) {
            errorNotification(t('thresholdsPage.modal.saveError'));
            // Rollback
            setThresholds((prev) =>
                prev.map((row) => (row.id === th.id ? th : row)),
            );
        }
    };

    const commitEdit = (th: ThresholdDTO) => {
        if (!inlineEdit || inlineEdit.thresholdId !== th.id) return;
        const next = inlineEdit.draft;
        if (
            (th.personCategory === 'WORKER_B' || th.personCategory === 'B')
            && inlineEdit.field === 'regulatoryLimit'
            && next === 6
        ) {
            errorNotification(t('thresholdsPage.modal.errors.workerBClassificationNotLimit', {
                defaultValue: '6 mSv est un seuil de classification, pas une limite réglementaire.',
            }));
            return;
        }
        const ref = findReferenceValue(th.personCategory, th.grandeur, inlineEdit.field);
        // Confirmation si modif > 50 % par rapport a la CIPR de reference
        if (ref != null && ref > 0 && next != null) {
            const deviationRatio = Math.abs(next - ref) / ref;
            if (deviationRatio > 0.5) {
                setPendingDeviation({
                    threshold: th,
                    field: inlineEdit.field,
                    nextValue: next,
                    referenceValue: ref,
                });
                return;
            }
        }
        persistEdit(th, inlineEdit.field, next);
    };

    const confirmDeviation = () => {
        if (!pendingDeviation) return;
        const { threshold, field, nextValue } = pendingDeviation;
        setPendingDeviation(null);
        persistEdit(threshold, field, nextValue);
    };

    const cancelDeviation = () => setPendingDeviation(null);

    // ───── Activer / desactiver une ligne ─────
    const toggleActive = async (th: ThresholdDTO) => {
        if (!canAdmin || th.id == null) return;
        const next: ThresholdDTO = { ...th, active: !(th.active ?? true) };
        setThresholds((prev) => prev.map((row) => (row.id === th.id ? next : row)));
        try {
            if (typeof th.id === 'number' && th.id > 0) {
                await updateThreshold(next);
            }
            successNotification(t('thresholdsPage.modal.saveSuccess'));
        } catch (_err) {
            errorNotification(t('thresholdsPage.modal.saveError'));
            setThresholds((prev) => prev.map((row) => (row.id === th.id ? th : row)));
        }
    };

    // ───── Creation d'un seuil custom ─────
    const handleCreateThreshold = async (payload: ThresholdDTO) => {
        try {
            const created = await createThreshold(payload);
            const dto: ThresholdDTO = created?.id ? created : { ...payload, id: Date.now() };
            setThresholds((prev) => [dto, ...prev]);
            successNotification(t('thresholdsPage.modal.saveSuccess'));
            setAddModalOpened(false);
        } catch (_err) {
            errorNotification(t('thresholdsPage.modal.saveError'));
        }
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/settings')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('thresholdsPage.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('thresholdsPage.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('thresholdsPage.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconAlertOctagon size={22} stroke={1.8} className="text-white" />
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
                                    {t('thresholdsPage.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('thresholdsPage.subtitle')}
                                </p>
                            </div>
                        </div>

                        {/* KPI tiles + reset CTA */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <div className="w-10 h-10 rounded-lg bg-white border border-indigo-100 flex items-center justify-center">
                                    <span className="text-[15px] font-mono font-bold text-indigo-700">
                                        {thresholds.length}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.14em] text-indigo-600 leading-none font-medium">
                                        {t('thresholdsPage.kpi.configuredLabel')}
                                    </p>
                                    <p className="text-[12px] text-slate-700 mt-0.5 leading-none">
                                        {t('thresholdsPage.kpi.configured', { count: thresholds.length })}
                                    </p>
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-violet-50/70 border border-violet-100">
                                <div className="w-10 h-10 rounded-lg bg-white border border-violet-100 flex items-center justify-center">
                                    <IconBuildingFactory2 size={18} stroke={1.8} className="text-violet-700" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.14em] text-violet-600 leading-none font-medium">
                                        {t('thresholdsPage.kpi.minesCoveredLabel')}
                                    </p>
                                    <p className="text-[12px] text-slate-700 mt-0.5 leading-none">
                                        {t('thresholdsPage.kpi.minesCovered', { count: minesCoveredCount })}
                                    </p>
                                </div>
                            </div>
                            <Tooltip
                                label={canAdmin ? t('thresholdsPage.actions.resetTooltip') : t('thresholdsPage.actions.resetDenied')}
                                withArrow
                            >
                                <button
                                    type="button"
                                    onClick={handleResetReference}
                                    disabled={!canAdmin}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border transition ${
                                        canAdmin
                                            ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                                            : 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed'
                                    }`}
                                >
                                    <IconRefresh size={13} stroke={1.8} />
                                    {t('thresholdsPage.actions.reset')}
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* ─── Bandeau d'erreur chargement (non bloquant) ─── */}
                {loadError && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Filtres ─── */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[180px]">
                            <Select
                                size="xs"
                                label={t('thresholdsPage.filters.mineLabel')}
                                data={[
                                    { value: 'all', label: t('thresholdsPage.filters.mineAll') },
                                    { value: 'global', label: t('thresholdsPage.filters.mineGlobal') },
                                    ...activeMineOptions,
                                ]}
                                value={filterMine}
                                onChange={(v) => setFilterMine(v ?? 'all')}
                            />
                        </div>
                        <div className="min-w-[180px]">
                            <Select
                                size="xs"
                                label={t('thresholdsPage.filters.categoryLabel')}
                                data={[
                                    { value: 'all', label: t('thresholdsPage.filters.categoryAll') },
                                    ...ALL_CATEGORIES.map((c) => ({
                                        value: c,
                                        label: t(`thresholds.categories.${c}`, { defaultValue: c }),
                                    })),
                                ]}
                                value={filterCategory}
                                onChange={(v) => setFilterCategory(v ?? 'all')}
                            />
                        </div>
                        <div className="min-w-[160px]">
                            <Select
                                size="xs"
                                label={t('thresholdsPage.filters.grandeurLabel')}
                                data={[
                                    { value: 'all', label: t('thresholdsPage.filters.grandeurAll') },
                                    ...ALL_GRANDEURS.map((g) => ({
                                        value: g,
                                        label: t(`thresholds.grandeurs.${g}`, { defaultValue: g }),
                                    })),
                                ]}
                                value={filterGrandeur}
                                onChange={(v) => setFilterGrandeur(v ?? 'all')}
                            />
                        </div>
                        <div className="self-center pb-1">
                            <Switch
                                checked={filterActiveOnly}
                                onChange={(e) => setFilterActiveOnly(e.currentTarget.checked)}
                                label={t('thresholdsPage.filters.activeLabel')}
                                size="sm"
                                color="indigo"
                            />
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <span className="text-[11.5px] text-slate-500">
                                {t('thresholdsPage.filters.summary', {
                                    count: visibleThresholds.length,
                                    total: thresholds.length,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="text-[11.5px] text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline"
                            >
                                {t('thresholdsPage.filters.clear')}
                            </button>
                            <Tooltip
                                label={canAdmin ? '' : t('thresholdsPage.actions.addDenied')}
                                disabled={canAdmin}
                                withArrow
                            >
                                <button
                                    type="button"
                                    onClick={() => canAdmin && setAddModalOpened(true)}
                                    disabled={!canAdmin}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md transition ${
                                        canAdmin
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    <IconPlus size={13} stroke={2} />
                                    {t('thresholdsPage.actions.addCustom')}
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* ─── Tableau seuils ─── */}
                <div className="safex-dosimetry-table bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1.5">
                            <IconPencil size={11} stroke={1.8} />
                            {t('thresholdsPage.table.doubleClickHint')}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]">
                            <thead>
                                <tr className="bg-slate-50/80 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-500">
                                    <SortableTh column="mine" label={t('thresholdsPage.table.mine')} sort={sort} onToggle={toggleSort} />
                                    <SortableTh column="category" label={t('thresholdsPage.table.category')} sort={sort} onToggle={toggleSort} />
                                    <SortableTh column="grandeur" label={t('thresholdsPage.table.grandeur')} sort={sort} onToggle={toggleSort} />
                                    <SortableTh column="doseConstraint" label={t('thresholdsPage.table.doseConstraint')} sort={sort} onToggle={toggleSort} align="right" />
                                    <SortableTh column="investigationLevel" label={t('thresholdsPage.table.investigationLevel')} sort={sort} onToggle={toggleSort} align="right" />
                                    <SortableTh column="actionLevel" label={t('thresholdsPage.table.actionLevel')} sort={sort} onToggle={toggleSort} align="right" />
                                    <SortableTh
                                        column="classificationThreshold"
                                        label={t('thresholdsPage.table.classificationThreshold', { defaultValue: 'Seuil de classification' })}
                                        sort={sort}
                                        onToggle={toggleSort}
                                        align="right"
                                    />
                                    <SortableTh column="regulatoryLimit" label={t('thresholdsPage.table.regulatoryLimit')} sort={sort} onToggle={toggleSort} align="right" />
                                    <SortableTh column="framework" label={t('thresholdsPage.table.framework')} sort={sort} onToggle={toggleSort} />
                                    <SortableTh column="status" label={t('thresholdsPage.table.status')} sort={sort} onToggle={toggleSort} />
                                    <th className="px-4 py-2 font-semibold text-right">{t('thresholdsPage.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                                            <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                                            {t('thresholdsPage.table.loading')}
                                        </td>
                                    </tr>
                                ) : visibleThresholds.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                                            {t('thresholdsPage.table.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    visibleThresholds.map((th, idx) => {
                                        const key = th.id ?? `row-${idx}`;
                                        const isActive = th.active !== false;
                                        return (
                                            <tr
                                                key={key}
                                                className={`border-t border-slate-100 hover:bg-indigo-50/30 transition-colors ${
                                                    isActive ? '' : 'opacity-60'
                                                }`}
                                            >
                                                <td className="px-4 py-2.5 text-slate-700">
                                                    {th.mineId == null ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700">
                                                            {t('thresholdsPage.table.global')}
                                                        </span>
                                                    ) : (
                                                        mineNameById.get(th.mineId) ?? `Mine #${th.mineId}`
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700">
                                                        {t(`thresholds.categories.${th.personCategory}`, { defaultValue: th.personCategory })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-800 font-medium">
                                                    {t(`thresholds.grandeurs.${th.grandeur}`, { defaultValue: th.grandeur })}
                                                </td>
                                                <EditableCell
                                                    th={th}
                                                    field="doseConstraint"
                                                    inlineEdit={inlineEdit}
                                                    canAdmin={canAdmin}
                                                    onStart={startEdit}
                                                    onDraftChange={(v) => setInlineEdit({ thresholdId: th.id ?? -1, field: 'doseConstraint', draft: v })}
                                                    onCommit={() => commitEdit(th)}
                                                    onCancel={cancelEdit}
                                                    colorClass="text-slate-700"
                                                />
                                                <EditableCell
                                                    th={th}
                                                    field="investigationLevel"
                                                    inlineEdit={inlineEdit}
                                                    canAdmin={canAdmin}
                                                    onStart={startEdit}
                                                    onDraftChange={(v) => setInlineEdit({ thresholdId: th.id ?? -1, field: 'investigationLevel', draft: v })}
                                                    onCommit={() => commitEdit(th)}
                                                    onCancel={cancelEdit}
                                                    colorClass="text-amber-700"
                                                />
                                                <EditableCell
                                                    th={th}
                                                    field="actionLevel"
                                                    inlineEdit={inlineEdit}
                                                    canAdmin={canAdmin}
                                                    onStart={startEdit}
                                                    onDraftChange={(v) => setInlineEdit({ thresholdId: th.id ?? -1, field: 'actionLevel', draft: v })}
                                                    onCommit={() => commitEdit(th)}
                                                    onCancel={cancelEdit}
                                                    colorClass="text-orange-700"
                                                />
                                                <EditableCell
                                                    th={th}
                                                    field="classificationThreshold"
                                                    inlineEdit={inlineEdit}
                                                    canAdmin={canAdmin}
                                                    onStart={startEdit}
                                                    onDraftChange={(v) => setInlineEdit({ thresholdId: th.id ?? -1, field: 'classificationThreshold', draft: v })}
                                                    onCommit={() => commitEdit(th)}
                                                    onCancel={cancelEdit}
                                                    colorClass="text-violet-700 font-semibold"
                                                />
                                                <EditableCell
                                                    th={th}
                                                    field="regulatoryLimit"
                                                    inlineEdit={inlineEdit}
                                                    canAdmin={canAdmin}
                                                    onStart={startEdit}
                                                    onDraftChange={(v) => setInlineEdit({ thresholdId: th.id ?? -1, field: 'regulatoryLimit', draft: v })}
                                                    onCommit={() => commitEdit(th)}
                                                    onCancel={cancelEdit}
                                                    colorClass="text-red-700 font-semibold"
                                                />
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${
                                                            th.referenceFramework === 'CUSTOM'
                                                                ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100'
                                                                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                        }`}
                                                    >
                                                        {t(`thresholds.frameworks.${th.referenceFramework}`, { defaultValue: th.referenceFramework })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {isActive ? (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            <IconCircleCheck size={11} stroke={2.2} />
                                                            {t('thresholdsPage.table.active')}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                            <IconCircleOff size={11} stroke={2.2} />
                                                            {t('thresholdsPage.table.inactive')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Tooltip
                                                            label={isActive ? t('thresholdsPage.actions.disable') : t('thresholdsPage.actions.enable')}
                                                            withArrow
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleActive(th)}
                                                                disabled={!canAdmin}
                                                                className={`p-1 rounded transition ${
                                                                    canAdmin
                                                                        ? isActive
                                                                            ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                                                            : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                                                        : 'text-slate-300 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                {isActive ? <IconCircleOff size={13} stroke={1.8} /> : <IconCircleCheck size={13} stroke={1.8} />}
                                                            </button>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── Footer aide CIPR 103 / AIEA GSR Part 3 ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                            <IconShieldLock size={16} stroke={1.8} />
                        </span>
                        <div>
                            <h2
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    letterSpacing: '-0.012em',
                                }}
                            >
                                {t('thresholdsPage.footer.title')}
                            </h2>
                            <p className="text-[12px] text-slate-600 mt-0.5">
                                {t('thresholdsPage.footer.subtitle')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border border-indigo-100 rounded-lg overflow-hidden">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="bg-indigo-50/60 text-left text-[10.5px] uppercase tracking-[0.10em] text-indigo-700">
                                    <th className="px-3 py-2 font-semibold">{t('thresholdsPage.footer.table.category')}</th>
                                    <th className="px-3 py-2 font-semibold text-right">{t('thresholdsPage.footer.table.hp10')}</th>
                                    <th className="px-3 py-2 font-semibold text-right">{t('thresholdsPage.footer.table.hp007')}</th>
                                    <th className="px-3 py-2 font-semibold text-right">{t('thresholdsPage.footer.table.hp3')}</th>
                                    <th className="px-3 py-2 font-semibold">{t('thresholdsPage.table.framework')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ALL_CATEGORIES.map((cat) => {
                                    const hp10 = CIPR_REFERENCE.find((r) => r.personCategory === cat && r.grandeur === 'HP10');
                                    const hp007 = CIPR_REFERENCE.find((r) => r.personCategory === cat && r.grandeur === 'HP007');
                                    const hp3 = CIPR_REFERENCE.find((r) => r.personCategory === cat && r.grandeur === 'HP3');
                                    const framework = hp10?.referenceFramework ?? hp007?.referenceFramework ?? hp3?.referenceFramework ?? 'CIPR_103';
                                    return (
                                        <tr key={cat} className="border-t border-slate-100">
                                            <td className="px-3 py-2 text-slate-700 font-medium">
                                                {t(`thresholds.categories.${cat}`, { defaultValue: cat })}
                                                {hp10?.classificationThreshold != null && (
                                                    <span className="block text-[10px] text-violet-700 mt-0.5">
                                                        {t('thresholdsPage.table.classificationThreshold', { defaultValue: 'Seuil de classification' })}: {hp10.classificationThreshold} mSv
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-slate-700">
                                                {hp10?.regulatoryLimit != null ? (
                                                    <>{hp10.regulatoryLimit} <span className="text-slate-400 text-[10px]">mSv</span></>
                                                ) : (
                                                    <span className="text-[10px] font-sans text-amber-700">
                                                        {t('thresholdsPage.table.localValidationRequired', { defaultValue: 'Non configurée — validation locale requise' })}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-slate-700">
                                                {hp007?.regulatoryLimit ?? '—'} <span className="text-slate-400 text-[10px]">mSv</span>
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-slate-700">
                                                {hp3?.regulatoryLimit ?? '—'} <span className="text-slate-400 text-[10px]">mSv</span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                    {t(`thresholds.frameworks.${framework}`, { defaultValue: framework })}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <p className="mt-3 text-[12px] text-slate-700 leading-relaxed flex items-start gap-2">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 text-indigo-600 flex-shrink-0" />
                        <span>{t('thresholdsPage.footer.notice')}</span>
                    </p>
                </div>
            </div>

            {/* ─── Modal d'ajout ─── */}
            {addModalOpened && (
                <AddThresholdModal
                    opened={addModalOpened}
                    onClose={() => setAddModalOpened(false)}
                    activeMineOptions={activeMineOptions}
                    onSubmit={handleCreateThreshold}
                />
            )}

            {/* ─── Modal de confirmation deviation > 50 % ─── */}
            {pendingDeviation && (
                <Modal
                    opened
                    onClose={cancelDeviation}
                    title={
                        <span
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '15px',
                            }}
                            className="text-slate-900"
                        >
                            {t('thresholdsPage.modal.deviation.title')}
                        </span>
                    }
                    centered
                    size="md"
                >
                    <div className="space-y-3">
                        <p className="text-[13px] text-slate-700">
                            {t('thresholdsPage.modal.deviation.body', {
                                field: t(`thresholdsPage.table.${pendingDeviation.field}`),
                                value: pendingDeviation.nextValue ?? '—',
                                reference: pendingDeviation.referenceValue,
                            })}
                        </p>
                        <Group justify="flex-end" gap="sm">
                            <Button variant="default" size="xs" onClick={cancelDeviation}>
                                {t('thresholdsPage.actions.cancel')}
                            </Button>
                            <Button
                                size="xs"
                                color="indigo"
                                onClick={confirmDeviation}
                                leftSection={<IconAlertOctagon size={13} />}
                            >
                                {t('thresholdsPage.modal.deviation.confirm')}
                            </Button>
                        </Group>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers — extracteur de valeur tri
// ─────────────────────────────────────────────────────────────────────────────

function readSortValue(
    th: ThresholdDTO,
    column: SortableColumn,
    mineNameById: Map<number, string>,
    t: (k: string, opts?: any) => string,
): string | number | null {
    switch (column) {
        case 'mine':
            return th.mineId == null
                ? t('thresholdsPage.table.global')
                : mineNameById.get(th.mineId) ?? `Mine #${th.mineId}`;
        case 'category':
            return th.personCategory;
        case 'grandeur':
            return th.grandeur;
        case 'doseConstraint':
            return th.doseConstraint ?? null;
        case 'investigationLevel':
            return th.investigationLevel ?? null;
        case 'actionLevel':
            return th.actionLevel ?? null;
        case 'classificationThreshold':
            return th.classificationThreshold ?? null;
        case 'regulatoryLimit':
            return th.regulatoryLimit ?? null;
        case 'framework':
            return th.referenceFramework;
        case 'status':
            return (th.active ?? true) ? 1 : 0;
        default:
            return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : entete tri
// ─────────────────────────────────────────────────────────────────────────────

interface SortableThProps {
    column: SortableColumn;
    label: string;
    sort: SortState;
    onToggle: (col: SortableColumn) => void;
    align?: 'left' | 'right';
}

function SortableTh({ column, label, sort, onToggle, align = 'left' }: SortableThProps) {
    const active = sort.column === column;
    return (
        <th
            className={`px-4 py-2 font-semibold cursor-pointer select-none hover:bg-slate-100/60 transition ${
                align === 'right' ? 'text-right' : 'text-left'
            }`}
            onClick={() => onToggle(column)}
        >
            <span
                className={`inline-flex items-center gap-1 ${
                    align === 'right' ? 'justify-end' : 'justify-start'
                } ${active ? 'text-indigo-700' : ''}`}
            >
                {label}
                {active &&
                    (sort.direction === 'asc' ? (
                        <IconArrowUp size={10} stroke={2} />
                    ) : (
                        <IconArrowDown size={10} stroke={2} />
                    ))}
            </span>
        </th>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : cellule editable inline (double-clic)
// ─────────────────────────────────────────────────────────────────────────────

interface EditableCellProps {
    th: ThresholdDTO;
    field: EditableField;
    inlineEdit: InlineEditState | null;
    canAdmin: boolean;
    onStart: (th: ThresholdDTO, field: EditableField) => void;
    onDraftChange: (v: number | null) => void;
    onCommit: () => void;
    onCancel: () => void;
    colorClass: string;
}

function EditableCell({
    th,
    field,
    inlineEdit,
    canAdmin,
    onStart,
    onDraftChange,
    onCommit,
    onCancel,
    colorClass,
}: EditableCellProps) {
    const isEditing =
        inlineEdit != null && inlineEdit.thresholdId === th.id && inlineEdit.field === field;
    const value = th[field] as number | null | undefined;

    if (isEditing && inlineEdit) {
        return (
            <td className="px-2 py-1 text-right">
                <div className="inline-flex items-center gap-1">
                    <NumberInput
                        size="xs"
                        value={inlineEdit.draft ?? undefined}
                        onChange={(v) => {
                            const next = typeof v === 'number' ? v : v === '' ? null : Number(v);
                            onDraftChange(Number.isNaN(next as number) ? null : (next as number | null));
                        }}
                        min={0}
                        step={0.5}
                        styles={{ input: { textAlign: 'right', width: 80, fontFamily: 'monospace' } }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                onCommit();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                onCancel();
                            }
                        }}
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={onCommit}
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                        title="Enregistrer"
                    >
                        <IconCheck size={13} stroke={2.2} />
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100"
                        title="Annuler"
                    >
                        <IconX size={13} stroke={2.2} />
                    </button>
                </div>
            </td>
        );
    }

    return (
        <td
            className={`px-4 py-2.5 text-right font-mono ${colorClass} ${
                canAdmin ? 'cursor-pointer hover:bg-indigo-50/40' : ''
            }`}
            onDoubleClick={() => canAdmin && onStart(th, field)}
            title={canAdmin ? 'Double-clic pour modifier' : undefined}
        >
            {field === 'regulatoryLimit'
                && value == null
                && (th.personCategory === 'WORKER_B' || th.personCategory === 'B') ? (
                <span className="block max-w-[130px] text-[10px] leading-tight font-sans text-amber-700">
                    Non configurée — validation locale requise
                </span>
            ) : (
                <>{value ?? '—'} <span className="text-slate-400 text-[10px] font-normal">{th.unit}</span></>
            )}
        </td>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : Modal d'ajout d'un seuil personnalise
// ─────────────────────────────────────────────────────────────────────────────

interface AddThresholdModalProps {
    opened: boolean;
    onClose: () => void;
    /** Option unique de mine = la mine active du header (vide si vue consolidée). */
    activeMineOptions: { value: string; label: string }[];
    onSubmit: (payload: ThresholdDTO) => Promise<void>;
}

function AddThresholdModal({ opened, onClose, activeMineOptions, onSubmit }: AddThresholdModalProps) {
    const { t } = useTranslation('dosimetry');

    const [mineValue, setMineValue] = useState<string>('global');
    const [category, setCategory] = useState<string | null>(null);
    const [grandeur, setGrandeur] = useState<string | null>(null);
    const [doseConstraint, setDoseConstraint] = useState<number | null>(null);
    const [investigationLevel, setInvestigationLevel] = useState<number | null>(null);
    const [actionLevel, setActionLevel] = useState<number | null>(null);
    const [classificationThreshold, setClassificationThreshold] = useState<number | null>(null);
    const [regulatoryLimit, setRegulatoryLimit] = useState<number | null>(null);
    const [justification, setJustification] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const validate = (): boolean => {
        const next: Record<string, string> = {};
        const isWorkerB = category === 'WORKER_B' || category === 'B';
        if (!category) next.category = t('thresholdsPage.modal.errors.categoryRequired');
        if (!grandeur) next.grandeur = t('thresholdsPage.modal.errors.grandeurRequired');
        if (isWorkerB && grandeur === 'HP10' && classificationThreshold == null) {
            next.classificationThreshold = t('thresholdsPage.modal.errors.classificationRequired', {
                defaultValue: 'Le seuil de classification est requis pour la catégorie B.',
            });
        }
        if (!isWorkerB && regulatoryLimit == null) {
            next.regulatoryLimit = t('thresholdsPage.modal.errors.regulatoryRequired');
        }
        if (isWorkerB && regulatoryLimit === 6) {
            next.regulatoryLimit = t('thresholdsPage.modal.errors.workerBClassificationNotLimit', {
                defaultValue: '6 mSv est un seuil de classification, pas une limite réglementaire.',
            });
        }
        if (justification.trim().length < 30)
            next.justification = t('thresholdsPage.modal.errors.justificationMin');
        // Monotonicite : c ≤ i ≤ a ≤ l (en ignorant les nulls)
        const seq = [doseConstraint, investigationLevel, actionLevel, regulatoryLimit];
        let last: number | null = null;
        for (const v of seq) {
            if (v == null) continue;
            if (last != null && v < last) {
                next.monotonic = t('thresholdsPage.modal.errors.monotonic');
                break;
            }
            last = v;
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        const mineId = mineValue === 'global' ? null : Number(mineValue);
        const payload: ThresholdDTO = {
            mineId,
            grandeur: grandeur as ThresholdGrandeur,
            personCategory: category as string,
            doseConstraint,
            investigationLevel,
            actionLevel,
            classificationThreshold,
            regulatoryLimit,
            unit: 'mSv',
            referenceFramework: 'CUSTOM',
            active: true,
        };
        try {
            await onSubmit(payload);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <span
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '16px',
                    }}
                    className="text-slate-900"
                >
                    {t('thresholdsPage.modal.addTitle')}
                </span>
            }
            centered
            size="lg"
        >
            <p className="text-[12.5px] text-slate-600 mb-4">
                {t('thresholdsPage.modal.addSubtitle')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                    label={t('thresholdsPage.modal.mineLabel')}
                    placeholder={t('thresholdsPage.modal.minePlaceholder')}
                    data={[
                        { value: 'global', label: t('thresholdsPage.modal.mineGlobalOption') },
                        ...activeMineOptions,
                    ]}
                    value={mineValue}
                    onChange={(v) => setMineValue(v ?? 'global')}
                    size="sm"
                />
                <Select
                    label={t('thresholdsPage.filters.categoryLabel')}
                    placeholder={t('thresholdsPage.modal.categoryPlaceholder')}
                    data={ALL_CATEGORIES.map((c) => ({
                        value: c,
                        label: t(`thresholds.categories.${c}`, { defaultValue: c }),
                    }))}
                    value={category}
                    onChange={setCategory}
                    error={errors.category}
                    size="sm"
                />
                <Select
                    label={t('thresholdsPage.filters.grandeurLabel')}
                    placeholder={t('thresholdsPage.modal.grandeurPlaceholder')}
                    data={ALL_GRANDEURS.map((g) => ({
                        value: g,
                        label: t(`thresholds.grandeurs.${g}`, { defaultValue: g }),
                    }))}
                    value={grandeur}
                    onChange={setGrandeur}
                    error={errors.grandeur}
                    size="sm"
                />
                <div className="text-[11px] text-slate-500 self-end pb-2">
                    {t('thresholdsPage.modal.frameworkAuto')}
                </div>

                <NumberInput
                    label={t('thresholdsPage.modal.doseConstraintLabel')}
                    value={doseConstraint ?? undefined}
                    onChange={(v) => setDoseConstraint(typeof v === 'number' ? v : v === '' ? null : Number(v))}
                    min={0}
                    step={0.5}
                    size="sm"
                />
                <NumberInput
                    label={t('thresholdsPage.modal.investigationLevelLabel')}
                    value={investigationLevel ?? undefined}
                    onChange={(v) => setInvestigationLevel(typeof v === 'number' ? v : v === '' ? null : Number(v))}
                    min={0}
                    step={0.5}
                    size="sm"
                />
                <NumberInput
                    label={t('thresholdsPage.modal.actionLevelLabel')}
                    value={actionLevel ?? undefined}
                    onChange={(v) => setActionLevel(typeof v === 'number' ? v : v === '' ? null : Number(v))}
                    min={0}
                    step={0.5}
                    size="sm"
                />
                <NumberInput
                    label={t('thresholdsPage.modal.classificationThresholdLabel', { defaultValue: 'Seuil de classification (mSv)' })}
                    description={t('thresholdsPage.modal.classificationThresholdDescription', {
                        defaultValue: 'Critère de classement distinct de la limite réglementaire.',
                    })}
                    value={classificationThreshold ?? undefined}
                    onChange={(v) => setClassificationThreshold(typeof v === 'number' ? v : v === '' ? null : Number(v))}
                    min={0}
                    step={0.5}
                    size="sm"
                    error={errors.classificationThreshold}
                />
                <NumberInput
                    label={t('thresholdsPage.modal.regulatoryLimitLabel')}
                    value={regulatoryLimit ?? undefined}
                    onChange={(v) => setRegulatoryLimit(typeof v === 'number' ? v : v === '' ? null : Number(v))}
                    min={0}
                    step={0.5}
                    size="sm"
                    error={errors.regulatoryLimit}
                />
            </div>

            {errors.monotonic && (
                <p className="text-[12px] text-red-600 mt-2 flex items-center gap-1.5">
                    <IconAlertOctagon size={12} stroke={2} />
                    {errors.monotonic}
                </p>
            )}

            <Textarea
                label={t('thresholdsPage.modal.justificationLabel')}
                placeholder={t('thresholdsPage.modal.justificationPlaceholder')}
                value={justification}
                onChange={(e) => setJustification(e.currentTarget.value)}
                error={errors.justification}
                minRows={3}
                size="sm"
                mt="sm"
            />

            <Group justify="flex-end" gap="sm" mt="md">
                <Button variant="default" size="sm" onClick={onClose} disabled={submitting}>
                    {t('thresholdsPage.actions.cancel')}
                </Button>
                <Button
                    size="sm"
                    color="indigo"
                    loading={submitting}
                    onClick={handleSubmit}
                    leftSection={<IconPlus size={13} />}
                >
                    {t('thresholdsPage.actions.create')}
                </Button>
            </Group>
        </Modal>
    );
}

export default DosimetryThresholdsPage;
