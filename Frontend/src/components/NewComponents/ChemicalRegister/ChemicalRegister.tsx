import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import {
    IconAlertTriangle,
    IconCircleCheck,
    IconClock,
    IconDownload,
    IconEdit,
    IconEye,
    IconFlask2,
    IconLayoutGrid,
    IconLayoutList,
    IconPlus,
    IconSearch,
} from '@tabler/icons-react';
import { ActionIcon, Button, Select, TextInput, Tooltip } from '@mantine/core';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../UtilityComp/PageHeader';
import KpiTile from '../../UtilityComp/KpiTile';
import SegmentedFilter from '../../UtilityComp/SegmentedFilter';
import EmptyState from '../../UtilityComp/EmptyState';
import { getAllChemicalRisks } from '../../../services/RiskIdentificationService';
import { getAllDepartments } from '../../../services/HrmsService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { GetAllWorkProcess } from '../../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { riskMap } from '../../../Data/DropdownData';
import {
    MATRIX_LEVEL_GRID,
    PROBABILITY_LABELS_FR,
    RISK_LEVEL_CONFIG,
    RISK_LEVEL_OPTIONS,
    RISK_STATUS_OPTIONS,
    SEVERITY_LABELS_FR,
    classificationLabel,
    classificationConfig,
    hazardSourceLabel,
    normalizeRiskStatus,
    riskLevelFromKey,
    riskStatusConfig,
} from './chemicalLabels';

/**
 * Registre chimique (LOT 50) — inventaire des risques liés aux produits
 * chimiques : synthèse par matrice probabilité × gravité, registre filtrable
 * (classification SGH, statut, niveau), export CSV.
 */

const ALL = 'all';

