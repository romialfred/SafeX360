import { Breadcrumbs, Button, Card, Divider, Modal, NumberInput, Progress, Select, Text, TextInput, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconCircleCheck, IconClock, IconSearch, IconTrendingUp, IconUser } from "@tabler/icons-react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Tag } from "primereact/tag";
import { useState } from "react";
import { Link } from "react-router-dom";
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { recommendationTableData } from "../../../Data/IncidentsData";
import TextEditor from "../../UtilityComp/TextEditor";
import { useForm } from "@mantine/form";

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const AuditRecommendations = () => {
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [modalOpened, setModalOpened] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any>(null);


    const form = useForm({
        initialValues: {
            title: "",
            category: "",
            types: [] as string[],
            purpose: "",
            startDate: null as Date | null,
            endDate: null as Date | null,
        },
        validate: {
            title: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Title is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
        },
    });

    const getSeverity = (rowData: any, field: 'status' | 'progress') => {
        if (field === 'status') {
            const severityMap: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
                'pending': 'warning',
                'in progress': 'info',
                'implemented': 'success',
                'overdue': 'danger',
            };
            const status = rowData.status?.toLowerCase?.() || 'pending';
            return <Tag value={rowData.status} severity={severityMap[status] || 'info'} />;
        }
        return <Tag value={rowData.progress} />;
    };

    const recommendationSummaryData = [
        { label: 'Total Recommendations', value: 3, icon: IconTrendingUp, color: '#173ac9' },
        { label: 'In Progress', value: 2, icon: IconClock, color: '#f3b121' },
        { label: 'Implemented', value: 0, icon: IconCircleCheck, color: '#4dca45' },
        { label: 'Overdue', value: 3, icon: IconAlertTriangle, color: '#f44336' },
    ];

    const actionBodyTemplate = (rowData: any) => (
        <Tooltip label="Update">
            <Button
                size="xs"
                onClick={() => {
                    setSelectedRow(rowData);
                    setModalOpened(true);
                }}
            >
                Update
            </Button>
        </Tooltip>
    );
    return (
        <div>
            <div>
                {/* LOT 40 P1: page title color */}
                <div className="text-2xl text-slate-900 w-fit">Recommendation Followup</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/"><Text variant="gradient">Home</Text></Link>

                    <Text variant="gradient">Recommendation Followup</Text>
                </Breadcrumbs>
            </div>
            <div className="italic my-3">
                Track audit recommendations and hazard-related improvements to completion
            </div>
            <div className="flex flex-col gap-10">
                {/* Filter Section */}
                <Card className="bg-white" shadow="sm" withBorder radius="md">
                    {/* LOT 40 P1: responsive grid breakpoints */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <TextInput label="Search" placeholder="Search recommendations..." leftSection={<IconSearch />} />
                        <Select label="Status" placeholder="Select Status" data={["All status", "Pending", "In Progress", "Implemented", "Closed", "Rejected"]} />
                        <Select label="Departments" placeholder="Select Departments" data={["All Departments", "Safety", "IT"]} />
                    </div>
                </Card>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4 sm:grid-cols-1 mb-4">
                    {recommendationSummaryData.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="flex justify-between p-6 shadow-lg rounded-xl border border-gray-200">
                                <div>
                                    <p className="text-gray-600 text-lg">{item.label}</p>
                                    <h2 className="text-lg text-gray-400">{item.value}</h2>
                                </div>
                                <div><Icon size={32} stroke={2} color={item.color} /></div>
                            </div>
                        );
                    })}
                </div>

                {/* Data Table */}
                <Card className="bg-white" shadow="sm" withBorder radius="md" p={10}>
                    <DataTable selectionMode="single"
                        className='[&_.p-datatable-tbody]:!text-sm'
                        size='small'
                        stripedRows
                        removableSort
                        paginator
                        value={recommendationTableData}
                        rows={10}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        rowsPerPageOptions={[10, 25, 50]}
                        dataKey="title"
                        filters={filters}
                        globalFilterFields={['title', 'objective', 'sites', 'ppe']}
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        onFilter={(e) => setFilters(e.filters)}
                    >
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="recommendation" header="Recommendation" sortable />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="audit" header="Audit" />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="department" header="Department" />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="date" header="Due Date" />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={(rowData) => getSeverity(rowData, 'status')} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="progress" header="Progress" body={(rowData) => getSeverity(rowData, 'progress')} />
                        <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
                    </DataTable>
                </Card>
            </div>
            <div>
                {/* Modal */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title="Update Recommendation"
                    size="sm"
                    centered
                    zIndex={1002} yOffset="10dvh"
                >
                    {selectedRow && (
                        <div className="flex gap-10 ">
                            <div className="flex flex-col gap-5 w-[700px]">
                                <div>
                                    <h1 className="text-lg">Enhance Risk Assessment Documentation</h1>
                                </div>
                                <div>
                                    <p className="text-lg text-gray-400">Description</p>
                                    <div className="bg-blue-50 rounded-lg shadow-sm p-4 ">
                                        <p className="text-lg">Implement a standardized digital documentation system for risk assessments to improve traceability and accessibility of records.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Select label="Status" placeholder="Select Status" data={["Pending", "In-Progress", "Implemented", "Closed", "Rejected"]} />
                                    <NumberInput label="Progress" placeholder="Enter Progress" />
                                </div>

                                <TextEditor form={form} id="purpose" title="Update Comment" />

                                <Divider size="xs" />

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline">Close</Button>
                                    <Button variant="gradient">Save Changes</Button>
                                </div>
                            </div>
                            <Divider size="xs" orientation="vertical" />
                            <div>
                                <Card shadow="sm" padding="sm" radius="md" withBorder className="w-[250px]">
                                    <p className="text-lg mb-4 flex gap-1 text-amber-600"><IconClock /> Update History</p>
                                    <div className="flex flex-col gap-4">
                                        <div className=" flex flex-col gap-8">
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg flex gap-1 text-blue-600"><IconUser />3</p>
                                                <div className="bg-amber-200 rounded-4xl ">
                                                    <p className="text-sm text-amber-800 flex gap-1 p-1 items-center"><IconClock />In-Progress</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-5">
                                                <p className="text-gray-800">1/4/2024, 3:30:00 PM</p>
                                                <div className="flex justify-between">
                                                    <Text size="md" className="text-gray-600">Status: In Progress</Text>
                                                    <Progress value={4} color="yellow" />
                                                </div>

                                                <div className="bg-blue-50 shadow-sm rounded-lg p-4">
                                                    <Text size="sm" className="text-gray-700 mt-1">Comment: Started system evaluation</Text>
                                                </div>

                                            </div>

                                        </div>
                                        {/* Add more history entries here if needed */}
                                    </div>
                                </Card>
                            </div>

                        </div>
                    )}
                </Modal>
            </div>

        </div>
    )
}

export default AuditRecommendations