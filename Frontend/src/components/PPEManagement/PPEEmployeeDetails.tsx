import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useState } from 'react';
import { Button } from '@mantine/core';
import { IconArrowLeft, IconHistory, IconPackage, IconUserShield } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getEmployee } from '../../services/EmployeeService';
import { getPpeByEmp } from '../../services/PpeEmpService';
import { getAllPPE } from '../../services/PPEService';
import { mapIdToName } from '../../utility/OtherUtilities';
import PageHeader from '../UtilityComp/PageHeader';
import EmptyState from '../UtilityComp/EmptyState';
import { assignmentStatusConfig, CHIP_BASE, formatDateFr, ppeCategoryLabel } from './ppeLabels';

/**
 * Fiche EPI d'un employé : dotations en cours et historique complet
 * des affectations.
 */
const PPEEmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [emp, setEmp] = useState<any>({});
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'assignments' | 'history'>('assignments');

    useEffect(() => {
        setLoading(true);
        Promise.allSettled([
            getEmployee(id).then(setEmp),
            getPpeByEmp(Number(id)).then(setAssignments),
            getAllPPE().then((data) => setPpeMap(mapIdToName(data))),
        ]).finally(() => setLoading(false));
    }, [id]);

    const activeAssignments = assignments.filter((x: any) => String(x.status).toUpperCase() === 'ACTIVE');

    const ppeNameBody = (row: any) => (
        <div className="min-w-0">
            <p className="text-[13px] text-slate-800 leading-snug">{ppeMap[row.ppeId]?.name || `EPI #${row.ppeId}`}</p>
            <p className="text-[11.5px] text-slate-500 mt-0.5">{ppeCategoryLabel(ppeMap[row.ppeId]?.category)}</p>
        </div>
    );

    const statusBody = (row: any) => {
        const cfg = assignmentStatusConfig(row.status);
        return <span className={`${CHIP_BASE} ${cfg.chip}`}>{cfg.label}</span>;
    };

    const dateBody = (row: any) => (
        <span className="text-[12.5px] text-slate-600">{formatDateFr(row.date)}</span>
    );

    const renderTable = (rows: any[], emptyTitle: string, emptyDescription: string) =>
        loading ? (
            <div className="flex flex-col gap-2 p-2" aria-busy="true">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                ))}
            </div>
        ) : !rows.length ? (
            <EmptyState icon={<IconPackage size={24} />} title={emptyTitle} description={emptyDescription} compact />
        ) : (
            <DataTable
                value={rows}
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
                <Column header="EPI" body={ppeNameBody} sortable sortField="ppeId" />
                <Column header="Affecté le" body={dateBody} sortable sortField="date" style={{ width: '11rem' }} />
                <Column header="Statut" body={statusBody} sortable sortField="status" style={{ width: '9rem' }} />
            </DataTable>
        );

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des EPI', to: '/ppe-management' },
                    { label: 'Dotation employé' },
                ]}
                icon={<IconUserShield size={22} stroke={2} />}
                iconColor="amber"
                title={emp?.name || 'Dotation EPI'}
                subtitle="Équipements affectés et historique des dotations de l'employé"
                actions={
                    <Button variant="default" size="sm" leftSection={<IconArrowLeft size={14} />} onClick={() => navigate(-1)}>
                        Retour
                    </Button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Dotations */}
                <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setActiveTab('assignments')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                                    activeTab === 'assignments'
                                        ? 'bg-teal-600 text-white'
                                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                            >
                                <IconPackage size={14} aria-hidden="true" />
                                EPI affectés
                                <span
                                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] ${
                                        activeTab === 'assignments' ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {activeAssignments.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('history')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                                    activeTab === 'history'
                                        ? 'bg-teal-600 text-white'
                                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                            >
                                <IconHistory size={14} aria-hidden="true" />
                                Historique
                                <span
                                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] ${
                                        activeTab === 'history' ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {assignments.length}
                                </span>
                            </button>
                        </div>
                    </div>
                    {activeTab === 'assignments'
                        ? renderTable(
                              activeAssignments,
                              'Aucun EPI affecté',
                              "Cet employé n'a pas de dotation EPI en cours. Les affectations apparaîtront ici."
                          )
                        : renderTable(
                              assignments,
                              'Aucun historique de dotation',
                              "Aucune affectation d'EPI n'a encore été enregistrée pour cet employé."
                          )}
                </section>

                {/* Fiche employé */}
                <aside className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
                    <header className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                        <h2
                            className="text-slate-800"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                        >
                            Fiche employé
                        </h2>
                    </header>
                    <dl className="p-4 space-y-2.5 text-[12.5px]">
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Département</dt>
                            <dd className="text-slate-800 text-right">{emp?.department || '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Poste</dt>
                            <dd className="text-slate-800 text-right">{emp?.position || '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Courriel</dt>
                            <dd className="text-slate-800 text-right break-all">{emp?.email || '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
                            <dt className="text-slate-500">Dotations en cours</dt>
                            <dd className="text-slate-800 tabular-nums">{activeAssignments.length}</dd>
                        </div>
                    </dl>
                </aside>
            </div>
        </div>
    );
};

export default PPEEmployeeDetails;
