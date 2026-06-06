import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconMapPin,
    IconPlus,
    IconList,
    IconMap2,
    IconEdit,
    IconArchive,
    IconEye,
    IconAlertTriangle,
    IconShield,
    IconUser,
    IconUsers,
    IconBuildingBank,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import ConfirmModal from '../../UtilityComp/ConfirmModal';
import { useAppSelector } from '../../../slices/hooks';
import {
    listAssemblyPoints,
    archiveAssemblyPoint,
    type AssemblyPointDTO,
} from '../../../services/EmergencyService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { getAllDepartments } from '../../../services/HrmsService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import AssemblyPointsMap from './AssemblyPointsMap';

/**
 * Page « Points de rassemblement » (LOT 48 Phase 2.b — refonte navigation).
 *
 * <p>Plus de modal édition. Click sur une ligne ou un pin → page détail.
 * Click « Nouveau point » → page formulaire dédiée.</p>
 */

type ViewMode = 'map' | 'list';

interface EmployeeOption {
    id: number;
    name: string;
    position?: string;
    department?: string;
}

interface DepartmentOption {
    id: number;
    name: string;
}

const PRIORITY_BADGE: Record<number, { bg: string; text: string; ring: string }> = {
    1: { bg: 'bg-red-100',    text: 'text-red-800',    ring: 'border-red-200' },
    2: { bg: 'bg-orange-100', text: 'text-orange-800', ring: 'border-orange-200' },
    3: { bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'border-yellow-200' },
    4: { bg: 'bg-sky-100',    text: 'text-sky-800',    ring: 'border-sky-200' },
    5: { bg: 'bg-slate-100',  text: 'text-slate-700',  ring: 'border-slate-200' },
};

