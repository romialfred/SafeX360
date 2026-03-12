import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Badge, SegmentedControl, TextInput, Tooltip } from '@mantine/core';
import { IconEye, IconSearch } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Column } from 'primereact/column';
import { getAllComplianceDocuments } from '../../../services/ComplianceDocumentService';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { formatDateShort } from '../../../utility/DateFormats';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
}


const CompDocData = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [_globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [tab, setTab] = useState<string>('Pending');

    useEffect(() => {
        dispatch(showOverlay());
        getAllComplianceDocuments()
            .then((res) => {
                const formatted = res.map((item: any) => {
                    const rawStatus = (item.status ?? '').toString().toUpperCase();
                    const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                    const hasValidExpiry = expiryDate instanceof Date && !Number.isNaN(expiryDate.getTime());
                    const isExpired = rawStatus === 'VALID'
                        && hasValidExpiry
                        && expiryDate !== null
                        && expiryDate.getTime() < Date.now();

                    const computedStatus = (() => {
                        if (isExpired) return 'EXPIRED';
                        if (rawStatus === 'INVALID' || rawStatus === 'REJECTED') return rawStatus;
                        if (rawStatus === 'PENDING') return 'PENDING';
                        if (rawStatus === 'VALID') return 'VALID';
                        return rawStatus;
                    })();

                    const displayStatus = (() => {
                        switch (computedStatus) {
                            case 'VALID':
                                return 'Valid';
                            case 'PENDING':
                                return 'Pending';
                            case 'EXPIRED':
                                return 'Expired';
                            case 'INVALID':
                                return 'Invalid';
                            case 'REJECTED':
                                return 'Rejected';
                            default:
                                return computedStatus.charAt(0) + computedStatus.slice(1).toLowerCase();
                        }
                    })();

                    return {
                        ...item,
                        computedStatus,
                        displayStatus,
                    };
                });
                setDocuments(formatted);
            }).catch((_err) => {

            })
            .finally(() => {
                dispatch(hideOverlay());
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

    const statusCounts = useMemo(() => {
        return documents.reduce((acc, doc) => {
            const status = (doc.computedStatus ?? '').toString().toUpperCase();
            if (status === 'VALID') acc.valid += 1;
            else if (status === 'PENDING') acc.pending += 1;
            else if (status === 'EXPIRED') acc.expired += 1;
            else if (status === 'INVALID' || status === 'REJECTED') acc.invalid += 1;
            else acc.other += 1;
            return acc;
        }, { pending: 0, valid: 0, invalid: 0, expired: 0, other: 0 });
    }, [documents]);

    const segmentedOptions = useMemo(() => ([
        { label: `Pending (${statusCounts.pending})`, value: 'Pending' },
        { label: `Valid (${statusCounts.valid})`, value: 'Valid' },
        { label: `Invalid (${statusCounts.invalid})`, value: 'Invalid' },
        { label: `Expired (${statusCounts.expired})`, value: 'Expired' },
    ]), [statusCounts]);

    const actionBodyTemplate = (rowData: any) => {
        const id = rowData.id;
        return (
            <div className='flex gap-3 '>
                <Tooltip label="View Details">
                    <ActionIcon onClick={() => navigate(`details-documents/${id}`)} variant="filled" size="sm" color="primary" >
                        <IconEye style={{ width: '90%', height: '90%' }} stroke={1.5} /></ActionIcon>
                </Tooltip>
            </div>
        )
    }

    const statusBodyTemplate = (rowData: any) => {
        const status = (rowData.computedStatus ?? '').toString().toUpperCase();
        const badgeConfig = (() => {
            switch (status) {
                case 'VALID':
                    return { color: 'green', label: rowData.displayStatus };
                case 'PENDING':
                    return { color: 'orange', label: rowData.displayStatus };
                case 'EXPIRED':
                    return { color: 'red', label: rowData.displayStatus };
                case 'INVALID':
                case 'REJECTED':
                    return { color: 'red', label: rowData.displayStatus };
                default:
                    return { color: 'gray', label: rowData.displayStatus ?? status };
            }
        })();
        return (
            <Badge color={badgeConfig.color} variant="light">
                {badgeConfig.label}
            </Badge>
        );
    };


    const renderHeader = () => {
        return (
            <div className='flex justify-between p-2'>
                <SegmentedControl
                    value={tab}
                    variant='filled'
                    color="primary"
                    onChange={setTab}
                    data={segmentedOptions}
                />
                <TextInput fw={400}
                    leftSection={<IconSearch size={16} />}
                    placeholder="Search Document..."
                    type="search"
                    onChange={(e) => onGlobalFilterChange(e)}
                />

                {/* <div className='flex gap-2 items-center'>
                    <Button variant='outline' leftSection={<IconFilter />}>Filter</Button>
                    <Select data={["All Status", "Valid", "Invalid", "Pending Review", "Expired"]} placeholder='Select status' />
                </div> */}
            </div>


        );
    };

    const header = renderHeader();
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const status = (doc.computedStatus ?? '').toString().toUpperCase();
            if (tab === 'Pending') return status === 'PENDING';
            if (tab === 'Valid') return status === 'VALID';
            if (tab === 'Invalid') return status === 'INVALID' || status === 'REJECTED';
            if (tab === 'Expired') return status === 'EXPIRED';
            return true; // Default case, show all documents
        });
    }, [documents, tab]);
    return (
        <div className="card ">
            <Toast ref={toast} />


            <DataTable selectionMode="single" size='small' stripedRows removableSort paginator rows={10} header={header} value={filteredDocuments} globalFilter={_globalFilterValue} className='[&_.p-datatable-tbody]:!text-sm'
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]} dataKey="id" filters={filters} globalFilterFields={['docName', 'uploadedBy', 'displayStatus', 'computedStatus']}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries" onFilter={(e) => setFilters(e.filters)}
            >

                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Document Name' field='docName' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Uploaded By' field='uploadedBy' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Upload Date' field='uploadDate' sortable body={(rowData) => formatDateShort(rowData.uploadDate)} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Expiry Date' field='expiryDate' body={(rowData) => formatDateShort(rowData.expiryDate)} />
                <Column style={{ fontWeight: 'normal', fontSize: "14px" }} header='Status' field='status' body={statusBodyTemplate} />
                <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />




            </DataTable>
        </div>
    )
}

export default CompDocData
