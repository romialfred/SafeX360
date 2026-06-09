import { useEffect, useMemo, useState } from 'react';
import { Select, TextInput } from '@mantine/core';
import {
    IconChevronRight,
    IconCircleCheck,
    IconHourglassHigh,
    IconSearch,
    IconShieldCheck,
    IconUsers,
    IconAlertTriangle,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../UtilityComp/PageHeader';
import KpiTile from '../../UtilityComp/KpiTile';
import EmptyState from '../../UtilityComp/EmptyState';
import { SkeletonTable } from '../../UtilityComp/LoadingSkeleton';
import { getEmployeeComplianceStatus } from '../../../services/ComplianceDocumentService';
import { errorNotification } from '../../../utility/NotificationUtility';
import { empStatusConfig } from '../complianceLabels';

/**
 * Statut de conformité des employés (LOT 49).
 *
 * Le statut affiché provient du backend (Conforme / Non conforme / En attente
 * de validation), calculé sur les exigences du poste et les justificatifs
 * réellement déposés — les anciennes statistiques fictives ont été retirées.
 */

interface EmployeeRow {
    id: number;
    name: string;
    department?: string;
    position?: string;
    email?: string;
    status: string;
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
        getEmployeeComplianceStatus()
            .then((data: any[]) => {
                setEmployees(
                    (data ?? []).map((e: any) => ({
                        id: e.id,
                        name: e.name ?? '—',
                        department: e.department,
                        position: e.position,
                        email: e.email,
                        status: (e.status ?? '').toUpperCase(),
                    }))
                );
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Le statut des employés est indisponible');
                setEmployees([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const departments = useMemo(() => {
        const set = new Set(employees.map((e) => e.department).filter(Boolean) as string[]);
        return Array.from(set).sort();
    }, [employees]);

    const filtered = useMemo(() => {
        return employees.filter((e) => {
            if (search && !`${e.name} ${e.email ?? ''} ${e.position ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
            if (deptFilter && e.department !== deptFilter) return false;
            if (statusFilter && e.status !== statusFilter) return false;
            return true;
        });
    }, [employees, search, deptFilter, statusFilter]);

    const stats = useMemo(() => {
        const total = employees.length;
        const compliant = employees.filter((e) => e.status === 'COMPLIANCE').length;
        const nonCompliant = employees.filter((e) => e.status === 'NON-COMPLIANCE').length;
        const uploaded = employees.filter((e) => e.status === 'UPLOADED').length;
        return { total, compliant, nonCompliant, uploaded };
    }, [employees]);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Affectations employés' },
                ]}
                icon={<IconUsers size={22} stroke={2} />}
                iconColor="teal"
                title="Conformité des employés"
                subtitle="Statut de chaque salarié sur les exigences réglementaires de son poste"
            />

            {/* KPI réels issus du backend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label="Employés suivis"
                    value={loading ? '…' : stats.total}
                    tone="slate"
                    icon={<IconUsers size={14} stroke={1.8} />}
                    referenceValue="Avec poste affecté"
                />
                <KpiTile
                    label="Conformes"
                    value={loading ? '…' : stats.compliant}
                    tone="green"
                    icon={<IconShieldCheck size={14} stroke={1.8} />}
                    referenceValue={stats.total ? `${Math.round((stats.compliant / stats.total) * 100)} % de l'effectif` : '—'}
                />
                <KpiTile
                    label="Non conformes"
                    value={loading ? '…' : stats.nonCompliant}
                    tone="rose"
                    icon={<IconAlertTriangle size={14} stroke={1.8} />}
                    referenceValue="Justificatif expiré ou absent"
                />
                <KpiTile
                    label="En attente de validation"
                    value={loading ? '…' : stats.uploaded}
                    tone="violet"
                    icon={<IconHourglassHigh size={14} stroke={1.8} />}
                    referenceValue="Document déposé, à valider"
                />
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
                <TextInput
                    size="xs"
                    leftSection={<IconSearch size={14} />}
                    placeholder="Rechercher par nom, poste ou e-mail…"
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    className="flex-1 min-w-[220px]"
                />
                <Select
                    size="xs"
                    placeholder="Tous départements"
                    clearable
                    data={departments.map((d) => ({ value: d, label: d }))}
                    value={deptFilter}
                    onChange={setDeptFilter}
                    w={190}
                    aria-label="Filtrer par département"
                />
                <Select
                    size="xs"
                    placeholder="Tous statuts"
                    clearable
                    data={[
                        { value: 'COMPLIANCE', label: 'Conformes' },
                        { value: 'NON-COMPLIANCE', label: 'Non conformes' },
                        { value: 'UPLOADED', label: 'En attente de validation' },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    w={200}
                    aria-label="Filtrer par statut"
                />
                <span className="text-[11.5px] text-slate-500 ml-auto">
                    {filtered.length} / {employees.length} employé{employees.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* Liste */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-4">
                        <SkeletonTable rows={6} cols={4} />
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<IconUsers size={26} />}
                        title="Aucun employé trouvé"
                        description="Aucun employé ne correspond aux critères de recherche actuels."
                        iconColor="slate"
                    />
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map((emp) => {
                            const cfg = empStatusConfig(emp.status);
                            const initials = emp.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                            return (
                                <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => navigate(`/employee-assignment/employee-details/${emp.id}`)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center gap-3 group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-teal-50 ring-1 ring-teal-100 flex items-center justify-center text-teal-700 text-[11px] flex-shrink-0">
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] text-slate-800 truncate">{emp.name}</p>
                                        <p className="text-[11.5px] text-slate-500 truncate">
                                            {[emp.position, emp.department].filter(Boolean).join(' · ') || '—'}
                                        </p>
                                    </div>
                                    {emp.email && (
                                        <span className="hidden md:block text-[11.5px] text-slate-400 truncate max-w-[220px]">
                                            {emp.email}
                                        </span>
                                    )}
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded border flex-shrink-0 ${cfg.chip}`}>
                                        {emp.status === 'COMPLIANCE' && <IconCircleCheck size={11} aria-hidden="true" />}
                                        {emp.status === 'NON-COMPLIANCE' && <IconAlertTriangle size={11} aria-hidden="true" />}
                                        {emp.status === 'UPLOADED' && <IconHourglassHigh size={11} aria-hidden="true" />}
                                        {cfg.label}
                                    </span>
                                    <IconChevronRight size={14} className="text-slate-300 group-hover:text-teal-600 flex-shrink-0" aria-hidden="true" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeAssignment;
