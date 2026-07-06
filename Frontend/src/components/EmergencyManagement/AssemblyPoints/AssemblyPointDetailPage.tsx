import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IconMapPin,
    IconArrowLeft,
    IconEdit,
    IconArchive,
    IconUser,
    IconUsers,
    IconBuildingBank,
    IconClock,
    IconAlertTriangle,
    IconCheck,
    IconPencil,
    IconArchive as IconArchiveAlt,
    IconCircle,
    IconBriefcase,
    IconChartBar,
    IconMap2,
    IconList,
    IconShield,
    IconLayoutGrid,
    IconShovel,
    IconTool,
} from '@tabler/icons-react';
import { groupByCategory, CATEGORIES } from './departmentCategories';
import PageHeader from '../../UtilityComp/PageHeader';
import ConfirmModal from '../../UtilityComp/ConfirmModal';
import { useAppSelector } from '../../../slices/hooks';
import {
    getAssemblyPoint,
    getAssemblyPointHistory,
    archiveAssemblyPoint,
    type AssemblyPointDTO,
    type AssemblyPointHistoryDTO,
} from '../../../services/EmergencyService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { getAllDepartments } from '../../../services/HrmsService';
import { successNotification, errorNotification, extractErrorMessage } from '../../../utility/NotificationUtility';
import AssemblyPointsMap from './AssemblyPointsMap';

/**
 * Page Détail d'un Point de rassemblement (LOT 48 Phase 2.b).
 *
 * <p>5 onglets :</p>
 * <ol>
 *   <li>Vue d'ensemble — KPIs + infos clés</li>
 *   <li>Couverture — départements + bâtiments associés</li>
 *   <li>Employés — liste groupée par département / position</li>
 *   <li>Historique — timeline des modifications</li>
 *   <li>Carte — vue géolocalisée</li>
 * </ol>
 */

type TabKey = 'overview' | 'coverage' | 'employees' | 'history' | 'map';

interface EmployeeEnriched {
    id: number;
    name: string;
    position?: string;
    department?: string;
}

interface DepartmentOption {
    id: number;
    name: string;
}

const PRIORITY_META: Record<
    number,
    { bg: string; text: string; ring: string; bgSoft: string; label: string }
> = {
    1: { bg: 'bg-red-600',     text: 'text-white', ring: 'border-red-700',     bgSoft: 'bg-red-50',     label: 'Priorité haute' },
    2: { bg: 'bg-orange-600',  text: 'text-white', ring: 'border-orange-700',  bgSoft: 'bg-orange-50',  label: 'Standard' },
    3: { bg: 'bg-yellow-500',  text: 'text-white', ring: 'border-yellow-600',  bgSoft: 'bg-yellow-50',  label: 'Secondaire' },
    4: { bg: 'bg-sky-500',     text: 'text-white', ring: 'border-sky-600',     bgSoft: 'bg-sky-50',     label: 'Repli' },
    5: { bg: 'bg-slate-500',   text: 'text-white', ring: 'border-slate-600',   bgSoft: 'bg-slate-50',   label: 'Faible' },
};

const ACTION_META: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
    created:  { icon: IconCheck,       color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Création' },
    updated:  { icon: IconPencil,      color: 'text-amber-700',   bg: 'bg-amber-100',   label: 'Modification' },
    archived: { icon: IconArchiveAlt,  color: 'text-slate-600',   bg: 'bg-slate-200',   label: 'Archivage' },
};

const formatDateTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const AssemblyPointDetailPage = () => {
    const { t } = useTranslation(['emergency', 'common', 'navigation']);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const currentUser = useAppSelector((state: any) => state.user);

    const [point, setPoint] = useState<AssemblyPointDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [history, setHistory] = useState<AssemblyPointHistoryDTO[]>([]);
    const [employees, setEmployees] = useState<EmployeeEnriched[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);

    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [archiving, setArchiving] = useState(false);

    // ── Chargement ──
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setLoadError(null);
        Promise.all([
            getAssemblyPoint(Number(id)).then(setPoint),
            getAssemblyPointHistory(Number(id))
                .then(setHistory)
                .catch(() => setHistory([])),
        ])
            .catch((err: any) => {
                const msg = err?.response?.status === 404
                    ? "Point de rassemblement introuvable (peut-être archivé)."
                    : "Erreur lors du chargement du point.";
                setLoadError(msg);
            })
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        getEmployeesWithDepartment()
            .then((res: any[]) => {
                const list: EmployeeEnriched[] = Array.isArray(res)
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

    // ── Lookups ──
    const employeeMap = useMemo(() => {
        const m = new Map<number, EmployeeEnriched>();
        employees.forEach((e) => m.set(e.id, e));
        return m;
    }, [employees]);

    const departmentMap = useMemo(() => {
        const m = new Map<number, DepartmentOption>();
        departments.forEach((d) => m.set(d.id, d));
        return m;
    }, [departments]);

    const employeeNameOf = (eid?: number | null) => {
        if (!eid) return '—';
        return employeeMap.get(eid)?.name ?? `#${eid}`;
    };

    // ── Départements et employés couverts ──
    const coveredDeptIds = useMemo(() => {
        if (!point?.departmentIdsCsv) return [] as number[];
        return point.departmentIdsCsv
            .split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !Number.isNaN(n));
    }, [point]);

    const coveredDepartments = useMemo(
        () => coveredDeptIds.map((i) => departmentMap.get(i)).filter(Boolean) as DepartmentOption[],
        [coveredDeptIds, departmentMap]
    );

    /** Employés concernés : si CSV vide => tous ; sinon ceux dont le département est listé. */
    const concernedEmployees = useMemo(() => {
        if (employees.length === 0) return [];
        if (coveredDeptIds.length === 0) return employees;
        const deptNames = new Set(coveredDepartments.map((d) => d.name.toLowerCase()));
        return employees.filter(
            (e) => e.department && deptNames.has(e.department.toLowerCase())
        );
    }, [employees, coveredDeptIds, coveredDepartments]);

    // Group employees by department > position
    const employeesByDeptPosition = useMemo(() => {
        const map = new Map<string, Map<string, EmployeeEnriched[]>>();
        concernedEmployees.forEach((e) => {
            const dept = e.department ?? 'Non spécifié';
            const pos = e.position ?? 'Non spécifié';
            if (!map.has(dept)) map.set(dept, new Map());
            const posMap = map.get(dept)!;
            if (!posMap.has(pos)) posMap.set(pos, []);
            posMap.get(pos)!.push(e);
        });
        return map;
    }, [concernedEmployees]);

    // ── Archive ──
    const handleArchive = async () => {
        if (!point?.id) return;
        setArchiving(true);
        try {
            await archiveAssemblyPoint(point.id, currentUser?.id);
            successNotification(t('emergency:assemblyPoints.archived'));
            setArchiveOpen(false);
            navigate('/emergency/assembly-points');
        } catch (err) {
            errorNotification(extractErrorMessage(err, t('common:messages.errorGeneric')));
        } finally {
            setArchiving(false);
        }
    };

    // ── Empty / error states ──
    if (loading) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                    <IconMapPin size={28} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                    <p className="text-[13px] text-slate-500">{t('common:messages.loadingData')}</p>
                </div>
            </div>
        );
    }
    if (loadError || !point) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-red-50/60 border border-red-200 rounded-xl p-8 text-center">
                    <IconAlertTriangle size={32} className="text-red-500 mx-auto mb-3" stroke={1.6} />
                    <p className="text-[13px] text-slate-700 mb-4">{loadError ?? 'Données indisponibles.'}</p>
                    <button
                        type="button"
                        onClick={() => navigate('/emergency/assembly-points')}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800"
                    >
                        <IconArrowLeft size={12} stroke={2} />
                        Retour à la liste
                    </button>
                </div>
            </div>
        );
    }

    const priority = point.evacuationPriority ?? 2;
    const priorityMeta = PRIORITY_META[priority];

    // ── Tabs definition ──
    const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
        { key: 'overview', label: "Vue d'ensemble", icon: <IconLayoutGrid size={13} stroke={1.7} /> },
        { key: 'coverage', label: 'Couverture', icon: <IconBuildingBank size={13} stroke={1.7} />, badge: coveredDepartments.length || undefined },
        { key: 'employees', label: 'Employés concernés', icon: <IconUsers size={13} stroke={1.7} />, badge: concernedEmployees.length || undefined },
        { key: 'history', label: 'Historique', icon: <IconClock size={13} stroke={1.7} />, badge: history.length || undefined },
        { key: 'map', label: 'Carte', icon: <IconMap2 size={13} stroke={1.7} /> },
    ];

    return (
        <div className="px-4 lg:px-6 py-5">
            <PageHeader
                breadcrumbs={[
                    { label: t('navigation:breadcrumbs.home'), to: '/' },
                    { label: t('emergency:module.name') },
                    { label: t('emergency:assemblyPoints.title'), to: '/emergency/assembly-points' },
                    { label: point.name },
                ]}
                useSafeXLogo
                title={point.name}
                subtitle={point.locationText ?? 'Point de rassemblement'}
                actions={
                    <>
                        <button
                            type="button"
                            onClick={() => navigate('/emergency/assembly-points')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <IconArrowLeft size={12} stroke={2} />
                            Retour
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/emergency/assembly-points/${point.id}/edit`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-800 border border-slate-300 text-[12.5px] font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <IconEdit size={12} stroke={1.8} />
                            Modifier
                        </button>
                        <button
                            type="button"
                            onClick={() => setArchiveOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-[12.5px] font-semibold hover:bg-red-700 transition-colors shadow-sm"
                        >
                            <IconArchive size={12} stroke={1.8} />
                            Archiver
                        </button>
                    </>
                }
            />

            {/* ════ Hero card ════ */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                <HeroCard
                    icon={<IconShield size={14} stroke={1.7} />}
                    label="Priorité"
                    accent={priority <= 2 ? 'red' : priority === 3 ? 'amber' : 'sky'}
                    value={`P${priority}`}
                    sub={priorityMeta.label}
                />
                <HeroCard
                    icon={<IconUsers size={14} stroke={1.7} />}
                    label="Capacité"
                    accent="sky"
                    value={point.maxCapacity ? String(point.maxCapacity) : '∞'}
                    sub={point.maxCapacity ? 'personnes max' : 'non limitée'}
                />
                <HeroCard
                    icon={<IconBuildingBank size={14} stroke={1.7} />}
                    label="Départements"
                    accent="violet"
                    value={coveredDepartments.length === 0 ? 'Tous' : String(coveredDepartments.length)}
                    sub={coveredDepartments.length === 0 ? 'aucune restriction' : 'départements couverts'}
                />
                <HeroCard
                    icon={<IconUser size={14} stroke={1.7} />}
                    label="Employés concernés"
                    accent="emerald"
                    value={String(concernedEmployees.length)}
                    sub="personnes à évacuer"
                />
            </div>

            {/* ════ Tabs ════ */}
            <div className="mt-5 border-b border-slate-200">
                <div className="flex items-end gap-1 overflow-x-auto">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] transition-colors whitespace-nowrap border-b-2 ${
                                    isActive
                                        ? 'text-red-700 border-red-500 font-semibold bg-white'
                                        : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
                                }`}
                                style={{ fontFamily: isActive ? "'Source Serif 4', Georgia, serif" : undefined }}
                            >
                                <span className={isActive ? 'text-red-600' : 'text-slate-400'}>{tab.icon}</span>
                                {tab.label}
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span
                                        className={`inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded text-[10px] font-semibold ${
                                            isActive ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-5">
                {/* ════ ONGLET 1 : Vue d'ensemble ════ */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                        <div className="xl:col-span-2 space-y-5">
                            <Card title="Description" icon={<IconChartBar size={14} stroke={1.7} />}>
                                {point.description ? (
                                    <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">
                                        {point.description}
                                    </p>
                                ) : (
                                    <p className="text-[12px] text-slate-400 italic">
                                        Aucune description renseignée.
                                    </p>
                                )}
                            </Card>

                            <Card title="Coordonnées GPS" icon={<IconMapPin size={14} stroke={1.7} />}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                            Latitude
                                        </p>
                                        <p className="text-[15px] font-mono text-slate-800">
                                            {point.latitude.toFixed(6)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                            Longitude
                                        </p>
                                        <p className="text-[15px] font-mono text-slate-800">
                                            {point.longitude.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                                {point.locationText && (
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <p className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                            Repère visuel
                                        </p>
                                        <p className="text-[13px] text-slate-700 inline-flex items-center gap-1.5">
                                            <IconMapPin size={11} stroke={1.8} className="text-slate-400" />
                                            {point.locationText}
                                        </p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        <div className="space-y-5">
                            {/* Responsabilité */}
                            <Card title="Responsabilité" icon={<IconUser size={14} stroke={1.7} />}>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10.5px] uppercase tracking-wider text-emerald-700 font-semibold mb-1">
                                            Titulaire
                                        </p>
                                        {point.managerId ? (
                                            <EmployeeRow employee={employeeMap.get(point.managerId)} fallbackId={point.managerId} />
                                        ) : (
                                            <p className="text-[12px] text-slate-400 italic">Non assigné</p>
                                        )}
                                    </div>
                                    <div className="pt-3 border-t border-slate-100">
                                        <p className="text-[10.5px] uppercase tracking-wider text-sky-700 font-semibold mb-1">
                                            Suppléant
                                        </p>
                                        {point.deputyManagerId ? (
                                            <EmployeeRow employee={employeeMap.get(point.deputyManagerId)} fallbackId={point.deputyManagerId} />
                                        ) : (
                                            <p className="text-[12px] text-slate-400 italic">Non assigné</p>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <Card title="Statut" icon={<IconCircle size={14} stroke={1.7} />}>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11.5px] font-semibold ${
                                        point.status === 'ACTIVE'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${point.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                    />
                                    {point.status === 'ACTIVE' ? 'Actif — opérationnel' : 'Archivé'}
                                </span>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ════ ONGLET 2 : Couverture (3 colonnes par catégorie métier) ════ */}
                {activeTab === 'coverage' && (
                    <Card title="Départements couverts" icon={<IconBuildingBank size={14} stroke={1.7} />}>
                        {coveredDepartments.length === 0 ? (
                            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                                <IconInfoCircle className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[12.5px] font-semibold text-amber-900">
                                        Aucune restriction de département
                                    </p>
                                    <p className="text-[11.5px] text-amber-800 mt-1">
                                        Ce point de rassemblement accepte tous les employés de la mine sans
                                        distinction de département. Les <strong>{employees.length} employés</strong>{' '}
                                        recensés évacueront ici en l'absence d'autre point assigné.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <CategorizedCoverageView
                                departments={coveredDepartments}
                                employees={employees}
                            />
                        )}
                    </Card>
                )}

                {/* ════ ONGLET 3 : Employés concernés ════ */}
                {activeTab === 'employees' && (
                    <Card
                        title={`Employés concernés (${concernedEmployees.length})`}
                        icon={<IconUsers size={14} stroke={1.7} />}
                    >
                        {employeesByDeptPosition.size === 0 ? (
                            <div className="text-center py-10 bg-slate-50/40 border border-dashed border-slate-200 rounded-lg">
                                <IconUsers size={28} className="text-slate-300 mx-auto mb-2" stroke={1.5} />
                                <p className="text-[12px] text-slate-500 italic">
                                    Aucun employé à afficher pour les départements couverts.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Array.from(employeesByDeptPosition.entries()).map(([dept, positions]) => {
                                    const totalDept = Array.from(positions.values()).reduce((acc, arr) => acc + arr.length, 0);
                                    return (
                                        <details key={dept} className="bg-white border border-slate-200 rounded-lg overflow-hidden group" open>
                                            <summary className="px-3 py-2.5 bg-slate-50/40 border-b border-slate-200 cursor-pointer flex items-center justify-between hover:bg-slate-50">
                                                <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-slate-800">
                                                    <IconBuildingBank size={12} stroke={1.8} className="text-violet-600" />
                                                    {dept}
                                                </span>
                                                <span className="text-[10.5px] uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded font-semibold">
                                                    {totalDept} employé{totalDept > 1 ? 's' : ''}
                                                </span>
                                            </summary>
                                            <div className="p-3 space-y-3">
                                                {Array.from(positions.entries()).map(([pos, emps]) => (
                                                    <div key={pos}>
                                                        <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5 flex items-center gap-1">
                                                            <IconBriefcase size={9} stroke={1.8} />
                                                            {pos}
                                                            <span className="text-slate-400 font-normal normal-case ml-1">
                                                                ({emps.length})
                                                            </span>
                                                        </p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                                            {emps.map((e) => (
                                                                <div
                                                                    key={e.id}
                                                                    className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-md"
                                                                >
                                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                                                                        <IconUser size={11} stroke={1.8} />
                                                                    </span>
                                                                    <span className="text-[12px] text-slate-800 truncate">
                                                                        {e.name}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                )}

                {/* ════ ONGLET 4 : Historique ════ */}
                {activeTab === 'history' && (
                    <Card title="Historique des modifications" icon={<IconClock size={14} stroke={1.7} />}>
                        {history.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50/40 border border-dashed border-slate-200 rounded-lg">
                                <IconClock size={28} className="text-slate-300 mx-auto mb-2" stroke={1.5} />
                                <p className="text-[12px] text-slate-500 italic">
                                    Aucune modification enregistrée.
                                </p>
                            </div>
                        ) : (
                            <ol className="relative border-l-2 border-slate-200 ml-3 space-y-4 pl-5 py-2">
                                {history.map((h) => {
                                    const meta = ACTION_META[h.action] ?? {
                                        icon: IconCircle,
                                        color: 'text-slate-600',
                                        bg: 'bg-slate-100',
                                        label: h.action,
                                    };
                                    const Icon = meta.icon;
                                    return (
                                        <li key={h.id} className="relative">
                                            <span
                                                className={`absolute -left-[33px] inline-flex items-center justify-center w-6 h-6 rounded-full ${meta.bg} ${meta.color} ring-4 ring-white shadow-sm`}
                                            >
                                                <Icon size={11} stroke={1.8} />
                                            </span>
                                            <div className="bg-white border border-slate-200 rounded-lg p-3">
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <span
                                                        className={`text-[11px] uppercase tracking-wider font-semibold ${meta.color}`}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-[10.5px] text-slate-500">
                                                        {formatDateTime(h.createdAt)}
                                                    </span>
                                                </div>
                                                {h.diffSummary && (
                                                    <p className="text-[12px] text-slate-700">{h.diffSummary}</p>
                                                )}
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                                                    <IconUser size={9} stroke={1.8} />
                                                    {h.actorId ? employeeNameOf(h.actorId) : 'Système'}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </Card>
                )}

                {/* ════ ONGLET 5 : Carte ════ */}
                {activeTab === 'map' && (
                    <Card title="Vue géolocalisée" icon={<IconMap2 size={14} stroke={1.7} />}>
                        <AssemblyPointsMap points={[point]} height={520} />
                    </Card>
                )}
            </div>

            {/* Confirm Archive — popup custom */}
            <ConfirmModal
                opened={archiveOpen}
                onClose={() => setArchiveOpen(false)}
                onConfirm={handleArchive}
                tone="danger"
                title={`Archiver « ${point.name} » ?`}
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
                icon={<IconArchive size={20} stroke={1.8} />}
                loading={archiving}
            />
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ────────────────────────────────────────────────────────────────────────────

const HERO_ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     ring: 'border-l-red-400' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'border-l-amber-400' },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-700',     ring: 'border-l-sky-400' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'border-l-violet-400' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'border-l-emerald-400' },
};

function HeroCard({
    icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent: keyof typeof HERO_ACCENT;
}) {
    const tone = HERO_ACCENT[accent];
    return (
        <div className={`bg-white border border-slate-200 border-l-[3px] ${tone.ring} rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${tone.bg} ${tone.text}`}>
                    {icon}
                </span>
                <span className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-semibold">
                    {label}
                </span>
            </div>
            <p
                className="text-[28px] text-slate-900 leading-none"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
            >
                {value}
            </p>
            {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
        </div>
    );
}

function Card({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <span className="text-slate-500">{icon}</span>
                <h3
                    className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                >
                    {title}
                </h3>
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
}

function EmployeeRow({
    employee,
    fallbackId,
}: {
    employee?: EmployeeEnriched;
    fallbackId: number;
}) {
    if (!employee) {
        return <p className="text-[12.5px] text-slate-700">#{fallbackId}</p>;
    }
    return (
        <div className="flex items-start gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                <IconUser size={12} stroke={1.7} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-slate-800 truncate">{employee.name}</p>
                <p className="text-[11px] text-slate-500 truncate">
                    {employee.position}
                    {employee.position && employee.department && ' · '}
                    {employee.department}
                </p>
            </div>
        </div>
    );
}

// ── Sous-composant : Couverture catégorisée (3 colonnes métier) ────────────
const COVERAGE_VISUAL: Record<
    string,
    { borderL: string; bg: string; iconBg: string; iconColor: string }
> = {
    sky:     { borderL: 'border-l-sky-400',     bg: 'bg-sky-50/40',     iconBg: 'bg-sky-100',     iconColor: 'text-sky-700' },
    amber:   { borderL: 'border-l-amber-400',   bg: 'bg-amber-50/40',   iconBg: 'bg-amber-100',   iconColor: 'text-amber-700' },
    emerald: { borderL: 'border-l-emerald-400', bg: 'bg-emerald-50/40', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700' },
};

function CategorizedCoverageView({
    departments,
    employees,
}: {
    departments: { id: number; name: string }[];
    employees: EmployeeEnriched[];
}) {
    const groups = groupByCategory(departments);

    const countEmployees = (deptName: string) =>
        employees.filter((e) => e.department?.toLowerCase() === deptName.toLowerCase()).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
                const items = groups[cat.key];
                if (items.length === 0) return null;
                const visual = COVERAGE_VISUAL[cat.accent];
                const Icon = cat.icon === 'IconShovel' ? IconShovel : cat.icon === 'IconTool' ? IconTool : IconBuildingBank;
                const totalEmployees = items.reduce((acc, d) => acc + countEmployees(d.name), 0);

                return (
                    <div
                        key={cat.key}
                        className={`border border-slate-200 border-l-[3px] ${visual.borderL} ${visual.bg} rounded-lg overflow-hidden`}
                    >
                        <header className="px-3 py-2.5 border-b border-slate-100 bg-white/60">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${visual.iconBg} ${visual.iconColor} flex-shrink-0`}>
                                        <Icon size={12} stroke={1.7} />
                                    </span>
                                    <h4
                                        className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-slate-700 truncate"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                                    >
                                        {cat.label}
                                    </h4>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${visual.iconBg} ${visual.iconColor}`}>
                                    {items.length} dép. · {totalEmployees} pers.
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-snug">{cat.description}</p>
                        </header>
                        <ul className="divide-y divide-slate-100">
                            {items.map((dept) => {
                                const empCount = countEmployees(dept.name);
                                return (
                                    <li key={dept.id} className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-white/60 transition-colors">
                                        <span className="text-[12px] text-slate-800 truncate inline-flex items-center gap-1.5">
                                            <IconBuildingBank size={10} stroke={1.8} className="text-slate-400 flex-shrink-0" />
                                            {dept.name}
                                        </span>
                                        <span className="text-[10.5px] text-slate-500 whitespace-nowrap inline-flex items-center gap-0.5">
                                            <IconUser size={9} stroke={1.8} />
                                            {empCount}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}

// Fallback IconInfoCircle (avoid relying on import — already imported in form file but not here)
function IconInfoCircle({ className, ...rest }: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...rest}
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8h.01" />
            <path d="M11 12h1v4h1" />
        </svg>
    );
}

export default AssemblyPointDetailPage;
