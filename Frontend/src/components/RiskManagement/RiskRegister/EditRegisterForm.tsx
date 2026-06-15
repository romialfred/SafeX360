import { useEffect, useState } from 'react';
import { Button, Select, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
    IconAlertTriangle,
    IconBuildingFactory2,
    IconDeviceFloppy,
    IconFileText,
} from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../UtilityComp/PageHeader';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { toLocalDate } from '../../../utility/dateConversion';
import { getAllDepartments } from '../../../services/HrmsService';
import { GetAllWorkProcess } from '../../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { getRiskById, updateRisk } from '../../../services/RiskRegisterService';
import { SectionCard } from './RegisterForm';
import { RISK_STATUS_OPTIONS, normalizeRiskStatus } from '../riskLabels';

/**
 * Modification d'un risque du registre (LOT 50) — même structure sectionnée
 * que la création, avec mise à jour du statut de traitement.
 */

interface EditRiskFormValues {
    id: string;
    description: string;
    departmentId: string;
    workProcessId: string;
    hazardSource: string;
    potentialConsequences: string;
    ownerId: string;
    status: string;
    reviewDate: Date | null;
}

const EditRegisterForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const { t } = useTranslation('risk');
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

    const form = useForm<EditRiskFormValues>({
        initialValues: {
            id: '',
            description: '',
            departmentId: '',
            workProcessId: '',
            hazardSource: '',
            potentialConsequences: '',
            ownerId: '',
            status: 'OPEN',
            reviewDate: null,
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

    useEffect(() => {
        if (!id) return;
        dispatch(showOverlay());
        getRiskById(id)
            .then((res) => {
                form.setValues({
                    id: String(res.id ?? id),
                    description: res.description || '',
                    departmentId: res.departmentId ? String(res.departmentId) : '',
                    workProcessId: res.workProcessId ? String(res.workProcessId) : '',
                    hazardSource: res.hazardSource || '',
                    potentialConsequences: res.potentialConsequences || '',
                    ownerId: res.ownerId ? String(res.ownerId) : '',
                    status: normalizeRiskStatus(res.status) || 'OPEN',
                    reviewDate: res.reviewDate ? new Date(res.reviewDate) : null,
                });
            })
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('editRegisterForm.loadFailed'));
                navigate('/risks-register');
            })
            .finally(() => dispatch(hideOverlay()));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSubmit = (values: EditRiskFormValues) => {
        const hazard = values.hazardSource.trim();
        const description = values.description.trim();
        const title = (hazard || description).slice(0, 120);

        setSubmitting(true);
        dispatch(showOverlay());
        const payload = {
            id: values.id || id,
            title,
            description,
            departmentId: values.departmentId ? Number(values.departmentId) : null,
            workProcessId: values.workProcessId ? Number(values.workProcessId) : null,
            hazardSource: hazard,
            potentialConsequences: values.potentialConsequences.trim(),
            ownerId: values.ownerId ? Number(values.ownerId) : null,
            status: values.status,
            reviewDate: toLocalDate(values.reviewDate),
        };
        updateRisk(payload)
            .then(() => {
                successNotification(t('editRegisterForm.updatedToast'));
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
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.home'), to: '/' },
                    { label: t('common.riskManagement') },
                    { label: t('register.breadcrumb'), to: '/risks-register' },
                    { label: t('editRegisterForm.breadcrumbEdit') },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="red"
                title={t('editRegisterForm.title')}
                subtitle={t('editRegisterForm.subtitle')}
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start max-w-6xl">
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

                    <div className="flex flex-col gap-4">
                        <SectionCard
                            icon={<IconBuildingFactory2 size={15} stroke={1.8} />}
                            title={t('editRegisterForm.sectionContext')}
                            subtitle={t('editRegisterForm.sectionContextSub')}
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
                                    data={emps.map((emp: any) => ({ value: String(emp.id), label: emp.name }))}
                                    withAsterisk
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('ownerId')}
                                />
                                <Select
                                    label={t('editRegisterForm.statusLabel')}
                                    data={statusOptions}
                                    withAsterisk
                                    size="sm"
                                    allowDeselect={false}
                                    {...form.getInputProps('status')}
                                />
                            </div>
                            <DateInput
                                label={t('registerForm.reviewDateLabel')}
                                placeholder={t('registerForm.reviewDatePlaceholder')}
                                minDate={new Date()}
                                size="sm"
                                valueFormat="DD/MM/YYYY"
                                clearable
                                {...form.getInputProps('reviewDate')}
                            />
                        </SectionCard>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                            <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                {t('editRegisterForm.hint')}
                            </p>
                        </div>

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
                                color="teal"
                                size="sm"
                                loading={submitting}
                                leftSection={<IconDeviceFloppy size={15} />}
                            >
                                {t('editRegisterForm.saveChanges')}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditRegisterForm;
