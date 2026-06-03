import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, TextInput, Tooltip, Tabs } from '@mantine/core';
import { IconEdit, IconLayoutGrid, IconLayoutList, IconPlayerPlay, IconSearch, IconTrash, IconUpload } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllAudit, getLeadAuditors } from '../../../services/AuditService';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { capitalizeFirstLetter, mapIdToName } from '../../../utility/OtherUtilities';
import AuditCard from './AuditCard';
import AuditDashboard from './AuditDashboard/AuditDashboard';
import { auditStatuses, auditStatusMap } from '../../../Data/DropdownData';
import { formatDateShort } from '../../../utility/DateFormats';
import { GetAllAuditArea } from '../../../services/AuditAreaService';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const AuditData = () => {
    const navigate = useNavigate();
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

                {activeTab == "EXECUTION" && <Tooltip label="Exécuter l'audit">
                    <ActionIcon onClick={() => navigate(`details/${rowData.id}?tab=execution`)} color="indigo" variant="light" size="sm">
                        <IconPlayerPlay className="!w-4/5 !h-4/5" stroke={1.75} />
                    </ActionIcon>
                </Tooltip>
                }
                <Tooltip label="Modifier la planification">
                    <ActionIcon onClick={() => navigate(`edit-schedule/${rowData.id}`)} color="teal" variant="light" size="sm">
                        <IconEdit className="!w-4/5 !h-4/5" stroke={1.75} />
                    </ActionIcon>
                </Tooltip>
                {/* <Tooltip label="View Details Audit">
                    <ActionIcon onClick={() => navigate(`details/${rowData.id}`)} color='yellow' size="sm">
                        <IconEye className="!w-4/5 !h-4/5" stroke={1.5} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="View Details Audit Tabs">
                    <ActionIcon onClick={() => navigate(`details-tabs/${rowData.id}`)} color='green' size="sm">
                        <IconTable className="!w-4/5 !h-4/5" stroke={1.5} />
                    </ActionIcon>
                </Tooltip> */}

                <Tooltip label="Supprimer la planification">
                    <ActionIcon onClick={() => (rowData)} color="red" variant="light" size="sm">
                        <IconTrash className="!w-4/5 !h-4/5" stroke={1.75} />
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            activeTab !== "dashboard" && <div className="flex gap-3 items-center">
                <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
                    <Tooltip label="Vue tableau">
                        <ActionIcon
                            variant={viewType === 'table' ? 'filled' : 'light'}
                            color="indigo"
                            size="sm"
                            onClick={() => setViewType('table')}
                        >
                            <IconLayoutList size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Vue cartes">
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
                <Button size="sm" variant='default' leftSection={<IconUpload size={14} />}>Exporter</Button>
                <TextInput
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    size='sm'
                    radius="md"
                    placeholder='Rechercher un audit…'
                    leftSection={<IconSearch size={14} />}
                />
            </div>
        );
    };

    // Onglets statut audit — couleurs cohérentes avec la palette HSE
    const planningTabOptions = [
        { value: 'dashboard', label: 'Tableau de bord', tabClass: '!text-slate-600 hover:!text-slate-800 data-[active]:!bg-slate-100 data-[active]:!text-slate-800 data-[active]:!border-slate-400' },
        ...auditStatuses.map((status) => {
            let colorClass = '!text-slate-600';
            switch (status.value) {
                case 'PLANNING': colorClass = 'hover:!text-green-600 data-[active]:!bg-green-100 data-[active]:!text-green-800 data-[active]:!border-green-500'; break;
                case 'EXECUTION': colorClass = 'hover:!text-yellow-600 data-[active]:!bg-yellow-100 data-[active]:!text-yellow-800 data-[active]:!border-yellow-500'; break;
                case 'CLOSED': colorClass = 'hover:!text-red-700 data-[active]:!bg-red-100 data-[active]:!text-red-800 data-[active]:!border-red-600'; break;
                default: colorClass = 'hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500'; break;
            }
            return {
                value: status.value,
                label: `${status.label} (${auditData.filter(x => x.status === status.value).length})`,
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
                            className={`${opt.tabClass} !rounded-lg px-3 py-1.5 text-sm transition-all duration-200`}
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

    // Blue tabs for internal/external
    const categoryTabOptions = (() => {
        const categories = ['All', ...new Set(auditData.map(a => capitalizeFirstLetter(a.category)))];
        return categories.map(cat => {
            let colorClass = '!text-slate-600';
            if (cat !== 'All') {
                colorClass = 'hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500';
            }
            return {
                value: cat,
                label: `${cat} (${auditData.filter((x) => x.status == activeTab).filter(x => capitalizeFirstLetter(x.category) === cat || cat === 'All').length})`,
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
                        className={`${opt.tabClass} !rounded-lg px-3 py-1.5 text-sm transition-all duration-200`}
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
                                className='[&_.p-datatable-tbody]:!text-sm'
                                stripedRows
                                removableSort
                                paginator
                                value={filteredData} rows={10}
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                rowsPerPageOptions={[10, 25, 50]}
                                dataKey="title"
                                filters={filters}
                                globalFilterFields={['title', 'refNumber', 'objective', 'sites']}
                                currentPageReportTemplate="{first} à {last} sur {totalRecords} audits"
                                emptyMessage="Aucun audit dans ce statut"
                                onFilter={(e) => setFilters(e.filters)}
                            >

                                <Column style={{ fontSize: "13px" }} field="refNumber" header="Référence" sortable />
                                <Column style={{ fontSize: "13px" }} field="title" body={nameBodyTemplate} header="Titre de l'audit" sortable />
                                <Column style={{ fontSize: "13px" }} field="scopeId" header="Domaine d'audit" body={(rowData) => auditAreaMap[rowData.scopeId]?.name ?? '—'} />
                                <Column align="center" style={{ fontSize: "13px" }} field="leadAuditor" header="Auditeur principal" body={leadAuditorBodyTemplate} />
                                <Column style={{ fontSize: "13px" }} field="category" header="Catégorie" body={(rowData) => capitalizeFirstLetter(rowData.category)} />

                                <Column style={{ fontSize: "13px" }} field="startDate" header="Début" body={(rowData) => formatDateShort(rowData.startDate)} sortable />
                                <Column style={{ fontSize: "13px" }} field="endDate" header="Fin" body={(rowData) => formatDateShort(rowData.endDate)} />

                                <Column style={{ fontSize: "13px" }} field="status" header="Statut" body={(rowData) => <Button
                                    color="indigo"
                                    size="compact-xs"
                                    variant="light"
                                    radius="sm"
                                >{auditStatusMap[rowData.status ?? ""] ?? rowData.status}</Button>} />

                                <Column style={{ fontSize: "13px" }} headerStyle={{ width: '6rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} header="Actions" body={actionBodyTemplate} />
                            </DataTable>

                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                {filteredData.map((audit) => (
                                    <AuditCard key={audit.id} incidentData={audit} auditAreaMap={auditAreaMap} />
                                ))}
                                {filteredData.length === 0 && (
                                    <div className='text-sm text-slate-500 col-span-3 mx-auto py-8'>
                                        Aucun audit dans ce statut
                                    </div>
                                )}
                            </div>
                        )}
                </>
            )}

            {activeTab === 'dashboard' && (
                <div className="text-center text-xl text-gray-600 py-10">
                    <AuditDashboard audits={auditData} auditAreaMap={auditAreaMap} />
                </div>
            )}
        </div>
    );
};

export default AuditData;
