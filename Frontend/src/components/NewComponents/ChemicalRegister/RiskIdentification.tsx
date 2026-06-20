import { useEffect, useState } from 'react';
import { Button, MultiSelect, NumberInput, Select, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    IconAlertTriangle,
    IconBuildingFactory2,
    IconDeviceFloppy,
    IconFlask2,
    IconGavel,
    IconShieldSearch,
} from '@tabler/icons-react';
import {
    ACTIVITY_TYPE_OPTIONS,
    HAZARD_CATEGORY_OPTIONS,
    PERSONS_EXPOSED_OPTIONS,
} from '../../RiskManagement/riskLabels';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { createChemicalRisk } from '../../../services/RiskIdentificationService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getAllDepartments } from '../../../services/HrmsService';
import { GetAllWorkProcess } from '../../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { toLocalDate } from '../../../utility/dateConversion';
import {
    CLASSIFICATION_OPTIONS,
    HAZARD_SOURCE_OPTIONS,
    classificationConfig,
    formatDateFr,
    hazardSourceLabel,
} from './chemicalLabels';

/**
 * Identification d'un risque chimique (LOT 50) — formulaire sectionné avec,
 * à droite, la « fiche risque chimique » qui se construit pendant la saisie :
 * produit, n° CAS, classe SGH, contexte d'exposition.
 */

interface ChemicalRiskFormValues {
    reviewDate: Date | null;
    departmentId: string;
    workProcessId: string;
    ownerId: string;
    chemicalName: string;
    casNumber: string;
    classification: string;
    hazardSource: string;
    methodOfUse: string;
    description: string;
    potentialConsequences: string;
    // ISO 45001 §6.1.2 — identification du danger
    activityType: string;
    hazardCategory: string;
    personsExposed: string[];
    exposureCount: number | string;
    // ISO 45001 §6.1.3 : exigences legales et revue planifiee
    legalRequirements: string;
    nextReviewDate: Date | null;
}

