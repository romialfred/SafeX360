import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Badge, Button, Progress, SegmentedControl, TextInput, Tooltip } from '@mantine/core';
import { IconEdit, IconLayoutGrid, IconLayoutList, IconSearch, IconUpload } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllInvestigations } from '../../../services/InvestigationService';
import { investMethodMap } from '../../../Data/DropdownData';
import { formatDateShort } from '../../../utility/DateFormats';
import InvestigationCard from './InvestigationCard';
import EmptyState from '../../UtilityComp/EmptyState';
import { actionStatusColor, actionStatusLabel, PAGINATOR_FR } from '../IncidentManagement/incidentLabels';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const InvestigationFileData = () => {
    const navigate = useNavigate();
    const [investigations, setInvestigations] = useState<any[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [selectedMethod, setSelectedMethod] = useState('All');

    // Modal-based update removed; using dedicated update page now


    useEffect(() => {
        getAllInvestigations().then((res) => {
            setInvestigations(res);
        }).catch((err) => {
            console.error("Error fetching investigations:", err);
        });
    }, [])

    // form no longer used

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    /** Export CSV simple du registre filtré (colonnes visibles). */
    const handleExportCsv = () => {
        const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = ['Incident', 'Méthode', 'Début', 'Fin', 'Avancement', 'Statut'];
        const rows = filteredData.map((i: any) => [
            i.incidentTitle, investMethodMap[i.method] || i.method, formatDateShort(i.startDate),
            i.endDate ? formatDateShort(i.endDate) : '', `${i.progress ?? 0}%`, actionStatusLabel(i.status),
        ].map(esc).join(';'));
        const blob = new Blob(['﻿' + [header.map(esc).join(';'), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `investigations-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex gap-4 items-center">

                <div className="flex items-center gap-1 border border-primary rounded-lg p-1 bg-gray-100">
                    <Tooltip label="Vue tableau">
                        <ActionIcon
                            variant={viewType === 'table' ? 'filled' : 'light'}
                            color="blue"
                            aria-label="Vue tableau"
                            onClick={() => setViewType('table')}
                        >
                            <IconLayoutList size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Vue cartes">
                        <ActionIcon
                            variant={viewType === 'card' ? 'filled' : 'light'}
                            color="blue"
                            aria-label="Vue cartes"
                            onClick={() => setViewType('card')}
                        >
                            <IconLayoutGrid size={18} />
                        </ActionIcon>
                    </Tooltip>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" leftSection={<IconUpload />} onClick={handleExportCsv}>
                        Exporter
                    </Button>
                </div>
                <TextInput
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    size="sm"
                    placeholder="Rechercher"
                    leftSection={<IconSearch />}
                />


            </div>
        );
    };
    const nameBodyTemplate = (rowData: any) => {

        return <Link to={`/incidents/${rowData.incidentId}?tab=investigation`} className='hover:underline text-blue-500' >{rowData.incidentTitle}</Link>

    }

    const leftToolbarTemplate = () => {
        const uniqueMethods = Array.from(new Set(investigations.map(i => i.method)));
        const methodOptions = ['All', ...uniqueMethods];
        return (
            <div className='flex flex-col gap-5'>



                <SegmentedControl
                    value={selectedMethod}
                    onChange={setSelectedMethod}
                    data={methodOptions.map(method => ({
                        label: `${method === 'All' ? 'Toutes les méthodes' : (investMethodMap[method] || method)} (${investigations.filter(i => method === 'All' || i.method === method).length})`,
                        value: method,
                    }))}
                    color="blue"
                />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: any) => {
        const statusUpper = String(rowData?.status).toUpperCase();
        const progress = Number(rowData?.progress ?? 0);
        const canEdit = statusUpper === 'PENDING';
        const canUpdate = progress < 100 && !['COMPLETED', 'PENDING', 'CANCELLED'].includes(statusUpper);

        const editTooltip = canEdit
            ? 'Modifier'
            : statusUpper === 'COMPLETED' ? 'Investigation terminée — modification impossible'
            : statusUpper === 'CANCELLED' ? 'Investigation annulée — modification impossible'
            : 'Modification possible uniquement en attente d\'approbation';

        const updateTooltip = canUpdate
            ? 'Mettre à jour l\'avancement'
            : statusUpper === 'PENDING' ? 'En attente d\'approbation — mise à jour impossible'
            : statusUpper === 'CANCELLED' ? 'Investigation annulée — mise à jour impossible'
            : progress >= 100 || statusUpper === 'COMPLETED' ? 'Investigation déjà terminée'
            : 'Mise à jour non autorisée';

        return (
            <div className="flex gap-3 justify-center">
                <Tooltip label={updateTooltip}>
                    <span className="inline-flex">
                        <Button
                            size="compact-xs"
                            onClick={() => canUpdate && navigate(`/investigation/update/${rowData.id}`)}
                            disabled={!canUpdate}
                        >
                            Mettre à jour
                        </Button>
                    </span>
                </Tooltip>
                <Tooltip label={editTooltip}>
                    <span className="inline-flex">
                        <ActionIcon
                            onClick={() => canEdit && navigate(`/incidents/investigation/${rowData.incidentId}`)}
                            variant="filled"
                            size="sm"
                            color="primary"
                            aria-label={editTooltip}
                            disabled={!canEdit}
                        >
                            <IconEdit stroke={1.5} style={{ width: '90%', height: '90%' }} />
                        </ActionIcon>
                    </span>
                </Tooltip>
            </div>
        );
    };

    const methodBodyTemplate = (rowData: any) => {
        return (
            <span>

                {investMethodMap[rowData.method] || rowData.method || '—'}</span>
        );
    };

    const filteredData = investigations.filter((item) => {
        const matchesMethod = selectedMethod === 'All' || item.method === selectedMethod;
        const matchesSearch =
            globalFilterValue === '' ||
            item.incidentTitle?.toLowerCase().includes(globalFilterValue.toLowerCase());

        return matchesMethod && matchesSearch;
    });

    // No local submit; updates handled on dedicated page


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
                            value={filteredData}
                            rows={10}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            rowsPerPageOptions={[10, 25, 50]}
                            dataKey="id"
                            filters={filters}
                            globalFilterFields={['incidentTitle', 'method', 'status']}
                            currentPageReportTemplate={PAGINATOR_FR}
                            emptyMessage="Aucune investigation ne correspond aux filtres."
                            onFilter={(e) => setFilters(e.filters)}
                        >
                            <Column style={{ fontWeight: 'normal' }} field="incidentTitle" header="Incident" body={nameBodyTemplate} />
                            <Column style={{ fontWeight: 'normal' }} field="method" header="Méthode" body={methodBodyTemplate} />
                            <Column style={{ fontWeight: 'normal' }} field="startDate" header="Début" body={(rowData) => formatDateShort(rowData.startDate)} />
                            <Column style={{ fontWeight: 'normal' }} field="endDate" header="Fin" body={(rowData) => formatDateShort(rowData.endDate)} />
                            <Column
                                style={{ fontWeight: 'normal' }}
                                field="progress"
                                header="Avancement"
                                body={(rowData: any) => (
                                    <Progress.Root size={15}>
                                        <Tooltip label={`${rowData.progress}%`} withArrow>
                                            <Progress.Section
                                                value={rowData.progress}
                                                color={rowData.progress < 20 ? 'red' : rowData.progress < 70 ? 'orange' : 'green'}
                                            >
                                                <Progress.Label>{rowData.progress}</Progress.Label>
                                            </Progress.Section>
                                        </Tooltip>
                                    </Progress.Root>
                                )}
                            />
                            <Column style={{ fontWeight: 'normal' }} field="status" header="Statut" body={(rowData: any) => {
                                /* Palette charte R7 : violet=en attente, amber=en cours, vert=terminé */
                                return (
                                    <Badge color={actionStatusColor(rowData?.status)} variant="light" size="sm" radius="xl" className="whitespace-nowrap">
                                        {actionStatusLabel(rowData.status)}
                                    </Badge>
                                );
                            }} />

                            <Column bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate}
                            />
                        </DataTable>

                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {filteredData.map((investigation) => (
                                <InvestigationCard key={investigation.id} investigation={investigation} />
                            ))}
                            {filteredData.length === 0 && (
                                <div className="col-span-full">
                                    <EmptyState
                                        icon={<IconSearch size={28} />}
                                        title="Aucune investigation à afficher"
                                        description="Aucune investigation ne correspond aux filtres sélectionnés."
                                        iconColor="slate"
                                    />
                                </div>
                            )}
                        </div>

                    )}
            </div>


            {/* Update moved to dedicated page */}

        </div>
    )
}

export default InvestigationFileData
