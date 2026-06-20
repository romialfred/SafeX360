import { useEffect, useState } from 'react';
import { Button, MultiSelect, NumberInput, Select, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
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
import PageHeader from '../../UtilityComp/PageHeader';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getAllDepartments } from '../../../services/HrmsService';
import { GetAllWorkProcess } from '../../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { getChemicalRiskByID, updateChemicalRisk } from '../../../services/RiskIdentificationService';
import { toLocalDate } from '../../../utility/dateConversion';
import { SectionCard } from './RiskIdentification';
import {
    CLASSIFICATION_OPTIONS,
    HAZARD_SOURCE_OPTIONS,
    RISK_STATUS_OPTIONS,
    classificationConfig,
    hazardSourceLabel,
    normalizeRiskStatus,
} from './chemicalLabels';

/**
 * Modification d'un risque chimique (LOT 50) — même structure sectionnée que
 * la création, avec mise à jour du statut de traitement.
 */

const CAS_REGEX = /^\d{2,7}-\d{2}-\d$/;

interface EditChemicalRiskFormValues {
    id: string;
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
    status: string;
    // ISO 45001 §6.1.2 — identification du danger
    activityType: string;
    hazardCategory: string;
    personsExposed: string[];
    exposureCount: number | string;
    // ISO 45001 §6.1.3 : exigences legales et revue planifiee
    legalRequirements: string;
    nextReviewDate: Date | null;
}

const EditChemicalRisk = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const { t } = useTranslation('risk');
    const classificationOptions = CLASSIFICATION_OPTIONS.map((o) => ({
        value: o.value,
        label: `${classificationConfig(o.value)?.sgh ?? ''} · ${t(`chemical.classification.${o.value}`, { defaultValue: classificationConfig(o.value)?.label ?? o.label })}`,
    }));
    const hazardSourceOptions = HAZARD_SOURCE_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`chemical.hazardSource.${o.value}`, { defaultValue: o.label }),
    }));
    const statusOptions = RISK_STATUS_OPTIONS.map((o) => ({ value: o.value, label: t(`status.${o.value}`, { defaultValue: o.label }) }));
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

    const form = useForm<EditChemicalRiskFormValues>({
        initialValues: {
            id: '',
            reviewDate: null,
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
            status: 'OPEN',
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

    useEffect(() => {
        if (!id) return;
        dispatch(showOverlay());
        getChemicalRiskByID(id)
            .then((res) => {
                form.setValues({
                    id: String(res.id ?? id),
                    reviewDate: res.reviewDate ? new Date(res.reviewDate) : new Date(),
                    departmentId: res.departmentId ? String(res.departmentId) : '',
                    workProcessId: res.workProcessId ? String(res.workProcessId) : '',
                    ownerId: res.ownerId ? String(res.ownerId) : '',
                    chemicalName: res.chemicalName || '',
                    casNumber: res.casNumber || '',
                    classification: res.classification || '',
                    hazardSource: res.hazardSource || '',
                    methodOfUse: res.methodOfUse || '',
                    description: res.description || '',
                    potentialConsequences: res.potentialConsequences || '',
                    status: normalizeRiskStatus(res.status) || 'OPEN',
                    activityType: res.activityType || '',
                    hazardCategory: res.hazardCategory || '',
                    personsExposed: res.personsExposed ? res.personsExposed.split(',') : [],
                    exposureCount: res.exposureCount ?? '',
                    legalRequirements: res.legalRequirements || '',
                    nextReviewDate: res.nextReviewDate ? new Date(res.nextReviewDate) : null,
                });
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('editChemicalForm.loadFailed'));
                navigate('/chemical-register');
            })
            .finally(() => dispatch(hideOverlay()));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSubmit = (values: EditChemicalRiskFormValues) => {
        const chemical = values.chemicalName.trim();
        const sourceFr = hazardSourceLabel(values.hazardSource);
        const title = [chemical, sourceFr !== '—' ? sourceFr : null].filter(Boolean).join(' — ').slice(0, 120);

        setSubmitting(true);
        dispatch(showOverlay());
        const payload = {
            id: values.id || id,
            title,
            description: values.description.trim(),
            departmentId: values.departmentId ? Number(values.departmentId) : null,
            workProcessId: values.workProcessId ? Number(values.workProcessId) : null,
            ownerId: values.ownerId ? Number(values.ownerId) : null,
            hazardSource: values.hazardSource,
            potentialConsequences: values.potentialConsequences.trim(),
            reviewDate: toLocalDate(values.reviewDate),
            status: values.status,
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

        updateChemicalRisk(payload)
            .then(() => {
                successNotification(t('editChemicalForm.updatedToast'));
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

    return (
        <div className="min-h-full bg-[#FAF8F3] p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.home'), to: '/' },
                    { label: t('common.riskManagement') },
                    { label: t('chemicalRegister.breadcrumb'), to: '/chemical-register' },
                    { label: t('editChemicalForm.breadcrumbEdit') },
                ]}
                icon={<IconFlask2 size={22} stroke={2} />}
                iconColor="violet"
                title={t('editChemicalForm.title')}
                subtitle={t('editChemicalForm.subtitle')}
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start max-w-6xl">
                    <div className="flex flex-col gap-4">
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
                                    label={t('editChemicalForm.statusLabel')}
                                    data={statusOptions}
                                    withAsterisk
                                    size="sm"
                                    allowDeselect={false}
                                    {...form.getInputProps('status')}
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
                            </div>
                            <Select
                                label={t('chemicalForm.ownerLabel')}
                                placeholder={t('common.chooseOwner')}
                                data={emps.map((emp: any) => ({ value: String(emp.id), label: emp.name }))}
                                size="sm"
                                searchable
                                clearable
                                {...form.getInputProps('ownerId')}
                            />
                        </SectionCard>

                        <SectionCard
                            icon={<IconFlask2 size={15} stroke={1.8} />}
                            title={t('chemicalForm.sectionProduct')}
                            subtitle={t('editChemicalForm.sectionProductSubEdit')}
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
                                placeholder={t('editChemicalForm.methodOfUsePlaceholderEdit')}
                                minRows={3}
                                autosize
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('methodOfUse')}
                            />
                        </SectionCard>
                    </div>

                    <div className="flex flex-col gap-4">
                        <SectionCard
                            icon={<IconAlertTriangle size={15} stroke={1.8} />}
                            title={t('chemicalForm.sectionDescription')}
                            subtitle={t('chemicalForm.sectionDescriptionSub')}
                        >
                            <Textarea
                                label={t('chemicalForm.descriptionLabel')}
                                placeholder={t('chemicalForm.descriptionPlaceholder')}
                                minRows={4}
                                autosize
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('description')}
                            />
                            <Textarea
                                label={t('chemicalForm.consequencesLabel')}
                                placeholder={t('chemicalForm.consequencesPlaceholder')}
                                minRows={4}
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

                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                            <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                {t('editChemicalForm.hint')}
                            </p>
                        </div>

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
                                {t('editChemicalForm.saveChanges')}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditChemicalRisk;
