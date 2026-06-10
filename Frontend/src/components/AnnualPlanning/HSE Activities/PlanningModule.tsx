import { useEffect, useState } from 'react';
import { IconCalendar, IconChartBar, IconCalendarStats, IconDownload } from '@tabler/icons-react';
import Dashboard from './Dashboard';
import AnnualPlanningGrid from './AnnualPlanningGrid';
import { Button, Select } from '@mantine/core';
import PageHeader from '../../UtilityComp/PageHeader';
import SegmentedFilter from '../../UtilityComp/SegmentedFilter';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { getActivitiesByYear } from '../../../services/HSEActivityService';
import { successNotification } from '../../../utility/NotificationUtility';
import { MONTHS_FR, formatDateFr } from '../planningLabels';

/**
 * Planification annuelle des activités HSE : tableau de bord de synthèse
 * et planning mensuel des inspections (IGP), réunions sécurité (RSS)
 * et tournées Leadership (TDM).
 */

const CATEGORY_LABELS: Record<string, string> = {
    IGP: 'IGP — Inspection HSE',
    HSE: 'RSS — Réunion sécurité',
    TDM: 'TDM — Tournée Leadership',
};

export default function PlanningModule() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [planningStats, setPlanningStats] = useState({ igp: 0, rss: 0, tdm: 0 });
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [_allEmployees, setAllEmployees] = useState<string[]>([]);
    const [emps, setEmps] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<any>({});
    const [activities, setActivities] = useState<any[]>([]);

    const categories = [
        { id: 'all', label: 'Toutes activités', color: 'slate' as const },
        { id: 'IGP', label: 'IGP — Inspections HSE', color: 'blue' as const },
        { id: 'HSE', label: 'RSS — Réunions sécurité', color: 'green' as const },
        { id: 'TDM', label: 'TDM — Tournées Leadership', color: 'indigo' as const },
    ];

    const departments = [
        { value: 'all', label: 'Tous départements' },
        { value: 'Production', label: 'Production' },
        { value: 'Maintenance', label: 'Maintenance' },
        { value: 'Quality', label: 'Qualité' },
        { value: 'HSE', label: 'HSE' },
        { value: 'Management', label: 'Direction' },
    ];

    useEffect(() => {
        getEmployeesWithDepartment()
            .then((res) => {
                const mappedEmployees = res.map((emp: any) => ({
                    label: emp.name,
                    value: String(emp.id),
                }));
                setEmps(mappedEmployees);
                setEmpMap(mapIdToName(res));
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!currentYear) return;
        getActivitiesByYear(currentYear)
            .then((res) => {
                setActivities(res ?? []);
            })
            .catch(() => { });
    }, [currentYear]);

    const exportCsv = () => {
        const headers = ['Titre', 'Catégorie', 'Mois', 'Date', 'Responsable', 'Département', 'Thème'];
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const lines = activities.map((act: any) => {
            const monthIdx = act.month && String(act.month).includes('-')
                ? parseInt(String(act.month).split('-')[1], 10) - 1
                : -1;
            return [
                act.title ?? '',
                CATEGORY_LABELS[act.category] ?? act.category ?? '',
                monthIdx >= 0 && monthIdx < 12 ? MONTHS_FR[monthIdx] : '',
                act.dateTime ? formatDateFr(act.dateTime) : '',
                empMap[act.responsibleId]?.name ?? '',
                empMap[act.responsibleId]?.department ?? '',
                act.theme ?? '',
            ].map(escape).join(';');
        });
        const csv = '﻿' + [headers.map(escape).join(';'), ...lines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `planning_hse_${currentYear}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        successNotification(`${activities.length} activité${activities.length > 1 ? 's' : ''} exportée${activities.length > 1 ? 's' : ''}`);
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Planification annuelle' },
                    { label: 'Activités HSE' },
                ]}
                icon={<IconCalendarStats size={22} stroke={2} />}
                iconColor="amber"
                title="Planification annuelle des activités HSE"
                subtitle="Programmation des causeries, inspections, tournées et campagnes de sensibilisation — ISO 45001 §6.1.4"
                actions={
                    <Button
                        size="sm"
                        leftSection={<IconDownload size={15} />}
                        variant="default"
                        onClick={exportCsv}
                        disabled={!activities.length}
                    >
                        Exporter CSV
                    </Button>
                }
            />

            <div className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${activeTab === 'dashboard'
                                ? 'bg-teal-600 text-white'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                        >
                            <IconChartBar className="w-3.5 h-3.5" />
                            Tableau de bord
                        </button>
                        <button
                            onClick={() => setActiveTab('planning')}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${activeTab === 'planning'
                                ? 'bg-teal-600 text-white'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                        >
                            <IconCalendar className="w-3.5 h-3.5" />
                            Planning
                        </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Select
                            value={String(currentYear)}
                            onChange={(val) => val && setCurrentYear(parseInt(val))}
                            data={[-1, 0, 1].map(offset => {
                                const year = new Date().getFullYear() + offset;
                                return { value: String(year), label: String(year) };
                            })}
                            w={90}
                            size="xs"
                            placeholder="Année"
                            aria-label="Filtrer par année"
                        />
                        <Select
                            value={selectedMonth}
                            onChange={(val) => val && setSelectedMonth(val)}
                            data={[
                                { value: 'all', label: 'Tous mois' },
                                ...MONTHS_FR.map((month, idx) => ({ value: String(idx + 1), label: month })),
                            ]}
                            w={130}
                            size="xs"
                            placeholder="Mois"
                            aria-label="Filtrer par mois"
                        />
                        <Select
                            value={selectedDepartment}
                            onChange={(val) => val && setSelectedDepartment(val)}
                            data={departments}
                            w={150}
                            size="xs"
                            placeholder="Département"
                            aria-label="Filtrer par département"
                        />
                        <Select
                            value={selectedEmployee}
                            onChange={(val) => val && setSelectedEmployee(val)}
                            data={[
                                { value: 'all', label: 'Tous employés' },
                                ...emps,
                            ]}
                            w={170}
                            size="xs"
                            placeholder="Employé"
                            searchable
                            aria-label="Filtrer par employé"
                        />
                    </div>
                </div>
            </div>

            {activeTab === 'dashboard' ? (
                <Dashboard
                    year={currentYear}
                    selectedDepartment={selectedDepartment}
                    activities={activities}
                />
            ) : (
                <div className="space-y-4">
                    <SegmentedFilter
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        options={categories.map(cat => ({
                            value: cat.id,
                            label: cat.label,
                            color: cat.color,
                            count: cat.id === 'all'
                                ? activities.length
                                : activities.filter(a => a.category === cat.id).length,
                        }))}
                    />

                    <AnnualPlanningGrid
                        year={currentYear}
                        selectedMonth={selectedMonth}
                        selectedCategory={selectedCategory}
                        selectedDepartment={selectedDepartment}
                        selectedEmployee={selectedEmployee}
                        onStatsUpdate={setPlanningStats}
                        onEmployeesUpdate={setAllEmployees}
                        planningStats={planningStats}
                        emps={emps}
                        empMap={empMap}
                        allActivities={activities}
                        setAllActivities={setActivities}
                    />
                </div>
            )}
        </div>
    );
}
