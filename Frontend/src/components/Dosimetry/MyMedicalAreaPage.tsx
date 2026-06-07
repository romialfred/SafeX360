/**
 * MyMedicalAreaPage — Phase 7 Frontend-B (LOT Dosimetrie & Expositions).
 *
 * Espace personnel "Mon dossier" — vue confidentielle du travailleur sur ses
 * propres donnees medicales / dosimetriques (RGPD art.15 droit d'acces).
 *
 * Route : /dosimetry/my-medical
 *
 * RBAC :
 *   - Tout user authentifie peut consulter SA PROPRE fiche.
 *   - Le filtre est appliqué cote backend par {@code userId} (employeeId).
 *   - Aucune permission specifique requise — un utilisateur non expose verra
 *     une page "vous n'etes pas inscrit au registre des travailleurs exposes".
 *
 * Strategie de resolution du workerId :
 *   - Le frontend interroge {@code POST /hns/dosimetry/exposed-worker/search}
 *     avec le mineId courant + un filtre client par {@code employeeId === user.id}.
 *   - Une fois le workerId resolu, on charge :
 *       getWorkerDetail (identite + cumul + alertes + thresholds)
 *       getCurrentFitnessPublic (aptitude — Public, sans donnees chiffrees)
 *       getWorkerMedicalVisitsSummary (historique visites — Summary)
 *
 * Sections rendues :
 *   1. Header sobre — nom, photo (placeholder), categorie, bandeau "Confidentiel".
 *   2. Mon aptitude — badge FIT / FIT_WITH_RESTRICTIONS / TEMPORARILY_UNFIT / UNFIT
 *      + publicRestrictionsSummary + validUntil + notice acces medical.
 *   3. Mes visites — type / date / status, sans detailedReport.
 *   4. Mes cumuls — 3 gauges Annuel / 5 ans / Vie + comparaison limite CIPR.
 *   5. Mes alertes — banner si une alerte ACTIVE existe sur les doses.
 *   6. Bouton "Telecharger mon attestation de dose" (lien Phase 9).
 *   7. Notice RGPD bas de page — droits art.15 + contact DPO.
 *
 * i18n : namespace `dosimetry`, sous-tree `myMedical.*`.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconUserCircle,
    IconHeartbeat,
    IconStethoscope,
    IconAtom2,
    IconShieldLock,
    IconShieldCheck,
    IconInfoCircle,
    IconCalendar,
    IconRefresh,
    IconAlertOctagon,
    IconDownload,
    IconCircleCheck,
    IconLockAccess,
    IconChevronRight,
    IconAlertTriangle,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import {
    getCurrentFitnessPublic,
    getWorkerMedicalVisitsSummary,
    getWorkerDetail,
    searchWorkers,
    downloadIndividualAttestation,
    type FitnessAssessmentPublicDTO,
    type FitnessLevel,
    type MedicalVisitSummaryDTO,
    type VisitStatus,
    type MedicalVisitType,
    type ExposedWorkerDetailDTO,
    type DoseCategory,
    type ExposureAlertDTO,
    type ThresholdDTO,
} from '../../services/DosimetryService';
import PdfDownloadModal from './PdfDownloadModal';
import DoseForecastCard from './DoseForecastCard';

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

const FITNESS_BADGE: Record<
    FitnessLevel,
    { dot: string; bg: string; text: string; border: string; ring: string; label: string }
> = {
    FIT: {
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        ring: 'ring-emerald-200',
        label: 'FIT',
    },
    FIT_WITH_RESTRICTIONS: {
        dot: 'bg-yellow-500',
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        ring: 'ring-yellow-200',
        label: 'FIT_WITH_RESTRICTIONS',
    },
    TEMPORARILY_UNFIT: {
        dot: 'bg-orange-500',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
        ring: 'ring-orange-200',
        label: 'TEMPORARILY_UNFIT',
    },
    UNFIT: {
        dot: 'bg-red-500',
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        ring: 'ring-red-200',
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

// ─────────────────────────────────────────────────────────────────────────────
//  Gauge tone — meme palette que Phase 4
// ─────────────────────────────────────────────────────────────────────────────

type GaugeTone = {
    ring: string;
    bar: string;
    text: string;
    bg: string;
    border: string;
    badge: string;
};

function gaugeTone(ratio: number | null | undefined): GaugeTone {
    if (ratio == null || Number.isNaN(ratio)) {
        return {
            ring: 'ring-emerald-200',
            bar: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
            text: 'text-emerald-700',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            badge: 'bg-emerald-100 text-emerald-800',
        };
    }
    if (ratio >= 1.0) {
        return {
            ring: 'ring-red-200',
            bar: 'bg-gradient-to-r from-red-500 to-red-600',
            text: 'text-red-700',
            bg: 'bg-red-50',
            border: 'border-red-200',
            badge: 'bg-red-100 text-red-800',
        };
    }
    if (ratio >= 0.75) {
        return {
            ring: 'ring-orange-200',
            bar: 'bg-gradient-to-r from-orange-500 to-orange-600',
            text: 'text-orange-700',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            badge: 'bg-orange-100 text-orange-800',
        };
    }
    if (ratio >= 0.5) {
        return {
            ring: 'ring-yellow-200',
            bar: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
            text: 'text-yellow-700',
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            badge: 'bg-yellow-100 text-yellow-800',
        };
    }
    return {
        ring: 'ring-emerald-200',
        bar: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800',
    };
}

/** Limite Hp(10) annuelle — fallback CIPR 103 si pas de seuil custom. */
function resolveHp10AnnualLimit(
    thresholds: ThresholdDTO[] | undefined,
    category: DoseCategory,
): number {
    if (thresholds && thresholds.length > 0) {
        const hp10 = thresholds.find((th) => th.grandeur === 'HP10');
        if (hp10?.regulatoryLimit != null && hp10.regulatoryLimit > 0) {
            return hp10.regulatoryLimit;
        }
    }
    return category === 'A' ? 20 : 6;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const MyMedicalAreaPage = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();

    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const currentUserId: number | null = useMemo(() => {
        const raw = user?.id ?? user?.employeeId ?? user?.userId ?? null;
        if (raw == null) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }, [user]);

    const mineId: number = useMemo(() => {
        const candidate = selectedMineId ?? user?.mineId ?? user?.companyId ?? null;
        const n = Number(candidate);
        return Number.isFinite(n) && n > 0 ? n : 1;
    }, [selectedMineId, user]);

    // ─── State ───
    const [resolvedWorkerId, setResolvedWorkerId] = useState<number | null>(null);
    const [resolutionFailed, setResolutionFailed] = useState(false);

    const [workerDetail, setWorkerDetail] = useState<ExposedWorkerDetailDTO | null>(null);
    const [currentFitness, setCurrentFitness] = useState<FitnessAssessmentPublicDTO | null>(null);
    const [visits, setVisits] = useState<MedicalVisitSummaryDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Phase 9-B : modal download "mon attestation".
    const [attestationModalOpen, setAttestationModalOpen] = useState(false);

    // ─── 1. Resoudre workerId via search + filtre client par employeeId ───
    const resolveWorkerId = useCallback(async () => {
        if (!currentUserId) {
            setResolutionFailed(true);
            setLoading(false);
            return null;
        }
        try {
            const list = await searchWorkers({ mineId });
            const arr: any[] = Array.isArray(list) ? list : (list?.content ?? []);
            // Le backend ExposedWorkerListItemDTO expose employeeId (id RH).
            const me = arr.find((w) => {
                const candidates = [w?.employeeId, w?.identity?.employeeId, w?.userId];
                return candidates.some((c) => c != null && Number(c) === currentUserId);
            });
            if (!me) {
                setResolutionFailed(true);
                return null;
            }
            const id = me.id ?? me.workerId ?? me.identity?.workerId ?? null;
            if (id == null) {
                setResolutionFailed(true);
                return null;
            }
            const numericId = Number(id);
            setResolvedWorkerId(numericId);
            return numericId;
        } catch {
            setResolutionFailed(true);
            return null;
        }
    }, [currentUserId, mineId]);

    // ─── 2. Charger les donnees pour le workerId resolu ───
    const fetchAll = useCallback(
        async (workerId: number) => {
            setLoading(true);
            setLoadError(null);
            try {
                const [detailRes, fitnessRes, visitsRes] = await Promise.allSettled([
                    getWorkerDetail(workerId),
                    getCurrentFitnessPublic(workerId),
                    getWorkerMedicalVisitsSummary(workerId),
                ]);
                if (detailRes.status === 'fulfilled') {
                    setWorkerDetail(detailRes.value as ExposedWorkerDetailDTO);
                }
                if (fitnessRes.status === 'fulfilled') {
                    setCurrentFitness(fitnessRes.value as FitnessAssessmentPublicDTO | null);
                }
                if (visitsRes.status === 'fulfilled') {
                    const data: any = visitsRes.value;
                    setVisits(Array.isArray(data) ? data : (data?.content ?? []));
                }
                if (
                    detailRes.status === 'rejected' &&
                    fitnessRes.status === 'rejected' &&
                    visitsRes.status === 'rejected'
                ) {
                    setLoadError(t('myMedical.loadError'));
                }
            } finally {
                setLoading(false);
            }
        },
        [t],
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const wid = await resolveWorkerId();
            if (cancelled || wid == null) return;
            await fetchAll(wid);
        })();
        return () => {
            cancelled = true;
        };
    }, [resolveWorkerId, fetchAll]);

    const handleRefresh = () => {
        if (resolvedWorkerId != null) {
            fetchAll(resolvedWorkerId);
        }
    };

    // ─── Donnees derivees ───
    const identity = workerDetail?.identity;
    const classification = workerDetail?.classification;
    const cumulative = workerDetail?.cumulative;
    const fitnessBadge = currentFitness ? FITNESS_BADGE[currentFitness.fitness] : null;
    const category: DoseCategory = classification?.category ?? 'B';

    const annualLimitHp10 = useMemo(
        () => resolveHp10AnnualLimit(workerDetail?.thresholds, category),
        [workerDetail, category],
    );

    const activeAlerts: ExposureAlertDTO[] = useMemo(() => {
        const all = workerDetail?.alerts ?? [];
        return all.filter((a) => a.status === 'ACTIVE');
    }, [workerDetail]);

    const displayName =
        identity?.fullName ?? user?.name ?? user?.username ?? user?.sub ?? '—';
    const initials = useMemo(() => {
        const src = (identity?.fullName ?? user?.name ?? '').trim();
        if (!src) return 'U';
        return src
            .split(/\s+/)
            .map((w: string) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }, [identity, user]);

    // ─── Cas 1 : pas de userId resolu ───
    if (!currentUserId) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-10">
                <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-10 text-center">
                    <IconShieldLock size={36} className="mx-auto text-slate-400 mb-3" />
                    <h2 className="text-slate-900 font-semibold text-lg mb-1">
                        {t('myMedical.unauthenticatedTitle')}
                    </h2>
                    <p className="text-slate-600 text-[13px]">
                        {t('myMedical.unauthenticatedBody')}
                    </p>
                </div>
            </div>
        );
    }

    // ─── Cas 2 : utilisateur non inscrit au registre des exposes ───
    if (resolutionFailed) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-10">
                <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-10 text-center">
                    <IconInfoCircle size={36} className="mx-auto text-indigo-500 mb-3" />
                    <h2 className="text-slate-900 font-semibold text-lg mb-1">
                        {t('myMedical.notExposedTitle')}
                    </h2>
                    <p className="text-slate-600 text-[13px] mb-4">
                        {t('myMedical.notExposedBody')}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                    >
                        {t('myMedical.backHome')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* ─── Bandeau confidentiel ─── */}
                <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[12px]">
                    <IconShieldLock size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span>{t('myMedical.confidentialBanner')}</span>
                </div>

                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('myMedical.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('myMedical.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── 1. Header sobre — identite ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                    <span className="text-white text-[16px] font-semibold tracking-wide">
                                        {initials}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10.5px] uppercase tracking-[0.16em] text-indigo-600 font-semibold mb-0.5">
                                        {t('myMedical.headerLabel')}
                                    </p>
                                    <h1
                                        className="text-slate-900 leading-tight"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontWeight: 600,
                                            fontSize: 'clamp(20px, 2.2vw, 26px)',
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        {displayName}
                                    </h1>
                                    <div className="text-[12.5px] text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                                        {identity?.matricule && (
                                            <>
                                                <span className="font-mono text-slate-800">
                                                    {identity.matricule}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                            </>
                                        )}
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                            <IconAtom2 size={11} stroke={2} />
                                            {t('myMedical.categoryLabel', {
                                                cat: category,
                                            })}
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

                            <div className="flex items-stretch gap-2">
                                <button
                                    type="button"
                                    onClick={handleRefresh}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition self-start"
                                    aria-label={t('myMedical.refresh')}
                                    disabled={loading}
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

                {/* ─── 5. Mes alertes — banner si alertes actives ─── */}
                {activeAlerts.length > 0 && (
                    <div className="mb-5 bg-white border-2 border-red-300 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-red-50 px-4 py-3 border-b border-red-200 flex items-center gap-2">
                            <IconAlertTriangle size={18} stroke={2} className="text-red-700" />
                            <div>
                                <p className="text-[13px] font-semibold text-red-900">
                                    {t('myMedical.alertsTitle', { count: activeAlerts.length })}
                                </p>
                                <p className="text-[11.5px] text-red-700">
                                    {t('myMedical.alertsSubtitle')}
                                </p>
                            </div>
                        </div>
                        <ul className="divide-y divide-red-100">
                            {activeAlerts.slice(0, 5).map((a, idx) => (
                                <li
                                    key={a.id ?? `alert-${idx}`}
                                    className="px-4 py-2.5 flex items-center gap-3 text-[12.5px]"
                                >
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-red-100 text-red-800 border border-red-200">
                                        <IconAlertOctagon size={11} stroke={2} />
                                        {t(`myMedical.alertLevel.${a.level}`, {
                                            defaultValue: a.level,
                                        })}
                                    </span>
                                    <span className="font-mono text-slate-800">{a.grandeur}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-700">
                                        {a.value.toFixed(2)} mSv
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-500">
                                        {formatDateTime(a.triggeredAt ?? a.createdAt)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ─── 2. Mon aptitude ─── */}
                <SectionCard
                    icon={<IconHeartbeat size={18} stroke={1.8} className="text-emerald-600" />}
                    title={t('myMedical.fitnessTitle')}
                    subtitle={t('myMedical.fitnessSubtitle')}
                >
                    {loading ? (
                        <div className="px-4 py-8 text-center text-slate-500">
                            <span className="inline-block w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mr-2 align-middle" />
                            {t('myMedical.loading')}
                        </div>
                    ) : currentFitness && fitnessBadge ? (
                        <div className="p-4">
                            {/* Grand badge couleur */}
                            <div
                                className={`flex flex-wrap items-center gap-4 px-5 py-4 rounded-2xl border-2 ${fitnessBadge.bg} ${fitnessBadge.border}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`w-5 h-5 rounded-full ${fitnessBadge.dot} ring-4 ${fitnessBadge.ring}`}
                                        aria-hidden="true"
                                    />
                                    <span
                                        className={`text-[20px] font-semibold ${fitnessBadge.text}`}
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {t(`medical.fitnessLevel.${currentFitness.fitness}`, {
                                            defaultValue: currentFitness.fitness,
                                        })}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 ml-auto">
                                    <div className="text-[12.5px] text-slate-700 flex items-center gap-1.5">
                                        <IconCalendar size={13} className="text-slate-400" />
                                        <span className="text-slate-500">
                                            {t('myMedical.validUntil')}
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {formatDate(currentFitness.validUntil)}
                                        </span>
                                    </div>
                                    {currentFitness.signed && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            <IconCircleCheck size={11} stroke={2} />
                                            {t('myMedical.signed')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* publicRestrictionsSummary */}
                            {currentFitness.publicRestrictionsSummary && (
                                <div className="mt-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                                    <p className="text-[10.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold mb-1">
                                        {t('myMedical.publicSummaryLabel')}
                                    </p>
                                    <p className="text-[13px] text-slate-800">
                                        {currentFitness.publicRestrictionsSummary}
                                    </p>
                                </div>
                            )}

                            {/* Notice acces medecin */}
                            <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11.5px]">
                                <IconLockAccess size={13} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                                <span>{t('myMedical.detailedRestrictionsNotice')}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center text-slate-500 text-[13px]">
                            <IconHeartbeat size={24} className="mx-auto text-slate-300 mb-2" />
                            {t('myMedical.noFitness')}
                        </div>
                    )}
                </SectionCard>

                {/* ─── 3. Mes visites ─── */}
                <SectionCard
                    icon={<IconStethoscope size={18} stroke={1.8} className="text-indigo-600" />}
                    title={t('myMedical.visitsTitle')}
                    subtitle={t('myMedical.visitsSubtitle', { count: visits.length })}
                >
                    {loading ? (
                        <div className="px-4 py-8 text-center text-slate-500">
                            <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                            {t('myMedical.loading')}
                        </div>
                    ) : visits.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-500 text-[13px]">
                            <IconStethoscope size={24} className="mx-auto text-slate-300 mb-2" />
                            {t('myMedical.noVisits')}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12.5px]">
                                <thead>
                                    <tr className="bg-slate-50/80 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-500">
                                        <th className="px-4 py-2 font-semibold">
                                            {t('myMedical.tableVisits.type')}
                                        </th>
                                        <th className="px-4 py-2 font-semibold">
                                            {t('myMedical.tableVisits.date')}
                                        </th>
                                        <th className="px-4 py-2 font-semibold">
                                            {t('myMedical.tableVisits.status')}
                                        </th>
                                        <th className="px-4 py-2 font-semibold">
                                            {t('myMedical.tableVisits.timeline')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visits.map((v, idx) => {
                                        const dateRef = v.performedDate ?? v.scheduledDate ?? null;
                                        const isPast =
                                            v.status === 'PERFORMED' ||
                                            v.status === 'MISSED' ||
                                            v.status === 'CANCELLED';
                                        return (
                                            <tr
                                                key={v.id ?? `vrow-${idx}`}
                                                className="border-t border-slate-100 hover:bg-indigo-50/30 transition"
                                            >
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
                                                <td className="px-4 py-2.5 text-slate-700">
                                                    <span className="inline-flex items-center gap-1">
                                                        <IconCalendar
                                                            size={11}
                                                            className="text-slate-400"
                                                        />
                                                        {formatDate(dateRef)}
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
                                                <td className="px-4 py-2.5">
                                                    {isPast ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                            {t('myMedical.timelinePast')}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            {t('myMedical.timelineUpcoming')}
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

                {/* ─── 4. Mes cumuls — 3 gauges ─── */}
                <SectionCard
                    icon={<IconAtom2 size={18} stroke={1.8} className="text-violet-600" />}
                    title={t('myMedical.cumulTitle')}
                    subtitle={t('myMedical.cumulSubtitle', {
                        year: new Date().getFullYear(),
                    })}
                >
                    {loading ? (
                        <div className="px-4 py-8 text-center text-slate-500">
                            <span className="inline-block w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin mr-2 align-middle" />
                            {t('myMedical.loading')}
                        </div>
                    ) : (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <DoseGauge
                                label={t('myMedical.gaugeAnnual')}
                                sublabel={t('myMedical.gaugeAnnualSub', {
                                    limit: annualLimitHp10,
                                    cat: category,
                                })}
                                value={cumulative?.annualHp10 ?? null}
                                limit={annualLimitHp10}
                            />
                            <DoseGauge
                                label={t('myMedical.gauge5y')}
                                sublabel={t('myMedical.gauge5ySub')}
                                value={cumulative?.rolling5yHp10 ?? null}
                                limit={100}
                            />
                            <DoseGauge
                                label={t('myMedical.gaugeLifetime')}
                                sublabel={t('myMedical.gaugeLifetimeSub')}
                                value={cumulative?.lifetimeHp10 ?? null}
                                limit={400}
                            />
                        </div>
                    )}
                    <div className="px-4 py-3 border-t border-slate-100 flex items-start gap-2 bg-slate-50/60 text-[11.5px] text-slate-600">
                        <IconShieldCheck size={13} stroke={1.8} className="mt-0.5 text-emerald-600 flex-shrink-0" />
                        <span>{t('myMedical.iprcNotice')}</span>
                    </div>
                </SectionCard>

                {/* ─── 5.bis Phase 10-B : Prevision dose annuelle Hp(10) ─── */}
                {resolvedWorkerId != null && (
                    <div className="mb-5">
                        <DoseForecastCard
                            workerId={resolvedWorkerId}
                            currentYear={new Date().getFullYear()}
                            annualLimitHp10={annualLimitHp10}
                        />
                    </div>
                )}

                {/* ─── 6. Bouton attestation ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[13px] text-slate-800 font-semibold">
                            {t('myMedical.attestationTitle')}
                        </p>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                            {t('myMedical.attestationSubtitle')}
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={resolvedWorkerId == null}
                        onClick={() => setAttestationModalOpen(true)}
                        title={t('myMedical.attestationCtaHint')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition self-start shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IconDownload size={13} stroke={2} />
                        {t('myMedical.attestationCta')}
                    </button>
                </div>

                {/* ─── 7. Notice RGPD bas de page ─── */}
                <div className="mb-2 bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <IconShieldLock size={16} stroke={1.8} className="text-indigo-700" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold text-slate-800">
                                {t('myMedical.rgpdFooterTitle')}
                            </p>
                            <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                                {t('myMedical.rgpdFooterBody')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Phase 9-B : modal download "mon attestation" (SELF) ─── */}
            <PdfDownloadModal
                opened={attestationModalOpen}
                onClose={() => setAttestationModalOpen(false)}
                title={t('myMedical.attestationModalTitle')}
                subtitle={t('myMedical.attestationModalSubtitle')}
                filename={`mon_attestation_${(identity?.matricule ?? 'self').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().getFullYear()}.pdf`}
                lockReason={t('myMedical.attestationSelfReason')}
                onConfirm={(reasonStr) =>
                    downloadIndividualAttestation(
                        Number(resolvedWorkerId ?? 0),
                        new Date().getFullYear(),
                        reasonStr,
                    )
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
    children: React.ReactNode;
}

function SectionCard({ icon, title, subtitle, children }: SectionCardProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-5 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                {icon}
                <div>
                    <h3 className="text-[14px] font-semibold text-slate-800">{title}</h3>
                    {subtitle && (
                        <p className="text-[11.5px] text-slate-500">{subtitle}</p>
                    )}
                </div>
            </div>
            <div>{children}</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : Gauge dose
// ─────────────────────────────────────────────────────────────────────────────

interface DoseGaugeProps {
    label: string;
    sublabel?: string;
    value: number | null;
    limit: number;
}

function DoseGauge({ label, sublabel, value, limit }: DoseGaugeProps) {
    const { t } = useTranslation('dosimetry');
    const ratio = value != null && limit > 0 ? value / limit : null;
    const tone = gaugeTone(ratio);
    const pct = ratio != null ? Math.min(100, Math.max(0, ratio * 100)) : 0;
    const displayValue = value != null ? value.toFixed(2) : '—';
    const ratioLabel =
        ratio != null ? `${(ratio * 100).toFixed(0)}%` : t('myMedical.gaugeNoData');

    return (
        <div className={`rounded-xl border p-4 ${tone.bg} ${tone.border}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.10em] text-slate-600 font-semibold">
                        {label}
                    </p>
                    {sublabel && (
                        <p className="text-[10.5px] text-slate-500 mt-0.5">{sublabel}</p>
                    )}
                </div>
                <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${tone.badge}`}
                >
                    {ratioLabel}
                </span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-[24px] font-semibold ${tone.text}`}>
                    {displayValue}
                </span>
                <span className="text-[11.5px] text-slate-500">
                    / {limit} {t('myMedical.gaugeUnit')}
                </span>
            </div>
            <div
                className="w-full h-2 rounded-full bg-white/70 border border-slate-200 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={`h-full ${tone.bar} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default MyMedicalAreaPage;
