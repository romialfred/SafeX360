import { useEffect, useMemo, useState } from 'react';
import {
    ActionIcon,
    Button,
    Menu,
    Modal,
    Select,
    Textarea,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
    IconBulb,
    IconCalendarEvent,
    IconDeviceFloppy,
    IconDotsVertical,
    IconEdit,
    IconPlus,
    IconTrash,
    IconTrendingUp,
} from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import PageHeader from '../../UtilityComp/PageHeader';
import EmptyState from '../../UtilityComp/EmptyState';
import { SkeletonDashboard } from '../../UtilityComp/LoadingSkeleton';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { toLocalDate } from '../../../utility/dateConversion';
import { getAllDepartments } from '../../../services/HrmsService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import {
    createOpportunity,
    deleteOpportunity,
    listOpportunities,
    updateOpportunity,
    updateOpportunityStatus,
    OpportunityDTO,
    OpportunityStatus,
} from '../../../services/OpportunityService';

/**
 * Opportunités SST (ISO 45001 §6.1.2.3) : recensement et suivi des
 * opportunités d'amélioration de la santé et sécurité au travail.
 * Charte premium : cartes blanches, titres serif, accent rouge module.
 */

const STATUS_OPTIONS: { value: OpportunityStatus; label: string }[] = [
    { value: 'IDENTIFIED', label: 'Identifiée' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'REALIZED', label: 'Réalisée' },
    { value: 'DISMISSED', label: 'Écartée' },
];

