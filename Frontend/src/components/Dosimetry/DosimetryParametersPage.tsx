import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    IconAtom2,
    IconChevronRight,
    IconShieldLock,
    IconRefresh,
    IconPlus,
    IconPencil,
    IconTrash,
    IconCircleCheck,
    IconAlertOctagon,
    IconInfoCircle,
} from '@tabler/icons-react';
import SegmentedFilter, { SegmentedFilterOption } from '../UtilityComp/SegmentedFilter';
import {
    getAllThresholds,
    type ThresholdDTO,
} from '../../services/DosimetryService';

/**
 * DosimetryParametersPage — Module Dosimetrie & Expositions.
 *
 * Page de configuration premium pour les limites reglementaires, les bandes
 * d'exposition et la matrice RBAC du module.
 *
 * UX :
 *  - Breadcrumb : SafeX 360 > Dosimetrie & Expositions > Parametres
 *  - Hero card : icone IconAtom2 gradient indigo + KPI "X seuils actifs"
 *  - 3 onglets : Limites & seuils / Bandes d'exposition / Politique RBAC
 *  - Footer note ISO/AIEA : conformite CIPR 103 + AIEA GSR Part 3
 *
 * Le rendu est volontairement defensif : si l'endpoint backend n'est pas encore
 * disponible (HTTP 404 / 500), la page bascule sur un jeu de demonstration
 * conforme aux valeurs de reference CIPR pour eviter un ecran vide.
 */

/**
 * Alias local sur le DTO backend. On reutilise strictement les noms de champs
 * Java (grandeur, personCategory, referenceFramework) pour eviter les
 * divergences silencieuses entre le payload API et l'affichage.
 */
type Threshold = ThresholdDTO;

// Valeurs de reference CIPR 103 / AIEA GSR Part 3 (mSv/an) — fallback demo
// quand le backend ne renvoie aucun seuil. Les noms de champs sont alignes
// 1:1 sur ThresholdDTO (grandeur=HP10|HP007|HP3, personCategory, referenceFramework).
//
// SOURCE DE VERITE : Backend/Health-Safety/src/main/resources/db/migration/
//                    V005__dosimetry_seed_cipr_aiea.sql
//
// Ce fallback DOIT rester strictement synchronise avec V005 — toute divergence
// est un finding P1 de conformite reglementaire (CIPR 103 / AIEA GSR Part 3).
// Si V005 change, mettre a jour ce tableau ET vice-versa.
const CIPR_REFERENCE: Threshold[] = [
    // ── WORKER_A (categorie A — travailleurs exposes) ──
    {
        id: -1,
        grandeur: 'HP10',
        personCategory: 'WORKER_A',
        doseConstraint: 15,
        investigationLevel: 18,
        actionLevel: 20,
        regulatoryLimit: 50,
        unit: 'mSv',
        referenceFramework: 'CIPR_103',
        active: true,
    },
    {
        id: -2,
        grandeur: 'HP007',
        personCategory: 'WORKER_A',
        doseConstraint: 400,
        investigationLevel: 450,
        actionLevel: 500,
        regulatoryLimit: 500,
        unit: 'mSv',
        referenceFramework: 'CIPR_103',
        active: true,
    },
    {
        id: -3,
        grandeur: 'HP3',
        personCategory: 'WORKER_A',
        doseConstraint: 15,
        investigationLevel: 18,
        actionLevel: 20,
        regulatoryLimit: 50,
        unit: 'mSv',
        referenceFramework: 'CIPR_103',
        active: true,
    },
    // ── WORKER_B (categorie B — faiblement expose) ──
    {
        id: -4,
        grandeur: 'HP10',
        personCategory: 'WORKER_B',
        doseConstraint: null,
        investigationLevel: null,
        actionLevel: null,
        regulatoryLimit: 6,
        unit: 'mSv',
        referenceFramework: 'AIEA_GSR_PART3',
        active: true,
    },
    // ── APPRENTICE (16-18 ans) ──
    {
        id: -5,
        grandeur: 'HP10',
        personCategory: 'APPRENTICE',
        doseConstraint: null,
        investigationLevel: null,
        actionLevel: null,
        regulatoryLimit: 6,
        unit: 'mSv',
        referenceFramework: 'CIPR_103',
        active: true,
    },
    // ── PREGNANCY (declaration grossesse — protection foetus) ──
    {
        id: -6,
        grandeur: 'HP10',
        personCategory: 'PREGNANCY',
        doseConstraint: null,
        investigationLevel: null,
        actionLevel: null,
        regulatoryLimit: 1,
        unit: 'mSv',
        referenceFramework: 'CIPR_103',
        active: true,
    },
    // ── PUBLIC ──
    {
        id: -7,
        grandeur: 'HP10',
        personCategory: 'PUBLIC',
        doseConstraint: null,
        investigationLevel: null,
        actionLevel: null,
        regulatoryLimit: 1,
        unit: 'mSv',
        referenceFramework: 'AIEA_GSR_PART3',
        active: true,
    },
];