const AssemblyPointsPage = () => {
    const { t } = useTranslation(['emergency', 'common', 'navigation']);
    const navigate = useNavigate();
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const currentUser = useAppSelector((state: any) => state.user);

    const [view, setView] = useState<ViewMode>('map');
    const [points, setPoints] = useState<AssemblyPointDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retryTick, setRetryTick] = useState(0);
    const [archivingPoint, setArchivingPoint] = useState<AssemblyPointDTO | null>(null);
    const [archiving, setArchiving] = useState(false);

    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);

    // ── Lookups ──
    const employeeMap = useMemo(() => {
        const m = new Map<number, EmployeeOption>();
        employees.forEach((e) => m.set(e.id, e));
        return m;
    }, [employees]);

    const departmentMap = useMemo(() => {
        const m = new Map<number, DepartmentOption>();
        departments.forEach((d) => m.set(d.id, d));
        return m;
    }, [departments]);

    const employeeNameOf = (id?: number | null) => {
        if (!id) return '—';
        return employeeMap.get(id)?.name ?? `#${id}`;
    };

    // ── Chargement référentiels ──
    useEffect(() => {
        getEmployeesWithDepartment()
            .then((res: any[]) => {
                const list: EmployeeOption[] = Array.isArray(res)
                    ? res.map((e) => ({
                          id: e.id,
                          name: e.name || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
                          position: e.position,
                          department: e.department,
                      }))
                    : [];
                setEmployees(list);
            })
            .catch(() => setEmployees([]));
        getAllDepartments()
            .then((res: any[]) => {
                const list: DepartmentOption[] = Array.isArray(res)
                    ? res.map((d) => ({ id: d.id, name: d.name ?? d.departmentName ?? `#${d.id}` }))
                    : [];
                setDepartments(list);
            })
            .catch(() => setDepartments([]));
    }, []);

    // ── Chargement points ──
    useEffect(() => {
        if (!selectedCompanyId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError(null);
        listAssemblyPoints(selectedCompanyId)
            .then(setPoints)
            .catch((err: any) => {
                const msg = err?.response?.status
                    ? `Erreur ${err.response.status} — le backend Health-Safety répond mais retourne une erreur.`
                    : 'Impossible de joindre le serveur backend.';
                setLoadError(msg);
                setPoints([]);
            })
            .finally(() => setLoading(false));
    }, [selectedCompanyId, retryTick]);

    // ── Actions ──
    const goToDetail = (id?: number) => {
        if (!id) return;
        navigate(`/emergency/assembly-points/${id}`);
    };

    const goToEdit = (id?: number) => {
        if (!id) return;
        navigate(`/emergency/assembly-points/${id}/edit`);
    };

    const goToNew = () => navigate('/emergency/assembly-points/new');

    const handleArchive = (point: AssemblyPointDTO, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!point.id) return;
        setArchivingPoint(point);
    };

    const confirmArchive = async () => {
        if (!archivingPoint?.id) return;
        setArchiving(true);
        try {
            await archiveAssemblyPoint(archivingPoint.id, currentUser?.id);
            setPoints((prev) => prev.filter((p) => p.id !== archivingPoint.id));
            successNotification(t('emergency:assemblyPoints.archived'));
            setArchivingPoint(null);
        } catch {
            errorNotification(t('common:messages.errorGeneric'));
        } finally {
            setArchiving(false);
        }
    };

    // ── Empty state si pas de mine ──
    if (!selectedCompanyId) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <PageHeader
                    breadcrumbs={[
                        { label: t('navigation:breadcrumbs.home'), to: '/' },
                        { label: t('emergency:module.name') },
                        { label: t('emergency:assemblyPoints.title') },
                    ]}
                    useSafeXLogo
                    title={t('emergency:assemblyPoints.title')}
                    subtitle={t('emergency:assemblyPoints.subtitle')}
                />
                <div className="mt-6 bg-amber-50/60 border border-amber-200 rounded-xl p-6 text-center">
                    <IconAlertTriangle size={28} className="text-amber-500 mx-auto mb-2" stroke={1.6} />
                    <p className="text-[13px] text-slate-700">
                        Sélectionnez une mine active dans le sélecteur en haut.
                    </p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <PageHeader
                    breadcrumbs={[
                        { label: t('navigation:breadcrumbs.home'), to: '/' },
                        { label: t('emergency:module.name') },
                        { label: t('emergency:assemblyPoints.title') },
                    ]}
                    useSafeXLogo
                    title={t('emergency:assemblyPoints.title')}
                    subtitle={t('emergency:assemblyPoints.subtitle')}
                />
                <div className="mt-6 bg-red-50/60 border border-red-200 rounded-xl p-8 text-center">
                    <IconAlertTriangle size={32} className="text-red-500 mx-auto mb-3" stroke={1.6} />
                    <p className="text-[12.5px] text-slate-600 mb-4 max-w-lg mx-auto">{loadError}</p>
                    <button
                        type="button"
                        onClick={() => setRetryTick((n) => n + 1)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    // ── Stats ──
    const stats = {
        total: points.length,
        p1: points.filter((p) => (p.evacuationPriority ?? 2) === 1).length,
        totalCapacity: points.reduce((acc, p) => acc + (p.maxCapacity ?? 0), 0),
        withManager: points.filter((p) => !!p.managerId).length,
    };

    return (
        <div className="px-4 lg:px-6 py-5">
            <PageHeader
                breadcrumbs={[
                    { label: t('navigation:breadcrumbs.home'), to: '/' },
                    { label: t('emergency:module.name') },
                    { label: t('emergency:assemblyPoints.title') },
                ]}
                useSafeXLogo
                title={t('emergency:assemblyPoints.title')}
                subtitle={t('emergency:assemblyPoints.subtitle')}
                actions={
                    <button
                        type="button"
                        onClick={goToNew}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-[12.5px] font-semibold hover:bg-red-700 transition-colors shadow-sm"
                    >
                        <IconPlus size={13} stroke={2.4} />
                        {t('emergency:assemblyPoints.addNew')}
                    </button>
                }
            />

            {/* KPI tuiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                <StatCard icon={<IconMapPin size={14} stroke={1.7} />} label="Total points" value={stats.total} accent="red" />
                <StatCard icon={<IconShield size={14} stroke={1.7} />} label="Priorité haute" value={stats.p1} accent="orange" suffix="P1" />
                <StatCard icon={<IconUsers size={14} stroke={1.7} />} label="Capacité totale" value={stats.totalCapacity} accent="sky" suffix="pers." />
                <StatCard icon={<IconUser size={14} stroke={1.7} />} label="Avec responsable" value={stats.withManager} accent="emerald" suffix={`/ ${stats.total}`} />
            </div>

            {/* Toggle + légende */}
            <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setView('map')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                            view === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <IconMap2 size={13} stroke={1.8} />
                        {t('emergency:assemblyPoints.view.map')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('list')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                            view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <IconList size={13} stroke={1.8} />
                        {t('emergency:assemblyPoints.view.list')} ({points.length})
                    </button>
                </div>

                <div className="flex items-center gap-2.5 text-[11px] text-slate-600">
                    <span className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold">Légende</span>
                    {[1, 2, 3, 4, 5].map((p) => {
                        const colors = PRIORITY_BADGE[p];
                        return (
                            <span key={p} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} ${colors.ring} border text-[10px] font-semibold`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                                P{p}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Contenu */}
            <div className="mt-4">
                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                        <IconMapPin size={28} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                        <p className="text-[13px] text-slate-500">{t('common:messages.loadingData')}</p>
                    </div>
                ) : points.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                        <IconMapPin size={36} className="text-slate-300 mx-auto mb-3" stroke={1.5} />
                        <h3
                            className="text-[15px] text-slate-800 mb-1.5"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                        >
                            {t('emergency:assemblyPoints.empty')}
                        </h3>
                        <p className="text-[12px] text-slate-500 max-w-md mx-auto mb-4">
                            {t('emergency:assemblyPoints.emptyHint')}
                        </p>
                        <button
                            type="button"
                            onClick={goToNew}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 text-white text-[12.5px] font-semibold hover:bg-red-700"
                        >
                            <IconPlus size={13} stroke={2.4} />
                            {t('emergency:assemblyPoints.addNew')}
                        </button>
                    </div>
                ) : view === 'map' ? (
                    <AssemblyPointsMap points={points} onEdit={(p) => goToDetail(p.id)} height={520} />
                ) : (
                    <AssemblyPointsTable
                        points={points}
                        employeeNameOf={employeeNameOf}
                        departmentMap={departmentMap}
                        onView={(p) => goToDetail(p.id)}
                        onEdit={(p) => goToEdit(p.id)}
                        onArchive={handleArchive}
                    />
                )}
            </div>

            {/* Confirm Archive — popup custom */}
            <ConfirmModal
                opened={archivingPoint !== null}
                onClose={() => setArchivingPoint(null)}
                onConfirm={confirmArchive}
                tone="danger"
                title={archivingPoint ? `Archiver « ${archivingPoint.name} » ?` : 'Archiver le point ?'}
                message={
                    <>
                        Ce point de rassemblement sera <strong>masqué de la liste active</strong> mais
                        conservé en base pour l'historique des évacuations passées.
                        <br />
                        <br />
                        <span className="text-slate-500 text-[11.5px]">
                            Audit ISO 45001 §9.1.2 — rétention 5 ans.
                        </span>
                    </>
                }
                confirmLabel="Archiver"
                loading={archiving}
            />
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ────────────────────────────────────────────────────────────────────────────

const STAT_ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     ring: 'border-l-red-400' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  ring: 'border-l-orange-400' },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-700',     ring: 'border-l-sky-400' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'border-l-emerald-400' },
};

function StatCard({
    icon,
    label,
    value,
    suffix,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    suffix?: string;
    accent: keyof typeof STAT_ACCENT;
}) {
    const tone = STAT_ACCENT[accent];
    return (
        <div className={`bg-white border border-slate-200 border-l-[3px] ${tone.ring} rounded-xl p-3 shadow-sm`}>
            <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-semibold">{label}</p>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${tone.bg} ${tone.text}`}>
                    {icon}
                </span>
            </div>
            <p
                className="text-[24px] text-slate-900 leading-none"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
            >
                {value.toLocaleString('fr-FR')}
                {suffix && (
                    <span className="text-[11px] text-slate-500 ml-1.5 font-normal" style={{ fontFamily: 'inherit' }}>
                        {suffix}
                    </span>
                )}
            </p>
        </div>
    );
}

function AssemblyPointsTable({
    points,
    employeeNameOf,
    departmentMap,
    onView,
    onEdit,
    onArchive,
}: {
    points: AssemblyPointDTO[];
    employeeNameOf: (id?: number | null) => string;
    departmentMap: Map<number, { id: number; name: string }>;
    onView: (p: AssemblyPointDTO) => void;
    onEdit: (p: AssemblyPointDTO) => void;
    onArchive: (p: AssemblyPointDTO, e?: React.MouseEvent) => void;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600 w-16">
                                Priorité
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                Nom & emplacement
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                Responsable
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                Capacité
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600">
                                Départements
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10.5px] uppercase tracking-wider text-slate-600 w-28">
                                Coordonnées
                            </th>
                            <th className="px-3 py-2.5 text-right font-semibold text-[10.5px] uppercase tracking-wider text-slate-600 w-28">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {points.map((p) => {
                            const priority = p.evacuationPriority ?? 2;
                            const badge = PRIORITY_BADGE[priority];
                            const deptIds = (p.departmentIdsCsv ?? '')
                                .split(',')
                                .map((s) => parseInt(s.trim(), 10))
                                .filter((n) => !Number.isNaN(n));

                            return (
                                <tr
                                    key={p.id}
                                    onClick={() => onView(p)}
                                    className="hover:bg-red-50/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-3 py-2">
                                        <span
                                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${badge.bg} ${badge.text} ${badge.ring} border`}
                                        >
                                            P{priority}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <p className="text-[13px] text-slate-900 font-medium">{p.name}</p>
                                        {p.locationText && (
                                            <p className="text-[11px] text-slate-500 mt-0.5 inline-flex items-center gap-1">
                                                <IconMapPin size={9} stroke={1.8} />
                                                {p.locationText}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-slate-700">
                                        {p.managerId ? (
                                            <span className="inline-flex items-center gap-1">
                                                <IconUser size={10} stroke={1.8} className="text-slate-400" />
                                                {employeeNameOf(p.managerId)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic">Non assigné</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-slate-700">
                                        {p.maxCapacity ? (
                                            <span className="inline-flex items-center gap-1">
                                                <IconUsers size={10} stroke={1.8} className="text-slate-400" />
                                                {p.maxCapacity}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic">—</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        {deptIds.length === 0 ? (
                                            <span className="text-slate-400 italic text-[11px]">Tous</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {deptIds.slice(0, 3).map((id) => (
                                                    <span
                                                        key={id}
                                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700"
                                                    >
                                                        <IconBuildingBank size={8} stroke={1.8} />
                                                        {departmentMap.get(id)?.name ?? `#${id}`}
                                                    </span>
                                                ))}
                                                {deptIds.length > 3 && (
                                                    <span className="text-[10px] text-slate-500">+{deptIds.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-[10px] text-slate-500 font-mono">
                                        {p.latitude.toFixed(4)}
                                        <br />
                                        {p.longitude.toFixed(4)}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => onView(p)}
                                                title="Voir détail"
                                                className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                            >
                                                <IconEye size={11} stroke={1.8} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onEdit(p)}
                                                title="Modifier"
                                                className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                            >
                                                <IconEdit size={11} stroke={1.8} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => onArchive(p, e)}
                                                title="Archiver"
                                                className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            >
                                                <IconArchive size={11} stroke={1.8} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AssemblyPointsPage;
