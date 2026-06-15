import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Button, Select, TextInput, Tooltip } from '@mantine/core';
import {
    IconDownload,
    IconEdit,
    IconEye,
    IconLayoutGrid,
    IconLayoutList,
    IconPlus,
    IconSearch,
} from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RiskCards from './RiskCards';
import EmptyState from '../../UtilityComp/EmptyState';
import { getAllRisk } from '../../../services/RiskRegisterService';
import { getAllDepartments } from '../../../services/HrmsService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { GetAllWorkProcess } from '../../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { riskMap } from '../../../Data/DropdownData';
import {
    RISK_LEVEL_OPTIONS,
    RISK_STATUS_OPTIONS,
    normalizeRiskStatus,
    riskLevelFromKey,
    riskStatusConfig,
} from '../riskLabels';

/**
 * Tableau du registre des risques (LOT 50) : barre de filtres, export CSV,
 * vue tableau / cartes, chips de niveau et de statut charte R7.
 */

const ALL = 'all';

const RiskDataTable = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('risk');
    // Statut/niveau bilingues : clé i18n d'abord, repli sur le libellé FR centralisé.
    const tStatusLabel = (status?: string | null): string => {
        const cfg = riskStatusConfig(status);
        return t(`status.${normalizeRiskStatus(status)}`, { defaultValue: cfg.label });
    };
    const tLevelLabel = (key?: string | null): string => {
        const cfg = riskLevelFromKey(key);
        return cfg ? t(`level.${riskMap[String(key)]?.level}`, { defaultValue: cfg.label }) : '';
    };
    // Options de niveau / statut traduites pour les <Select> (valeurs backend conservées).
    const levelOptions = RISK_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: t(`level.${o.value}`, { defaultValue: o.label }) }));
    const statusOptions = RISK_STATUS_OPTIONS.map((o) => ({ value: o.value, label: t(`status.${o.value}`, { defaultValue: o.label }) }));
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [loading, setLoading] = useState(true);
    const [risks, setRisks] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [processMap, setProcessMap] = useState<Record<string, any>>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});

    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string>(ALL);
    const [riskLevelFilter, setRiskLevelFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>(ALL);

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
        getAllRisk()
            .then((res) => setRisks(res ?? []))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('register.loadFailed'));
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

    const filteredData = useMemo(() => {
        const q = search.trim().toLowerCase();
        return enrichedRisks.filter((risk: any) => {
            if (departmentFilter !== ALL && String(risk.departmentId) !== departmentFilter) return false;
            if (riskLevelFilter && riskMap[risk.riskLevel]?.level !== riskLevelFilter) return false;
            if (statusFilter !== ALL && normalizeRiskStatus(risk.status) !== statusFilter) return false;
            if (!q) return true;
            const haystack = [
                risk.title,
                risk.description,
                risk.hazardSource,
                risk.departmentName,
                risk.processName,
                risk.ownerName,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [enrichedRisks, search, departmentFilter, riskLevelFilter, statusFilter]);

    const hasActiveFilters =
        search.trim() !== '' || departmentFilter !== ALL || riskLevelFilter !== null || statusFilter !== ALL;

    const resetFilters = () => {
        setSearch('');
        setDepartmentFilter(ALL);
        setRiskLevelFilter(null);
        setStatusFilter(ALL);
    };

    const exportCsv = () => {
        const headers = [
            t('register.col.risk'),
            t('register.col.hazardSource'),
            t('register.col.department'),
            t('register.col.process'),
            t('register.col.owner'),
            t('register.col.level'),
            t('register.col.status'),
        ];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = filteredData.map((row: any) =>
            [
                row.title,
                row.hazardSource ?? '',
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
        link.download = `${t('register.csvFilename')}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(t('common.exported', { count: filteredData.length }));
    };

    // ─── Rendus de colonnes ──────────────────────────────────────────────────

    const titleBody = (row: any) => (
        <div className="min-w-0 max-w-md">
            <p className="text-[13px] text-slate-800 leading-snug line-clamp-2">{row.title}</p>
            {row.hazardSource && (
                <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">{row.hazardSource}</p>
            )}
        </div>
    );

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

    const actionBody = (row: any) => (
        <div className="flex gap-1.5 justify-center">
            <Tooltip label={t('common.viewDetail')} withArrow>
                <ActionIcon
                    variant="light"
                    size="sm"
                    color="violet"
                    onClick={() => navigate(`register-details/${row.id}`)}
                    aria-label={t('common.viewRiskDetail')}
                >
                    <IconEye size={14} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label={t('common.editRisk')} withArrow>
                <ActionIcon
                    variant="light"
                    size="sm"
                    color="blue"
                    onClick={() => navigate(`edit/${row.id}`)}
                    aria-label={t('common.editRisk')}
                >
                    <IconEdit size={14} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
        </div>
    );

    return (
        <div className="space-y-3">
            {/* Barre de filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                        placeholder={t('register.searchPlaceholder')}
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        size="xs"
                        className="flex-1 min-w-[220px]"
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
                    <Select
                        data={[{ value: ALL, label: t('common.allStatuses') }, ...statusOptions]}
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v ?? ALL)}
                        size="xs"
                        w={150}
                        aria-label={t('common.filterByStatus')}
                    />
                    <div className="flex items-center gap-2 ml-auto">
                        <Button
                            variant="default"
                            size="xs"
                            leftSection={<IconDownload size={14} />}
                            onClick={exportCsv}
                            disabled={!filteredData.length}
                        >
                            {t('common.exportCsv')}
                        </Button>
                        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                            <Tooltip label={t('common.tableView')} withArrow>
                                <ActionIcon
                                    variant={viewType === 'table' ? 'filled' : 'subtle'}
                                    color="teal"
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
                                    color="teal"
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
                        : t('common.displayedOf', { count: filteredData.length, total: risks.length })}
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
                ) : !filteredData.length ? (
                    <EmptyState
                        icon={<IconSearch size={24} />}
                        title={hasActiveFilters ? t('common.noMatchTitle') : t('register.emptyTitle')}
                        description={
                            hasActiveFilters
                                ? t('register.broadenSearchFull')
                                : t('register.emptyDescription')
                        }
                        compact
                        action={
                            hasActiveFilters ? (
                                <Button variant="default" size="xs" onClick={resetFilters}>
                                    {t('common.resetFilters')}
                                </Button>
                            ) : (
                                <Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={() => navigate('register-form')}>
                                    {t('register.newRisk')}
                                </Button>
                            )
                        }
                    />
                ) : viewType === 'table' ? (
                    <DataTable
                        value={filteredData}
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
                        <Column header={t('register.col.risk')} body={titleBody} sortable sortField="title" />
                        <Column
                            header={t('register.col.department')}
                            body={(row) => <span className="text-[12.5px] text-slate-600">{row.departmentName}</span>}
                            sortable
                            sortField="departmentName"
                            style={{ width: '10rem' }}
                        />
                        <Column
                            header={t('register.col.process')}
                            body={(row) => <span className="text-[12.5px] text-slate-600">{row.processName}</span>}
                            sortable
                            sortField="processName"
                            style={{ width: '10rem' }}
                        />
                        <Column
                            header={t('register.col.owner')}
                            body={(row) => <span className="text-[12.5px] text-slate-600">{row.ownerName}</span>}
                            sortable
                            sortField="ownerName"
                            style={{ width: '10rem' }}
                        />
                        <Column header={t('register.col.level')} body={levelBody} sortable sortField="levelRank" style={{ width: '9rem' }} />
                        <Column header={t('register.col.status')} body={statusBody} sortable sortField="status" style={{ width: '8rem' }} />
                        <Column header={t('register.col.actions')} body={actionBody} headerStyle={{ width: '6rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                    </DataTable>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
                        {filteredData.map((risk: any) => (
                            <RiskCards
                                key={risk.id}
                                risk={risk}
                                department={risk?.departmentName}
                                process={risk?.processName}
                                owner={risk?.ownerName}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskDataTable;