interface BandConfig {
    id: 'green' | 'yellow' | 'orange' | 'red';
    labelKey: string;
    thresholdPct: number;
    colorHex: string;
}

const DEFAULT_BANDS: BandConfig[] = [
    { id: 'green', labelKey: 'bands.green', thresholdPct: 30, colorHex: '#10b981' },
    { id: 'yellow', labelKey: 'bands.yellow', thresholdPct: 60, colorHex: '#facc15' },
    { id: 'orange', labelKey: 'bands.orange', thresholdPct: 80, colorHex: '#f97316' },
    { id: 'red', labelKey: 'bands.red', thresholdPct: 100, colorHex: '#ef4444' },
];

const RBAC_MATRIX = [
    {
        key: 'DOSIMETRY_VIEW',
        roles: ['HSE_VIEWER', 'HSE_OFFICER', 'MEDICAL_DOCTOR', 'ADMIN'],
    },
    {
        key: 'DOSIMETRY_RECORD',
        roles: ['HSE_OFFICER', 'RADIO_PROTECTION_OFFICER', 'ADMIN'],
    },
    {
        key: 'DOSIMETRY_VALIDATE',
        roles: ['RADIO_PROTECTION_OFFICER', 'ADMIN'],
    },
    {
        key: 'DOSIMETRY_MEDICAL',
        roles: ['MEDICAL_DOCTOR', 'ADMIN'],
    },
    {
        key: 'DOSIMETRY_ALERT',
        roles: ['RADIO_PROTECTION_OFFICER', 'HSE_MANAGER', 'ADMIN'],
    },
    {
        key: 'DOSIMETRY_ADMIN',
        roles: ['ADMIN'],
    },
];

