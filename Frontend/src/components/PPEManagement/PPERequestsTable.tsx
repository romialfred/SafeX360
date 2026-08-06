import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ActionIcon,
    Button,
    Drawer,
    LoadingOverlay,
    Switch,
    Textarea,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { IconArrowBackUp, IconCheck, IconClipboardList, IconEye, IconPlus, IconSearch, IconTruckDelivery, IconX } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getAllPPE } from '../../services/PPEService';
import { getEmployeesWithDepartment } from '../../services/EmployeeService';
import {
    approvePpeRequest,
    deliverPpeRequest,
    getAllPpeRequests,
    rejectPpeRequest,
    returnPpeRequest,
} from '../../services/PpeRequestService';
import { notifyError } from '../../utility/notifyError';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { mapIdToName } from '../../utility/OtherUtilities';
import PageHeader from '../UtilityComp/PageHeader';
import SegmentedFilter from '../UtilityComp/SegmentedFilter';
import EmptyState from '../UtilityComp/EmptyState';
import {
    CHIP_BASE,
    formatDateFr,
    priorityConfig,
    requestStatusConfig,
} from './ppeLabels';

const ALL = 'ALL';

/**
 * Demandes d'EPI : création, validation (approbation / rejet motivé) et
 * consultation des demandes de dotation.
 */
