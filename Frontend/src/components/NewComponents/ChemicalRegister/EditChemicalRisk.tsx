import { useEffect, useState } from 'react';
import { Button, Select, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IconAlertTriangle,
    IconBuildingFactory2,
    IconDeviceFloppy,
    IconFlask2,
} from '@tabler/icons-react';
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
    hazardSourceLabel,
    normalizeRiskStatus,
} from './chemicalLabels';

/**
 * Modification d'un risque chimique (LOT 50) — même structure sectionnée que
 * la création, avec mise à jour du statut de traitement.
 */

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
}

const EditChemicalRisk = () => {
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
        },
        validate: {
            reviewDate: (value) => (value ? null : "La date d'identification est obligatoire"),
            departmentId: (value) => (value ? null : 'Le département est obligatoire'),
            workProcessId: (value) => (value ? null : 'Le processus de travail est obligatoire'),
            chemicalName: (value) => (value.trim() ? null : 'Le nom du produit est obligatoire'),
            classification: (value) => (value ? null : 'La classification SGH est obligatoire'),
            hazardSource: (value) => (value ? null : 'La source de danger est obligatoire'),
            methodOfUse: (value) => (value.trim() ? null : "Le mode d'utilisation est obligatoire"),
            description: (value) => (value.trim() ? null : 'La description du risque est obligatoire'),
            potentialConsequences: (value) => (value.trim() ? null : 'Les conséquences potentielles sont obligatoires'),
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
                });
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Le risque chimique n'a pas pu être chargé");
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
        };

        updateChemicalRisk(payload)
            .then(() => {
                successNotification('Risque chimique mis à jour');
                navigate('/chemical-register');
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
                    { label: 'Registre chimique', to: '/chemical-register' },
                    { label: 'Modifier le risque' },
                ]}
                icon={<IconFlask2 size={22} stroke={2} />}
                iconColor="violet"
                title="Modifier le risque chimique"
                subtitle="Mettre à jour la fiche produit, le scénario d'exposition et le statut de traitement"
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start max-w-6xl">
                    <div className="flex flex-col gap-4">
                        <SectionCard
                            icon={<IconBuildingFactory2 size={15} stroke={1.8} />}
                            title="Contexte d'identification"
                            subtitle="Où le produit est manipulé et qui répond du risque"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <DateInput
                                    label="Date d'identification"
                                    placeholder="Choisir une date"
                                    withAsterisk
                                    size="sm"
                                    valueFormat="DD/MM/YYYY"
                                    {...form.getInputProps('reviewDate')}
                                />
                                <Select
                                    label="Statut de traitement"
                                    data={RISK_STATUS_OPTIONS}
                                    withAsterisk
                                    size="sm"
                                    allowDeselect={false}
                                    {...form.getInputProps('status')}
                                />
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
                            </div>
                            <Select
                                label="Responsable du risque"
                                placeholder="Choisir un responsable"
                                data={emps.map((emp: any) => ({ value: String(emp.id), label: emp.name }))}
                                size="sm"
                                searchable
                                clearable
                                {...form.getInputProps('ownerId')}
                            />
                        </SectionCard>

                        <SectionCard
                            icon={<IconFlask2 size={15} stroke={1.8} />}
                            title="Produit chimique et danger"
                            subtitle="À vérifier contre la dernière fiche de données de sécurité"
                        >
                            <TextInput
                                label="Nom du produit"
                                placeholder="ex. Acide sulfurique 98 %"
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('chemicalName')}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <TextInput
                                    label="N° CAS"
                                    placeholder="ex. 7664-93-9"
                                    size="sm"
                                    {...form.getInputProps('casNumber')}
                                />
                                <Select
                                    label="Classification SGH"
                                    placeholder="Choisir une classe de danger"
                                    data={CLASSIFICATION_OPTIONS}
                                    withAsterisk
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('classification')}
                                />
                            </div>
                            <Select
                                label="Source de danger"
                                placeholder="Choisir la situation exposante"
                                data={HAZARD_SOURCE_OPTIONS}
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('hazardSource')}
                            />
                            <Textarea
                                label="Mode d'utilisation"
                                placeholder="Comment le produit est appliqué ou transformé aujourd'hui"
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
                            title="Description du risque"
                            subtitle="Le scénario d'exposition et ses conséquences crédibles"
                        >
                            <Textarea
                                label="Description"
                                placeholder="Qui est exposé, pendant quelle tâche et dans quelles conditions"
                                minRows={4}
                                autosize
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('description')}
                            />
                            <Textarea
                                label="Conséquences potentielles"
                                placeholder="Effets possibles sur la santé, la sécurité ou l'environnement"
                                minRows={4}
                                autosize
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('potentialConsequences')}
                            />
                        </SectionCard>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                            <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                Les modifications sont visibles immédiatement sur le registre et la
                                matrice. L'historique des évaluations du risque est conservé.
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

export default EditChemicalRisk;
