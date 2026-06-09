import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, TextInput, Tooltip } from '@mantine/core';
import { IconBriefcase, IconEye, IconSearch } from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import { GetAllPostionAssignment } from '../../../services/AssignmentService';
import { errorNotification } from '../../../utility/NotificationUtility';
import EmptyState from '../../UtilityComp/EmptyState';

/**
 * Liste des postes et du nombre d'exigences qui leur sont affectées (LOT 49).
 */
const AssignData = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);
        GetAllPostionAssignment({})
            .then((res) => setData(res ?? []))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des affectations');
            })
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return data;
        return data.filter((row) => (row.position ?? '').toLowerCase().includes(q));
    }, [data, search]);

    const positionBody = (row: any) => (
        <div className="flex items-center gap-2.5">
            <span className="inline-flex p-1.5 rounded-md bg-teal-50 text-teal-700 flex-shrink-0">
                <IconBriefcase size={14} stroke={1.8} aria-hidden="true" />
            </span>
            <span className="text-[13px] text-slate-800">{row.position || '—'}</span>
        </div>
    );

    const countBody = (row: any) => {
        const count = row.reqCount ?? 0;
        return (
            <span
                className={`inline-flex items-center rounded border px-2 py-0.5 text-[11.5px] ${
                    count > 0
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
            >
                {count} exigence{count > 1 ? 's' : ''}
            </span>
        );
    };

    const actionBody = (row: any) => (
        <Tooltip label="Voir les exigences du poste" withArrow>
            <ActionIcon
                onClick={() => navigate(`view-details/${row.id}`)}
                variant="light"
                size="sm"
                color="teal"
                aria-label="Voir les exigences du poste"
            >
                <IconEye size={14} stroke={1.5} />
            </ActionIcon>
        </Tooltip>
    );

    return (
        <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder="Rechercher un poste…"
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[220px]"
                    />
                    <span className="text-[11.5px] text-slate-500 ml-auto">
                        {loading ? 'Chargement…' : `${filtered.length} poste${filtered.length > 1 ? 's' : ''}`}
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-2">
                {loading ? (
                    <div className="flex flex-col gap-2 p-2" aria-busy="true">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : !filtered.length ? (
                    <EmptyState
                        icon={<IconBriefcase size={24} />}
                        title="Aucun poste trouvé"
                        description="Les postes définis dans le référentiel RH apparaîtront ici avec leurs exigences."
                        compact
                    />
                ) : (
                    <DataTable
                        value={filtered}
                        size="small"
                        stripedRows
                        removableSort
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        dataKey="id"
                        className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                    >
                        <Column header="Poste" body={positionBody} sortable sortField="position" />
                        <Column header="Exigences affectées" body={countBody} sortable sortField="reqCount" style={{ width: '12rem' }} />
                        <Column header="" body={actionBody} headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                )}
            </div>
        </div>
    );
};

export default AssignData;
