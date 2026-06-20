import { useEffect, useState } from 'react';
import { Button, MultiSelect, NumberInput, Select, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
    IconAlertTriangle,
    IconBuildingFactory2,
    IconDeviceFloppy,
    IconFileText,
    IconGavel,
    IconShieldSearch,
} from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../UtilityComp/PageHeader';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { toLocalDate } from '../../../utility/dateConversion';
import { createRisk } from '../../../services/RiskRegisterService';
import { getAllDepartments } from '../../../services/HrmsService';
import { GetAllWorkProcess } from '../../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import {
    ACTIVITY_TYPE_OPTIONS,
    HAZARD_CATEGORY_OPTIONS,
    PERSONS_EXPOSED_OPTIONS,
    formatDateFr,
} from '../riskLabels';

/**
 * Identification d'un risque (LOT 50) — formulaire sectionné avec, à droite,
 * la fiche risque qui se construit pendant la saisie.
 */

interface RiskFormValues {
    description: string;
    departmentId: string;
    workProcessId: string;
    hazardSource: string;
    potentialConsequences: string;
    ownerId: string;
    reviewDate: Date | null;
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
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-700 flex-shrink-0">{icon}</span>
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

const RegisterForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation('risk');
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

    const form = useForm<RiskFormValues>({
        initialValues: {
            description: '',
            departmentId: '',
            workProcessId: '',
            hazardSource: '',
            potentialConsequences: '',
            ownerId: '',
            reviewDate: null,
            activityType: '',
            hazardCategory: '',
            personsExposed: [],
            exposureCount: '',
            legalRequirements: '',
            nextReviewDate: null,
        },
        validate: {
            description: (value) => (value.trim() ? null : t('registerForm.validate.description')),
            departmentId: (value) => (value ? null : t('registerForm.validate.department')),
            workProcessId: (value) => (value ? null : t('registerForm.validate.workProcess')),
            hazardSource: (value) => (value.trim() ? null : t('registerForm.validate.hazardSource')),
            potentialConsequences: (value) => (value.trim() ? null : t('registerForm.validate.consequences')),
            ownerId: (value) => (value ? null : t('registerForm.validate.owner')),
        },
        validateInputOnBlur: true,
    });

