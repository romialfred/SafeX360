import { Card, Text } from "@mantine/core";
import { IconCircleCheck, IconUser } from "@tabler/icons-react";
import { Column } from "primereact/column";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { CompliantEmployee } from "../../../services/ComplianceDashboardService";

interface TableFileProps {
    employees: CompliantEmployee[];
    total: number;
    page: number;
    pageSize: number;
    onPageChange?: (page: number, pageSize: number) => void;
    loading?: boolean;
}

const formatDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
};

const getLastReviewLabel = (employee: CompliantEmployee) => {
    const completedOn = formatDate(employee.lastReview?.completedOn);
    const validator = employee.lastReview?.validatedBy ? ` (${employee.lastReview.validatedBy})` : "";
    return completedOn ? `${completedOn}${validator}` : "—";
};

const getNextReviewLabel = (employee: CompliantEmployee) => {
    const dueOn = formatDate(employee.nextReview?.dueOn);
    const days = typeof employee.nextReview?.daysUntilDue === "number" ? employee.nextReview.daysUntilDue : null;
    if (!dueOn) return "Not scheduled";
    return days !== null ? `${dueOn} (${days} days)` : dueOn;
};

const TableFile = ({ employees, total, page, pageSize, onPageChange, loading = false }: TableFileProps) => {
    const nameBodyTemplate = (rowData: CompliantEmployee) => (
        <div className="flex items-center gap-2">
            <div className="p-3 rounded-4xl bg-green-100">
                <IconUser className="text-green-600" size={25} />
            </div>

            <div>
                <p className="font-semibold text-sm text-gray-800 leading-tight">
                    {rowData.name}
                </p>
                <p className="text-xs text-gray-500">{rowData.jobTitle}</p>
            </div>
        </div>
    );

    const departmentBodyTemplate = (rowData: CompliantEmployee) => (
        <div className="flex items-center gap-2">
            <div className="bg-blue-50 rounded-2xl p-2">
                <p className="font-medium text-sm text-blue-600 leading-tight">
                    {rowData.department}
                </p>
            </div>
        </div>
    );

    const nextReviewBodyTemplate = (rowData: CompliantEmployee) => (
        <div className="flex items-center gap-2">
            <div className="bg-green-50 rounded-2xl p-2">
                <p className="font-medium text-sm text-green-600 leading-tight">
                    {getNextReviewLabel(rowData)}
                </p>
            </div>
        </div>
    );

    const handlePage = (event: DataTablePageEvent) => {
        if (!onPageChange) return;
        const nextPage = (event.page ?? 0) + 1;
        const nextRows = event.rows ?? pageSize;
        onPageChange(nextPage, nextRows);
    };

    const totalRecords = typeof total === "number" && total > 0 ? total : employees.length;
    const startIndex = totalRecords ? page * pageSize : 0;
    const endIndex = totalRecords ? Math.min(startIndex + employees.length, totalRecords) : 0;

    return (
        <Card shadow="md" padding={0} radius="md" className="!bg-green-50 border border-gray-200">
            <div className="flex items-center gap-2 mb-5 p-2">
                <IconCircleCheck color="green" />
                <div className="flex flex-col">
                    <p className="text-xl font-semibold text-green-600 ">Compliant Employees</p>
                    <p className="font-medium text-gray-500 ">Employees with up-to-date compliance requirements</p>
                    <Text size="sm" c="dimmed">
                        Showing {endIndex} of {totalRecords} records
                    </Text>
                </div>
            </div>

            <DataTable
                value={employees}
                selectionMode="single"
                paginator={Boolean(onPageChange)}
                rows={pageSize}
                totalRecords={totalRecords}
                first={(page - 1) * pageSize}
                className="p-datatable-sm rounded border border-gray-300 [&_.p-datatable-tbody]:!text-sm"
                stripedRows
                tableClassName="min-w-full"
                loading={loading}
                lazy={Boolean(onPageChange)}
                onPage={handlePage}
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Employee" body={nameBodyTemplate} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Department" body={departmentBodyTemplate} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="requirement" header="Requirement" />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Last Review" body={(rowData: CompliantEmployee) => getLastReviewLabel(rowData)} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header="Next Review" body={nextReviewBodyTemplate} />
            </DataTable>
        </Card >
    );
};

export default TableFile;