const DosimetryParametersPage = () => {
    const { t } = useTranslation('dosimetry');
    const [activeTab, setActiveTab] = useState<'thresholds' | 'bands' | 'rbac'>('thresholds');
    const [thresholds, setThresholds] = useState<Threshold[]>([]);
    const [bands, setBands] = useState<BandConfig[]>(DEFAULT_BANDS);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [resetNotice, setResetNotice] = useState<string | null>(null);

    // ───── Fetch des seuils au montage ─────
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getAllThresholds()
            .then((data: any) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : (data?.content ?? []);
                if (list.length > 0) {
                    setThresholds(list as Threshold[]);
                } else {
                    setThresholds(CIPR_REFERENCE);
                }
                setLoadError(null);
            })
            .catch(() => {
                if (cancelled) return;
                // Fallback gracieux : afficher les valeurs CIPR de reference
                setThresholds(CIPR_REFERENCE);
                setLoadError(t('parameters.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [t]);

    /**
     * Reinitialisation CIPR/AIEA.
     *
     * Phase 1 : pas d'endpoint backend (POST /threshold/reset-reference
     * n'existe pas encore). On previent l'utilisateur via une banniere UI
     * non bloquante plutot que de masquer un 404. La fonctionnalite sera
     * cablee en Phase 2 (re-seed depuis V005 + audit log).
     */
    const handleReset = () => {
        setResetNotice(t('parameters.resetNotAvailable'));
        // Auto-dismiss apres 6s pour ne pas figer la banniere
        window.setTimeout(() => setResetNotice(null), 6000);
    };

    const tabOptions: SegmentedFilterOption[] = useMemo(
        () => [
            { value: 'thresholds', label: t('parameters.thresholdsTab'), count: thresholds.length, color: 'indigo' },
            { value: 'bands', label: t('parameters.bandsTab'), color: 'indigo' },
            { value: 'rbac', label: t('parameters.rbacTab'), color: 'indigo' },
        ],
        [t, thresholds.length],
    );

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1500px] mx-auto">

                {/* ─── Breadcrumb premium ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">{t('parameters.breadcrumbRoot')}</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">{t('parameters.breadcrumbParent')}</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">{t('parameters.breadcrumbCurrent')}</span>
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
                                <IconAtom2 size={22} stroke={1.8} className="text-white" />
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
                                    {t('parameters.title')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('parameters.subtitle')}
                                </p>
                            </div>
                        </div>

                        {/* KPI tile */}
                        <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                            <div className="w-10 h-10 rounded-lg bg-white border border-indigo-100 flex items-center justify-center">
                                <span className="text-[15px] font-mono font-bold text-indigo-700">
                                    {thresholds.length}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.14em] text-indigo-600 leading-none font-medium">
                                    {t('parameters.kpiActiveThresholdsLabel')}
                                </p>
                                <p className="text-[12px] text-slate-700 mt-0.5 leading-none">
                                    {t('parameters.kpiActiveThresholds')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Erreur de chargement (banner discret) ─── */}
                {loadError && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Notice "fonction Phase 2" (reset CIPR/AIEA non cablee) ─── */}
                {resetNotice && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[12.5px]">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{resetNotice}</span>
                    </div>
                )}

                {/* ─── Tabs ─── */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4 shadow-sm">
                    <SegmentedFilter
                        value={activeTab}
                        onChange={(v) => setActiveTab(v as typeof activeTab)}
                        options={tabOptions}
                        size="md"
                    />
                </div>

                {/* ─── Contenu de l'onglet actif ─── */}
                {activeTab === 'thresholds' && (
                    <ThresholdsTab
                        thresholds={thresholds}
                        loading={loading}
                        onReset={handleReset}
                    />
                )}

                {activeTab === 'bands' && (
                    <BandsTab bands={bands} onChange={setBands} />
                )}

                {activeTab === 'rbac' && <RbacTab />}

                {/* ─── Footer note ISO / AIEA ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconInfoCircle size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">
                            ICRP 103 / IAEA GSR Part 3
                        </p>
                        <p>{t('parameters.footerNote')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 1 — Limites & seuils
// ─────────────────────────────────────────────────────────────────────────────

interface ThresholdsTabProps {
    thresholds: Threshold[];
    loading: boolean;
    onReset: () => void;
}

function ThresholdsTab({ thresholds, loading, onReset }: ThresholdsTabProps) {
    const { t } = useTranslation('dosimetry');

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50/60">
                <h2
                    className="text-slate-900"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '15px',
                        letterSpacing: '-0.012em',
                    }}
                >
                    {t('parameters.thresholdsTab')}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onReset}
                        title={t('parameters.resetCiprAieaTooltip', { defaultValue: 'Disponible en Phase 2' })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                    >
                        <IconRefresh size={13} stroke={1.8} />
                        {t('parameters.resetCiprAiea')}
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    >
                        <IconPlus size={13} stroke={2} />
                        {t('parameters.addThreshold')}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                    <thead>
                        <tr className="bg-slate-50/80 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-500">
                            <th className="px-4 py-2 font-semibold">{t('thresholds.grandeur')}</th>
                            <th className="px-4 py-2 font-semibold">{t('thresholds.category')}</th>
                            <th className="px-4 py-2 font-semibold text-right">{t('thresholds.doseConstraint')}</th>
                            <th className="px-4 py-2 font-semibold text-right">{t('thresholds.investigationLevel')}</th>
                            <th className="px-4 py-2 font-semibold text-right">{t('thresholds.actionLevel')}</th>
                            <th className="px-4 py-2 font-semibold text-right">{t('thresholds.regulatoryLimit')}</th>
                            <th className="px-4 py-2 font-semibold">{t('thresholds.framework')}</th>
                            <th className="px-4 py-2 font-semibold text-right">{t('thresholds.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                                    <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                                    …
                                </td>
                            </tr>
                        ) : thresholds.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                                    {t('thresholds.empty')}
                                </td>
                            </tr>
                        ) : (
                            thresholds.map((th, idx) => (
                                <tr
                                    key={th.id ?? `row-${idx}`}
                                    className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors"
                                >
                                    <td className="px-4 py-2.5 text-slate-800 font-medium">
                                        {t(`thresholds.grandeurs.${th.grandeur}`, { defaultValue: String(th.grandeur) })}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700">
                                            {t(`thresholds.categories.${th.personCategory}`, { defaultValue: String(th.personCategory) })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                                        {th.doseConstraint ?? '—'} <span className="text-slate-400 text-[10px]">{th.unit}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-amber-700">
                                        {th.investigationLevel ?? '—'} <span className="text-slate-400 text-[10px]">{th.unit}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-orange-700">
                                        {th.actionLevel ?? '—'} <span className="text-slate-400 text-[10px]">{th.unit}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-700">
                                        {th.regulatoryLimit ?? '—'} <span className="text-slate-400 text-[10px] font-normal">{th.unit}</span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            {t(`thresholds.frameworks.${th.referenceFramework}`, { defaultValue: String(th.referenceFramework) })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                                title={t('common.edit')}
                                            >
                                                <IconPencil size={13} stroke={1.8} />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                                                title={t('common.delete')}
                                            >
                                                <IconTrash size={13} stroke={1.8} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 2 — Bandes d'exposition
// ─────────────────────────────────────────────────────────────────────────────

interface BandsTabProps {
    bands: BandConfig[];
    onChange: (next: BandConfig[]) => void;
}

function BandsTab({ bands, onChange }: BandsTabProps) {
    const { t } = useTranslation('dosimetry');

    const updateBand = (id: BandConfig['id'], patch: Partial<BandConfig>) => {
        onChange(bands.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cartes de configuration */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
                    <h2
                        className="text-slate-900"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '15px',
                            letterSpacing: '-0.012em',
                        }}
                    >
                        {t('bands.title')}
                    </h2>
                    <p className="text-[12px] text-slate-600 mt-0.5">{t('bands.subtitle')}</p>
                </div>

                <div className="p-4 space-y-3">
                    {bands.map((band) => (
                        <div
                            key={band.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/40"
                        >
                            <div
                                className="w-10 h-10 rounded-md flex-shrink-0 shadow-inner"
                                style={{ background: band.colorHex }}
                                aria-hidden="true"
                            />
                            <div className="flex-1 min-w-0">
                                <label className="block text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-medium mb-0.5">
                                    {t('bands.label')}
                                </label>
                                <p className="text-[13px] text-slate-800 font-medium">
                                    {t(band.labelKey)}
                                </p>
                            </div>
                            <div className="flex-shrink-0 w-28">
                                <label
                                    className="block text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-medium mb-0.5"
                                    htmlFor={`band-${band.id}-pct`}
                                >
                                    {t('bands.thresholdPct')}
                                </label>
                                <div className="relative">
                                    <input
                                        id={`band-${band.id}-pct`}
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={band.thresholdPct}
                                        onChange={(e) =>
                                            updateBand(band.id, { thresholdPct: Number(e.target.value) })
                                        }
                                        className="w-full pl-2 pr-6 py-1.5 text-[12.5px] font-mono bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Preview de la jauge */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
                    <h2
                        className="text-slate-900"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '15px',
                            letterSpacing: '-0.012em',
                        }}
                    >
                        {t('bands.previewTitle')}
                    </h2>
                </div>
                <div className="p-4">
                    <div className="relative h-4 rounded-full overflow-hidden bg-slate-100">
                        {bands.map((band, idx) => {
                            const prev = idx === 0 ? 0 : bands[idx - 1].thresholdPct;
                            const width = Math.max(0, band.thresholdPct - prev);
                            return (
                                <div
                                    key={band.id}
                                    className="absolute top-0 bottom-0"
                                    style={{
                                        left: `${prev}%`,
                                        width: `${width}%`,
                                        background: band.colorHex,
                                    }}
                                    aria-hidden="true"
                                />
                            );
                        })}
                    </div>
                    <div className="mt-3 space-y-1.5">
                        {bands.map((band) => (
                            <div key={band.id} className="flex items-center gap-2 text-[11.5px]">
                                <span
                                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                    style={{ background: band.colorHex }}
                                    aria-hidden="true"
                                />
                                <span className="text-slate-700 flex-1 truncate">
                                    {t(band.labelKey)}
                                </span>
                                <span className="font-mono text-slate-500">≤ {band.thresholdPct}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 3 — Politique RBAC
// ─────────────────────────────────────────────────────────────────────────────

function RbacTab() {
    const { t } = useTranslation('dosimetry');

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60 flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                    <IconShieldLock size={15} stroke={1.8} />
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
                        {t('rbac.title')}
                    </h2>
                    <p className="text-[12px] text-slate-600 mt-0.5">{t('rbac.subtitle')}</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                    <thead>
                        <tr className="bg-slate-50/80 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-500">
                            <th className="px-4 py-2 font-semibold">{t('rbac.permission')}</th>
                            <th className="px-4 py-2 font-semibold">{t('rbac.description')}</th>
                            <th className="px-4 py-2 font-semibold">{t('rbac.roles')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {RBAC_MATRIX.map((row) => (
                            <tr key={row.key} className="border-t border-slate-100">
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                                        <IconCircleCheck size={11} stroke={2.2} />
                                        {row.key}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                    {t(`rbac.permissions.${row.key}`)}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center flex-wrap gap-1">
                                        {row.roles.map((r) => (
                                            <span
                                                key={r}
                                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                            >
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DosimetryParametersPage;
