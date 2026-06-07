/**
 * MeasurementPointForm — Phase 6 Frontend-A (LOT Dosimetrie & Expositions).
 *
 * Formulaire premium SafeX 360 de creation / edition d'un point de mesure d'ambiance.
 *
 * Routes :
 *   - /dosimetry/measurement-points/new       (creation)
 *   - /dosimetry/measurement-points/edit/:id  (edition)
 *
 * Stepper 3 etapes Mantine :
 *   1. Identification : code (unique par mine) + label + mineId (lecture seule = tenant)
 *   2. Localisation   : zone (work area), coordonnees latitude/longitude/elevation, description, location libre
 *   3. Parametres     : zoneClassification (SURVEILLED/CONTROLLED/NONE) + referenceLevel (uSv/h) + confirmation
 *
 * Validation Mantine :
 *   - code obligatoire et unique par mine (validation client + serveur)
 *   - label obligatoire
 *   - zoneClassification obligatoire
 *   - referenceLevel > 0 (validation cote service)
 *
 * Submit :
 *   - createMeasurementPoint / updateMeasurementPoint
 *   - Redirige vers /dosimetry/measurement-points/detail/:id en cas de succes.
 *
 * Pattern UI aligne sur ExposedWorkerForm / DoseEntryForm.
 * i18n : namespace `dosimetry` -> bloc `ambient.form`.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '@mantine/form';
import {
    Stepper,
    Paper,
    Group,
    Button,
    Select,
    NumberInput,
    Textarea,
    Text,
    Alert,
    TextInput,
    Badge,
    Tooltip,
} from '@mantine/core';
import {
    IconBroadcast,
    IconChevronRight,
    IconArrowLeft,
    IconArrowRight,
    IconMapPin,
    IconHash,
    IconAdjustments,
    IconCheck,
    IconAlertOctagon,
    IconDeviceFloppy,
    IconInfoCircle,
    IconRulerMeasure,
    IconShieldCheck,
} from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../slices/hooks';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { getAllActiveWorkArea } from '../../services/WorkAreaService';
import {
    createMeasurementPoint,
    updateMeasurementPoint,
    getMeasurementPoint,
    listMeasurementPoints,
    type MeasurementPointDTO,
    type ZoneClass,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Modele de formulaire
// ─────────────────────────────────────────────────────────────────────────────

interface FormShape {
    identification: {
        code: string;
        label: string;
    };
    location: {
        zoneId: string;
        location: string;
        description: string;
        latitude: number | '';
        longitude: number | '';
        elevation: number | '';
    };
    parameters: {
        zoneClassification: ZoneClass | '';
        referenceLevel: number | '';
    };
}

const STEPS = ['identification', 'location', 'parameters'] as const;

const MeasurementPointForm = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const params = useParams();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state: any) => state.companySelection?.selectedCompanyId);

    const editId = params?.id ? Number(params.id) : null;
    const isEdit = editId !== null && !Number.isNaN(editId);

    const mineId: number = Number(selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1);

    const [activeStep, setActiveStep] = useState(0);
    const [workAreas, setWorkAreas] = useState<{ value: string; label: string }[]>([]);
    const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm<FormShape>({
        initialValues: {
            identification: { code: '', label: '' },
            location: { zoneId: '', location: '', description: '', latitude: '', longitude: '', elevation: '' },
            parameters: { zoneClassification: '', referenceLevel: '' },
        },
        validate: {
            identification: {
                code: (value) => {
                    if (!value || !value.trim()) return t('ambient.form.errors.codeRequired');
                    if (value.length > 32) return t('ambient.form.errors.codeTooLong');
                    const upper = value.trim().toUpperCase();
                    if (existingCodes.has(upper)) {
                        return t('ambient.form.errors.codeAlreadyUsed');
                    }
                    return null;
                },
                label: (value) =>
                    !value || !value.trim() ? t('ambient.form.errors.labelRequired') : null,
            },
            parameters: {
                zoneClassification: (value) =>
                    !value ? t('ambient.form.errors.zoneClassificationRequired') : null,
                referenceLevel: (value) => {
                    if (value === '' || value == null) return null; // optionnel
                    const n = Number(value);
                    if (Number.isNaN(n)) return t('ambient.form.errors.referenceLevelNumber');
                    if (n <= 0) return t('ambient.form.errors.referenceLevelPositive');
                    return null;
                },
            },
        },
    });

    // ───── Chargement initial (work areas + codes existants + edit) ─────
    useEffect(() => {
        let cancelled = false;
        setLoadingInitial(true);
        Promise.all([
            getAllActiveWorkArea().catch(() => []),
            listMeasurementPoints(mineId).catch(() => [] as MeasurementPointDTO[]),
            isEdit ? getMeasurementPoint(editId as number) : Promise.resolve(null as MeasurementPointDTO | null),
        ])
            .then(([wa, points, existing]) => {
                if (cancelled) return;
                // Work areas
                const list = Array.isArray(wa) ? wa : (wa?.content ?? []);
                setWorkAreas(
                    list
                        .map((w: any) => ({
                            value: String(w?.id ?? ''),
                            label: w?.name ?? w?.label ?? w?.code ?? `WA #${w?.id ?? ''}`,
                        }))
                        .filter((o: any) => o.value),
                );
                // Codes deja existants pour la validation client
                const codes = new Set<string>();
                points.forEach((p) => {
                    if (p.code && (!isEdit || p.id !== editId)) {
                        codes.add(p.code.trim().toUpperCase());
                    }
                });
                setExistingCodes(codes);
                // Si edition, hydratation du formulaire
                if (isEdit && existing) {
                    form.setValues({
                        identification: {
                            code: existing.code ?? '',
                            label: existing.label ?? '',
                        },
                        location: {
                            zoneId: existing.zoneId != null ? String(existing.zoneId) : '',
                            location: existing.location ?? '',
                            description: existing.description ?? '',
                            latitude: existing.latitude != null ? Number(existing.latitude) : '',
                            longitude: existing.longitude != null ? Number(existing.longitude) : '',
                            elevation: existing.elevation != null ? Number(existing.elevation) : '',
                        },
                        parameters: {
                            zoneClassification: (existing.zoneClassification ?? '') as ZoneClass | '',
                            referenceLevel: existing.referenceLevel != null ? Number(existing.referenceLevel) : '',
                        },
                    });
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingInitial(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, isEdit, mineId]);

    const stepIndexByKey = useMemo(() => {
        const m: Record<string, number> = {};
        STEPS.forEach((k, i) => { m[k] = i; });
        return m;
    }, []);

    // ───── Navigation Stepper avec validation par etape ─────
    const validateStep = (idx: number): boolean => {
        const key = STEPS[idx];
        const validation = form.validate();
        if (key === 'identification') {
            return !validation.errors?.['identification.code'] && !validation.errors?.['identification.label'];
        }
        if (key === 'parameters') {
            return (
                !validation.errors?.['parameters.zoneClassification']
                && !validation.errors?.['parameters.referenceLevel']
            );
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep(activeStep)) return;
        setActiveStep((s) => Math.min(STEPS.length - 1, s + 1));
    };

    const handlePrev = () => {
        setActiveStep((s) => Math.max(0, s - 1));
    };

    // ───── Submit ─────
    const buildPayload = (): MeasurementPointDTO => {
        const v = form.values;
        const ref = v.parameters.referenceLevel;
        return {
            id: isEdit ? (editId as number) : null,
            mineId,
            code: v.identification.code.trim().toUpperCase(),
            label: v.identification.label.trim(),
            zoneId: v.location.zoneId ? Number(v.location.zoneId) : null,
            description: v.location.description.trim() || null,
            location: v.location.location.trim() || null,
            latitude: v.location.latitude !== '' ? Number(v.location.latitude) : null,
            longitude: v.location.longitude !== '' ? Number(v.location.longitude) : null,
            elevation: v.location.elevation !== '' ? Number(v.location.elevation) : null,
            zoneClassification: v.parameters.zoneClassification as ZoneClass,
            referenceLevel: ref !== '' && ref != null ? Number(ref) : null,
            active: true,
        };
    };

    const handleSubmit = async () => {
        const validation = form.validate();
        if (validation.hasErrors) {
            errorNotification(t('ambient.form.errors.invalid'));
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        dispatch(showOverlay());
        try {
            const payload = buildPayload();
            if (isEdit) {
                await updateMeasurementPoint(editId as number, payload);
                successNotification(t('ambient.form.successUpdate'));
                navigate(`/dosimetry/measurement-points/detail/${editId}`);
            } else {
                const newId = await createMeasurementPoint(payload);
                successNotification(t('ambient.form.successCreate'));
                navigate(`/dosimetry/measurement-points/detail/${newId}`);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.message ?? t('ambient.form.errorGeneric');
            setSubmitError(msg);
            errorNotification(msg);
        } finally {
            setSubmitting(false);
            dispatch(hideOverlay());
        }
    };

    // ───── Render ─────
    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1100px] mx-auto">

                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">{t('ambient.points.breadcrumbRoot')}</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] font-medium">{t('ambient.points.breadcrumbParent')}</span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/measurement-points')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-600 transition"
                    >
                        {t('ambient.points.breadcrumbCurrent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {isEdit ? t('ambient.form.breadcrumbEdit') : t('ambient.form.breadcrumbNew')}
                    </span>
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
                                <IconBroadcast size={22} stroke={1.8} className="text-white" />
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
                                    {isEdit ? t('ambient.form.titleEdit') : t('ambient.form.titleNew')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('ambient.form.subtitle')}
                                </p>
                            </div>
                        </div>
                        <Group gap="xs">
                            <Button
                                variant="default"
                                size="xs"
                                leftSection={<IconArrowLeft size={13} stroke={1.8} />}
                                onClick={() => navigate('/dosimetry/measurement-points')}
                            >
                                {t('ambient.form.back')}
                            </Button>
                        </Group>
                    </div>
                </div>

                {/* ─── Banner erreur ─── */}
                {submitError && (
                    <Alert color="red" icon={<IconAlertOctagon size={14} />} className="mb-4">
                        {submitError}
                    </Alert>
                )}

                {/* ─── Stepper ─── */}
                <Paper p="lg" radius="md" withBorder className="bg-white">
                    <Stepper
                        active={activeStep}
                        onStepClick={(idx) => {
                            // Permettre la navigation arriere libre, avant uniquement si validation OK
                            if (idx < activeStep || validateStep(activeStep)) {
                                setActiveStep(idx);
                            }
                        }}
                        size="sm"
                        iconSize={32}
                        allowNextStepsSelect={false}
                    >
                        <Stepper.Step
                            label={t('ambient.form.steps.identification')}
                            description={t('ambient.form.steps.identificationDesc')}
                            icon={<IconHash size={14} stroke={1.8} />}
                        >
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextInput
                                    label={t('ambient.form.fields.code')}
                                    description={t('ambient.form.fields.codeDesc')}
                                    placeholder={t('ambient.form.fields.codePlaceholder')}
                                    required
                                    withAsterisk
                                    {...form.getInputProps('identification.code')}
                                    onChange={(e) => form.setFieldValue('identification.code', e.currentTarget.value.toUpperCase())}
                                    leftSection={<IconHash size={14} />}
                                />
                                <TextInput
                                    label={t('ambient.form.fields.label')}
                                    description={t('ambient.form.fields.labelDesc')}
                                    placeholder={t('ambient.form.fields.labelPlaceholder')}
                                    required
                                    withAsterisk
                                    {...form.getInputProps('identification.label')}
                                    leftSection={<IconBroadcast size={14} />}
                                />
                                <div className="md:col-span-2">
                                    <div className="flex items-center gap-2 text-[12px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                                        <IconShieldCheck size={14} className="text-indigo-600" />
                                        <span>
                                            {t('ambient.form.fields.mineContext')}
                                            <Badge color="indigo" variant="light" ml={6}>
                                                #{mineId}
                                            </Badge>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Stepper.Step>

                        <Stepper.Step
                            label={t('ambient.form.steps.location')}
                            description={t('ambient.form.steps.locationDesc')}
                            icon={<IconMapPin size={14} stroke={1.8} />}
                        >
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label={t('ambient.form.fields.zone')}
                                    description={t('ambient.form.fields.zoneDesc')}
                                    placeholder={t('ambient.form.fields.zonePlaceholder')}
                                    searchable
                                    clearable
                                    data={workAreas}
                                    {...form.getInputProps('location.zoneId')}
                                    leftSection={<IconMapPin size={14} />}
                                    disabled={loadingInitial}
                                />
                                <TextInput
                                    label={t('ambient.form.fields.locationText')}
                                    description={t('ambient.form.fields.locationTextDesc')}
                                    placeholder={t('ambient.form.fields.locationTextPlaceholder')}
                                    {...form.getInputProps('location.location')}
                                />
                                <NumberInput
                                    label={t('ambient.form.fields.latitude')}
                                    placeholder="0.0000"
                                    decimalScale={6}
                                    step={0.0001}
                                    {...form.getInputProps('location.latitude')}
                                />
                                <NumberInput
                                    label={t('ambient.form.fields.longitude')}
                                    placeholder="0.0000"
                                    decimalScale={6}
                                    step={0.0001}
                                    {...form.getInputProps('location.longitude')}
                                />
                                <NumberInput
                                    label={t('ambient.form.fields.elevation')}
                                    description={t('ambient.form.fields.elevationDesc')}
                                    placeholder="0.0"
                                    decimalScale={2}
                                    step={0.5}
                                    {...form.getInputProps('location.elevation')}
                                />
                                <div className="md:col-span-2">
                                    <Textarea
                                        label={t('ambient.form.fields.description')}
                                        description={t('ambient.form.fields.descriptionDesc')}
                                        placeholder={t('ambient.form.fields.descriptionPlaceholder')}
                                        autosize
                                        minRows={3}
                                        maxRows={6}
                                        {...form.getInputProps('location.description')}
                                    />
                                </div>
                            </div>
                        </Stepper.Step>

                        <Stepper.Step
                            label={t('ambient.form.steps.parameters')}
                            description={t('ambient.form.steps.parametersDesc')}
                            icon={<IconAdjustments size={14} stroke={1.8} />}
                        >
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label={t('ambient.form.fields.zoneClassification')}
                                    description={t('ambient.form.fields.zoneClassificationDesc')}
                                    placeholder={t('ambient.form.fields.zoneClassificationPlaceholder')}
                                    required
                                    withAsterisk
                                    data={[
                                        { value: 'NONE', label: t('ambient.zoneClass.NONE') },
                                        { value: 'SURVEILLED', label: t('ambient.zoneClass.SURVEILLED') },
                                        { value: 'CONTROLLED', label: t('ambient.zoneClass.CONTROLLED') },
                                    ]}
                                    {...form.getInputProps('parameters.zoneClassification')}
                                    leftSection={<IconShieldCheck size={14} />}
                                />
                                <Tooltip label={t('ambient.form.fields.referenceLevelHint')} multiline w={260}>
                                    <NumberInput
                                        label={t('ambient.form.fields.referenceLevel')}
                                        description={t('ambient.form.fields.referenceLevelDesc')}
                                        placeholder="2.0"
                                        decimalScale={3}
                                        step={0.1}
                                        min={0}
                                        suffix=" µSv/h"
                                        {...form.getInputProps('parameters.referenceLevel')}
                                        leftSection={<IconRulerMeasure size={14} />}
                                    />
                                </Tooltip>
                                <div className="md:col-span-2 bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-[12px] text-indigo-900 flex items-start gap-2">
                                    <IconInfoCircle size={15} className="mt-0.5 flex-shrink-0" />
                                    <div>
                                        <Text size="xs" fw={600}>{t('ambient.form.summaryTitle')}</Text>
                                        <Text size="xs" mt={4}>
                                            {t('ambient.form.summary', {
                                                code: form.values.identification.code || '—',
                                                label: form.values.identification.label || '—',
                                                zone: form.values.parameters.zoneClassification
                                                    ? t(`ambient.zoneClass.${form.values.parameters.zoneClassification}`)
                                                    : '—',
                                                reference: form.values.parameters.referenceLevel || '—',
                                            })}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </Stepper.Step>

                        <Stepper.Completed>
                            <div className="mt-6 flex flex-col items-center justify-center text-center px-4 py-8">
                                <IconCheck size={32} className="text-emerald-500" />
                                <Text mt="sm" size="sm" c="dimmed">
                                    {t('ambient.form.allStepsDone')}
                                </Text>
                            </div>
                        </Stepper.Completed>
                    </Stepper>

                    {/* ─── Navigation ─── */}
                    <Group justify="space-between" mt="xl">
                        <Button
                            variant="default"
                            leftSection={<IconArrowLeft size={14} />}
                            onClick={handlePrev}
                            disabled={activeStep === 0 || submitting}
                        >
                            {t('ambient.form.prev')}
                        </Button>
                        <Group gap="xs">
                            <Text size="xs" c="dimmed">
                                {t('ambient.form.stepCounter', { current: activeStep + 1, total: STEPS.length })}
                            </Text>
                            {activeStep < STEPS.length - 1 ? (
                                <Button
                                    rightSection={<IconArrowRight size={14} />}
                                    onClick={handleNext}
                                    disabled={submitting}
                                    color="indigo"
                                >
                                    {t('ambient.form.next')}
                                </Button>
                            ) : (
                                <Button
                                    leftSection={<IconDeviceFloppy size={14} />}
                                    onClick={handleSubmit}
                                    loading={submitting}
                                    color="indigo"
                                >
                                    {isEdit ? t('ambient.form.submitUpdate') : t('ambient.form.submitCreate')}
                                </Button>
                            )}
                        </Group>
                    </Group>
                </Paper>
            </div>
        </div>
    );
};

export default MeasurementPointForm;
