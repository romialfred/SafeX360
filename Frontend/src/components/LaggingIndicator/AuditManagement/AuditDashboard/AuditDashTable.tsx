import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { useEffect, useState } from "react";
import { getInProgressRecommendations, getPendingRecommendations } from "../../../../services/AuditService";
import { actionStatusesMap } from "../../../../Data/DropdownData";
import { formatDateShort } from "../../../../utility/DateFormats";

// Priority color map
const getPriorityTag = (priority: string) => {
    const map = {
        High: { color: "#fff", bg: "#e03131" },
        Average: { color: "#fff", bg: "#f59f00" },
        Weak: { color: "#fff", bg: "#fab005" },
    };

    const style = map[priority as keyof typeof map] || {
        color: "#000",
        bg: "#dee2e6",
    };

    return (
        <Tag
            value={priority}
            style={{
                backgroundColor: style.bg,
                color: style.color,
                fontWeight: "bold",
                borderRadius: "10px",
            }}
        />
    );
};

// Status color map
const getStatusTag = (status: string) => {
    const map = {
        IN_PROGRESS: { color: "#fff", bg: "#228be6" },
        PENDING: { color: "#fff", bg: "#ffd666" },
        COMPLETED: { color: "#fff", bg: "#40c057" },
    };

    const style = map[status as keyof typeof map] || map[status?.toUpperCase() as keyof typeof map] || {
        color: "#000",
        bg: "#dee2e6",
    };

    return (
        <Tag
            value={actionStatusesMap[status]}
            style={{
                backgroundColor: style.bg,
                color: style.color,
                fontWeight: "bold",
                borderRadius: "10px",
            }}
        />
    );
};
const AuditDashTable = () => {
    const [_pending, setPending] = useState<any[]>([]);
    const [active, setActive] = useState<any[]>([]);

    useEffect(() => {
        getPendingRecommendations().then(setPending).catch(() => setPending([]));
        getInProgressRecommendations().then(setActive).catch(() => setActive([]));
    }, []);

    return (
        <div className="card">
            <div className="flex items-start mb-3">
                <h1 className="text-lg text-gray-600">Active Recommendations</h1>
            </div>
            <DataTable
                value={active}
                paginator
                rows={10}
                size="small"
                stripedRows
                removableSort
                rowsPerPageOptions={[10, 25, 50]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                className='[&_.p-datatable-tbody]:!text-sm'
            >
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="title" header="Recommendation" sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="auditTitle" header="Audit" />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="priority" header="Priority" body={(rowData) => getPriorityTag(rowData.priority)} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="actionManagerId" header="Owner" />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="deadline" header="Due Date" body={(rowData) => formatDateShort(rowData.deadline)} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={(rowData) => getStatusTag(rowData.status)} />
            </DataTable>
        </div>
    )
}

export default AuditDashTable
