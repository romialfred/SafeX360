import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {
    ActionIcon,
    Badge,
    Button,
    Select,
    TextInput,
    Tooltip,
} from '@mantine/core';
import {
    IconEdit,
    IconSearch,
    IconUpload,
    IconLayoutGrid,
    IconLayoutList,
    IconSparkles,
    IconUser,
    IconUsersGroup,
    IconAlertTriangle,
    IconCategory,
} from '@tabler/icons-react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import IncidentCard from './IncidentCard';
import SafetyKpiPanel from './SafetyKpiPanel';
import EmptyState from '../../UtilityComp/EmptyState';
import { IconShieldExclamation } from '@tabler/icons-react';

import { getAllIncidents } from '../../../services/IncidentService';
import { INCIDENT_STATUS_OPTIONS, incidentStatusLabel, incidentStatusColor } from './incidentLabels';
import { formatDateShort } from '../../../utility/DateFormats';
import { getUniqueSeverityLevel } from '../../../services/SeverityLevelService';
import { getAllActiveIncidentCategories } from '../../../services/IncidentCategory';
import { getAllDepartments } from '../../../services/HrmsService';
import { getTailwindColorForSeverityLevel, mapIdToName } from '../../../utility/OtherUtilities';
import { getEmployeesByIds } from '../../../services/EmployeeService';



