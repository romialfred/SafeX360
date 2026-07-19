import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconUsers,
    IconChevronRight,
    IconSearch,
    IconDownload,
    IconPlus,
    IconEye,
    IconPencil,
    IconCircleCheck,
    IconAlertCircle,
    IconAlertTriangle,
    IconAlertOctagon,
    IconInfoCircle,
    IconShieldCheck,
    IconStethoscope,
    IconFilter,
    IconLockAccess,
} from '@tabler/icons-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppSelector } from '../../slices/hooks';
import {
    searchWorkers,
    exportWorkersCsv,
    type DoseCategory,
    type DoseSpecialStatus,
    type ExposureLevel,
} from '../../services/DosimetryService';

/**
 * ExposedWorkersRegistryPage — Module Dosimetrie & Expositions (Phase 2).
 *
 * Registre nominatif des travailleurs exposes (categorie A / B) — pattern
 * SafeX 360 premium aligne sur DosimetryParametersPage / EmergencyDashboardPage
 * / NonConformityDashboard.
 *
 * UX :
 *  - Breadcrumb SafeX 360 > Dosimetrie & Expositions > Registre
 *  - Hero card gradient violet/indigo + 4 KPI inline (Total, A/B, ROUGE, alertes)
 *  - Toolbar : recherche live + filtres (categorie, niveau, departement, statut special)
 *  - DataTable PrimeReact : 12 colonnes, tri, pagination, rowClick navigation
 *  - Bandes vert/jaune/orange/rouge doublees libelle + icone (a11y WCAG)
 *  - Empty state premium si aucun travailleur (icone + CTA)
 *  - Footer ISO/AIEA : conformite RGPD art.30 + AIEA GSR Part 3 §3.106
 *
 * RBAC UI :
 *  - Export CSV visible si DOSIMETRY_READ_NOMINATIVE
 *  - Ajout travailleur visible si DOSIMETRY_WRITE
 *  - L'enforcement reel reste cote backend (Spring @PreAuthorize).
 *
 * Source de donnees : POST /hns/dosimetry/exposed-worker/search avec body filters
 * (cf. ExposedWorkerController.search → SearchFiltersDTO).
 */

// ─────────────────────────────────────────────────────────────────────────────
//  Types locaux — projection d'affichage du registre
// ─────────────────────────────────────────────────────────────────────────────

/** Bande d'exposition affichee (verrouillee sur 4 niveaux a11y). */
type ExposureBand = 'green' | 'yellow' | 'orange' | 'red';

/**
 * RegistryRow — projection d'affichage d'une ligne du registre, derivee du
 * {@code ExposedWorkerListItemDTO} backend.
 */
interface RegistryRow {
    id: number;
    matricule: string;
    name: string;
    position: string;
    department: string;
    category: DoseCategory;
    latestHp10: number | null;
    annualHp10: number | null;
    rolling5yHp10: number | null;
    band: ExposureBand;
    medicalStatus: 'OK' | 'DUE' | 'OVERDUE' | 'UNKNOWN';
    habilitation: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'NONE';
    specialStatus: string | null;
    activeAlerts: number;
}

interface FiltersState {
    query: string;
    category: 'A' | 'B' | 'all';
    band: ExposureBand | 'all';
    department: string;
    specialStatus: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Configuration des bandes d'exposition (couleur + libelle + icone)
//  Triplet a11y obligatoire : aucune information transmise par la couleur seule.
// ─────────────────────────────────────────────────────────────────────────────

const BAND_CONFIG: Record<
    ExposureBand,
    {
        bg: string;
        border: string;
        text: string;
        dot: string;
        labelKey: string;
        icon: typeof IconCircleCheck;
        pulse: boolean;
    }
> = {
    green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        dot: 'bg-green-500',
        labelKey: 'registry.bands.green',
        icon: IconCircleCheck,
        pulse: false,
    },
    yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        dot: 'bg-yellow-500',
        labelKey: 'registry.bands.yellow',
        icon: IconAlertCircle,
        pulse: false,
    },
    orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
        labelKey: 'registry.bands.orange',
        icon: IconAlertTriangle,
        pulse: false,
    },
    red: {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-800',
        dot: 'bg-red-600',
        labelKey: 'registry.bands.red',
        icon: IconAlertOctagon,
        pulse: true,
    },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatMsv = (v: number | null): string => {
    if (v == null || Number.isNaN(v)) return '—';
    return v.toFixed(2);
};

