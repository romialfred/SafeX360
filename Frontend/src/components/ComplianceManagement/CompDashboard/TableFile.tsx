import { IconCircleCheck, IconUser } from "@tabler/icons-react";
import { Column } from "primereact/column";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { CompliantEmployee } from "../../../services/ComplianceDashboardService";
import { formatDateFr } from "../complianceLabels";

interface TableFileProps {
    employees: CompliantEmployee[];
    total: number;
    page: number;
    pageSize: number;
    onPageChange?: (page: number, pageSize: number) => void;
    loading?: boolean;
}

/**
 * Registre des employés conformes (LOT 49) — carte sobre, libellés FR,
 * colonnes typographiées selon la charte (13px, slate).
 */
const TableFile = ({ employees, total, page, pageSize, onPageChange, loading = false }: TableFileProps) => {
    const nameBodyTemplate = (rowData: CompliantEmployee) => (
        <div className="flex items-center gap-2.5">
            <span className="inline-flex p-1.5 rounded-md bg-emerald-50 text-emerald-600 flex-shrink-0">
                <IconUser size={14} stroke={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <p className="text-[13px] text-slate-800 leading-tight">{rowData.name}</p>
                <p className="text-[11.5px] text-slate-500">{rowData.jobTitle || '—'}</p>
            </div>
        </div>
    );

    const departmentBodyTemplate = (rowData: CompliantEmployee) => (
        <span className="text-[12.5px] text-slate-600">{rowData.department || '—'}</span>
    );

    const requirementBodyTemplate = (rowData: CompliantEmployee) => (
        <span className="text-[12.5px] text-slate-700">{rowData.requirement || '—'}</span>
    );

    const lastReviewBodyTemplate = (rowData: CompliantEmployee) => (
        <span className="text-[12.5px] text-slate-600">
            {formatDateFr(rowData.lastReview?.completedOn)}
        </span>
    );

    const nextReviewBodyTemplate = (rowData: CompliantEmployee) => {
        const dueOn = rowData.nextReview?.dueOn;
        const days = rowData.nextReview?.daysUntilDue;
        if (!dueOn) return <span className="text-[12.5px] text-slate-400">Non planifiée</span>;
        return (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11.5px] text-emerald-700">
                {formatDateFr(dueOn)}
                {typeof days === 'number' && <span className="text-emerald-500">· J-{days}</span>}
            </span>
        );
    };

    const handlePage = (event: DataTablePageEvent) => {
        if (!onPageChange) return;
        const nextPage = (event.page ?? 0) + 1;
        const nextRows = event.rows ?? pageSize;
        onPageChange(nextPage, nextRows);
    };

    const totalRecords = typeof total === "number" && total > 0 ? total : employees.length;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2.5 mb-3">
                <span className="inline-flex p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                    <IconCircleCheck size={16} stroke={1.8} aria-hidden="true" />
                </span>
                <div>
                    <h3
                        className="text-slate-800"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: '14.5px',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Employés conformes
                    </h3>
                    <p className="text-[11.5px] text-slate-500">
                        Salariés dont les justificatifs réglementaires sont valides à date · {totalRecords} enregistrement{totalRecords > 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <DataTable
                value={employees}
                paginator={Boolean(onPageChange)}
                rows={pageSize}
                totalRecords={totalRecords}
                first={(page - 1) * pageSize}
                size="small"
                stripedRows
                className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
                tableClassName="min-w-full"
                loading={loading}
                lazy={Boolean(onPageChange)}
                onPage={handlePage}
                currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                emptyMessage={
                    <div className="py-8 text-center text-[13px] text-slate-500">
                        Aucun employé conforme à afficher pour le moment.
                    </div>
                }
            >
                <Column header="Employé" body={nameBodyTemplate} />
                <Column header="Département" body={departmentBodyTemplate} />
                <Column header="Exigence" body={requirementBodyTemplate} />
                <Column header="Dernière validation" body={lastReviewBodyTemplate} />
                <Column header="Prochaine échéance" body={nextReviewBodyTemplate} />
            </DataTable>
        </div>
    );
};

export default TableFile;
