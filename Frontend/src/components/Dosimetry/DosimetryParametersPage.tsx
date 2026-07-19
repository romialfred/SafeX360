import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    IconAtom2,
    IconChevronRight,
    IconShieldLock,
    IconInfoCircle,
    IconScale,
    IconBuilding,
    IconBook,
    IconFlag,
    IconCircleCheck,
    IconLock,
    IconUsers,
    IconStethoscope,
    IconEdit,
    IconAlertOctagon,
} from '@tabler/icons-react';
import { Modal, Tooltip } from '@mantine/core';
import {
    getAllThresholds,
    type ThresholdDTO,
} from '../../services/DosimetryService';

/**
 * DosimetryParametersPage — refonte UX (LOT Dosimetrie & Expositions).
 *
 * Nouveau plan editorial premium :
 *   1. Referentiel reglementaire — bloc statique avec 3 cards horizontales :
 *      CIPR 103 / AIEA GSR Part 3 / R.4451 (transposition nationale).
 *   2. Limites de doses applicables — tableau lisible par categorie (Cat A/B/
 *      Apprenti/Grossesse/Public) avec valeurs (mSv) + tooltips reglementaires.
 *   3. Bandes d'exposition — visualisation graphique des seuils 50/75/90/100%
 *      en barres colorees + libelles "Niveau de controle / d'investigation /
 *      d'action / Limite reglementaire".
 *   4. Regles d'acces — descriptif texte narratif des 6 niveaux d'autorisation
 *      avec libelles humains. Pas de codes RBAC techniques visibles ici.
 *   5. Lien discret en bas : "Voir la matrice RBAC technique (administrateurs)"
 *      qui ouvre un modal pour la vue admin uniquement.
 *
 * Source de verite des seuils : backend (V005__dosimetry_seed_cipr_aiea.sql).
 * En cas d'echec backend (404/500), fallback gracieux sur les valeurs CIPR
 * statiques codees ci-dessous.
 *
 * RGPD : la matrice RBAC technique est masquee par defaut pour ne pas exposer
 * des codes techniques (DOSIMETRY_VIEW, DOSIMETRY_ADMIN, etc.) a l'utilisateur
 * final. Acces via le lien discret pour les administrateurs uniquement.
 */

type Threshold = ThresholdDTO;

// ─────────────────────────────────────────────────────────────────────────────
//  Constantes : valeurs CIPR / AIEA (fallback)
//  Source : Backend/Health-Safety/src/main/resources/db/migration/
//           V005__dosimetry_seed_cipr_aiea.sql
//  Toute modification ici DOIT etre synchronisee avec V005.
// ─────────────────────────────────────────────────────────────────────────────