/**
 * Mappe le niveau backend ExposureLevel (GREEN|YELLOW|ORANGE|RED) vers la bande UI
 * (green|yellow|orange|red). Fallback "green" si le backend n'a pas pu calculer
 * (limite reglementaire non definie pour la categorie).
 */
const mapExposureLevelToBand = (level: string | null | undefined): ExposureBand => {
    if (!level) return 'green';
    const lower = level.toLowerCase();
    if (lower === 'red' || lower === 'orange' || lower === 'yellow' || lower === 'green') {
        return lower;
    }
    return 'green';
};

/** Resume du statut medical backend vers etiquette UI. */
const mapMedicalStatus = (status: string | null | undefined): RegistryRow['medicalStatus'] => {
    switch (status) {
        case 'FIT':
        case 'OK':
            return 'OK';
        case 'FIT_WITH_RESTRICTIONS':
        case 'DUE':
        case 'DUE_SOON':
            return 'DUE';
        case 'UNFIT':
        case 'OVERDUE':
            return 'OVERDUE';
        default:
            return 'UNKNOWN';
    }
};

/** Resume du statut qualification backend vers etiquette UI. */
const mapHabilitation = (status: string | null | undefined): RegistryRow['habilitation'] => {
    switch (status) {
        case 'VALID':
            return 'VALID';
        case 'EXPIRING':
            return 'EXPIRING';
        case 'EXPIRED':
        case 'REVOKED':
            return 'EXPIRED';
        default:
            return 'NONE';
    }
};

/**
 * Mappe un ExposedWorkerListItemDTO (backend) vers une ligne d'affichage.
 */
