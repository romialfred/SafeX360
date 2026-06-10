import { useEffect, useState } from 'react';
import { Button, Select, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    IconAlertTriangle,
    IconBuildingFactory2,
    IconDeviceFloppy,
    IconFlask2,
} from '@tabler/icons-react';
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
            <span className="inline-flex p-1.5 rounded-md bg-violet-50 text-violet-700">{icon}</span>
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

const CAS_REGEX = /^\d{2,7}-\d{2}-\d$/;

const RiskIdentification = () => {
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
        },
        validate: {
            reviewDate: (value) => (value ? null : "La date d'identification est obligatoire"),
            departmentId: (value) => (value ? null : 'Le département est obligatoire'),
            workProcessId: (value) => (value ? null : 'Le processus de travail est obligatoire'),
            ownerId: (value) => (value ? null : 'Le responsable du risque est obligatoire'),
            chemicalName: (value) => (value.trim() ? null : 'Le nom du produit est obligatoire'),
            casNumber: (value) => {
                const trimmed = value.trim();
                if (!trimmed) return 'Le n° CAS est obligatoire';
                return CAS_REGEX.test(trimmed) ? null : 'Format attendu : 7664-93-9';
            },
            classification: (value) => (value ? null : 'La classification SGH est obligatoire'),
            hazardSource: (value) => (value ? null : 'La source de danger est obligatoire'),
            methodOfUse: (value) => (value.trim() ? null : "Le mode d'utilisation est obligatoire"),
            description: (value) => (value.trim() ? null : 'La description du risque est obligatoire'),
            potentialConsequences: (value) => (value.trim() ? null : 'Les conséquences potentielles sont obligatoires'),
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
        };

        createChemicalRisk(payload)
            .then(() => {
                successNotification('Risque chimique enregistré au registre');
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

    const classCfg = classificationConfig(form.values.classification);

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                {/* ─── Colonne saisie ─────────────────────────────────────── */}
                <div className="xl:col-span-3 flex flex-col gap-4">
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
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<IconFlask2 size={15} stroke={1.8} />}
                        title="Produit chimique et danger"
                        subtitle="Identification du produit telle qu'elle figure sur la fiche de données de sécurité"
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
                                withAsterisk
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
                            placeholder="ex. Dilution en cuve fermée pour le traitement du minerai, deux fois par poste"
                            minRows={3}
                            autosize
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('methodOfUse')}
                        />
                    </SectionCard>

                    <SectionCard
                        icon={<IconAlertTriangle size={15} stroke={1.8} />}
                        title="Description du risque"
                        subtitle="Le scénario d'exposition et ses conséquences crédibles"
                    >
                        <Textarea
                            label="Description"
                            placeholder="Qui est exposé, pendant quelle tâche et dans quelles conditions"
                            minRows={3}
                            autosize
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('description')}
                        />
                        <Textarea
                            label="Conséquences potentielles"
                            placeholder="Effets possibles sur la santé, la sécurité ou l'environnement"
                            minRows={3}
                            autosize
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('potentialConsequences')}
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

                {/* ─── Fiche risque chimique en direct ─────────────────────── */}
                <aside className="xl:col-span-2">
                    <div className="sticky top-4 flex flex-col gap-3">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-4 py-2.5 bg-gradient-to-r from-violet-800 to-violet-600 flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-[0.18em] text-violet-50">
                                    Fiche risque chimique
                                </span>
                                <span className="text-[11px] font-mono bg-white/15 text-white rounded px-1.5 py-0.5">
                                    {form.values.casNumber.trim() || 'CAS ···'}
                                </span>
                            </div>

                            <div className="relative p-4 pb-3">
                                {classCfg && (
                                    <div
                                        className={`absolute top-3 right-3 rotate-[-6deg] border-2 rounded px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${classCfg.chip}`}
                                        role="img"
                                        aria-label={`Classification : ${classCfg.sgh} ${classCfg.label}`}
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
                                    {form.values.chemicalName || 'Nom du produit chimique'}
                                </h4>
                                <p className={`text-[12px] mt-1.5 leading-relaxed ${form.values.description ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                                    {form.values.description || "La description du risque apparaîtra ici, telle que les équipes HSE la liront."}
                                </p>

                                <dl className="mt-4 grid grid-cols-1 gap-2 text-[12px]">
                                    <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                        <dt className="text-slate-500">Classification</dt>
                                        <dd className="text-slate-800">
                                            {classCfg ? `${classCfg.sgh} · ${classCfg.label}` : '—'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 py-1.5 border-t border-slate-100">
                                        <dt className="text-slate-500">Source de danger</dt>
                                        <dd className="text-slate-800">{hazardSourceLabel(form.values.hazardSource)}</dd>
                                    </div>
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
                                        <dt className="text-slate-500">Identifié le</dt>
                                        <dd className="text-slate-800">{formatDateFr(form.values.reviewDate)}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                                <p className="text-[10.5px] text-slate-500">
                                    ISO 45001 · 6.1.2 — Identification des dangers · Règlement CLP (SGH)
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
    );
};

export default RiskIdentification;
