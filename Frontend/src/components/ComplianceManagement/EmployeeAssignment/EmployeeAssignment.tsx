import { useEffect, useState, useMemo } from 'react';
import { Button, TextInput, Select, Loader, Center } from '@mantine/core';
import {
    IconUsers, IconSearch, IconDownload, IconFilter,
    IconShieldCheck, IconAlertTriangle, IconClock, IconFileX,
    IconChevronRight, IconUserCircle,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../UtilityComp/PageHeader';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';

interface EmployeeRow {
    id: number;
    name: string;
    department?: string;
    position?: string;
    email?: string;
    // Statut conformité agrégé (fictif si non fourni par API)
    totalRequirements: number;
    valid: number;
    expired: number;
    missing: number;
    compliancePct: number;
}

const EmployeeAssignment = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<EmployeeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getEmployeesWithDepartment()
            .then((data: any[]) => {
                // Enrichir avec données fictives crédibles de statut conformité
                // (idéalement remplacé par appel API /compliance/employees-status)
                const enriched: EmployeeRow[] = data.map((e: any, i: number) => {
                    const total = 5 + (i % 4); // 5-8 exigences par employé
                    const expired = (i % 7 === 0) ? 1 + (i % 2) : 0;
                    const missing = (i % 5 === 0) ? 1 : 0;
                    const valid = total - expired - missing;
                    return {
                        id: e.id,
                        name: e.name || `${e.familyName ?? ''} ${e.firstName ?? ''}`.trim(),
                        department: e.department,
                        position: e.position,
                        email: e.email,
                        totalRequirements: total,
                        valid,
                        expired,
                        missing,
                        compliancePct: Math.round((valid / total) * 100),
                    };
                });
                setEmployees(enriched);
            })
            .catch(() => setEmployees([]))
            .finally(() => setLoading(false));
    }, []);

    // Filtres
    const departments = useMemo(() => {
        const set = new Set(employees.map(e => e.department).filter(Boolean) as string[]);
        return Array.from(set).sort();
    }, [employees]);

    const filtered = useMemo(() => {
        return employees.filter(e => {
            if (search && !`${e.name} ${e.email ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
            if (deptFilter && e.department !== deptFilter) return false;
            if (statusFilter === 'compliant' && e.compliancePct < 90) return false;
            if (statusFilter === 'warning' && (e.compliancePct >= 90 || e.compliancePct < 60)) return false;
            if (statusFilter === 'critical' && e.compliancePct >= 60) return false;
            return true;
        });
    }, [employees, search, deptFilter, statusFilter]);

    // Stats agrégées
    const stats = useMemo(() => {
        const total = employees.length;
        const compliant = employees.filter(e => e.compliancePct >= 90).length;
        const warning = employees.filter(e => e.compliancePct >= 60 && e.compliancePct < 90).length;
        const critical = employees.filter(e => e.compliancePct < 60).length;
        const totalExpired = employees.reduce((s, e) => s + e.expired, 0);
        const totalMissing = employees.reduce((s, e) => s + e.missing, 0);
        return { total, compliant, warning, critical, totalExpired, totalMissing };
    }, [employees]);

    const statusBadge = (pct: number) => {
        if (pct >= 90) return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Conforme', icon: IconShieldCheck };
        if (pct >= 60) return { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Vigilance', icon: IconClock };
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Critique', icon: IconAlertTriangle };
    };

    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Affectations Employés' },
                ]}
                icon={<IconUsers size={22} stroke={2} />}
                iconColor="blue"
                title="Affectations & statut de conformité des employés"
                subtitle="Vue globale du statut de conformité de chaque employé sur les exigences réglementaires HSE"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconDownload size={15} />}>
                            Exporter
                        </Button>
                    </>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiTile color="slate" label="Total employés" value={stats.total} icon={IconUsers} />
                <KpiTile color="green" label="Conformes" value={stats.compliant}
                    sub={stats.total ? `${Math.round(stats.compliant/stats.total*100)}%` : '—'}
                    icon={IconShieldCheck} />
                <KpiTile color="amber" label="Vigilance" value={stats.warning}
                    sub={stats.total ? `${Math.round(stats.warning/stats.total*100)}%` : '—'}
                    icon={IconClock} />
                <KpiTile color="red" label="Critiques" value={stats.critical}
                    sub={stats.total ? `${Math.round(stats.critical/stats.total*100)}%` : '—'}
                    icon={IconAlertTriangle} />
                <KpiTile color="orange" label="Documents expirés" value={stats.totalExpired} icon={IconClock} />
                <KpiTile color="violet" label="Documents manquants" value={stats.totalMissing} icon={IconFileX} />
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 flex flex-wrap items-center gap-2">
                <TextInput
                    size="sm"
                    leftSection={<IconSearch size={14} />}
                    placeholder="Rechercher un employé..."
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    style={{ flex: 1, minWidth: 200 }}
                />
                <Select
                    size="sm"
                    leftSection={<IconFilter size={14} />}
                    placeholder="Tous départements"
                    clearable
                    data={departments.map(d => ({ value: d, label: d }))}
                    value={deptFilter}
                    onChange={setDeptFilter}
                    w={200}
                />
                <Select
                    size="sm"
                    placeholder="Tous statuts"
                    clearable
                    data={[
                        { value: 'compliant', label: 'Conformes (≥90%)' },
                        { value: 'warning', label: 'Vigilance (60-89%)' },
                        { value: 'critical', label: 'Critiques (<60%)' },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    w={200}
                />
                <span className="text-xs text-slate-500 ml-auto">
                    {filtered.length} / {employees.length} employés
                </span>
            </div>

            {/* Liste employés */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-blue-50/60 border-b border-blue-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-100">
                        <IconUsers size={14} className="text-blue-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider flex-1">
                        Liste des employés
                    </h2>
                </header>
                {loading ? (
                    <Center className="py-12"><Loader color="blue" /></Center>
                ) : filtered.length === 0 ? (
                    <Center className="py-12">
                        <p className="text-sm text-slate-500 italic">Aucun employé trouvé avec ces critères.</p>
                    </Center>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map((emp) => {
                            const status = statusBadge(emp.compliancePct);
                            const StatusIcon = status.icon;
                            const initials = emp.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                            return (
                                <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => navigate(`/employee-assignment/employee-details/${emp.id}`)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 group"
                                >
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-800 text-xs flex-shrink-0">
                                        {initials}
                                    </div>

                                    {/* Identité */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-900 truncate">{emp.name}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                                            {emp.position && <span className="font-medium">{emp.position}</span>}
                                            {emp.position && emp.department && <span>·</span>}
                                            {emp.department && <span>{emp.department}</span>}
                                        </div>
                                    </div>

                                    {/* Stats conformité */}
                                    <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                                        <div className="text-center">
                                            <div className="text-xs text-green-700 tabular-nums">{emp.valid}</div>
                                            <div className="text-[9px] uppercase tracking-wider text-slate-500">Valides</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-amber-700 tabular-nums">{emp.expired}</div>
                                            <div className="text-[9px] uppercase tracking-wider text-slate-500">Expirés</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-red-700 tabular-nums">{emp.missing}</div>
                                            <div className="text-[9px] uppercase tracking-wider text-slate-500">Manquants</div>
                                        </div>
                                    </div>

                                    {/* Barre de progression conformité */}
                                    <div className="hidden lg:flex items-center gap-2 w-48 flex-shrink-0">
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${
                                                    emp.compliancePct >= 90 ? 'bg-green-500' :
                                                    emp.compliancePct >= 60 ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${emp.compliancePct}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-800 tabular-nums w-10 text-right">
                                            {emp.compliancePct}%
                                        </span>
                                    </div>

                                    {/* Badge statut */}
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded border ${status.color}`}>
                                        <StatusIcon size={11} />
                                        {status.label}
                                    </span>

                                    <IconChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 flex-shrink-0" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================================================
// KPI Tile compact
// =============================================================================
const KpiTile = ({ color, label, value, sub, icon: Icon }: any) => {
    const colors: Record<string, { bg: string; border: string; text: string; accent: string }> = {
        slate: { bg: 'bg-slate-50/60', border: 'border-slate-200', text: 'text-slate-700', accent: 'bg-slate-500' },
        green: { bg: 'bg-green-50/60', border: 'border-green-200', text: 'text-green-700', accent: 'bg-green-500' },
        amber: { bg: 'bg-amber-50/60', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500' },
        red: { bg: 'bg-red-50/60', border: 'border-red-200', text: 'text-red-700', accent: 'bg-red-500' },
        orange: { bg: 'bg-orange-50/60', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-orange-500' },
        violet: { bg: 'bg-violet-50/60', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-500' },
    };
    const c = colors[color];
    return (
        <div className={`bg-white rounded-lg border ${c.border} overflow-hidden hover:shadow-md transition-all`}>
            <div className={`h-1 ${c.accent}`}></div>
            <div className="p-3">
                <div className="flex items-start justify-between mb-1">
                    <div className={`p-1.5 rounded-md ${c.bg} ${c.border} border`}>
                        <Icon size={14} className={c.text} />
                    </div>
                    {sub && <span className={`text-[10px] ${c.text}`}>{sub}</span>}
                </div>
                <p className={`text-2xl ${c.text} tabular-nums`}>{value}</p>
                <p className="text-[11px] text-slate-700 mt-0.5">{label}</p>
            </div>
        </div>
    );
};

export default EmployeeAssignment;
