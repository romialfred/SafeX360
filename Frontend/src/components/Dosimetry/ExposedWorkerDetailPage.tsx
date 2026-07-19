import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IconChevronRight,
    IconArrowLeft,
    IconPencil,
    IconPrinter,
    IconUserCircle,
    IconShieldHalfFilled,
    IconAtom2,
    IconStethoscope,
    IconCertificate,
    IconChartLine,
    IconBuildingFactory2,
    IconCalendarTime,
    IconAlertOctagon,
    IconAlertTriangle,
    IconInfoCircle,
    IconLockAccess,
    IconCircleCheck,
    IconClipboardList,
    IconFileCertificate,
} from '@tabler/icons-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppSelector } from '../../slices/hooks';
import {
    getWorkerDetail,
    downloadIndividualAttestation,
    type ExposedWorkerDetailDTO,
    type DoseRecordDTO,
    type DoseCategory,
    type DoseSource,
    type DosimeterAssignmentDTO,
    type QualificationDTO,
    type AlertLevel,
} from '../../services/DosimetryService';
import PdfDownloadModal from './PdfDownloadModal';
import DoseForecastCard from './DoseForecastCard';
import { resolveConfiguredRegulatoryLimit } from './dosimetryRegulatoryLimits';

/**
 * ExposedWorkerDetailPage — Fiche 360 d'un travailleur expose (Phase 2 Frontend-B).
 *
 * UX premium SafeX 360 :
 *  - Breadcrumb : Dosimetrie > Registre > Detail
 *  - Header card : avatar gradient + nom + matricule + badges categorie /
 *    statut special, actions (Retour, Modifier, Imprimer attestation)
 *  - 6 onglets : Identite & Emploi / Classement / Doses / Dosimetres /
 *    Surveillance medicale / Habilitations & alertes
 *  - Tableau historique doses + trend Recharts vs limite annuelle
 *  - Gauges Annuel / Glissant 5 ans / Vie professionnelle (vert/jaune/orange/rouge)
 *  - RBAC : section medicale cloisonnee si pas DOSIMETRY_MEDICAL,
 *    bouton "Modifier classement" masque si pas DOSIMETRY_PCR_RPO
 *  - Footer ISO 27001 / AIEA GSR Part 3
 *
 * Le DTO consomme est aligne 1:1 sur {@code ExposedWorkerDetailDTO} backend :
 *   { identity, classification, exposureProfile, doseHistory, cumulative,
 *     dosimeters, medical, qualifications, alerts, thresholds }
 */

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper — meme pattern que ExposedWorkersRegistryPage
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
//  Helpers d'affichage
// ─────────────────────────────────────────────────────────────────────────────

const formatMsv = (v: number | null | undefined): string => {
    if (v == null || Number.isNaN(v)) return '—';
    return v.toFixed(2);
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

const initialsOf = (fullName?: string | null): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/).slice(0, 2);
    const init = parts.map((p) => p[0] ?? '').join('').toUpperCase();
    return init || '?';
};

/**
 * Couleur de gauge selon le ratio dose/limite (CIPR 103).
 *
 * Bornes alignees BACKEND ({@code ExposedWorkerQueryServiceImpl.calculateExposureLevel})
 * et prompt §6/§10 :
 *   - >=100 % → rouge (depassement)
 *   -  >=75 % → orange
 *   -  >=50 % → jaune
 *   -    sinon → vert
 * Cas {@code null}/{@code undefined} → vert (defaut, le caller protege).
 */
function gaugeTone(ratio: number): {
    ring: string;
    bar: string;
    text: string;
    bg: string;
    border: string;
} {
    if (ratio == null || Number.isNaN(ratio)) {
        return {
            ring: 'ring-green-200',
            bar: 'bg-gradient-to-r from-green-500 to-emerald-600',
            text: 'text-green-700',
            bg: 'bg-green-50',
            border: 'border-green-200',
        };
    }
    if (ratio >= 1.0) {
        return {
            ring: 'ring-red-200',
            bar: 'bg-gradient-to-r from-red-500 to-red-600',
            text: 'text-red-700',
            bg: 'bg-red-50',
            border: 'border-red-200',
        };
    }
    if (ratio >= 0.75) {
        return {
            ring: 'ring-orange-200',
            bar: 'bg-gradient-to-r from-orange-500 to-orange-600',
            text: 'text-orange-700',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
        };
    }
    if (ratio >= 0.5) {
        return {
            ring: 'ring-yellow-200',
            bar: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
            text: 'text-yellow-700',
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
        };
    }
    return {
        ring: 'ring-green-200',
        bar: 'bg-gradient-to-r from-green-500 to-emerald-600',
        text: 'text-green-700',
        bg: 'bg-green-50',
        border: 'border-green-200',
    };
}

