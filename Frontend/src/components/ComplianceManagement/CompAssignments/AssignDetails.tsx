import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useState } from 'react';
import { ActionIcon, Badge, Button, Modal, Select, Tooltip } from '@mantine/core';
import { IconBriefcase, IconCheck, IconPlus, IconX } from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { modals } from '@mantine/modals';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useForm } from '@mantine/form';
import PageHeader from '../../UtilityComp/PageHeader';
import EmptyState from '../../UtilityComp/EmptyState';
import {
    activatePostionAssignment,
    createPostionAssignment,
    deactivatePostionAssignment,
    getPostionAssignmentById,
} from '../../../services/AssignmentService';
import { getAllActiveRequirement } from '../../../services/RequirementService';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import {
    CATEGORY_COLORS,
    categoryLabel,
    docTypeLabel,
    frequencyLabel,
} from '../complianceLabels';

/**
 * Exigences affectées à un poste de travail (LOT 49) :
 * consultation, activation / désactivation et affectation de nouvelles exigences.
 */
const AssignDetails = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const [assignment, setAssignment] = useState<any>(null);
    const [data, setData] = useState<any[]>([]);
    const [requirements, setRequirements] = useState<{ label: string; value: string }[]>([]);
    const [modalOpened, setModalOpened] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            requirementId: '',
            positionId: id,
        },
        validate: {
            requirementId: (value) => (value.trim().length > 0 ? null : "L'exigence est obligatoire"),
        },
    });

    const fetchAssignments = () => {
        setLoading(true);
        getPostionAssignmentById(id)
            .then((res) => {
                setAssignment(res);
                setData(res.requirements ?? []);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'affectation n'a pas pu être chargée");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        getAllActiveRequirement()
            .then((res) => {
                setRequirements((res ?? []).map((item: any) => ({ label: item.title, value: String(item.id) })));
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Les exigences sont indisponibles');
            });
        if (id) fetchAssignments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Exigences déjà affectées au poste : exclues du sélecteur d'ajout.
    const assignedTitles = new Set(data.map((row) => row.title));
    const availableRequirements = requirements.filter((r) => !assignedTitles.has(r.label));

    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === 'ACTIVE' ? 'deactivate' : 'activate';
        const actionLabel = action === 'activate' ? 'réactiver' : 'suspendre';
        modals.openConfirmModal({
            title: <span className="text-base">Confirmer l'action</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Souhaitez-vous <strong>{actionLabel}</strong> l'exigence <strong>{rowData.title}</strong> pour ce poste ?
                </span>
            ),
            labels: { confirm: `Oui, ${actionLabel}`, cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: 'default' },
            confirmProps: { color: action === 'activate' ? 'teal' : 'red', variant: 'filled' },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall = action === 'activate' ? activatePostionAssignment : deactivatePostionAssignment;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Exigence ${action === 'activate' ? 'réactivée' : 'suspendue'} pour le poste`);
                        setData((prev) =>
                            prev.map((item) =>
                                item.id === rowData.id
                                    ? { ...item, status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' }
                                    : item
                            )
                        );
                    })
                    .catch(() => errorNotification("L'opération a échoué"))
                    .finally(() => dispatch(hideOverlay()));
            },
        });
    };

    const handleSubmit = () => {
        setSubmitting(true);
        dispatch(showOverlay());
        createPostionAssignment(form.values)
            .then(() => {
                successNotification('Exigence affectée au poste');
                fetchAssignments();
                setModalOpened(false);
                form.reset();
                form.setFieldValue('positionId', id);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'affectation a échoué");
            })
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    const titleBody = (row: any) => (
        <div className="min-w-0 max-w-md">
            <p className="text-[13px] text-slate-800 leading-snug">{row.title}</p>
            {row.description && <p className="text-[11px] text-slate-500 mt-0.5 safex-truncate-2">{row.description}</p>}
        </div>
    );

    const categoryBody = (row: any) => (
        <Badge color={CATEGORY_COLORS[row.category ?? ''] ?? 'gray'} variant="light" size="sm" radius="sm">
            {categoryLabel(row.category)}
        </Badge>
    );

    const statusBody = (row: any) => (
        <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border ${
                row.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
        >
            {row.status === 'ACTIVE' ? 'Active' : 'Suspendue'}
        </span>
    );

    const actionBody = (row: any) => (
        <Tooltip label={row.status === 'ACTIVE' ? 'Suspendre pour ce poste' : 'Réactiver pour ce poste'} withArrow>
            <ActionIcon
                variant="light"
                color={row.status === 'ACTIVE' ? 'red' : 'teal'}
                onClick={() => handleStatusChange(row)}
                size="sm"
                aria-label={row.status === 'ACTIVE' ? 'Suspendre pour ce poste' : 'Réactiver pour ce poste'}
            >
                {row.status === 'ACTIVE' ? <IconX size={14} stroke={1.5} /> : <IconCheck size={14} stroke={1.5} />}
            </ActionIcon>
        </Tooltip>
    );

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Affectations par poste', to: '/compliance-assignment' },
                    { label: assignment?.position ?? 'Détail du poste' },
                ]}
                icon={<IconBriefcase size={22} stroke={2} />}
                iconColor="teal"
                title={assignment?.position ?? 'Détail du poste'}
                subtitle={`Exigences réglementaires applicables à ce poste · ${data.length} exigence${data.length > 1 ? 's' : ''}`}
                actions={
                    <Button
                        size="xs"
                        color="teal"
                        leftSection={<IconPlus size={14} />}
                        onClick={() => setModalOpened(true)}
                    >
                        Affecter une exigence
                    </Button>
                }
            />

            <div className="bg-white rounded-xl border border-slate-200 p-2">
                {loading ? (
                    <div className="flex flex-col gap-2 p-2" aria-busy="true">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : !data.length ? (
                    <EmptyState
                        icon={<IconBriefcase size={24} />}
                        title="Aucune exigence affectée à ce poste"
                        description="Affectez les obligations réglementaires applicables aux salariés occupant ce poste."
                        compact
                        action={
                            <Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={() => setModalOpened(true)}>
                                Affecter une exigence
                            </Button>
                        }
                    />
                ) : (
                    <DataTable
                        value={data}
                        size="small"
                        stripedRows
                        removableSort
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        dataKey="id"
                        className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                    >
                        <Column header="Exigence" body={titleBody} sortable sortField="title" />
                        <Column header="Catégorie" body={categoryBody} sortable sortField="category" style={{ width: '8.5rem' }} />
                        <Column
                            header="Renouvellement"
                            body={(row) => <span className="text-[12.5px] text-slate-600">{frequencyLabel(row.renewalFrequency)}</span>}
                            style={{ width: '9rem' }}
                        />
                        <Column
                            header="Document attendu"
                            body={(row) => <span className="text-[12.5px] text-slate-600">{docTypeLabel(row.docType)}</span>}
                            style={{ width: '9.5rem' }}
                        />
                        <Column header="Statut" body={statusBody} sortable sortField="status" style={{ width: '7rem' }} />
                        <Column header="" body={actionBody} headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                )}
            </div>

            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title={<span className="text-[15px] text-slate-800">Affecter une exigence au poste</span>}
                centered
                size="lg"
            >
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <div className="flex flex-col gap-4">
                        <Select
                            label="Exigence réglementaire"
                            placeholder={availableRequirements.length ? 'Choisir une exigence' : 'Toutes les exigences actives sont déjà affectées'}
                            data={availableRequirements}
                            searchable
                            withAsterisk
                            size="sm"
                            disabled={!availableRequirements.length}
                            {...form.getInputProps('requirementId')}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="default" size="sm" type="button" onClick={() => setModalOpened(false)} disabled={submitting}>
                                Annuler
                            </Button>
                            <Button type="submit" color="teal" size="sm" loading={submitting} disabled={!availableRequirements.length}>
                                Affecter
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AssignDetails;
