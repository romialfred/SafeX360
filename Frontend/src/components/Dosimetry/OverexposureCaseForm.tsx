/**
 * OverexposureCaseForm — Phase 5 Frontend-C (LOT Dosimetrie & Expositions).
 *
 * Formulaire premium d'ouverture d'un dossier de depassement (workflow OPEN ->
 * INVESTIGATING -> CLOSED). Stepper 3 etapes Mantine.
 *
 * Route :
 *   /dosimetry/overexposure/new?alertId=X ou ?workerId=X (les deux pre-remplissables)
 *
 * Etapes :
 *   1. Selection alerte :
 *      - Si alertId pre-rempli : afficher en read-only (worker + level auto)
 *      - Sinon : Select alertes EXCEEDED non encore liees a un case ouvert,
 *                ou case "ouverture manuelle" (workerId requis + level requis)
 *   2. Caracterisation :
 *      - Niveau (auto depuis l'alerte / select si manuel)
 *      - Cause initiale (textarea obligatoire)
 *      - Mesures conservatoires immediates (textarea)
 *   3. Confirmation :
 *      - Recap des champs
 *      - Checkbox "Je confirme l'ouverture officielle du dossier"
 *      - Notification automatique au PCR/RPO + medecin du travail (placeholder log)
 *
 * Submit : DosimetryService.openOverexposureCase() puis navigate('/dosimetry/overexposure/{id}').
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Stepper,
    Paper,
    Group,
    Button,
    Select,
    Textarea,
    Checkbox,
    Text,
    Alert,
    Badge,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconArrowRight,
    IconChevronRight,
    IconAlertOctagon,
    IconClipboardList,
    IconShieldCheck,
    IconCheck,
    IconUserCircle,
    IconInfoCircle,
    IconBell,
    IconFolderPlus,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import {
    getAllAlerts,
    getOverexposureCases,
    searchWorkers,
    openOverexposureCase,
    type ExposureAlertDTO,
    type OverexposureCaseDTO,
    type AlertLevel,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

interface WorkerLite {
    id: number;
    matricule: string;
    fullName: string;
}

interface AlertLite {
    id: number;
    workerId: number;
    level: AlertLevel;
    grandeur: string;
    value: number;
    triggeredAt?: string | null;
}

const ALL_LEVELS: AlertLevel[] = ['APPROACH', 'INVESTIGATION', 'ACTION', 'EXCEEDED'];

const LEVEL_BADGE: Record<AlertLevel, string> = {
    APPROACH: 'bg-blue-100 text-blue-900 border border-blue-200',
    INVESTIGATION: 'bg-yellow-100 text-yellow-900 border border-yellow-200',
    ACTION: 'bg-orange-100 text-orange-900 border border-orange-200',
    EXCEEDED: 'bg-red-100 text-red-900 border border-red-300',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const OverexposureCaseForm = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const presetAlertId = searchParams.get('alertId');
    const presetWorkerId = searchParams.get('workerId');

    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const mineId: number = selectedMineId ?? user?.mineId ?? user?.companyId ?? 1;

    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const [alerts, setAlerts] = useState<AlertLite[]>([]);
    const [workers, setWorkers] = useState<WorkerLite[]>([]);
    const [linkedAlertIds, setLinkedAlertIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    // Form state
    const [manualMode, setManualMode] = useState(false);
    const [alertId, setAlertId] = useState<string>('');
    const [workerId, setWorkerId] = useState<string>('');
    const [level, setLevel] = useState<AlertLevel>('EXCEEDED');
    const [cause, setCause] = useState('');
    const [conservatory, setConservatory] = useState('');
    const [confirmed, setConfirmed] = useState(false);

    // ───── Chargement initial ─────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [alertsResult, casesResult, workersResult] = await Promise.allSettled([
                getAllAlerts(),
                getOverexposureCases(),
                searchWorkers({ mineId }),
            ]);

            // Alertes EXCEEDED disponibles
            if (alertsResult.status === 'fulfilled') {
                const list: any = alertsResult.value;
                const arr: ExposureAlertDTO[] = Array.isArray(list) ? list : (list?.content ?? []);
                const lite = arr
                    .filter((a) => a.level === 'EXCEEDED')
                    .map((a) => ({
                        id: Number(a.id ?? 0),
                        workerId: Number(a.workerId ?? 0),
                        level: a.level,
                        grandeur: String(a.grandeur ?? ''),
                        value: Number(a.value ?? 0),
                        triggeredAt: a.triggeredAt ?? null,
                    }))
                    .filter((a) => a.id > 0);
                setAlerts(lite);
            }

            // Cases existants pour exclure les alertes deja liees a un case OPEN/INVESTIGATING
            if (casesResult.status === 'fulfilled') {
                const arr: OverexposureCaseDTO[] = Array.isArray(casesResult.value)
                    ? casesResult.value
                    : [];
                const linked = new Set<number>();
                for (const c of arr) {
                    if (c.alertId != null && (c.status === 'OPEN' || c.status === 'INVESTIGATING')) {
                        linked.add(Number(c.alertId));
                    }
                }
                setLinkedAlertIds(linked);
            }

            if (workersResult.status === 'fulfilled') {
                const list: any = workersResult.value;
                const arr: any[] = Array.isArray(list) ? list : (list?.content ?? []);
                setWorkers(
                    arr
                        .map((w) => ({
                            id: Number(w.id ?? w.workerId ?? 0),
                            matricule: String(w.matricule ?? `#${w.employeeId ?? ''}`),
                            fullName: String(w.fullName ?? `Employee #${w.employeeId ?? ''}`),
                        }))
                        .filter((w) => w.id > 0),
                );
            }
        } finally {
            setLoading(false);
        }
    }, [mineId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ───── Pre-remplissage depuis query string ─────
    useEffect(() => {
        if (presetAlertId) {
            setAlertId(presetAlertId);
            setManualMode(false);
        } else if (presetWorkerId) {
            setManualMode(true);
            setWorkerId(presetWorkerId);
        }
    }, [presetAlertId, presetWorkerId]);

    // ───── Synchronisation worker + level depuis alertId selectionne ─────
    useEffect(() => {
        if (!alertId || manualMode) return;
        const a = alerts.find((al) => al.id === Number(alertId));
        if (a) {
            setWorkerId(String(a.workerId));
            setLevel(a.level);
        }
    }, [alertId, alerts, manualMode]);

    // ───── Options & helpers ─────
    const availableAlerts = useMemo(() => {
        return alerts.filter((a) => !linkedAlertIds.has(a.id) || String(a.id) === presetAlertId);
    }, [alerts, linkedAlertIds, presetAlertId]);

    const workerById = useMemo(() => {
        const map = new Map<number, WorkerLite>();
        workers.forEach((w) => map.set(w.id, w));
        return map;
    }, [workers]);

    const selectedWorker = workerId ? workerById.get(Number(workerId)) ?? null : null;
    const selectedAlert = alertId ? alerts.find((a) => a.id === Number(alertId)) ?? null : null;

    // ───── Navigation Stepper ─────
    const validateStep = (step: number): boolean => {
        if (step === 0) {
            if (manualMode) {
                if (!workerId) {
                    errorNotification(t('overexposureCases.form.nav.completeBeforeNext'));
                    return false;
                }
            } else if (!alertId) {
                errorNotification(t('overexposureCases.form.nav.completeBeforeNext'));
                return false;
            }
            return true;
        }
        if (step === 1) {
            if (cause.trim().length < 10) {
                errorNotification(t('overexposureCases.form.characterization.causeRequired'));
                return false;
            }
            return true;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep(activeStep)) return;
        setActiveStep((s) => Math.min(s + 1, 2));
    };

    const handlePrev = () => {
        setActiveStep((s) => Math.max(s - 1, 0));
    };

    const handleSubmit = async () => {
        if (!confirmed) {
            errorNotification(t('overexposureCases.form.confirmation.confirmRequired'));
            return;
        }
        if (!workerId) {
            errorNotification(t('overexposureCases.form.nav.completeBeforeNext'));
            return;
        }
        setSubmitting(true);
        try {
            const fullCause = conservatory.trim()
                ? `${cause.trim()}\n\n[Mesures conservatoires]\n${conservatory.trim()}`
                : cause.trim();
            const newId = await openOverexposureCase({
                workerId: Number(workerId),
                alertId: !manualMode && alertId ? Number(alertId) : null,
                level,
                cause: fullCause,
            });
            // Notifications "placeholder" (PCR/RPO + medecin du travail)
            // eslint-disable-next-line no-console
            console.info(t('overexposureCases.form.notifyLogPcr', { id: newId }));
            // eslint-disable-next-line no-console
            console.info(t('overexposureCases.form.notifyLogMedical', { id: newId }));
            successNotification(t('overexposureCases.form.success'));
            navigate(`/dosimetry/overexposure/${newId}`);
        } catch (err: any) {
            errorNotification(
                err?.response?.data?.message ??
                    err?.response?.data?.errorMessage ??
                    t('overexposureCases.form.error'),
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ───── Render etapes ─────
    const renderStep0 = () => {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-[14px] font-semibold text-slate-900">
                        {t('overexposureCases.form.alert.title')}
                    </h2>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                        {t('overexposureCases.form.alert.subtitle')}
                    </p>
                </div>

                {/* Mode switch */}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setManualMode(false);
                            setWorkerId('');
                        }}
                        className={`px-3 py-1.5 text-[12px] rounded-md border transition ${
                            !manualMode
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        disabled={Boolean(presetAlertId)}
                    >
                        {t('overexposureCases.form.alert.alertLabel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setManualMode(true);
                            setAlertId('');
                        }}
                        className={`px-3 py-1.5 text-[12px] rounded-md border transition ${
                            manualMode
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        disabled={Boolean(presetAlertId)}
                    >
                        {t('overexposureCases.form.alert.manualOpen')}
                    </button>
                </div>

                {/* Mode alerte */}
                {!manualMode && (
                    <>
                        {presetAlertId && selectedAlert ? (
                            <div className="bg-red-50/60 border border-red-200 rounded-lg p-4">
                                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700 mb-2 inline-flex items-center gap-1.5">
                                    <IconAlertOctagon size={12} />
                                    {t('overexposureCases.form.alert.readonlyTitle')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-[12.5px]">
                                    <div>
                                        <span className="text-slate-500 mr-2">
                                            {t('overexposureCases.form.alert.alertLabel')} :
                                        </span>
                                        <span className="font-mono font-semibold text-slate-800">
                                            #{selectedAlert.id}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 mr-2">
                                            {t('overexposureCases.form.alert.levelLabel')} :
                                        </span>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                LEVEL_BADGE[selectedAlert.level]
                                            }`}
                                        >
                                            {t(`alerts.level.${selectedAlert.level}`, {
                                                defaultValue: selectedAlert.level,
                                            })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 mr-2">
                                            {t('overexposureCases.form.alert.workerLabel')} :
                                        </span>
                                        <span className="text-slate-800 font-medium">
                                            {selectedWorker
                                                ? `${selectedWorker.matricule} — ${selectedWorker.fullName}`
                                                : `#${selectedAlert.workerId}`}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 mr-2">Grandeur :</span>
                                        <span className="font-mono text-slate-800">
                                            {selectedAlert.grandeur} · {selectedAlert.value.toFixed(2)} mSv
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Select
                                size="sm"
                                label={t('overexposureCases.form.alert.alertLabel')}
                                placeholder={t('overexposureCases.form.alert.alertPlaceholder')}
                                data={availableAlerts.map((a) => {
                                    const w = workerById.get(a.workerId);
                                    return {
                                        value: String(a.id),
                                        label: `#${a.id} · ${a.grandeur} ${a.value.toFixed(2)} mSv · ${
                                            w ? `${w.matricule} ${w.fullName}` : `Worker #${a.workerId}`
                                        }`,
                                    };
                                })}
                                value={alertId || null}
                                onChange={(v) => setAlertId(v ?? '')}
                                searchable
                                nothingFoundMessage={t('overexposureCases.form.alert.noAlerts')}
                                required
                            />
                        )}
                    </>
                )}

                {/* Mode manuel */}
                {manualMode && (
                    <div className="space-y-3">
                        <Select
                            size="sm"
                            label={t('overexposureCases.form.alert.workerLabel')}
                            placeholder={t('overexposureCases.form.alert.workerPlaceholder')}
                            data={workers.map((w) => ({
                                value: String(w.id),
                                label: `${w.matricule} — ${w.fullName}`,
                            }))}
                            value={workerId || null}
                            onChange={(v) => setWorkerId(v ?? '')}
                            searchable
                            required
                            leftSection={<IconUserCircle size={14} />}
                        />
                        <Select
                            size="sm"
                            label={t('overexposureCases.form.alert.levelLabel')}
                            description={t('overexposureCases.form.alert.levelHelp')}
                            data={ALL_LEVELS.map((lvl) => ({
                                value: lvl,
                                label: t(`alerts.level.${lvl}`, { defaultValue: lvl }),
                            }))}
                            value={level}
                            onChange={(v) => v && setLevel(v as AlertLevel)}
                            required
                        />
                    </div>
                )}
            </div>
        );
    };

    const renderStep1 = () => {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-[14px] font-semibold text-slate-900">
                        {t('overexposureCases.form.characterization.title')}
                    </h2>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                        {t('overexposureCases.form.characterization.subtitle')}
                    </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[11.5px] text-slate-500 uppercase tracking-[0.12em] font-semibold">
                        {t('overexposureCases.form.characterization.levelReadonly')}
                    </span>
                    <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            LEVEL_BADGE[level]
                        }`}
                    >
                        {t(`alerts.level.${level}`, { defaultValue: level })}
                    </span>
                </div>

                <Textarea
                    label={t('overexposureCases.form.characterization.causeLabel')}
                    placeholder={t('overexposureCases.form.characterization.causePlaceholder')}
                    value={cause}
                    onChange={(e) => setCause(e.currentTarget.value)}
                    minRows={4}
                    autosize
                    required
                    error={
                        cause.length > 0 && cause.trim().length < 10
                            ? t('overexposureCases.form.characterization.causeRequired')
                            : undefined
                    }
                />

                <Textarea
                    label={t('overexposureCases.form.characterization.conservatoryLabel')}
                    placeholder={t('overexposureCases.form.characterization.conservatoryPlaceholder')}
                    value={conservatory}
                    onChange={(e) => setConservatory(e.currentTarget.value)}
                    minRows={3}
                    autosize
                />
            </div>
        );
    };

    const renderStep2 = () => {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-[14px] font-semibold text-slate-900">
                        {t('overexposureCases.form.confirmation.title')}
                    </h2>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                        {t('overexposureCases.form.confirmation.subtitle')}
                    </p>
                </div>

                <Paper className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
                        {t('overexposureCases.form.confirmation.summary')}
                    </h3>
                    <div className="space-y-2 text-[12.5px]">
                        <SummaryRow
                            label={t('overexposureCases.form.confirmation.summaryWorker')}
                            value={
                                selectedWorker
                                    ? `${selectedWorker.matricule} — ${selectedWorker.fullName}`
                                    : `#${workerId}`
                            }
                        />
                        <SummaryRow
                            label={t('overexposureCases.form.confirmation.summaryLevel')}
                            value={
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                        LEVEL_BADGE[level]
                                    }`}
                                >
                                    {t(`alerts.level.${level}`, { defaultValue: level })}
                                </span>
                            }
                        />
                        <SummaryRow
                            label={t('overexposureCases.form.confirmation.summaryAlert')}
                            value={
                                selectedAlert
                                    ? `#${selectedAlert.id} (${selectedAlert.grandeur} ${selectedAlert.value.toFixed(2)} mSv)`
                                    : t('overexposureCases.form.confirmation.summaryNoAlert')
                            }
                        />
                        <SummaryRow
                            label={t('overexposureCases.form.confirmation.summaryCause')}
                            value={<span className="whitespace-pre-wrap">{cause}</span>}
                        />
                        {conservatory.trim() && (
                            <SummaryRow
                                label={t('overexposureCases.form.confirmation.summaryConservatory')}
                                value={<span className="whitespace-pre-wrap">{conservatory}</span>}
                            />
                        )}
                    </div>
                </Paper>

                <Alert
                    icon={<IconBell size={14} />}
                    color="indigo"
                    variant="light"
                    radius="md"
                    title={t('overexposureCases.form.confirmation.notifyTitle')}
                >
                    <span className="text-[12px]">
                        {t('overexposureCases.form.confirmation.notifyBody')}
                    </span>
                </Alert>

                <Checkbox
                    label={t('overexposureCases.form.confirmation.confirmCheckbox')}
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.currentTarget.checked)}
                />
            </div>
        );
    };

    const steps = [
        {
            label: t('overexposureCases.form.steps.alert.label'),
            description: t('overexposureCases.form.steps.alert.desc'),
            icon: IconAlertOctagon,
        },
        {
            label: t('overexposureCases.form.steps.characterization.label'),
            description: t('overexposureCases.form.steps.characterization.desc'),
            icon: IconClipboardList,
        },
        {
            label: t('overexposureCases.form.steps.confirmation.label'),
            description: t('overexposureCases.form.steps.confirmation.desc'),
            icon: IconShieldCheck,
        },
    ];

    const renderStepContent = () => {
        if (activeStep === 0) return renderStep0();
        if (activeStep === 1) return renderStep1();
        return renderStep2();
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="max-w-[1100px] mx-auto space-y-5">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/settings')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('overexposureCases.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/overexposure')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('overexposureCases.breadcrumbCurrent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('overexposureCases.form.breadcrumbNew')}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                                type="button"
                                onClick={() => navigate('/dosimetry/overexposure')}
                                className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition flex-shrink-0"
                                aria-label={t('overexposureCases.form.back')}
                            >
                                <IconArrowLeft size={16} stroke={1.8} className="text-slate-600" />
                            </button>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200 flex-shrink-0">
                                <IconFolderPlus size={22} stroke={1.8} className="text-white" />
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
                                    {t('overexposureCases.form.titleNew')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('overexposureCases.form.subtitle')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-center text-slate-500">
                        <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2 align-middle" />
                        {t('overexposureCases.loading')}
                    </div>
                )}

                {/* ─── Stepper ─── */}
                <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                    <Stepper
                        active={activeStep}
                        onStepClick={(s) => {
                            // Permettre navigation arriere uniquement, ou avant si etape validee
                            if (s < activeStep || validateStep(activeStep)) setActiveStep(s);
                        }}
                        allowNextStepsSelect={false}
                        size="sm"
                        color="indigo"
                        classNames={{
                            step: 'hover:bg-slate-50 rounded-lg transition-colors duration-200',
                            stepIcon: 'border-2',
                            stepBody: 'ml-2',
                        }}
                    >
                        {steps.map((step, index) => (
                            <Stepper.Step
                                key={index}
                                label={
                                    <Text size="sm" className="text-slate-900">
                                        {step.label}
                                    </Text>
                                }
                                description={
                                    <Text size="xs" className="text-slate-500">
                                        {step.description}
                                    </Text>
                                }
                                icon={<step.icon size={14} />}
                                completedIcon={<IconCheck size={14} />}
                            />
                        ))}
                    </Stepper>
                </Paper>

                {/* ─── Contenu etape courante ─── */}
                <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                    {renderStepContent()}
                </Paper>

                {/* ─── Barre navigation ─── */}
                <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                    <Group justify="space-between" wrap="wrap">
                        <Button
                            variant="default"
                            leftSection={<IconArrowLeft size={15} />}
                            onClick={handlePrev}
                            disabled={activeStep === 0}
                        >
                            {t('overexposureCases.form.nav.prev')}
                        </Button>
                        <Group gap="md">
                            <Badge variant="light" color="gray" radius="sm" size="md">
                                {t('overexposureCases.form.nav.stepCounter', {
                                    current: activeStep + 1,
                                    total: steps.length,
                                })}
                            </Badge>
                            {activeStep === steps.length - 1 ? (
                                <Button
                                    color="red"
                                    size="md"
                                    variant="gradient"
                                    gradient={{ from: 'red', to: 'orange', deg: 90 }}
                                    leftSection={<IconCheck size={15} />}
                                    onClick={handleSubmit}
                                    loading={submitting}
                                    disabled={!confirmed}
                                >
                                    {t('overexposureCases.form.nav.submit')}
                                </Button>
                            ) : (
                                <Button
                                    color="indigo"
                                    rightSection={<IconArrowRight size={15} />}
                                    onClick={handleNext}
                                >
                                    {t('overexposureCases.form.nav.next')}
                                </Button>
                            )}
                        </Group>
                    </Group>
                </Paper>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function SummaryRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 py-1 border-b border-slate-200 last:border-b-0">
            <span className="text-[10.5px] text-slate-500 uppercase tracking-[0.12em] mt-1 min-w-[160px]">
                {label}
            </span>
            <span className="text-[12.5px] text-slate-800 flex-1 break-words">{value || '—'}</span>
        </div>
    );
}

export default OverexposureCaseForm;