/**
 * Mappe le statut Qualif (VALID/EXPIRED/REVOKED) + validTo vers un statut UI :
 *  - REVOKED ou EXPIRED → "EXPIRED"
 *  - VALID + validTo < J+60 → "EXPIRING"
 *  - sinon → "VALID"
 */
function deriveQualifUiStatus(q: QualificationDTO): 'VALID' | 'EXPIRING' | 'EXPIRED' {
    if (q.status === 'EXPIRED' || q.status === 'REVOKED') return 'EXPIRED';
    if (q.validTo) {
        const to = new Date(q.validTo).getTime();
        const horizon = Date.now() + 60 * 24 * 3600 * 1000;
        if (to < horizon) return 'EXPIRING';
    }
    return 'VALID';
}

/**
 * La limite reglementaire Hp(10) annuelle provient des seuils actifs backend.
 * Aucune valeur n'est inventee si la configuration applicable est absente.
 */
// ─────────────────────────────────────────────────────────────────────────────
//  Onglets
// ─────────────────────────────────────────────────────────────────────────────

type TabKey = 'identity' | 'classification' | 'doses' | 'dosimeters' | 'medical' | 'qualifications';

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const ExposedWorkerDetailPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const user = useAppSelector((state: any) => state.user);

    const canEditClassification = hasDosimetryPermission(user, 'DOSIMETRY_PCR_RPO');
    const canEdit = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');
    const canSeeMedicalClinical = hasDosimetryPermission(user, 'DOSIMETRY_MEDICAL');

    const [detail, setDetail] = useState<ExposedWorkerDetailDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('identity');

    // Phase 9-B : modal de download attestation annuelle.
    const [attestationModalOpen, setAttestationModalOpen] = useState(false);

    // ── Chargement ──
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        getWorkerDetail(id)
            .then((data: ExposedWorkerDetailDTO) => {
                if (cancelled) return;
                if (data && data.identity) {
                    setDetail(data);
                    setLoadError(null);
                } else {
                    setDetail(null);
                    setLoadError(t('workerDetail.loadError'));
                }
            })
            .catch(() => {
                if (cancelled) return;
                setDetail(null);
                setLoadError(t('workerDetail.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id, t]);

    // ── Donnees derivees ──
    const fullName = detail?.identity?.fullName ?? '—';
    const matricule = detail?.identity?.matricule ?? `#${detail?.identity?.employeeId ?? ''}`;
    const category: DoseCategory = detail?.classification?.category ?? 'B';
    const specialStatus = detail?.classification?.specialStatus ?? null;
    const isPregnancy = specialStatus === 'PREGNANCY';
    const isApprentice = specialStatus === 'APPRENTICE';

    // ── Trend data pour Recharts (cumul Hp(10) chronologique vs limite) ──
    const trendData = useMemo(() => {
        const records = detail?.doseHistory ?? [];
        const sorted = [...records].sort((a, b) => (a.period ?? '').localeCompare(b.period ?? ''));
        let cumul = 0;
        return sorted.map((r) => {
            cumul += r.hp10 ?? 0;
            return {
                period: r.period,
                cumulHp10: Number(cumul.toFixed(2)),
            };
        });
    }, [detail]);

    const annualLimitHp10 = useMemo(
        () => resolveConfiguredRegulatoryLimit(detail?.thresholds, category),
        [detail, category],
    );

    if (loading) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-10 text-center">
                <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                <span className="text-[13px] text-slate-600">{t('workerDetail.loading')}</span>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-10 text-center">
                <p className="text-[14px] text-slate-700">{loadError ?? t('workerDetail.notFound')}</p>
                <button
                    type="button"
                    onClick={() => navigate('/dosimetry/workers')}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                >
                    <IconArrowLeft size={13} stroke={1.8} />
                    {t('workerDetail.actions.back')}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">

                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('workerDetail.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/workers')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-600 transition"
                    >
                        {t('workerDetail.breadcrumbParent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('workerDetail.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Banner erreur de chargement (non-bloquant) ─── */}
                {loadError && (
                    <div
                        className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]"
                        role="alert"
                    >
                        <IconAlertTriangle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Header card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        {/* Avatar + identite */}
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                            <div
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0"
                                aria-hidden="true"
                            >
                                <span className="text-white font-semibold text-[19px] tracking-wide">
                                    {initialsOf(detail.identity.fullName)}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1
                                        className="text-slate-900 leading-tight"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 'clamp(20px, 2.2vw, 26px)',
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        {fullName}
                                    </h1>
                                    {/* Badge categorie */}
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                            category === 'A'
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                : 'bg-slate-50 text-slate-700 border-slate-200'
                                        }`}
                                        aria-label={t('workerDetail.headerCategoryAria', { category })}
                                    >
                                        {category}
                                    </span>
                                    {/* Badges statut special */}
                                    {isPregnancy && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border bg-pink-50 text-pink-700 border-pink-200">
                                            {t('workerDetail.headerSpecialPregnancy')}
                                        </span>
                                    )}
                                    {isApprentice && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border bg-cyan-50 text-cyan-700 border-cyan-200">
                                            {t('workerDetail.headerSpecialApprentice')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[12.5px] text-slate-600 mt-1">
                                    <span className="font-mono text-slate-800 font-medium">{matricule}</span>
                                    {detail.identity.position && (
                                        <>
                                            <span className="mx-2 text-slate-400">•</span>
                                            {detail.identity.position}
                                        </>
                                    )}
                                    {detail.identity.department && (
                                        <>
                                            <span className="mx-2 text-slate-400">•</span>
                                            {detail.identity.department}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Actions header */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => navigate('/dosimetry/workers')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                            >
                                <IconArrowLeft size={13} stroke={1.8} />
                                {t('workerDetail.actions.back')}
                            </button>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/dosimetry/workers/edit/${detail.identity.workerId}`)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                                >
                                    <IconPencil size={13} stroke={1.8} />
                                    {t('workerDetail.actions.edit')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setAttestationModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                                title={t('workerDetail.actions.downloadAttestationHint')}
                            >
                                <IconFileCertificate size={13} stroke={1.8} />
                                {t('workerDetail.actions.downloadAttestation')}
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-slate-800 text-white hover:bg-slate-900 transition shadow-sm"
                            >
                                <IconPrinter size={13} stroke={1.8} />
                                {t('workerDetail.actions.printCertificate')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Onglets ─── */}
                <div className="mb-4">
                    <div
                        className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto"
                        role="tablist"
                        aria-label="Worker detail tabs"
                    >
                        <TabButton
                            active={activeTab === 'identity'}
                            onClick={() => setActiveTab('identity')}
                            icon={<IconUserCircle size={14} stroke={1.8} />}
                            label={t('workerDetail.tabs.identity')}
                        />
                        <TabButton
                            active={activeTab === 'classification'}
                            onClick={() => setActiveTab('classification')}
                            icon={<IconShieldHalfFilled size={14} stroke={1.8} />}
                            label={t('workerDetail.tabs.classification')}
                        />
                        <TabButton
                            active={activeTab === 'doses'}
                            onClick={() => setActiveTab('doses')}
                            icon={<IconChartLine size={14} stroke={1.8} />}
                            label={t('workerDetail.tabs.doses')}
                        />
                        <TabButton
                            active={activeTab === 'dosimeters'}
                            onClick={() => setActiveTab('dosimeters')}
                            icon={<IconAtom2 size={14} stroke={1.8} />}
                            label={t('workerDetail.tabs.dosimeters')}
                        />
                        <TabButton
                            active={activeTab === 'medical'}
                            onClick={() => setActiveTab('medical')}
                            icon={<IconStethoscope size={14} stroke={1.8} />}
                            label={t('workerDetail.tabs.medical')}
                        />
                        <TabButton
                            active={activeTab === 'qualifications'}
                            onClick={() => setActiveTab('qualifications')}
                            icon={<IconCertificate size={14} stroke={1.8} />}
                            label={t('workerDetail.tabs.qualifications')}
                        />
                    </div>
                </div>

                {/* ─── Contenu onglets ─── */}
                {activeTab === 'identity' && (
                    <IdentityTab detail={detail} t={t} />
                )}
                {activeTab === 'classification' && (
                    <ClassificationTab
                        detail={detail}
                        t={t}
                        canEditClassification={canEditClassification}
                    />
                )}
                {activeTab === 'doses' && (
                    <DosesTab
                        detail={detail}
                        trendData={trendData}
                        annualLimitHp10={annualLimitHp10}
                        t={t}
                    />
                )}
                {activeTab === 'dosimeters' && (
                    <DosimetersTab detail={detail} t={t} />
                )}
                {activeTab === 'medical' && (
                    <MedicalTab
                        detail={detail}
                        t={t}
                        canSeeClinical={canSeeMedicalClinical}
                    />
                )}
                {activeTab === 'qualifications' && (
                    <QualificationsTab detail={detail} t={t} />
                )}

                {/* ─── Footer ─── */}
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex-shrink-0">
                        <IconInfoCircle size={15} stroke={1.8} />
                    </span>
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <p className="font-medium text-slate-800 mb-0.5">
                            {t('workerDetail.footer.title')}
                        </p>
                        <p>{t('workerDetail.footer.note')}</p>
                    </div>
                </div>
            </div>

            {/* ─── Phase 9-B : modal de download attestation annuelle ─── */}
            <PdfDownloadModal
                opened={attestationModalOpen}
                onClose={() => setAttestationModalOpen(false)}
                title={t('reports.cards.attestation.modalTitle')}
                subtitle={t('reports.cards.attestation.modalSubtitle')}
                filename={`attestation_${(matricule || 'worker').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().getFullYear()}.pdf`}
                onConfirm={(reason) =>
                    downloadIndividualAttestation(
                        Number(detail.identity.workerId),
                        new Date().getFullYear(),
                        reason,
                    )
                }
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants — onglets
// ─────────────────────────────────────────────────────────────────────────────

function TabButton({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition whitespace-nowrap ${
                active
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

function Card({
    title,
    icon,
    children,
    actions,
}: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    {icon && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {icon}
                        </span>
                    )}
                    <h2 className="text-[13.5px] font-semibold text-slate-800 tracking-tight">
                        {title}
                    </h2>
                </div>
                {actions}
            </div>
            {children}
        </section>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-1.5 text-[12.5px]">
            <span className="text-slate-500 min-w-[180px]">{label}</span>
            <span className="text-slate-800 font-medium flex-1 break-words">{value ?? '—'}</span>
        </div>
    );
}

// ── Onglet : Identite & emploi ──
function IdentityTab({ detail, t }: { detail: ExposedWorkerDetailDTO; t: (k: string, o?: any) => string }) {
    const i = detail.identity;
    return (
        <Card title={t('workerDetail.identity.title')} icon={<IconUserCircle size={14} stroke={1.8} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <InfoRow label={t('workerDetail.identity.matricule')} value={<span className="font-mono">{i.matricule ?? '—'}</span>} />
                <InfoRow label={t('workerDetail.identity.name')} value={i.fullName ?? '—'} />
                <InfoRow label={t('workerDetail.identity.birthDate')} value={formatDate(i.dateNaissance)} />
                <InfoRow label={t('workerDetail.identity.position')} value={i.position ?? '—'} />
                <InfoRow label={t('workerDetail.identity.department')} value={
                    <span className="inline-flex items-center gap-1">
                        <IconBuildingFactory2 size={12} className="text-slate-400" />
                        {i.department ?? '—'}
                    </span>
                } />
                <InfoRow label={t('workerDetail.identity.employeeId')} value={<span className="font-mono">#{i.employeeId}</span>} />
            </div>
        </Card>
    );
}

// ── Onglet : Classement radioprotection ──
function ClassificationTab({
    detail,
    t,
    canEditClassification,
}: {
    detail: ExposedWorkerDetailDTO;
    t: (k: string, o?: any) => string;
    canEditClassification: boolean;
}) {
    const c = detail.classification;
    const ss = c.specialStatus;

    return (
        <Card
            title={t('workerDetail.classification.title')}
            icon={<IconShieldHalfFilled size={14} stroke={1.8} />}
            actions={
                <button
                    type="button"
                    disabled={!canEditClassification}
                    title={canEditClassification ? undefined : t('workerDetail.classification.editDenied')}
                    onClick={() => {
                        // Lien vers le formulaire d'edition (Phase 2 Frontend-C)
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {canEditClassification ? (
                        <IconPencil size={12} stroke={1.8} />
                    ) : (
                        <IconLockAccess size={12} stroke={1.8} />
                    )}
                    {t('workerDetail.actions.editClassification')}
                </button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <InfoRow
                    label={t('workerDetail.classification.category')}
                    value={
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                c.category === 'A'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                        >
                            {c.category === 'A'
                                ? t('workerDetail.classification.categoryA')
                                : t('workerDetail.classification.categoryB')}
                        </span>
                    }
                />
                <InfoRow
                    label={t('workerDetail.classification.classificationDate')}
                    value={formatDate(c.date)}
                />
                <InfoRow
                    label={t('workerDetail.classification.reason')}
                    value={c.reason ?? '—'}
                />
                <InfoRow
                    label={t('workerDetail.classification.rpoReferent')}
                    value={c.rpoName ?? (c.rpoId ? `#${c.rpoId}` : '—')}
                />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
                <h3 className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    {t('workerDetail.classification.specialStatusTitle')}
                </h3>
                {!ss || ss === 'NONE' ? (
                    <p className="text-[12.5px] text-slate-500 italic">
                        {t('workerDetail.classification.specialStatusNone')}
                    </p>
                ) : (
                    <div className="flex flex-wrap items-center gap-3">
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-semibold border ${
                                ss === 'PREGNANCY'
                                    ? 'bg-pink-50 text-pink-700 border-pink-200'
                                    : ss === 'APPRENTICE'
                                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                        >
                            {t(`registry.specialStatus.${ss}`, { defaultValue: ss })}
                        </span>
                        <span className="text-[12px] text-slate-600">
                            {t('workerDetail.classification.specialStatusStartDate')} :{' '}
                            <span className="text-slate-800 font-medium">{formatDate(c.specialStatusStartDate)}</span>
                        </span>
                        <span className="text-[12px] text-slate-600">
                            {t('workerDetail.classification.specialStatusEndDate')} :{' '}
                            <span className="text-slate-800 font-medium">{formatDate(c.specialStatusEndDate)}</span>
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
}

// ── Onglet : Doses + trend + cumuls ──
function DosesTab({
    detail,
    trendData,
    annualLimitHp10,
    t,
}: {
    detail: ExposedWorkerDetailDTO;
    trendData: { period: string; cumulHp10: number }[];
    annualLimitHp10: number | null;
    t: (k: string, o?: any) => string;
}) {
    const records = detail.doseHistory ?? [];
    const cumulative = detail.cumulative;

    return (
        <>
            <Card title={t('workerDetail.doses.title')} icon={<IconChartLine size={14} stroke={1.8} />}>
                <p className="text-[12px] text-slate-500 mb-3">{t('workerDetail.doses.subtitle')}</p>
                <DataTable
                    value={records}
                    dataKey="id"
                    size="small"
                    stripedRows
                    paginator
                    rows={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    responsiveLayout="scroll"
                    emptyMessage={
                        <p className="py-6 text-center text-[12.5px] text-slate-500">
                            {t('workerDetail.doses.empty')}
                        </p>
                    }
                    className="text-[12.5px]"
                >
                    <Column field="period" header={t('workerDetail.doses.cols.period')} sortable style={{ minWidth: 110 }} />
                    <Column
                        field="hp10"
                        header={t('workerDetail.doses.cols.hp10')}
                        sortable
                        align="right"
                        style={{ width: 110 }}
                        body={(r: DoseRecordDTO) => (
                            <span className="font-mono tabular-nums">{formatMsv(r.hp10)} <span className="text-slate-400 text-[10px]">mSv</span></span>
                        )}
                    />
                    <Column
                        field="hp007"
                        header={t('workerDetail.doses.cols.hp007')}
                        sortable
                        align="right"
                        style={{ width: 110 }}
                        body={(r: DoseRecordDTO) => (
                            <span className="font-mono tabular-nums">{formatMsv(r.hp007)} <span className="text-slate-400 text-[10px]">mSv</span></span>
                        )}
                    />
                    <Column
                        field="hp3"
                        header={t('workerDetail.doses.cols.hp3')}
                        sortable
                        align="right"
                        style={{ width: 110 }}
                        body={(r: DoseRecordDTO) => (
                            <span className="font-mono tabular-nums">{formatMsv(r.hp3)} <span className="text-slate-400 text-[10px]">mSv</span></span>
                        )}
                    />
                    <Column
                        field="source"
                        header={t('workerDetail.doses.cols.source')}
                        sortable
                        style={{ width: 130 }}
                        body={(r: DoseRecordDTO) => (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-50 border border-slate-200 text-slate-700">
                                {t(`workerDetail.doses.source.${r.source}` as string, { defaultValue: r.source as DoseSource })}
                            </span>
                        )}
                    />
                    <Column
                        field="recordedAt"
                        header={t('workerDetail.doses.cols.recordedAt')}
                        sortable
                        style={{ minWidth: 150 }}
                        body={(r: DoseRecordDTO) => formatDateTime(r.recordedAt)}
                    />
                </DataTable>
            </Card>

            {/* Trend Recharts */}
            <Card title={t('workerDetail.doses.trend.title')} icon={<IconChartLine size={14} stroke={1.8} />}>
                <p className="text-[12px] text-slate-500 mb-3">{t('workerDetail.doses.trend.subtitle')}</p>
                <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                        <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="period"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                stroke="#cbd5e1"
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                stroke="#cbd5e1"
                                label={{
                                    value: t('workerDetail.doses.trend.axisDose'),
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { fontSize: 11, fill: '#64748b' },
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            {annualLimitHp10 != null && (
                                <ReferenceLine
                                    y={annualLimitHp10}
                                    stroke="#dc2626"
                                    strokeDasharray="4 4"
                                    label={{
                                        value: `${t('workerDetail.doses.trend.limit')} (${annualLimitHp10} mSv)`,
                                        position: 'right',
                                        fontSize: 10,
                                        fill: '#dc2626',
                                    }}
                                />
                            )}
                            <Line
                                type="monotone"
                                dataKey="cumulHp10"
                                name={t('workerDetail.doses.trend.value')}
                                stroke="#6366f1"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#6366f1' }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Cumuls — 3 gauges */}
            <Card title={t('workerDetail.doses.cumuls.title')} icon={<IconChartLine size={14} stroke={1.8} />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <GaugeCard
                        title={t('workerDetail.doses.cumuls.annual')}
                        subtitle={t('workerDetail.doses.cumuls.annualSub')}
                        value={cumulative?.annualHp10 ?? null}
                        limit={annualLimitHp10}
                    />
                    <GaugeCard
                        title={t('workerDetail.doses.cumuls.rolling5y')}
                        subtitle={t('workerDetail.doses.cumuls.rolling5ySub')}
                        value={cumulative?.rolling5yHp10 ?? null}
                        limit={100}
                    />
                    <GaugeCard
                        title={t('workerDetail.doses.cumuls.lifetime')}
                        subtitle={t('workerDetail.doses.cumuls.lifetimeSub')}
                        value={cumulative?.lifetimeHp10 ?? null}
                        limit={400}
                    />
                </div>
            </Card>

            {/* Phase 10-B : Prevision Holt-Winters de la dose cumulee EOY */}
            {detail.identity.workerId != null && annualLimitHp10 != null && (
                <div className="mt-4">
                    <DoseForecastCard
                        workerId={Number(detail.identity.workerId)}
                        currentYear={new Date().getFullYear()}
                        annualLimitHp10={annualLimitHp10}
                    />
                </div>
            )}
        </>
    );
}

function GaugeCard({
    title,
    subtitle,
    value,
    limit,
}: {
    title: string;
    subtitle: string;
    value: number | null;
    limit: number | null;
}) {
    const ratio = value == null || limit == null || limit <= 0 ? 0 : Math.min(value / limit, 1.2);
    const pct = Math.min(ratio * 100, 100);
    const tone = gaugeTone(ratio);
    return (
        <div className={`relative rounded-xl border ${tone.border} ${tone.bg} p-3 ring-1 ${tone.ring}`}>
            <p className={`text-[11px] uppercase tracking-[0.12em] ${tone.text} font-semibold`}>{title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
            <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[22px] font-mono font-bold text-slate-800 tabular-nums leading-none">
                    {formatMsv(value)}
                </span>
                <span className="text-[11px] text-slate-500">
                    {limit != null ? `/ ${limit.toFixed(0)} mSv` : '/ limite non configurée'}
                </span>
            </div>
            <div className="mt-3 h-2 bg-white/70 rounded overflow-hidden border border-slate-200">
                <div
                    className={`h-full ${tone.bar} transition-all`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
            {limit != null ? (
                <p className={`mt-1.5 text-[11px] font-medium ${tone.text}`}>
                    {(ratio * 100).toFixed(1)} %
                </p>
            ) : (
                <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                    Limite non configurée — à valider localement
                </p>
            )}
        </div>
    );
}

// ── Onglet : Dosimetres ──
function DosimetersTab({ detail, t }: { detail: ExposedWorkerDetailDTO; t: (k: string, o?: any) => string }) {
    const rows = detail.dosimeters ?? [];
    return (
        <Card title={t('workerDetail.dosimeters.title')} icon={<IconAtom2 size={14} stroke={1.8} />}>
            <p className="text-[12px] text-slate-500 mb-3">{t('workerDetail.dosimeters.subtitle')}</p>
            <DataTable
                value={rows}
                dataKey="id"
                size="small"
                stripedRows
                responsiveLayout="scroll"
                emptyMessage={
                    <p className="py-6 text-center text-[12.5px] text-slate-500">
                        {t('workerDetail.dosimeters.empty')}
                    </p>
                }
                className="text-[12.5px]"
            >
                <Column
                    field="dosimeterId"
                    header={t('workerDetail.dosimeters.cols.serial')}
                    sortable
                    body={(r: DosimeterAssignmentDTO) => (
                        <span className="font-mono text-[12px] font-medium">#{r.dosimeterId}</span>
                    )}
                />
                <Column
                    field="periodStart"
                    header={t('workerDetail.dosimeters.cols.periodStart')}
                    sortable
                    style={{ width: 130 }}
                    body={(r: DosimeterAssignmentDTO) => formatDate(r.periodStart)}
                />
                <Column
                    field="periodEnd"
                    header={t('workerDetail.dosimeters.cols.periodEnd')}
                    sortable
                    style={{ width: 130 }}
                    body={(r: DosimeterAssignmentDTO) => formatDate(r.periodEnd)}
                />
                <Column
                    field="handoverAck"
                    header={t('workerDetail.dosimeters.cols.handover')}
                    sortable
                    style={{ width: 140 }}
                    body={(r: DosimeterAssignmentDTO) => (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${
                            r.handoverAck
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                            {r.handoverAck
                                ? t('workerDetail.dosimeters.handover.ack')
                                : t('workerDetail.dosimeters.handover.pending')}
                        </span>
                    )}
                />
                <Column
                    field="returnAck"
                    header={t('workerDetail.dosimeters.cols.return')}
                    sortable
                    style={{ width: 140 }}
                    body={(r: DosimeterAssignmentDTO) => (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${
                            r.returnAck
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                            {r.returnAck
                                ? t('workerDetail.dosimeters.handover.ack')
                                : t('workerDetail.dosimeters.handover.pending')}
                        </span>
                    )}
                />
            </DataTable>
        </Card>
    );
}

// ── Onglet : Surveillance medicale ──
function MedicalTab({
    detail,
    t,
    canSeeClinical,
}: {
    detail: ExposedWorkerDetailDTO;
    t: (k: string, o?: any) => string;
    canSeeClinical: boolean;
}) {
    const m = detail.medical;
    const fitness = m?.fitness ?? 'UNKNOWN';

    const fitnessTone: Record<string, string> = {
        FIT: 'bg-green-50 text-green-700 border-green-200',
        FIT_WITH_RESTRICTIONS: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        UNFIT: 'bg-red-50 text-red-700 border-red-200',
        UNKNOWN: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    const fitnessIcon =
        fitness === 'FIT' ? IconCircleCheck :
        fitness === 'UNFIT' ? IconAlertOctagon :
        IconAlertTriangle;
    const FitnessIcon = fitnessIcon;

    if (!m) {
        return (
            <Card title={t('workerDetail.medical.title')} icon={<IconStethoscope size={14} stroke={1.8} />}>
                <p className="text-[12.5px] text-slate-500 italic">{t('workerDetail.medical.empty')}</p>
            </Card>
        );
    }

    return (
        <Card title={t('workerDetail.medical.title')} icon={<IconStethoscope size={14} stroke={1.8} />}>
            <p className="text-[12px] text-slate-500 mb-3">{t('workerDetail.medical.subtitle')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mb-3">
                <InfoRow
                    label={t('workerDetail.medical.fitnessLabel')}
                    value={
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11.5px] font-semibold border ${fitnessTone[fitness] ?? fitnessTone.UNKNOWN}`}>
                            <FitnessIcon size={12} stroke={1.8} />
                            {t(`workerDetail.medical.fitness.${fitness}`, { defaultValue: fitness })}
                        </span>
                    }
                />
                <InfoRow label={t('workerDetail.medical.examType')} value={m.type ?? '—'} />
                <InfoRow label={t('workerDetail.medical.lastExam')} value={formatDate(m.examDate)} />
                <InfoRow label={t('workerDetail.medical.nextExam')} value={formatDate(m.nextDueDate)} />
                {canSeeClinical && (
                    <InfoRow label={t('workerDetail.medical.examiningPhysician')} value={m.doctorId ? `#${m.doctorId}` : '—'} />
                )}
            </div>

            {canSeeClinical ? (
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <h3 className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        {t('workerDetail.medical.clinicalNotesTitle')}
                    </h3>
                    <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-line">
                        {m.restrictedClinicalDetails ?? '—'}
                    </p>
                </div>
            ) : (
                <div
                    className="mt-3 flex items-start gap-3 px-3 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900"
                    role="note"
                >
                    <IconLockAccess size={16} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <div className="text-[12.5px]">
                        <p className="font-semibold mb-0.5">{t('workerDetail.medical.confidentialBanner')}</p>
                        <p className="text-[11.5px]">{t('workerDetail.medical.confidentialBannerDetail')}</p>
                    </div>
                </div>
            )}
        </Card>
    );
}

// ── Onglet : Habilitations & alertes ──
function QualificationsTab({ detail, t }: { detail: ExposedWorkerDetailDTO; t: (k: string, o?: any) => string }) {
    const quals = detail.qualifications ?? [];
    const alerts = detail.alerts ?? [];

    const alertTone: Record<AlertLevel, string> = {
        APPROACH: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        INVESTIGATION: 'bg-orange-50 text-orange-800 border-orange-200',
        ACTION: 'bg-red-50 text-red-800 border-red-200',
        EXCEEDED: 'bg-red-100 text-red-900 border-red-300',
    };
    const alertIcon: Record<AlertLevel, typeof IconAlertTriangle> = {
        APPROACH: IconAlertTriangle,
        INVESTIGATION: IconAlertTriangle,
        ACTION: IconAlertOctagon,
        EXCEEDED: IconAlertOctagon,
    };

    return (
        <>
            <Card title={t('workerDetail.qualifications.title')} icon={<IconCertificate size={14} stroke={1.8} />}>
                <p className="text-[12px] text-slate-500 mb-3">{t('workerDetail.qualifications.subtitle')}</p>
                {quals.length === 0 ? (
                    <p className="text-[12.5px] text-slate-500 italic">{t('workerDetail.qualifications.empty')}</p>
                ) : (
                    <ul className="space-y-2">
                        {quals.map((q) => {
                            const uiStatus = deriveQualifUiStatus(q);
                            const tone =
                                uiStatus === 'VALID' ? 'bg-green-50 text-green-700 border-green-200' :
                                uiStatus === 'EXPIRING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-red-50 text-red-700 border-red-200';
                            return (
                                <li
                                    key={q.id}
                                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <IconClipboardList size={14} className="text-slate-400 flex-shrink-0" />
                                        <span className="text-[12.5px] text-slate-800 font-medium truncate">
                                            {q.trainingType}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-[11.5px] text-slate-500">
                                            {t('workerDetail.qualifications.expiry')} : <span className="text-slate-700">{formatDate(q.validTo)}</span>
                                        </span>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold border ${tone}`}>
                                            {t(`workerDetail.qualifications.status.${uiStatus}`, { defaultValue: uiStatus })}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>

            <Card title={t('workerDetail.qualifications.alertsTitle')} icon={<IconAlertTriangle size={14} stroke={1.8} />}>
                {alerts.length === 0 ? (
                    <p className="text-[12.5px] text-slate-500 italic">{t('workerDetail.qualifications.alertsEmpty')}</p>
                ) : (
                    <ul className="space-y-2">
                        {alerts.map((a) => {
                            const tone = alertTone[a.level];
                            const Icon = alertIcon[a.level];
                            return (
                                <li
                                    key={a.id}
                                    className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${tone}`}
                                    role="alert"
                                >
                                    <Icon size={16} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12.5px] font-semibold">
                                            {t(`workerDetail.qualifications.alertLevel.${a.level}`, { defaultValue: a.level })} — {a.grandeur}
                                        </p>
                                        <p className="text-[11.5px] mt-0.5">
                                            {formatDateTime(a.triggeredAt)} • {formatMsv(a.value)} mSv
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>
        </>
    );
}

export default ExposedWorkerDetailPage;