const ChemicalRegister = () => {
    const navigate = useNavigate();

    const [risks, setRisks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<any[]>([]);
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [processMap, setProcessMap] = useState<Record<string, any>>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});

    const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>(ALL);
    const [departmentFilter, setDepartmentFilter] = useState<string>(ALL);
    const [riskLevelFilter, setRiskLevelFilter] = useState<string | null>(null);

    useEffect(() => {
        getAllDepartments()
            .then((data) => {
                setDepartmentMap(mapIdToName(data));
                setDepartments(data);
            })
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || 'Échec du chargement des départements');
            });
        GetAllWorkProcess({})
            .then((data) => setProcessMap(mapIdToName(data)))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || 'Échec du chargement des processus');
            });
        getEmployeeDropdown()
            .then((data) => setEmpMap(mapIdToName(data)))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || 'Échec du chargement des employés');
            });
    }, []);

    useEffect(() => {
        setLoading(true);
        getAllChemicalRisks()
            .then((res) => setRisks(res ?? []))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement du registre chimique');
            })
            .finally(() => setLoading(false));
    }, []);

    // Enrichit chaque risque avec les libellés (le tableau se met à jour quand les référentiels arrivent)
    const enrichedRisks = useMemo(() => {
        return risks.map((r: any) => ({
            ...r,
            departmentName: departmentMap[r?.departmentId]?.name ?? '—',
            processName: processMap[r?.workProcessId]?.name ?? '—',
            ownerName: empMap[r?.ownerId]?.name ?? '—',
            levelRank: riskLevelFromKey(r?.riskLevel)?.rank ?? 0,
        }));
    }, [risks, departmentMap, processMap, empMap]);

    const filteredRisks = useMemo(() => {
        const q = search.trim().toLowerCase();
        return enrichedRisks.filter((risk: any) => {
            if (statusFilter !== ALL && normalizeRiskStatus(risk.status) !== statusFilter) return false;
            if (departmentFilter !== ALL && String(risk.departmentId) !== departmentFilter) return false;
            if (riskLevelFilter && riskMap[risk.riskLevel]?.level !== riskLevelFilter) return false;
            if (!q) return true;
            const haystack = [
                risk.title,
                risk.chemicalName,
                risk.casNumber,
                risk.departmentName,
                risk.processName,
                risk.ownerName,
                risk.description,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [enrichedRisks, search, statusFilter, departmentFilter, riskLevelFilter]);

    // ─── KPI ─────────────────────────────────────────────────────────────────
    const kpis = useMemo(() => {
        const highCount = enrichedRisks.filter((r: any) => r.levelRank >= 4).length;
        const inProgress = enrichedRisks.filter((r: any) => normalizeRiskStatus(r.status) === 'IN_PROGRESS').length;
        const closed = enrichedRisks.filter((r: any) => normalizeRiskStatus(r.status) === 'CLOSED').length;
        return { total: enrichedRisks.length, highCount, inProgress, closed };
    }, [enrichedRisks]);

    // ─── Matrice probabilité × gravité ───────────────────────────────────────
    const matrixCounts = useMemo(() => {
        const counts = Array.from({ length: 5 }, () => Array(5).fill(0));
        filteredRisks.forEach((risk: any) => {
            const key: string | undefined = typeof risk.riskLevel === 'string' ? risk.riskLevel : undefined;
            if (key && /^[1-5][1-5]$/.test(key)) {
                counts[parseInt(key[0], 10) - 1][parseInt(key[1], 10) - 1] += 1;
                return;
            }
            const pIdx = typeof risk.likelihood === 'number' ? risk.likelihood - 1 : -1;
            const sIdx = typeof risk.severity === 'number' ? risk.severity - 1 : -1;
            if (pIdx >= 0 && pIdx < 5 && sIdx >= 0 && sIdx < 5) counts[pIdx][sIdx] += 1;
        });
        return counts;
    }, [filteredRisks]);

    // ─── Export CSV ──────────────────────────────────────────────────────────
    const exportCsv = () => {
        const headers = [
            'Produit', 'N° CAS', 'Classification SGH', 'Source de danger', 'Département',
            'Processus', 'Responsable', 'Niveau de risque', 'Statut',
        ];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredRisks.map((row: any) =>
            [
                row.chemicalName ?? row.title ?? '',
                row.casNumber ?? '',
                classificationLabel(row.classification),
                hazardSourceLabel(row.hazardSource),
                row.departmentName,
                row.processName,
                row.ownerName,
                riskLevelFromKey(row.riskLevel)?.label ?? '',
                riskStatusConfig(row.status).label,
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `registre_chimique_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(`${filteredRisks.length} risque${filteredRisks.length > 1 ? 's' : ''} exporté${filteredRisks.length > 1 ? 's' : ''}`);
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const productBody = (row: any) => (
        <div className="min-w-0 max-w-md">
            <p className="text-[13px] text-slate-800 leading-snug">{row.chemicalName || row.title || '—'}</p>
            <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                {[row.casNumber ? `CAS ${row.casNumber}` : null, hazardSourceLabel(row.hazardSource) !== '—' ? hazardSourceLabel(row.hazardSource) : null]
                    .filter(Boolean)
                    .join(' · ') || row.title}
            </p>
        </div>
    );

    const classificationBody = (row: any) => {
        const cfg = classificationConfig(row.classification);
        if (!cfg) return <span className="text-[12.5px] text-slate-400">—</span>;
        return (
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                <span className="font-medium">{cfg.sgh}</span>
                {cfg.label}
            </span>
        );
    };

    const levelBody = (row: any) => {
        const cfg = riskLevelFromKey(row.riskLevel);
        if (!cfg) return <span className="text-[12.5px] text-slate-400">—</span>;
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const statusBody = (row: any) => {
        const cfg = riskStatusConfig(row.status);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const actionsBody = (row: any) => (
        <div className="flex gap-1.5 justify-center">
            <Tooltip label="Consulter le détail" withArrow>
                <ActionIcon
                    color="violet"
                    variant="light"
                    size="sm"
                    onClick={() => navigate(`chemicalRegister-details/${row.id}`)}
                    aria-label="Consulter le détail du risque"
                >
                    <IconEye size={14} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label="Modifier le risque" withArrow>
                <ActionIcon
                    color="blue"
                    variant="light"
                    size="sm"
                    onClick={() => navigate(`edit/${row.id}`)}
                    aria-label="Modifier le risque"
                >
                    <IconEdit size={14} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
        </div>
    );

    const hasActiveFilters =
        search.trim() !== '' || statusFilter !== ALL || departmentFilter !== ALL || riskLevelFilter !== null;

    const resetFilters = () => {
        setSearch('');
        setStatusFilter(ALL);
        setDepartmentFilter(ALL);
        setRiskLevelFilter(null);
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Risques' },
                    { label: 'Registre chimique' },
                ]}
                icon={<IconFlask2 size={22} stroke={2} />}
                iconColor="violet"
                title="Registre chimique"
                subtitle="Inventaire des produits chimiques et évaluation des risques associés, selon la classification SGH"
                actions={
                    <Button size="sm" color="teal" leftSection={<IconPlus size={14} />} onClick={() => navigate('create-chemical')}>
                        Nouveau risque chimique
                    </Button>
                }
            />

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label="Produits référencés"
                    value={loading ? '…' : kpis.total}
                    tone="violet"
                    icon={<IconFlask2 size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="Risques élevés ou critiques"
                    value={loading ? '…' : kpis.highCount}
                    tone="rose"
                    icon={<IconAlertTriangle size={14} stroke={1.8} />}
                    referenceValue="Niveaux élevé et critique"
                />
                <KpiTile
                    label="En traitement"
                    value={loading ? '…' : kpis.inProgress}
                    tone="amber"
                    icon={<IconClock size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="Clôturés"
                    value={loading ? '…' : kpis.closed}
                    tone="green"
                    icon={<IconCircleCheck size={14} stroke={1.8} />}
                />
            </div>

            {/* Onglets Synthèse / Registre */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <SegmentedFilter
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { value: 'DASHBOARD', label: 'Synthèse', color: 'violet' },
                        { value: 'RISKS', label: 'Registre', count: risks.length, color: 'violet' },
                    ]}
                />
            </div>

            {activeTab === 'DASHBOARD' && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h2
                        className="text-slate-800 mb-1"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14.5px', fontWeight: 600 }}
                    >
                        Matrice probabilité × gravité
                    </h2>
                    <p className="text-[11.5px] text-slate-500 mb-3">
                        Chaque cellule indique le nombre de risques chimiques positionnés sur la combinaison correspondante.
                    </p>

                    {loading ? (
                        <div className="flex flex-col gap-2" aria-busy="true">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse min-w-[640px]">
                                <thead>
                                    <tr>
                                        <th className="p-2 bg-slate-50 border border-slate-200 text-left text-[12px] font-medium text-slate-600">
                                            Probabilité ↓ / Gravité →
                                        </th>
                                        {SEVERITY_LABELS_FR.map((severity) => (
                                            <th
                                                key={severity}
                                                className="p-2 bg-slate-50 border border-slate-200 text-center text-[12px] font-medium text-slate-600 min-w-24"
                                            >
                                                {severity}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {PROBABILITY_LABELS_FR.map((probability, pIdx) => (
                                        <tr key={probability}>
                                            <td className="p-2 bg-slate-50 border border-slate-200 text-[12px] text-slate-600 min-w-28">
                                                {probability}
                                            </td>
                                            {SEVERITY_LABELS_FR.map((_s, gIdx) => {
                                                const level = MATRIX_LEVEL_GRID[pIdx][gIdx];
                                                const cfg = RISK_LEVEL_CONFIG[level];
                                                const count = matrixCounts[pIdx][gIdx];
                                                return (
                                                    <td
                                                        key={gIdx}
                                                        className={`p-1.5 border border-slate-200 text-center h-11 ${cfg?.cell ?? 'bg-slate-50 text-slate-600'}`}
                                                    >
                                                        <div className="text-[10px] uppercase tracking-wider leading-none mb-1 opacity-80">
                                                            {cfg?.label ?? level}
                                                        </div>
                                                        <div className="text-[14px] leading-none font-medium tabular-nums">{count}</div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'RISKS' && (
                <>
                    {/* Barre de filtres */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <TextInput
                                placeholder="Rechercher un produit, un n° CAS, un responsable…"
                                leftSection={<IconSearch size={14} />}
                                value={search}
                                onChange={(e) => setSearch(e.currentTarget.value)}
                                size="xs"
                                className="flex-1 min-w-[220px]"
                            />
                            <Select
                                data={[{ value: ALL, label: 'Tous statuts' }, ...RISK_STATUS_OPTIONS]}
                                value={statusFilter}
                                onChange={(v) => setStatusFilter(v ?? ALL)}
                                size="xs"
                                w={150}
                                aria-label="Filtrer par statut"
                            />
                            <Select
                                data={[
                                    { value: ALL, label: 'Tous départements' },
                                    ...departments.map((dept) => ({ label: dept.name, value: String(dept.id) })),
                                ]}
                                value={departmentFilter}
                                onChange={(v) => setDepartmentFilter(v ?? ALL)}
                                size="xs"
                                w={180}
                                aria-label="Filtrer par département"
                            />
                            <Select
                                data={RISK_LEVEL_OPTIONS}
                                value={riskLevelFilter}
                                onChange={setRiskLevelFilter}
                                placeholder="Niveau de risque"
                                size="xs"
                                w={170}
                                clearable
                                aria-label="Filtrer par niveau de risque"
                            />
                            <div className="flex items-center gap-2 ml-auto">
                                <Button
                                    variant="default"
                                    size="xs"
                                    leftSection={<IconDownload size={14} />}
                                    onClick={exportCsv}
                                    disabled={!filteredRisks.length}
                                >
                                    Exporter CSV
                                </Button>
                                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                                    <Tooltip label="Vue tableau" withArrow>
                                        <ActionIcon
                                            variant={viewType === 'table' ? 'filled' : 'subtle'}
                                            color="violet"
                                            size="sm"
                                            onClick={() => setViewType('table')}
                                            aria-label="Afficher en tableau"
                                        >
                                            <IconLayoutList size={15} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Vue cartes" withArrow>
                                        <ActionIcon
                                            variant={viewType === 'card' ? 'filled' : 'subtle'}
                                            color="violet"
                                            size="sm"
                                            onClick={() => setViewType('card')}
                                            aria-label="Afficher en cartes"
                                        >
                                            <IconLayoutGrid size={15} />
                                        </ActionIcon>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                        <p className="text-[11.5px] text-slate-500 mt-2">
                            {loading
                                ? 'Chargement du registre…'
                                : `${filteredRisks.length} risque${filteredRisks.length > 1 ? 's' : ''} affiché${filteredRisks.length > 1 ? 's' : ''} sur ${risks.length}`}
                        </p>
                    </div>

                    {/* Registre */}
                    <div className="bg-white rounded-xl border border-slate-200 p-2">
                        {loading ? (
                            <div className="flex flex-col gap-2 p-2" aria-busy="true">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                                ))}
                            </div>
                        ) : !filteredRisks.length ? (
                            <EmptyState
                                icon={<IconFlask2 size={24} />}
                                title={hasActiveFilters ? 'Aucun risque ne correspond aux filtres' : 'Aucun risque chimique enregistré'}
                                description={
                                    hasActiveFilters
                                        ? 'Élargissez la recherche ou réinitialisez les filtres pour retrouver le registre complet.'
                                        : 'Identifiez le premier produit chimique à risque manipulé sur le site.'
                                }
                                compact
                                action={
                                    hasActiveFilters ? (
                                        <Button variant="default" size="xs" onClick={resetFilters}>
                                            Réinitialiser les filtres
                                        </Button>
                                    ) : (
                                        <Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={() => navigate('create-chemical')}>
                                            Nouveau risque chimique
                                        </Button>
                                    )
                                }
                            />
                        ) : viewType === 'table' ? (
                            <DataTable
                                value={filteredRisks}
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
                                <Column header="Produit / risque" body={productBody} sortable sortField="chemicalName" />
                                <Column header="Classification" body={classificationBody} sortable sortField="classification" style={{ width: '13rem' }} />
                                <Column
                                    header="Département"
                                    body={(row) => <span className="text-[12.5px] text-slate-600">{row.departmentName}</span>}
                                    sortable
                                    sortField="departmentName"
                                    style={{ width: '10rem' }}
                                />
                                <Column
                                    header="Responsable"
                                    body={(row) => <span className="text-[12.5px] text-slate-600">{row.ownerName}</span>}
                                    sortable
                                    sortField="ownerName"
                                    style={{ width: '10rem' }}
                                />
                                <Column header="Niveau" body={levelBody} sortable sortField="levelRank" style={{ width: '9rem' }} />
                                <Column header="Statut" body={statusBody} sortable sortField="status" style={{ width: '8rem' }} />
                                <Column header="Actions" body={actionsBody} headerStyle={{ width: '6rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                            </DataTable>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
                                {filteredRisks.map((risk: any) => {
                                    const levelCfg = riskLevelFromKey(risk.riskLevel);
                                    const statusCfg = riskStatusConfig(risk.status);
                                    const classCfg = classificationConfig(risk.classification);
                                    return (
                                        <div key={risk.id} className="rounded-xl border border-slate-200 p-3 bg-white flex flex-col gap-2">
                                            <div className="flex items-center justify-between gap-2">
                                                {classCfg ? (
                                                    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${classCfg.chip}`}>
                                                        <span className="font-medium">{classCfg.sgh}</span>
                                                        {classCfg.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">Classification non renseignée</span>
                                                )}
                                                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-slate-800 leading-snug">{risk.chemicalName || risk.title}</p>
                                            {risk.description && (
                                                <p className="text-[11.5px] text-slate-500 line-clamp-2">{risk.description}</p>
                                            )}
                                            <dl className="text-[11.5px] text-slate-500 space-y-1 mt-1">
                                                {risk.casNumber && (
                                                    <div className="flex justify-between gap-2">
                                                        <dt>N° CAS</dt>
                                                        <dd className="text-slate-700">{risk.casNumber}</dd>
                                                    </div>
                                                )}
                                                <div className="flex justify-between gap-2">
                                                    <dt>Responsable</dt>
                                                    <dd className="text-slate-700">{risk.ownerName}</dd>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    <dt>Département</dt>
                                                    <dd className="text-slate-700">{risk.departmentName}</dd>
                                                </div>
                                                <div className="flex justify-between gap-2 items-center">
                                                    <dt>Niveau de risque</dt>
                                                    <dd>
                                                        {levelCfg ? (
                                                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${levelCfg.chip}`}>
                                                                {levelCfg.label}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">Non évalué</span>
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                            <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-slate-100">
                                                <Button size="compact-xs" variant="default" onClick={() => navigate(`chemicalRegister-details/${risk.id}`)}>
                                                    Détail
                                                </Button>
                                                <Button size="compact-xs" variant="light" color="violet" onClick={() => navigate(`edit/${risk.id}`)}>
                                                    Modifier
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ChemicalRegister;