    const handleSubmit = (values: RiskFormValues) => {
        const hazard = values.hazardSource.trim();
        const description = values.description.trim();
        const title = (hazard || description).slice(0, 120);

        setSubmitting(true);
        dispatch(showOverlay());
        const payload = {
            title,
            description,
            departmentId: Number(values.departmentId),
            workProcessId: Number(values.workProcessId),
            hazardSource: hazard,
            potentialConsequences: values.potentialConsequences.trim(),
            ownerId: Number(values.ownerId),
            status: 'OPEN',
            reviewDate: toLocalDate(values.reviewDate),
            activityType: values.activityType || null,
            hazardCategory: values.hazardCategory || null,
            personsExposed: values.personsExposed.length ? values.personsExposed.join(',') : null,
            exposureCount: values.exposureCount === '' || values.exposureCount === null ? null : Number(values.exposureCount),
            legalRequirements: values.legalRequirements.trim() || null,
            nextReviewDate: toLocalDate(values.nextReviewDate),
        };
        createRisk(payload)
            .then(() => {
                successNotification(t('registerForm.savedToast'));
                navigate('/risks-register');
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('errors.saveFailed'));
            })
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.home'), to: '/' },
                    { label: t('common.riskManagement') },
                    { label: t('register.breadcrumb'), to: '/risks-register' },
                    { label: t('registerForm.breadcrumbNew') },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="red"
                title={t('registerForm.title')}
                subtitle={t('registerForm.subtitle')}
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                    {/* ─── Colonne saisie ─────────────────────────────────── */}
                    <div className="xl:col-span-3 flex flex-col gap-4">
                        <SectionCard
                            icon={<IconAlertTriangle size={15} stroke={1.8} />}
                            title={t('registerForm.sectionIdentification')}
                            subtitle={t('registerForm.sectionIdentificationSub')}
                        >
                            <Textarea
                                label={t('registerForm.descriptionLabel')}
                                placeholder={t('registerForm.descriptionPlaceholder')}
                                minRows={3}
                                autosize
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('description')}
                            />
                            <TextInput
                                label={t('registerForm.hazardSourceLabel')}
                                placeholder={t('registerForm.hazardSourcePlaceholder')}
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('hazardSource')}
                            />
                            <Textarea
                                label={t('registerForm.consequencesLabel')}
                                placeholder={t('registerForm.consequencesPlaceholder')}
                                minRows={2}
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
                                placeholder="Réglementations, normes et autres exigences applicables à ce risque"
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

                        <SectionCard
                            icon={<IconBuildingFactory2 size={15} stroke={1.8} />}
                            title={t('registerForm.sectionContext')}
                            subtitle={t('registerForm.sectionContextSub')}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label={t('registerForm.departmentLabel')}
                                    placeholder={t('common.chooseDepartment')}
                                    data={departments}
                                    withAsterisk
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('departmentId')}
                                />
                                <Select
                                    label={t('registerForm.workProcessLabel')}
                                    placeholder={t('common.chooseProcess')}
                                    data={workProcesses}
                                    withAsterisk
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('workProcessId')}
                                />
                                <Select
                                    label={t('registerForm.ownerLabel')}
                                    placeholder={t('common.chooseOwner')}
                                    data={emps.map((emp) => ({ value: String(emp.id), label: emp.name }))}
                                    withAsterisk
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('ownerId')}
                                />
                                <DateInput
                                    label={t('registerForm.reviewDateLabel')}
                                    placeholder={t('registerForm.reviewDatePlaceholder')}
                                    minDate={new Date()}
                                    size="sm"
                                    valueFormat="DD/MM/YYYY"
                                    clearable
                                    {...form.getInputProps('reviewDate')}
                                />
                            </div>
                        </SectionCard>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                type="button"
                                disabled={submitting}
                                onClick={() => navigate('/risks-register')}
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
                                {t('registerForm.saveRisk')}
                            </Button>
                        </div>
                    </div>

                    {/* ─── Fiche risque en direct ─────────────────────────── */}
                    <aside className="xl:col-span-2">
                        <div className="sticky top-4 flex flex-col gap-3">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="px-4 py-2.5 bg-gradient-to-r from-slate-800 to-slate-600 flex items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-100">
                                        {t('registerForm.cardEyebrow')}
                                    </span>
                                    <span className="text-[11px] font-mono bg-white/15 text-white rounded px-1.5 py-0.5">
                                        {t('registerForm.cardStatusOpen')}
                                    </span>
                                </div>

                                <div className="p-4 pb-3">
                                    <h4
                                        className={`leading-snug ${form.values.hazardSource ? 'text-slate-800' : 'text-slate-400 italic'}`}
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {form.values.hazardSource || t('registerForm.cardHazardPlaceholder')}
                                    </h4>
                                    <p className={`text-[12px] mt-1.5 leading-relaxed ${form.values.description ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                                        {form.values.description || t('registerForm.cardDescriptionPlaceholder')}
                                    </p>

                                    <dl className="mt-4 grid grid-cols-1 gap-2 text-[12px]">
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">{t('registerForm.cardDepartment')}</dt>
                                            <dd className="text-slate-800">
                                                {departments.find((d) => d.value === form.values.departmentId)?.label ?? '—'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">{t('registerForm.cardProcess')}</dt>
                                            <dd className="text-slate-800">
                                                {workProcesses.find((p) => p.value === form.values.workProcessId)?.label ?? '—'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">{t('registerForm.cardOwner')}</dt>
                                            <dd className="text-slate-800">
                                                {emps.find((e) => String(e.id) === form.values.ownerId)?.name ?? '—'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">{t('registerForm.cardNextReview')}</dt>
                                            <dd className="text-slate-800">{formatDateFr(form.values.reviewDate)}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                                    <p className="text-[10.5px] text-slate-500">
                                        {t('registerForm.isoReference')}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                    {t('registerForm.hint')}
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    );
};

export default RegisterForm;
