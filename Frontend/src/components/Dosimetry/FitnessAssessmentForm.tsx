/**
 * FitnessAssessmentForm — Phase 7 Frontend-A (LOT Dosimetrie & Expositions).
 *
 * Saisie d'une fiche d'aptitude medicale + signature APPEND-ONLY.
 *
 * Route : /dosimetry/medical/fitness/new?workerId=X[&medicalVisitId=Y]
 *
 * Champs :
 *   - fitness (Select 4 niveaux + couleur) : FIT / FIT_WITH_RESTRICTIONS / TEMPORARILY_UNFIT / UNFIT
 *   - validUntil (date defaut +12 mois)
 *   - reviewRequiredDate (date)
 *   - restrictions (Textarea, chiffree AES-256-GCM en BDD - "Acces restreint, clinique")
 *   - publicRestrictionsSummary (Textarea - "Visible PCR/RPO, operationnel uniquement")
 *
 * Workflow :
 *   1. POST /fitness-assessment/create -> retourne id
 *   2. Modal confirmation "Apres signature, ce document devient fige (AIEA §3.106)"
 *   3. POST /fitness-assessment/sign/{id}
 *   4. Retour vers dossier worker
 *
 * RBAC : DOSIMETRY_MEDICAL uniquement.
 *
 * i18n : namespace `dosimetry`, sous-tree `medical.fitness.*`.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Select,
    Textarea,
    TextInput,
    Modal,
    Button,
    Group,
    Alert,
} from '@mantine/core';
import {
    IconHeartbeat,
    IconChevronRight,
    IconShieldLock,
    IconArrowLeft,
    IconAlertTriangle,
    IconCircleCheck,
    IconSignature,
    IconLockAccess,
    IconCalendar,
    IconUserCircle,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import {
    createFitnessAssessment,
    signFitnessAssessment,
    searchWorkers,
    type FitnessLevel,
} from '../../services/DosimetryService';
import { positiveMineId, selectMineMessage } from '../../utils/activeMine';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC helper
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (['ADMINISTRATOR', 'SYSTEM_ADMINISTRATOR', 'ADMIN', 'SUPER_ADMIN'].includes(String(user.role ?? '').toUpperCase())) return true;
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

const FITNESS_LEVELS: FitnessLevel[] = [
    'FIT',
    'FIT_WITH_RESTRICTIONS',
    'TEMPORARILY_UNFIT',
    'UNFIT',
];

const FITNESS_BADGE: Record<FitnessLevel, { dot: string; bg: string; text: string; border: string }> = {
    FIT: {
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
    },
    FIT_WITH_RESTRICTIONS: {
        dot: 'bg-yellow-500',
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
    },
    TEMPORARILY_UNFIT: {
        dot: 'bg-orange-500',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
    },
    UNFIT: {
        dot: 'bg-red-500',
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
    },
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);
const plusTwelveMonthsIso = (): string => {
    const d = new Date();
    d.setMonth(d.getMonth() + 12);
    return d.toISOString().slice(0, 10);
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

interface WorkerLite {
    id: number;
    matricule: string;
    fullName: string;
}

const FitnessAssessmentForm = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const presetWorkerId = searchParams.get('workerId');
    const presetVisitId = searchParams.get('medicalVisitId');

    const user = useAppSelector((state: any) => state.user);
    const selectedMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );

    const canMedical = hasDosimetryPermission(user, 'DOSIMETRY_MEDICAL');
    // Mine active résolue (> 0) : null en vue consolidée → le submit bloque.
    const mineId: number | null =
        positiveMineId(selectedMineId) ??
        positiveMineId(user?.mineId) ??
        positiveMineId(user?.companyId);

    const [workers, setWorkers] = useState<WorkerLite[]>([]);
    const [workerId, setWorkerId] = useState<string>(presetWorkerId ?? '');
    const [fitness, setFitness] = useState<FitnessLevel>('FIT');
    const [assessmentDate, setAssessmentDate] = useState<string>(todayIso());
    const [validUntil, setValidUntil] = useState<string>(plusTwelveMonthsIso());
    const [reviewRequiredDate, setReviewRequiredDate] = useState<string>('');
    const [restrictions, setRestrictions] = useState<string>('');
    const [publicSummary, setPublicSummary] = useState<string>('');
    const [physicianName, setPhysicianName] = useState<string>(
        typeof user?.fullName === 'string' ? user.fullName : '',
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        if (mineId == null) return;
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
            // ignore - the user can still type the workerId manually via preset
        });
        return () => { mounted = false; };
    }, [mineId]);

    const validate = (): boolean => {
        const next: Record<string, string> = {};
        if (!workerId) next.workerId = t('medical.fitness.errors.workerRequired');
        if (!fitness) next.fitness = t('medical.fitness.errors.fitnessRequired');
        if (!assessmentDate) next.assessmentDate = t('medical.fitness.errors.dateRequired');
        if (fitness === 'FIT_WITH_RESTRICTIONS' && !restrictions.trim()) {
            next.restrictions = t('medical.fitness.errors.restrictionsRequired');
        }
        if (fitness === 'TEMPORARILY_UNFIT' && !reviewRequiredDate) {
            next.reviewRequiredDate = t('medical.fitness.errors.reviewRequired');
        }
        if (!physicianName.trim()) {
            next.physicianName = t('medical.fitness.errors.physicianRequired');
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSignAndSave = async () => {
        if (!validate()) return;
        if (mineId == null) {
            errorNotification(selectMineMessage("enregistrer cette fiche d'aptitude"));
            return;
        }
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setConfirmOpen(false);
        setSubmitting(true);
        try {
            const physicianId: number = Number(user?.id ?? user?.userId ?? 0) || 0;
            const newId = await createFitnessAssessment({
                workerId: Number(workerId),
                mineId: mineId as number,
                medicalVisitId: presetVisitId ? Number(presetVisitId) : null,
                fitness,
                restrictions: restrictions.trim() || null,
                publicSummary: publicSummary.trim() || null,
                assessmentDate,
                validUntil: validUntil || null,
                reviewRequiredDate: reviewRequiredDate || null,
                physicianId,
                physicianName: physicianName.trim() || null,
            });
            await signFitnessAssessment(newId);
            successNotification(t('medical.fitness.successSigned'));
            navigate(`/dosimetry/medical/worker/${workerId}`);
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.message ?? t('medical.fitness.errors.saveFailed');
            errorNotification(typeof msg === 'string' ? msg : t('medical.fitness.errors.saveFailed'));
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
                        {t('medical.fitness.rbacBlockedTitle')}
                    </h2>
                    <p className="text-slate-600 text-[13px]">
                        {t('medical.fitness.rbacBlockedBody')}
                    </p>
                </div>
            </div>
        );
    }

    const selectedBadge = FITNESS_BADGE[fitness];

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="max-w-3xl mx-auto">
                {/* ─── RGPD banner ─── */}
                <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[12px]">
                    <IconShieldLock size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span>{t('medical.rgpdBanner')}</span>
                </div>

                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/medical/planning')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('medical.fitness.breadcrumbRoot')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('medical.fitness.breadcrumbCurrent')}
                    </span>
                </div>

                {/* ─── Hero ─── */}
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
                                aria-label={t('medical.fitness.back')}
                            >
                                <IconArrowLeft size={16} stroke={1.8} />
                            </button>
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200">
                                <IconHeartbeat size={20} stroke={1.8} className="text-white" />
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
                                    {t('medical.fitness.title')}
                                </h1>
                                <p className="text-[12.5px] text-slate-600 mt-0.5">
                                    {t('medical.fitness.subtitle')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Card form ─── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                    {/* Worker */}
                    <div>
                        <Select
                            size="sm"
                            label={t('medical.fitness.fields.worker')}
                            placeholder={t('medical.fitness.fields.workerPlaceholder')}
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
                    </div>

                    {/* Fitness level */}
                    <div>
                        <label className="block text-[12.5px] text-slate-700 font-medium mb-1.5">
                            {t('medical.fitness.fields.level')}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {FITNESS_LEVELS.map((lvl) => {
                                const palette = FITNESS_BADGE[lvl];
                                const selected = fitness === lvl;
                                return (
                                    <button
                                        type="button"
                                        key={lvl}
                                        onClick={() => setFitness(lvl)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12.5px] text-left transition ${
                                            selected
                                                ? `${palette.bg} ${palette.text} ${palette.border} ring-1 ring-offset-1 ring-${
                                                      palette.dot.replace('bg-', '')
                                                  }`
                                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-full ${palette.dot}`} />
                                        <span className="font-semibold">
                                            {t(`medical.fitnessLevel.${lvl}`, { defaultValue: lvl })}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {errors.fitness && (
                            <p className="mt-1 text-[11.5px] text-red-600">{errors.fitness}</p>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <TextInput
                            size="sm"
                            label={t('medical.fitness.fields.assessmentDate')}
                            type="date"
                            value={assessmentDate}
                            onChange={(e) => setAssessmentDate(e.currentTarget.value)}
                            error={errors.assessmentDate}
                            leftSection={<IconCalendar size={14} />}
                        />
                        <TextInput
                            size="sm"
                            label={t('medical.fitness.fields.validUntil')}
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.currentTarget.value)}
                            leftSection={<IconCalendar size={14} />}
                        />
                        <TextInput
                            size="sm"
                            label={t('medical.fitness.fields.reviewRequired')}
                            type="date"
                            value={reviewRequiredDate}
                            onChange={(e) => setReviewRequiredDate(e.currentTarget.value)}
                            error={errors.reviewRequiredDate}
                            leftSection={<IconCalendar size={14} />}
                        />
                    </div>

                    {/* Restrictions (encrypted clinical) */}
                    <div>
                        <Textarea
                            size="sm"
                            label={
                                <span className="flex items-center gap-1.5">
                                    {t('medical.fitness.fields.restrictions')}
                                    <span
                                        className={`inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-semibold ${selectedBadge.bg} ${selectedBadge.text} border ${selectedBadge.border}`}
                                    >
                                        <IconLockAccess size={9} stroke={2} />
                                        {t('medical.fitness.fields.restrictedTag')}
                                    </span>
                                </span>
                            }
                            placeholder={t('medical.fitness.fields.restrictionsPlaceholder')}
                            minRows={3}
                            autosize
                            value={restrictions}
                            onChange={(e) => setRestrictions(e.currentTarget.value)}
                            error={errors.restrictions}
                            description={t('medical.fitness.fields.restrictionsDescription')}
                        />
                    </div>

                    {/* Public summary */}
                    <div>
                        <Textarea
                            size="sm"
                            label={t('medical.fitness.fields.publicSummary')}
                            placeholder={t('medical.fitness.fields.publicSummaryPlaceholder')}
                            minRows={2}
                            autosize
                            value={publicSummary}
                            onChange={(e) => setPublicSummary(e.currentTarget.value)}
                            description={t('medical.fitness.fields.publicSummaryDescription')}
                        />
                    </div>

                    {/* Physician name */}
                    <TextInput
                        size="sm"
                        label={t('medical.fitness.fields.physician')}
                        placeholder={t('medical.fitness.fields.physicianPlaceholder')}
                        value={physicianName}
                        onChange={(e) => setPhysicianName(e.currentTarget.value)}
                        error={errors.physicianName}
                    />

                    {/* Append-only notice */}
                    <Alert
                        color="amber"
                        icon={<IconAlertTriangle size={16} />}
                        styles={{
                            root: { backgroundColor: '#FFFBEB', border: '1px solid #FCD34D' },
                            title: { color: '#92400E' },
                            message: { color: '#92400E', fontSize: 12.5 },
                        }}
                        title={t('medical.fitness.appendOnlyTitle')}
                    >
                        {t('medical.fitness.appendOnlyBody')}
                    </Alert>

                    {/* Actions */}
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="default"
                            onClick={() => navigate(-1)}
                            disabled={submitting}
                        >
                            {t('medical.fitness.cancel')}
                        </Button>
                        <Button
                            color="emerald"
                            leftSection={<IconSignature size={14} />}
                            onClick={handleSignAndSave}
                            loading={submitting}
                            styles={{
                                root: {
                                    backgroundColor: '#059669',
                                    color: 'white',
                                },
                            }}
                        >
                            {t('medical.fitness.signAndSave')}
                        </Button>
                    </Group>
                </div>
            </div>

            {/* ─── Modal confirmation ─── */}
            <Modal
                opened={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title={t('medical.fitness.confirmTitle')}
                centered
                size="md"
            >
                <div className="space-y-3">
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[12.5px]">
                        <IconAlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{t('medical.fitness.confirmBody')}</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${selectedBadge.bg} ${selectedBadge.border} ${selectedBadge.text}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${selectedBadge.dot}`} />
                        <span className="font-semibold">
                            {t(`medical.fitnessLevel.${fitness}`, { defaultValue: fitness })}
                        </span>
                        <span className="text-[11.5px] opacity-80">
                            ({t('medical.fitness.confirmValidUntil')} {validUntil || '—'})
                        </span>
                    </div>
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="default"
                            onClick={() => setConfirmOpen(false)}
                            disabled={submitting}
                        >
                            {t('medical.fitness.cancel')}
                        </Button>
                        <Button
                            color="emerald"
                            leftSection={<IconCircleCheck size={14} />}
                            onClick={handleConfirm}
                            loading={submitting}
                            styles={{
                                root: {
                                    backgroundColor: '#059669',
                                    color: 'white',
                                },
                            }}
                        >
                            {t('medical.fitness.confirmSign')}
                        </Button>
                    </Group>
                </div>
            </Modal>
        </div>
    );
};

export default FitnessAssessmentForm;
