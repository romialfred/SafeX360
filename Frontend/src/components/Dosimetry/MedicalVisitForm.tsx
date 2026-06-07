/**
 * MedicalVisitForm — Phase 7 Frontend-A (LOT Dosimetrie & Expositions).
 *
 * Formulaire saisie d'une visite medicale + chiffrement clinique AES-256-GCM.
 *
 * Routes :
 *   /dosimetry/medical/visit/new                  -> Mode "schedule"
 *   /dosimetry/medical/visit/:id/perform          -> Mode "perform" (Stepper 3 etapes)
 *
 * Mode SCHEDULE (single page) :
 *   - workerId (Select autocomplete) + visitType (Select) + scheduledDate (date)
 *     + physicianId/physicianName (auto rempli depuis user)
 *
 * Mode PERFORM (Stepper) :
 *   1. Generalites    : performedDate + generalConclusion
 *   2. Rapport detail : Textarea + notice "chiffrement AES-256-GCM"
 *   3. Aptitude       : bouton "Saisir l'aptitude" -> FitnessAssessmentForm
 *
 * Confirmation modal au submit final : "fige (append-only)".
 *
 * RBAC : DOSIMETRY_MEDICAL uniquement.
 *
 * i18n : namespace `dosimetry`, sous-tree `medical.visit.*`.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Stepper,
    Select,
    Textarea,
    TextInput,
    Modal,
    Button,
    Group,
    Alert,
} from '@mantine/core';
import {
    IconStethoscope,
    IconChevronRight,
    IconShieldLock,
    IconArrowLeft,
    IconArrowRight,
    IconAlertTriangle,
    IconCircleCheck,
    IconUserCircle,
    IconCalendar,
    IconClipboardList,
    IconShieldCheck,
    IconLockAccess,
    IconFileText,
    IconHeartbeat,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import {
    scheduleMedicalVisit,
    performMedicalVisit,
    searchWorkers,
    type MedicalVisitType,
} from '../../services/DosimetryService';

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

const ALL_VISIT_TYPES: MedicalVisitType[] = [
    'INITIAL',
    'PERIODIC_ANNUAL',
    'POST_EXPOSURE',
    'FOLLOWUP',
    'FINAL_AT_DEPARTURE',
];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

interface WorkerLite {
    id: number;
    matricule: string;
    fullName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const MedicalVisitForm = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const { id: visitIdParam } = useParams();
    const [searchParams] = useSearchParams();

    const presetWorkerId = searchParams.get('workerId');

    const mode: 'schedule' | 'perform' = visitIdParam ? 'perform' : 'schedule';

    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const canMedical = hasDosimetryPermission(user, 'DOSIMETRY_MEDICAL');
    const mineId: number = selectedMineId ?? user?.mineId ?? user?.companyId ?? 1;

    const [workers, setWorkers] = useState<WorkerLite[]>([]);

    // SCHEDULE state
    const [workerId, setWorkerId] = useState<string>(presetWorkerId ?? '');
    const [visitType, setVisitType] = useState<MedicalVisitType>('PERIODIC_ANNUAL');
    const [scheduledDate, setScheduledDate] = useState<string>(todayIso());
    const [physicianName, setPhysicianName] = useState<string>(
        typeof user?.fullName === 'string' ? user.fullName : '',
    );

    // PERFORM state
    const [activeStep, setActiveStep] = useState(0);
    const [performedDate, setPerformedDate] = useState<string>(todayIso());
    const [generalConclusion, setGeneralConclusion] = useState<string>('');
    const [detailedReport, setDetailedReport] = useState<string>('');

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        searchWorkers({ mineId }).then((list) => {
            if (!mounted) return;
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
        }).catch(() => {
            // ignore - non-blocking
        });
        return () => { mounted = false; };
    }, [mineId]);

    // ─── SCHEDULE submit ───
    const validateSchedule = (): boolean => {
        const next: Record<string, string> = {};
        if (!workerId) next.workerId = t('medical.visit.errors.workerRequired');
        if (!visitType) next.visitType = t('medical.visit.errors.typeRequired');
        if (!scheduledDate) next.scheduledDate = t('medical.visit.errors.dateRequired');
        if (!physicianName.trim()) next.physicianName = t('medical.visit.errors.physicianRequired');
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleScheduleSubmit = async () => {
        if (!validateSchedule()) return;
        setSubmitting(true);
        try {
            const physicianId: number = Number(user?.id ?? user?.userId ?? 0) || 0;
            const newId = await scheduleMedicalVisit({
                workerId: Number(workerId),
                mineId,
                type: visitType,
                scheduledDate,
                physicianId,
                physicianName: physicianName.trim() || null,
            });
            successNotification(t('medical.visit.scheduleSuccess'));
            // Reste sur le planning pour permettre de planifier d'autres visites
            navigate(`/dosimetry/medical/visit/${newId}/perform`);
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.message ?? t('medical.visit.errors.saveFailed');
            errorNotification(typeof msg === 'string' ? msg : t('medical.visit.errors.saveFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    // ─── PERFORM submit ───
    const validatePerformStep = (step: number): boolean => {
        const next: Record<string, string> = {};
        if (step === 0) {
            if (!performedDate) next.performedDate = t('medical.visit.errors.dateRequired');
            if (!generalConclusion.trim()) {
                next.generalConclusion = t('medical.visit.errors.conclusionRequired');
            }
        }
        if (step === 1) {
            if (!detailedReport.trim()) {
                next.detailedReport = t('medical.visit.errors.reportRequired');
            }
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handlePerformConfirm = async () => {
        setConfirmOpen(false);
        if (!visitIdParam) return;
        setSubmitting(true);
        try {
            await performMedicalVisit(visitIdParam, {
                performedDate,
                generalConclusion: generalConclusion.trim() || null,
                detailedReport: detailedReport.trim() || null,
            });
            successNotification(t('medical.visit.performSuccess'));
            setActiveStep(2);
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.message ?? t('medical.visit.errors.saveFailed');
            errorNotification(typeof msg === 'string' ? msg : t('medical.visit.errors.saveFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    // ─── RBAC GATE ───
    if (!canMedical) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-10">
                <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-10 text-center">
                    <IconShieldLock size={36} className="mx-auto text-red-500 mb-3" />
                    <h2 className="text-slate-900 font-semibold text-lg mb-1">
                        {t('medical.visit.rbacBlockedTitle')}
                    </h2>
                    <p className="text-slate-600 text-[13px]">
                        {t('medical.visit.rbacBlockedBody')}
                    </p>
                </div>
            </div>
        );
    }

    // ─── RENDER ───
    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="max-w-3xl mx-auto">
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
                        {t('medical.visit.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {mode === 'schedule'
                            ? t('medical.visit.breadcrumbSchedule')
                            : t('medical.visit.breadcrumbPerform')}
                    </span>
                </div>

                {/* Hero */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-4">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                aria-label={t('medical.visit.back')}
                            >
                                <IconArrowLeft size={16} stroke={1.8} />
                            </button>
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200">
                                <IconStethoscope size={20} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-slate-900 leading-tight"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(18px, 2vw, 22px)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {mode === 'schedule'
                                        ? t('medical.visit.scheduleTitle')
                                        : t('medical.visit.performTitle', { id: visitIdParam })}
                                </h1>
                                <p className="text-[12.5px] text-slate-600 mt-0.5">
                                    {mode === 'schedule'
                                        ? t('medical.visit.scheduleSubtitle')
                                        : t('medical.visit.performSubtitle')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SCHEDULE form */}
                {mode === 'schedule' && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                        <Select
                            size="sm"
                            label={t('medical.visit.fields.worker')}
                            placeholder={t('medical.visit.fields.workerPlaceholder')}
                            data={workers.map((w) => ({
                                value: String(w.id),
                                label: `${w.matricule} — ${w.fullName}`,
                            }))}
                            value={workerId || null}
                            onChange={(v) => setWorkerId(v ?? '')}
                            searchable
                            disabled={!!presetWorkerId}
                            error={errors.workerId}
                            leftSection={<IconUserCircle size={14} />}
                        />
                        <Select
                            size="sm"
                            label={t('medical.visit.fields.visitType')}
                            data={ALL_VISIT_TYPES.map((vt) => ({
                                value: vt,
                                label: t(`medical.visitType.${vt}`, { defaultValue: vt }),
                            }))}
                            value={visitType}
                            onChange={(v) => setVisitType((v as MedicalVisitType) ?? 'PERIODIC_ANNUAL')}
                            error={errors.visitType}
                            leftSection={<IconClipboardList size={14} />}
                        />
                        <TextInput
                            size="sm"
                            label={t('medical.visit.fields.scheduledDate')}
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.currentTarget.value)}
                            error={errors.scheduledDate}
                            leftSection={<IconCalendar size={14} />}
                        />
                        <TextInput
                            size="sm"
                            label={t('medical.visit.fields.physician')}
                            value={physicianName}
                            onChange={(e) => setPhysicianName(e.currentTarget.value)}
                            placeholder={t('medical.visit.fields.physicianPlaceholder')}
                            error={errors.physicianName}
                            leftSection={<IconShieldCheck size={14} />}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => navigate(-1)}
                                disabled={submitting}
                            >
                                {t('medical.visit.cancel')}
                            </Button>
                            <Button
                                color="emerald"
                                leftSection={<IconCircleCheck size={14} />}
                                onClick={handleScheduleSubmit}
                                loading={submitting}
                                styles={{
                                    root: { backgroundColor: '#059669', color: 'white' },
                                }}
                            >
                                {t('medical.visit.scheduleSubmit')}
                            </Button>
                        </Group>
                    </div>
                )}

                {/* PERFORM stepper */}
                {mode === 'perform' && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                        <Stepper
                            active={activeStep}
                            onStepClick={(s) => {
                                if (s < activeStep) setActiveStep(s);
                            }}
                            color="teal"
                            allowNextStepsSelect={false}
                        >
                            {/* Step 1 - Generalites */}
                            <Stepper.Step
                                label={t('medical.visit.stepper.step1Label')}
                                description={t('medical.visit.stepper.step1Desc')}
                                icon={<IconClipboardList size={16} />}
                            >
                                <div className="space-y-4 mt-4">
                                    <TextInput
                                        size="sm"
                                        label={t('medical.visit.fields.performedDate')}
                                        type="date"
                                        value={performedDate}
                                        onChange={(e) => setPerformedDate(e.currentTarget.value)}
                                        error={errors.performedDate}
                                        leftSection={<IconCalendar size={14} />}
                                    />
                                    <Textarea
                                        size="sm"
                                        label={t('medical.visit.fields.generalConclusion')}
                                        placeholder={t('medical.visit.fields.generalConclusionPlaceholder')}
                                        minRows={3}
                                        autosize
                                        value={generalConclusion}
                                        onChange={(e) => setGeneralConclusion(e.currentTarget.value)}
                                        error={errors.generalConclusion}
                                        description={t('medical.visit.fields.generalConclusionDescription')}
                                    />
                                </div>
                            </Stepper.Step>

                            {/* Step 2 - Rapport detaille */}
                            <Stepper.Step
                                label={t('medical.visit.stepper.step2Label')}
                                description={t('medical.visit.stepper.step2Desc')}
                                icon={<IconFileText size={16} />}
                            >
                                <div className="space-y-4 mt-4">
                                    <Alert
                                        color="indigo"
                                        icon={<IconLockAccess size={16} />}
                                        styles={{
                                            root: { backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE' },
                                            title: { color: '#3730A3' },
                                            message: { color: '#3730A3', fontSize: 12.5 },
                                        }}
                                        title={t('medical.visit.encryptionTitle')}
                                    >
                                        {t('medical.visit.encryptionBody')}
                                    </Alert>
                                    <Textarea
                                        size="sm"
                                        label={t('medical.visit.fields.detailedReport')}
                                        placeholder={t('medical.visit.fields.detailedReportPlaceholder')}
                                        minRows={10}
                                        autosize
                                        value={detailedReport}
                                        onChange={(e) => setDetailedReport(e.currentTarget.value)}
                                        error={errors.detailedReport}
                                    />
                                </div>
                            </Stepper.Step>

                            {/* Step 3 - Aptitude */}
                            <Stepper.Step
                                label={t('medical.visit.stepper.step3Label')}
                                description={t('medical.visit.stepper.step3Desc')}
                                icon={<IconHeartbeat size={16} />}
                            >
                                <div className="space-y-4 mt-4">
                                    <Alert
                                        color="emerald"
                                        icon={<IconCircleCheck size={16} />}
                                        styles={{
                                            root: { backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' },
                                            title: { color: '#065F46' },
                                            message: { color: '#065F46', fontSize: 12.5 },
                                        }}
                                        title={t('medical.visit.lockedTitle')}
                                    >
                                        {t('medical.visit.lockedBody')}
                                    </Alert>
                                    <p className="text-[13px] text-slate-700">
                                        {t('medical.visit.step3Help')}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            color="teal"
                                            leftSection={<IconHeartbeat size={14} />}
                                            onClick={() =>
                                                navigate(
                                                    `/dosimetry/medical/fitness/new?workerId=${workerId || presetWorkerId || ''}&medicalVisitId=${visitIdParam}`,
                                                )
                                            }
                                            styles={{
                                                root: { backgroundColor: '#0D9488', color: 'white' },
                                            }}
                                        >
                                            {t('medical.visit.openFitnessForm')}
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={() =>
                                                navigate(`/dosimetry/medical/planning`)
                                            }
                                        >
                                            {t('medical.visit.backToPlanning')}
                                        </Button>
                                    </div>
                                </div>
                            </Stepper.Step>
                        </Stepper>

                        {/* Stepper navigation */}
                        {activeStep < 2 && (
                            <Group justify="space-between" mt="lg">
                                <Button
                                    variant="default"
                                    onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                                    leftSection={<IconArrowLeft size={14} />}
                                    disabled={activeStep === 0 || submitting}
                                >
                                    {t('medical.visit.prev')}
                                </Button>
                                {activeStep === 1 ? (
                                    <Button
                                        color="emerald"
                                        leftSection={<IconCircleCheck size={14} />}
                                        onClick={() => {
                                            if (validatePerformStep(1)) setConfirmOpen(true);
                                        }}
                                        loading={submitting}
                                        styles={{
                                            root: { backgroundColor: '#059669', color: 'white' },
                                        }}
                                    >
                                        {t('medical.visit.finalize')}
                                    </Button>
                                ) : (
                                    <Button
                                        color="teal"
                                        rightSection={<IconArrowRight size={14} />}
                                        onClick={() => {
                                            if (validatePerformStep(activeStep)) {
                                                setActiveStep((s) => Math.min(2, s + 1));
                                            }
                                        }}
                                        styles={{
                                            root: { backgroundColor: '#0D9488', color: 'white' },
                                        }}
                                    >
                                        {t('medical.visit.next')}
                                    </Button>
                                )}
                            </Group>
                        )}
                    </div>
                )}
            </div>

            {/* Confirmation modal (PERFORM) */}
            <Modal
                opened={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title={t('medical.visit.confirmTitle')}
                centered
                size="md"
            >
                <div className="space-y-3">
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[12.5px]">
                        <IconAlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{t('medical.visit.confirmBody')}</span>
                    </div>
                    <p className="text-[12.5px] text-slate-700">
                        {t('medical.visit.confirmRecap', { date: performedDate })}
                    </p>
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="default"
                            onClick={() => setConfirmOpen(false)}
                            disabled={submitting}
                        >
                            {t('medical.visit.cancel')}
                        </Button>
                        <Button
                            color="emerald"
                            leftSection={<IconCircleCheck size={14} />}
                            onClick={handlePerformConfirm}
                            loading={submitting}
                            styles={{
                                root: { backgroundColor: '#059669', color: 'white' },
                            }}
                        >
                            {t('medical.visit.confirmFinalize')}
                        </Button>
                    </Group>
                </div>
            </Modal>
        </div>
    );
};

export default MedicalVisitForm;
