/**
 * ExposureAlertsPage — Phase 5 Frontend-B (LOT Dosimetrie & Expositions).
 *
 * Dashboard premium des alertes graduees (APPROACH / INVESTIGATION / ACTION /
 * EXCEEDED) emises par le moteur de seuils dosimetriques. Aligne sur le pattern
 * SafeX 360 (cf. DosimetryThresholdsPage, DoseTrackingPage).
 *
 * Route : /dosimetry/alerts
 *
 * Sections :
 *   1. Hero        : breadcrumb + titre serif + 4 KPI tiles inline
 *                    (ACTIVE pulse rouge, APPROACH, INVESTIGATION, ACTION+EXCEEDED).
 *   2. Onglets     : segmented filter (Active / Acquittees / Resolues / Toutes).
 *   3. Filtres     : niveau multi (chips), travailleur (autocomplete matricule/nom),
 *                    grandeur (HP10/HP007/HP3), periode (date pickers).
 *   4. Tableau     : colonnes Niveau (badge couleur + libelle + icone) | Travailleur
 *                    (lien) | Grandeur | Valeur | Seuil depasse | Date | Status |
 *                    Actions. Row click -> modal detail. Niveau EXCEEDED pulse.
 *   5. Modal       : detail complet (worker, grandeur, valeur exacte, seuil franchi),
 *                    historique 3 derniers mois, actions RBAC (Acquitter / Resoudre /
 *                    Ouvrir dossier depassement), audit trail.
 *
 * Donnees :
 *   - getActiveAlerts(mineId) pour ACTIVE.
 *   - getAllAlerts() pour ACK / RESOLVED / Toutes (filtre client).
 *   - searchWorkers / getAllThresholds pour resolution noms + seuils.
 *
 * RBAC :
 *   - "Acquitter" / "Resoudre" : DOSIMETRY_WRITE.
 *   - "Ouvrir dossier depassement" : DOSIMETRY_PCR_RPO.
 *
 * i18n : namespace `dosimetry`, sous-tree `alerts.*`.
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Modal,
    Select,
    TextInput,
    Textarea,
    Button,
    Group,
    MultiSelect,
    Tooltip,
} from '@mantine/core';
import {
    IconAlertOctagon,
    IconAlertTriangle,
    IconChevronRight,
    IconUserCircle,
    IconEye,
    IconCheck,
    IconCircleCheck,
    IconFolderOpen,
    IconClock,
    IconHistory,
    IconShieldLock,
    IconInfoCircle,
    IconFilter,
    IconRefresh,
    IconActivity,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import {
    getActiveAlerts,
    getAllAlerts,
    acknowledgeAlert,
    resolveAlert,
    getAllThresholds,
    searchWorkers,
    getActiveDoseRecordsByWorker,
    type ExposureAlertDTO,
    type AlertLevel,
    type AlertStatus,
    type ThresholdDTO,
    type ThresholdGrandeur,
    type DoseRecordDTO,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper — tolerant aux differentes formes de claims
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) {
        candidates.push(...user.authorities.map((a: any) => a?.authority ?? a));
    }
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

type TabKey = 'ACTIVE' | 'ACK' | 'RESOLVED' | 'ALL';

interface WorkerLite {
    id: number;
    matricule: string;
    fullName: string;
    category?: string | null;
}

interface AlertFilters {
    levels: AlertLevel[];
    workerId: string; // '' = tous
    grandeur: ThresholdGrandeur | 'ALL';
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
}

// ─────────────────────────────────────────────────────────────────────────────
//  Formatters
// ─────────────────────────────────────────────────────────────────────────────

const formatMsv = (v: number | null | undefined): string => {
    if (v == null || Number.isNaN(v)) return '—';
    return Number(v).toFixed(2);
};

const formatDateTime = (s?: string | null): string => {
    if (!s) return '—';
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return s;
    }
};

const formatDate = (s?: string | null): string => {
    if (!s) return '—';
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return s;
    }
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);
const threeMonthsAgoIso = (): string => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
};

// ─────────────────────────────────────────────────────────────────────────────
//  Visual tones par AlertLevel
// ─────────────────────────────────────────────────────────────────────────────

interface LevelTone {
    bg: string;
    text: string;
    border: string;
    badge: string;
    icon: typeof IconAlertTriangle;
    pulse: boolean;
}

const LEVEL_TONES: Record<AlertLevel, LevelTone> = {
    APPROACH: {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-900 border-blue-200',
        icon: IconActivity,
        pulse: false,
    },
    INVESTIGATION: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-900 border-yellow-200',
        icon: IconAlertTriangle,
        pulse: false,
    },
    ACTION: {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-900 border-orange-200',
        icon: IconAlertOctagon,
        pulse: false,
    },
    EXCEEDED: {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-300',
        badge: 'bg-red-100 text-red-900 border-red-300',
        icon: IconAlertOctagon,
        pulse: true,
    },
};

const STATUS_BADGE: Record<AlertStatus, string> = {
    ACTIVE: 'bg-red-100 text-red-800 border border-red-200',
    ACK: 'bg-amber-100 text-amber-800 border border-amber-200',
    RESOLVED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

const ALL_LEVELS: AlertLevel[] = ['APPROACH', 'INVESTIGATION', 'ACTION', 'EXCEEDED'];
const ALL_GRANDEURS: ThresholdGrandeur[] = ['HP10', 'HP007', 'HP3'];

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const ExposureAlertsPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();

    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');
    const canPcr = hasDosimetryPermission(user, 'DOSIMETRY_PCR_RPO');

    const mineId: number = selectedMineId ?? user?.mineId ?? user?.companyId ?? 1;

    const [alerts, setAlerts] = useState<ExposureAlertDTO[]>([]);
    const [workers, setWorkers] = useState<WorkerLite[]>([]);
    const [thresholds, setThresholds] = useState<ThresholdDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [tab, setTab] = useState<TabKey>('ACTIVE');
    const [filters, setFilters] = useState<AlertFilters>({
        levels: [],
        workerId: '',
        grandeur: 'ALL',
        from: threeMonthsAgoIso(),
        to: todayIso(),
    });

    const [selectedAlert, setSelectedAlert] = useState<ExposureAlertDTO | null>(null);
    const [actionDialog, setActionDialog] = useState<null | 'ACK' | 'RESOLVE'>(null);
    const [actionNote, setActionNote] = useState<string>('');
    const [submittingAction, setSubmittingAction] = useState(false);

    // ───── Chargement initial : alertes + workers + seuils ─────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [alertsResult, workersResult, thresholdsResult] = await Promise.allSettled([
                tab === 'ACTIVE' ? getActiveAlerts(mineId) : getAllAlerts(),
                searchWorkers({ mineId }),
                getAllThresholds(),
            ]);

            // Alertes
            if (alertsResult.status === 'fulfilled') {
                const list: any = alertsResult.value;
                const arr: ExposureAlertDTO[] = Array.isArray(list) ? list : (list?.content ?? []);
                setAlerts(arr);
            } else {
                setAlerts([]);
                setLoadError(t('alerts.loadError'));
            }

            // Workers (silencieux si echec — on degrade en affichant l'id)
            if (workersResult.status === 'fulfilled') {
                const list: any = workersResult.value;
                const arr: any[] = Array.isArray(list) ? list : (list?.content ?? []);
                setWorkers(
                    arr
                        .map((w) => ({
                            id: Number(w.id ?? w.workerId ?? 0),
                            matricule: String(w.matricule ?? `#${w.employeeId ?? ''}`),
                            fullName: String(w.fullName ?? `Employee #${w.employeeId ?? ''}`),
                            category: w.category ?? null,
                        }))
                        .filter((w) => w.id > 0),
                );
            }

            // Thresholds (silencieux si echec)
            if (thresholdsResult.status === 'fulfilled') {
                const list: any = thresholdsResult.value;
                const arr: ThresholdDTO[] = Array.isArray(list) ? list : (list?.content ?? []);
                setThresholds(arr);
            }
        } finally {
            setLoading(false);
        }
    }, [tab, mineId, t]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ───── Index workers par id ─────
    const workerById = useMemo(() => {
        const map = new Map<number, WorkerLite>();
        workers.forEach((w) => map.set(w.id, w));
        return map;
    }, [workers]);

    const thresholdById = useMemo(() => {
        const map = new Map<number, ThresholdDTO>();
        thresholds.forEach((th) => {
            if (th.id != null) map.set(Number(th.id), th);
        });
        return map;
    }, [thresholds]);

    // ───── KPI counts (base = toutes les alertes, status filtre du backend non
    //       garanti, on recalcule pour la coherence visuelle) ─────
    const kpiCounts = useMemo(() => {
        let active = 0;
        let approach = 0;
        let investigation = 0;
        let actionExceeded = 0;
        for (const a of alerts) {
            if (a.status === 'ACTIVE') active += 1;
            if (a.level === 'APPROACH') approach += 1;
            else if (a.level === 'INVESTIGATION') investigation += 1;
            else if (a.level === 'ACTION' || a.level === 'EXCEEDED') actionExceeded += 1;
        }
        return { active, approach, investigation, actionExceeded };
    }, [alerts]);

    // ───── Filtrage selon tab + filtres ─────
    const visibleAlerts = useMemo(() => {
        return alerts.filter((a) => {
            // Tab
            if (tab !== 'ALL' && a.status !== tab) return false;
            // Niveau (multi)
            if (filters.levels.length > 0 && !filters.levels.includes(a.level)) return false;
            // Travailleur
            if (filters.workerId && String(a.workerId) !== filters.workerId) return false;
            // Grandeur
            if (filters.grandeur !== 'ALL' && a.grandeur !== filters.grandeur) return false;
            // Periode (sur triggeredAt)
            if (a.triggeredAt) {
                const dStr = a.triggeredAt.slice(0, 10);
                if (filters.from && dStr < filters.from) return false;
                if (filters.to && dStr > filters.to) return false;
            }
            return true;
        });
    }, [alerts, tab, filters]);

    const handleClearFilters = () => {
        setFilters({
            levels: [],
            workerId: '',
            grandeur: 'ALL',
            from: threeMonthsAgoIso(),
            to: todayIso(),
        });
    };

    // ───── Actions Acquitter / Resoudre ─────
    const openActionDialog = (kind: 'ACK' | 'RESOLVE') => {
        if (kind === 'ACK' && !canWrite) {
            errorNotification(t('alerts.actions.ackDenied'));
            return;
        }
        if (kind === 'RESOLVE' && !canWrite) {
            errorNotification(t('alerts.actions.resolveDenied'));
            return;
        }
        setActionNote('');
        setActionDialog(kind);
    };

    const submitAction = async () => {
        if (!selectedAlert || selectedAlert.id == null) return;
        if (actionNote.trim().length < 10) {
            errorNotification(t('alerts.modal.noteRequired'));
            return;
        }
        setSubmittingAction(true);
        try {
            if (actionDialog === 'ACK') {
                await acknowledgeAlert(Number(selectedAlert.id), actionNote.trim());
                successNotification(t('alerts.modal.ackSuccess'));
            } else if (actionDialog === 'RESOLVE') {
                await resolveAlert(Number(selectedAlert.id), actionNote.trim());
                successNotification(t('alerts.modal.resolveSuccess'));
            }
            setActionDialog(null);
            setActionNote('');
            setSelectedAlert(null);
            await fetchAll();
        } catch {
            errorNotification(t('alerts.modal.actionError'));
        } finally {
            setSubmittingAction(false);
        }
    };

    const openOverexposureCase = () => {
        if (!canPcr) {
            errorNotification(t('alerts.actions.openCaseDenied'));
            return;
        }
        // Phase 5 : pas encore d'endpoint dedie — feedback informatif.
        successNotification(t('alerts.modal.openCaseSoon'));
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
                        {t('alerts.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('alerts.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('alerts.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero card avec KPI tiles inline ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200 flex-shrink-0">
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
                                    {t('alerts.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('alerts.subtitle')}
                                </p>
                            </div>
                        </div>

                        {/* KPI tiles inline */}
                        <div className="flex flex-wrap items-stretch gap-2">
                            <KpiTile
                                label={t('alerts.kpi.activeLabel')}
                                sub={t('alerts.kpi.activeSub')}
                                value={kpiCounts.active}
                                tone="red"
                                pulse={kpiCounts.active > 0}
                            />
                            <KpiTile
                                label={t('alerts.kpi.approachLabel')}
                                sub={t('alerts.kpi.approachSub')}
                                value={kpiCounts.approach}
                                tone="blue"
                            />
                            <KpiTile
                                label={t('alerts.kpi.investigationLabel')}
                                sub={t('alerts.kpi.investigationSub')}
                                value={kpiCounts.investigation}
                                tone="yellow"
                            />
                            <KpiTile
                                label={t('alerts.kpi.criticalLabel')}
                                sub={t('alerts.kpi.criticalSub')}
                                value={kpiCounts.actionExceeded}
                                tone="orange"
                                urgent={kpiCounts.actionExceeded > 0}
                            />
                            <button
                                type="button"
                                onClick={fetchAll}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition self-start"
                                aria-label="Rafraichir"
                            >
                                <IconRefresh size={13} stroke={1.8} />
                            </button>
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

                {/* ─── Segmented filter onglets ─── */}
                <div className="bg-white border border-slate-200 rounded-xl mb-4 shadow-sm overflow-hidden">
                    <div className="flex flex-wrap border-b border-slate-100" role="tablist">
                        {(
                            [
                                { key: 'ACTIVE', label: t('alerts.tabs.active') },
                                { key: 'ACK', label: t('alerts.tabs.ack') },
                                { key: 'RESOLVED', label: t('alerts.tabs.resolved') },
                                { key: 'ALL', label: t('alerts.tabs.all') },
                            ] as { key: TabKey; label: string }[]
                        ).map((tabDef) => {
                            const active = tab === tabDef.key;
                            return (
                                <button
                                    key={tabDef.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setTab(tabDef.key)}
                                    className={`px-4 py-2.5 text-[12.5px] font-medium transition border-b-2 ${
                                        active
                                            ? 'text-red-700 border-red-600 bg-red-50/60'
                                            : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-800'
                                    }`}
                                >
                                    {tabDef.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ─── Filtres ─── */}
                    <div className="p-4 flex flex-wrap items-end gap-3">
                        <div className="min-w-[200px] flex-1">
                            <MultiSelect
                                size="xs"
                                label={t('alerts.filters.levelLabel')}
                                placeholder={t('alerts.filters.levelPlaceholder')}
                                data={ALL_LEVELS.map((lvl) => ({
                                    value: lvl,
                                    label: t(`alerts.level.${lvl}`, { defaultValue: lvl }),
                                }))}
                                value={filters.levels}
                                onChange={(vals) =>
                                    setFilters((f) => ({ ...f, levels: vals as AlertLevel[] }))
                                }
                                clearable
                            />
                        </div>
                        <div className="min-w-[220px] flex-1">
                            <Select
                                size="xs"
                                label={t('alerts.filters.workerLabel')}
                                placeholder={t('alerts.filters.workerPlaceholder')}
                                data={workers.map((w) => ({
                                    value: String(w.id),
                                    label: `${w.matricule} — ${w.fullName}`,
                                }))}
                                value={filters.workerId || null}
                                onChange={(v) => setFilters((f) => ({ ...f, workerId: v ?? '' }))}
                                searchable
                                clearable
                            />
                        </div>
                        <div className="min-w-[150px]">
                            <Select
                                size="xs"
                                label={t('alerts.filters.grandeurLabel')}
                                data={[
                                    { value: 'ALL', label: t('alerts.filters.grandeurAll') },
                                    ...ALL_GRANDEURS.map((g) => ({
                                        value: g,
                                        label: t(`thresholds.grandeurs.${g}`, { defaultValue: g }),
                                    })),
                                ]}
                                value={filters.grandeur}
                                onChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        grandeur: (v as ThresholdGrandeur | 'ALL') ?? 'ALL',
                                    }))
                                }
                            />
                        </div>
                        <div className="min-w-[140px]">
                            <TextInput
                                size="xs"
                                label={t('alerts.filters.periodFrom')}
                                type="date"
                                value={filters.from}
                                onChange={(e) =>
                                    setFilters((f) => ({ ...f, from: e.currentTarget.value }))
                                }
                            />
                        </div>
                        <div className="min-w-[140px]">
                            <TextInput
                                size="xs"
                                label={t('alerts.filters.periodTo')}
                                type="date"
                                value={filters.to}
                                onChange={(e) =>
                                    setFilters((f) => ({ ...f, to: e.currentTarget.value }))
                                }
                            />
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2 pb-1">
                            <span className="text-[11.5px] text-slate-500">
                                {t('alerts.filters.summary', {
                                    count: visibleAlerts.length,
                                    total: alerts.length,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-1 text-[11.5px] text-red-600 hover:text-red-700 underline-offset-2 hover:underline"
                            >
                                <IconFilter size={11} stroke={1.8} />
                                {t('alerts.filters.clear')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Tableau alertes ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]">
                            <thead>
                                <tr className="bg-gradient-to-b from-slate-50 to-slate-100 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-600 border-b border-slate-300">
                                    <th className="px-3 py-2.5 font-semibold">{t('alerts.table.level')}</th>
                                    <th className="px-3 py-2.5 font-semibold">{t('alerts.table.worker')}</th>
                                    <th className="px-3 py-2.5 font-semibold">{t('alerts.table.grandeur')}</th>
                                    <th className="px-3 py-2.5 font-semibold text-right">{t('alerts.table.value')}</th>
                                    <th className="px-3 py-2.5 font-semibold text-right">{t('alerts.table.threshold')}</th>
                                    <th className="px-3 py-2.5 font-semibold">{t('alerts.table.triggeredAt')}</th>
                                    <th className="px-3 py-2.5 font-semibold">{t('alerts.table.status')}</th>
                                    <th className="px-3 py-2.5 font-semibold text-right">{t('alerts.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                                            <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2 align-middle" />
                                            {t('alerts.loading')}
                                        </td>
                                    </tr>
                                ) : visibleAlerts.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                                            {t('alerts.table.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    visibleAlerts.map((alert, idx) => {
                                        const key = alert.id ?? `row-${idx}`;
                                        const tone = LEVEL_TONES[alert.level];
                                        const LevelIcon = tone.icon;
                                        const worker = workerById.get(Number(alert.workerId)) ?? null;
                                        const threshold = thresholdById.get(Number(alert.thresholdId)) ?? null;
                                        const thresholdValue =
                                            threshold?.regulatoryLimit ??
                                            threshold?.actionLevel ??
                                            threshold?.investigationLevel ??
                                            null;
                                        return (
                                            <tr
                                                key={key}
                                                onClick={() => setSelectedAlert(alert)}
                                                className={`border-t border-slate-100 hover:bg-red-50/30 transition cursor-pointer ${
                                                    alert.level === 'EXCEEDED' ? 'bg-red-50/20' : ''
                                                }`}
                                            >
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${tone.badge} ${
                                                            tone.pulse ? 'animate-pulse' : ''
                                                        }`}
                                                    >
                                                        <LevelIcon size={12} stroke={2} />
                                                        {t(`alerts.level.${alert.level}`, { defaultValue: alert.level })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {worker ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/dosimetry/workers/detail/${worker.id}`);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 hover:underline underline-offset-2 transition"
                                                        >
                                                            <IconUserCircle size={14} stroke={1.8} />
                                                            <span className="font-mono text-[11.5px]">{worker.matricule}</span>
                                                            <span className="text-slate-700">{worker.fullName}</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-500">#{alert.workerId}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-800 font-medium">
                                                    {t(`thresholds.grandeurs.${alert.grandeur}`, { defaultValue: alert.grandeur })}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-slate-800 font-semibold">
                                                    {formatMsv(alert.value)} <span className="text-slate-400 text-[10px] font-normal">mSv</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                                                    {thresholdValue != null ? (
                                                        <>
                                                            {formatMsv(thresholdValue)} <span className="text-slate-400 text-[10px] font-normal">mSv</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 inline-flex items-center gap-1">
                                                    <IconClock size={11} className="text-slate-400" />
                                                    {formatDateTime(alert.triggeredAt)}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${
                                                            STATUS_BADGE[alert.status] ?? ''
                                                        }`}
                                                    >
                                                        {t(`alerts.statusBadge.${alert.status}`, { defaultValue: alert.status })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div
                                                        className="inline-flex items-center gap-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {alert.status === 'ACTIVE' && (
                                                            <Tooltip
                                                                label={canWrite ? t('alerts.table.ack') : t('alerts.actions.ackDenied')}
                                                                withArrow
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedAlert(alert);
                                                                        openActionDialog('ACK');
                                                                    }}
                                                                    disabled={!canWrite}
                                                                    className={`p-1 rounded transition ${
                                                                        canWrite
                                                                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                                                            : 'text-slate-300 cursor-not-allowed'
                                                                    }`}
                                                                >
                                                                    <IconCheck size={14} stroke={1.8} />
                                                                </button>
                                                            </Tooltip>
                                                        )}
                                                        {alert.status === 'ACK' && (
                                                            <Tooltip
                                                                label={canWrite ? t('alerts.table.resolve') : t('alerts.actions.resolveDenied')}
                                                                withArrow
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedAlert(alert);
                                                                        openActionDialog('RESOLVE');
                                                                    }}
                                                                    disabled={!canWrite}
                                                                    className={`p-1 rounded transition ${
                                                                        canWrite
                                                                            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                                                            : 'text-slate-300 cursor-not-allowed'
                                                                    }`}
                                                                >
                                                                    <IconCircleCheck size={14} stroke={1.8} />
                                                                </button>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip label={t('alerts.table.view')} withArrow>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedAlert(alert)}
                                                                className="p-1 rounded text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition"
                                                            >
                                                                <IconEye size={14} stroke={1.8} />
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
            </div>

            {/* ─── Modal detail alerte ─── */}
            {selectedAlert && (
                <AlertDetailModal
                    alert={selectedAlert}
                    worker={workerById.get(Number(selectedAlert.workerId)) ?? null}
                    threshold={thresholdById.get(Number(selectedAlert.thresholdId)) ?? null}
                    canWrite={canWrite}
                    canPcr={canPcr}
                    onClose={() => {
                        setSelectedAlert(null);
                        setActionDialog(null);
                        setActionNote('');
                    }}
                    onAck={() => openActionDialog('ACK')}
                    onResolve={() => openActionDialog('RESOLVE')}
                    onOpenCase={openOverexposureCase}
                />
            )}

            {/* ─── Modal acquittement / resolution (input note) ─── */}
            {actionDialog && selectedAlert && (
                <Modal
                    opened
                    onClose={() => {
                        setActionDialog(null);
                        setActionNote('');
                    }}
                    title={
                        <span
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '15px',
                            }}
                            className="text-slate-900"
                        >
                            {actionDialog === 'ACK'
                                ? t('alerts.table.ack')
                                : t('alerts.table.resolve')}
                        </span>
                    }
                    centered
                    size="md"
                >
                    <div className="space-y-3">
                        <Textarea
                            label={
                                actionDialog === 'ACK'
                                    ? t('alerts.modal.noteAckLabel')
                                    : t('alerts.modal.noteResolveLabel')
                            }
                            placeholder={
                                actionDialog === 'ACK'
                                    ? t('alerts.modal.noteAckPlaceholder')
                                    : t('alerts.modal.noteResolvePlaceholder')
                            }
                            value={actionNote}
                            onChange={(e) => setActionNote(e.currentTarget.value)}
                            minRows={4}
                            autosize
                            required
                            error={
                                actionNote.length > 0 && actionNote.trim().length < 10
                                    ? t('alerts.modal.noteRequired')
                                    : undefined
                            }
                        />
                        <Group justify="flex-end" gap="sm">
                            <Button
                                variant="default"
                                size="xs"
                                onClick={() => {
                                    setActionDialog(null);
                                    setActionNote('');
                                }}
                                disabled={submittingAction}
                            >
                                {t('alerts.modal.close')}
                            </Button>
                            <Button
                                size="xs"
                                color={actionDialog === 'ACK' ? 'orange' : 'green'}
                                loading={submittingAction}
                                onClick={submitAction}
                                leftSection={
                                    actionDialog === 'ACK' ? (
                                        <IconCheck size={13} />
                                    ) : (
                                        <IconCircleCheck size={13} />
                                    )
                                }
                            >
                                {actionDialog === 'ACK'
                                    ? t('alerts.table.ack')
                                    : t('alerts.table.resolve')}
                            </Button>
                        </Group>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : KPI Tile
// ─────────────────────────────────────────────────────────────────────────────

interface KpiTileProps {
    label: string;
    sub: string;
    value: number;
    tone: 'red' | 'blue' | 'yellow' | 'orange';
    pulse?: boolean;
    urgent?: boolean;
}

function KpiTile({ label, sub, value, tone, pulse = false, urgent = false }: KpiTileProps) {
    const palettes: Record<KpiTileProps['tone'], { bg: string; border: string; valueColor: string; labelColor: string }> = {
        red: {
            bg: 'bg-red-50/70',
            border: 'border-red-100',
            valueColor: 'text-red-700',
            labelColor: 'text-red-600',
        },
        blue: {
            bg: 'bg-blue-50/70',
            border: 'border-blue-100',
            valueColor: 'text-blue-700',
            labelColor: 'text-blue-600',
        },
        yellow: {
            bg: 'bg-yellow-50/70',
            border: 'border-yellow-100',
            valueColor: 'text-yellow-700',
            labelColor: 'text-yellow-700',
        },
        orange: {
            bg: 'bg-orange-50/70',
            border: 'border-orange-100',
            valueColor: 'text-orange-700',
            labelColor: 'text-orange-600',
        },
    };
    const p = palettes[tone];
    return (
        <div
            className={`relative inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border ${p.bg} ${p.border} ${
                pulse ? 'ring-2 ring-red-300 ring-offset-1 animate-pulse' : ''
            }`}
        >
            <div className="w-10 h-10 rounded-lg bg-white border border-white/40 flex items-center justify-center shadow-sm">
                <span className={`text-[15px] font-mono font-bold ${p.valueColor}`}>{value}</span>
            </div>
            <div>
                <p className={`text-[10px] uppercase tracking-[0.14em] leading-none font-semibold ${p.labelColor}`}>
                    {label}
                </p>
                <p className="text-[11.5px] text-slate-700 mt-0.5 leading-none">{sub}</p>
            </div>
            {urgent && value > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold animate-pulse shadow-md">
                    !
                </span>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : Modal detail d'une alerte
// ─────────────────────────────────────────────────────────────────────────────

interface AlertDetailModalProps {
    alert: ExposureAlertDTO;
    worker: WorkerLite | null;
    threshold: ThresholdDTO | null;
    canWrite: boolean;
    canPcr: boolean;
    onClose: () => void;
    onAck: () => void;
    onResolve: () => void;
    onOpenCase: () => void;
}

function AlertDetailModal({
    alert,
    worker,
    threshold,
    canWrite,
    canPcr,
    onClose,
    onAck,
    onResolve,
    onOpenCase,
}: AlertDetailModalProps) {
    const { t } = useTranslation('dosimetry');
    const [recentDoses, setRecentDoses] = useState<DoseRecordDTO[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const tone = LEVEL_TONES[alert.level];
    const LevelIcon = tone.icon;

    // Recharge historique recent (3 derniers mois) cote ouverture du modal.
    useEffect(() => {
        let cancelled = false;
        if (alert.workerId == null) return;
        setLoadingHistory(true);
        getActiveDoseRecordsByWorker(alert.workerId)
            .then((list: any) => {
                if (cancelled) return;
                const arr: DoseRecordDTO[] = Array.isArray(list) ? list : (list?.content ?? []);
                // Filtre 3 derniers mois (sur period YYYY-MM ou YYYY-MM-DD).
                const threshold3m = new Date();
                threshold3m.setMonth(threshold3m.getMonth() - 3);
                const cutoff = threshold3m.toISOString().slice(0, 7);
                const filtered = arr.filter((r) => {
                    const p = (r.period ?? '').slice(0, 7);
                    return p >= cutoff;
                });
                // Tri DESC sur period
                filtered.sort((a, b) => (b.period ?? '').localeCompare(a.period ?? ''));
                setRecentDoses(filtered.slice(0, 8));
            })
            .catch(() => {
                if (!cancelled) setRecentDoses([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingHistory(false);
            });
        return () => {
            cancelled = true;
        };
    }, [alert.workerId]);

    return (
        <Modal
            opened
            onClose={onClose}
            title={
                <span
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '16px',
                    }}
                    className="text-slate-900 inline-flex items-center gap-2"
                >
                    <LevelIcon size={18} stroke={1.8} className={tone.text} />
                    {t('alerts.modal.title')}
                </span>
            }
            centered
            size="lg"
            scrollAreaComponent={undefined}
        >
            {/* En-tete niveau + status */}
            <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border mb-4 ${tone.bg} ${tone.border}`}>
                <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11.5px] font-semibold border ${tone.badge} ${
                        tone.pulse ? 'animate-pulse' : ''
                    }`}
                >
                    <LevelIcon size={12} stroke={2} />
                    {t(`alerts.level.${alert.level}`, { defaultValue: alert.level })}
                </span>
                <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${STATUS_BADGE[alert.status] ?? ''}`}
                >
                    {t(`alerts.statusBadge.${alert.status}`, { defaultValue: alert.status })}
                </span>
            </div>

            {/* Section : Travailleur */}
            <Section title={t('alerts.modal.workerSection')} icon={<IconUserCircle size={14} stroke={1.8} />}>
                <InfoGrid>
                    <InfoRow label={t('alerts.modal.matricule')} value={worker?.matricule ?? '—'} />
                    <InfoRow label={t('alerts.modal.fullName')} value={worker?.fullName ?? '—'} />
                    <InfoRow label={t('alerts.modal.category')} value={worker?.category ?? '—'} />
                </InfoGrid>
            </Section>

            {/* Section : Alerte */}
            <Section title={t('alerts.modal.alertSection')} icon={<IconAlertOctagon size={14} stroke={1.8} />}>
                <InfoGrid>
                    <InfoRow
                        label={t('alerts.modal.grandeur')}
                        value={t(`thresholds.grandeurs.${alert.grandeur}`, { defaultValue: alert.grandeur })}
                    />
                    <InfoRow
                        label={t('alerts.modal.value')}
                        value={`${formatMsv(alert.value)} mSv`}
                        valueClass="font-mono font-semibold text-slate-900"
                    />
                    <InfoRow label={t('alerts.modal.triggeredAt')} value={formatDateTime(alert.triggeredAt)} />
                    {alert.acknowledgedAt && (
                        <InfoRow
                            label={t('alerts.modal.acknowledgedAt')}
                            value={formatDateTime(alert.acknowledgedAt)}
                        />
                    )}
                    {alert.acknowledgedBy != null && (
                        <InfoRow
                            label={t('alerts.modal.acknowledgedBy')}
                            value={`#${alert.acknowledgedBy}`}
                        />
                    )}
                </InfoGrid>
            </Section>

            {/* Section : Seuil franchi */}
            <Section title={t('alerts.modal.thresholdSection')} icon={<IconShieldLock size={14} stroke={1.8} />}>
                {threshold ? (
                    <InfoGrid>
                        <InfoRow
                            label={t('alerts.modal.regulatoryLimit')}
                            value={`${formatMsv(threshold.regulatoryLimit ?? null)} mSv`}
                            valueClass="font-mono text-red-700 font-semibold"
                        />
                        <InfoRow
                            label={t('alerts.modal.actionLevel')}
                            value={`${formatMsv(threshold.actionLevel ?? null)} mSv`}
                            valueClass="font-mono text-orange-700"
                        />
                        <InfoRow
                            label={t('alerts.modal.investigationLevel')}
                            value={`${formatMsv(threshold.investigationLevel ?? null)} mSv`}
                            valueClass="font-mono text-yellow-700"
                        />
                        <InfoRow
                            label={t('alerts.modal.framework')}
                            value={t(`thresholds.frameworks.${threshold.referenceFramework}`, {
                                defaultValue: threshold.referenceFramework,
                            })}
                        />
                    </InfoGrid>
                ) : (
                    <p className="text-[12.5px] text-slate-500 italic">—</p>
                )}
            </Section>

            {/* Section : Historique doses recentes */}
            <Section title={t('alerts.modal.historySection')} icon={<IconHistory size={14} stroke={1.8} />}>
                {loadingHistory ? (
                    <p className="text-[12px] text-slate-500">
                        <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2 align-middle" />
                        ...
                    </p>
                ) : recentDoses.length === 0 ? (
                    <p className="text-[12.5px] text-slate-500 italic">
                        {t('alerts.modal.noHistory')}
                    </p>
                ) : (
                    <div className="border border-slate-200 rounded-md overflow-hidden">
                        <table className="w-full text-[11.5px]">
                            <thead>
                                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-[0.10em] text-slate-500">
                                    <th className="px-2 py-1.5 font-semibold">{t('workerDetail.doses.cols.period')}</th>
                                    <th className="px-2 py-1.5 font-semibold text-right">{t('workerDetail.doses.cols.hp10')}</th>
                                    <th className="px-2 py-1.5 font-semibold text-right">{t('workerDetail.doses.cols.hp007')}</th>
                                    <th className="px-2 py-1.5 font-semibold text-right">{t('workerDetail.doses.cols.hp3')}</th>
                                    <th className="px-2 py-1.5 font-semibold">{t('workerDetail.doses.cols.source')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentDoses.map((r) => (
                                    <tr key={r.id ?? r.period} className="border-t border-slate-100">
                                        <td className="px-2 py-1 font-mono text-slate-700">{r.period ?? '—'}</td>
                                        <td className="px-2 py-1 text-right font-mono text-slate-800">{formatMsv(r.hp10)}</td>
                                        <td className="px-2 py-1 text-right font-mono text-slate-600">{formatMsv(r.hp007)}</td>
                                        <td className="px-2 py-1 text-right font-mono text-slate-600">{formatMsv(r.hp3)}</td>
                                        <td className="px-2 py-1 text-slate-600">{r.source ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>

            {/* Section : Audit trail (createdAt / updatedAt / createdBy / updatedBy) */}
            <Section title={t('alerts.modal.auditSection')} icon={<IconClock size={14} stroke={1.8} />}>
                <InfoGrid>
                    {alert.createdAt && (
                        <InfoRow label="Created" value={`${formatDate(alert.createdAt)}${alert.createdBy ? ` • #${alert.createdBy}` : ''}`} />
                    )}
                    {alert.updatedAt && (
                        <InfoRow label="Updated" value={`${formatDate(alert.updatedAt)}${alert.updatedBy ? ` • #${alert.updatedBy}` : ''}`} />
                    )}
                </InfoGrid>
            </Section>

            {/* Actions footer */}
            <Group justify="space-between" gap="sm" mt="md">
                <div>
                    {worker && (
                        <Button
                            variant="subtle"
                            size="xs"
                            leftSection={<IconUserCircle size={13} />}
                            onClick={() => {
                                window.location.href = `/dosimetry/workers/detail/${worker.id}`;
                            }}
                        >
                            {t('alerts.table.viewWorker')}
                        </Button>
                    )}
                </div>
                <Group gap="sm">
                    {alert.status === 'ACTIVE' && (
                        <Tooltip
                            label={canWrite ? '' : t('alerts.actions.ackDenied')}
                            disabled={canWrite}
                            withArrow
                        >
                            <Button
                                size="xs"
                                color="orange"
                                leftSection={<IconCheck size={13} />}
                                onClick={onAck}
                                disabled={!canWrite}
                            >
                                {t('alerts.table.ack')}
                            </Button>
                        </Tooltip>
                    )}
                    {alert.status === 'ACK' && (
                        <Tooltip
                            label={canWrite ? '' : t('alerts.actions.resolveDenied')}
                            disabled={canWrite}
                            withArrow
                        >
                            <Button
                                size="xs"
                                color="green"
                                leftSection={<IconCircleCheck size={13} />}
                                onClick={onResolve}
                                disabled={!canWrite}
                            >
                                {t('alerts.table.resolve')}
                            </Button>
                        </Tooltip>
                    )}
                    {alert.level === 'EXCEEDED' && (
                        <Tooltip
                            label={canPcr ? '' : t('alerts.actions.openCaseDenied')}
                            disabled={canPcr}
                            withArrow
                        >
                            <Button
                                size="xs"
                                color="red"
                                variant="light"
                                leftSection={<IconFolderOpen size={13} />}
                                onClick={onOpenCase}
                                disabled={!canPcr}
                            >
                                {t('alerts.table.openCase')}
                            </Button>
                        </Tooltip>
                    )}
                    <Button variant="default" size="xs" onClick={onClose}>
                        {t('alerts.modal.close')}
                    </Button>
                </Group>
            </Group>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants utilitaires de mise en page (modal)
// ─────────────────────────────────────────────────────────────────────────────

function Section({
    title,
    icon,
    children,
}: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1.5 inline-flex items-center gap-1.5">
                {icon}
                {title}
            </h3>
            {children}
        </div>
    );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">{children}</div>;
}

function InfoRow({
    label,
    value,
    valueClass,
}: {
    label: string;
    value: React.ReactNode;
    valueClass?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-2 text-[12px] py-0.5 border-b border-slate-100 last:border-b-0">
            <span className="text-slate-500">{label}</span>
            <span className={`text-slate-800 ${valueClass ?? ''}`}>{value}</span>
        </div>
    );
}

export default ExposureAlertsPage;
