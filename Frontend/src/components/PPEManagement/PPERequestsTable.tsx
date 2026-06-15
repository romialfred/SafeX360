import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActionIcon,
    Button,
    LoadingOverlay,
    Modal,
    MultiSelect,
    Select,
    Textarea,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { IconCheck, IconClipboardList, IconEye, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getActivePPE, getAllPPE } from '../../services/PPEService';
import { getEmployeesWithDepartment } from '../../services/EmployeeService';
import {
    approvePpeRequest,
    createPpeRequest,
    getAllPpeRequests,
    rejectPpeRequest,
} from '../../services/PpeRequestService';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { toLocalDate } from '../../utility/dateConversion';
import { mapIdToName } from '../../utility/OtherUtilities';
import PageHeader from '../UtilityComp/PageHeader';
import SegmentedFilter from '../UtilityComp/SegmentedFilter';
import EmptyState from '../UtilityComp/EmptyState';
import {
    CHIP_BASE,
    formatDateFr,
    ppeCategoryLabel,
    PRIORITY_OPTIONS,
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
    // Libellés bilingues : clés i18n `ppe:*`, repli sur les libellés FR centralisés (ppeLabels.ts).
    const tPriority = (code?: string | null): string =>
        t(`priority.${(code ?? '').toUpperCase()}`, { defaultValue: priorityConfig(code).label });
    const tRequestStatus = (code?: string | null): string =>
        t(`requestStatus.${(code ?? '').toUpperCase()}`, { defaultValue: requestStatusConfig(code).label });
    // Options de priorité traduites pour le <Select> (mêmes valeurs backend).
    const priorityOptions = PRIORITY_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`priority.${o.value.toUpperCase()}`, { defaultValue: o.label }),
    }));
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    // EPI actifs : pour le formulaire de demande (on ne demande que des EPI encore au catalogue)
    const [activePpe, setActivePpe] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [viewData, setViewData] = useState<any>(null);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    // ppeMap est construit à partir de TOUS les EPI (actifs + inactifs) pour résoudre
    // les références historiques liées à un EPI désactivé.
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});

    const [statusFilter, setStatusFilter] = useState<string>(ALL);
    const [search, setSearch] = useState('');

    const requestForm = useForm({
        initialValues: {
            empIds: [] as string[],
            ppeIds: [] as string[],
            desiredDate: null as Date | null,
            priority: 'Medium',
            reason: '',
        },
        validate: {
            empIds: (value) => (value.length > 0 ? null : t('requests.validateEmployees')),
            ppeIds: (value) => (value.length > 0 ? null : t('requests.validatePpe')),
            desiredDate: (value) => (value ? null : t('requests.validateDesiredDate')),
            priority: (value) => (value ? null : t('requests.validatePriority')),
            reason: (value) => (value ? null : t('requests.validateReason')),
        },
    });

    const approveForm = useForm({ initialValues: { comment: '' } });
    const rejectForm = useForm({
        initialValues: { comment: '' },
        validate: { comment: (val) => (val.trim() ? null : t('requests.validateRejectComment')) },
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
            .then((data) => setPpeMap(mapIdToName(data)))
            .catch(() => { });

        // EPI actifs uniquement → formulaire de demande
        getActivePPE()
            .then(setActivePpe)
            .catch(() => { });

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
                    return acc;
                },
                { PENDING: 0, APPROVED: 0, REJECTED: 0 }
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

    const handleSubmitRequest = (values: typeof requestForm.values) => {
        const empSize = values.empIds?.length || 0;
        let error = '';

        for (const x of values.ppeIds) {
            const ppeItem = ppeMap[x];
            if (ppeItem && ppeItem.stock < empSize) {
                error = t('requests.insufficientStock', { name: ppeItem.name });
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
                successNotification(t('requests.createSuccess'));
                setShowRequestForm(false);
                requestForm.reset();
                fetchRequests();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('requests.createError'));
            })
            .finally(() => setLoading(false));
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
                        onClick={() => setShowRequestForm(true)}
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
                                <Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={() => setShowRequestForm(true)}>
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

            {/* Modale : nouvelle demande */}
            <Modal
                opened={showRequestForm}
                onClose={() => setShowRequestForm(false)}
                title={<span className="text-base text-slate-900">{t('requests.modalNewTitle')}</span>}
                size="xl"
                centered
                radius="md"
            >
                <LoadingOverlay visible={loading} />
                <form className="grid grid-cols-1 gap-4" onSubmit={requestForm.onSubmit(handleSubmitRequest)}>
                    <MultiSelect
                        label={t('requests.fieldEmployees')}
                        placeholder={t('requests.fieldEmployeesPlaceholder')}
                        data={employees.map((emp: any) => ({ value: '' + emp.id, label: emp.name }))}
                        searchable
                        hidePickedOptions
                        withAsterisk
                        size="sm"
                        {...requestForm.getInputProps('empIds')}
                    />
                    <MultiSelect
                        label={t('requests.fieldRequestedPpe')}
                        placeholder={t('requests.fieldRequestedPpePlaceholder')}
                        data={activePpe.map((item: any) => ({
                            value: '' + item.id,
                            label: t('requests.ppeOptionLabel', { name: item.name, category: ppeCategoryLabel(item.category), stock: item.stock }),
                        }))}
                        hidePickedOptions
                        searchable
                        withAsterisk
                        size="sm"
                        {...requestForm.getInputProps('ppeIds')}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <DateInput
                            label={t('requests.fieldDesiredDate')}
                            placeholder={t('requests.datePlaceholder')}
                            withAsterisk
                            size="sm"
                            valueFormat="DD/MM/YYYY"
                            {...requestForm.getInputProps('desiredDate')}
                            minDate={new Date()}
                        />
                        <Select
                            label={t('requests.fieldPriority')}
                            placeholder={t('requests.fieldPriorityPlaceholder')}
                            data={priorityOptions}
                            withAsterisk
                            size="sm"
                            {...requestForm.getInputProps('priority')}
                        />
                    </div>
                    <Textarea
                        label={t('requests.fieldReason')}
                        placeholder={t('requests.fieldReasonPlaceholder')}
                        rows={3}
                        withAsterisk
                        size="sm"
                        {...requestForm.getInputProps('reason')}
                    />
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <Button variant="default" size="sm" onClick={() => setShowRequestForm(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" size="sm" color="teal" leftSection={<IconClipboardList size={14} />}>
                            {t('requests.submit')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modale : approbation */}
            <Modal
                opened={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                title={<span className="text-base text-slate-900">{t('requests.modalApproveTitle')}</span>}
                centered
                radius="md"
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
            </Modal>

            {/* Modale : rejet */}
            <Modal
                opened={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title={<span className="text-base text-slate-900">{t('requests.modalRejectTitle')}</span>}
                centered
                radius="md"
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
            </Modal>

            {/* Modale : détail */}
            <Modal
                opened={showViewModal}
                onClose={() => setShowViewModal(false)}
                title={<span className="text-base text-slate-900">{t('requests.modalViewTitle')}</span>}
                size="lg"
                centered
                radius="md"
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
            </Modal>
        </div>
    );
};

export default PPERequestsTable;
