import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {
    ActionIcon,
    Badge,
    Button,
    Select,
    TextInput,
    Tooltip,
    Tabs,
} from '@mantine/core';
import {
    IconEdit,
    IconSearch,
    IconUpload,
    IconLayoutGrid,
    IconLayoutList
} from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import IncidentCard from './IncidentCard';
import EmptyState from '../../UtilityComp/EmptyState';
import { IconShieldExclamation } from '@tabler/icons-react';

import { getAllIncidents } from '../../../services/IncidentService';
import { incidentStatuses, incidentStatusMap } from '../../../Data/DropdownData';
import { formatDateShort } from '../../../utility/DateFormats';
import { getUniqueSeverityLevel } from '../../../services/SeverityLevelService';
import { getAllActiveIncidentCategories } from '../../../services/IncidentCategory';
import { getAllDepartments } from '../../../services/HrmsService';
import { getTailwindColorForSeverityLevel, mapIdToName } from '../../../utility/OtherUtilities';
import { getEmployeesByIds } from '../../../services/EmployeeService';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const IncidentManagementData = () => {
    const navigate = useNavigate();
    const [selectedLevel, setSelectedLevel] = useState<string>('All');
    const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [levels, setLevels] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    // removed: selectedCategory, setSelectedCategory
    const [selectedStatus, setSelectedStatus] = useState<string | null>('All');
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>('All');
    const [deptMap, setDeptMap] = useState<Record<number, any>>({});
    const [departments, setDepartments] = useState<any[]>([]);
    const [emps, setEmps] = useState<Record<number, any>>({});


    useEffect(() => {
        getAllIncidents()
            .then((res) => {

                setIncidents(res);
                getEmployeesByIds(res.map((x: any) => x.reporterId)).then((emps: any) => {
                    setEmps(mapIdToName(emps));
                }).catch((_err) => { });

            })
            .catch((_err) => { });

        getAllDepartments()
            .then((res) => {
                setDeptMap(mapIdToName(res));
                setDepartments(res.map((dept: any) => ({
                    label: dept.name,
                    value: "" + dept.id,
                })));
            }).catch((_err) => { });


        getUniqueSeverityLevel()
            .then((res) => {
                const uniqueLevels = res.map((level: any) => ({
                    label: level.name,
                    value: "" + level.level,
                }));
                setLevels([{ label: "All", value: "All" }, ...uniqueLevels]);
            })
            .catch((err) => {
                console.error('Error fetching unique severity levels:', err);
            });

        getAllActiveIncidentCategories()
            .then((res) => {
                const cats = res.map((c: any) => c.name);
                setCategories(['All', ...cats]);
            })
            .catch((err) => {
                console.error('Error fetching categories:', err);
            });
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const nameBodyTemplate = (rowData: any) => (
        <Link to={`${rowData.id}`} className='hover:underline text-blue-500'>
            {rowData.title}
        </Link>
    );

    const rightToolbarTemplate = () => (
        <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1 border border-primary rounded-lg p-1 bg-gray-100">
                <Tooltip label="Table View">
                    <ActionIcon
                        variant={viewType === 'table' ? 'filled' : 'light'}
                        color="blue"
                        onClick={() => setViewType('table')}
                    >
                        <IconLayoutList size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Card View">
                    <ActionIcon
                        variant={viewType === 'card' ? 'filled' : 'light'}
                        color="blue"
                        onClick={() => setViewType('card')}
                    >
                        <IconLayoutGrid size={18} />
                    </ActionIcon>
                </Tooltip>
            </div>
            <Button size="sm" variant="outline" leftSection={<IconUpload />}>
                Export
            </Button>
            <TextInput
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                size="sm"
                placeholder="Search"
                leftSection={<IconSearch />}
            />
        </div>
    );

    // Severity Tabs (like NonConformityDashboard)
    const severityTabOptions = [
        { value: 'All', label: 'All', tabClass: '!text-slate-600 hover:!text-slate-800 data-[active]:!bg-slate-100 data-[active]:!text-slate-800 data-[active]:!border-slate-400' },
        ...levels.filter(l => l.value !== 'All').map(l => {
            let colorClass = '!text-slate-600';
            switch (l.value) {
                case '1': colorClass = 'hover:!text-green-600 data-[active]:!bg-green-100 data-[active]:!text-green-800 data-[active]:!border-green-500'; break;
                case '2': colorClass = 'hover:!text-yellow-600 data-[active]:!bg-yellow-100 data-[active]:!text-yellow-800 data-[active]:!border-yellow-500'; break;
                case '3': colorClass = 'hover:!text-orange-600 data-[active]:!bg-orange-100 data-[active]:!text-orange-800 data-[active]:!border-orange-500'; break;
                case '4': colorClass = 'hover:!text-red-700 data-[active]:!bg-red-100 data-[active]:!text-red-800 data-[active]:!border-red-600'; break;
                case '5': colorClass = 'hover:!text-red-900 data-[active]:!bg-red-100 data-[active]:!text-red-900 data-[active]:!border-red-900'; break;
                default: break;
            }
            return {
                value: l.value,
                label: l.label,
                tabClass: `!text-slate-600 ${colorClass}`
            };
        })
    ];

    // Severity tab counts are NOT affected by category filter
    const leftToolbarTemplate = () => (
        <Tabs value={selectedLevel} onChange={value => value && setSelectedLevel(value)} keepMounted={false}>
            <Tabs.List className="mb-2 border-b border-slate-200 bg-white !rounded-lg p-1">
                {severityTabOptions.map(opt => (
                    <Tabs.Tab
                        key={opt.value}
                        value={opt.value}
                        className={`${opt.tabClass} !rounded-lg px-3 py-1.5 text-sm transition-all duration-200`}
                    >
                        {levels.find(l => l.value === opt.value)?.label || opt.label} ({incidents.filter(x => (opt.value === 'All' || x.maxSeverityLevel == opt.value)).length})
                    </Tabs.Tab>
                ))}
            </Tabs.List>
        </Tabs>
    );

    // Category Tabs (like NonConformityDashboard)
    // Cross-filtered count: category tab counts filtered by selectedLevel
    const categoryTabOptions = categories.map(category => {
        let colorClass = '!text-slate-600';
        if (category !== 'All') {
            colorClass = 'hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500';
        }
        return {
            value: category,
            label: category,
            tabClass: `!text-slate-600 ${colorClass}`
        };
    });

    const categoryTemplate = () => (
        <Tabs value={selectedCategoryTab} onChange={value => value && setSelectedCategoryTab(value)} keepMounted={false}>
            <Tabs.List className="mb-2 border-b border-slate-200 bg-white !rounded-lg p-1">
                {categoryTabOptions.map(opt => (
                    <Tabs.Tab
                        key={opt.value}
                        value={opt.value}
                        className={`${opt.tabClass} !rounded-lg px-3 py-1.5 text-sm transition-all duration-200`}
                    >
                        {opt.label} ({incidents.filter(x => (selectedLevel === 'All' || x.maxSeverityLevel == selectedLevel) && (opt.value === 'All' || x.incidentCategoryName === opt.value)).length})
                    </Tabs.Tab>
                ))}
            </Tabs.List>
        </Tabs>
    );

    const dropdownFilterTemplate = () => (
        <div className="flex items-center gap-2">
            <Select allowDeselect={false}
                size='sm'
                data={[{ label: "All", value: "All" }, ...incidentStatuses]}
                value={selectedStatus}
                onChange={setSelectedStatus}
            />
            <Select allowDeselect={false}
                size='sm'
                data={[{ label: "All", value: "All" }, ...departments]}
                value={selectedDepartment}
                onChange={setSelectedDepartment}

            />
        </div>
    );

    // const getSeverityTemplate = (order: any) => {
    //     switch (order) {
    //         case 1: return 'info';
    //         case 2: return 'secondary';
    //         case 3: return 'warning';
    //         case 4: return 'danger';
    //         default: return null;
    //     }
    // };

    // Map severity level to Tailwind color classes

    const levelBodyTemplate = (rowData: any) => {
        const level = rowData.maxSeverityLevel;
        const severityLevelName = rowData.severityLevelName || 'Unknown';
        return (
            <span className={`px-2 py-1 rounded text-xs w-fit capitalize ${getTailwindColorForSeverityLevel(level)}`}>
                {`${level} - ${severityLevelName}`}
            </span>
        );
    };

    // const getOrderSeverity = (order: any) => {
    //     switch (order) {
    //         case 'RESOLVED': return 'success';
    //         case 'ACTION_TAKEN': return 'danger';
    //         case 'REPORTED': return 'warning';
    //         case 'CLOSED': return 'info';
    //         default: return null;
    //     }
    // };

    const getSeverity = (rowData: any) => (
        <Badge radius="sm" className='!capitalize !font-medium' color="purple" variant='outline'>{incidentStatusMap[rowData.status]}</Badge>
    );

    const actionBodyTemplate = (rowData: any) => {
        const statusUpper = String(rowData?.status || '').toUpperCase();
        const isClosed = statusUpper === 'CLOSED';
        const isRejected = statusUpper === 'REJECTED';
        const canEdit = !(isClosed || isRejected);
        const canInvestigate = !(isClosed || isRejected);
        const editTooltip = canEdit ? 'Edit' : (isClosed ? 'Closed — modification not possible' : 'Rejected — modification not possible');
        const invTooltip = canInvestigate ? 'Investigation' : (isClosed ? 'Closed — investigation not allowed' : 'Rejected — investigation not allowed');
        return (
            <div className='flex gap-3 justify-center'>
                <Tooltip label={editTooltip}>
                    <span className="inline-flex">
                        <ActionIcon onClick={() => { if (canEdit) navigate(`edit/${rowData.id}`); }} variant="filled" size="sm" color="primary" disabled={!canEdit}>
                            <IconEdit style={{ width: '90%', height: '90%' }} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>
                <Tooltip label={invTooltip}>
                    <span className="inline-flex">
                        <ActionIcon onClick={() => { if (canInvestigate) navigate(`investigation/${rowData.id}`); }} variant="filled" size="sm" color="blue" disabled={!canInvestigate}>
                            <IconSearch style={{ width: '90%', height: '90%' }} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>

            </div>
        );
    };

    // Enrich incidents so table rerenders when dept/emps maps load
    const enrichedIncidents = useMemo(() => {
        return incidents.map((i: any) => ({
            ...i,
            departmentName: deptMap[i?.departmentId]?.name ?? 'Unknown',
            reporterName: emps[i?.reporterId]?.name ?? '-',
        }));
    }, [incidents, deptMap, emps]);

    const filteredData = useMemo(() => {
        return enrichedIncidents.filter((incident: any) => {
            const levelMatch = selectedLevel === 'All' || incident.maxSeverityLevel == selectedLevel;
            const categoryMatch = selectedCategoryTab === 'All' || incident.incidentCategoryName === selectedCategoryTab;
            const statusMatch = selectedStatus === 'All' || incident.status === selectedStatus;
            const departmentMatch = selectedDepartment === 'All' || (incident.departmentId && selectedDepartment === "" + incident.departmentId);
            return levelMatch && categoryMatch && statusMatch && departmentMatch;
        });
    }, [enrichedIncidents, selectedLevel, selectedCategoryTab, selectedStatus, selectedDepartment]);

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-3 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate} />
            <Toolbar className="mb-4 !p-2" left={categoryTemplate} right={dropdownFilterTemplate} />
            {
                viewType === 'table' ? (
                    <DataTable
                        selectionMode="single"
                        className='[&_.p-datatable-tbody]:!text-sm'
                        size="small"
                        stripedRows
                        removableSort
                        paginator
                        value={filteredData}
                        rows={10}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        rowsPerPageOptions={[10, 25, 50]}
                        dataKey="name"
                        filters={filters}
                        globalFilterFields={['title', 'incidentCategoryName', 'status', 'departmentName', 'reporterName']}
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        onFilter={(e) => setFilters(e.filters)}
                    >
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="title" body={nameBodyTemplate} header="Incident Name" sortable />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="incidentCategoryName" header="Category" />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="departmentName" header="Department" />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="reporterName" header="Reporter" />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="severity" header="Severity Level" body={levelBodyTemplate} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="incidentDate" header="Report Date" body={(rowData: any) => formatDateShort(rowData.incidentDate)} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={getSeverity} />
                        <Column bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
                    </DataTable>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {filteredData.map((incidentData) => (
                            <IncidentCard key={incidentData.id} incidentData={incidentData} emps={emps} />
                        ))}
                        {/* LOT 41 E: EmptyState unifié pour la vue carte */}
                        {filteredData.length === 0 && (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={<IconShieldExclamation size={28} />}
                                    title="Aucun incident à afficher"
                                    description="Aucun incident ne correspond aux filtres sélectionnés."
                                    iconColor="slate"
                                />
                            </div>
                        )}
                    </div>
                )
            }
        </div>
    );
};

export default IncidentManagementData; 
