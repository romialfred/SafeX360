import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionIcon, Button, Select, TextInput, Tooltip } from '@mantine/core';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import { IconEye, IconHelmet, IconPackage, IconPlus, IconSearch } from '@tabler/icons-react';
import { getEmployeesWithPosition } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import { getAllAssignmentCounts } from '../../services/PpeEmpService';
import { getAllPPE } from '../../services/PPEService';
import PageHeader from '../UtilityComp/PageHeader';
import EmptyState from '../UtilityComp/EmptyState';
import {
    CHIP_BASE,
    ppeCategoryLabel,
    ppeStatusConfig,
    STOCK_STATUS_CONFIG,
    stockBucket,
} from './ppeLabels';

/**
 * Suivi des EPI : dotations par employé et niveaux de stock par référence,
 * avec alertes de seuil — ISO 45001 §8.1.2.
 */
const PPEMonitoring = () => {
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation('ppe');
    // Libellés bilingues : clés i18n `ppe:*`, repli sur les libellés FR centralisés (ppeLabels.ts).
    const tStockStatus = (bucket: keyof typeof STOCK_STATUS_CONFIG): string =>
        t(`stockStatus.${bucket}`, { defaultValue: STOCK_STATUS_CONFIG[bucket].label });
    const tCatalogStatus = (status?: string | null): string =>
        t(`catalogStatus.${(status ?? '').toUpperCase()}`, { defaultValue: ppeStatusConfig(status).label });
    const [ppe, setPpe] = useState<any[]>([]);
    const [ppeEmp, setPpeEmp] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            getAllPPE().then(setPpe),
            getAllAssignmentCounts().then(setPpeEmp),
            getEmployeesWithPosition().then((data) => setEmpMap(mapIdToName(data))),
        ]).finally(() => setLoading(false));
    }, []);

    const employeesTableData = useMemo(() => {
        return ppeEmp.map((emp) => ({
            ...emp,
            name: empMap[emp?.empId]?.name ?? '—',
            department: empMap[emp?.empId]?.department ?? t('common.notProvided'),
            position: empMap[emp?.empId]?.position ?? '—',
        }));
    }, [ppeEmp, empMap]);

    const departments = useMemo(
        () => [...new Set(employeesTableData.map((emp) => emp.department || t('common.notProvided')))].sort(),
        [employeesTableData]
    );

    const categoryOptions = useMemo(
        () =>
            [...new Set(ppe.map((item) => item.category))].map((cat) => ({
                value: String(cat),
                label: ppeCategoryLabel(cat),
            })),
        [ppe]
    );

    const filteredEmployees = useMemo(() => {
        const q = employeeSearch.trim().toLowerCase();
        return employeesTableData.filter((emp) => {
            if (selectedDepartment && emp.department !== selectedDepartment) return false;
            if (!q) return true;
            return [emp.name, emp.position, emp.department].filter(Boolean).join(' ').toLowerCase().includes(q);
        });
    }, [employeesTableData, selectedDepartment, employeeSearch]);

    const stockTableData = useMemo(
        () =>
            ppe
                .filter((x) => !selectedCategory || selectedCategory === x.category)
                .map((item) => ({ ...item, bucket: stockBucket(item.stock, item.minStock) })),
        [ppe, selectedCategory]
    );

    const sectionTitleStyle = {
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: '14px',
        fontWeight: 600,
    } as const;

    const skeleton = (
        <div className="flex flex-col gap-2 p-2" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
            ))}
        </div>
    );

    const actionBodyTemplate = (rowData: any) => (
        <div className="flex gap-1.5 justify-center">
            <Tooltip label={t('monitoring.tooltipViewAssignment')} withArrow>
                <ActionIcon
                    aria-label={t('monitoring.ariaViewAssignment')}
                    onClick={() => navigate(`details/${rowData.empId}`)}
                    color="teal"
                    variant="light"
                    size="sm"
                >
                    <IconEye size={14} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
        </div>
    );

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.breadcrumbHome'), to: '/' },
                    { label: t('common.breadcrumbModule') },
                    { label: t('monitoring.breadcrumb') },
                ]}
                icon={<IconHelmet size={22} stroke={2} />}
                iconColor="amber"
                title={t('monitoring.title')}
                subtitle={t('monitoring.subtitle')}
                actions={
                    <>
                        <Button
                            leftSection={<IconPlus size={14} />}
                            onClick={() => navigate('/ppe-management/create-ppe')}
                            size="sm"
                            variant="default"
                        >
                            {t('common.newPpe')}
                        </Button>
                        <Button
                            leftSection={<IconPackage size={14} />}
                            onClick={() => navigate('/ppe-management/stock-form')}
                            size="sm"
                            color="teal"
                        >
                            {t('common.stockEntry')}
                        </Button>
                    </>
                }
            />

            {/* Section 1 : dotations par employé */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200/70 flex flex-wrap items-center gap-3">
                    <div className="p-1 rounded bg-amber-100">
                        <IconHelmet size={14} className="text-amber-700" aria-hidden="true" />
                    </div>
                    <h2 className="text-slate-800" style={sectionTitleStyle}>
                        {t('monitoring.sectionEmployeesTitle')}
                    </h2>
                    <span className="text-[11.5px] text-slate-500">
                        {t('monitoring.employeeCount', { count: filteredEmployees.length })}
                    </span>
                    <div className="ml-auto flex items-center gap-2 flex-wrap">
                        <TextInput
                            placeholder={t('monitoring.searchEmployeePlaceholder')}
                            leftSection={<IconSearch size={14} />}
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.currentTarget.value)}
                            size="xs"
                            w={200}
                            aria-label={t('monitoring.searchEmployeeAria')}
                        />
                        <Select
                            placeholder={t('monitoring.filterAllDepartments')}
                            data={departments}
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            clearable
                            size="xs"
                            w={190}
                            aria-label={t('monitoring.filterDepartmentAria')}
                        />
                    </div>
                </header>
                <div className="p-2">
                    {loading ? (
                        skeleton
                    ) : !filteredEmployees.length ? (
                        <EmptyState
                            icon={<IconHelmet size={24} />}
                            title={t('monitoring.emptyAssignmentsTitle')}
                            description={t('monitoring.emptyAssignmentsDescription')}
                            compact
                        />
                    ) : (
                        <DataTable
                            value={filteredEmployees}
                            stripedRows
                            removableSort
                            paginator
                            rows={10}
                            rowsPerPageOptions={[10, 25, 50]}
                            size="small"
                            dataKey="empId"
                            className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate={t('monitoring.currentPageReport')}
                        >
                            <Column
                                field="name"
                                header={t('monitoring.colEmployee')}
                                sortable
                                body={(row) => (
                                    <div className="min-w-0">
                                        <p className="text-[13px] text-slate-800 leading-snug">{row.name}</p>
                                        <p className="text-[11.5px] text-slate-500 mt-0.5">{row.position}</p>
                                    </div>
                                )}
                            />
                            <Column
                                field="department"
                                header={t('monitoring.colDepartment')}
                                sortable
                                body={(row) => <span className="text-[12.5px] text-slate-600">{row.department}</span>}
                            />
                            <Column
                                header={t('monitoring.colAssignedPpe')}
                                sortable
                                sortField="count"
                                style={{ width: '8rem' }}
                                body={(row) => (
                                    <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11.5px] text-slate-700 tabular-nums">
                                        {t('monitoring.assignedPpeCount', { count: row.count })}
                                    </span>
                                )}
                            />
                            <Column
                                headerStyle={{ width: '6rem', textAlign: 'center' }}
                                bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                                header={t('monitoring.colActions')}
                                body={actionBodyTemplate}
                            />
                        </DataTable>
                    )}
                </div>
            </section>

            {/* Section 2 : stocks par référence */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-sky-50/60 border-b border-sky-200/70 flex flex-wrap items-center gap-3">
                    <div className="p-1 rounded bg-sky-100">
                        <IconPackage size={14} className="text-sky-700" aria-hidden="true" />
                    </div>
                    <h2 className="text-slate-800" style={sectionTitleStyle}>
                        {t('monitoring.sectionStockTitle')}
                    </h2>
                    <span className="text-[11.5px] text-slate-500">
                        {t('monitoring.referenceCount', { count: stockTableData.length })}
                    </span>
                    <div className="ml-auto">
                        <Select
                            placeholder={t('monitoring.filterAllCategories')}
                            data={categoryOptions}
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            clearable
                            size="xs"
                            w={210}
                            aria-label={t('monitoring.filterCategoryAria')}
                        />
                    </div>
                </header>
                <div className="p-2">
                    {loading ? (
                        skeleton
                    ) : !stockTableData.length ? (
                        <EmptyState
                            icon={<IconPackage size={24} />}
                            title={t('monitoring.emptyStockTitle')}
                            description={t('monitoring.emptyStockDescription')}
                            compact
                            action={
                                <Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={() => navigate('/ppe-management/create-ppe')}>
                                    {t('common.newPpe')}
                                </Button>
                            }
                        />
                    ) : (
                        <DataTable
                            value={stockTableData}
                            stripedRows
                            removableSort
                            paginator
                            rows={10}
                            rowsPerPageOptions={[10, 25, 50]}
                            size="small"
                            dataKey="id"
                            className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate={t('monitoring.currentPageReport')}
                        >
                            <Column
                                field="name"
                                header={t('monitoring.colPpe')}
                                sortable
                                body={(row) => (
                                    <div className="min-w-0">
                                        <p className="text-[13px] text-slate-800 leading-snug">{row.name}</p>
                                        <p className="text-[11.5px] text-slate-500 mt-0.5">{ppeCategoryLabel(row.category)}</p>
                                    </div>
                                )}
                            />
                            <Column
                                align="center"
                                header={t('monitoring.colCurrentStock')}
                                sortable
                                sortField="stock"
                                style={{ width: '8.5rem' }}
                                body={(row) => (
                                    <span
                                        className={`text-[13px] tabular-nums ${
                                            row.bucket === 'OUT'
                                                ? 'text-rose-700'
                                                : row.bucket === 'LOW'
                                                ? 'text-amber-700'
                                                : 'text-slate-800'
                                        }`}
                                    >
                                        {row.stock ?? 0}
                                    </span>
                                )}
                            />
                            <Column
                                align="center"
                                field="minStock"
                                header={t('monitoring.colMinStock')}
                                sortable
                                style={{ width: '9rem' }}
                                body={(row) => <span className="text-[12.5px] text-slate-600 tabular-nums">{row.minStock ?? 0}</span>}
                            />
                            <Column
                                align="center"
                                header={t('monitoring.colStockStatus')}
                                sortable
                                sortField="bucket"
                                style={{ width: '9.5rem' }}
                                body={(row) => {
                                    const bucket = row.bucket as keyof typeof STOCK_STATUS_CONFIG;
                                    const cfg = STOCK_STATUS_CONFIG[bucket];
                                    return <span className={`${CHIP_BASE} ${cfg.chip}`}>{tStockStatus(bucket)}</span>;
                                }}
                            />
                            <Column
                                align="center"
                                header={t('monitoring.colCatalog')}
                                sortable
                                sortField="status"
                                style={{ width: '8rem' }}
                                body={(row) => {
                                    const cfg = ppeStatusConfig(row.status);
                                    return <span className={`${CHIP_BASE} ${cfg.chip}`}>{tCatalogStatus(row.status)}</span>;
                                }}
                            />
                        </DataTable>
                    )}
                </div>
            </section>
        </div>
    );
};

export default PPEMonitoring;