export const SectionCard = ({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) => (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex-shrink-0">{icon}</span>
            <div className="min-w-0">
                <h3
                    className="text-slate-800 leading-tight"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-0.5">{subtitle}</p>
            </div>
        </div>
        <div className="flex flex-col gap-3 p-5">{children}</div>
    </section>
);

const CAS_REGEX = /^\d{2,7}-\d{2}-\d$/;

const RiskIdentification = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation('risk');
    // Options SGH / sources de danger traduites (codes backend conservés).
    const classificationOptions = CLASSIFICATION_OPTIONS.map((o) => ({
        value: o.value,
        label: `${classificationConfig(o.value)?.sgh ?? ''} · ${t(`chemical.classification.${o.value}`, { defaultValue: classificationConfig(o.value)?.label ?? o.label })}`,
    }));
    const hazardSourceOptions = HAZARD_SOURCE_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`chemical.hazardSource.${o.value}`, { defaultValue: o.label }),
    }));
    const [submitting, setSubmitting] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [workProcesses, setWorkProcesses] = useState<any[]>([]);
    const [emps, setEmps] = useState<any[]>([]);

    useEffect(() => {
        getAllDepartments()
            .then((data) => setDepartments(data.map((d: any) => ({ value: String(d.id), label: d.name }))))
            .catch((error) => errorNotification(error.response?.data?.errorMessage || t('errors.loadDepartments')));
        GetAllWorkProcess({})
            .then((data) => setWorkProcesses(data.map((wp: any) => ({ value: String(wp.id), label: wp.name }))))
            .catch((error) => errorNotification(error.response?.data?.errorMessage || t('errors.loadProcesses')));
        getEmployeeDropdown()
            .then((data) => setEmps(data))
            .catch((error) => errorNotification(error.response?.data?.errorMessage || t('errors.loadEmployees')));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const form = useForm<ChemicalRiskFormValues>({
        initialValues: {
            reviewDate: new Date(),
            departmentId: '',
            workProcessId: '',
            ownerId: '',
            chemicalName: '',
            casNumber: '',
            classification: '',
            hazardSource: '',
            methodOfUse: '',
            description: '',
            potentialConsequences: '',
            activityType: '',
            hazardCategory: '',
            personsExposed: [],
            exposureCount: '',
            legalRequirements: '',
            nextReviewDate: null,
        },
        validate: {
            reviewDate: (value) => (value ? null : t('chemicalForm.validate.identificationDate')),
            departmentId: (value) => (value ? null : t('chemicalForm.validate.department')),
            workProcessId: (value) => (value ? null : t('chemicalForm.validate.workProcess')),
            ownerId: (value) => (value ? null : t('chemicalForm.validate.owner')),
            chemicalName: (value) => (value.trim() ? null : t('chemicalForm.validate.chemicalName')),
            casNumber: (value) => {
                const trimmed = value.trim();
                if (!trimmed) return t('chemicalForm.validate.casRequired');
                return CAS_REGEX.test(trimmed) ? null : t('chemicalForm.validate.casFormat');
            },
            classification: (value) => (value ? null : t('chemicalForm.validate.classification')),
            hazardSource: (value) => (value ? null : t('chemicalForm.validate.hazardSource')),
            methodOfUse: (value) => (value.trim() ? null : t('chemicalForm.validate.methodOfUse')),
            description: (value) => (value.trim() ? null : t('chemicalForm.validate.description')),
            potentialConsequences: (value) => (value.trim() ? null : t('chemicalForm.validate.consequences')),
        },
        validateInputOnBlur: true,
    });

    const handleSubmit = (values: ChemicalRiskFormValues) => {
        const chemical = values.chemicalName.trim();
        const sourceFr = hazardSourceLabel(values.hazardSource);
        const title = [chemical, sourceFr !== '—' ? sourceFr : null].filter(Boolean).join(' — ').slice(0, 120);

        setSubmitting(true);
        dispatch(showOverlay());
        const payload = {
            title,
            description: values.description.trim(),
            departmentId: Number(values.departmentId),
            workProcessId: Number(values.workProcessId),
            ownerId: Number(values.ownerId),
            hazardSource: values.hazardSource,
            potentialConsequences: values.potentialConsequences.trim(),
            reviewDate: toLocalDate(values.reviewDate),
            status: 'OPEN',
            chemicalName: chemical,
            casNumber: values.casNumber.trim(),
            classification: values.classification,
            methodOfUse: values.methodOfUse.trim(),
            activityType: values.activityType || null,
            hazardCategory: values.hazardCategory || null,
            personsExposed: values.personsExposed.length ? values.personsExposed.join(',') : null,
            exposureCount: values.exposureCount === '' || values.exposureCount === null ? null : Number(values.exposureCount),
            legalRequirements: values.legalRequirements.trim() || null,
            nextReviewDate: toLocalDate(values.nextReviewDate),
        };

        createChemicalRisk(payload)
            .then(() => {
                successNotification(t('chemicalForm.savedToast'));
                navigate('/chemical-register');
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('errors.saveFailed'));
            })
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    const classCfg = classificationConfig(form.values.classification);

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                {/* ─── Colonne saisie ─────────────────────────────────────── */}
                <div className="xl:col-span-3 flex flex-col gap-4">
                    <SectionCard
                        icon={<IconBuildingFactory2 size={15} stroke={1.8} />}
                        title={t('chemicalForm.sectionContext')}
                        subtitle={t('chemicalForm.sectionContextSub')}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <DateInput
                                label={t('chemicalForm.identificationDateLabel')}
                                placeholder={t('chemicalForm.chooseDate')}
                                withAsterisk
                                size="sm"
                                valueFormat="DD/MM/YYYY"
                                {...form.getInputProps('reviewDate')}
                            />
                            <Select
                                label={t('chemicalForm.departmentLabel')}
                                placeholder={t('common.chooseDepartment')}
                                data={departments}
                                withAsterisk
                                size="sm"
                                searchable
                                {...form.getInputProps('departmentId')}
                            />
                            <Select
                                label={t('chemicalForm.workProcessLabel')}
                                placeholder={t('common.chooseProcess')}
                                data={workProcesses}
                                withAsterisk
                                size="sm"
                                searchable
                                {...form.getInputProps('workProcessId')}
                            />
                            <Select
                                label={t('chemicalForm.ownerLabel')}
                                placeholder={t('common.chooseOwner')}
                                data={emps.map((emp) => ({ value: String(emp.id), label: emp.name }))}
                                withAsterisk
                                size="sm"
                                searchable
                                {...form.getInputProps('ownerId')}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<IconFlask2 size={15} stroke={1.8} />}
                        title={t('chemicalForm.sectionProduct')}
                        subtitle={t('chemicalForm.sectionProductSub')}
                    >
                        <TextInput
                            label={t('chemicalForm.productNameLabel')}
                            placeholder={t('chemicalForm.productNamePlaceholder')}
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('chemicalName')}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <TextInput
                                label={t('chemicalForm.casLabel')}
                                placeholder={t('chemicalForm.casPlaceholder')}
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('casNumber')}
                            />
                            <Select
                                label={t('chemicalForm.classificationLabel')}
                                placeholder={t('chemicalForm.classificationPlaceholder')}
                                data={classificationOptions}
                                withAsterisk
                                size="sm"
                                searchable
                                {...form.getInputProps('classification')}
                            />
                        </div>
                        <Select
                            label={t('chemicalForm.hazardSourceLabel')}
                            placeholder={t('chemicalForm.hazardSourcePlaceholder')}
                            data={hazardSourceOptions}
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('hazardSource')}
                        />
                        <Textarea
                            label={t('chemicalForm.methodOfUseLabel')}
                            placeholder={t('chemicalForm.methodOfUsePlaceholder')}
                            minRows={3}
                            autosize
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('methodOfUse')}
                        />
                    </SectionCard>

                    <SectionCard
                        icon={<IconAlertTriangle size={15} stroke={1.8} />}
                        title={t('chemicalForm.sectionDescription')}
                        subtitle={t('chemicalForm.sectionDescriptionSub')}
                    >
                        <Textarea
                            label={t('chemicalForm.descriptionLabel')}
                            placeholder={t('chemicalForm.descriptionPlaceholder')}
                            minRows={3}
                            autosize
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('description')}
                        />
                        <Textarea
                            label={t('chemicalForm.consequencesLabel')}
                            placeholder={t('chemicalForm.consequencesPlaceholder')}
                            minRows={3}
                            autosize
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('potentialConsequences')}
                        />
                    </SectionCard>

                    <SectionCard
                        icon={<IconShieldSearch size={15} stroke={1.8} />}
                        title="Identification du danger (ISO 45001 §6.1.2)"
                        subtitle="Nature de l'activité, catégorie de danger et population exposée"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Select
                                label="Type d'activité"
                                placeholder="Sélectionner"
                                data={ACTIVITY_TYPE_OPTIONS}
                                size="sm"
                                clearable
                                {...form.getInputProps('activityType')}
                            />
                            <Select
                                label="Catégorie de danger"
                                placeholder="Sélectionner"
                                data={HAZARD_CATEGORY_OPTIONS}
                                size="sm"
                                clearable
                                {...form.getInputProps('hazardCategory')}
                            />
                            <MultiSelect
                                label="Personnes exposées"
                                placeholder="Sélectionner"
                                data={PERSONS_EXPOSED_OPTIONS}
                                size="sm"
                                clearable
                                {...form.getInputProps('personsExposed')}
                            />
                            <NumberInput
                                label="Nombre de personnes exposées"
                                placeholder="0"
                                min={0}
                                size="sm"
                                {...form.getInputProps('exposureCount')}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<IconGavel size={15} stroke={1.8} />}
                        title="Conformité et revue (ISO 45001 §6.1.3)"
                        subtitle="Exigences légales applicables et planification de la prochaine revue"
                    >
                        <Textarea
                            label="Exigences légales et autres applicables (ISO 45001 §6.1.3)"
                            placeholder="Réglementations, normes et autres exigences applicables à ce risque chimique"
                            minRows={2}
                            autosize
                            size="sm"
                            {...form.getInputProps('legalRequirements')}
                        />
                        <DateInput
                            label="Prochaine revue"
                            placeholder="JJ/MM/AAAA"
                            size="sm"
                            valueFormat="DD/MM/YYYY"
                            clearable
                            {...form.getInputProps('nextReviewDate')}
                        />
                    </SectionCard>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            type="button"
                            disabled={submitting}
                            onClick={() => navigate('/chemical-register')}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            loading={submitting}
                            leftSection={<IconDeviceFloppy size={15} />}
                            styles={{ root: { backgroundColor: '#DC2626' } }}
                        >
                            {t('chemicalForm.saveRisk')}
                        </Button>
                    </div>
                </div>

                {/* ─── Fiche risque chimique en direct ─────────────────────── */}
                <aside className="xl:col-span-2">
                    <div className="sticky top-4 flex flex-col gap-3">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-4 py-2.5 bg-gradient-to-r from-violet-800 to-violet-600 flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-[0.18em] text-violet-50">
                                    {t('chemicalForm.cardEyebrow')}
                                </span>
                                <span className="text-[11px] font-mono bg-white/15 text-white rounded px-1.5 py-0.5">
                                    {form.values.casNumber.trim() || t('chemicalForm.cardCasPlaceholder')}
                                </span>
                            </div>

                            <div className="relative p-4 pb-3">
                                {classCfg && (
                                    <div
                                        className={`absolute top-3 right-3 rotate-[-6deg] border-2 rounded px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${classCfg.chip}`}
                                        role="img"
                                        aria-label={t('chemicalForm.classificationAria', { sgh: classCfg.sgh, label: t(`chemical.classification.${form.values.classification}`, { defaultValue: classCfg.label }) })}
                                    >
                                        {classCfg.sgh}
                                    </div>
                                )}

                                <h4
                                    className={`pr-16 leading-snug ${form.values.chemicalName ? 'text-slate-800' : 'text-slate-400 italic'}`}
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    {form.values.chemicalName || t('chemicalForm.cardProductPlaceholder')}
                                </h4>
                                <p className={`text-[12px] mt-1.5 leading-relaxed ${form.values.description ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                                    {form.values.description || t('chemicalForm.cardDescriptionPlaceholder')}
                                </p>

                                <dl className="mt-4 grid grid-cols-1 gap-2 text-[12px]">
                                    <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                        <dt className="text-slate-500">{t('chemicalForm.cardClassification')}</dt>
                                        <dd className="text-slate-800">
                                            {classCfg ? `${classCfg.sgh} · ${t(`chemical.classification.${form.values.classification}`, { defaultValue: classCfg.label })}` : '—'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                        <dt className="text-slate-500">{t('chemicalForm.cardHazardSource')}</dt>
                                        <dd className="text-slate-800">{form.values.hazardSource ? t(`chemical.hazardSource.${form.values.hazardSource}`, { defaultValue: hazardSourceLabel(form.values.hazardSource) }) : '—'}</dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                        <dt className="text-slate-500">{t('chemicalForm.cardDepartment')}</dt>
                                        <dd className="text-slate-800">
                                            {departments.find((d) => d.value === form.values.departmentId)?.label ?? '—'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                        <dt className="text-slate-500">{t('chemicalForm.cardProcess')}</dt>
                                        <dd className="text-slate-800">
                                            {workProcesses.find((p) => p.value === form.values.workProcessId)?.label ?? '—'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                        <dt className="text-slate-500">{t('chemicalForm.cardOwner')}</dt>
                                        <dd className="text-slate-800">
                                            {emps.find((e) => String(e.id) === form.values.ownerId)?.name ?? '—'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                        <dt className="text-slate-500">{t('chemicalForm.cardIdentifiedOn')}</dt>
                                        <dd className="text-slate-800">{formatDateFr(form.values.reviewDate)}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                                <p className="text-[10.5px] text-slate-500">
                                    {t('chemicalForm.isoReference')}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                            <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                {t('chemicalForm.hint')}
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </form>
    );
};

export default RiskIdentification;