const mapDtoToRow = (dto: any): RegistryRow => {
    const annualHp10 = dto.annualHp10 ?? null;
    return {
        id: dto.id ?? 0,
        matricule: dto.matricule ?? `#${dto.employeeId ?? ''}`,
        name: dto.fullName ?? `Employe #${dto.employeeId ?? ''}`,
        position: dto.position ?? '—',
        department: dto.department ?? '—',
        category: dto.category,
        latestHp10: dto.lastDoseHp10 ?? null,
        annualHp10,
        rolling5yHp10: dto.rolling5yHp10 ?? null,
        band: mapExposureLevelToBand(dto.exposureLevel),
        medicalStatus: mapMedicalStatus(dto.medicalStatus),
        habilitation: mapHabilitation(dto.qualificationStatus),
        specialStatus: dto.specialStatus ?? null,
        activeAlerts: 0,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper — verifie une permission DOSIMETRY_* dans le profil JWT.
//  Tolerant : accepte permissions[], authorities[], roles[] ou role unique.
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
    if (!user) return false;
    // ADMIN passe-droit
    if (['ADMINISTRATOR', 'SYSTEM_ADMINISTRATOR', 'ADMIN', 'SUPER_ADMIN'].includes(String(user.role ?? '').toUpperCase())) return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) candidates.push(...user.authorities.map((a: any) => a?.authority ?? a));
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const ExposedWorkersRegistryPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const user = useAppSelector((state: any) => state.user);
    // Mine active = selecteur global du header (CompanySelector / store).
    const selectedCompanyId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const canExportNominative = hasDosimetryPermission(user, 'DOSIMETRY_READ_NOMINATIVE');
    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');

    const [rows, setRows] = useState<RegistryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FiltersState>({
        query: '',
        category: 'all',
        band: 'all',
        department: 'all',
        specialStatus: 'all',
    });

    // mineId requis par le backend (POST /search body.mineId). On consomme en priorite
    // le selecteur global du header (store companySelection), puis on retombe sur le user.
    const mineId: number = selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1;

    // ───── Chargement initial via POST /search ─────
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        // Filtres serveur : on passe uniquement les criteres non-"all" pour decharger
        // le backend ; le filtrage textuel reste cote client (reactif sur la frappe).
        const serverFilters = {
            mineId,
            category: filters.category !== 'all' ? (filters.category as DoseCategory) : null,
            specialStatus:
                filters.specialStatus !== 'all'
                    ? (filters.specialStatus as DoseSpecialStatus)
                    : null,
            exposureLevel:
                filters.band !== 'all'
                    ? (filters.band.toUpperCase() as ExposureLevel)
                    : null,
        };
        searchWorkers(serverFilters)
            .then((data: any) => {
                if (cancelled) return;
                const list: any[] = Array.isArray(data) ? data : (data?.content ?? []);
                setRows(list.map(mapDtoToRow));
                setLoadError(null);
            })
            .catch(() => {
                if (cancelled) return;
                setRows([]);
                setLoadError(t('registry.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [t, mineId, filters.category, filters.specialStatus, filters.band]);

    // ───── Liste des departements et statuts speciaux uniques pour les filtres ─────
    const departments = useMemo(() => {
        const set = new Set<string>();
        rows.forEach((r) => {
            if (r.department && r.department !== '—') set.add(r.department);
        });
        return Array.from(set).sort();
    }, [rows]);

    const specialStatuses = useMemo(() => {
        const set = new Set<string>();
        rows.forEach((r) => {
            if (r.specialStatus) set.add(r.specialStatus);
        });
        return Array.from(set).sort();
    }, [rows]);

    // ───── Filtrage cote client (texte + departement) ─────
    const filteredRows = useMemo(() => {
        const q = filters.query.trim().toLowerCase();
        return rows.filter((r) => {
            if (q) {
                const hay = `${r.matricule} ${r.name}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (filters.department !== 'all' && r.department !== filters.department) return false;
            return true;
        });
    }, [rows, filters]);

    // ───── KPI tiles ─────
    const kpi = useMemo(() => {
        const total = rows.length;
        const catA = rows.filter((r) => r.category === 'A').length;
        const catB = rows.filter((r) => r.category === 'B').length;
        const redCount = rows.filter((r) => r.band === 'red').length;
        const activeAlerts = rows.reduce((sum, r) => sum + (r.activeAlerts ?? 0), 0);
        return { total, catA, catB, redCount, activeAlerts };
    }, [rows]);

    // ───── Export CSV (RBAC nominatif) ─────
    // P1.3 RGPD : l'export est delegue au backend (GET /exposed-worker/export)
    // qui journalise l'extraction dans DosimetryAuditLog. Toute generation cote
    // client (Blob + join CSV) contournerait cet audit obligatoire.
    const [exporting, setExporting] = useState(false);
    const handleExportCsv = async () => {
        if (!canExportNominative || exporting) return;
        setExporting(true);
        try {
            const blob = await exportWorkersCsv(mineId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const stamp = new Date().toISOString().slice(0, 10);
            a.download = `dosimetry-workers-${stamp}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            setLoadError(t('registry.exportError', { defaultValue: t('registry.loadError') }));
        } finally {
            setExporting(false);
        }
    };

    // ───── Templates colonnes ─────
    const renderCategoryBadge = (row: RegistryRow) => {
        const isA = row.category === 'A';
        return (
            <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold border ${
                    isA
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
                aria-label={t('registry.categoryAria', { category: row.category })}
            >
                {row.category}
            </span>
        );
    };

    const renderBand = (row: RegistryRow) => {
        const cfg = BAND_CONFIG[row.band];
        const Icon = cfg.icon;
        return (
            <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.border} ${cfg.text} text-[10.5px] font-medium ${
                    cfg.pulse ? 'animate-[pulse_2.4s_ease-in-out_infinite]' : ''
                }`}
                aria-label={t(cfg.labelKey)}
            >
                <Icon size={11} stroke={2} />
                {t(cfg.labelKey)}
            </span>
        );
    };

    const renderMedical = (row: RegistryRow) => {
        const map: Record<RegistryRow['medicalStatus'], { color: string; key: string }> = {
            OK: { color: 'text-green-700 bg-green-50 border-green-200', key: 'registry.medical.ok' },
            DUE: { color: 'text-yellow-700 bg-yellow-50 border-yellow-200', key: 'registry.medical.due' },
            OVERDUE: { color: 'text-red-700 bg-red-50 border-red-200', key: 'registry.medical.overdue' },
            UNKNOWN: { color: 'text-slate-600 bg-slate-50 border-slate-200', key: 'registry.medical.unknown' },
        };
        const cfg = map[row.medicalStatus];
        return (
            <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${cfg.color}`}
            >
                <IconStethoscope size={10} stroke={2} />
                {t(cfg.key)}
            </span>
        );
    };

    const renderHabilitation = (row: RegistryRow) => {
        const map: Record<RegistryRow['habilitation'], { color: string; key: string }> = {
            VALID: { color: 'text-green-700 bg-green-50 border-green-200', key: 'registry.habilitation.valid' },
            EXPIRING: { color: 'text-orange-700 bg-orange-50 border-orange-200', key: 'registry.habilitation.expiring' },
            EXPIRED: { color: 'text-red-700 bg-red-50 border-red-200', key: 'registry.habilitation.expired' },
            NONE: { color: 'text-slate-600 bg-slate-50 border-slate-200', key: 'registry.habilitation.none' },
        };
        const cfg = map[row.habilitation];
        return (
            <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${cfg.color}`}
            >
                <IconShieldCheck size={10} stroke={2} />
                {t(cfg.key)}
            </span>
        );
    };

    const renderNumeric = (value: number | null) => (
        <span className="font-mono text-[12px] text-slate-700 tabular-nums">
            {formatMsv(value)}
            {value != null && <span className="text-slate-400 text-[10px] ml-0.5">mSv</span>}
        </span>
    );

    const renderActions = (row: RegistryRow) => (
        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => navigate(`/dosimetry/workers/detail/${row.id}`)}
                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title={t('registry.actions.view')}
                aria-label={t('registry.actions.view')}
            >
                <IconEye size={13} stroke={1.8} />
            </button>
            {canWrite && (
                <button
                    type="button"
                    onClick={() => navigate(`/dosimetry/workers/edit/${row.id}`)}
                    className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    title={t('registry.actions.edit')}
                    aria-label={t('registry.actions.edit')}
                >
                    <IconPencil size={13} stroke={1.8} />
                </button>
            )}
        </div>
    );

    /**
     * Empty state premium : icone gradient + titre + sous-titre + CTA "Ajouter un travailleur"
     * (visible uniquement si DOSIMETRY_WRITE). S'affiche quand le backend renvoie une liste
     * vide pour la mine courante (filtres serveur appliques).
     */
    const emptyTemplate = (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center mb-4 shadow-sm">
                <IconUsers size={28} className="text-indigo-500" stroke={1.6} />
            </div>
            <p className="text-[14px] text-slate-800 font-semibold mb-1">
                {t('registry.empty.title')}
            </p>
            <p className="text-[12.5px] text-slate-500 max-w-md mb-4 leading-relaxed">
                {t('registry.empty.subtitle')}
            </p>
            {canWrite && (
                <button
                    type="button"
                    onClick={() => navigate('/dosimetry/workers/new')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm font-medium"
                >
                    <IconPlus size={14} stroke={2} />
                    {t('registry.empty.cta')}
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">

                {/* ─── Breadcrumb premium ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbParent')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('registry.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        {/* Accent gradient discret */}
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconUsers size={22} stroke={1.8} className="text-white" />
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
                                    {t('registry.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('registry.subtitle')}
                                </p>
                            </div>
                        </div>

                        {/* KPI tiles inline */}
                        <div className="flex flex-wrap items-stretch gap-2">
                            <HeroKpi
                                label={t('registry.kpi.total')}
                                value={kpi.total}
                                accent="indigo"
                                icon={<IconUsers size={13} stroke={1.8} />}
                            />
                            <HeroKpi
                                label={t('registry.kpi.categories')}
                                value={`${kpi.catA} / ${kpi.catB}`}
                                sub={t('registry.kpi.categoriesSub')}
                                accent="violet"
                            />
                            <HeroKpi
                                label={t('registry.kpi.redLevel')}
                                value={kpi.redCount}
                                accent="red"
                                icon={<IconAlertOctagon size={13} stroke={1.8} />}
                                pulse={kpi.redCount > 0}
                            />
                            <HeroKpi
                                label={t('registry.kpi.activeAlerts')}
                                value={kpi.activeAlerts}
                                accent="orange"
                                icon={<IconAlertTriangle size={13} stroke={1.8} />}
                            />
                        </div>
                    </div>
                </div>

                {/* ─── Banner erreur ─── */}
                {loadError && (
                    <div
                        className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]"
                        role="alert"
                    >
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Toolbar ─── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Recherche */}
                        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
                            <IconSearch
                                size={13}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                stroke={1.8}
                            />
                            <input
                                type="search"
                                value={filters.query}
                                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                                placeholder={t('registry.toolbar.searchPlaceholder')}
                                aria-label={t('registry.toolbar.searchAria')}
                                className="w-full pl-8 pr-3 py-1.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            />
                        </div>

                        {/* Filtre categorie */}
                        <FilterSelect
                            ariaLabel={t('registry.toolbar.filterCategory')}
                            value={filters.category}
                            onChange={(v) => setFilters((f) => ({ ...f, category: v as FiltersState['category'] }))}
                            options={[
                                { value: 'all', label: t('registry.toolbar.allCategories') },
                                { value: 'A', label: t('registry.toolbar.categoryA') },
                                { value: 'B', label: t('registry.toolbar.categoryB') },
                            ]}
                        />

                        {/* Filtre niveau */}
                        <FilterSelect
                            ariaLabel={t('registry.toolbar.filterBand')}
                            value={filters.band}
                            onChange={(v) => setFilters((f) => ({ ...f, band: v as FiltersState['band'] }))}
                            options={[
                                { value: 'all', label: t('registry.toolbar.allLevels') },
                                { value: 'green', label: t('registry.bands.green') },
                                { value: 'yellow', label: t('registry.bands.yellow') },
                                { value: 'orange', label: t('registry.bands.orange') },
                                { value: 'red', label: t('registry.bands.red') },
                            ]}
                        />

                        {/* Filtre departement */}
                        <FilterSelect
                            ariaLabel={t('registry.toolbar.filterDepartment')}
                            value={filters.department}
                            onChange={(v) => setFilters((f) => ({ ...f, department: v }))}
                            options={[
                                { value: 'all', label: t('registry.toolbar.allDepartments') },
                                ...departments.map((d) => ({ value: d, label: d })),
                            ]}
                        />

                        {/* Filtre statut special */}
                        <FilterSelect
                            ariaLabel={t('registry.toolbar.filterSpecialStatus')}
                            value={filters.specialStatus}
                            onChange={(v) => setFilters((f) => ({ ...f, specialStatus: v }))}
                            options={[
                                { value: 'all', label: t('registry.toolbar.allStatuses') },
                                ...specialStatuses.map((s) => ({
                                    value: s,
                                    label: t(`registry.specialStatus.${s}`, { defaultValue: s }),
                                })),
                            ]}
                        />

                        <div className="ml-auto flex items-center gap-2">
                            {/* Export CSV — backend-side (audit RGPD) */}
                            <button
                                type="button"
                                onClick={handleExportCsv}
                                disabled={!canExportNominative || exporting}
                                title={
                                    canExportNominative
                                        ? t('registry.toolbar.exportCsv')
                                        : t('registry.toolbar.exportCsvDenied')
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exporting ? (
                                    <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                ) : canExportNominative ? (
                                    <IconDownload size={13} stroke={1.8} />
                                ) : (
                                    <IconLockAccess size={13} stroke={1.8} />
                                )}
                                {t('registry.toolbar.exportCsv')}
                            </button>

                            {/* Ajouter travailleur */}
                            {canWrite && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/dosimetry/workers/new')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                                >
                                    <IconPlus size={13} stroke={2} />
                                    {t('registry.toolbar.addWorker')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Indicateur de filtres actifs */}
                    {(filters.query ||
                        filters.category !== 'all' ||
                        filters.band !== 'all' ||
                        filters.department !== 'all' ||
                        filters.specialStatus !== 'all') && (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                            <IconFilter size={11} stroke={1.8} />
                            <span>
                                {t('registry.toolbar.activeFilters', {
                                    count: filteredRows.length,
                                    total: rows.length,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setFilters({ query: '', category: 'all', band: 'all', department: 'all', specialStatus: 'all' })
                                }
                                className="ml-1 underline hover:text-indigo-600"
                            >
                                {t('registry.toolbar.clearFilters')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── DataTable ─── */}
                <div className="safex-dosimetry-table bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="px-4 py-12 text-center text-slate-500 text-[13px]">
                            <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                            {t('registry.loading')}
                        </div>
                    ) : (
                        <DataTable
                            value={filteredRows}
                            dataKey="id"
                            size="small"
                            stripedRows
                            paginator
                            rows={15}
                            rowsPerPageOptions={[10, 15, 25, 50]}
                            rowHover
                            responsiveLayout="scroll"
                            emptyMessage={emptyTemplate}
                            onRowClick={(e) => navigate(`/dosimetry/workers/detail/${(e.data as RegistryRow).id}`)}
                            rowClassName={() => 'cursor-pointer'}
                            className="text-[12.5px]"
                        >
                            <Column
                                field="matricule"
                                header={t('registry.columns.matricule')}
                                sortable
                                style={{ minWidth: 110 }}
                                body={(row: RegistryRow) => (
                                    <span className="font-mono text-[12px] text-slate-800 font-medium">{row.matricule}</span>
                                )}
                            />
                            <Column
                                field="name"
                                header={t('registry.columns.name')}
                                sortable
                                style={{ minWidth: 180 }}
                                body={(row: RegistryRow) => (
                                    <span className="text-slate-800 font-medium">{row.name}</span>
                                )}
                            />
                            <Column
                                field="position"
                                header={t('registry.columns.position')}
                                sortable
                                style={{ minWidth: 160 }}
                            />
                            <Column
                                field="department"
                                header={t('registry.columns.department')}
                                sortable
                                style={{ minWidth: 150 }}
                            />
                            <Column
                                field="category"
                                header={t('registry.columns.category')}
                                sortable
                                style={{ width: 90 }}
                                body={renderCategoryBadge}
                            />
                            <Column
                                field="latestHp10"
                                header={t('registry.columns.latestDose')}
                                sortable
                                style={{ width: 110 }}
                                body={(row: RegistryRow) => renderNumeric(row.latestHp10)}
                                align="right"
                            />
                            <Column
                                field="annualHp10"
                                header={t('registry.columns.annualHp10')}
                                sortable
                                style={{ width: 120 }}
                                body={(row: RegistryRow) => renderNumeric(row.annualHp10)}
                                align="right"
                            />
                            <Column
                                field="rolling5yHp10"
                                header={t('registry.columns.rolling5y')}
                                sortable
                                style={{ width: 130 }}
                                body={(row: RegistryRow) => renderNumeric(row.rolling5yHp10)}
                                align="right"
                            />
                            <Column
                                field="band"
                                header={t('registry.columns.band')}
                                sortable
                                style={{ minWidth: 130 }}
                                body={renderBand}
                            />
                            <Column
                                field="medicalStatus"
                                header={t('registry.columns.medical')}
                                sortable
                                style={{ minWidth: 130 }}
                                body={renderMedical}
                            />
                            <Column
                                field="habilitation"
                                header={t('registry.columns.habilitation')}
                                sortable
                                style={{ minWidth: 130 }}
                                body={renderHabilitation}
                            />
                            <Column
                                header={t('registry.columns.actions')}
                                style={{ width: 90 }}
                                body={renderActions}
                                align="right"
                            />
                        </DataTable>
                    )}
                </div>

                {/* ─── Footer ISO/AIEA ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconInfoCircle size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">
                            {t('registry.footer.titleIso')}
                        </p>
                        <p>{t('registry.footer.note')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

const KPI_ACCENT: Record<string, { bg: string; text: string; ring: string; iconBg: string }> = {
    indigo: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', ring: 'border-indigo-200', iconBg: 'bg-white border-indigo-200 text-indigo-700' },
    violet: { bg: 'bg-violet-50/70', text: 'text-violet-700', ring: 'border-violet-200', iconBg: 'bg-white border-violet-200 text-violet-700' },
    red:    { bg: 'bg-red-50/70',    text: 'text-red-700',    ring: 'border-red-200',    iconBg: 'bg-white border-red-200 text-red-700' },
    orange: { bg: 'bg-orange-50/70', text: 'text-orange-700', ring: 'border-orange-200', iconBg: 'bg-white border-orange-200 text-orange-700' },
};

function HeroKpi({
    label, value, sub, accent, icon, pulse,
}: {
    label: string;
    value: number | string;
    sub?: string;
    accent: keyof typeof KPI_ACCENT;
    icon?: React.ReactNode;
    pulse?: boolean;
}) {
    const tone = KPI_ACCENT[accent];
    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${tone.bg} ${tone.ring} ${
                pulse ? 'animate-[pulse_2.4s_ease-in-out_infinite]' : ''
            }`}
        >
            {icon && (
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${tone.iconBg}`}>
                    {icon}
                </div>
            )}
            <div>
                <p className={`text-[10px] uppercase tracking-[0.14em] ${tone.text} leading-none font-semibold`}>
                    {label}
                </p>
                <p className="text-[15px] text-slate-800 font-mono font-bold leading-tight mt-0.5">
                    {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                </p>
                {sub && <p className="text-[10px] text-slate-500 leading-none">{sub}</p>}
            </div>
        </div>
    );
}

function FilterSelect({
    ariaLabel, value, onChange, options,
}: {
    ariaLabel: string;
    value: string;
    onChange: (next: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            aria-label={ariaLabel}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-2 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

export default ExposedWorkersRegistryPage;
