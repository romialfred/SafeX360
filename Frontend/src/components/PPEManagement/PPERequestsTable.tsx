import {
    Badge,
    Button,
    Text,
    Modal,
    Textarea,
    Select,
    MultiSelect,
    LoadingOverlay,
} from '@mantine/core';
import { IconCheck, IconX, IconEye, IconClipboardList, IconHelmet } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { getActivePPE, getAllPPE } from '../../services/PPEService';
import { getEmployeesWithDepartment } from '../../services/EmployeeService';
import { createPpeRequest, getAllPpeRequests, approvePpeRequest, rejectPpeRequest } from '../../services/PpeRequestService';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { toLocalDate } from '../../utility/dateConversion';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { mapIdToName } from '../../utility/OtherUtilities';
import PageHeader from '../UtilityComp/PageHeader';

const getPriorityColor = (priority: string) => {
    switch ((priority || '').toLowerCase()) {
        case 'high': return 'red';
        case 'medium': return 'orange';
        case 'low': return 'green';
        default: return 'gray';
    }
};

const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
        case 'pending': return 'yellow';
        case 'approved': return 'green';
        case 'rejected': return 'red';
        default: return 'gray';
    }
};

const priorityLabels: Record<string, string> = {
    HIGH: 'Élevée',
    MEDIUM: 'Moyenne',
    LOW: 'Faible',
    High: 'Élevée',
    Medium: 'Moyenne',
    Low: 'Faible',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
    NORMAL: 'Normale',
    Normal: 'Normale',
    normal: 'Normale',
};

const statusLabels: Record<string, string> = {
    PENDING: 'En attente',
    APPROVED: 'Approuvée',
    REJECTED: 'Rejetée',
    Pending: 'En attente',
    Approved: 'Approuvée',
    Rejected: 'Rejetée',
};

