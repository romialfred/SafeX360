import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ActionIcon, Button, Modal, Select, TextInput, Textarea, Tooltip } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
    IconClipboardCheck,
    IconLayersIntersect,
    IconPencil,
    IconPlus,
    IconShieldCheck,
    IconTrash,
} from '@tabler/icons-react';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { toLocalDate } from '../../utility/dateConversion';
import { getEmployeeDropdown } from '../../services/EmployeeService';
import {
    RiskControlDTO,
    RiskControlSourceType,
    createRiskControl,
    deleteRiskControl,
    listRiskControls,
    updateRiskControl,
} from '../../services/RiskControlService';
import {
    createCorrectiveAction,
    getCorrectiveActionsByRiskControl,
} from '../../services/CorrectiveActionService';
import {
    CONTROL_STATUS_OPTIONS,
    CONTROL_TYPE_CONFIG,
    CONTROL_TYPE_OPTIONS,
    CONTROL_TYPE_ORDER,
    controlStatusConfig,
    formatDateFr,
} from './riskLabels';
import { CA_STATUS_OPTIONS, caStatusConfig } from '../LaggingIndicator/CorrectiveAction/correctiveLabels';

/**
 * Plan de maîtrise (ISO 45001 §8.1.2) : affiche les mesures de la hiérarchie
 * de contrôle rattachées à un risque (général ou chimique), groupées par
 * palier (Élimination → EPI), avec ajout / modification / suppression.
 */

interface RiskControlPanelProps {
    sourceType: RiskControlSourceType;
    riskId: number;
}

type ControlFormValues = {
    controlType: string;
    description: string;
    responsibleId: string;
    dueDate: Date | null;
    status: string;
};

type CaFormValues = {
    actionName: string;
    description: string;
    assignedEmployeeId: string;
    deadline: Date | null;
    status: string;
};

