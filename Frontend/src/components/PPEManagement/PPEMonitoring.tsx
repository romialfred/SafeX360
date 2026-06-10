import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
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
            department: empMap[emp?.empId]?.department ?? 'Non renseigné',
            position: empMap[emp?.empId]?.position ?? '—',
        }));
    }, [ppeEmp, empMap]);

    const departments = useMemo(
        () => [...new Set(employeesTableData.map((emp) => emp.department || 'Non renseigné'))].sort(),
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
            <Tooltip label="Consulter la dotation" withArrow>
                <ActionIcon
                    aria-label="Consulter la dotation EPI de l'employé"
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
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des EPI' },
                    { label: 'Suivi des EPI' },
                ]}
                icon={<IconHelmet size={22} stroke={2} />}
                iconColor="amber"
                title="Suivi des EPI"
                subtitle="Dotations par employé et niveaux de stock des équipements de protection"
                actions={
                    <>
                        <Button
                            leftSection={<IconPlus size={14} />}
                            onClick={() => navigate('/ppe-management/create-ppe')}
                            size="sm"
                            variant="default"
                        >
                            Nouvel EPI
                        </Button>
                        <Button
                            leftSection={<IconPackage size={14} />}
                            onClick={() => navigate('/ppe-management/stock-form')}
                            size="sm"
                            color="teal"
                        >
                            Entrée de stock
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
                        Dotations par employé
                    </h2>
                    <span className="text-[11.5px] text-slate-500">
                        {filteredEmployees.length} employé{filteredEmployees.length > 1 ? 's' : ''}
                    </span>
                    <div className="ml-auto flex items-center gap-2 flex-wrap">
                        <TextInput
                            placeholder="Rechercher un employé…"
                            leftSection={<IconSearch size={14} />}
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.currentTarget.value)}
                            size="xs"
                            w={200}
                            aria-label="Rechercher un employé"
                        />
                        <Select
                            placeholder="Tous départements"
                            data={departments}
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            clearable
                            size="xs"
                            w={190}
                            aria-label="Filtrer par département"
                        />
                    </div>
                </header>
                <div className="p-2">
                    {loading ? (
                        skeleton
                    ) : !filteredEmployees.length ? (
                        <EmptyState
                            icon={<IconHelmet size={24} />}
                            title="Aucune dotation trouvée"
                            description="Aucun employé ne correspond aux critères. Élargissez la recherche ou changez de département."
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
                            currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                        >
                            <Column
                                field="name"
                                header="Employé"
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
                                header="Département"
                                sortable
                                body={(row) => <span className="text-[12.5px] text-slate-600">{row.department}</span>}
                            />
                            <Column
                                header="EPI dotés"
                                sortable
                                sortField="count"
                                style={{ width: '8rem' }}
                                body={(row) => (
                                    <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11.5px] text-slate-700 tabular-nums">
                                        {row.count} EPI
                                    </span>
                                )}
                            />
                            <Column
                                headerStyle={{ width: '6rem', textAlign: 'center' }}
                                bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                                header="Actions"
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
                        Niveaux de stock
                    </h2>
                    <span className="text-[11.5px] text-slate-500">
                        {stockTableData.length} référence{stockTableData.length > 1 ? 's' : ''}
                    </span>
                    <div className="ml-auto">
                        <Select
                            placeholder="Toutes catégories"
                            data={categoryOptions}
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            clearable
                            size="xs"
                            w={210}
                            aria-label="Filtrer par catégorie"
                        />
                    </div>
                </header>
                <div className="p-2">
                    {loading ? (
                        skeleton
                    ) : !stockTableData.length ? (
                        <EmptyState
                            icon={<IconPackage size={24} />}
                            title="Aucun EPI au catalogue"
                            description="Créez une première référence EPI puis enregistrez une entrée de stock."
                            compact
                            action={
                                <Button size="xs" color="teal" leftSection={<IconPlus size={14} />} onClick={() => navigate('/ppe-management/create-ppe')}>
                                    Nouvel EPI
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
                            currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                        >
                            <Column
                                field="name"
                                header="EPI"
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
                                header="Stock actuel"
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
                                header="Stock minimum"
                                sortable
                                style={{ width: '9rem' }}
                                body={(row) => <span className="text-[12.5px] text-slate-600 tabular-nums">{row.minStock ?? 0}</span>}
                            />
                            <Column
                                align="center"
                                header="Statut de stock"
                                sortable
                                sortField="bucket"
                                style={{ width: '9.5rem' }}
                                body={(row) => {
                                    const cfg = STOCK_STATUS_CONFIG[row.bucket as keyof typeof STOCK_STATUS_CONFIG];
                                    return <span className={`${CHIP_BASE} ${cfg.chip}`}>{cfg.label}</span>;
                                }}
                            />
                            <Column
                                align="center"
                                header="Catalogue"
                                sortable
                                sortField="status"
                                style={{ width: '8rem' }}
                                body={(row) => {
                                    const cfg = ppeStatusConfig(row.status);
                                    return <span className={`${CHIP_BASE} ${cfg.chip}`}>{cfg.label}</span>;
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
