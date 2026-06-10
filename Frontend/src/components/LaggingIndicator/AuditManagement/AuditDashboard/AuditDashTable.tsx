import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { useEffect, useState } from "react";
import { getInProgressRecommendations, getPendingRecommendations } from "../../../../services/AuditService";
import { formatDateShort } from "../../../../utility/DateFormats";
import { recPriorityLabel, recStatusLabel } from "../auditLabels";

// Priorité — couleurs alignées sur la palette du module
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
            value={recPriorityLabel(priority)}
            style={{
                backgroundColor: style.bg,
                color: style.color,
                fontWeight: "bold",
                borderRadius: "10px",
            }}
        />
    );
};

// Statut — palette charte R7 (violet=en attente, amber=en cours, emerald=terminée)
const getStatusTag = (status: string) => {
    const map = {
        IN_PROGRESS: { color: "#fff", bg: "#D97706" },
        PENDING: { color: "#fff", bg: "#7C3AED" },
        COMPLETED: { color: "#fff", bg: "#059669" },
    };

    const style = map[status as keyof typeof map] || map[status?.toUpperCase() as keyof typeof map] || {
        color: "#000",
        bg: "#dee2e6",
    };

    return (
        <Tag
            value={recStatusLabel(status)}
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
                <h2 className="text-sm text-slate-700" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Recommandations actives</h2>
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
                currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                emptyMessage="Aucune recommandation en cours"
                dataKey="id"
                className='[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]'
            >
                <Column field="title" header="Recommandation" sortable />
                <Column field="auditTitle" header="Audit" />
                <Column field="priority" header="Priorité" body={(rowData) => getPriorityTag(rowData.priority)} />
                <Column field="actionManagerId" header="Responsable" />
                <Column field="deadline" header="Échéance" body={(rowData) => formatDateShort(rowData.deadline)} />
                <Column field="status" header="Statut" body={(rowData) => getStatusTag(rowData.status)} />
            </DataTable>
        </div>
    )
}

export default AuditDashTable