const PPERequestsTable = () => {
    const { t } = useTranslation('ppe');
    const navigate = useNavigate();
    // Libellés bilingues : clés i18n `ppe:*`, repli sur les libellés FR centralisés (ppeLabels.ts).
    const tPriority = (code?: string | null): string =>
        t(`priority.${(code ?? '').toUpperCase()}`, { defaultValue: priorityConfig(code).label });
    const tRequestStatus = (code?: string | null): string =>
        t(`requestStatus.${(code ?? '').toUpperCase()}`, { defaultValue: requestStatusConfig(code).label });
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [viewData, setViewData] = useState<any>(null);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    // ppeMap est construit à partir de TOUS les EPI (actifs + inactifs) pour résoudre
    // les références historiques liées à un EPI désactivé.
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});

    const [statusFilter, setStatusFilter] = useState<string>(ALL);
    const [search, setSearch] = useState('');

    const approveForm = useForm({ initialValues: { comment: '' } });
    const rejectForm = useForm({
        initialValues: { comment: '' },
        validate: { comment: (val) => (val.trim() ? null : t('requests.validateRejectComment')) },
    });
    // Retour : remise en stock (défaut) ou réforme, avec motif optionnel.
    const returnForm = useForm({ initialValues: { comment: '', restock: true } });

    useEffect(() => {
        getEmployeesWithDepartment()
            .then((data) => setEmpMap(mapIdToName(data)))
            .catch((err) => console.error(err));

        // Catalogue complet (actifs + inactifs) → table de correspondance ID → nom
        getAllPPE()
            .then((data) => setPpeMap(mapIdToName(data)))
            .catch((err) => console.error(err));


        fetchRequests();
    }, []);

    const fetchRequests = () => {
        setLoadingList(true);
        getAllPpeRequests()
            .then(setRequests)
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('requests.loadError'));
            })
            .finally(() => setLoadingList(false));
    };

    const statusCounts = useMemo(
        () =>
            requests.reduce(
                (acc, req) => {
                    const status = String(req.status ?? '').toUpperCase();
                    if (status === 'PENDING') acc.PENDING += 1;
                    else if (status === 'APPROVED') acc.APPROVED += 1;
                    else if (status === 'REJECTED') acc.REJECTED += 1;
                    else if (status === 'DELIVERED') acc.DELIVERED += 1;
                    else if (status === 'RETURNED') acc.RETURNED += 1;
                    return acc;
                },
                { PENDING: 0, APPROVED: 0, REJECTED: 0, DELIVERED: 0, RETURNED: 0 }
            ),
        [requests]
    );

    const filteredRequests = useMemo(() => {
        const q = search.trim().toLowerCase();
        return requests.filter((req) => {
            if (statusFilter !== ALL && String(req.status ?? '').toUpperCase() !== statusFilter) return false;
            if (!q) return true;
            const names = (req.empIds || []).map((id: any) => empMap[id]?.name).filter(Boolean);
            const ppeNames = (req.ppeIds || []).map((id: any) => ppeMap[id]?.name).filter(Boolean);
            return [...names, ...ppeNames, req.reason].filter(Boolean).join(' ').toLowerCase().includes(q);
        });
    }, [requests, statusFilter, search, empMap, ppeMap]);

    const openApproveModal = (row: any) => { setSelectedRequest(row); approveForm.reset(); setShowApproveModal(true); };
    const openRejectModal = (row: any) => { setSelectedRequest(row); rejectForm.reset(); setShowRejectModal(true); };
    const openReturnModal = (row: any) => { setSelectedRequest(row); returnForm.reset(); setShowReturnModal(true); };
    const openViewModal = (row: any) => { setViewData(row); setShowViewModal(true); };

    const handleApprove = async (values: typeof approveForm.values) => {
        try {
            setLoading(true);
            await approvePpeRequest(selectedRequest.id, values.comment);
            successNotification(t('requests.approveSuccess'));
            setShowApproveModal(false);
            fetchRequests();
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || t('requests.approveError'));
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (values: typeof rejectForm.values) => {
        try {
            setLoading(true);
            await rejectPpeRequest(selectedRequest.id, values.comment);
            successNotification(t('requests.rejectSuccess'));
            setShowRejectModal(false);
            fetchRequests();
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || t('requests.rejectError'));
        } finally {
            setLoading(false);
        }
    };

    // Distribution EPI : passe une demande APPROVED en DELIVERED et SORT le stock
    // (approuvé − déjà distribué, idempotent côté backend). Message clair si l'état
    // n'est pas APPROVED (REQUEST_NOT_APPROVED) ou si le stock manque (INSUFFICIENT_STOCK).
    const handleDeliver = async (row: any) => {
        try {
            setLoading(true);
            await deliverPpeRequest(row.id);
            successNotification(t('requests.deliverSuccess', 'Dotation distribuée — stock mis à jour'));
            fetchRequests();
        } catch (err: any) {
            notifyError(err, t('requests.deliverError', 'Échec de la distribution'));
        } finally {
            setLoading(false);
        }
    };

    // Retour EPI : passe une demande DELIVERED en RETURNED. restock=true remet en
    // stock (mouvement RETURN), false = réforme. Idempotent côté backend.
    const handleReturn = async (values: typeof returnForm.values) => {
        try {
            setLoading(true);
            await returnPpeRequest(selectedRequest.id, values.comment, values.restock);
            successNotification(
                values.restock
                    ? t('requests.returnSuccessRestock', 'Dotation retournée — matériel remis en stock')
                    : t('requests.returnSuccessScrap', 'Dotation retournée — matériel réformé')
            );
            setShowReturnModal(false);
            fetchRequests();
        } catch (err: any) {
            notifyError(err, t('requests.returnError', 'Échec du retour'));
        } finally {
            setLoading(false);
        }
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const employeeTemplate = (rowData: any) => {
        const ids: any[] = rowData.empIds || [];
        if (!ids.length) return <span className="text-[12.5px] text-slate-400">—</span>;
        return (
            <div className="flex flex-col gap-0.5">
                {ids.map((id: any) => (
                    <span key={id} className="text-[13px] text-slate-800">
                        {empMap[id]?.name || t('requests.employeeFallback', { id })}
                    </span>
                ))}
            </div>
        );
    };

    const requestedPpeTemplate = (rowData: any) => {
        // Incrément 2 : si la demande porte des LIGNES (bénéficiaire × EPI × quantité),
        // on agrège la quantité totale demandée par EPI (« Gants ×5 »). Repli sur la
        // liste d'ID pour les demandes legacy sans lignes.
        const lines: any[] = rowData.lines || [];
        if (lines.length) {
            const totals = new Map<string, number>();
            lines.forEach((l) => {
                const key = String(l.ppeId);
                totals.set(key, (totals.get(key) || 0) + (Number(l.quantityRequested) || 0));
            });
            return (
                <div className="flex flex-col gap-0.5">
                    {Array.from(totals.entries()).map(([ppeId, qty]) => (
                        <span key={ppeId} className="text-[13px] text-slate-800">
                            {ppeMap[ppeId]?.name || t('requests.ppeFallback', { id: ppeId })}
                            <span className="text-slate-400"> ×{qty}</span>
                        </span>
                    ))}
                </div>
            );
        }
        const ids: any[] = rowData.ppeIds || [];
        if (!ids.length) return <span className="text-[12.5px] text-slate-400">—</span>;
        return (
            <div className="flex flex-col gap-0.5">
                {ids.map((ppeId: any) => (
                    <span key={ppeId} className="text-[13px] text-slate-800">
                        {ppeMap[ppeId]?.name || t('requests.ppeFallback', { id: ppeId })}
                    </span>
                ))}
            </div>
        );
    };

    const reasonTemplate = (rowData: any) => (
        <span
            className="block max-w-[240px] text-[12.5px] text-slate-600"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={rowData.reason}
        >
            {rowData.reason || '—'}
        </span>
    );

    const priorityTemplate = (rowData: any) => {
        const cfg = priorityConfig(rowData.priority);
        return <span className={`${CHIP_BASE} ${cfg.chip}`}>{tPriority(rowData.priority)}</span>;
    };

    const statusTemplate = (rowData: any) => {
        const cfg = requestStatusConfig(rowData.status);
        return <span className={`${CHIP_BASE} ${cfg.chip}`}>{tRequestStatus(rowData.status)}</span>;
    };

    const dateTemplate = (rowData: any) => (
        <span className="text-[12.5px] text-slate-600 tabular-nums">{formatDateFr(rowData.desiredDate)}</span>
    );

    const actionTemplate = (rowData: any) => (
        <div className="flex gap-1.5 justify-center">
            {String(rowData.status).toUpperCase() === 'PENDING' && (
                <>
                    <Tooltip label={t('requests.tooltipApprove')} withArrow>
                        <ActionIcon
                            variant="light"
                            color="teal"
                            size="sm"
                            onClick={() => openApproveModal(rowData)}
                            aria-label={t('requests.ariaApprove')}
                        >
                            <IconCheck size={14} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t('requests.tooltipReject')} withArrow>
                        <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => openRejectModal(rowData)}
                            aria-label={t('requests.ariaReject')}
                        >
                            <IconX size={14} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                </>
            )}
            {String(rowData.status).toUpperCase() === 'APPROVED' && (
                <Tooltip label={t('requests.tooltipDeliver', 'Distribuer (sortie de stock)')} withArrow>
                    <ActionIcon
                        variant="light"
                        color="grape"
                        size="sm"
                        onClick={() => handleDeliver(rowData)}
                        aria-label={t('requests.ariaDeliver', 'Distribuer la dotation')}
                    >
                        <IconTruckDelivery size={14} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            )}
            {String(rowData.status).toUpperCase() === 'DELIVERED' && (
                <Tooltip label={t('requests.tooltipReturn', 'Retour de dotation')} withArrow>
                    <ActionIcon
                        variant="light"
                        color="orange"
                        size="sm"
                        onClick={() => openReturnModal(rowData)}
                        aria-label={t('requests.ariaReturn', 'Retourner la dotation')}
                    >
                        <IconArrowBackUp size={14} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            )}
            <Tooltip label={t('requests.tooltipView')} withArrow>
                <ActionIcon
                    variant="light"
                    color="blue"
                    size="sm"
                    onClick={() => openViewModal(rowData)}
                    aria-label={t('requests.ariaView')}
                >
                    <IconEye size={14} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
        </div>
    );

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.breadcrumbHome'), to: '/' },
                    { label: t('common.breadcrumbModule') },
                    { label: t('requests.breadcrumb') },
                ]}
                icon={<IconClipboardList size={22} stroke={2} />}
                iconColor="amber"
                title={t('requests.title')}
                subtitle={t('requests.subtitle')}
                actions={
                    <Button
                        leftSection={<IconPlus size={14} />}
                        color="teal"
                        size="sm"
                        onClick={() => navigate('/ppe-management/request-matrix')}
                    >
                        {t('requests.newRequest')}
                    </Button>
                }
            />

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <SegmentedFilter
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: ALL, label: t('requests.filterAll'), count: requests.length, color: 'slate' },
                        { value: 'PENDING', label: t('requests.filterPending'), count: statusCounts.PENDING, color: 'violet' },
                        { value: 'APPROVED', label: t('requests.filterApproved'), count: statusCounts.APPROVED, color: 'green' },
                        { value: 'DELIVERED', label: t('requests.filterDelivered', 'Distribuées'), count: statusCounts.DELIVERED, color: 'blue' },
                        { value: 'RETURNED', label: t('requests.filterReturned', 'Retournées'), count: statusCounts.RETURNED, color: 'slate' },
                        { value: 'REJECTED', label: t('requests.filterRejected'), count: statusCounts.REJECTED, color: 'rose' },
                    ]}
                    rightElement={
                        <TextInput
                            placeholder={t('requests.searchPlaceholder')}
                            leftSection={<IconSearch size={14} />}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            size="xs"
                            w={280}
                            aria-label={t('requests.searchAria')}
                        />
                    }
                />
            </div>

            {/* Registre des demandes */}
            <div className="bg-white rounded-xl border border-slate-200 p-2">
                {loadingList ? (
                    <div className="flex flex-col gap-2 p-2" aria-busy="true">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : !filteredRequests.length ? (
                    <EmptyState
                        icon={<IconClipboardList size={24} />}
                        title={statusFilter === ALL ? t('requests.emptyAllTitle') : t('requests.emptyFilteredTitle')}
                        description={
                            statusFilter === ALL
                                ? t('requests.emptyAllDescription')
                                : t('requests.emptyFilteredDescription')
                        }
                        compact
                        action={
                            statusFilter === ALL ? (
                                <Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={() => navigate('/ppe-management/request-matrix')}>
                                    {t('requests.newRequest')}
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <DataTable
                        value={filteredRequests}
                        stripedRows
                        removableSort
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        size="small"
                        dataKey="id"
                        className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate={t('requests.currentPageReport')}
                    >
                        <Column header={t('requests.colEmployees')} body={employeeTemplate} />
                        <Column header={t('requests.colRequestedPpe')} body={requestedPpeTemplate} />
                        <Column header={t('requests.colReason')} body={reasonTemplate} />
                        <Column header={t('requests.colPriority')} body={priorityTemplate} sortable sortField="priority" style={{ width: '7.5rem' }} />
                        <Column header={t('requests.colDesiredDate')} body={dateTemplate} sortable sortField="desiredDate" style={{ width: '9.5rem' }} />
                        <Column header={t('requests.colStatus')} body={statusTemplate} sortable sortField="status" style={{ width: '8rem' }} />
                        <Column header={t('requests.colActions')} body={actionTemplate} headerStyle={{ width: '7rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                )}
            </div>

            {/* Création : page matrice plein écran (/ppe-management/request-matrix) — plus de modale de saisie. */}

            {/* Modale : approbation */}
            <Drawer
                position="right"
                opened={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                title={<span className="text-base font-semibold text-slate-900">{t('requests.modalApproveTitle')}</span>}
                size="md"
            >
                <LoadingOverlay visible={loading} />
                <form onSubmit={approveForm.onSubmit(handleApprove)}>
                    <Textarea
                        label={t('requests.fieldApproveComment')}
                        placeholder={t('requests.fieldApproveCommentPlaceholder')}
                        size="sm"
                        {...approveForm.getInputProps('comment')}
                    />
                    <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-200">
                        <Button variant="default" size="sm" onClick={() => setShowApproveModal(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" size="sm" color="teal" leftSection={<IconCheck size={14} />}>
                            {t('requests.approve')}
                        </Button>
                    </div>
                </form>
            </Drawer>

            {/* Modale : rejet */}
            <Drawer
                position="right"
                opened={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title={<span className="text-base font-semibold text-slate-900">{t('requests.modalRejectTitle')}</span>}
                size="md"
            >
                <LoadingOverlay visible={loading} />
                <form onSubmit={rejectForm.onSubmit(handleReject)}>
                    <Textarea
                        label={t('requests.fieldRejectComment')}
                        placeholder={t('requests.fieldRejectCommentPlaceholder')}
                        withAsterisk
                        size="sm"
                        {...rejectForm.getInputProps('comment')}
                    />
                    <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-200">
                        <Button variant="default" size="sm" onClick={() => setShowRejectModal(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" size="sm" color="red" leftSection={<IconX size={14} />}>
                            {t('requests.reject')}
                        </Button>
                    </div>
                </form>
            </Drawer>

            {/* Volet : retour de dotation */}
            <Drawer
                position="right"
                opened={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                title={<span className="text-base font-semibold text-slate-900">{t('requests.modalReturnTitle', 'Retour de dotation')}</span>}
                size="md"
            >
                <LoadingOverlay visible={loading} />
                <form onSubmit={returnForm.onSubmit(handleReturn)}>
                    <p className="text-[12.5px] text-slate-600 mb-3">
                        {t('requests.returnHint', "Enregistre le retour du matériel distribué. Remettre en stock rend les EPI de nouveau disponibles ; sinon ils sont réformés (stock inchangé).")}
                    </p>
                    <Switch
                        label={t('requests.fieldRestock', 'Remettre en stock')}
                        description={t('requests.fieldRestockDesc', 'Décocher pour réformer (matériel hors d\'usage)')}
                        checked={returnForm.values.restock}
                        onChange={(e) => returnForm.setFieldValue('restock', e.currentTarget.checked)}
                        size="sm"
                        mb="sm"
                    />
                    <Textarea
                        label={t('requests.fieldReturnComment', 'Motif / observation')}
                        placeholder={t('requests.fieldReturnCommentPlaceholder', 'ex. Fin de mission, EPI endommagé…')}
                        size="sm"
                        {...returnForm.getInputProps('comment')}
                    />
                    <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-200">
                        <Button variant="default" size="sm" onClick={() => setShowReturnModal(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" size="sm" color="orange" leftSection={<IconArrowBackUp size={14} />}>
                            {t('requests.confirmReturn', 'Confirmer le retour')}
                        </Button>
                    </div>
                </form>
            </Drawer>

            {/* Modale : détail */}
            <Drawer
                position="right"
                opened={showViewModal}
                onClose={() => setShowViewModal(false)}
                title={<span className="text-base font-semibold text-slate-900">{t('requests.modalViewTitle')}</span>}
                size="lg"
            >
                {viewData && (
                    <div className="flex flex-col gap-2 text-[12.5px]">
                        <div className="grid grid-cols-[140px_1fr] gap-2">
                            <span className="text-slate-500">{t('requests.detailEmployees')}</span>
                            <span className="text-slate-800">
                                {(viewData.empIds || []).map((id: any) => empMap[id]?.name || `#${id}`).join(', ') || '—'}
                            </span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2">
                            <span className="text-slate-500">{t('requests.detailRequestedPpe')}</span>
                            <span className="text-slate-800">
                                {(viewData.ppeIds || []).map((id: any) => ppeMap[id]?.name || `#${id}`).join(', ') || '—'}
                            </span>
                        </div>
                        {/* Détail par bénéficiaire × EPI (quantités demandée / approuvée). */}
                        {Array.isArray(viewData.lines) && viewData.lines.length > 0 && (
                            <div className="mt-1 rounded-lg border border-slate-200 overflow-hidden">
                                <table className="w-full text-[12px]">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="text-left p-2 font-medium">Bénéficiaire</th>
                                            <th className="text-left p-2 font-medium">EPI</th>
                                            <th className="text-right p-2 font-medium">Demandé</th>
                                            <th className="text-right p-2 font-medium">Approuvé</th>
                                            <th className="text-right p-2 font-medium">Distribué</th>
                                            <th className="text-right p-2 font-medium">Retourné</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewData.lines.map((l: any) => (
                                            <tr key={l.id} className="border-t border-slate-100">
                                                <td className="p-2 text-slate-800">{empMap[l.empId]?.name || `#${l.empId}`}</td>
                                                <td className="p-2 text-slate-800">{ppeMap[l.ppeId]?.name || `#${l.ppeId}`}</td>
                                                <td className="p-2 text-right tabular-nums">{l.quantityRequested ?? '—'}</td>
                                                <td className="p-2 text-right tabular-nums">{l.quantityApproved ?? '—'}</td>
                                                <td className="p-2 text-right tabular-nums">{l.quantityIssued ?? '—'}</td>
                                                <td className="p-2 text-right tabular-nums">{l.quantityReturned ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="grid grid-cols-[140px_1fr] gap-2">
                            <span className="text-slate-500">{t('requests.detailReason')}</span>
                            <span className="text-slate-800">{viewData.reason || '—'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                            <span className="text-slate-500">{t('requests.detailPriority')}</span>
                            <span>
                                <span className={`${CHIP_BASE} ${priorityConfig(viewData.priority).chip}`}>
                                    {tPriority(viewData.priority)}
                                </span>
                            </span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2">
                            <span className="text-slate-500">{t('requests.detailDesiredDate')}</span>
                            <span className="text-slate-800">{formatDateFr(viewData.desiredDate)}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                            <span className="text-slate-500">{t('requests.detailStatus')}</span>
                            <span>
                                <span className={`${CHIP_BASE} ${requestStatusConfig(viewData.status).chip}`}>
                                    {tRequestStatus(viewData.status)}
                                </span>
                            </span>
                        </div>
                        {viewData.comment && (
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                                <span className="text-slate-500">{t('requests.detailComment')}</span>
                                <span className="text-slate-800">{viewData.comment}</span>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-200">
                    <Button variant="default" size="sm" onClick={() => setShowViewModal(false)}>
                        {t('requests.close')}
                    </Button>
                </div>
            </Drawer>
        </div>
    );
};

export default PPERequestsTable;
