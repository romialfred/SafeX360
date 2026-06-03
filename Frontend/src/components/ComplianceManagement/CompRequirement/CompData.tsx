import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ActionIcon, Button, Input, TextInput, Tooltip } from '@mantine/core';
import { IconCheck, IconEdit, IconFilter, IconPlus, IconSearch, IconTrash, IconUpload, IconX } from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Column } from 'primereact/column';
import { activateRequirement, deactivateRequirement, getAllRequirement } from '../../../services/RequirementService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { modals } from '@mantine/modals';
import { useDispatch } from 'react-redux';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
}

const CompData = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const dispatch = useDispatch();
    const [data, setData] = useState<any[]>([]);



    useEffect(() => {

        getAllRequirement({})
            .then((res) => {
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des exigences");
            })
            .finally();
    }, []);


    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";

        const actionLabel = action === 'activate' ? 'activer' : 'désactiver';
        modals.openConfirmModal({
            title: <span className='text-lg'>Confirmer l'action</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Souhaitez-vous <strong>{actionLabel}</strong> l'exigence : <strong>{rowData.title}</strong> ?
                </span>
            ),
            labels: { confirm: `Oui, ${actionLabel}`, cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: "default" },
            confirmProps: { color: action === 'activate' ? 'green' : 'red', variant: "filled" },

            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay())
                const apiCall = action === "activate" ? activateRequirement : deactivateRequirement;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Exigence ${actionLabel === 'activer' ? 'activée' : 'désactivée'} avec succès`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Échec de l'opération`);
                    }
                    ).finally(() => {
                        dispatch(hideOverlay())
                    })
            },
        });
    };
    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const rightToolbarTemplate = () => {
        return (
            <div className='flex gap-3'>
                <Button size="sm" variant='default' leftSection={<IconUpload size={14} />}>Exporter</Button>
                <TextInput value={globalFilterValue} onChange={onGlobalFilterChange} size='sm' placeholder='Rechercher...' leftSection={<IconSearch size={14} />} />
            </div>
        );
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex gap-3">
                <Button size="sm" onClick={() => navigate('add-requirement')} leftSection={<IconPlus size={14} />} color="teal">Ajouter une exigence</Button>
            </div>
        );
    };







    const actionBodyTemplate = (rowData: any) => {
        const id = rowData.id;
        return (
            <div className='flex gap-2 justify-center'>
                <Tooltip label="Modifier l'exigence">
                    <ActionIcon onClick={() => navigate(`edit-requirement/${id}`)} variant="light" size="sm" color="blue" >
                        <IconEdit size={14} stroke={1.5} /></ActionIcon>
                </Tooltip>

                <Tooltip label="Supprimer">
                    <ActionIcon onClick={() => navigate(`inspection/${id}`)} variant="light" size="sm" color="red" >
                        <IconTrash size={14} stroke={1.5} /></ActionIcon>
                </Tooltip>

                <Tooltip label={rowData.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}>
                    <ActionIcon
                        variant="light"
                        color={rowData.status === 'ACTIVE' ? "red" : "green"}
                        onClick={() => handleStatusChange(rowData)}
                        size="sm"
                    >
                        {rowData.status === 'ACTIVE' ? <IconX size={14} /> : <IconCheck size={14} />}
                    </ActionIcon>
                </Tooltip>
            </div>
        )
    }

    const renderHeader = () => {
        return (
            <div className='flex justify-between p-2'>
                <Input
                    leftSection={<IconSearch size={14} />}
                    placeholder="Rechercher une exigence..."
                    type="search"
                    onChange={(e) => onGlobalFilterChange(e)}
                />
                <div>
                    <Button variant='default' size="sm" leftSection={<IconFilter size={14} />}>Filtrer</Button>
                </div>
            </div>
        );
    };

    const header = renderHeader();



    return (
        <div className="card ">
            <Toast ref={toast} />
            <Toolbar className="mb-1 !p-2" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

            <DataTable selectionMode="single" size='small' stripedRows removableSort paginator rows={10} header={header} value={data} className='[&_.p-datatable-tbody]:!text-sm'
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]} dataKey="name" filters={filters} globalFilterFields={['name', 'shortName', 'sector', 'company']}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries" onFilter={(e) => setFilters(e.filters)}
            >

                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} header='Titre' field='title' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} header='Catégorie' field='category' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} header='Fréquence renouvellement' field='renewalFrequency' sortable />
                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} header='Type de document' field='docType' />
                <Column style={{ fontWeight: 'normal', fontSize: "13px" }} field="status" header="Statut"
                    body={(row: any) => (
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border ${
                            row.status === 'ACTIVE'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>{row.status === 'ACTIVE' ? 'Actif' : 'Inactif'}</span>
                    )} />
                <Column headerStyle={{ width: '7rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />




            </DataTable>
        </div>
    )
}

export default CompData