const PPERequestsTable = () => {
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [employees, setEmployees] = useState<any>([]);
    // PPE actifs : pour le formulaire de demande (on ne demande que des EPI encore en catalogue)
    const [activePpe, setActivePpe] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [viewData, setViewData] = useState<any>(null);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    // ppeMap est construit à partir de TOUS les EPI (actifs + inactifs) pour résoudre
    // les références historiques. Sans ça, les demandes liées à un EPI désactivé
    // affichaient "N/A" dans la colonne EPI demandés.
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});

    const requestForm = useForm({
        initialValues: {
            empIds: [] as string[],
            ppeIds: [] as string[],
            desiredDate: null as Date | null,
            priority: 'Medium',
            reason: '',
        },
        validate: {
            empIds: (value) => (value.length > 0 ? null : 'Veuillez sélectionner au moins un employé'),
            ppeIds: (value) => (value.length > 0 ? null : 'Veuillez sélectionner au moins un EPI'),
            desiredDate: (value) => (value ? null : 'Veuillez choisir une date souhaitée'),
            priority: (value) => (value ? null : 'Veuillez sélectionner une priorité'),
            reason: (value) => (value ? null : 'Veuillez préciser un motif'),
        },
    });

    const approveForm = useForm({ initialValues: { comment: '' } });
    const rejectForm = useForm({
        initialValues: { comment: '' },
        validate: { comment: (val) => (val.trim() ? null : 'Le commentaire est requis') },
    });

    useEffect(() => {
        getEmployeesWithDepartment()
            .then((data) => {
                setEmployees(data);
                setEmpMap(mapIdToName(data));
            })
            .catch(() => { });

        // Catalogue complet (actifs + inactifs) → table de correspondance ID → nom
        getAllPPE()
            .then((data) => {
                setPpeMap(mapIdToName(data));
            })
            .catch(() => { });

        // EPI actifs uniquement → utilisés dans le formulaire de demande
        getActivePPE()
            .then((data) => {
                setActivePpe(data);
            })
            .catch(() => { });

        fetchRequests();
    }, []);

    const fetchRequests = () => {
        getAllPpeRequests()
            .then((data) => setRequests(data))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || 'Échec du chargement des demandes EPI');
            });
    };

    const openApproveModal = (row: any) => { setSelectedRequest(row); approveForm.reset(); setShowApproveModal(true); };
    const openRejectModal = (row: any) => { setSelectedRequest(row); rejectForm.reset(); setShowRejectModal(true); };
    const openViewModal = (row: any) => { setViewData(row); setShowViewModal(true); };

    const handleApprove = async (values: typeof approveForm.values) => {
        try {
            setLoading(true);
            await approvePpeRequest(selectedRequest.id, values.comment);
            successNotification('Demande approuvée');
            setShowApproveModal(false);
            fetchRequests();
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || "Échec de l'approbation");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (values: typeof rejectForm.values) => {
        try {
            setLoading(true);
            await rejectPpeRequest(selectedRequest.id, values.comment);
            successNotification('Demande rejetée');
            setShowRejectModal(false);
            fetchRequests();
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || 'Échec du rejet');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRequest = (values: typeof requestForm.values) => {
        const empSize = values.empIds?.length || 0;
        let error = '';

        for (const x of values.ppeIds) {
            const ppeItem = ppeMap[x];
            if (ppeItem && ppeItem.stock < empSize) {
                error = `Stock insuffisant pour ${ppeItem.name}`;
                break;
            }
        }

        if (error) {
            errorNotification(error);
            return;
        }

        setLoading(true);
        const payload = {
            ...values,
            desiredDate: toLocalDate(values.desiredDate),
        };
        createPpeRequest(payload)
            .then(() => {
                successNotification('Demande EPI créée avec succès');
                setShowRequestForm(false);
                requestForm.reset();
                fetchRequests();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec de la création de la demande EPI');
            })
            .finally(() => setLoading(false));
    };

    // === Templates DataTable ===
    const priorityTemplate = (rowData: any) => (
        <Badge color={getPriorityColor(rowData.priority)} variant="light" size="sm" radius="sm">
            {priorityLabels[rowData.priority] || rowData.priority || '—'}
        </Badge>
    );

    const statusTemplate = (rowData: any) => (
        <Badge color={getStatusColor(rowData.status)} variant="filled" size="sm" radius="sm">
            {statusLabels[rowData.status] || rowData.status || '—'}
        </Badge>
    );

    const employeeTemplate = (rowData: any) => {
        const ids: any[] = rowData.empIds || [];
        if (!ids.length) return <Text size="xs" c="dimmed">—</Text>;
        return (
            <div className="flex flex-col gap-0.5">
                {ids.map((id: any) => {
                    const employee = empMap[id];
                    return (
                        <span key={id} className="text-xs text-slate-700">
                            {employee ? employee.name : `Employé #${id}`}
                        </span>
                    );
                })}
            </div>
        );
    };

    const requestedEppTemplate = (rowData: any) => {
        const ids: any[] = rowData.ppeIds || [];
        if (!ids.length) return <Text size="xs" c="dimmed">—</Text>;
        return (
            <div className="flex flex-col gap-0.5">
                {ids.map((eppId: any) => {
                    const epp = ppeMap[eppId];
                    return (
                        <span key={eppId} className="text-xs text-slate-700">
                            {epp ? epp.name : `EPI #${eppId}`}
                        </span>
                    );
                })}
            </div>
        );
    };

    const reasonTemplate = (rowData: any) => (
        <span
            className="block max-w-[240px] text-xs text-slate-700"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={rowData.reason}
        >
            {rowData.reason || '—'}
        </span>
    );

    const dateTemplate = (rowData: any) => {
        if (!rowData.desiredDate) return <Text size="xs" c="dimmed">—</Text>;
        try {
            const d = new Date(rowData.desiredDate);
            return <span className="text-xs text-slate-700 tabular-nums">{d.toLocaleDateString('fr-FR')}</span>;
        } catch {
            return <span className="text-xs text-slate-700">{rowData.desiredDate}</span>;
        }
    };

    const actionTemplate = (rowData: any) => (
        <div className="flex flex-wrap gap-1">
            {rowData.status === 'PENDING' && (
                <>
                    <Button
                        variant="light"
                        color="green"
                        size="compact-xs"
                        leftSection={<IconCheck size={14} />}
                        onClick={() => openApproveModal(rowData)}
                    >
                        Approuver
                    </Button>
                    <Button
                        variant="light"
                        color="red"
                        size="compact-xs"
                        leftSection={<IconX size={14} />}
                        onClick={() => openRejectModal(rowData)}
                    >
                        Rejeter
                    </Button>
                </>
            )}
            <Button
                variant="light"
                color="blue"
                size="compact-xs"
                leftSection={<IconEye size={14} />}
                onClick={() => openViewModal(rowData)}
            >
                Détails
            </Button>
        </div>
    );

    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des EPI' },
                    { label: "Demandes d'EPI" },
                ]}
                icon={<IconClipboardList size={22} stroke={2} />}
                iconColor="amber"
                title="Demandes d'EPI"
                subtitle="Workflow de demande, validation et délivrance des équipements de protection individuelle"
                actions={
                    <Button
                        leftSection={<IconClipboardList size={15} />}
                        color="teal"
                        size="sm"
                        radius="md"
                        onClick={() => setShowRequestForm(true)}
                    >
                        Nouvelle demande
                    </Button>
                }
            />

            {/* === Tableau des demandes === */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-amber-100">
                        <IconHelmet size={14} className="text-amber-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Liste des demandes EPI
                    </h2>
                    <span className="ml-auto text-[11px] text-slate-500">
                        {requests.length} {requests.length > 1 ? 'demandes' : 'demande'}
                    </span>
                </header>
                <div className="p-3">
                    <DataTable
                        value={requests}
                        stripedRows
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        size="small"
                        emptyMessage="Aucune demande EPI enregistrée"
                    >
                        <Column header="Employé(s)" body={employeeTemplate} />
                        <Column header="EPI demandé(s)" body={requestedEppTemplate} />
                        <Column header="Motif" body={reasonTemplate} />
                        <Column header="Priorité" body={priorityTemplate} />
                        <Column header="Date souhaitée" body={dateTemplate} />
                        <Column header="Statut" body={statusTemplate} />
                        <Column header="Actions" body={actionTemplate} />
                    </DataTable>
                </div>
            </div>

            {/* === Modal Nouvelle demande === */}
            <Modal
                opened={showRequestForm}
                onClose={() => setShowRequestForm(false)}
                title={<span className="text-slate-900">Nouvelle demande d'EPI</span>}
                size="xl"
                centered
                radius="md"
            >
                <LoadingOverlay visible={loading} />
                <form className="grid grid-cols-1 gap-4" onSubmit={requestForm.onSubmit(handleSubmitRequest)}>
                    <MultiSelect
                        label="Employés concernés"
                        placeholder="Sélectionner les employés"
                        data={employees.map((emp: any) => ({ value: '' + emp.id, label: emp.name }))}
                        multiple
                        searchable
                        hidePickedOptions
                        withAsterisk
                        size="sm"
                        radius="md"
                        {...requestForm.getInputProps('empIds')}
                    />
                    <MultiSelect
                        label="EPI demandés"
                        placeholder="Sélectionner les EPI"
                        data={activePpe.map((epp: any) => ({
                            value: '' + epp.id,
                            label: `${epp.name} • ${epp.category} (Stock : ${epp.stock})`,
                        }))}
                        multiple
                        hidePickedOptions
                        searchable
                        withAsterisk
                        size="sm"
                        radius="md"
                        {...requestForm.getInputProps('ppeIds')}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <DateInput
                            label="Date souhaitée"
                            placeholder="Quand les EPI sont-ils requis ?"
                            withAsterisk
                            size="sm"
                            radius="md"
                            valueFormat="DD/MM/YYYY"
                            {...requestForm.getInputProps('desiredDate')}
                            minDate={new Date()}
                        />
                        <Select
                            label="Priorité"
                            placeholder="Sélectionner une priorité"
                            data={[
                                { value: 'Low', label: 'Faible' },
                                { value: 'Medium', label: 'Moyenne' },
                                { value: 'High', label: 'Élevée' },
                            ]}
                            withAsterisk
                            size="sm"
                            radius="md"
                            {...requestForm.getInputProps('priority')}
                        />
                    </div>
                    <Textarea
                        label="Motif"
                        placeholder="Expliquez pourquoi ces EPI sont nécessaires"
                        rows={3}
                        withAsterisk
                        size="sm"
                        radius="md"
                        {...requestForm.getInputProps('reason')}
                    />
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <Button variant="default" size="sm" onClick={() => setShowRequestForm(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" size="sm" color="teal" leftSection={<IconClipboardList size={14} />}>
                            Soumettre la demande
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* === Modal Approuver === */}
            <Modal
                opened={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                title={<span className="text-slate-900">Approuver la demande EPI</span>}
                centered
                radius="md"
            >
                <LoadingOverlay visible={loading} />
                <form onSubmit={approveForm.onSubmit(handleApprove)}>
                    <Textarea
                        label="Commentaire (facultatif)"
                        placeholder="Ajouter un commentaire"
                        size="sm"
                        radius="md"
                        {...approveForm.getInputProps('comment')}
                    />
                    <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-200">
                        <Button variant="default" size="sm" onClick={() => setShowApproveModal(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" size="sm" color="green" leftSection={<IconCheck size={14} />}>
                            Approuver
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* === Modal Rejeter === */}
            <Modal
                opened={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title={<span className="text-slate-900">Rejeter la demande EPI</span>}
                centered
                radius="md"
            >
                <LoadingOverlay visible={loading} />
                <form onSubmit={rejectForm.onSubmit(handleReject)}>
                    <Textarea
                        label="Commentaire (requis)"
                        placeholder="Précisez le motif du rejet"
                        withAsterisk
                        size="sm"
                        radius="md"
                        {...rejectForm.getInputProps('comment')}
                    />
                    <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-200">
                        <Button variant="default" size="sm" onClick={() => setShowRejectModal(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" size="sm" color="red" leftSection={<IconX size={14} />}>
                            Rejeter
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* === Modal Détails === */}
            <Modal
                opened={showViewModal}
                onClose={() => setShowViewModal(false)}
                title={<span className="text-slate-900">Détails de la demande</span>}
                size="lg"
                centered
                radius="md"
            >
                <LoadingOverlay visible={loading} />
                {viewData ? (
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="grid grid-cols-[140px_1fr] gap-2">
                            <span className="text-slate-600">Employés</span>
                            <span className="text-slate-800">
                                {(viewData.empIds || []).map((id: any) => empMap[id]?.name || `#${id}`).join(', ') || '—'}
                            </span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2">
                            <span className="text-slate-600">EPI demandés</span>
                            <span className="text-slate-800">
                                {(viewData.ppeIds || []).map((id: any) => ppeMap[id]?.name || `#${id}`).join(', ') || '—'}
                            </span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2">
                            <span className="text-slate-600">Motif</span>
                            <span className="text-slate-800">{viewData.reason || '—'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2">
                            <span className="text-slate-600">Priorité</span>
                            <span className="text-slate-800">{priorityLabels[viewData.priority] || viewData.priority || '—'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2">
                            <span className="text-slate-600">Date souhaitée</span>
                            <span className="text-slate-800">{viewData.desiredDate ? new Date(viewData.desiredDate).toLocaleDateString('fr-FR') : '—'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2">
                            <span className="text-slate-600">Statut</span>
                            <span className="text-slate-800">{statusLabels[viewData.status] || viewData.status || '—'}</span>
                        </div>
                        {viewData.comment && (
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                                <span className="text-slate-600">Commentaire</span>
                                <span className="text-slate-800">{viewData.comment}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <LoadingOverlay visible />
                )}
                <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-200">
                    <Button variant="default" size="sm" onClick={() => setShowViewModal(false)}>
                        Fermer
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default PPERequestsTable;
