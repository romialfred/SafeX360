/**
 * MonitoringCampaignForm — Phase 6 Frontend-B (LOT Dosimetrie & Expositions).
 *
 * Formulaire premium SafeX 360 de creation d'une campagne de surveillance d'ambiance.
 *
 * Route :
 *   /dosimetry/campaigns/new
 *
 * Stepper 4 etapes Mantine :
 *   1. Identification : code (unique par mine) + label + objectif
 *   2. Planning       : startDate + endDate + responsable (Select employee)
 *   3. Protocole      : protocol (textarea) + points de mesure (multi-select)
 *   4. Confirmation   : recap + bouton "Creer (DRAFT)" puis affichage du bouton
 *                       "Demarrer la campagne" qui declenche la transition ONGOING.
 *
 * Workflow :
 *   - Submit -> creation en statut DRAFT (createMonitoringCampaign)
 *   - Bouton "Demarrer la campagne" -> startMonitoringCampaign (transition ONGOING)
 *   - Redirection vers /dosimetry/campaigns/:id
 *
 * RBAC : DOSIMETRY_PCR_RPO requis cote backend pour la creation et le start.
 *
 * Contraintes : tsc strict + vite EXIT 0.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import {
    Stepper,
    Paper,
    Group,
    Button,
    Select,
    Textarea,
    Text,
    Alert,
    TextInput,
    MultiSelect,
    Badge,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
    IconClipboardList,
    IconChevronRight,
    IconArrowLeft,
    IconArrowRight,
    IconHash,
    IconCalendarTime,
    IconAdjustments,
    IconCheck,
    IconAlertOctagon,
    IconDeviceFloppy,
    IconInfoCircle,
    IconShieldCheck,
    IconPlayerPlay,
    IconUserCircle,
    IconBroadcast,
} from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../slices/hooks';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import {
    createMonitoringCampaign,
    startMonitoringCampaign,
    listMonitoringCampaigns,
    listMeasurementPoints,
    type MonitoringCampaignDTO,
    type MeasurementPointDTO,
} from '../../services/DosimetryService';
import { getEmployeeDropdown } from '../../services/EmployeeService';

// ─────────────────────────────────────────────────────────────────────────────
//  Modele de formulaire
// ─────────────────────────────────────────────────────────────────────────────

interface FormShape {
    identification: {
        code: string;
        label: string;
        objective: string;
    };
    planning: {
        startDate: Date | null;
        endDate: Date | null;
        responsibleId: string;
    };
    protocol: {
        protocol: string;
        measurementPointIds: string[];
    };
}

const STEPS = ['identification', 'planning', 'protocol', 'confirmation'] as const;

const toIsoDate = (d: Date | null | undefined): string | null => {
    if (!d) return null;
    try {
        return new Date(d).toISOString().slice(0, 10);
    } catch {
        return null;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant
// ─────────────────────────────────────────────────────────────────────────────

const MonitoringCampaignForm = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector(
        (state: any) => state.companySelection?.selectedCompanyId,
    );

    const mineId: number = Number(
        selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1,
    );

    const [activeStep, setActiveStep] = useState(0);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [starting, setStarting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
    const [points, setPoints] = useState<MeasurementPointDTO[]>([]);
    const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());

    /**
     * Apres creation, on conserve l'id pour permettre la transition ONGOING via
     * le bouton "Demarrer la campagne" sans recreer.
     */
    const [createdId, setCreatedId] = useState<number | null>(null);

    const form = useForm<FormShape>({
        initialValues: {
            identification: { code: '', label: '', objective: '' },
            planning: { startDate: null, endDate: null, responsibleId: '' },
            protocol: { protocol: '', measurementPointIds: [] },
        },
        validate: {
            identification: {
                code: (value) => {
                    if (!value || !value.trim()) return t('campaigns.form.errors.codeRequired');
                    if (value.length > 32) return t('campaigns.form.errors.codeTooLong');
                    const upper = value.trim().toUpperCase();
                    if (existingCodes.has(upper)) {
                        return t('campaigns.form.errors.codeAlreadyUsed');
                    }
                    return null;
                },
                label: (value) =>
                    !value || !value.trim() ? t('campaigns.form.errors.labelRequired') : null,
            },
            planning: {
                startDate: (value) =>
                    !value ? t('campaigns.form.errors.startDateRequired') : null,
                endDate: (value, values) => {
                    if (value && values.planning.startDate && value < values.planning.startDate) {
                        return t('campaigns.form.errors.endBeforeStart');
                    }
                    return null;
                },
            },
        },
    });

    // ─── Chargement initial ───
    useEffect(() => {
        let cancelled = false;
        setLoadingInitial(true);

        Promise.all([
            getEmployeeDropdown().catch(() => [] as any[]),
            listMeasurementPoints(mineId).catch(() => [] as MeasurementPointDTO[]),
            listMonitoringCampaigns(mineId).catch(() => [] as MonitoringCampaignDTO[]),
        ])
            .then(([emps, pts, camps]) => {
                if (cancelled) return;
                const empList: any[] = Array.isArray(emps) ? emps : ((emps as any)?.content ?? []);
                setEmployees(
                    empList
                        .map((e) => ({
                            value: String(e?.id ?? e?.employeeId ?? ''),
                            label: String(
                                e?.firstName && e?.lastName
                                    ? `${e.firstName} ${e.lastName}`
                                    : e?.fullName ?? e?.name ?? `#${e?.id ?? ''}`,
                            ),
                        }))
                        .filter((o) => o.value),
                );
                const pointsList: MeasurementPointDTO[] = Array.isArray(pts)
                    ? pts
                    : (((pts as any)?.content ?? []) as MeasurementPointDTO[]);
                setPoints(pointsList);
                const codes = new Set<string>();
                camps.forEach((c) => {
                    if (c.code) codes.add(c.code.trim().toUpperCase());
                });
                setExistingCodes(codes);
            })
            .finally(() => {
                if (!cancelled) setLoadingInitial(false);
            });

        return () => {
            cancelled = true;
        };
    }, [mineId]);

    // ─── Options ───
    const pointOptions = useMemo(
        () =>
            points
                .map((p) => ({
                    value: String(p.id ?? ''),
                    label: `${p.code ?? '—'} — ${p.label ?? ''}`,
                }))
                .filter((o) => o.value),
        [points],
    );

    const selectedResponsibleLabel = useMemo(() => {
        const id = form.values.planning.responsibleId;
        if (!id) return null;
        return employees.find((e) => e.value === id)?.label ?? `#${id}`;
    }, [employees, form.values.planning.responsibleId]);

    const selectedPointsCount = form.values.protocol.measurementPointIds.length;

    // ─── Navigation Stepper ───
    const validateStep = (idx: number): boolean => {
        const key = STEPS[idx];
        const validation = form.validate();
        if (key === 'identification') {
            return (
                !validation.errors?.['identification.code']
                && !validation.errors?.['identification.label']
            );
        }
        if (key === 'planning') {
            return (
                !validation.errors?.['planning.startDate']
                && !validation.errors?.['planning.endDate']
            );
        }
        return true;
    };

    const handleNext = () => {
        if (createdId != null) return; // verrouille apres creation
        if (!validateStep(activeStep)) {
            errorNotification(t('campaigns.form.errors.invalid'));
            return;
        }
        setActiveStep((s) => Math.min(STEPS.length - 1, s + 1));
    };

    const handlePrev = () => {
        if (createdId != null) return;
        setActiveStep((s) => Math.max(0, s - 1));
    };

    // ─── Submit (creation DRAFT) ───
    const buildPayload = (): MonitoringCampaignDTO => {
        const v = form.values;
        return {
            id: null,
            mineId,
            code: v.identification.code.trim().toUpperCase(),
            label: v.identification.label.trim(),
            objective: v.identification.objective.trim() || null,
            startDate: toIsoDate(v.planning.startDate) ?? new Date().toISOString().slice(0, 10),
            endDate: toIsoDate(v.planning.endDate),
            status: 'DRAFT',
            protocol: v.protocol.protocol.trim() || null,
            responsibleId: v.planning.responsibleId ? Number(v.planning.responsibleId) : null,
            measurementPointIds: v.protocol.measurementPointIds.map((s) => Number(s)),
        };
    };

    const handleSubmit = async () => {
        const validation = form.validate();
        if (validation.hasErrors) {
            errorNotification(t('campaigns.form.errors.invalid'));
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        dispatch(showOverlay());
        try {
            const payload = buildPayload();
            const newId = await createMonitoringCampaign(payload);
            successNotification(t('campaigns.form.successCreate'));
            setCreatedId(newId);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ?? err?.message ?? t('campaigns.form.errorGeneric');
            setSubmitError(msg);
            errorNotification(msg);
        } finally {
            setSubmitting(false);
            dispatch(hideOverlay());
        }
    };

    // ─── Demarrer la campagne (transition ONGOING) ───
    const handleStart = async () => {
        if (createdId == null) return;
        setStarting(true);
        dispatch(showOverlay());
        try {
            await startMonitoringCampaign(createdId);
            successNotification(t('campaigns.form.successStart'));
            navigate(`/dosimetry/campaigns/${createdId}`);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ?? err?.message ?? t('campaigns.form.errorStart');
            errorNotification(msg);
        } finally {
            setStarting(false);
            dispatch(hideOverlay());
        }
    };

    // ─── Render ───
    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1100px] mx-auto">

                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('campaigns.list.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/campaigns')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('campaigns.list.breadcrumbCurrent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('campaigns.form.breadcrumbNew')}
                    </span>
                </div>

                {/* ─── Hero ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                                type="button"
                                onClick={() => navigate('/dosimetry/campaigns')}
                                className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition flex-shrink-0"
                                aria-label={t('campaigns.form.back')}
                            >
                                <IconArrowLeft size={16} stroke={1.8} className="text-slate-600" />
                            </button>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconClipboardList size={22} stroke={1.8} className="text-white" />
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
                                    {t('campaigns.form.titleNew')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('campaigns.form.subtitle')}
                                </p>
                            </div>
                        </div>
                        {createdId != null && (
                            <Badge
                                color="emerald"
                                variant="light"
                                size="lg"
                                leftSection={<IconCheck size={12} />}
                            >
                                {t('campaigns.form.createdBadge', { id: createdId })}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* ─── Body ─── */}
                <Paper p="md" radius="md" withBorder className="bg-white">
                    <Stepper
                        active={activeStep}
                        onStepClick={(idx) => createdId == null && setActiveStep(idx)}
                        color="indigo"
                        size="sm"
                        iconSize={28}
                    >
                        <Stepper.Step
                            label={t('campaigns.form.steps.identification')}
                            description={t('campaigns.form.steps.identificationDesc')}
                            icon={<IconHash size={14} />}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                <TextInput
                                    label={t('campaigns.form.fields.code')}
                                    description={t('campaigns.form.fields.codeDesc')}
                                    placeholder={t('campaigns.form.fields.codePlaceholder')}
                                    {...form.getInputProps('identification.code')}
                                    required
                                    withAsterisk
                                    leftSection={<IconHash size={14} />}
                                />
                                <TextInput
                                    label={t('campaigns.form.fields.label')}
                                    description={t('campaigns.form.fields.labelDesc')}
                                    placeholder={t('campaigns.form.fields.labelPlaceholder')}
                                    {...form.getInputProps('identification.label')}
                                    required
                                    withAsterisk
                                />
                                <div className="md:col-span-2">
                                    <Textarea
                                        label={t('campaigns.form.fields.objective')}
                                        description={t('campaigns.form.fields.objectiveDesc')}
                                        placeholder={t('campaigns.form.fields.objectivePlaceholder')}
                                        autosize
                                        minRows={2}
                                        maxRows={4}
                                        {...form.getInputProps('identification.objective')}
                                    />
                                </div>
                            </div>
                        </Stepper.Step>

                        <Stepper.Step
                            label={t('campaigns.form.steps.planning')}
                            description={t('campaigns.form.steps.planningDesc')}
                            icon={<IconCalendarTime size={14} />}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                <DateInput
                                    label={t('campaigns.form.fields.startDate')}
                                    description={t('campaigns.form.fields.startDateDesc')}
                                    placeholder="DD/MM/YYYY"
                                    valueFormat="DD/MM/YYYY"
                                    required
                                    withAsterisk
                                    {...form.getInputProps('planning.startDate')}
                                />
                                <DateInput
                                    label={t('campaigns.form.fields.endDate')}
                                    description={t('campaigns.form.fields.endDateDesc')}
                                    placeholder="DD/MM/YYYY"
                                    valueFormat="DD/MM/YYYY"
                                    clearable
                                    {...form.getInputProps('planning.endDate')}
                                />
                                <div className="md:col-span-2">
                                    <Select
                                        label={t('campaigns.form.fields.responsible')}
                                        description={t('campaigns.form.fields.responsibleDesc')}
                                        placeholder={t('campaigns.form.fields.responsiblePlaceholder')}
                                        data={employees}
                                        searchable
                                        clearable
                                        leftSection={<IconUserCircle size={14} />}
                                        nothingFoundMessage={t('campaigns.form.fields.responsibleNotFound')}
                                        {...form.getInputProps('planning.responsibleId')}
                                    />
                                </div>
                            </div>
                        </Stepper.Step>

                        <Stepper.Step
                            label={t('campaigns.form.steps.protocol')}
                            description={t('campaigns.form.steps.protocolDesc')}
                            icon={<IconAdjustments size={14} />}
                        >
                            <div className="grid grid-cols-1 gap-3 mt-4">
                                <Textarea
                                    label={t('campaigns.form.fields.protocol')}
                                    description={t('campaigns.form.fields.protocolDesc')}
                                    placeholder={t('campaigns.form.fields.protocolPlaceholder')}
                                    autosize
                                    minRows={4}
                                    maxRows={10}
                                    {...form.getInputProps('protocol.protocol')}
                                />
                                <MultiSelect
                                    label={t('campaigns.form.fields.measurementPoints')}
                                    description={t('campaigns.form.fields.measurementPointsDesc')}
                                    placeholder={t('campaigns.form.fields.measurementPointsPlaceholder')}
                                    data={pointOptions}
                                    searchable
                                    clearable
                                    leftSection={<IconBroadcast size={14} />}
                                    nothingFoundMessage={t('campaigns.form.fields.measurementPointsNotFound')}
                                    disabled={loadingInitial && pointOptions.length === 0}
                                    {...form.getInputProps('protocol.measurementPointIds')}
                                />
                                {selectedPointsCount === 0 && (
                                    <Alert
                                        color="amber"
                                        variant="light"
                                        icon={<IconInfoCircle size={14} />}
                                    >
                                        {t('campaigns.form.warnings.noPointsSelected')}
                                    </Alert>
                                )}
                            </div>
                        </Stepper.Step>

                        <Stepper.Step
                            label={t('campaigns.form.steps.confirmation')}
                            description={t('campaigns.form.steps.confirmationDesc')}
                            icon={<IconShieldCheck size={14} />}
                        >
                            <div className="mt-4">
                                <h3 className="text-[13px] font-semibold text-slate-800 mb-3">
                                    {t('campaigns.form.summaryTitle')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[12.5px]">
                                    <SummaryRow
                                        label={t('campaigns.form.fields.code')}
                                        value={form.values.identification.code.trim().toUpperCase() || '—'}
                                    />
                                    <SummaryRow
                                        label={t('campaigns.form.fields.label')}
                                        value={form.values.identification.label.trim() || '—'}
                                    />
                                    <SummaryRow
                                        label={t('campaigns.form.fields.startDate')}
                                        value={
                                            form.values.planning.startDate
                                                ? form.values.planning.startDate.toLocaleDateString('fr-FR')
                                                : '—'
                                        }
                                    />
                                    <SummaryRow
                                        label={t('campaigns.form.fields.endDate')}
                                        value={
                                            form.values.planning.endDate
                                                ? form.values.planning.endDate.toLocaleDateString('fr-FR')
                                                : t('campaigns.form.fields.endDateOpen')
                                        }
                                    />
                                    <SummaryRow
                                        label={t('campaigns.form.fields.responsible')}
                                        value={selectedResponsibleLabel ?? '—'}
                                    />
                                    <SummaryRow
                                        label={t('campaigns.form.fields.measurementPoints')}
                                        value={String(selectedPointsCount)}
                                    />
                                    <div className="md:col-span-2">
                                        <SummaryRow
                                            label={t('campaigns.form.fields.objective')}
                                            value={form.values.identification.objective.trim() || '—'}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <SummaryRow
                                            label={t('campaigns.form.fields.protocol')}
                                            value={form.values.protocol.protocol.trim() || '—'}
                                        />
                                    </div>
                                </div>

                                {createdId != null ? (
                                    <Alert
                                        color="emerald"
                                        variant="light"
                                        icon={<IconCheck size={14} />}
                                        mt="md"
                                        title={t('campaigns.form.createdAlert.title')}
                                    >
                                        <Text size="sm" mb="xs">
                                            {t('campaigns.form.createdAlert.message')}
                                        </Text>
                                        <Group>
                                            <Button
                                                color="indigo"
                                                leftSection={<IconPlayerPlay size={14} />}
                                                onClick={handleStart}
                                                loading={starting}
                                            >
                                                {t('campaigns.form.actions.start')}
                                            </Button>
                                            <Button
                                                variant="default"
                                                onClick={() =>
                                                    navigate(`/dosimetry/campaigns/${createdId}`)
                                                }
                                            >
                                                {t('campaigns.form.actions.openDetail')}
                                            </Button>
                                        </Group>
                                    </Alert>
                                ) : (
                                    submitError && (
                                        <Alert
                                            color="red"
                                            variant="light"
                                            icon={<IconAlertOctagon size={14} />}
                                            mt="md"
                                        >
                                            {submitError}
                                        </Alert>
                                    )
                                )}
                            </div>
                        </Stepper.Step>
                    </Stepper>

                    {/* ─── Navigation bar ─── */}
                    <Group justify="space-between" mt="lg">
                        <div className="text-[11px] text-slate-500">
                            {t('campaigns.form.stepCounter', {
                                current: activeStep + 1,
                                total: STEPS.length,
                            })}
                        </div>
                        <Group>
                            {activeStep > 0 && createdId == null && (
                                <Button
                                    variant="default"
                                    leftSection={<IconArrowLeft size={13} />}
                                    onClick={handlePrev}
                                >
                                    {t('campaigns.form.prev')}
                                </Button>
                            )}
                            {activeStep < STEPS.length - 1 ? (
                                <Button
                                    color="indigo"
                                    rightSection={<IconArrowRight size={13} />}
                                    onClick={handleNext}
                                    disabled={createdId != null}
                                >
                                    {t('campaigns.form.next')}
                                </Button>
                            ) : (
                                createdId == null && (
                                    <Button
                                        color="indigo"
                                        leftSection={<IconDeviceFloppy size={14} />}
                                        onClick={handleSubmit}
                                        loading={submitting}
                                    >
                                        {t('campaigns.form.submitCreate')}
                                    </Button>
                                )
                            )}
                        </Group>
                    </Group>
                </Paper>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-component : SummaryRow
// ─────────────────────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-b border-slate-100 py-1.5 flex items-start gap-3">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider min-w-[120px]">
                {label}
            </span>
            <span className="text-slate-800 break-words flex-1">{value}</span>
        </div>
    );
}

export default MonitoringCampaignForm;
