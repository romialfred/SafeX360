import { ActionIcon, Badge, Button, Select, Text, TextInput, Tooltip } from "@mantine/core";
import { IconEye, IconLayoutGrid, IconLayoutList, IconSearch, IconFilter } from "@tabler/icons-react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { useEffect, useMemo, useRef, useState } from "react";
import { RiskData } from "../../../Data/dummyData/riskData";
import { Toolbar } from "primereact/toolbar";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import RiskCards from "./RiskCards";
import { getRisksWithRiskLevel } from "../../../services/RiskRegisterService";
import { getAllDepartments } from "../../../services/HrmsService";
import { errorNotification } from "../../../utility/NotificationUtility";
import { GetAllWorkProcess } from "../../../services/WorkProcessService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { mapIdToName } from "../../../utility/OtherUtilities";
import { riskMap } from "../../../Data/DropdownData";
import { formatDateShort } from "../../../utility/DateFormats";

interface RiskTableProps {
    getStatusColor: (status: string) => string;

    onEdit?: (risk: RiskData) => void;
}

const defaultFilters: DataTableFilterMeta = {
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
    riskLevel: { value: null, matchMode: FilterMatchMode.EQUALS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    zone: { value: null, matchMode: FilterMatchMode.EQUALS },
};

const RiskDataTable: React.FC<RiskTableProps> = ({

    getStatusColor
}) => {
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
    const [riskLevelFilter, setRiskLevelFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const toast = useRef<Toast>(null);
    const navigate = useNavigate();
    const [risks, setRisks] = useState<any[]>([]);
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [processMap, setProcessMap] = useState<Record<string, any>>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [departments, setDepartments] = useState<any[]>([]);



    useEffect(() => {
        fetchDepartments();
        fetchWorkProcesses();
        fetchEmployees();
    }, [])

    const fetchDepartments = () => {
        // Fetch departments from API or service
        getAllDepartments().then((data) => {
            setDepartmentMap(mapIdToName(data));
            setDepartments(data);
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch departments");
        });
    };
    const fetchWorkProcesses = () => {
        // Fetch work processes from API or service
        GetAllWorkProcess({}).then((data) => {
            setProcessMap(mapIdToName(data))
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch work processes");
        });
    };
    const fetchEmployees = () => {
        // Fetch employees from API or service
        getEmployeeDropdown().then((data) => {
            setEmpMap(mapIdToName(data))
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch employees");
        });
    };

    // Enrich risks with names so table rerenders when maps update
    const enrichedRisks = useMemo(() => {
        return risks.map((r: any) => ({
            ...r,
            departmentName: departmentMap[r?.departmentId]?.name ?? 'Unknown',
            processName: processMap[r?.workProcessId]?.name ?? '-',
            ownerName: empMap[r?.ownerId]?.name ?? '-',
            updatedAtFormatted: r?.updatedAt ? formatDateShort(r.updatedAt) : '-',
        }));
    }, [risks, departmentMap, processMap, empMap]);

    const getFilteredData = () => {
        return enrichedRisks.filter((risk: any) => {
            const term = globalFilterValue.toLowerCase();

            const matchesGlobal =
                term.length > 0
                    ? (
                        String(risk.id).toLowerCase() +
                        risk.title.toLowerCase() +
                        (risk.departmentName || '').toLowerCase() +
                        (risk.processName || '').toLowerCase() +
                        risk.zone?.toLowerCase() +
                        (risk.ownerName || '').toLowerCase() +
                        risk.riskLevel?.toLowerCase() +
                        risk.status?.toLowerCase() +
                        risk.riskDescription?.toLowerCase() +
                        (risk.updatedAtFormatted || '').toLowerCase()
                    ).includes(term)
                    : true;

            const matchesDepartment = departmentFilter ? risk.departmentId == departmentFilter : true;
            const matchesRiskLevel = riskLevelFilter ? riskMap[risk.riskLevel]?.level === riskLevelFilter : true;
            const matchesStatus = statusFilter ? risk.status === statusFilter : true;

            return matchesGlobal && matchesDepartment && matchesRiskLevel && matchesStatus;
        });
    };

    const filteredData = getFilteredData();

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    useEffect(() => {
        getRisksWithRiskLevel()
            .then((res) => {
                setRisks(res);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);



    const titleBody = (rowData: RiskData) => (
        <Text size="sm" lineClamp={2}>
            {rowData.title}
        </Text>
    );



    const statusBody = (rowData: RiskData) => (
        <Badge size="xs" color={getStatusColor(rowData.status)}>
            {rowData.status.toLowerCase()}
        </Badge>
    );

    const actionBody = (rowData: RiskData) => (
        <div className="flex gap-3">
            <Tooltip label="View">
                <ActionIcon
                    variant="filled"
                    size="sm"
                    color="blue"
                    onClick={() => navigate(`register-details/${rowData.id}`)}
                >
                    <IconEye size={16} />
                </ActionIcon>
            </Tooltip>
        </div>
    );

    const rightToolbarTemplate = () => {
        return (
            <div className="flex gap-5 items-center" >
                <Button
                    size="xs"
                    variant='outline'
                    leftSection={<IconFilter />}
                    onClick={() => {
                        setGlobalFilterValue("");
                        setDepartmentFilter(null);
                        setRiskLevelFilter(null);
                        setStatusFilter(null);
                    }}
                >
                    Clear Filters
                </Button>
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
                            size="sm"

                            variant={viewType === 'card' ? 'filled' : 'light'}
                            color="blue"
                            onClick={() => setViewType('card')}
                        >
                            <IconLayoutGrid size={18} />
                        </ActionIcon>
                    </Tooltip>
                </div>

                <TextInput
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    size='sm'
                    placeholder='Search'
                    leftSection={<IconSearch />}
                />
            </div>
        );
    };


    const filterToolbarTemplate = () => (
        <div className="flex w- justify-between items-center gap-2">
            <Select
                placeholder="Filter by Department"
                data={departments.map((dept) => ({ label: dept.name, value: "" + dept.id }))}
                size="sm"
                value={departmentFilter}
                onChange={setDepartmentFilter}
                clearable
            />
            <Select
                placeholder="Filter by Risk Level"
                data={[
                    "Low",
                    "Low Med",
                    "Medium",
                    "Med High",
                    "High",
                ]}
                size="sm"
                value={riskLevelFilter}
                onChange={setRiskLevelFilter}
                clearable
            />
            <Select
                placeholder="Filter by Status"
                data={["Partially Controlled", "Uncontrolled", "Under Control"]}
                value={statusFilter}
                size="sm"
                onChange={setStatusFilter}
                clearable
            />
        </div>
    );

    return (
        <div className="card">
            <Toast ref={toast} />

            <Toolbar className="mb-3 !p-2" left={filterToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

            {viewType === 'table' ? (
                <DataTable
                    className="[&_.p-datatable-tbody]:!text-sm"
                    size="small"
                    stripedRows
                    removableSort
                    paginator
                    rows={10}
                    value={filteredData}
                    rowsPerPageOptions={[10, 25, 50]}
                    dataKey="id"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} risks"
                >
                    {/* <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Risk ID" field="id" body={idBody} /> */}
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Risk" field="title" body={titleBody} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Department" field="departmentName" />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Process" field="processName" />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Owner" field="ownerName" />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Last Assessment" field="updatedAtFormatted" />
                    <Column align="center" style={{ fontWeight: 'normal', fontSize: "14px" }} header="Risk Level" field="riskLevel" body={(row) => row.riskLevel ? <Badge color={riskMap[row.riskLevel]?.color} variant="filled">{riskMap[row.riskLevel]?.level}</Badge> : "-"} />



                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Status" field="status" body={statusBody} />

                    <Column body={actionBody} style={{ width: "6rem" }} />
                </DataTable>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg">
                            Risk Catalog ({filteredData.length})
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {
                            filteredData.map((risk: any) => (
                                <RiskCards
                                    key={risk.id}
                                    risk={risk}
                                    getStatusColor={getStatusColor}
                                    department={risk?.departmentName}
                                    process={risk?.processName}
                                    owner={risk?.ownerName}
                                />
                            ))
                        }
                        {filteredData.length === 0 && (
                            <div className='text-xl text-gray-600 col-span-3 mx-auto'>
                                No risk available
                            </div>
                        )}
                    </div>
                </div>
            )
            }
        </div>
    )
}

export default RiskDataTable;
