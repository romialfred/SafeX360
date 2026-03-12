import { useEffect, useMemo, useState } from 'react';
import {
    // Plus
    // Eye
    // Edit3
    // Search
    // Filter
    // Building
    // AlertTriangle
    IconPlus, // Beaker
    IconEye, // Clock
    IconEdit, IconSearch, IconAlertTriangle, IconFlask2, IconClock, IconCircleCheck, IconChartBar
} from '@tabler/icons-react';
import { Badge, Breadcrumbs, Button, Text } from '@mantine/core';
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { ActionIcon, Select, TextInput, Tooltip, SegmentedControl } from "@mantine/core";
import { Link, useNavigate } from 'react-router-dom';
import { getAllChemicalRisks } from '../../../services/RiskIdentificationService';
import { getAllDepartments } from '../../../services/HrmsService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { errorNotification } from '../../../utility/NotificationUtility';
import { GetAllWorkProcess } from '../../../services/WorkProcessService';
import { FilterMatchMode } from 'primereact/api';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { riskMap } from '../../../Data/DropdownData';
import { IconLayoutList, IconLayoutGrid } from '@tabler/icons-react';

const defaultFilters: DataTableFilterMeta = {
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
    riskLevel: { value: null, matchMode: FilterMatchMode.EQUALS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    zone: { value: null, matchMode: FilterMatchMode.EQUALS },
};
const ChemicalRegister = () => {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const navigate = useNavigate();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);

    const [department, setDepartments] = useState<any[]>([]);
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [risks, setRisks] = useState<any[]>([]);
    const [processMap, setProcessMap] = useState<Record<string, any>>({});
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [riskLevelFilter, setRiskLevelFilter] = useState<string | null>(null);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RISKS'>('DASHBOARD');
    const tabs = [
        { value: 'DASHBOARD', label: 'Dashboard' },
        { value: 'RISKS', label: `Risks (${risks.length})` },
    ];
    const tabColorMap: Record<string, string> = { DASHBOARD: 'violet', RISKS: 'blue' };

    // Enrich risks so table updates when maps load
    const enrichedRisks = useMemo(() => {
        return risks.map((r: any) => ({
            ...r,
            departmentName: departmentMap[r?.departmentId]?.name ?? 'Unknown',
            processName: processMap[r?.workProcessId]?.name ?? '-',
            ownerName: empMap[r?.ownerId]?.name ?? '-',
        }));
    }, [risks, departmentMap, processMap, empMap]);

    const filteredRisks = useMemo(() => {
        const term = globalFilterValue.toLowerCase();
        return enrichedRisks.filter((risk: any) => {
            const matchesSearch =
                (risk.title || '').toLowerCase().includes(term) ||
                (risk.chemicalName || '').toLowerCase().includes(term) ||
                (risk.id || '').toLowerCase().includes(term) ||
                (risk.departmentName || '').toLowerCase().includes(term) ||
                (risk.processName || '').toLowerCase().includes(term) ||
                (risk.ownerName || '').toLowerCase().includes(term);

            const matchesStatus =
                statusFilter === 'all' || (risk.status && String(risk.status).toLowerCase() === statusFilter.toLowerCase());

            const matchesDepartment =
                departmentFilter === 'all' || risk.departmentId === departmentFilter;

            const matchesRiskLevel = riskLevelFilter ? riskMap[risk.riskLevel]?.level === riskLevelFilter : true;
            return matchesSearch && matchesStatus && matchesDepartment && matchesRiskLevel;
        });
    }, [enrichedRisks, globalFilterValue, statusFilter, departmentFilter, riskLevelFilter]);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };
    const fetchWorkProcesses = () => {

        GetAllWorkProcess({}).then((data) => {
            setProcessMap(mapIdToName(data))
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch work processes");
        });
    };
    const fetchEmployees = () => {

        getEmployeeDropdown().then((data) => {
            setEmpMap(mapIdToName(data))
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch employees");
        });
    };

    const fetchDepartments = () => {

        getAllDepartments().then((data) => {
            setDepartmentMap(mapIdToName(data));
            setDepartments(data);
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch departments");
        });
    };
    useEffect(() => {
        fetchDepartments();
        fetchWorkProcesses();
        fetchEmployees();
    }, [])

    useEffect(() => {
        getAllChemicalRisks()
            .then((res) => {
                console.log("API Response:", res);
                setRisks(res);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    const riskMatrix = {
        probabilityLevels: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'],
        severityLevels: ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'],
    };

    // Build cell meta (level/color) dynamically from `riskMap` using key `${probability}${severity}`
    // Use the same hex colors as RiskOverview matrix for visual consistency
    const levelToHex: Record<string, string> = {
        'Low': '#51CF66',
        'Low Med': '#94D82D',
        'Medium': '#FFD43B',
        'Med High': '#FF922B',
        'High': '#FF6B6B',
    };

    const matrixMeta = useMemo(() => (
        Array.from({ length: 5 }, (_r, pIdx) => (
            Array.from({ length: 5 }, (_c, sIdx) => {
                const key = `${pIdx + 1}${sIdx + 1}`;
                const meta = (riskMap as any)[key];
                const level: string = meta?.level ?? '';
                const bg = levelToHex[level] ?? '#E5E7EB'; // fallback to gray-200
                const text = (level === 'Low' || level === 'Low Med') ? '#000' : '#fff';
                return { level, bg, text };
            })
        ))
    ), []);

    const calculateMatrixCounts = () => {
        const counts = Array(5).fill(null).map(() => Array(5).fill(0));
        filteredRisks.forEach((risk: any) => {
            // Prefer encoded `riskLevel` like '23'; fallback to `likelihood`/`severity` if provided
            const key: string | undefined = typeof risk.riskLevel === 'string' ? risk.riskLevel : undefined;
            if (key && /^[1-5][1-5]$/.test(key)) {
                const p = parseInt(key[0], 10) - 1;
                const s = parseInt(key[1], 10) - 1;
                counts[p][s] += 1;
                return;
            }
            const pIdx = typeof risk.likelihood === 'number' ? risk.likelihood - 1 : -1;
            const sIdx = typeof risk.severity === 'number' ? risk.severity - 1 : -1;
            if (pIdx >= 0 && pIdx < 5 && sIdx >= 0 && sIdx < 5) {
                counts[pIdx][sIdx] += 1;
            }
        });
        return counts;
    };
    const matrixCounts = calculateMatrixCounts();


    const leftToolbarTemplate = () => (
        <div className="flex gap-5">
            <TextInput
                placeholder="Search users..."
                leftSection={<IconSearch size={16} />}
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
            />

            <Select
                data={[
                    { value: "all", label: "All Status" },
                    { value: "OPEN", label: "Open" },
                    { value: "IN_PROGRESS", label: "In Progress" },
                    { value: "CLOSED", label: "Closed" },
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val || "all")}
                placeholder="Filter by Status"
            />
            <Select
                data={department.map((dept) => ({ label: dept.name, value: "" + dept.id }))}
                value={departmentFilter}
                onChange={(val) => setDepartmentFilter(val || "all")}
                placeholder="Filter by Department"
            />

            <Select
                data={['Low', 'Low Med', 'Medium', 'Med High', 'High']}
                value={riskLevelFilter}
                onChange={setRiskLevelFilter}
                placeholder="Filter by Risk Level"
                clearable
            />

        </div>
    );

    const rightToolbarTemplate = () => (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-primary rounded-lg p-1 bg-gray-100">
                <Tooltip label="Table View">
                    <ActionIcon
                        variant={viewType === 'table' ? 'filled' : 'light'}
                        color="blue"
                        size="sm"
                        onClick={() => setViewType('table')}
                    >
                        <IconLayoutList size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Card View">
                    <ActionIcon
                        variant={viewType === 'card' ? 'filled' : 'light'}
                        color="blue"
                        size="sm"
                        onClick={() => setViewType('card')}
                    >
                        <IconLayoutGrid size={18} />
                    </ActionIcon>
                </Tooltip>
            </div>
        </div>
    );


    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Chemical Register</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Chemical Register</Text>
                    </Breadcrumbs>
                </div>
                {/* <Button size='xs' leftSection={<IconUpload size={20} />}>Export Register</Button> */}
                <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('create-chemical')}>
                    New Risk
                </Button>
            </div>

            <p className=' italic'>Chemical risk identification and assessment register</p>

            <div className='max-w-md'>
                <SegmentedControl
                    autoContrast
                    color={tabColorMap[activeTab]}
                    data={tabs}
                    value={activeTab}
                    onChange={(v: 'DASHBOARD' | 'RISKS' | string) => setActiveTab(v as 'DASHBOARD' | 'RISKS')}
                    size="sm"
                    radius="sm"
                    transitionDuration={200}
                />
            </div>

            <div className="">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <IconFlask2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Total Chemicals</p>
                                <p className="text-2xl font-bold text-gray-900">{risks.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <IconAlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">High Risk</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {risks.filter(r => r.riskCategory === 'High' || r.riskCategory === 'Med Hi').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <IconClock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">In Progress</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {risks.filter(r => r.status === 'In Progress').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <IconCircleCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Completed</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {risks.filter(r => r.status === 'Closed').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {activeTab === 'DASHBOARD' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="flex items-center mb-3">
                            <IconChartBar className="w-5 h-5 text-purple-600 mr-2" />
                            <h2 className="text-xl font-semibold text-gray-900">Risk Matrix Map</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="min-w-full">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-2 bg-gray-100 border border-gray-300 text-left font-semibold text-gray-900 text-sm">
                                                Probability / Severity
                                            </th>
                                            {riskMatrix.severityLevels.map((severity, index) => (
                                                <th key={index} className="p-2 bg-gray-100 border border-gray-300 text-center font-semibold text-gray-900 text-sm min-w-24">
                                                    {severity}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {riskMatrix.probabilityLevels.map((probability, probIndex) => (
                                            <tr key={probIndex}>
                                                <td className="p-2 bg-gray-100 border border-gray-300 font-semibold text-gray-900 text-sm min-w-28">
                                                    {probability}
                                                </td>
                                                {matrixMeta[probIndex].map((cell, sevIndex) => (
                                                    <td
                                                        key={sevIndex}
                                                        className={`p-2 border border-gray-300 text-center font-semibold relative h-9`}
                                                        style={{ backgroundColor: (cell as any).bg, color: (cell as any).text }}
                                                    >
                                                        <div className="text-xs mb-0.5 leading-none">{(cell as any).level}</div>
                                                        <div className="text-lg font-bold leading-none">
                                                            {matrixCounts[probIndex][sevIndex]}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Numbers in cells represent the count of risks in each probability/severity combination
                        </p>
                    </div>
                )}

                {activeTab === 'RISKS' && (
                    <div className="flex flex-col gap-2 p-4 rounded-xl border border-gray-300 shadow-sm">
                        <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate} />
                        {viewType === 'table' ? (
                            <DataTable value={filteredRisks} paginator stripedRows removableSort rows={10} rowsPerPageOptions={[10, 25, 50]} emptyMessage="No chemical risks found." className="[&_.p-datatable-tbody]:!text-sm" tableStyle={{ minWidth: "60rem" }} size="small" dataKey="id" >

                                <Column style={{ fontWeight: "normal", fontSize: "14px" }} header="Risk Title" body={(row: any) => (<div className="font-medium  text-blue-500">{row.title}</div>)} />

                                <Column style={{ fontWeight: "normal", fontSize: "14px" }} header="Department" field="departmentName" />

                                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Process" field="processName" />

                                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Owner" field="ownerName" />

                                <Column align="center" style={{ fontWeight: 'normal', fontSize: "14px" }} header="Risk Level" field="riskLevel" body={(row) => row.riskLevel ? <Badge color={riskMap[row.riskLevel]?.color} variant="filled">{riskMap[row.riskLevel]?.level}</Badge> : "-"} />

                                <Column style={{ fontWeight: "normal", fontSize: "14px" }} header="Status" body={(row: any) => {
                                    const status = row.status || "";
                                    return (
                                        <Badge size="xs" color='gray' fw={500}>
                                            {status}
                                        </Badge>);
                                }} />
                                <Column style={{ fontWeight: "normal", fontSize: "14px" }}
                                    body={(row: any) => (
                                        <div className="flex items-center gap-2">
                                            <Tooltip label="View">
                                                <ActionIcon color="blue" variant="subtle" onClick={() => navigate(`chemicalRegister-details/${row.id}`)}>
                                                    <IconEye size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Edit">
                                                <ActionIcon color="indigo" variant="subtle" onClick={() => navigate(`edit/${row.id}`)}>
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </div>
                                    )}
                                />
                            </DataTable>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Chemical Risks ({filteredRisks.length})</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredRisks.map((risk: any) => (
                                        <div key={risk.id} className="rounded-xl border border-gray-300 shadow-sm p-4 bg-white flex flex-col gap-3 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary">
                                            <div className="flex gap-2 items-center justify-between flex-wrap">
                                                {risk.processName && (
                                                    <span className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-lg font-medium">
                                                        {risk.processName}
                                                    </span>
                                                )}
                                                <Badge size="xs" color="gray" fw={500}>
                                                    {String(risk?.status || '').toLowerCase() || '-'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {risk.title || risk.chemicalName}
                                            </div>
                                            {risk.description && (
                                                <div className="text-gray-600 text-xs line-clamp-2">{risk.description}</div>
                                            )}
                                            <div className="text-gray-500 text-xs flex justify-between font-medium">
                                                <span>Owner:</span> <span className="font-semibold">{risk.ownerName || '-'}</span>
                                            </div>
                                            {risk.riskLevel && (
                                                <div className="text-gray-500 text-xs flex justify-between font-medium">
                                                    <span>Risk Level:</span>
                                                    <Badge color={riskMap[risk.riskLevel]?.color} variant="filled">{riskMap[risk.riskLevel]?.level}</Badge>
                                                </div>
                                            )}
                                            {risk.chemicalName && (
                                                <div className="text-gray-500 text-xs flex justify-between font-medium">
                                                    <span>Chemical:</span> <span className="font-semibold">{risk.chemicalName}</span>
                                                </div>
                                            )}
                                            {risk.casNumber && (
                                                <div className="text-gray-500 text-xs flex justify-between font-medium">
                                                    <span>CAS:</span> <span className="font-semibold">{risk.casNumber}</span>
                                                </div>
                                            )}
                                            <div className="text-gray-500 text-xs flex justify-between font-medium">
                                                <span>Process:</span> <span className="font-semibold">{risk.processName || '-'}</span>
                                            </div>
                                            <div className="text-gray-500 text-xs flex justify-between font-medium">
                                                <span>Department:</span> <span className="font-semibold">{risk.departmentName || '-'}</span>
                                            </div>

                                            <div className="flex justify-center grow gap-4 mt-2">
                                                <Button size="compact-xs" variant="subtle" color="yellow" onClick={() => navigate(`chemicalRegister-details/${risk.id}`)}>Details</Button>
                                                <Button size="compact-xs" variant="subtle" color="primary" onClick={() => navigate(`edit/${risk.id}`)}>Edit</Button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredRisks.length === 0 && (
                                        <div className='text-xl text-gray-600 col-span-3 mx-auto'>
                                            No chemical risks found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default ChemicalRegister;
