import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, TextInput, Tooltip, Tabs } from '@mantine/core';
import { IconEdit, IconLayoutGrid, IconLayoutList, IconPlayerPlay, IconSearch, IconUpload } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAllAudit, getLeadAuditors } from '../../../services/AuditService';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { capitalizeFirstLetter, mapIdToName } from '../../../utility/OtherUtilities';
import AuditCard from './AuditCard';
import AuditDashboard from './AuditDashboard/AuditDashboard';
import { auditStatuses, auditStatusMap } from '../../../Data/DropdownData';
import { formatDateShort } from '../../../utility/DateFormats';
import { GetAllAuditArea } from '../../../services/AuditAreaService';
import { Badge } from '@mantine/core';
import { successNotification } from '../../../utility/NotificationUtility';
import { auditCategoryLabel, auditStatusColor } from './auditLabels';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const AuditData = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('audits');
    // Libellés bilingues : clés i18n `audits:*`, repli sur les libellés FR centralisés.
    // Statut (badge / CSV) — repli sur auditStatusMap (FR).
    const tStatus = (code?: string | null): string =>
        code ? t(`status.${String(code).toUpperCase()}`, { defaultValue: auditStatusMap[code] ?? code }) : '—';
    // Libellé d'onglet de statut — repli sur le label FR de auditStatuses.
    const tStatusTab = (code: string, fallback: string): string =>
        t(`statusTab.${String(code).toUpperCase()}`, { defaultValue: fallback });
    // Catégorie (Interne / Externe) — repli sur auditCategoryLabel (FR).
    const tCategory = (cat?: string | null): string =>
        t(`category.${String(cat ?? '').toUpperCase()}`, { defaultValue: auditCategoryLabel(cat) });
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [auditData, setAuditData] = useState<any[]>([]);
    const dispatch = useDispatch();
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, _setSelectedStatus] = useState('All');
    const [activeTab, setActiveTab] = useState<string>('dashboard');
    const [auditAreaMap, setAuditAreaMap] = useState<any>({});
    const [leadAuditors, setLeadAuditors] = useState<Record<string, any>>({});


    useEffect(() => {
        dispatch(showOverlay());
        getAllAudit().then((res) => {
            setAuditData(res);
        }).catch((_err) => { }).finally(() => {
            dispatch(hideOverlay());
        })
        GetAllAuditArea({}).then((res) => {
            setAuditAreaMap(mapIdToName(res));
        }).catch((_err) => { });
        getLeadAuditors().then((res) => {
            setLeadAuditors(res.reduce((acc: any, auditor: any) => {
                acc[auditor.auditId] = auditor;
                return acc;
            }, {}));
        }).catch(() => { }).finally(() => { });
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const nameBodyTemplate = (rowData: any) => {
        return <Link to={`details/${rowData.id}`} className='hover:underline text-blue-500'>
            {rowData.title}
        </Link>
    };


    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-2">

                {activeTab == "EXECUTION" && <Tooltip label={t('list.executeAudit')}>
                    <ActionIcon onClick={() => navigate(`details/${rowData.id}?tab=execution`)} color="indigo" variant="light" size="sm" aria-label={t('list.executeAudit')}>
                        <IconPlayerPlay className="!w-4/5 !h-4/5" stroke={1.75} />
                    </ActionIcon>
                </Tooltip>
                }
                <Tooltip label={t('list.editSchedule')}>
                    <ActionIcon onClick={() => navigate(`edit-schedule/${rowData.id}`)} color="teal" variant="light" size="sm" aria-label={t('list.editSchedule')}>
                        <IconEdit className="!w-4/5 !h-4/5" stroke={1.75} />
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };

    // Export CSV de la liste filtrée (même pattern que le module Conformité).
    const exportCsv = () => {
        const headers = [t('list.csvReference'), t('list.csvTitle'), t('list.csvScope'), t('list.csvLeadAuditor'), t('list.csvCategory'), t('list.csvStart'), t('list.csvEnd'), t('list.csvStatus')];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredData.map((row: any) =>
            [
                row.refNumber ?? '',
                row.title ?? '',
                auditAreaMap[row.scopeId]?.name ?? '',
                leadAuditors[row.id]?.name ?? '',
                tCategory(row.category),
                formatDateShort(row.startDate),
                formatDateShort(row.endDate),
                row.status ? tStatus(row.status) : '',
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audits_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(t('list.exportedToast', { count: filteredData.length }));
    };

    const rightToolbarTemplate = () => {
        return (
            activeTab !== "dashboard" && <div className="flex gap-3 items-center">
                <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
                    <Tooltip label={t('list.tableView')}>
                        <ActionIcon
                            variant={viewType === 'table' ? 'filled' : 'light'}
                            color="indigo"
                            size="sm"
                            onClick={() => setViewType('table')}
                        >
                            <IconLayoutList size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t('list.cardView')}>
                        <ActionIcon
                            variant={viewType === 'card' ? 'filled' : 'light'}
                            color="indigo"
                            size="sm"
                            onClick={() => setViewType('card')}
                        >
                            <IconLayoutGrid size={16} />
                        </ActionIcon>
                    </Tooltip>
                </div>
                <Button size="sm" variant='default' leftSection={<IconUpload size={14} />} onClick={exportCsv} disabled={!filteredData.length}>{t('list.export')}</Button>
                <TextInput
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    size='sm'
                    radius="md"
                    placeholder={t('list.search')}
                    leftSection={<IconSearch size={14} />}
                />
            </div>
        );
    };

    // Onglets statut audit — palette charte R7 (cyan=planifié, violet=en attente,
    // amber=en cours, emerald=clôturé, slate=annulé)
    const planningTabOptions = [
        { value: 'dashboard', label: t('list.tabDashboard'), tabClass: '!text-slate-600 hover:!text-slate-800 data-[active]:!bg-slate-100 data-[active]:!text-slate-800 data-[active]:!border-slate-400' },
        ...auditStatuses.map((status) => {
            let colorClass = '!text-slate-600';
            switch (status.value) {
                case 'PLANNING': colorClass = 'hover:!text-cyan-700 data-[active]:!bg-cyan-50 data-[active]:!text-cyan-800 data-[active]:!border-cyan-500'; break;
                case 'PREPARATION': colorClass = 'hover:!text-violet-700 data-[active]:!bg-violet-50 data-[active]:!text-violet-800 data-[active]:!border-violet-500'; break;
                case 'EXECUTION': colorClass = 'hover:!text-amber-700 data-[active]:!bg-amber-50 data-[active]:!text-amber-800 data-[active]:!border-amber-500'; break;
                case 'CLOSED': colorClass = 'hover:!text-emerald-700 data-[active]:!bg-emerald-50 data-[active]:!text-emerald-800 data-[active]:!border-emerald-500'; break;
                default: colorClass = 'hover:!text-slate-700 data-[active]:!bg-slate-100 data-[active]:!text-slate-700 data-[active]:!border-slate-400'; break;
            }
            return {
                value: status.value,
                label: `${tStatusTab(status.value, status.label)} (${auditData.filter(x => x.status === status.value).length})`,
                tabClass: `!text-slate-600 ${colorClass}`
            };
        })
    ];

    const leftToolbarTemplate = () => (
        <div className='flex gap-4 items-center'>
            <Tabs value={activeTab} onChange={value => value && setActiveTab(value)} keepMounted={false}>
                <Tabs.List className="mb-2 border-b border-slate-200 bg-white !rounded-lg p-1">
                    {planningTabOptions.map(opt => (
                        <Tabs.Tab
                            key={opt.value}
                            value={opt.value}
                            className={`${opt.tabClass} !rounded-lg px-3 py-1.5 text-sm transition-colors duration-200`}
                        >
                            {opt.label}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>
        </div>
    );


    // const statusTemplate = () => {
    //     const statuses = ['All', ...new Set(auditData.map(a => a.status))];
    //     return (
    //         <SegmentedControl
    //             value={selectedStatus}
    //             onChange={setSelectedStatus}
    //             data={statuses.map((status) => ({
    //                 label: `${capitalizeFirstLetter(status)} (${auditData.filter(x => x.status === status || status === 'All').length})`,
    //                 value: status,
    //             }))}
    //             color="blue"
    //         />
    //     );
    // };

    // Onglets catégorie (Interne / Externe) — libellés FR, valeurs inchangées
    const categoryTabOptions = (() => {
        const categories = ['All', ...new Set(auditData.map(a => capitalizeFirstLetter(a.category)))];
        return categories.map(cat => {
            let colorClass = '!text-slate-600';
            if (cat !== 'All') {
                colorClass = 'hover:!text-indigo-600 data-[active]:!bg-indigo-50 data-[active]:!text-indigo-800 data-[active]:!border-indigo-500';
            }
            return {
                value: cat,
                label: `${cat === 'All' ? t('list.all') : tCategory(cat)} (${auditData.filter((x) => x.status == activeTab).filter(x => capitalizeFirstLetter(x.category) === cat || cat === 'All').length})`,
                tabClass: `!text-slate-600 ${colorClass}`
            };
        });
    })();

    const categoryTemplate = () => (
        <Tabs value={selectedCategory} onChange={value => value && setSelectedCategory(value)} keepMounted={false}>
            <Tabs.List className="mb-2 border-b border-slate-200 bg-white !rounded-lg p-1">
                {categoryTabOptions.map(opt => (
                    <Tabs.Tab
                        key={opt.value}
                        value={opt.value}
                        className={`${opt.tabClass} !rounded-lg px-3 py-1.5 text-sm transition-colors duration-200`}
                    >
                        {opt.label}
                    </Tabs.Tab>
                ))}
            </Tabs.List>
        </Tabs>
    );

    const filteredData = auditData.filter((x) => x.status == activeTab).filter((item) => {
        const matchesCategory = selectedCategory === 'All' || capitalizeFirstLetter(item.category) === selectedCategory;
        const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
        return matchesCategory && matchesStatus;
    });

    const leadAuditorBodyTemplate = (rowData: any) => {
        const leadAuditor = leadAuditors[rowData.id];
        return (
            <span >
                {leadAuditor ? leadAuditor.name : '-'}
            </span>
        );
    }

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
            {activeTab !== 'dashboard' && (
                <>
                    <Toolbar className="mb-4 !p-2" left={categoryTemplate} />

                    {
                        viewType === 'table' ? (
                            <DataTable selectionMode="single"
                                size='small'
                                className='[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]'
                                stripedRows
                                removableSort
                                paginator
                                value={filteredData} rows={10}
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                rowsPerPageOptions={[10, 25, 50]}
                                dataKey="id"
                                filters={filters}
                                globalFilterFields={['title', 'refNumber', 'category']}
                                currentPageReportTemplate={t('list.paginator')}
                                emptyMessage={t('list.emptyTable')}
                                onFilter={(e) => setFilters(e.filters)}
                            >

                                <Column field="refNumber" header={t('list.colReference')} sortable />
                                <Column field="title" body={nameBodyTemplate} header={t('list.colTitle')} sortable />
                                <Column field="scopeId" header={t('list.colScope')} body={(rowData) => auditAreaMap[rowData.scopeId]?.name ?? '—'} />
                                <Column align="center" field="leadAuditor" header={t('list.colLeadAuditor')} body={leadAuditorBodyTemplate} />
                                <Column field="category" header={t('list.colCategory')} body={(rowData) => tCategory(rowData.category)} />

                                <Column field="startDate" header={t('list.colStart')} body={(rowData) => formatDateShort(rowData.startDate)} sortable />
                                <Column field="endDate" header={t('list.colEnd')} body={(rowData) => formatDateShort(rowData.endDate)} />

                                <Column field="status" header={t('list.colStatus')} body={(rowData) => (
                                    <Badge
                                        color={auditStatusColor(rowData.status)}
                                        size="sm"
                                        variant="light"
                                        className="rounded-full whitespace-nowrap"
                                    >
                                        {tStatus(rowData.status)}
                                    </Badge>
                                )} />

                                <Column headerStyle={{ width: '6rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} header={t('list.colActions')} body={actionBodyTemplate} />
                            </DataTable>

                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                {filteredData.map((audit) => (
                                    <AuditCard key={audit.id} incidentData={audit} auditAreaMap={auditAreaMap} />
                                ))}
                                {filteredData.length === 0 && (
                                    <div className='text-sm text-slate-500 col-span-3 mx-auto py-8'>
                                        {t('list.emptyCard')}
                                    </div>
                                )}
                            </div>
                        )}
                </>
            )}

            {activeTab === 'dashboard' && (
                <div className="py-2">
                    <AuditDashboard audits={auditData} auditAreaMap={auditAreaMap} />
                </div>
            )}
        </div>
    );
};

export default AuditData;