const CIPR_REFERENCE: Threshold[] = [
    // ── WORKER_A ──
    {
        id: -1,
        grandeur: 'HP10',
        personCategory: 'WORKER_A',
        doseConstraint: 15,
        investigationLevel: 18,
        actionLevel: 20,
        regulatoryLimit: 20,
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
        regulatoryLimit: 20,
        unit: 'mSv',
        referenceFramework: 'CIPR_103',
        active: true,
    },
    // ── WORKER_B ──
    {
        id: -4,
        grandeur: 'HP10',
        personCategory: 'WORKER_B',
        doseConstraint: null,
        investigationLevel: null,
        actionLevel: null,
        classificationThreshold: 6,
        regulatoryLimit: null,
        unit: 'mSv',
        referenceFramework: 'AIEA_GSR_PART3',
        active: true,
    },
    // ── APPRENTICE ──
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
    // ── PREGNANCY ──
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

// Categories affichees dans le tableau "Limites de doses applicables".
const CATEGORY_ORDER: Array<Threshold['personCategory']> = [
    'WORKER_A',
    'WORKER_B',
    'APPRENTICE',
    'PREGNANCY',
    'PUBLIC',
];

// ─────────────────────────────────────────────────────────────────────────────
//  Bandes d'exposition — pourcentages de la limite reglementaire
//  Aligne sur backend ExposedWorkerQueryServiceImpl.calculateExposureLevel.
// ─────────────────────────────────────────────────────────────────────────────

interface BandRow {
    pct: number;
    colorHex: string;
    labelKey: string;
    descKey: string;
    iconBg: string;
    iconRing: string;
}

const BANDS: BandRow[] = [
    {
        pct: 50,
        colorHex: '#10b981',
        labelKey: 'parameters.bandsSection.controlLevel',
        descKey: 'parameters.bandsSection.controlLevelDesc',
        iconBg: 'bg-emerald-100',
        iconRing: 'ring-emerald-200',
    },
    {
        pct: 75,
        colorHex: '#facc15',
        labelKey: 'parameters.bandsSection.investigationLevel',
        descKey: 'parameters.bandsSection.investigationLevelDesc',
        iconBg: 'bg-yellow-100',
        iconRing: 'ring-yellow-200',
    },
    {
        pct: 90,
        colorHex: '#f97316',
        labelKey: 'parameters.bandsSection.actionLevel',
        descKey: 'parameters.bandsSection.actionLevelDesc',
        iconBg: 'bg-orange-100',
        iconRing: 'ring-orange-200',
    },
    {
        pct: 100,
        colorHex: '#ef4444',
        labelKey: 'parameters.bandsSection.regulatoryLimit',
        descKey: 'parameters.bandsSection.regulatoryLimitDesc',
        iconBg: 'bg-red-100',
        iconRing: 'ring-red-200',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Niveaux d'autorisation (vue narrative humaine)
//  Cle technique = mappage 1:1 sur backend ApplicationPermission.
// ─────────────────────────────────────────────────────────────────────────────

interface AccessLevel {
    permKey: string; // code technique (uniquement pour tooltip/admin)
    icon: React.ComponentType<{ size?: number; stroke?: number; className?: string }>;
    accentBg: string;
    accentText: string;
    accentBorder: string;
    allowedRoles: string[]; // codes techniques (DOSIMETRY_VIEW, etc.)
}

const ACCESS_LEVELS: AccessLevel[] = [
    {
        permKey: 'DOSIMETRY_VIEW',
        icon: IconUsers,
        accentBg: 'bg-sky-50',
        accentText: 'text-sky-700',
        accentBorder: 'border-sky-200',
        allowedRoles: ['HSE_VIEWER', 'HSE_OFFICER', 'MEDICAL_DOCTOR', 'ADMIN'],
    },
    {
        permKey: 'DOSIMETRY_RECORD',
        icon: IconEdit,
        accentBg: 'bg-indigo-50',
        accentText: 'text-indigo-700',
        accentBorder: 'border-indigo-200',
        allowedRoles: ['HSE_OFFICER', 'RADIO_PROTECTION_OFFICER', 'ADMIN'],
    },
    {
        permKey: 'DOSIMETRY_VALIDATE',
        icon: IconCircleCheck,
        accentBg: 'bg-emerald-50',
        accentText: 'text-emerald-700',
        accentBorder: 'border-emerald-200',
        allowedRoles: ['RADIO_PROTECTION_OFFICER', 'ADMIN'],
    },
    {
        permKey: 'DOSIMETRY_MEDICAL',
        icon: IconStethoscope,
        accentBg: 'bg-violet-50',
        accentText: 'text-violet-700',
        accentBorder: 'border-violet-200',
        allowedRoles: ['MEDICAL_DOCTOR', 'ADMIN'],
    },
    {
        permKey: 'DOSIMETRY_ALERT',
        icon: IconAlertOctagon,
        accentBg: 'bg-amber-50',
        accentText: 'text-amber-700',
        accentBorder: 'border-amber-200',
        allowedRoles: ['RADIO_PROTECTION_OFFICER', 'HSE_MANAGER', 'ADMIN'],
    },
    {
        permKey: 'DOSIMETRY_ADMIN',
        icon: IconLock,
        accentBg: 'bg-rose-50',
        accentText: 'text-rose-700',
        accentBorder: 'border-rose-200',
        allowedRoles: ['ADMIN'],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const DosimetryParametersPage = () => {
    const { t } = useTranslation('dosimetry');
    const [thresholds, setThresholds] = useState<Threshold[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [techMatrixOpen, setTechMatrixOpen] = useState(false);

    // ─── Fetch des seuils ───
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

    // ─── Lookup limite par categorie + grandeur ───
    const limitFor = (cat: Threshold['personCategory'], grandeur: Threshold['grandeur']): number | null => {
        const th = thresholds.find(
            (x) => x.personCategory === cat && x.grandeur === grandeur && x.active !== false,
        );
        return th?.regulatoryLimit ?? null;
    };

    const classificationFor = (
        cat: Threshold['personCategory'],
        grandeur: Threshold['grandeur'],
    ): number | null => {
        const th = thresholds.find(
            (x) => x.personCategory === cat && x.grandeur === grandeur && x.active !== false,
        );
        return th?.classificationThreshold ?? null;
    };

    const frameworkFor = (cat: Threshold['personCategory']): string | null => {
        const th = thresholds.find((x) => x.personCategory === cat && x.active !== false);
        return th?.referenceFramework ?? null;
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">

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
                    </div>
                </div>

                {/* ─── Erreur de chargement ─── */}
                {loadError && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── 1. Référentiel réglementaire ─── */}
                <SectionHeader
                    icon={<IconBook size={18} stroke={1.8} className="text-indigo-600" />}
                    title={t('parameters.refFramework.sectionTitle')}
                    subtitle={t('parameters.refFramework.sectionSubtitle')}
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                    <RefCard
                        accent="indigo"
                        icon={<IconScale size={20} stroke={1.8} className="text-indigo-700" />}
                        code={t('parameters.refFramework.cipr.code')}
                        title={t('parameters.refFramework.cipr.title')}
                        body={t('parameters.refFramework.cipr.body')}
                    />
                    <RefCard
                        accent="sky"
                        icon={<IconBuilding size={20} stroke={1.8} className="text-sky-700" />}
                        code={t('parameters.refFramework.iaea.code')}
                        title={t('parameters.refFramework.iaea.title')}
                        body={t('parameters.refFramework.iaea.body')}
                    />
                    <RefCard
                        accent="violet"
                        icon={<IconFlag size={20} stroke={1.8} className="text-violet-700" />}
                        code={t('parameters.refFramework.national.code')}
                        title={t('parameters.refFramework.national.title')}
                        body={t('parameters.refFramework.national.body')}
                    />
                </div>

                {/* ─── 2. Limites de doses applicables ─── */}
                <SectionHeader
                    icon={<IconScale size={18} stroke={1.8} className="text-emerald-600" />}
                    title={t('parameters.limitsSection.sectionTitle')}
                    subtitle={t('parameters.limitsSection.sectionSubtitle')}
                />
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="bg-slate-50/80 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-500 border-b border-slate-200">
                                    <th className="px-4 py-3 font-semibold">
                                        {t('parameters.limitsSection.tableColCategory')}
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-right">
                                        {t('parameters.limitsSection.tableColHp10')}
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-right">
                                        {t('parameters.limitsSection.tableColHp007')}
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-right">
                                        {t('parameters.limitsSection.tableColHp3')}
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        {t('parameters.limitsSection.tableColFramework')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                            <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                                        </td>
                                    </tr>
                                ) : (
                                    CATEGORY_ORDER.map((cat) => {
                                        const hp10 = limitFor(cat, 'HP10');
                                        const hp007 = limitFor(cat, 'HP007');
                                        const hp3 = limitFor(cat, 'HP3');
                                        const classificationHp10 = classificationFor(cat, 'HP10');
                                        const fw = frameworkFor(cat);
                                        const tooltip = t(`parameters.limitsSection.tooltips.${cat}`, {
                                            defaultValue: '',
                                        });
                                        return (
                                            <tr
                                                key={cat}
                                                className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <Tooltip
                                                        label={tooltip}
                                                        multiline
                                                        w={320}
                                                        position="right"
                                                        withArrow
                                                        disabled={!tooltip}
                                                    >
                                                        <div>
                                                            <span className="inline-flex items-center gap-1.5 text-slate-800 font-medium cursor-help">
                                                                {t(`thresholds.categories.${cat}`)}
                                                                {tooltip && (
                                                                    <IconInfoCircle
                                                                        size={12}
                                                                        stroke={1.6}
                                                                        className="text-slate-400"
                                                                    />
                                                                )}
                                                            </span>
                                                            {classificationHp10 != null && (
                                                                <span className="mt-1 block text-[10.5px] text-violet-700 font-medium">
                                                                    {t('parameters.limitsSection.classificationThreshold', {
                                                                        defaultValue: 'Seuil de classification',
                                                                    })}: {classificationHp10} mSv
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Tooltip>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">
                                                    <DoseCell value={hp10} t={t} />
                                                    {cat === 'WORKER_B' && hp10 == null && (
                                                        <span className="block text-[9.5px] leading-tight text-amber-700 mt-1">
                                                            {t('parameters.limitsSection.localValidationRequired', {
                                                                defaultValue: 'Non configurée — validation locale requise',
                                                            })}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">
                                                    <DoseCell value={hp007} t={t} />
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">
                                                    <DoseCell value={hp3} t={t} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    {fw ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                            {t(`thresholds.frameworks.${fw}`, {
                                                                defaultValue: fw,
                                                            })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── 3. Bandes d'exposition ─── */}
                <SectionHeader
                    icon={<IconAlertOctagon size={18} stroke={1.8} className="text-orange-600" />}
                    title={t('parameters.bandsSection.sectionTitle')}
                    subtitle={t('parameters.bandsSection.sectionSubtitle')}
                />
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                    <div className="p-5">
                        {/* Barre graphique unifiée */}
                        <div className="relative h-6 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                            {BANDS.map((band, idx) => {
                                const prev = idx === 0 ? 0 : BANDS[idx - 1].pct;
                                const width = Math.max(0, band.pct - prev);
                                return (
                                    <div
                                        key={band.labelKey}
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
                        {/* Échelle 0% → 100% */}
                        <div className="relative mt-1.5 h-4 text-[10.5px] text-slate-500 font-mono">
                            <span className="absolute" style={{ left: '0%' }}>0%</span>
                            <span className="absolute -translate-x-1/2" style={{ left: '50%' }}>50%</span>
                            <span className="absolute -translate-x-1/2" style={{ left: '75%' }}>75%</span>
                            <span className="absolute -translate-x-1/2" style={{ left: '90%' }}>90%</span>
                            <span className="absolute right-0">100%</span>
                        </div>
                        <p className="text-[10.5px] uppercase tracking-[0.10em] text-slate-400 font-semibold mt-2">
                            {t('parameters.bandsSection.axisLabel')}
                        </p>

                        {/* Liste des 4 bandes */}
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {BANDS.map((band) => (
                                <div
                                    key={band.labelKey}
                                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/40"
                                >
                                    <div
                                        className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ring-4 ${band.iconRing}`}
                                        style={{ background: band.colorHex }}
                                        aria-hidden="true"
                                    >
                                        <span className="text-white text-[11px] font-bold font-mono">
                                            {band.pct}%
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-slate-900">
                                            {t(band.labelKey)}
                                        </p>
                                        <p className="text-[11.5px] text-slate-600 leading-snug mt-0.5">
                                            {t(band.descKey)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ─── 4. Règles d'accès — vue narrative ─── */}
                <SectionHeader
                    icon={<IconShieldLock size={18} stroke={1.8} className="text-slate-700" />}
                    title={t('parameters.accessSection.sectionTitle')}
                    subtitle={t('parameters.accessSection.sectionSubtitle')}
                />
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-4">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40">
                        <p className="text-[13px] text-slate-700 leading-relaxed">
                            {t('parameters.accessSection.intro')}
                        </p>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ACCESS_LEVELS.map((lvl) => {
                            const IconCmp = lvl.icon;
                            const humanLabel = t(`parameters.rbacPermissionsHuman.${lvl.permKey}`);
                            return (
                                <div
                                    key={lvl.permKey}
                                    className={`p-4 rounded-xl border ${lvl.accentBorder} ${lvl.accentBg}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`w-9 h-9 rounded-lg bg-white border ${lvl.accentBorder} flex items-center justify-center flex-shrink-0`}
                                        >
                                            <IconCmp size={16} stroke={1.8} className={lvl.accentText} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <Tooltip
                                                label={lvl.permKey}
                                                position="top-start"
                                                withArrow
                                                color="gray"
                                            >
                                                <p
                                                    className={`text-[13.5px] font-semibold ${lvl.accentText} cursor-help`}
                                                    style={{
                                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                                        letterSpacing: '-0.01em',
                                                    }}
                                                >
                                                    {humanLabel}
                                                </p>
                                            </Tooltip>
                                            <div className="mt-2">
                                                <p className="text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold mb-1.5">
                                                    {t('parameters.accessSection.allowedRolesLabel')}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {lvl.allowedRoles.map((r) => (
                                                        <Tooltip
                                                            key={r}
                                                            label={r}
                                                            position="top"
                                                            withArrow
                                                            color="gray"
                                                        >
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-white text-slate-700 border border-slate-200 cursor-help">
                                                                {t(`parameters.rbacRoles.${r}`, {
                                                                    defaultValue: r,
                                                                })}
                                                            </span>
                                                        </Tooltip>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Lien discret bas de section : ouvre la matrice technique */}
                <div className="flex justify-end mb-8">
                    <button
                        type="button"
                        onClick={() => setTechMatrixOpen(true)}
                        className="text-[11.5px] text-slate-500 hover:text-indigo-600 underline-offset-2 hover:underline transition inline-flex items-center gap-1"
                    >
                        <IconLock size={11} stroke={1.8} />
                        {t('parameters.accessSection.viewTechMatrix')}
                    </button>
                </div>

                {/* ─── Footer note ─── */}
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
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

            {/* ─── Modal : matrice RBAC technique (admin) ─── */}
            <Modal
                opened={techMatrixOpen}
                onClose={() => setTechMatrixOpen(false)}
                centered
                size="lg"
                title={
                    <span
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '15px',
                        }}
                        className="text-slate-900 inline-flex items-center gap-2"
                    >
                        <IconLock size={16} className="text-indigo-700" />
                        {t('parameters.accessSection.techMatrixModalTitle')}
                    </span>
                }
            >
                <p className="text-[12px] text-slate-600 mb-3">
                    {t('parameters.accessSection.techMatrixModalSubtitle')}
                </p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-[12.5px]">
                        <thead>
                            <tr className="bg-slate-50/80 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-500">
                                <th className="px-3 py-2 font-semibold">
                                    {t('parameters.accessSection.techPermissionCode')}
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    {t('parameters.accessSection.techRolesCode')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {ACCESS_LEVELS.map((lvl) => (
                                <tr key={lvl.permKey} className="border-t border-slate-100">
                                    <td className="px-3 py-2">
                                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                                            {lvl.permKey}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex flex-wrap gap-1">
                                            {lvl.allowedRoles.map((r) => (
                                                <span
                                                    key={r}
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
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
                <div className="flex justify-end mt-4">
                    <button
                        type="button"
                        onClick={() => setTechMatrixOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                    >
                        {t('parameters.accessSection.techCloseBtn')}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
}

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
    return (
        <div className="flex items-start gap-2.5 mb-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-sm flex-shrink-0">
                {icon}
            </span>
            <div className="min-w-0">
                <h2
                    className="text-slate-900 leading-tight"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '17px',
                        letterSpacing: '-0.012em',
                    }}
                >
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-[12px] text-slate-600 mt-0.5">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

interface RefCardProps {
    accent: 'indigo' | 'sky' | 'violet';
    icon: React.ReactNode;
    code: string;
    title: string;
    body: string;
}

const REF_ACCENT_BORDER: Record<RefCardProps['accent'], string> = {
    indigo: 'border-indigo-200',
    sky: 'border-sky-200',
    violet: 'border-violet-200',
};

const REF_ACCENT_BG: Record<RefCardProps['accent'], string> = {
    indigo: 'bg-indigo-50/70',
    sky: 'bg-sky-50/70',
    violet: 'bg-violet-50/70',
};

const REF_ACCENT_PILL: Record<RefCardProps['accent'], string> = {
    indigo: 'bg-indigo-100 text-indigo-800',
    sky: 'bg-sky-100 text-sky-800',
    violet: 'bg-violet-100 text-violet-800',
};

function RefCard({ accent, icon, code, title, body }: RefCardProps) {
    return (
        <div className={`bg-white border ${REF_ACCENT_BORDER[accent]} rounded-2xl shadow-sm overflow-hidden flex flex-col`}>
            <div className={`p-4 ${REF_ACCENT_BG[accent]} border-b ${REF_ACCENT_BORDER[accent]} flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-xl bg-white border border-white/50 flex items-center justify-center shadow-sm">
                    {icon}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${REF_ACCENT_PILL[accent]}`}>
                    {code}
                </span>
            </div>
            <div className="p-4 flex-1">
                <h3
                    className="text-slate-900 leading-tight mb-2"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '14px',
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </h3>
                <p className="text-[12.5px] text-slate-600 leading-relaxed">{body}</p>
            </div>
        </div>
    );
}

interface DoseCellProps {
    value: number | null;
    t: (key: string, opts?: Record<string, unknown>) => string;
}

function DoseCell({ value, t }: DoseCellProps) {
    if (value == null) {
        return (
            <Tooltip
                label={t('parameters.limitsSection.noValueHint')}
                position="top"
                withArrow
                color="gray"
            >
                <span className="text-slate-300 cursor-help">
                    {t('parameters.limitsSection.noValue')}
                </span>
            </Tooltip>
        );
    }
    return (
        <span>
            <span className="font-semibold text-slate-900">{value}</span>
            <span className="text-[10.5px] text-slate-400 ml-0.5">
                mSv {t('parameters.limitsSection.perYear')}
            </span>
        </span>
    );
}

export default DosimetryParametersPage;
