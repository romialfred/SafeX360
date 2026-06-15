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
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('risk');
    // Libellés bilingues : clé i18n d'abord, repli sur le libellé FR centralisé (chemicalLabels.ts).
    const tStatusLabel = (status?: string | null): string => {
        const cfg = riskStatusConfig(status);
        return t(`status.${normalizeRiskStatus(status)}`, { defaultValue: cfg.label });
    };
    const tLevelLabel = (key?: string | null): string => {
        const cfg = riskLevelFromKey(key);
        return cfg ? t(`level.${riskMap[String(key)]?.level}`, { defaultValue: cfg.label }) : '';
    };
    const tClassLabel = (code?: string | null): string => {
        const cfg = classificationConfig(code);
        return cfg ? t(`chemical.classification.${code}`, { defaultValue: cfg.label }) : '';
    };
    const tHazardSource = (code?: string | null): string =>
        code ? t(`chemical.hazardSource.${code}`, { defaultValue: hazardSourceLabel(code) }) : '—';
    const tSeverity = (idx: number) => t(`severity.${idx + 1}`, { defaultValue: SEVERITY_LABELS_FR[idx] });
    const tProbability = (idx: number) => t(`probability.${idx + 1}`, { defaultValue: PROBABILITY_LABELS_FR[idx] });
    const levelOptions = RISK_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: t(`level.${o.value}`, { defaultValue: o.label }) }));
    const statusOptions = RISK_STATUS_OPTIONS.map((o) => ({ value: o.value, label: t(`status.${o.value}`, { defaultValue: o.label }) }));

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
                errorNotification(error.response?.data?.errorMessage || t('errors.loadDepartments'));
            });
        GetAllWorkProcess({})
            .then((data) => setProcessMap(mapIdToName(data)))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('errors.loadProcesses'));
            });
        getEmployeeDropdown()
            .then((data) => setEmpMap(mapIdToName(data)))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('errors.loadEmployees'));
            });
    }, []);

    useEffect(() => {
        setLoading(true);
        getAllChemicalRisks()
            .then((res) => setRisks(res ?? []))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('chemicalRegister.loadFailed'));
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
    const tClassCsv = (code?: string | null): string => {
        const cfg = classificationConfig(code);
        return cfg ? `${cfg.sgh} · ${tClassLabel(code)}` : (code ? classificationLabel(code) : '—');
    };

    const exportCsv = () => {
        const headers = [
            t('chemicalRegister.csvCol.product'),
            t('chemicalRegister.csvCol.cas'),
            t('chemicalRegister.csvCol.classification'),
            t('chemicalRegister.csvCol.hazardSource'),
            t('chemicalRegister.csvCol.department'),
            t('chemicalRegister.csvCol.process'),
            t('chemicalRegister.csvCol.owner'),
            t('chemicalRegister.csvCol.level'),
            t('chemicalRegister.csvCol.status'),
        ];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredRisks.map((row: any) =>
            [
                row.chemicalName ?? row.title ?? '',
                row.casNumber ?? '',
                tClassCsv(row.classification),
                tHazardSource(row.hazardSource),
                row.departmentName,
                row.processName,
                row.ownerName,
                tLevelLabel(row.riskLevel),
                tStatusLabel(row.status),
            ].map(escape).join(';')
        );
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${t('chemicalRegister.csvFilename')}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(t('common.exported', { count: filteredRisks.length }));
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const productBody = (row: any) => (
        <div className="min-w-0 max-w-md">
            <p className="text-[13px] text-slate-800 leading-snug">{row.chemicalName || row.title || '—'}</p>
            <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                {[row.casNumber ? `CAS ${row.casNumber}` : null, tHazardSource(row.hazardSource) !== '—' ? tHazardSource(row.hazardSource) : null]
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
                {tClassLabel(row.classification)}
            </span>
        );
    };

    const levelBody = (row: any) => {
        const cfg = riskLevelFromKey(row.riskLevel);
        if (!cfg) return <span className="text-[12.5px] text-slate-400">—</span>;
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {tLevelLabel(row.riskLevel)}
            </span>
        );
    };

    const statusBody = (row: any) => {
        const cfg = riskStatusConfig(row.status);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {tStatusLabel(row.status)}
            </span>
        );
    };

    const actionsBody = (row: any) => (
        <div className="flex gap-1.5 justify-center">
            <Tooltip label={t('common.viewDetail')} withArrow>
                <ActionIcon
                    color="violet"
                    variant="light"
                    size="sm"
                    onClick={() => navigate(`chemicalRegister-details/${row.id}`)}
                    aria-label={t('common.viewRiskDetail')}
                >
                    <IconEye size={14} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label={t('common.editRisk')} withArrow>
                <ActionIcon
                    color="blue"
                    variant="light"
                    size="sm"
                    onClick={() => navigate(`edit/${row.id}`)}
                    aria-label={t('common.editRisk')}
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
                    { label: t('common.home'), to: '/' },
                    { label: t('common.riskManagement') },
                    { label: t('chemicalRegister.breadcrumb') },
                ]}
                icon={<IconFlask2 size={22} stroke={2} />}
                iconColor="violet"
                title={t('chemicalRegister.title')}
                subtitle={t('chemicalRegister.subtitle')}
                actions={
                    <Button size="sm" color="teal" leftSection={<IconPlus size={14} />} onClick={() => navigate('create-chemical')}>
                        {t('chemicalRegister.newChemicalRisk')}
                    </Button>
                }
            />

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label={t('chemicalRegister.kpiTotal')}
                    value={loading ? '…' : kpis.total}
                    tone="violet"
                    icon={<IconFlask2 size={14} stroke={1.8} />}
                />
                <KpiTile
                    label={t('chemicalRegister.kpiHigh')}
                    value={loading ? '…' : kpis.highCount}
                    tone="rose"
                    icon={<IconAlertTriangle size={14} stroke={1.8} />}
                    referenceValue={t('chemicalRegister.kpiHighReference')}
                />
                <KpiTile
                    label={t('chemicalRegister.kpiInProgress')}
                    value={loading ? '…' : kpis.inProgress}
                    tone="amber"
                    icon={<IconClock size={14} stroke={1.8} />}
                />
                <KpiTile
                    label={t('chemicalRegister.kpiClosed')}
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
                        { value: 'DASHBOARD', label: t('chemicalRegister.tabDashboard'), color: 'violet' },
                        { value: 'RISKS', label: t('chemicalRegister.tabRisks'), count: risks.length, color: 'violet' },
                    ]}
                />
            </div>

            {activeTab === 'DASHBOARD' && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h2
                        className="text-slate-800 mb-1"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14.5px', fontWeight: 600 }}
                    >
                        {t('chemicalRegister.matrixTitle')}
                    </h2>
                    <p className="text-[11.5px] text-slate-500 mb-3">
                        {t('chemicalRegister.matrixSubtitle')}
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
                                            {t('chemicalRegister.matrixHeader')}
                                        </th>
                                        {SEVERITY_LABELS_FR.map((severity, sIdx) => (
                                            <th
                                                key={severity}
                                                className="p-2 bg-slate-50 border border-slate-200 text-center text-[12px] font-medium text-slate-600 min-w-24"
                                            >
                                                {tSeverity(sIdx)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {PROBABILITY_LABELS_FR.map((probability, pIdx) => (
                                        <tr key={probability}>
                                            <td className="p-2 bg-slate-50 border border-slate-200 text-[12px] text-slate-600 min-w-28">
                                                {tProbability(pIdx)}
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
                                                            {cfg ? t(`level.${level}`, { defaultValue: cfg.label }) : level}
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
                                placeholder={t('chemicalRegister.searchPlaceholder')}
                                leftSection={<IconSearch size={14} />}
                                value={search}
                                onChange={(e) => setSearch(e.currentTarget.value)}
                                size="xs"
                                className="flex-1 min-w-[220px]"
                            />
                            <Select
                                data={[{ value: ALL, label: t('common.allStatuses') }, ...statusOptions]}
                                value={statusFilter}
                                onChange={(v) => setStatusFilter(v ?? ALL)}
                                size="xs"
                                w={150}
                                aria-label={t('common.filterByStatus')}
                            />
                            <Select
                                data={[
                                    { value: ALL, label: t('common.allDepartments') },
                                    ...departments.map((dept) => ({ label: dept.name, value: String(dept.id) })),
                                ]}
                                value={departmentFilter}
                                onChange={(v) => setDepartmentFilter(v ?? ALL)}
                                size="xs"
                                w={180}
                                aria-label={t('common.filterByDepartment')}
                            />
                            <Select
                                data={levelOptions}
                                value={riskLevelFilter}
                                onChange={setRiskLevelFilter}
                                placeholder={t('common.riskLevelPlaceholder')}
                                size="xs"
                                w={170}
                                clearable
                                aria-label={t('common.filterByRiskLevel')}
                            />
                            <div className="flex items-center gap-2 ml-auto">
                                <Button
                                    variant="default"
                                    size="xs"
                                    leftSection={<IconDownload size={14} />}
                                    onClick={exportCsv}
                                    disabled={!filteredRisks.length}
                                >
                                    {t('common.exportCsv')}
                                </Button>
                                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                                    <Tooltip label={t('common.tableView')} withArrow>
                                        <ActionIcon
                                            variant={viewType === 'table' ? 'filled' : 'subtle'}
                                            color="violet"
                                            size="sm"
                                            onClick={() => setViewType('table')}
                                            aria-label={t('common.showAsTable')}
                                        >
                                            <IconLayoutList size={15} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label={t('common.cardView')} withArrow>
                                        <ActionIcon
                                            variant={viewType === 'card' ? 'filled' : 'subtle'}
                                            color="violet"
                                            size="sm"
                                            onClick={() => setViewType('card')}
                                            aria-label={t('common.showAsCards')}
                                        >
                                            <IconLayoutGrid size={15} />
                                        </ActionIcon>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                        <p className="text-[11.5px] text-slate-500 mt-2">
                            {loading
                                ? t('common.loadingRegister')
                                : t('common.displayedOf', { count: filteredRisks.length, total: risks.length })}
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
                                title={hasActiveFilters ? t('common.noMatchTitle') : t('chemicalRegister.emptyTitle')}
                                description={
                                    hasActiveFilters
                                        ? t('common.broadenSearch')
                                        : t('chemicalRegister.emptyDescription')
                                }
                                compact
                                action={
                                    hasActiveFilters ? (
                                        <Button variant="default" size="xs" onClick={resetFilters}>
                                            {t('common.resetFilters')}
                                        </Button>
                                    ) : (
                                        <Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={() => navigate('create-chemical')}>
                                            {t('chemicalRegister.newChemicalRisk')}
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
                                currentPageReportTemplate={t('common.currentPageReport', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}' })}
                            >
                                <Column header={t('chemicalRegister.col.product')} body={productBody} sortable sortField="chemicalName" />
                                <Column header={t('chemicalRegister.col.classification')} body={classificationBody} sortable sortField="classification" style={{ width: '13rem' }} />
                                <Column
                                    header={t('chemicalRegister.col.department')}
                                    body={(row) => <span className="text-[12.5px] text-slate-600">{row.departmentName}</span>}
                                    sortable
                                    sortField="departmentName"
                                    style={{ width: '10rem' }}
                                />
                                <Column
                                    header={t('chemicalRegister.col.owner')}
                                    body={(row) => <span className="text-[12.5px] text-slate-600">{row.ownerName}</span>}
                                    sortable
                                    sortField="ownerName"
                                    style={{ width: '10rem' }}
                                />
                                <Column header={t('chemicalRegister.col.level')} body={levelBody} sortable sortField="levelRank" style={{ width: '9rem' }} />
                                <Column header={t('chemicalRegister.col.status')} body={statusBody} sortable sortField="status" style={{ width: '8rem' }} />
                                <Column header={t('chemicalRegister.col.actions')} body={actionsBody} headerStyle={{ width: '6rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
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
                                                        {tClassLabel(risk.classification)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">{t('chemicalRegister.classificationNotSet')}</span>
                                                )}
                                                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                                    {tStatusLabel(risk.status)}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-slate-800 leading-snug">{risk.chemicalName || risk.title}</p>
                                            {risk.description && (
                                                <p className="text-[11.5px] text-slate-500 line-clamp-2">{risk.description}</p>
                                            )}
                                            <dl className="text-[11.5px] text-slate-500 space-y-1 mt-1">
                                                {risk.casNumber && (
                                                    <div className="flex justify-between gap-2">
                                                        <dt>{t('chemicalRegister.col.cas')}</dt>
                                                        <dd className="text-slate-700">{risk.casNumber}</dd>
                                                    </div>
                                                )}
                                                <div className="flex justify-between gap-2">
                                                    <dt>{t('common.owner')}</dt>
                                                    <dd className="text-slate-700">{risk.ownerName}</dd>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    <dt>{t('common.department')}</dt>
                                                    <dd className="text-slate-700">{risk.departmentName}</dd>
                                                </div>
                                                <div className="flex justify-between gap-2 items-center">
                                                    <dt>{t('common.riskLevel')}</dt>
                                                    <dd>
                                                        {levelCfg ? (
                                                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${levelCfg.chip}`}>
                                                                {tLevelLabel(risk.riskLevel)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">{t('common.notAssessed')}</span>
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                            <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-slate-100">
                                                <Button size="compact-xs" variant="default" onClick={() => navigate(`chemicalRegister-details/${risk.id}`)}>
                                                    {t('common.detail')}
                                                </Button>
                                                <Button size="compact-xs" variant="light" color="violet" onClick={() => navigate(`edit/${risk.id}`)}>
                                                    {t('common.edit')}
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
