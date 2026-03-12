import { ActionIcon, Button, SegmentedControl, Tooltip } from "@mantine/core";
import { IconCheck, IconEdit, IconLayoutGrid, IconLayoutList, IconPlus, IconX } from "@tabler/icons-react";
import { FilterMatchMode } from "primereact/api";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { Toolbar } from "primereact/toolbar";
import { Column } from "primereact/column";
import AnnualAuditCard from "./AnnualAuditCard";
import { Link, useNavigate } from "react-router-dom";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { useDispatch } from "react-redux";
import { modals } from "@mantine/modals";
import { approvePlanning, getLeadAuditorsForPlanning, getPlanningAudits, rejectPlanning } from "../../../services/AuditService";
import { capitalizeFirstLetter, mapIdToName } from "../../../utility/OtherUtilities";
import { GetAllAuditArea } from "../../../services/AuditAreaService";


const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};


const AnnualDataFile = () => {

    const navigate = useNavigate();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const toast = useRef<Toast>(null);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [selectedMethod, setSelectedMethod] = useState('All');
    const dispatch = useDispatch();
    const [audits, setAudits] = useState<any[]>([]);
    const uniqueCategories = Array.from(new Set(audits.map(i => i.category)));
    const categoryOptions = ['All', ...uniqueCategories];
    const [auditAreaMap, setAuditAreaMap] = useState<any>({});
    const [leadAuditors, setLeadAuditors] = useState<Record<string, any>>({});

    useEffect(() => {
        dispatch(showOverlay());
        getPlanningAudits().then((res) => {
            setAudits(res);

        }).catch(() => { }).finally(() => {
            dispatch(hideOverlay());
        })
        GetAllAuditArea({}).then((res) => {
            setAuditAreaMap(mapIdToName(res));
        }).catch((_err) => { })
        getLeadAuditorsForPlanning().then((res) => {
            setLeadAuditors(res.reduce((acc: any, auditor: any) => {
                acc[auditor.auditId] = auditor;
                return acc;
            }, {}));
        }).catch(() => { }).finally(() => { });
    }, [])



    const rightToolbarTemplate = () => {
        return (
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
                <div>
                    <Button leftSection={<IconPlus />} onClick={() => navigate('new-auditplan')}>New Audit Plan</Button>
                </div>


            </div>
        );
    };
    const handleStatusChange = (rowData: any, status: any) => {
        const action = capitalizeFirstLetter(status);

        modals.openConfirmModal({
            title: <span className='font-semibold text-2xl'>Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to <strong>{action}</strong> the plan: <strong>{rowData.title}</strong>?
                </span>
            ),
            labels: { confirm: `Yes, ${action}`, cancel: 'Cancel' },
            cancelProps: { color: 'red', variant: "filled" },
            confirmProps: { color: action === 'activate' ? 'green' : 'green', variant: "filled" },

            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay())
                const apiCall = status === "APPROVED" ? approvePlanning : rejectPlanning;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Plan ${action} successfully`);
                        const updatedData = audits.map(item =>
                            item.id === rowData.id
                                ? { ...item, planningStatus: status }
                                : item
                        );
                        setAudits(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Failed to ${action} audit`);
                    }
                    ).finally(() => {
                        dispatch(hideOverlay())
                    })
            },
        });
    };

    const leftToolbarTemplate = () => {
        return (
            <div className='flex flex-col gap-5'>
                <SegmentedControl
                    value={selectedMethod}
                    onChange={setSelectedMethod}
                    data={categoryOptions.map(category => ({
                        label: `${capitalizeFirstLetter(category)} (${audits.filter(i => category === 'All' || i.category === category).length})`,
                        value: category,
                    }))}
                    color="blue"
                />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: any) => {
        const status = String(rowData?.planningStatus || '').toUpperCase();
        const isPending = status === 'PENDING';
        const isApproved = status === 'APPROVED';

        return (
            <div className="flex gap-3 justify-center">
                {isPending && (
                    <Tooltip label="Edit">
                        <ActionIcon
                            onClick={() => navigate(`edit-auditplan/${rowData.id}`)}
                            variant="filled"
                            size="sm"
                            color="primary"
                        >
                            <IconEdit stroke={1.5} style={{ width: '90%', height: '90%' }} />
                        </ActionIcon>
                    </Tooltip>
                )}
                {isApproved && (
                    <Tooltip label="Approved — editing disabled">
                        <ActionIcon variant="filled" size="sm" color="gray" disabled>
                            <IconEdit stroke={1.5} style={{ width: '90%', height: '90%' }} />
                        </ActionIcon>
                    </Tooltip>
                )}
                {/* Hide edit button for rejected */}
                {isPending && (
                    <>
                        <Tooltip label="Approve">
                            <ActionIcon
                                color={"green"}
                                onClick={() => handleStatusChange(rowData, "APPROVED")}
                                size="sm"
                            >
                                <IconCheck className="!w-4/5 !h-4/5" stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Reject">
                            <ActionIcon
                                color="red"
                                onClick={() => handleStatusChange(rowData, "REJECTED")}
                                size="sm"
                            >
                                <IconX className="!w-4/5 !h-4/5" stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    </>
                )}
            </div>
        );
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-700';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'Internal':
                return 'bg-blue-100 text-blue-700';
            case 'External':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const nameBodyTemplate = (rowData: any) => {
        return <Link to={`details/${rowData.id}`} className='hover:underline text-blue-500'>
            {rowData.title}
        </Link>
    };
    const filteredData = audits?.filter((item) => {
        const matchesCategory = selectedMethod === 'All' || item.category === selectedMethod;

        return matchesCategory;
    });
    // Handler functions for card actions
    const handleEdit = (audit: any) => {
        navigate(`edit-auditplan/${audit.id}`);
    };
    const handleView = (audit: any) => {
        navigate(`details/${audit.id}`);
    };
    const handleApprove = (audit: any) => {
        handleStatusChange(audit, "APPROVED");
    };
    const handleReject = (audit: any) => {
        handleStatusChange(audit, "REJECTED");
    };

    const leadAuditorBodyTemplate = (rowData: any) => {
        const leadAuditor = leadAuditors[rowData.id];
        return (
            <span >
                {leadAuditor ? leadAuditor.name : '-'}
            </span>
        );
    }

    return (
        <div>
            <div className="card">
                <Toast ref={toast} />
                <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate} />
                {
                    viewType === 'table' ? (
                        <DataTable selectionMode="single"
                            className='[&_.p-datatable-tbody]:!text-sm mt-2'
                            size="small"
                            stripedRows
                            removableSort
                            paginator
                            value={audits}
                            rows={10}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            rowsPerPageOptions={[10, 25, 50]}
                            dataKey="name"
                            filters={filters}
                            globalFilterFields={[
                                'name',
                                'shortName',
                                'sector',
                                'company',
                            ]}
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                            onFilter={(e) => setFilters(e.filters)}
                        >
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="refNumber" header="Reference" />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="title" body={nameBodyTemplate} header="Audit Title" sortable />
                            <Column
                                style={{ fontWeight: 'normal', fontSize: "14px" }}
                                field="scopeId"
                                header="Audit Area"
                                body={(rowData) => {
                                    const key = String(rowData.scopeId ?? '');
                                    return auditAreaMap[key]?.name || rowData.auditArea || rowData.scope || rowData.scopeName || '-';
                                }}
                            />
                            <Column align="center" style={{ fontWeight: 'normal', fontSize: "14px" }} field="leadAuditor" header="Lead Auditor" body={leadAuditorBodyTemplate} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="category" header="Category" body={(rowData) => (
                                <span className={`px-3 py-1  rounded-full !capitalize text-sm font-medium ${getCategoryStyles(capitalizeFirstLetter(rowData.category))}`}>
                                    {capitalizeFirstLetter(rowData.category)}
                                </span>
                            )} />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="startDate" header="Start Date" />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="endDate" header="End Date" />
                            <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Status" body={(rowData) => (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(rowData.planningStatus)}`}>
                                    {capitalizeFirstLetter(rowData.planningStatus)}
                                </span>
                            )} />

                            <Column bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate}
                            />
                        </DataTable>

                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-5">
                            {filteredData.map((audit: any) => (
                                <AnnualAuditCard
                                    key={audit.id}
                                    audit={audit}
                                    onEdit={handleEdit}
                                    onView={handleView}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    auditAreaMap={auditAreaMap}
                                    leadAuditor={leadAuditors[audit.id]}
                                />
                            ))}
                            {filteredData.length === 0 && (
                                <div className="text-xl text-gray-600 col-span-3 mx-auto">
                                    No audits available
                                </div>
                            )}
                        </div>

                    )}
            </div>


        </div>
    )
}

export default AnnualDataFile
