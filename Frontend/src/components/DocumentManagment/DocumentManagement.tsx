import { useState, useMemo, useEffect } from 'react';
import {
    Card,
    Text,
    Group,
    Button,
    Select,
    Grid,
    ActionIcon,
    Tooltip,
    Breadcrumbs,
    ThemeIcon,
    Input,
} from '@mantine/core';
import { IconSearch, IconPlus, IconEye, IconFileText, IconFile } from '@tabler/icons-react';
import { documentCategories, accessLevels, documentStatusesMap, accessLevelsMap, documentStatuses } from '../../Data/dummyData/documentData';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { FilterMatchMode } from 'primereact/api';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { getAllDocuments, getApprovedDocuments } from '../../services/DocumentService';
import { getEmployeeDropdown } from '../../services/EmployeeService';
import { getAllDepartments } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import { formatDateShort } from '../../utility/DateFormats';
import { type DocumentSummary } from '../../types/documents';

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
}
const DocumentManagement = () => {
    const [searchTerm, _setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedFileType, _setSelectedFileType] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedAccessLevel, setSelectedAccessLevel] = useState<string | null>(null);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [_globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [documents, setDocuments] = useState<DocumentSummary[]>([]);
    const [approvedDocuments, setApprovedDocuments] = useState<DocumentSummary[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [departments, setDepartments] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        getAllDocuments().then((res) => {
            setDocuments(Array.isArray(res) ? (res as DocumentSummary[]) : []);
        }).catch((_err) => {

        });

        getApprovedDocuments().then((res) => {
            setApprovedDocuments(res);
        }).catch((_err) => {

        });

        getEmployeeDropdown().then((res) => {
            setEmpMap(mapIdToName(res));
            setEmployees(res);
        }).catch((_err) => {
        });

        getAllDepartments().then((res) => {
            setDepartmentMap(mapIdToName(res));
            setDepartments(res);
        }).catch((_err) => {
        });
    }, []);
    const filteredDocuments = useMemo(() => {
        let filtered = documents;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.documentName?.toLowerCase().includes(term) ||
                doc.description?.toLowerCase().includes(term) ||
                doc.tags?.some((tag: any) => tag?.toLowerCase()?.includes(term)) ||
                doc.owner?.toLowerCase()?.includes(term)
            );
        } if (selectedCategory) {
            filtered = filtered.filter(doc => doc.category === selectedCategory);
        } if (selectedFileType) {
            filtered = filtered.filter(doc => doc.fileType === selectedFileType);
        } if (selectedDepartment) {
            filtered = filtered.filter(doc => doc.departmentId == selectedDepartment);
        } if (selectedOwner) {
            filtered = filtered.filter(doc => doc.ownerId == selectedOwner);
        } if (selectedStatus) {
            filtered = filtered.filter(doc => doc.status === selectedStatus);
        } if (selectedAccessLevel) {
            filtered = filtered.filter(doc => doc.accessLevel === selectedAccessLevel);
        } return filtered;
    }, [searchTerm, selectedCategory, selectedFileType, selectedDepartment, selectedOwner, selectedStatus, selectedAccessLevel, documents]);

    const communicationsData = useMemo(() => ([
        {
            label: "Total Documents",
            value: documents.length,
            icon: IconFileText,
            iconColor: "blue",
            valueColor: "blue",
        },
        {
            label: "Approved",
            value: approvedDocuments.length,
            icon: IconFile,
            iconColor: "green",
            valueColor: "green",
        },
        {
            label: "Under Review",
            value: documents.filter(doc => doc.status === "UNDER_REVIEW")?.length,
            icon: IconFile,
            iconColor: "red",
            valueColor: "red",
        },
        {
            label: "Drafts",
            value: documents.filter(doc => doc.status === "DRAFT")?.length,
            icon: IconFile,
            iconColor: "teal",
            valueColor: "teal",
        },
    ]), [documents, approvedDocuments]);
    // const getFileTypeIcon = (fileType: string) => {
    //     switch (fileType) {
    //         case 'PDF': return <IconFileTypePdf size={16} color="#FF6B6B" />;
    //         case 'Word': return <IconFileTypeDoc size={16} color="#339AF0" />;
    //         case 'Excel': return <IconFileTypeXls size={16} color="#51CF66" />;
    //         case 'PowerPoint': return <IconPresentation size={16} color="#FF922B" />;
    //         case 'Image': return <IconPhoto size={16} color="#9775FA" />;
    //         default: return <IconFile size={16} color="#868E96" />;
    //     }
    // };
    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };


    const leftToolbarTemplate = () => {
        return (
            <div className="flex gap-2">
                <Select
                    placeholder="Category"
                    data={documentCategories}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    clearable
                />
                {/* <Select
                    placeholder="File Type"
                    data={fileTypes.map(ft => ({ value: ft.value, label: ft.label }))}
                    value={selectedFileType}
                    onChange={setSelectedFileType}
                    clearable
                /> */}
                <Select
                    placeholder="Department"
                    data={departments.map((x) => ({ value: "" + x.id, label: x.name }))}
                    value={selectedDepartment}
                    onChange={setSelectedDepartment}
                    clearable
                />
                <Select
                    placeholder="Owner"
                    data={employees.map((x) => ({ value: "" + x.id, label: x.name }))}
                    value={selectedOwner}
                    onChange={setSelectedOwner}
                    clearable
                />
                <Select
                    placeholder="Status"
                    data={documentStatuses}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    clearable
                />
                <Select
                    placeholder="Access Level"
                    data={accessLevels}
                    value={selectedAccessLevel}
                    onChange={setSelectedAccessLevel}
                    clearable
                />
                <Input size='md' leftSection={<IconSearch size={16} />} placeholder="Search Document..." type="search"
                    onChange={(e) => onGlobalFilterChange(e)} />
            </div>
        );
    };


    const getStatusSeverity = (status: string) => {
        switch (status) {
            case 'Approved':
                return 'success';
            case 'Pending':
                return 'warning';
            case 'Rejected':
                return 'danger';
            default:
                return 'info';
        }
    };
    const categoryBodyTemplate = (rowData: any) => (
        <Tag value={rowData.category} severity="info" className="text-xs px-2 py-1 rounded-full" />
    );

    const statusBodyTemplate = (rowData: any) => (
        <Tag
            value={documentStatusesMap[rowData.status]}
            severity={getStatusSeverity(rowData.status)}
            className="text-xs px-2 py-1 rounded-full"
        />
    );

    const actionBodyTemplate = (rowData: any) => {
        if (!rowData?.id) return null;
        return (
            <div className="flex gap-3">
                <Tooltip label="View Details ">
                    <ActionIcon
                        onClick={() => navigate(`document-details/${rowData.id}`)}
                        color="yellow"
                        size="sm"
                    >
                        <IconEye className="!w-4/5 !h-4/5" stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };
    const titleTemplate = (rowData: any) => (

        <Link
            to={`document-details/${rowData.id}`}
            className="text-sm text-blue-700 hover:underline cursor-pointer transition"
        >
            {rowData.documentName}
        </Link>
    );

    return (
        <div className='flex flex-col gap-3 p-5'>
            <div className='flex justify-between items-center'>

                <div>
                    <div className="text-2xl text-blue-500 w-fit">Document Management</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>

                        <Text variant="gradient">Document Management</Text>
                    </Breadcrumbs>
                </div>
                <Button size="sm" leftSection={<IconPlus size={16} />}
                    variant="gradient" onClick={() => navigate('create-document')}>New Document</Button>
            </div>
            <p className=' italic text-gray-600'>Centralized repository of all platform documents</p>
            <div className='flex flex-col gap-8'>

                <Grid>
                    {communicationsData.map((item, index) => (
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }} key={index}>
                            <Card shadow="xs" radius="md" p="sm" withBorder>
                                <Group justify="space-between">
                                    <p className='textbase text-gray-600'>
                                        {item.label}
                                    </p>
                                    <ThemeIcon
                                        variant="light"
                                        color={item.iconColor}
                                        size="lg"
                                        radius="xl"
                                    >
                                        <item.icon size={18} />
                                    </ThemeIcon>
                                </Group>
                                <Text size="xl" c={item.valueColor}>
                                    {item.value}
                                </Text>
                            </Card>
                        </Grid.Col>
                    ))}
                </Grid>
                <Card shadow="sm" padding="md" radius="md" withBorder>
                    {/* <Toolbar className="mb-1 !p-2" right={rightToolbarTemplate} left={headerToolbarTemplate}></Toolbar> */}
                    <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} ></Toolbar>

                    <DataTable value={filteredDocuments} paginator rows={10} stripedRows selectionMode="single" size='small' removableSort responsiveLayout="scroll"
                        className='[&_.p-datatable-tbody]:!text-sm'
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        rowsPerPageOptions={[10, 25, 50]} dataKey="name" filters={filters} globalFilterFields={['name', 'shortName', 'sector', 'company']}
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries" onFilter={(e) => setFilters(e.filters)}>

                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="documentName" header="Document" body={titleTemplate} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="category" header="Category" body={categoryBodyTemplate} />
                        {/* <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="fileType" header="Type" /> */}
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="owner" header="Owner" body={(row) => empMap[row.ownerId]?.name} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="department" header="Department" body={(row) => departmentMap[row.departmentId]?.name} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="accessLevel" header="Access Level" body={(row) => accessLevelsMap[row.accessLevel]} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={statusBodyTemplate} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="reviewDate" header="Review Date" body={(row) => formatDateShort(row.reviewDate)} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="expiryDate" header="Expiry Date" body={(row) => formatDateShort(row.expiryDate)} />
                        {/* <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="lastModified" header="Modified" /> */}
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
                    </DataTable>
                </Card>
            </div>
        </div>
    );
};

export default DocumentManagement;
