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
    const [submitting, setSubmitting] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [workProcesses, setWorkProcesses] = useState<any[]>([]);
    const [emps, setEmps] = useState<any[]>([]);

    useEffect(() => {
        getAllDepartments()
            .then((data) => setDepartments(data.map((d: any) => ({ value: String(d.id), label: d.name }))))
            .catch((error) => errorNotification(error.response?.data?.errorMessage || 'Échec du chargement des départements'));
        GetAllWorkProcess({})
            .then((data) => setWorkProcesses(data.map((wp: any) => ({ value: String(wp.id), label: wp.name }))))
            .catch((error) => errorNotification(error.response?.data?.errorMessage || 'Échec du chargement des processus'));
        getEmployeeDropdown()
            .then((data) => setEmps(data))
            .catch((error) => errorNotification(error.response?.data?.errorMessage || 'Échec du chargement des employés'));
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
            description: (value) => (value.trim() ? null : 'La description du risque est obligatoire'),
            departmentId: (value) => (value ? null : 'Le département est obligatoire'),
            workProcessId: (value) => (value ? null : 'Le processus de travail est obligatoire'),
            hazardSource: (value) => (value.trim() ? null : 'La source de danger est obligatoire'),
            potentialConsequences: (value) => (value.trim() ? null : 'Les conséquences potentielles sont obligatoires'),
            ownerId: (value) => (value ? null : 'Le responsable du risque est obligatoire'),
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
                errorNotification(error.response?.data?.errorMessage || "Le risque n'a pas pu être chargé");
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
                successNotification('Risque mis à jour');
                navigate('/risks-register');
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'enregistrement a échoué");
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
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Risques' },
                    { label: 'Registre des risques', to: '/risks-register' },
                    { label: 'Modifier le risque' },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="red"
                title="Modifier le risque"
                subtitle="Mettre à jour le scénario, le contexte et le statut de traitement"
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start max-w-6xl">
                    <SectionCard
                        icon={<IconAlertTriangle size={15} stroke={1.8} />}
                        title="Identification du risque"
                        subtitle="Le scénario observé et ses conséquences crédibles"
                    >
                        <Textarea
                            label="Description du risque"
                            placeholder="Ce qui se produit ou pourrait se produire : conditions déclenchantes, lieux, équipements concernés"
                            minRows={3}
                            autosize
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('description')}
                        />
                        <TextInput
                            label="Source de danger"
                            placeholder="ex. Circulation d'engins à proximité des piétons en zone de chargement"
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('hazardSource')}
                        />
                        <Textarea
                            label="Conséquences potentielles"
                            placeholder="Effets crédibles : blessure, arrêt d'exploitation, impact environnemental"
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
                            title="Contexte et suivi"
                            subtitle="Affectation, statut de traitement et prochaine revue"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label="Département"
                                    placeholder="Choisir un département"
                                    data={departments}
                                    withAsterisk
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('departmentId')}
                                />
                                <Select
                                    label="Processus de travail"
                                    placeholder="Choisir un processus"
                                    data={workProcesses}
                                    withAsterisk
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('workProcessId')}
                                />
                                <Select
                                    label="Responsable du risque"
                                    placeholder="Choisir un responsable"
                                    data={emps.map((emp: any) => ({ value: String(emp.id), label: emp.name }))}
                                    withAsterisk
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('ownerId')}
                                />
                                <Select
                                    label="Statut de traitement"
                                    data={RISK_STATUS_OPTIONS}
                                    withAsterisk
                                    size="sm"
                                    allowDeselect={false}
                                    {...form.getInputProps('status')}
                                />
                            </div>
                            <DateInput
                                label="Date de revue"
                                placeholder="Prochaine revue du risque"
                                minDate={new Date()}
                                size="sm"
                                valueFormat="DD/MM/YYYY"
                                clearable
                                {...form.getInputProps('reviewDate')}
                            />
                        </SectionCard>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                            <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                Les modifications sont visibles immédiatement sur le registre et la
                                vue d'ensemble. L'historique des évaluations du risque est conservé.
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
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                color="teal"
                                size="sm"
                                loading={submitting}
                                leftSection={<IconDeviceFloppy size={15} />}
                            >
                                Enregistrer les modifications
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditRegisterForm;
