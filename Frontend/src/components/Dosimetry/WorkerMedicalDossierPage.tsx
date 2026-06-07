/**
 * WorkerMedicalDossierPage — Phase 7 Frontend-A (LOT Dosimetrie & Expositions).
 *
 * Dossier medical complet d'un travailleur expose — vue cloisonnee par RBAC.
 *
 * Route : /dosimetry/medical/worker/:workerId
 *
 * Sections :
 *   1. Identite worker (lien fiche 360 dosimetrie)
 *   2. Aptitude courante : badge couleur + dates valide jusqu'a + publicSummary
 *      + bouton "Voir restrictions detaillees" (MEDICAL only, audit log declenche
 *        via reason input obligatoire)
 *   3. Historique visites : timeline + DataTable
 *   4. Historique aptitudes : DataTable avec evolution
 *   5. Liens transverses : Doses (Phase 4) + Cas surexposition (Phase 5)
 *   6. Boutons "+ Nouvelle visite" + "+ Nouvelle aptitude" (MEDICAL only)
 *
 * RBAC :
 *   - MEDICAL : voit tout (Summary + Full + restrictions dechiffrees + reason audit)
 *   - PCR_RPO : voit Summary + Public (fitness niveau + summary), pas de cleartext
 *   - SELF (DOSIMETRY_READ_NOMINATIVE) : voit son propre dossier (Public uniquement)
 *   - autres : bloque par UI gate
 *
 * i18n : namespace `dosimetry`, sous-tree `medical.dossier.*`.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, Textarea, Button, Group, Tooltip } from '@mantine/core';
import {
    IconUserCircle,
    IconChevronRight,
    IconShieldLock,
    IconStethoscope,
    IconHeartbeat,
    IconCalendar,
    IconPlus,
    IconRefresh,
    IconAlertOctagon,
    IconInfoCircle,
    IconAtom2,
    IconFolderOpen,
    IconClipboardList,
    IconFileText,
    IconCircleCheck,
    IconArrowLeft,
    IconExternalLink,
    IconLockAccess,
    IconKey,
    IconFileCertificate,
    IconHistory,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { errorNotification } from '../../utility/NotificationUtility';
import {
    getCurrentFitnessPublic,
    getFitnessHistoryPublic,
    getCurrentFitnessFull,
    getWorkerMedicalVisitsSummary,
    getWorkerMedicalVisitsFull,
    getWorkerDetail,
    downloadIndividualAttestation,
    downloadCareerSummary,
    type FitnessAssessmentPublicDTO,
    type FitnessAssessmentFullDTO,
    type FitnessLevel,
    type MedicalVisitSummaryDTO,
    type MedicalVisitFullDTO,
    type VisitStatus,
    type MedicalVisitType,
    type ExposedWorkerDetailDTO,
} from '../../services/DosimetryService';
import PdfDownloadModal from './PdfDownloadModal';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper
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
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

const FITNESS_BADGE: Record<FitnessLevel, { dot: string; bg: string; text: string; border: string; label: string }> = {
    FIT: {
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        label: 'FIT',
    },
    FIT_WITH_RESTRICTIONS: {
        dot: 'bg-yellow-500',
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        label: 'FIT_WITH_RESTRICTIONS',
    },
    TEMPORARILY_UNFIT: {
        dot: 'bg-orange-500',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
        label: 'TEMPORARILY_UNFIT',
    },
    UNFIT: {
        dot: 'bg-red-500',
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        label: 'UNFIT',
    },
};

const STATUS_BADGE: Record<VisitStatus, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800 border border-blue-200',
    PERFORMED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-700 border border-slate-200',
    MISSED: 'bg-red-100 text-red-800 border border-red-200',
};

const TYPE_BADGE: Record<MedicalVisitType, string> = {
    INITIAL: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    PERIODIC_ANNUAL: 'bg-blue-100 text-blue-800 border border-blue-200',
    POST_EXPOSURE: 'bg-red-100 text-red-800 border border-red-200',
    FOLLOWUP: 'bg-amber-100 text-amber-800 border border-amber-200',
    FINAL_AT_DEPARTURE: 'bg-slate-100 text-slate-700 border border-slate-200',
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

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const WorkerMedicalDossierPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const { workerId: workerIdParam } = useParams();

    const user = useAppSelector((state: any) => state.user);
    const canMedical = hasDosimetryPermission(user, 'DOSIMETRY_MEDICAL');
    const canPcr = hasDosimetryPermission(user, 'DOSIMETRY_PCR_RPO');
    const canSelf = hasDosimetryPermission(user, 'DOSIMETRY_READ_NOMINATIVE');
    const canView = canMedical || canPcr || canSelf;

    const [workerDetail, setWorkerDetail] = useState<ExposedWorkerDetailDTO | null>(null);
    const [currentFitnessPublic, setCurrentFitnessPublic] = useState<FitnessAssessmentPublicDTO | null>(null);
    const [fitnessHistoryPublic, setFitnessHistoryPublic] = useState<FitnessAssessmentPublicDTO[]>([]);
    const [visitsSummary, setVisitsSummary] = useState<MedicalVisitSummaryDTO[]>([]);
    const [visitsFull, setVisitsFull] = useState<MedicalVisitFullDTO[]>([]);
    const [currentFitnessFull, setCurrentFitnessFull] = useState<FitnessAssessmentFullDTO | null>(null);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Reason modal state pour acceder aux donnees Full
    const [reasonOpen, setReasonOpen] = useState<null | 'fitness' | 'visits'>(null);
    const [reason, setReason] = useState('');
    const [reasonLoading, setReasonLoading] = useState(false);

    // Phase 9-B : modales de download attestation + fiche carriere.
    const [attestationModalOpen, setAttestationModalOpen] = useState(false);
    const [careerModalOpen, setCareerModalOpen] = useState(false);

    // ───── Fetch ─────
    const fetchSummary = useCallback(async () => {
        if (!canView || !workerIdParam) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError(null);
        try {
            const [detailRes, currentRes, historyRes, visitsRes] = await Promise.allSettled([
                getWorkerDetail(workerIdParam),
                getCurrentFitnessPublic(workerIdParam),
                getFitnessHistoryPublic(workerIdParam),
                getWorkerMedicalVisitsSummary(workerIdParam),
            ]);
            if (detailRes.status === 'fulfilled') {
                setWorkerDetail(detailRes.value as ExposedWorkerDetailDTO);
            }
            if (currentRes.status === 'fulfilled') {
                setCurrentFitnessPublic(currentRes.value as FitnessAssessmentPublicDTO | null);
            }
            if (historyRes.status === 'fulfilled') {
                const list: any = historyRes.value;
                setFitnessHistoryPublic(Array.isArray(list) ? list : []);
            }
            if (visitsRes.status === 'fulfilled') {
                const list: any = visitsRes.value;
                setVisitsSummary(Array.isArray(list) ? list : []);
            }
            if (
                detailRes.status === 'rejected' &&
                currentRes.status === 'rejected' &&
                historyRes.status === 'rejected' &&
                visitsRes.status === 'rejected'
            ) {
                setLoadError(t('medical.dossier.loadError'));
            }
        } finally {
            setLoading(false);
        }
    }, [canView, workerIdParam, t]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    // ─── Reason submit -> charge le Full ───
    const handleReasonSubmit = async () => {
        if (!workerIdParam || !reason.trim()) return;
        setReasonLoading(true);
        try {
            if (reasonOpen === 'fitness') {
                const full = await getCurrentFitnessFull(workerIdParam, reason.trim());
                setCurrentFitnessFull(full);
            } else if (reasonOpen === 'visits') {
                const list = await getWorkerMedicalVisitsFull(workerIdParam, reason.trim());
                setVisitsFull(list);
            }
            setReasonOpen(null);
            setReason('');
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.message ?? t('medical.dossier.errors.reasonFailed');
            errorNotification(typeof msg === 'string' ? msg : t('medical.dossier.errors.reasonFailed'));
        } finally {
            setReasonLoading(false);
        }
    };

    const identity = workerDetail?.identity;
    const fitnessBadge = currentFitnessPublic ? FITNESS_BADGE[currentFitnessPublic.fitness] : null;

    const fullVisitsById = useMemo(() => {
        const map = new Map<number, MedicalVisitFullDTO>();
        for (const v of visitsFull) {
            if (v.id != null) map.set(v.id, v);
        }
        return map;
    }, [visitsFull]);

    // ─── RBAC GATE ───
    if (!canView) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-10">
                <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-10 text-center">
                    <IconShieldLock size={36} className="mx-auto text-red-500 mb-3" />
                    <h2 className="text-slate-900 font-semibold text-lg mb-1">
                        {t('medical.dossier.rbacBlockedTitle')}
                    </h2>
                    <p className="text-slate-600 text-[13px]">
                        {t('medical.dossier.rbacBlockedBody')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* RGPD banner */}
                <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[12px]">
                    <IconShieldLock size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span>{t('medical.rgpdBanner')}</span>
                </div>

                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/medical/planning')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('medical.dossier.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('medical.dossier.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── 1. Identite worker ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                    aria-label={t('medical.dossier.back')}
                                >
                                    <IconArrowLeft size={16} stroke={1.8} />
                                </button>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200 flex-shrink-0">
                                    <IconUserCircle size={22} stroke={1.8} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h1
                                        className="text-slate-900 leading-tight"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 'clamp(20px, 2.2vw, 26px)',
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        {identity?.fullName ?? t('medical.dossier.unknownWorker')}
                                    </h1>
                                    <div className="text-[12.5px] text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-slate-800">
                                            {identity?.matricule ?? `#${workerIdParam}`}
                                        </span>
                                        {identity?.position && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span>{identity.position}</span>
                                            </>
                                        )}
                                        {identity?.department && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span>{identity.department}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-stretch gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/dosimetry/workers/detail/${workerIdParam}`)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition self-start"
                                >
                                    <IconExternalLink size={13} stroke={1.8} />
                                    {t('medical.dossier.viewFullProfile')}
                                </button>
                                {canMedical && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/dosimetry/medical/visit/new?workerId=${workerIdParam}`,
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition self-start shadow-sm"
                                        >
                                            <IconPlus size={13} stroke={2} />
                                            {t('medical.dossier.newVisit')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/dosimetry/medical/fitness/new?workerId=${workerIdParam}`,
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition self-start shadow-sm"
                                        >
                                            <IconPlus size={13} stroke={2} />
                                            {t('medical.dossier.newFitness')}
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setAttestationModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition self-start"
                                    title={t('medical.dossier.downloadAttestationHint')}
                                >
                                    <IconFileCertificate size={13} stroke={1.8} />
                                    {t('medical.dossier.downloadAttestation')}
                                </button>
                                {(canMedical || canSelf) && (
                                    <button
                                        type="button"
                                        onClick={() => setCareerModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 transition self-start"
                                        title={t('medical.dossier.downloadCareerHint')}
                                    >
                                        <IconHistory size={13} stroke={1.8} />
                                        {t('medical.dossier.downloadCareer')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={fetchSummary}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition self-start"
                                    aria-label={t('medical.dossier.refresh')}
                                >
                                    <IconRefresh size={13} stroke={1.8} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {loadError && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── 2. Aptitude courante ─── */}
                <SectionCard
                    icon={<IconHeartbeat size={18} stroke={1.8} className="text-emerald-600" />}
                    title={t('medical.dossier.currentFitnessTitle')}
                    subtitle={t('medical.dossier.currentFitnessSubtitle')}
                >
                    {loading ? (
                        <div className="px-4 py-8 text-center text-slate-500">
                            <span className="inline-block w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mr-2 align-middle" />
                            {t('medical.dossier.loading')}
                        </div>
                    ) : currentFitnessPublic && fitnessBadge ? (
                        <div className="p-4">
                            <div
                                className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border ${fitnessBadge.bg} ${fitnessBadge.border}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${fitnessBadge.dot}`} />
                                    <span className={`text-[15px] font-semibold ${fitnessBadge.text}`}>
                                        {t(`medical.fitnessLevel.${currentFitnessPublic.fitness}`, {
                                            defaultValue: currentFitnessPublic.fitness,
                                        })}
                                    </span>
                                </div>
                                <span className="text-slate-300">|</span>
                                <div className="text-[12.5px] text-slate-700 flex items-center gap-1">
                                    <IconCalendar size={12} className="text-slate-400" />
                                    {t('medical.dossier.validUntil')}{' '}
                                    <span className="font-semibold">
                                        {formatDate(currentFitnessPublic.validUntil)}
                                    </span>
                                </div>
                                {currentFitnessPublic.reviewRequiredDate && (
                                    <>
                                        <span className="text-slate-300">|</span>
                                        <div className="text-[12.5px] text-slate-700 flex items-center gap-1">
                                            <IconAlertOctagon size={12} className="text-orange-500" />
                                            {t('medical.dossier.reviewRequired')}{' '}
                                            <span className="font-semibold">
                                                {formatDate(currentFitnessPublic.reviewRequiredDate)}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {currentFitnessPublic.signed && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <IconCircleCheck size={11} stroke={2} />
                                        {t('medical.dossier.signed')}
                                    </span>
                                )}
                            </div>
                            {currentFitnessPublic.publicRestrictionsSummary && (
                                <div className="mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[12.5px] text-slate-700">
                                    <p className="text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold mb-1">
                                        {t('medical.dossier.publicSummaryLabel')}
                                    </p>
                                    <p>{currentFitnessPublic.publicRestrictionsSummary}</p>
                                </div>
                            )}

                            {canMedical && (
                                <div className="mt-3 flex flex-wrap items-start gap-2">
                                    {currentFitnessFull?.restrictions ? (
                                        <div className="w-full px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[12.5px] text-red-900">
                                            <p className="text-[10.5px] uppercase tracking-[0.10em] text-red-700 font-semibold mb-1 flex items-center gap-1">
                                                <IconLockAccess size={11} />
                                                {t('medical.dossier.restrictionsLabel')}
                                            </p>
                                            <p className="whitespace-pre-wrap">{currentFitnessFull.restrictions}</p>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setReasonOpen('fitness')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition"
                                        >
                                            <IconKey size={13} stroke={1.8} />
                                            {t('medical.dossier.viewRestrictions')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center text-slate-500 text-[13px]">
                            <IconHeartbeat size={24} className="mx-auto text-slate-300 mb-2" />
                            {t('medical.dossier.noFitness')}
                        </div>
                    )}
                </SectionCard>

                {/* ─── 3. Historique visites ─── */}
                <SectionCard
                    icon={<IconStethoscope size={18} stroke={1.8} className="text-indigo-600" />}
                    title={t('medical.dossier.visitsTitle')}
                    subtitle={t('medical.dossier.visitsSubtitle', { count: visitsSummary.length })}
                    action={
                        canMedical && visitsFull.length === 0 ? (
                            <button
                                type="button"
                                onClick={() => setReasonOpen('visits')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition"
                            >
                                <IconKey size={13} stroke={1.8} />
                                {t('medical.dossier.viewVisitsFull')}
                            </button>
                        ) : null
                    }
                >
                    {visitsSummary.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-500 text-[13px]">
                            <IconStethoscope size={24} className="mx-auto text-slate-300 mb-2" />
                            {t('medical.dossier.noVisits')}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12.5px]">
                                <thead>
                                    <tr className="bg-slate-50/80 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-500">
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableVisits.scheduled')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableVisits.performed')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableVisits.type')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableVisits.status')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableVisits.physician')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableVisits.conclusion')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visitsSummary.map((v, idx) => {
                                        const full = v.id != null ? fullVisitsById.get(v.id) : null;
                                        return (
                                            <tr
                                                key={v.id ?? `vrow-${idx}`}
                                                className="border-t border-slate-100 hover:bg-indigo-50/30 transition"
                                            >
                                                <td className="px-4 py-2.5 text-slate-700">
                                                    <span className="inline-flex items-center gap-1">
                                                        <IconCalendar size={11} className="text-slate-400" />
                                                        {formatDate(v.scheduledDate)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-700">
                                                    {formatDate(v.performedDate)}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                                                            TYPE_BADGE[v.visitType] ?? ''
                                                        }`}
                                                    >
                                                        {t(`medical.visitType.${v.visitType}`, {
                                                            defaultValue: v.visitType,
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${
                                                            STATUS_BADGE[v.status] ?? ''
                                                        }`}
                                                    >
                                                        {t(`medical.visitStatus.${v.status}`, {
                                                            defaultValue: v.status,
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-700">
                                                    {v.physicianName ?? '—'}
                                                </td>
                                                <td
                                                    className="px-4 py-2.5 text-slate-700 max-w-[280px]"
                                                    title={v.generalConclusion ?? ''}
                                                >
                                                    <span className="line-clamp-2">
                                                        {v.generalConclusion ?? '—'}
                                                    </span>
                                                    {full?.detailedReport && (
                                                        <div className="mt-1 px-2 py-1 rounded bg-red-50 border border-red-200 text-[11px] text-red-900">
                                                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.10em] font-semibold text-red-700 mb-0.5">
                                                                <IconLockAccess size={9} />
                                                                {t('medical.dossier.detailedReport')}
                                                            </span>
                                                            <div className="whitespace-pre-wrap">
                                                                {full.detailedReport}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>

                {/* ─── 4. Historique aptitudes ─── */}
                <SectionCard
                    icon={<IconClipboardList size={18} stroke={1.8} className="text-teal-600" />}
                    title={t('medical.dossier.fitnessHistoryTitle')}
                    subtitle={t('medical.dossier.fitnessHistorySubtitle', {
                        count: fitnessHistoryPublic.length,
                    })}
                >
                    {fitnessHistoryPublic.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-500 text-[13px]">
                            <IconClipboardList size={24} className="mx-auto text-slate-300 mb-2" />
                            {t('medical.dossier.noFitnessHistory')}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12.5px]">
                                <thead>
                                    <tr className="bg-slate-50/80 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-500">
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableFitness.date')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableFitness.level')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableFitness.validUntil')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableFitness.summary')}</th>
                                        <th className="px-4 py-2 font-semibold">{t('medical.dossier.tableFitness.signed')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fitnessHistoryPublic.map((f, idx) => {
                                        const badge = FITNESS_BADGE[f.fitness];
                                        return (
                                            <tr
                                                key={f.id ?? `frow-${idx}`}
                                                className="border-t border-slate-100 hover:bg-teal-50/20 transition"
                                            >
                                                <td className="px-4 py-2.5 text-slate-700">
                                                    {formatDate(f.assessmentDate)}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                                                        {t(`medical.fitnessLevel.${f.fitness}`, {
                                                            defaultValue: f.fitness,
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-700">
                                                    {formatDate(f.validUntil)}
                                                </td>
                                                <td
                                                    className="px-4 py-2.5 text-slate-700 max-w-[300px]"
                                                    title={f.publicRestrictionsSummary ?? ''}
                                                >
                                                    <span className="line-clamp-2">
                                                        {f.publicRestrictionsSummary ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {f.signed ? (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            <IconCircleCheck size={11} stroke={2} />
                                                            {t('medical.dossier.signed')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10.5px] text-amber-700">
                                                            {t('medical.dossier.draft')}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>

                {/* ─── 5. Liens transverses Doses + Surexposition ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <button
                        type="button"
                        onClick={() => navigate(`/dosimetry/doses/by-worker/${workerIdParam}`)}
                        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 text-left hover:bg-indigo-50/30 hover:border-indigo-300 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <IconAtom2 size={20} stroke={1.8} className="text-indigo-700" />
                            </div>
                            <div>
                                <p className="text-[10.5px] uppercase tracking-[0.10em] text-indigo-700 font-semibold">
                                    {t('medical.dossier.linkDosesLabel')}
                                </p>
                                <p className="text-[13px] text-slate-800 font-semibold">
                                    {t('medical.dossier.linkDosesTitle')}
                                </p>
                                <p className="text-[11.5px] text-slate-500 mt-0.5">
                                    {t('medical.dossier.linkDosesSubtitle')}
                                </p>
                            </div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            navigate(`/dosimetry/overexposure?workerId=${workerIdParam}`)
                        }
                        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 text-left hover:bg-red-50/30 hover:border-red-300 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                <IconFolderOpen size={20} stroke={1.8} className="text-red-700" />
                            </div>
                            <div>
                                <p className="text-[10.5px] uppercase tracking-[0.10em] text-red-700 font-semibold">
                                    {t('medical.dossier.linkOverexposureLabel')}
                                </p>
                                <p className="text-[13px] text-slate-800 font-semibold">
                                    {t('medical.dossier.linkOverexposureTitle')}
                                </p>
                                <p className="text-[11.5px] text-slate-500 mt-0.5">
                                    {t('medical.dossier.linkOverexposureSubtitle')}
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* ─── Modal "Reason" pour acceder aux donnees Full ─── */}
            <Modal
                opened={reasonOpen !== null}
                onClose={() => {
                    setReasonOpen(null);
                    setReason('');
                }}
                title={
                    <span className="flex items-center gap-2">
                        <IconLockAccess size={16} className="text-red-600" />
                        {t('medical.dossier.reasonModalTitle')}
                    </span>
                }
                centered
                size="md"
            >
                <div className="space-y-3">
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-900 text-[12px]">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{t('medical.dossier.reasonModalBody')}</span>
                    </div>
                    <Textarea
                        size="sm"
                        label={t('medical.dossier.reasonLabel')}
                        placeholder={t('medical.dossier.reasonPlaceholder')}
                        minRows={3}
                        autosize
                        value={reason}
                        onChange={(e) => setReason(e.currentTarget.value)}
                        required
                    />
                    <Group justify="flex-end">
                        <Button
                            variant="default"
                            onClick={() => {
                                setReasonOpen(null);
                                setReason('');
                            }}
                            disabled={reasonLoading}
                        >
                            {t('medical.dossier.cancel')}
                        </Button>
                        <Button
                            color="red"
                            leftSection={<IconKey size={14} />}
                            onClick={handleReasonSubmit}
                            loading={reasonLoading}
                            disabled={!reason.trim()}
                            styles={{
                                root: { backgroundColor: '#DC2626', color: 'white' },
                            }}
                        >
                            {t('medical.dossier.reasonSubmit')}
                        </Button>
                    </Group>
                </div>
            </Modal>

            {/* ─── Phase 9-B : modal download attestation annuelle ─── */}
            <PdfDownloadModal
                opened={attestationModalOpen}
                onClose={() => setAttestationModalOpen(false)}
                title={t('reports.cards.attestation.modalTitle')}
                subtitle={t('reports.cards.attestation.modalSubtitle')}
                filename={`attestation_${(identity?.matricule ?? workerIdParam ?? 'worker').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().getFullYear()}.pdf`}
                onConfirm={(reasonStr) =>
                    downloadIndividualAttestation(
                        Number(workerIdParam),
                        new Date().getFullYear(),
                        reasonStr,
                    )
                }
            />

            {/* ─── Phase 9-B : modal download fiche carriere ─── */}
            <PdfDownloadModal
                opened={careerModalOpen}
                onClose={() => setCareerModalOpen(false)}
                title={t('reports.cards.career.modalTitle')}
                subtitle={t('reports.cards.career.modalSubtitle')}
                filename={`fiche_carriere_${(identity?.matricule ?? workerIdParam ?? 'worker').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
                onConfirm={(reasonStr) =>
                    downloadCareerSummary(Number(workerIdParam), reasonStr)
                }
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : Section card
// ─────────────────────────────────────────────────────────────────────────────

interface SectionCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}

function SectionCard({ icon, title, subtitle, action, children }: SectionCardProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-5 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    {icon}
                    <div>
                        <h3 className="text-[14px] font-semibold text-slate-800">{title}</h3>
                        {subtitle && (
                            <p className="text-[11.5px] text-slate-500">{subtitle}</p>
                        )}
                    </div>
                </div>
                {action}
            </div>
            <div>{children}</div>
        </div>
    );
}

export default WorkerMedicalDossierPage;
