import { ActionIcon, Badge, Button, Input, SegmentedControl, Text, Textarea, Tooltip } from "@mantine/core";
import {
    IconAlertTriangle,
    IconCheck,
    IconCircleCheck,
    IconClock,
    IconEye,
    IconFileText,
    IconSearch,
    IconX,
} from "@tabler/icons-react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { useEffect, useMemo, useRef, useState } from "react";
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { getAllComplianceDocuments, approveComplianceDocument, rejectComplianceDocument } from "../../../services/ComplianceDocumentService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { formatDateShort } from "../../../utility/DateFormats";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { getMedia } from "../../../services/MediaService";
import { openPDF } from "../../../utility/DocumentUtility";
import { modals } from '@mantine/modals';

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
};


const ValidationData = () => {
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [_globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const [data, setData] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');
    const dispatch = useDispatch();

    const cardData = useMemo(() => {
        const total = data.length;
        const pending = data.filter(d => d.status === 'PENDING').length;
        const valid = data.filter(d => d.status === 'VALID').length;
        const expired = data.filter(d => d.status === 'EXPIRED').length;
        const rejected = data.filter(d => d.status === 'REJECTED').length;

        return [
            {
                icon: IconFileText,
                label: "Total Documents",
                value: total,
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
                valueColor: "text-gray-900",
            },
            {
                icon: IconClock,
                label: "Pending Review",
                value: pending,
                iconBg: "bg-yellow-100",
                iconColor: "text-yellow-600",
                valueColor: "text-yellow-600",
            },
            {
                icon: IconCircleCheck,
                label: "Validated",
                value: valid,
                iconBg: "bg-green-100",
                iconColor: "text-green-600",
                valueColor: "text-green-600",
            },
            {
                icon: IconAlertTriangle,
                label: "Expired",
                value: expired,
                iconBg: "bg-orange-100",
                iconColor: "text-orange-600",
                valueColor: "text-orange-600",
            },
            {
                icon: IconX,
                label: "Rejected",
                value: rejected,
                iconBg: "bg-red-100",
                iconColor: "text-red-600",
                valueColor: "text-red-600",
            }
        ];
    }, [data]);

    const statusCounts = useMemo(() => {
        return data.reduce(
            (acc, doc) => {
                const status = (doc.status ?? '').toString().toUpperCase();
                if (status === 'PENDING') acc.PENDING += 1;
                else if (status === 'VALID') acc.VALID += 1;
                else if (status === 'REJECTED') acc.REJECTED += 1;
                else if (status === 'EXPIRED') acc.EXPIRED += 1;
                return acc;
            },
            { PENDING: 0, VALID: 0, REJECTED: 0, EXPIRED: 0 }
        );
    }, [data]);

    const segmentedOptions = useMemo(
        () => [
            { label: `Pending (${statusCounts.PENDING})`, value: 'PENDING' },
            { label: `Valid (${statusCounts.VALID})`, value: 'VALID' },
            { label: `Rejected (${statusCounts.REJECTED})`, value: 'REJECTED' },
            { label: `Expired (${statusCounts.EXPIRED})`, value: 'EXPIRED' },
        ],
        [statusCounts]
    );

    const filteredData = useMemo(() => {
        if (!statusFilter) {
            return data;
        }
        return data.filter(doc => (doc.status ?? '').toString().toUpperCase() === statusFilter);
    }, [data, statusFilter]);

    useEffect(() => {
        getAllComplianceDocuments()
            .then((res) => {
                const now = new Date();
                const formatted = res.map((item: any) => {
                    const rawStatus = (item.status ?? '').toString().toUpperCase();
                    const normalizedStatus = rawStatus === 'INVALID' ? 'REJECTED' : rawStatus;

                    const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                    const hasValidExpiry = expiryDate instanceof Date && !Number.isNaN(expiryDate.getTime());
                    const isExpired = normalizedStatus === 'VALID'
                        && hasValidExpiry
                        && expiryDate !== null
                        && expiryDate.getTime() < now.getTime();

                    return {
                        ...item,
                        status: isExpired ? 'EXPIRED' : normalizedStatus,
                    };
                });
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch categories");
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

    const openDoc = (docId: any) => {
        dispatch(showOverlay());
        getMedia(docId)
            .then((res) => {
                openPDF(res.file);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Failed to open document');
            }).finally(() => {
                dispatch(hideOverlay());
            });
    };

    const handleApprove = (rowData: any) => {
        modals.openConfirmModal({
            title: 'Approve Document',
            centered: true,
            children: <Text size="lg" className="!text-gray-500">Are you sure you want to approve this document?</Text>,
            labels: { confirm: 'Approve', cancel: 'Cancel' },
            confirmProps: { color: 'green' },
            onConfirm: () => {
                dispatch(showOverlay());
                approveComplianceDocument(rowData.id)
                    .then(() => {
                        successNotification('Document Approved Successfully');
                        setData(prev => prev.map(doc => {
                            if (doc.docId !== rowData.docId) {
                                return doc;
                            }
                            const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null;
                            const hasValidExpiry = expiryDate instanceof Date && !Number.isNaN(expiryDate.getTime());
                            const isExpired = hasValidExpiry && expiryDate !== null && expiryDate.getTime() < Date.now();
                            return { ...doc, status: isExpired ? 'EXPIRED' : 'VALID' };
                        }));
                    })
                    .catch(err => errorNotification(err.response?.data?.errorMessage || 'Approval failed'))
                    .finally(() => dispatch(hideOverlay()));
            },
        });
    };

    const handleReject = (rowData: any) => {
        const RejectModal = () => {
            const [value, setValue] = useState('');
            const [error, setError] = useState<string | null>(null);

            const handleSubmit = () => {
                if (!value.trim()) {
                    setError("Reason is required");
                    return;
                }
                dispatch(showOverlay());

                rejectComplianceDocument(rowData.id, value)
                    .then(() => {
                        successNotification('Document Rejected Successfully');
                        setData(prev => prev.map(doc => doc.docId === rowData.docId ? { ...doc, status: 'REJECTED' } : doc));
                        modals.closeAll();
                    })
                    .catch(err => {
                        errorNotification(err.response?.data?.errorMessage || 'Rejection failed');
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            };

            return (
                <div className="flex flex-col gap-4">
                    <Textarea
                        placeholder="Comment Reason"
                        label="Rejection Reason"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setError(null);
                        }}
                        error={error}
                        required
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="default" onClick={() => modals.closeAll()}>Cancel</Button>
                        <Button color="red" onClick={handleSubmit}>Reject</Button>
                    </div>
                </div>
            );
        };

        modals.open({
            title: 'Reject Document',
            centered: true,
            children: <RejectModal />,
        });
    };

    const actionBodyTemplate = (rowData: any) => {
        const isFinalized = ['VALID', 'REJECTED', 'INVALID', 'EXPIRED'].includes(rowData.status);

        return (
            <div className='flex gap-3'>
                <Tooltip label="View Document">
                    <ActionIcon
                        variant="filled"
                        size="sm"
                        color="primary"
                        onClick={() => openDoc(rowData.docId)}
                    >
                        <IconEye style={{ width: '90%', height: '90%' }} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>

                {!isFinalized && (
                    <>
                        <Tooltip label="Approve">
                            <ActionIcon
                                variant="filled"
                                size="sm"
                                color="green"
                                onClick={() => handleApprove(rowData)}
                            >
                                <IconCheck style={{ width: '90%', height: '90%' }} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Reject">
                            <ActionIcon
                                variant="filled"
                                size="sm"
                                color="red"
                                onClick={() => handleReject(rowData)}
                            >
                                <IconX style={{ width: '90%', height: '90%' }} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    </>
                )}
            </div>
        );
    };


    const statusBodyTemplate = (rowData: any) => {
        const status = rowData.status;
        const badgeColor = (() => {
            switch (status) {
                case 'VALID':
                    return 'green';
                case 'EXPIRED':
                    return 'orange';
                case 'REJECTED':
                    return 'red';
                case 'PENDING':
                    return 'blue';
                default:
                    return 'gray';
            }
        })();
        return (
            <Badge color={badgeColor} variant="light">
                {status}
            </Badge>
        );
    };

    return (
        <div className="flex flex-col gap-4 mt-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
                {cardData.map((card, index) => {
                    const IconComponent = card.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-3"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`${card.iconBg} ${card.iconColor} rounded-lg p-3`}>
                                    <IconComponent className="w-6 h-6" stroke={1.5} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">{card.label}</p>
                                    <p className={`text-2xl ${card.valueColor}`}>{card.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-8 border border-gray-300 rounded-lg shadow-xl bg-white">
                <div className="card">
                    <Toast ref={toast} />
                    <DataTable selectionMode="single"
                        className='[&_.p-datatable-tbody]:!text-sm'
                        size='small'
                        stripedRows
                        removableSort
                        paginator
                        rows={10}
                        value={filteredData}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        rowsPerPageOptions={[10, 25, 50]}
                        dataKey="name"
                        filters={filters}
                        globalFilterFields={['requirement', 'uploadedBy', 'status']}
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        onFilter={(e) => setFilters(e.filters)}
                        header={
                            <div className='flex flex-col gap-3 p-2 lg:flex-row lg:items-center lg:justify-between'>
                                <SegmentedControl
                                    value={statusFilter}
                                    data={segmentedOptions}
                                    onChange={setStatusFilter}
                                    color="primary"
                                    radius="md"
                                    size="sm"
                                />
                                <Input
                                    className="w-full lg:w-64"
                                    leftSection={<IconSearch size={16} />}
                                    placeholder="Document Search..."
                                    type="search"
                                    onChange={onGlobalFilterChange}
                                />
                            </div>
                        }
                    >
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Requirement' field='requirement' />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Uploaded By' field='uploadedBy' />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Upload Date' field='uploadDate' body={(rowData) => formatDateShort(rowData.uploadDate)} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Expiry Date' field='expiryDate' body={(rowData) => formatDateShort(rowData.expiryDate)} />
                        <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Status' field='status' body={statusBodyTemplate} />
                        <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default ValidationData;
