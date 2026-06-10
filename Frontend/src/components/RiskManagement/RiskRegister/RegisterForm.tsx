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
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../UtilityComp/PageHeader';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { toLocalDate } from '../../../utility/dateConversion';
import { createRisk } from '../../../services/RiskRegisterService';
import { getAllDepartments } from '../../../services/HrmsService';
import { GetAllWorkProcess } from '../../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { formatDateFr } from '../riskLabels';

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
    <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100">
            <span className="inline-flex p-1.5 rounded-md bg-red-50 text-red-700">{icon}</span>
            <div>
                <h3
                    className="text-slate-800"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </h3>
                <p className="text-[11.5px] text-slate-500">{subtitle}</p>
            </div>
        </div>
        <div className="flex flex-col gap-3">{children}</div>
    </section>
);

const RegisterForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
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

    const form = useForm<RiskFormValues>({
        initialValues: {
            description: '',
            departmentId: '',
            workProcessId: '',
            hazardSource: '',
            potentialConsequences: '',
            ownerId: '',
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
        };
        createRisk(payload)
            .then(() => {
                successNotification('Risque enregistré au registre');
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
                    { label: 'Nouveau risque' },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="red"
                title="Identifier un risque"
                subtitle="Décrire le scénario, la source de danger et le responsable du suivi"
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                    {/* ─── Colonne saisie ─────────────────────────────────── */}
                    <div className="xl:col-span-3 flex flex-col gap-4">
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

                        <SectionCard
                            icon={<IconBuildingFactory2 size={15} stroke={1.8} />}
                            title="Contexte et responsabilité"
                            subtitle="Où le risque se situe et qui en assure le suivi"
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
                                    data={emps.map((emp) => ({ value: String(emp.id), label: emp.name }))}
                                    withAsterisk
                                    size="sm"
                                    searchable
                                    {...form.getInputProps('ownerId')}
                                />
                                <DateInput
                                    label="Date de revue"
                                    placeholder="Prochaine revue du risque"
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
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                color="teal"
                                size="sm"
                                loading={submitting}
                                leftSection={<IconDeviceFloppy size={15} />}
                            >
                                Enregistrer le risque
                            </Button>
                        </div>
                    </div>

                    {/* ─── Fiche risque en direct ─────────────────────────── */}
                    <aside className="xl:col-span-2">
                        <div className="sticky top-4 flex flex-col gap-3">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="px-4 py-2.5 bg-gradient-to-r from-slate-800 to-slate-600 flex items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-100">
                                        Fiche risque HSE
                                    </span>
                                    <span className="text-[11px] font-mono bg-white/15 text-white rounded px-1.5 py-0.5">
                                        Statut : ouvert
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
                                        {form.values.hazardSource || 'Source de danger'}
                                    </h4>
                                    <p className={`text-[12px] mt-1.5 leading-relaxed ${form.values.description ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                                        {form.values.description || 'La description saisie apparaîtra ici, telle que les équipes HSE la liront.'}
                                    </p>

                                    <dl className="mt-4 grid grid-cols-1 gap-2 text-[12px]">
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">Département</dt>
                                            <dd className="text-slate-800">
                                                {departments.find((d) => d.value === form.values.departmentId)?.label ?? '—'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">Processus</dt>
                                            <dd className="text-slate-800">
                                                {workProcesses.find((p) => p.value === form.values.workProcessId)?.label ?? '—'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">Responsable</dt>
                                            <dd className="text-slate-800">
                                                {emps.find((e) => String(e.id) === form.values.ownerId)?.name ?? '—'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                            <dt className="text-slate-500">Prochaine revue</dt>
                                            <dd className="text-slate-800">{formatDateFr(form.values.reviewDate)}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                                    <p className="text-[10.5px] text-slate-500">
                                        ISO 45001 · 6.1.2 — Identification des dangers et évaluation des risques
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                    Une fois le risque enregistré, réalisez une première évaluation
                                    (probabilité × gravité) depuis sa fiche détaillée pour le positionner
                                    sur la matrice.
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