const RiskControlPanel = ({ sourceType, riskId }: RiskControlPanelProps) => {
    const navigate = useNavigate();
    const user = useSelector((state: any) => state.user);
    const [controls, setControls] = useState<RiskControlDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [emps, setEmps] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<RiskControlDTO | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    // Actions correctives rattachees, indexees par id de mesure de maitrise.
    const [linkedActions, setLinkedActions] = useState<Record<number, any[]>>({});
    const [caModalOpen, setCaModalOpen] = useState(false);
    const [caControl, setCaControl] = useState<RiskControlDTO | null>(null);
    const [caSubmitting, setCaSubmitting] = useState(false);

    const form = useForm<ControlFormValues>({
        initialValues: {
            controlType: '',
            description: '',
            responsibleId: '',
            dueDate: null,
            status: 'PLANNED',
        },
        validate: {
            controlType: (value) => (value ? null : 'Sélectionnez un type de mesure'),
            description: (value) => (value.trim() ? null : 'La description est requise'),
        },
        validateInputOnBlur: true,
    });

    const caForm = useForm<CaFormValues>({
        initialValues: {
            actionName: '',
            description: '',
            assignedEmployeeId: '',
            deadline: null,
            status: 'PENDING',
        },
        validate: {
            actionName: (value) => {
                const trimmed = value.trim();
                if (!trimmed) return "L'intitulé est requis";
                return trimmed.length > 50 ? '50 caractères maximum' : null;
            },
            status: (value) => (value ? null : 'Le statut est requis'),
        },
        validateInputOnBlur: true,
    });

    // Index id -> employe (resout le departement du responsable au submit).
    const empMap: Record<string, any> = emps.reduce((acc, emp) => {
        acc[String(emp.id)] = emp;
        return acc;
    }, {} as Record<string, any>);

    const fetchLinkedActions = (list: RiskControlDTO[]) => {
        const ids = list.map((c) => c.id).filter((id): id is number => id != null);
        if (ids.length === 0) {
            setLinkedActions({});
            return;
        }
        Promise.all(
            ids.map((id) =>
                getCorrectiveActionsByRiskControl(id)
                    .then((res) => ({ id, actions: (res ?? []) as any[] }))
                    .catch(() => ({ id, actions: [] as any[] }))
            )
        ).then((results) => {
            const map: Record<number, any[]> = {};
            results.forEach(({ id, actions }) => {
                map[id] = actions;
            });
            setLinkedActions(map);
        });
    };

    const fetchControls = () => {
        if (!riskId) return;
        setLoading(true);
        listRiskControls(sourceType, riskId)
            .then((data) => {
                const list = data ?? [];
                setControls(list);
                fetchLinkedActions(list);
            })
            .catch((error) => errorNotification(error.response?.data?.errorMessage || 'Chargement des mesures impossible'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        getEmployeeDropdown()
            .then((data) => setEmps(data))
            .catch((error) => errorNotification(error.response?.data?.errorMessage || 'Chargement des employés impossible'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchControls();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceType, riskId]);

    const openCreate = () => {
        setEditing(null);
        form.setValues({ controlType: '', description: '', responsibleId: '', dueDate: null, status: 'PLANNED' });
        setModalOpen(true);
    };

    const openEdit = (control: RiskControlDTO) => {
        setEditing(control);
        form.setValues({
            controlType: control.controlType,
            description: control.description || '',
            responsibleId: control.responsibleId != null ? String(control.responsibleId) : '',
            dueDate: control.dueDate ? new Date(control.dueDate) : null,
            status: control.status || 'PLANNED',
        });
        setModalOpen(true);
    };

    const handleSubmit = (values: ControlFormValues) => {
        setSubmitting(true);
        const payload: RiskControlDTO = {
            ...(editing?.id ? { id: editing.id } : {}),
            sourceType,
            riskId,
            controlType: values.controlType as RiskControlDTO['controlType'],
            description: values.description.trim(),
            responsibleId: values.responsibleId ? Number(values.responsibleId) : null,
            dueDate: toLocalDate(values.dueDate),
            status: values.status as RiskControlDTO['status'],
        };
        const action = editing?.id ? updateRiskControl(payload) : createRiskControl(payload);
        action
            .then(() => {
                successNotification(editing?.id ? 'Mesure mise à jour' : 'Mesure ajoutée');
                setModalOpen(false);
                setEditing(null);
                fetchControls();
            })
            .catch((error) => errorNotification(error.response?.data?.errorMessage || 'Enregistrement impossible'))
            .finally(() => setSubmitting(false));
    };

    const handleDelete = (id?: number) => {
        if (!id) return;
        setDeletingId(id);
        deleteRiskControl(id)
            .then(() => {
                successNotification('Mesure supprimée');
                fetchControls();
            })
            .catch((error) => errorNotification(error.response?.data?.errorMessage || 'Suppression impossible'))
            .finally(() => setDeletingId(null));
    };

    const empName = (responsibleId?: number | null) =>
        responsibleId != null ? emps.find((e) => String(e.id) === String(responsibleId))?.name ?? null : null;

    // Recharge les actions correctives d'une seule mesure (apres creation).
    const reloadActionsForControl = (controlId: number) => {
        getCorrectiveActionsByRiskControl(controlId)
            .then((res) => setLinkedActions((prev) => ({ ...prev, [controlId]: (res ?? []) as any[] })))
            .catch(() => { });
    };

    const openCreateAction = (control: RiskControlDTO) => {
        setCaControl(control);
        const desc = (control.description || '').trim();
        caForm.setValues({
            // Intitule par defaut : description tronquee a 50 caracteres (limite backend).
            actionName: desc.length > 50 ? desc.slice(0, 50).trim() : desc,
            description: control.description || '',
            assignedEmployeeId: control.responsibleId != null ? String(control.responsibleId) : '',
            deadline: control.dueDate ? new Date(control.dueDate) : null,
            status: 'PENDING',
        });
        setCaModalOpen(true);
    };

    const handleCreateAction = (values: CaFormValues) => {
        if (!caControl?.id) return;
        const controlId = caControl.id;
        setCaSubmitting(true);
        const payload = {
            actionName: values.actionName.trim(),
            description: values.description?.trim() || values.actionName.trim(),
            assignedEmployeeId: values.assignedEmployeeId || user?.id,
            deadline: toLocalDate(values.deadline),
            status: values.status,
            departmentId: values.assignedEmployeeId
                ? empMap[values.assignedEmployeeId]?.departmentId ?? user?.departmentId
                : user?.departmentId,
            ownerId: values.assignedEmployeeId || user?.id,
            riskControlId: controlId,
        };
        createCorrectiveAction(payload)
            .then(() => {
                successNotification('Action corrective créée');
                setCaModalOpen(false);
                setCaControl(null);
                caForm.reset();
                reloadActionsForControl(controlId);
            })
            .catch((error) => errorNotification(error.response?.data?.errorMessage || "La création de l'action a échoué"))
            .finally(() => setCaSubmitting(false));
    };

    const total = controls.length;

    return (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-2.5 px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-700 flex-shrink-0">
                        <IconLayersIntersect size={15} stroke={1.8} />
                    </span>
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
                            Plan de maîtrise : hiérarchie des mesures (ISO 45001 §8.1.2)
                        </h3>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                            De la plus efficace (Élimination) à la moins efficace (EPI)
                        </p>
                    </div>
                </div>
                <Button
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    onClick={openCreate}
                    styles={{ root: { backgroundColor: '#DC2626' } }}
                >
                    Ajouter une mesure
                </Button>
            </div>

            <div className="p-5">
                {total === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 mb-2">
                            <IconShieldCheck size={18} stroke={1.6} />
                        </span>
                        <p className="text-[13px] text-slate-600">Aucune mesure de maîtrise enregistrée.</p>
                        <p className="text-[11.5px] text-slate-400 mt-0.5">
                            Documentez les mesures selon la hiérarchie de contrôle.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {CONTROL_TYPE_ORDER.map((tier) => {
                            const tierControls = controls.filter((c) => c.controlType === tier);
                            if (tierControls.length === 0) return null;
                            const tierCfg = CONTROL_TYPE_CONFIG[tier];
                            return (
                                <div key={tier}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] ${tierCfg.chip}`}>
                                            {tierCfg.rank}. {tierCfg.label}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            {tierControls.length} mesure{tierControls.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {tierControls.map((control) => {
                                            const statusCfg = controlStatusConfig(control.status);
                                            const responsible = empName(control.responsibleId);
                                            const actions = control.id != null ? linkedActions[control.id] ?? [] : [];
                                            return (
                                                <div
                                                    key={control.id}
                                                    className="rounded-lg border border-slate-200 px-3.5 py-2.5"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-[13px] text-slate-800 leading-snug">{control.description}</p>
                                                                {actions.length > 0 && (
                                                                    <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10.5px] font-medium text-red-700">
                                                                        {actions.length} action{actions.length > 1 ? 's' : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11.5px] text-slate-500">
                                                                <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 ${statusCfg.chip}`}>
                                                                    {statusCfg.label}
                                                                </span>
                                                                {responsible && <span>Responsable : {responsible}</span>}
                                                                {control.dueDate && <span>Échéance : {formatDateFr(control.dueDate)}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <Tooltip label="Créer une action corrective" withArrow>
                                                                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => openCreateAction(control)}>
                                                                    <IconClipboardCheck size={15} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                            <Tooltip label="Modifier" withArrow>
                                                                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => openEdit(control)}>
                                                                    <IconPencil size={15} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                            <Tooltip label="Supprimer" withArrow>
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    color="red"
                                                                    size="sm"
                                                                    loading={deletingId === control.id}
                                                                    onClick={() => handleDelete(control.id)}
                                                                >
                                                                    <IconTrash size={15} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </div>
                                                    </div>

                                                    {actions.length > 0 && (
                                                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
                                                            {actions.map((action: any, idx: number) => {
                                                                const caCfg = caStatusConfig(action.status);
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        key={action.id ?? idx}
                                                                        onClick={() => navigate('/corrective')}
                                                                        className="group flex items-center justify-between gap-2 rounded-md bg-slate-50 hover:bg-red-50/60 border border-slate-200 px-2.5 py-1.5 text-left transition-colors"
                                                                    >
                                                                        <span className="min-w-0 flex items-center gap-2">
                                                                            <IconClipboardCheck size={13} className="text-red-700 flex-shrink-0" />
                                                                            <span className="truncate text-[12px] text-slate-700 group-hover:text-red-700">{action.actionName}</span>
                                                                        </span>
                                                                        <span className="flex items-center gap-2 flex-shrink-0">
                                                                            {action.deadline && (
                                                                                <span className="text-[11px] text-slate-500">{formatDateFr(action.deadline)}</span>
                                                                            )}
                                                                            <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10.5px] ${caCfg.chip}`}>
                                                                                {caCfg.label}
                                                                            </span>
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {loading && total === 0 && (
                    <p className="text-[12px] text-slate-400 text-center mt-2">Chargement…</p>
                )}
            </div>

            <Modal
                opened={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditing(null);
                }}
                title={editing ? 'Modifier la mesure' : 'Ajouter une mesure'}
                centered
                size="md"
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-3">
                    <Select
                        label="Type de mesure"
                        placeholder="Sélectionner"
                        data={CONTROL_TYPE_OPTIONS}
                        withAsterisk
                        size="sm"
                        {...form.getInputProps('controlType')}
                    />
                    <Textarea
                        label="Description"
                        placeholder="Décrivez la mesure de maîtrise"
                        minRows={3}
                        autosize
                        withAsterisk
                        size="sm"
                        {...form.getInputProps('description')}
                    />
                    <Select
                        label="Responsable"
                        placeholder="Sélectionner"
                        data={emps.map((emp) => ({ value: String(emp.id), label: emp.name }))}
                        size="sm"
                        searchable
                        clearable
                        {...form.getInputProps('responsibleId')}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DateInput
                            label="Échéance"
                            placeholder="Choisir une date"
                            size="sm"
                            valueFormat="DD/MM/YYYY"
                            clearable
                            {...form.getInputProps('dueDate')}
                        />
                        <Select
                            label="Statut"
                            data={CONTROL_STATUS_OPTIONS}
                            size="sm"
                            allowDeselect={false}
                            {...form.getInputProps('status')}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                        <Button
                            variant="default"
                            size="sm"
                            type="button"
                            disabled={submitting}
                            onClick={() => {
                                setModalOpen(false);
                                setEditing(null);
                            }}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" size="sm" loading={submitting} styles={{ root: { backgroundColor: '#DC2626' } }}>
                            {editing ? 'Enregistrer' : 'Ajouter'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                opened={caModalOpen}
                onClose={() => {
                    setCaModalOpen(false);
                    setCaControl(null);
                }}
                title="Créer une action corrective"
                centered
                size="md"
            >
                <form onSubmit={caForm.onSubmit(handleCreateAction)} className="flex flex-col gap-3">
                    <TextInput
                        label="Intitulé"
                        placeholder="Intitulé de l'action corrective"
                        withAsterisk
                        size="sm"
                        {...caForm.getInputProps('actionName')}
                    />
                    <Textarea
                        label="Description"
                        placeholder="Décrivez l'action corrective"
                        minRows={3}
                        autosize
                        size="sm"
                        {...caForm.getInputProps('description')}
                    />
                    <Select
                        label="Responsable"
                        placeholder="Sélectionner"
                        data={emps.map((emp) => ({ value: String(emp.id), label: emp.name }))}
                        size="sm"
                        searchable
                        clearable
                        {...caForm.getInputProps('assignedEmployeeId')}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DateInput
                            label="Échéance"
                            placeholder="Choisir une date"
                            size="sm"
                            valueFormat="DD/MM/YYYY"
                            clearable
                            {...caForm.getInputProps('deadline')}
                        />
                        <Select
                            label="Statut"
                            data={CA_STATUS_OPTIONS}
                            size="sm"
                            allowDeselect={false}
                            {...caForm.getInputProps('status')}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                        <Button
                            variant="default"
                            size="sm"
                            type="button"
                            disabled={caSubmitting}
                            onClick={() => {
                                setCaModalOpen(false);
                                setCaControl(null);
                            }}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" size="sm" loading={caSubmitting} styles={{ root: { backgroundColor: '#DC2626' } }}>
                            Créer
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
};

export default RiskControlPanel;