const STATUS_CONFIG: Record<OpportunityStatus, { label: string; chip: string }> = {
    IDENTIFIED: { label: 'Identifiée', chip: 'bg-sky-50 text-sky-700 border border-sky-200' },
    IN_PROGRESS: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border border-amber-200' },
    REALIZED: { label: 'Réalisée', chip: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    DISMISSED: { label: 'Écartée', chip: 'bg-slate-100 text-slate-500 border border-slate-200' },
};

interface OpportunityFormValues {
    title: string;
    description: string;
    category: string;
    expectedBenefit: string;
    departmentId: string;
    ownerId: string;
    status: OpportunityStatus;
    targetDate: Date | null;
}

const NO_VALUE = '–'; // tiret court (en-dash), jamais d'em-dash dans ce module

const formatDateFr = (value?: string | null): string => {
    if (!value) return NO_VALUE;
    const d = new Date(value);
    if (isNaN(d.getTime())) return NO_VALUE;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const OpportunitiesPage = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [opportunities, setOpportunities] = useState<OpportunityDTO[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [emps, setEmps] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<OpportunityDTO | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<OpportunityFormValues>({
        initialValues: {
            title: '',
            description: '',
            category: '',
            expectedBenefit: '',
            departmentId: '',
            ownerId: '',
            status: 'IDENTIFIED',
            targetDate: null,
        },
        validate: {
            title: (value) => (value.trim() ? null : 'Le titre de l\'opportunité est obligatoire'),
        },
        validateInputOnBlur: true,
    });

    const loadOpportunities = () => {
        setLoading(true);
        listOpportunities()
            .then((data) => setOpportunities(Array.isArray(data) ? data : []))
            .catch((err) => errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des opportunités'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadOpportunities();
        getAllDepartments()
            .then((data) => setDepartments(data.map((d: any) => ({ value: String(d.id), label: d.name }))))
            .catch(() => { /* libellés de département retombent sur l'identifiant */ });
        getEmployeeDropdown()
            .then((data) => setEmps(data))
            .catch(() => { /* responsables optionnels */ });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const departmentName = useMemo(() => {
        const map: Record<string, string> = {};
        departments.forEach((d) => { map[d.value] = d.label; });
        return map;
    }, [departments]);

    const empName = useMemo(() => {
        const map: Record<string, string> = {};
        emps.forEach((e: any) => { map[String(e.id)] = e.name; });
        return map;
    }, [emps]);

    const openCreate = () => {
        setEditing(null);
        form.reset();
        setModalOpen(true);
    };

    const openEdit = (opp: OpportunityDTO) => {
        setEditing(opp);
        form.setValues({
            title: opp.title || '',
            description: opp.description || '',
            category: opp.category || '',
            expectedBenefit: opp.expectedBenefit || '',
            departmentId: opp.departmentId ? String(opp.departmentId) : '',
            ownerId: opp.ownerId ? String(opp.ownerId) : '',
            status: (opp.status as OpportunityStatus) || 'IDENTIFIED',
            targetDate: opp.targetDate ? new Date(opp.targetDate) : null,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const handleSubmit = (values: OpportunityFormValues) => {
        const payload: OpportunityDTO = {
            ...(editing?.id ? { id: editing.id } : {}),
            title: values.title.trim(),
            description: values.description.trim() || null,
            category: values.category.trim() || null,
            expectedBenefit: values.expectedBenefit.trim() || null,
            departmentId: values.departmentId ? Number(values.departmentId) : null,
            ownerId: values.ownerId ? Number(values.ownerId) : null,
            status: values.status,
            targetDate: toLocalDate(values.targetDate),
        };

        setSubmitting(true);
        dispatch(showOverlay());
        const request = editing?.id ? updateOpportunity(payload) : createOpportunity(payload);
        request
            .then(() => {
                successNotification(editing?.id ? 'Opportunité mise à jour' : 'Opportunité enregistrée');
                closeModal();
                loadOpportunities();
            })
            .catch((err) => errorNotification(err.response?.data?.errorMessage || 'Échec de l\'enregistrement'))
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    const handleStatusChange = (opp: OpportunityDTO, status: OpportunityStatus) => {
        if (!opp.id || opp.status === status) return;
        dispatch(showOverlay());
        updateOpportunityStatus(opp.id, status)
            .then(() => {
                successNotification('Statut mis à jour');
                loadOpportunities();
            })
            .catch((err) => errorNotification(err.response?.data?.errorMessage || 'Échec de la mise à jour du statut'))
            .finally(() => dispatch(hideOverlay()));
    };

    const handleDelete = (opp: OpportunityDTO) => {
        if (!opp.id) return;
        if (!window.confirm(`Supprimer l'opportunité « ${opp.title} » ?`)) return;
        dispatch(showOverlay());
        deleteOpportunity(opp.id)
            .then((res) => {
                successNotification(res?.message || 'Opportunité supprimée');
                loadOpportunities();
            })
            .catch((err) => errorNotification(err.response?.data?.errorMessage || 'Échec de la suppression'))
            .finally(() => dispatch(hideOverlay()));
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Risques' },
                    { label: 'Opportunités SST' },
                ]}
                icon={<IconBulb size={22} stroke={2} />}
                iconColor="red"
                title="Opportunités SST"
                subtitle="Recensement et suivi des opportunités d'amélioration (ISO 45001 §6.1.2.3)"
                actions={
                    <Button
                        size="sm"
                        leftSection={<IconPlus size={15} />}
                        onClick={openCreate}
                        styles={{ root: { backgroundColor: '#DC2626' } }}
                    >
                        Nouvelle opportunité
                    </Button>
                }
            />

            {loading ? (
                <SkeletonDashboard />
            ) : opportunities.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200">
                    <EmptyState
                        icon={<IconBulb size={24} />}
                        iconColor="rose"
                        title="Aucune opportunité recensée"
                        description="Identifiez les opportunités d'amélioration de la santé et sécurité au travail pour les suivre ici."
                        action={
                            <Button
                                size="sm"
                                leftSection={<IconPlus size={15} />}
                                onClick={openCreate}
                                styles={{ root: { backgroundColor: '#DC2626' } }}
                            >
                                Nouvelle opportunité
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {opportunities.map((opp) => {
                        const cfg = STATUS_CONFIG[(opp.status as OpportunityStatus)] ?? STATUS_CONFIG.IDENTIFIED;
                        return (
                            <article
                                key={opp.id}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="p-4 pb-3 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] ${cfg.chip}`}>
                                            {cfg.label}
                                        </span>
                                        <Menu position="bottom-end" withinPortal shadow="md" width={190}>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Actions">
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEdit(opp)}>
                                                    Modifier
                                                </Menu.Item>
                                                <Menu.Label>Changer le statut</Menu.Label>
                                                {STATUS_OPTIONS.map((o) => (
                                                    <Menu.Item
                                                        key={o.value}
                                                        disabled={opp.status === o.value}
                                                        onClick={() => handleStatusChange(opp, o.value)}
                                                    >
                                                        {o.label}
                                                    </Menu.Item>
                                                ))}
                                                <Menu.Divider />
                                                <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(opp)}>
                                                    Supprimer
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </div>

                                    <h3
                                        className="text-slate-800 leading-snug mt-2.5"
                                        style={{
                                            fontFamily: "'Source Serif 4', Georgia, serif",
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {opp.title}
                                    </h3>
                                    {opp.description && (
                                        <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                                            {opp.description}
                                        </p>
                                    )}

                                    {opp.expectedBenefit && (
                                        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-emerald-50/60 border border-emerald-100 px-2.5 py-2">
                                            <IconTrendingUp size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                            <p className="text-[11.5px] text-emerald-800 leading-snug">{opp.expectedBenefit}</p>
                                        </div>
                                    )}

                                    <dl className="mt-3 grid grid-cols-1 gap-1.5 text-[12px]">
                                        {opp.category && (
                                            <div className="flex items-center justify-between gap-3 py-1 border-t border-slate-100">
                                                <dt className="text-slate-500">Catégorie</dt>
                                                <dd className="text-slate-800 text-right">{opp.category}</dd>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between gap-3 py-1 border-t border-slate-100">
                                            <dt className="text-slate-500">Département</dt>
                                            <dd className="text-slate-800 text-right">
                                                {opp.departmentId ? (departmentName[String(opp.departmentId)] ?? `#${opp.departmentId}`) : NO_VALUE}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-1 border-t border-slate-100">
                                            <dt className="text-slate-500">Responsable</dt>
                                            <dd className="text-slate-800 text-right">
                                                {opp.ownerId ? (empName[String(opp.ownerId)] ?? `#${opp.ownerId}`) : NO_VALUE}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                                        <IconCalendarEvent size={13} className="text-slate-400" />
                                        {opp.targetDate ? formatDateFr(opp.targetDate) : 'Sans échéance'}
                                    </span>
                                    <Tooltip label="Modifier" withArrow>
                                        <ActionIcon variant="subtle" color="red" size="sm" aria-label="Modifier" onClick={() => openEdit(opp)}>
                                            <IconEdit size={15} />
                                        </ActionIcon>
                                    </Tooltip>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <Modal
                opened={modalOpen}
                onClose={closeModal}
                title={editing ? 'Modifier l\'opportunité' : 'Nouvelle opportunité SST'}
                centered
                size="lg"
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-3">
                    <TextInput
                        label="Titre de l'opportunité"
                        placeholder="Intitulé synthétique de l'opportunité"
                        withAsterisk
                        size="sm"
                        {...form.getInputProps('title')}
                    />
                    <Textarea
                        label="Description"
                        placeholder="Décrivez l'opportunité d'amélioration"
                        minRows={3}
                        autosize
                        size="sm"
                        {...form.getInputProps('description')}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TextInput
                            label="Catégorie / source d'identification"
                            placeholder="Audit, inspection, suggestion..."
                            size="sm"
                            {...form.getInputProps('category')}
                        />
                        <Select
                            label="Statut"
                            data={STATUS_OPTIONS}
                            size="sm"
                            allowDeselect={false}
                            {...form.getInputProps('status')}
                        />
                    </div>
                    <Textarea
                        label="Bénéfice attendu"
                        placeholder="Gain attendu en matière de santé et sécurité"
                        minRows={2}
                        autosize
                        size="sm"
                        {...form.getInputProps('expectedBenefit')}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                            label="Département"
                            placeholder="Sélectionner"
                            data={departments}
                            size="sm"
                            searchable
                            clearable
                            {...form.getInputProps('departmentId')}
                        />
                        <Select
                            label="Responsable"
                            placeholder="Sélectionner"
                            data={emps.map((emp: any) => ({ value: String(emp.id), label: emp.name }))}
                            size="sm"
                            searchable
                            clearable
                            {...form.getInputProps('ownerId')}
                        />
                    </div>
                    <DateInput
                        label="Échéance cible"
                        placeholder="JJ/MM/AAAA"
                        size="sm"
                        valueFormat="DD/MM/YYYY"
                        clearable
                        {...form.getInputProps('targetDate')}
                    />
                    <div className="flex justify-end gap-2 mt-1">
                        <Button variant="default" size="sm" type="button" disabled={submitting} onClick={closeModal}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            loading={submitting}
                            leftSection={<IconDeviceFloppy size={15} />}
                            styles={{ root: { backgroundColor: '#DC2626' } }}
                        >
                            {editing ? 'Enregistrer' : 'Créer l\'opportunité'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OpportunitiesPage;