const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const IncidentManagementData = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('incidents');
    // Libellé de statut bilingue : clé i18n `incidents:status.*`, repli sur le libellé FR centralisé.
    const tStatus = (code?: string | null): string =>
        code ? t(`status.${String(code).toUpperCase()}`, { defaultValue: incidentStatusLabel(code) }) : '—';
    // Options de statut traduites pour le <Select> de filtre (mêmes valeurs backend).
    const statusOptions = INCIDENT_STATUS_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`status.${o.value}`, { defaultValue: o.label }),
    }));
    const [selectedLevel, setSelectedLevel] = useState<string>('All');
    const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');
    // Source filter : ALL / EMPLOYEE / AI — permet de distinguer les declarations classiques
    // des declarations assistees par IA Vision (wizard Declaration par IA).
    const [selectedSource, setSelectedSource] = useState<'ALL' | 'EMPLOYEE' | 'AI'>('ALL');
    // Filtre Haut Potentiel (ICMM / ISO 45001 §6.1.2) : n'affiche que les incidents
    // à pire scénario crédible grave/mortel (highPotential dérivé serveur). Permet au
    // HSE de piloter en priorité les événements à potentiel élevé (fil « HPI »).
    const [hpiOnly, setHpiOnly] = useState<boolean>(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const toast = useRef<Toast>(null);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [levels, setLevels] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    // removed: selectedCategory, setSelectedCategory
    const [selectedStatus, setSelectedStatus] = useState<string | null>('All');
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>('All');
    const [deptMap, setDeptMap] = useState<Record<number, any>>({});
    const [departments, setDepartments] = useState<any[]>([]);
    const [emps, setEmps] = useState<Record<number, any>>({});


    useEffect(() => {
        getAllIncidents()
            .then((res) => {

                setIncidents(res);
                getEmployeesByIds(res.map((x: any) => x.reporterId)).then((emps: any) => {
                    setEmps(mapIdToName(emps));
                }).catch((_err) => console.error(_err));

            })
            .catch((_err) => console.error(_err));

        getAllDepartments()
            .then((res) => {
                setDeptMap(mapIdToName(res));
                setDepartments(res.map((dept: any) => ({
                    label: dept.name,
                    value: "" + dept.id,
                })));
            }).catch((_err) => console.error(_err));


        getUniqueSeverityLevel()
            .then((res) => {
                const uniqueLevels = res.map((level: any) => ({
                    label: level.name,
                    value: "" + level.level,
                }));
                setLevels([{ label: "Tous", value: "All" }, ...uniqueLevels]);
            })
            .catch((err) => {
                console.error('Error fetching unique severity levels:', err);
            });

        getAllActiveIncidentCategories()
            .then((res) => {
                const cats = res.map((c: any) => c.name);
                setCategories(['All', ...cats]);
            })
            .catch((err) => {
                console.error('Error fetching categories:', err);
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

    /**
     * Indique si l'incident provient du wizard "Declaration par IA".
     * Detecte via :
     *  1) Champ DTO incident.source === 'AI' (nouveau, post-LOT 49)
     *  2) Fallback : titre commencant par "[IA]" (compat retro pour incidents migres)
     */
    const isAIIncident = (incident: any): boolean => {
        if (!incident) return false;
        if (typeof incident.source === 'string' && incident.source.toUpperCase() === 'AI') return true;
        if (typeof incident.title === 'string' && incident.title.trim().startsWith('[IA]')) return true;
        return false;
    };

    const nameBodyTemplate = (rowData: any) => {
        const ai = isAIIncident(rowData);
        // On nettoie le prefixe [IA] visuel : le badge le remplace
        const cleanTitle = ai && rowData.title ? rowData.title.replace(/^\[IA\]\s*/i, '') : rowData.title;
        return (
            <div className="flex items-center gap-2">
                <Link to={`${rowData.id}`} className='hover:underline text-blue-500'>
                    {cleanTitle}
                </Link>
                {ai && (
                    <Tooltip label={rowData.aiConfidence ? t('list.aiBadgeTooltipConf', { conf: Math.round(rowData.aiConfidence * 100) }) : t('list.aiBadgeTooltip')}>
                        <Badge
                            size="xs"
                            radius="sm"
                            variant="light"
                            color="violet"
                            leftSection={<IconSparkles size={10} />}
                            styles={{ root: { textTransform: 'none', fontWeight: 600, cursor: 'help' } }}
                        >
                            IA
                        </Badge>
                    </Tooltip>
                )}
            </div>
        );
    };

    /** Export CSV simple du registre filtré (colonnes visibles). */
    const handleExportCsv = () => {
        const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = [t('list.colNumber'), t('list.colIncident'), t('list.colCategory'), t('list.colDepartment'), t('list.colReporter'), t('list.colSeverity'), t('list.colDate'), t('list.colStatus')];
        const rows = filteredData.map((i: any) => [
            i.number, i.title, i.incidentCategoryName, i.departmentName, i.reporterName,
            i.severityLevelName, formatDateShort(i.incidentDate), tStatus(i.status),
        ].map(esc).join(';'));
        const blob = new Blob(['﻿' + [header.map(esc).join(';'), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const rightToolbarTemplate = () => (
        <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1 border border-primary rounded-lg p-1 bg-gray-100">
                <Tooltip label={t('list.tableView')}>
                    <ActionIcon
                        variant={viewType === 'table' ? 'filled' : 'light'}
                        color="blue"
                        aria-label={t('list.tableView')}
                        onClick={() => setViewType('table')}
                    >
                        <IconLayoutList size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={t('list.cardView')}>
                    <ActionIcon
                        variant={viewType === 'card' ? 'filled' : 'light'}
                        color="blue"
                        aria-label={t('list.cardView')}
                        onClick={() => setViewType('card')}
                    >
                        <IconLayoutGrid size={18} />
                    </ActionIcon>
                </Tooltip>
            </div>
            <Button size="sm" variant="outline" leftSection={<IconUpload />} onClick={handleExportCsv}>
                {t('list.export')}
            </Button>
            <TextInput
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                size="sm"
                placeholder={t('list.search')}
                leftSection={<IconSearch />}
            />
        </div>
    );

    // Gravité → liste déroulante (les niveaux à compteur 0 ne sont pas proposés).
    const severitySelectData = () => {
        const opts = levels
            .filter((l) => l.value !== 'All')
            .map((l) => ({
                value: l.value,
                name: l.label,
                count: incidents.filter((x) => x.maxSeverityLevel == l.value).length,
            }))
            .filter((o) => o.count > 0)
            .map((o) => ({ value: o.value, label: `${o.name} (${o.count})` }));
        return [{ value: 'All', label: t('list.allSeverities', { count: incidents.length }) }, ...opts];
    };

    const leftToolbarTemplate = () => (
        <Select
            allowDeselect={false}
            size="sm"
            w={230}
            aria-label={t('list.filterBySeverity')}
            leftSection={<IconAlertTriangle size={15} />}
            data={severitySelectData()}
            value={selectedLevel}
            onChange={(value) => value && setSelectedLevel(value)}
            comboboxProps={{ withinPortal: true }}
        />
    );

    // Catégories : on n'affiche que celles ayant au moins un incident (compteur absolu > 0).
    // Le compteur affiché reste, lui, croisé avec le filtre de gravité actif.
    // Catégorie → liste déroulante compacte (n'affiche que les catégories ayant au
    // moins un incident). Le compteur reste croisé avec le filtre de gravité actif.
    const categorySelectData = () => {
        const visibleCats = [
            'All',
            ...categories.filter(
                (c) => c !== 'All' && incidents.filter((x: any) => x.incidentCategoryName === c).length > 0,
            ),
        ];
        return visibleCats.map((cat) => {
            const isAll = cat === 'All';
            const count = incidents.filter(
                (x: any) =>
                    (selectedLevel === 'All' || x.maxSeverityLevel == selectedLevel) &&
                    (isAll || x.incidentCategoryName === cat),
            ).length;
            return { value: cat, label: `${isAll ? t('list.all') : cat} (${count})` };
        });
    };

    const categorySelectTemplate = () => (
        <Select
            allowDeselect={false}
            size="sm"
            w={220}
            aria-label={t('list.colCategory')}
            leftSection={<IconCategory size={15} />}
            data={categorySelectData()}
            value={selectedCategoryTab}
            onChange={(value) => value && setSelectedCategoryTab(value)}
            comboboxProps={{ withinPortal: true }}
        />
    );

    const dropdownFilterTemplate = () => (
        <div className="flex items-center gap-2">
            <Select allowDeselect={false}
                size='sm'
                aria-label={t('list.filterByStatus')}
                data={[{ label: t('list.allStatuses'), value: "All" }, ...statusOptions]}
                value={selectedStatus}
                onChange={setSelectedStatus}
            />
            <Select allowDeselect={false}
                size='sm'
                aria-label={t('list.filterByDepartment')}
                data={[{ label: t('list.allDepartments'), value: "All" }, ...departments]}
                value={selectedDepartment}
                onChange={setSelectedDepartment}

            />
        </div>
    );

    // const getSeverityTemplate = (order: any) => {
    //     switch (order) {
    //         case 1: return 'info';
    //         case 2: return 'secondary';
    //         case 3: return 'warning';
    //         case 4: return 'danger';
    //         default: return null;
    //     }
    // };

    // Map severity level to Tailwind color classes

    const levelBodyTemplate = (rowData: any) => {
        const level = rowData.maxSeverityLevel;
        const severityLevelName = rowData.severityLevelName || '—';
        return (
            <span className={`px-2 py-1 rounded text-xs w-fit capitalize ${getTailwindColorForSeverityLevel(level)}`}>
                {`${level} - ${severityLevelName}`}
            </span>
        );
    };

    // const getOrderSeverity = (order: any) => {
    //     switch (order) {
    //         case 'RESOLVED': return 'success';
    //         case 'ACTION_TAKEN': return 'danger';
    //         case 'REPORTED': return 'warning';
    //         case 'CLOSED': return 'info';
    //         default: return null;
    //     }
    // };

    // Couleur de badge sémantique par statut : source unique `incidentStatusColor`
    // (incidentLabels.ts), alignée sur les VRAIS statuts du workflow
    // PENDING/REPORTED/INVESTIGATION/INVESTIGATION_COMPLETED/CORRECTIVE_ACTIONS/CLOSED/REJECTED.
    // (L'ancienne carte locale utilisait des noms d'enum périmés → badges gris.)
    const getSeverity = (rowData: any) => {
        const color = incidentStatusColor(rowData?.status);
        return (
            <Badge
                radius="xl"
                size="sm"
                className="whitespace-nowrap"
                color={color}
                variant="light"
            >
                {tStatus(rowData.status)}
            </Badge>
        );
    };

    const actionBodyTemplate = (rowData: any) => {
        const statusUpper = String(rowData?.status || '').toUpperCase();
        const isClosed = statusUpper === 'CLOSED';
        const isRejected = statusUpper === 'REJECTED';
        const canEdit = !(isClosed || isRejected);
        const canInvestigate = !(isClosed || isRejected);
        const editTooltip = canEdit ? t('list.edit') : (isClosed ? t('list.editClosed') : t('list.editRejected'));
        const invTooltip = canInvestigate ? t('list.investigate') : (isClosed ? t('list.investigateClosed') : t('list.investigateRejected'));
        return (
            <div className='flex gap-3 justify-center'>
                <Tooltip label={editTooltip}>
                    <span className="inline-flex">
                        <ActionIcon aria-label={editTooltip} onClick={() => { if (canEdit) navigate(`edit/${rowData.id}`); }} variant="filled" size="sm" color="primary" disabled={!canEdit}>
                            <IconEdit style={{ width: '90%', height: '90%' }} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>
                <Tooltip label={invTooltip}>
                    <span className="inline-flex">
                        <ActionIcon aria-label={invTooltip} onClick={() => { if (canInvestigate) navigate(`investigation/${rowData.id}`); }} variant="filled" size="sm" color="blue" disabled={!canInvestigate}>
                            <IconSearch style={{ width: '90%', height: '90%' }} stroke={1.5} />
                        </ActionIcon>
                    </span>
                </Tooltip>

            </div>
        );
    };

    // Enrich incidents so table rerenders when dept/emps maps load
    const enrichedIncidents = useMemo(() => {
        return incidents.map((i: any) => ({
            ...i,
            departmentName: deptMap[i?.departmentId]?.name ?? '—',
            reporterName: emps[i?.reporterId]?.name ?? '—',
        }));
    }, [incidents, deptMap, emps]);

    // Compteurs source (calcules sur incidents bruts pour rester stables independamment des autres filtres)
    const sourceCounts = useMemo(() => {
        const ai = enrichedIncidents.filter(isAIIncident).length;
        return { all: enrichedIncidents.length, ai, employee: enrichedIncidents.length - ai };
    }, [enrichedIncidents]);

    const filteredData = useMemo(() => {
        return enrichedIncidents.filter((incident: any) => {
            const levelMatch = selectedLevel === 'All' || incident.maxSeverityLevel == selectedLevel;
            const categoryMatch = selectedCategoryTab === 'All' || incident.incidentCategoryName === selectedCategoryTab;
            const statusMatch = selectedStatus === 'All' || incident.status === selectedStatus;
            const departmentMatch = selectedDepartment === 'All' || (incident.departmentId && selectedDepartment === "" + incident.departmentId);
            const ai = isAIIncident(incident);
            const sourceMatch =
                selectedSource === 'ALL' ||
                (selectedSource === 'AI' && ai) ||
                (selectedSource === 'EMPLOYEE' && !ai);
            const hpiMatch = !hpiOnly || incident.highPotential === true;
            return levelMatch && categoryMatch && statusMatch && departmentMatch && sourceMatch && hpiMatch;
        });
    }, [enrichedIncidents, selectedLevel, selectedCategoryTab, selectedStatus, selectedDepartment, selectedSource, hpiOnly]);

    /**
     * Bandeau de filtre Source — pleine largeur, premiere ligne au-dessus de la table.
     * Distingue 3 segments : Tous / Employes / IA.
     * Pattern visuel aligne sur la palette plateforme (vert teal + indigo IA).
     */
    const sourceFilterBanner = (
        <div className="mb-3 flex items-center gap-2 flex-wrap rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
                {/* TOUS */}
                <button
                    type="button"
                    onClick={() => setSelectedSource('ALL')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors border ${
                        selectedSource === 'ALL'
                            ? 'bg-slate-100 text-slate-800 border-slate-300 font-medium shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    <IconUsersGroup size={14} />
                    {t('list.allSources')}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                        selectedSource === 'ALL' ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                        {sourceCounts.all}
                    </span>
                </button>
                {/* EMPLOYES */}
                <button
                    type="button"
                    onClick={() => setSelectedSource('EMPLOYEE')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors border ${
                        selectedSource === 'EMPLOYEE'
                            ? 'bg-teal-100 text-teal-800 border-teal-300 font-medium shadow-sm'
                            : 'bg-teal-50/50 text-teal-700 border-teal-100 hover:bg-teal-50'
                    }`}
                >
                    <IconUser size={14} className="text-teal-500" />
                    {t('list.employees')}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                        selectedSource === 'EMPLOYEE' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                        {sourceCounts.employee}
                    </span>
                </button>
                {/* IA */}
                <button
                    type="button"
                    onClick={() => setSelectedSource('AI')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors border ${
                        selectedSource === 'AI'
                            ? 'bg-violet-100 text-violet-800 border-violet-300 font-medium shadow-sm'
                            : 'bg-violet-50/50 text-violet-700 border-violet-100 hover:bg-violet-50'
                    }`}
                >
                    <IconSparkles size={14} className="text-violet-500" />
                    {t('list.ai')}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                        selectedSource === 'AI' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                        {sourceCounts.ai}
                    </span>
                </button>
            </div>
            {/* Filtre Haut Potentiel (ICMM / ISO 45001 §6.1.2) — bascule dédiée. */}
            <button
                type="button"
                onClick={() => setHpiOnly((v) => !v)}
                aria-pressed={hpiOnly}
                title={t('list.hpiTooltip')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors border ${
                    hpiOnly
                        ? 'bg-amber-100 text-amber-800 border-amber-300 font-medium shadow-sm'
                        : 'bg-amber-50/50 text-amber-700 border-amber-100 hover:bg-amber-50'
                }`}
            >
                <IconAlertTriangle size={14} className="text-amber-500" />
                {t('list.hpi')}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                    hpiOnly ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-500'
                }`}>
                    {enrichedIncidents.filter((x: any) => x.highPotential === true).length}
                </span>
            </button>
            {/* Affichage tuile/tableau + Export + Recherche — poussés à droite, même ligne que les sources. */}
            <div className="ml-auto">{rightToolbarTemplate()}</div>
        </div>
    );

    return (
        <div className="card">
            <Toast ref={toast} />
            {/* Indicateurs de fréquence des lésions (ISO 45001 §9.1.1 — LTIFR/TRIFR). */}
            <div className="mb-3"><SafetyKpiPanel /></div>
            {/* Ligne 1 : sources (sans libellé, à gauche) + affichage / export / recherche (à droite). */}
            {sourceFilterBanner}
            {/* Ligne 2 : tous les filtres regroupés — gravité · catégorie · statut · département. */}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
                {leftToolbarTemplate()}
                {categorySelectTemplate()}
                {dropdownFilterTemplate()}
            </div>
            {
                viewType === 'table' ? (
                    <DataTable
                        selectionMode="single"
                        className='[&_.p-datatable-tbody]:!text-sm'
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
                        globalFilterFields={['title', 'incidentCategoryName', 'status', 'departmentName', 'reporterName']}
                        currentPageReportTemplate={t('list.paginator')}
                        emptyMessage={t('list.emptyTable')}
                        onFilter={(e) => setFilters(e.filters)}
                    >
                        <Column style={{ fontWeight: 'normal' }} field="title" body={nameBodyTemplate} header={t('list.colIncident')} sortable />
                        <Column style={{ fontWeight: 'normal' }} field="incidentCategoryName" header={t('list.colCategory')} />
                        <Column style={{ fontWeight: 'normal' }} field="departmentName" header={t('list.colDepartment')} />
                        <Column style={{ fontWeight: 'normal' }} field="reporterName" header={t('list.colReporter')} />
                        <Column style={{ fontWeight: 'normal' }} field="severity" header={t('list.colSeverity')} body={levelBodyTemplate} />
                        <Column style={{ fontWeight: 'normal' }} field="incidentDate" header={t('list.colDate')} body={(rowData: any) => formatDateShort(rowData.incidentDate)} />
                        <Column style={{ fontWeight: 'normal' }} field="status" header={t('list.colStatus')} body={getSeverity} />
                        <Column bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
                    </DataTable>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {filteredData.map((incidentData) => (
                            <IncidentCard key={incidentData.id} incidentData={incidentData} emps={emps} />
                        ))}
                        {/* LOT 41 E: EmptyState unifié pour la vue carte */}
                        {filteredData.length === 0 && (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={<IconShieldExclamation size={28} />}
                                    title={t('list.emptyCardTitle')}
                                    description={t('list.emptyCardBody')}
                                    iconColor="slate"
                                />
                            </div>
                        )}
                    </div>
                )
            }
        </div>
    );
};

export default IncidentManagementData; 
