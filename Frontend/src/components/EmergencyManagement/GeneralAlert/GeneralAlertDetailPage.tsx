import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, RingProgress } from '@mantine/core';
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconClock,
    IconUsers,
    IconShieldCheck,
    IconStethoscope,
    IconShieldX,
    IconCircleMinus,
    IconClipboardList,
    IconChartBar,
    IconMaximize,
    IconBuildingBank,
    IconUrgent,
    IconArchive,
    IconUser,
    IconX,
    IconMapPin,
    IconBell,
    IconMessageCircle,
    IconPhone,
    IconMail,
    IconCamera,
    IconWifi,
    IconWifiOff,
    IconChevronRight,
    IconBellRinging,
    IconHeartbeat,
    IconCheck,
    IconEye,
    IconSettings,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import ConfirmModal from '../../UtilityComp/ConfirmModal';
import { useAppSelector } from '../../../slices/hooks';
import {
    getAlert,
    getAlertCheckIns,
    endAlert,
    checkInToAlert,
    type GeneralAlertDTO,
    type EvacuationCheckInDTO,
    type CheckInStatus,
} from '../../../services/GeneralAlertService';
import { formatReasonCode } from './alertHelpers';
import EvacuationRollCall from './EvacuationRollCall';
import EvacuationDashboard from './EvacuationDashboard';
import { useCanCloseEmergency } from '../useEmergencyCoordinator';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { useEmergencyWebSocket } from '../Sos/EmergencyWebSocketProvider';
import { successNotification, errorNotification, extractErrorMessage } from '../../../utility/NotificationUtility';
import { groupByCategory, CATEGORIES } from '../AssemblyPoints/departmentCategories';
import {
    listAssemblyPoints,
    listCameras,
    type AssemblyPointDTO,
    type CameraDTO,
} from '../../../services/EmergencyService';

/**
 * Centre de Commande Évacuation — Alerte Générale.
 *
 * Refonte LOT 53 : dashboard professionnel inspiré des centres de crise
 * (mockup "Plateforme d'Alertes & d'Evacuation"). Remplace l'ancienne
 * page simpliste qui se limitait à sélectionner un employé et dire
 * qu'il était en sécurité.
 *
 * Sections :
 *  1. Bandeau d'urgence animé (alerte active / terminée)
 *  2. KPI row : Alertes actives, En cours d'évacuation, Personnes en sécurité, Manquants
 *  3. Grille principale 2/3 + 1/3 :
 *     - Gauche : Points de rassemblement avec jauges capacité + caméras
 *     - Droite : Statut évacuation donut + Alertes récentes + Communications
 *  4. Panneau head-count par catégorie métier (garde la logique existante)
 *  5. Modal admin : mise à jour statut employé
 */

interface EmployeeEnriched {
    id: number;
    name: string;
    department?: string;
    position?: string;
}

interface AssemblyPointLive extends AssemblyPointDTO {
    currentOccupancy: number;
    cameras: CameraDTO[];
}

const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatTimeShort = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatElapsed = (sec?: number) => {
    if (sec == null) return '—';
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${sec % 60}s`;
    return `${sec}s`;
};

const GeneralAlertDetailPage = () => {
    const { t } = useTranslation(['emergency', 'common', 'navigation']);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const currentUser = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const { subscribeGeneralAlert } = useEmergencyWebSocket();
    // Seul un coordinateur (ou un admin) peut mettre fin à l'alerte (backend idem).
    const { canClose } = useCanCloseEmergency(currentUser?.id, currentUser?.role);

    const [alert, setAlert] = useState<GeneralAlertDTO | null>(null);
    const [checkIns, setCheckIns] = useState<EvacuationCheckInDTO[]>([]);
    const [employees, setEmployees] = useState<EmployeeEnriched[]>([]);
    const [assemblyPoints, setAssemblyPoints] = useState<AssemblyPointLive[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [endOpen, setEndOpen] = useState(false);
    const [ending, setEnding] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<EmployeeEnriched | null>(null);
    const [editStatus, setEditStatus] = useState<CheckInStatus>('SAFE');
    const [editNote, setEditNote] = useState('');
    const [editSaving, setEditSaving] = useState(false);
    const [elapsedLive, setElapsedLive] = useState(0);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'points' | 'headcount' | 'rollcall'>('dashboard');

    /** Ouvre l'écran géant détaché dans un nouvel onglet (mur d'images). */
    const openWallboard = () => {
        if (!alert?.id) return;
        window.open(`/emergency/wall/general/${alert.id}`, '_blank', 'noopener');
    };

    // ── Load ──
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            getAlert(Number(id)).then(setAlert),
            getAlertCheckIns(Number(id)).then(setCheckIns).catch(() => setCheckIns([])),
        ])
            .catch(() => setLoadError('Alerte introuvable.'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        getEmployeesWithDepartment()
            .then((res: any[]) => {
                const list: EmployeeEnriched[] = Array.isArray(res)
                    ? res.map((e) => ({
                          id: e.id,
                          name: e.name || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
                          department: e.department,
                          position: e.position,
                      }))
                    : [];
                setEmployees(list);
            })
            .catch(() => setEmployees([]));
    }, []);

    // ── Assembly points + cameras ──
    useEffect(() => {
        if (!selectedCompanyId) return;
        listAssemblyPoints(selectedCompanyId)
            .then(async (points) => {
                const enriched: AssemblyPointLive[] = await Promise.all(
                    points.map(async (pt) => {
                        let cameras: CameraDTO[] = [];
                        try {
                            cameras = pt.id ? await listCameras(pt.id) : [];
                        } catch { /* cameras not available yet */ }
                        return { ...pt, currentOccupancy: 0, cameras };
                    })
                );
                setAssemblyPoints(enriched);
            })
            .catch(() => setAssemblyPoints([]));
    }, [selectedCompanyId]);

    // ── Live elapsed timer ──
    useEffect(() => {
        if (!alert || alert.status !== 'ACTIVE') return;
        setElapsedLive(alert.elapsedSeconds ?? 0);
        const iv = setInterval(() => setElapsedLive((p) => p + 1), 1000);
        return () => clearInterval(iv);
    }, [alert]);

    // ── Live updates ──
    useEffect(() => {
        if (!id) return;
        const unsubscribe = subscribeGeneralAlert((updated) => {
            if (updated.id === Number(id)) {
                setAlert(updated);
                getAlertCheckIns(Number(id)).then(setCheckIns).catch((e) => console.error("Failed to refresh check-ins", e));
            }
        });
        return unsubscribe;
    }, [id, subscribeGeneralAlert]);

    // ── Compute occupancy per assembly point ──
    useEffect(() => {
        if (assemblyPoints.length === 0 || checkIns.length === 0) return;
        setAssemblyPoints((prev) =>
            prev.map((pt) => ({
                ...pt,
                currentOccupancy: checkIns.filter(
                    (c) => c.assemblyPointId === pt.id && c.status === 'SAFE'
                ).length,
            }))
        );
    }, [checkIns]);

    // ── Compute by category ──
    const checkedInByEmployee = useMemo(() => {
        const m = new Map<number, EvacuationCheckInDTO>();
        checkIns.forEach((c) => m.set(c.employeeId, c));
        return m;
    }, [checkIns]);

    const byCategory = useMemo(() => {
        const deptNames = new Set<string>();
        employees.forEach((e) => { if (e.department) deptNames.add(e.department); });
        const dummyDepts = Array.from(deptNames).map((name, idx) => ({ id: idx, name }));
        const groups = groupByCategory(dummyDepts);

        const computeForCategory = (deps: { name: string }[]) => {
            const employeesInCat = employees.filter((e) => e.department && deps.some((d) => d.name.toLowerCase() === e.department!.toLowerCase()));
            const statusOf = (e: EmployeeEnriched) => checkedInByEmployee.get(e.id)?.status;
            const safe = employeesInCat.filter((e) => statusOf(e) === 'SAFE').length;
            const injured = employeesInCat.filter((e) => statusOf(e) === 'INJURED').length;
            // « missing » = absence CONSTATÉE + personnes qu'aucun pointage n'a
            // encore couvertes. On en exclut explicitement les NOT_APPLICABLE :
            // les compter comme manquants (ancien calcul par soustraction) ferait
            // chercher des employés en congé pendant une évacuation.
            const notApplicable = employeesInCat.filter((e) => statusOf(e) === 'NOT_APPLICABLE').length;
            const missing = employeesInCat.length - safe - injured - notApplicable;
            return { total: employeesInCat.length, safe, injured, missing, employees: employeesInCat };
        };

        return {
            general: computeForCategory(groups.general),
            operations: computeForCategory(groups.operations),
            technical: computeForCategory(groups.technical),
        };
    }, [employees, checkedInByEmployee]);

    // ── Actions ──
    /**
     * Fusionne les pointages renvoyés par l'appel nominatif dans l'état local.
     * Clé de fusion = employeeId (un seul pointage par employé et par alerte),
     * ce qui rend l'opération idempotente : mise à jour optimiste puis
     * réconciliation serveur passent par le même chemin sans doublon.
     */
    const mergeCheckIns = (incoming: EvacuationCheckInDTO[]) => {
        if (!incoming || incoming.length === 0) return;
        setCheckIns((prev) => {
            const byEmployee = new Map<number, EvacuationCheckInDTO>();
            prev.forEach((c) => byEmployee.set(c.employeeId, c));
            incoming.forEach((c) => byEmployee.set(c.employeeId, c));
            return Array.from(byEmployee.values());
        });
    };

    const openEditStatus = (employee: EmployeeEnriched) => {
        setEditingEmployee(employee);
        const existing = checkedInByEmployee.get(employee.id);
        setEditStatus(existing?.status ?? 'SAFE');
        setEditNote(existing?.note ?? '');
    };

    const closeEditStatus = () => {
        if (editSaving) return;
        setEditingEmployee(null);
        setEditNote('');
    };

    const handleSaveEmployeeStatus = async () => {
        if (!editingEmployee || !alert?.id) return;
        // Gel irréversible : une alerte terminée n'accepte plus aucun pointage
        // (le serveur le refuse aussi — ceci évite l'appel et informe l'agent).
        if (alert.status !== 'ACTIVE') {
            errorNotification('Alerte terminée — le pointage est figé et ne peut plus être modifié.');
            return;
        }
        setEditSaving(true);
        try {
            await checkInToAlert({
                alertId: alert.id,
                employeeId: editingEmployee.id,
                status: editStatus,
                note: editNote || null,
                actorId: currentUser?.id,
            });
            const updated = await getAlertCheckIns(alert.id);
            setCheckIns(updated);
            const updatedAlert = await getAlert(alert.id);
            setAlert(updatedAlert);
            successNotification(`Statut de ${editingEmployee.name} mis à jour : ${editStatus}`);
            closeEditStatus();
        } catch (err) {
            errorNotification(extractErrorMessage(err, 'Échec de la mise à jour du statut'));
        } finally {
            setEditSaving(false);
        }
    };

    const handleEnd = async () => {
        if (!alert?.id) return;
        setEnding(true);
        try {
            const updated = await endAlert(alert.id, currentUser?.id);
            setAlert(updated);
            setEndOpen(false);
            successNotification('Alerte Générale terminée');
        } catch (err) {
            errorNotification(extractErrorMessage(err, "Échec de la fin d'alerte"));
        } finally {
            setEnding(false);
        }
    };

    // ── Loading / Error states ──
    if (loading) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                    <IconUrgent size={28} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                    <p className="text-[13px] text-slate-500">{t('common:messages.loadingData')}</p>
                </div>
            </div>
        );
    }
    if (loadError || !alert) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-red-50/60 border border-red-200 rounded-xl p-8 text-center">
                    <IconAlertTriangle size={32} className="text-red-500 mx-auto mb-3" stroke={1.6} />
                    <p className="text-[13px] text-slate-700 mb-4">{loadError ?? 'Données indisponibles.'}</p>
                    <button onClick={() => navigate('/emergency/sos')} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800">
                        <IconArrowLeft size={12} stroke={2} /> Retour
                    </button>
                </div>
            </div>
        );
    }

    const isActive = alert.status === 'ACTIVE';
    const totals = {
        total: byCategory.general.total + byCategory.operations.total + byCategory.technical.total,
        safe: byCategory.general.safe + byCategory.operations.safe + byCategory.technical.safe,
        injured: byCategory.general.injured + byCategory.operations.injured + byCategory.technical.injured,
        missing: byCategory.general.missing + byCategory.operations.missing + byCategory.technical.missing,
    };
    const evacuatedPct = totals.total === 0 ? 0 : Math.round((totals.safe / totals.total) * 100);
    const totalCameras = assemblyPoints.reduce((sum, pt) => sum + pt.cameras.length, 0);
    const onlineCameras = assemblyPoints.reduce((sum, pt) => sum + pt.cameras.filter((c) => c.status === 'ONLINE').length, 0);

    return (
        <div className="px-4 lg:px-6 py-5 min-h-screen" style={{ background: '#F8FAFC' }}>
            <PageHeader
                breadcrumbs={[
                    { label: t('navigation:breadcrumbs.home'), to: '/' },
                    { label: t('emergency:module.name') },
                    { label: 'Alerte Générale' },
                    { label: `#${alert.id}` },
                ]}
                useSafeXLogo
                title="Centre de Commande Évacuation"
                subtitle={`Alerte #${alert.id} · ${formatReasonCode(alert.reasonCode)} · ${alert.drillMode ? 'EXERCICE' : 'RÉEL'}`}
                actions={
                    <>
                        <button
                            onClick={() => navigate('/emergency/assembly-points')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 shadow-sm"
                        >
                            <IconMapPin size={12} stroke={2} /> Points de rassemblement
                        </button>
                        <button
                            onClick={openWallboard}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800 shadow-sm"
                            title="Ouvrir la salle de crise sur un écran géant"
                        >
                            <IconMaximize size={12} stroke={2} /> Voir la Salle de Crise
                        </button>
                        {isActive && canClose && (
                            <button onClick={() => setEndOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-[12.5px] font-semibold hover:bg-red-700 shadow-sm">
                                <IconArchive size={12} stroke={1.8} /> Mettre fin à l'alerte
                            </button>
                        )}
                        {isActive && !canClose && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 text-[12px] font-medium" title="La clôture est réservée à un coordinateur des urgences">
                                <IconShieldCheck size={12} stroke={1.8} /> Clôture réservée au coordinateur
                            </span>
                        )}
                    </>
                }
            />

            {/* ═══ BANDEAU D'URGENCE (compact) ═══ */}
            <div className={`mt-4 rounded-xl px-5 py-3 shadow-md ${
                isActive
                    ? 'bg-gradient-to-r from-red-700 via-red-600 to-orange-600 text-white'
                    : 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white'
            }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 flex-shrink-0">
                            {isActive ? (
                                <IconBellRinging size={20} stroke={2} className="animate-pulse" />
                            ) : (
                                <IconShieldCheck size={20} stroke={2} />
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold opacity-90">
                                    {isActive ? 'ALERTE EN COURS' : 'ALERTE TERMINÉE'}
                                </p>
                                {isActive && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white" /> Live
                                    </span>
                                )}
                                <span className="text-[15px] font-semibold truncate" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                    {alert.message || 'Évacuation générale du site'}
                                </span>
                            </div>
                            <p className="text-[11px] opacity-85 mt-0.5 truncate">
                                Périmètre :{' '}
                                {alert.zoneScope === 'SELECTION' && (alert.zoneNames?.length ?? 0) > 0
                                    ? `zones à évacuer — ${alert.zoneNames!.join(', ')}`
                                    : 'toute la mine'}
                                {' · '}Déclenchée par {alert.triggeredByName || '—'} · {formatTime(alert.triggeredAt)}
                            </p>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-[9.5px] uppercase tracking-wider opacity-80">Durée écoulée</p>
                        <p className="text-[24px] font-mono leading-none font-bold">
                            {isActive ? formatElapsed(elapsedLive) : formatElapsed(alert.elapsedSeconds)}
                        </p>
                        {!isActive && alert.endedAt && (
                            <p className="text-[10px] opacity-80 mt-0.5">Fin : {formatTime(alert.endedAt)}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ GRILLE PRINCIPALE ═══ */}
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* ── Colonne gauche : 2/3 ── */}
                <div className="xl:col-span-2 space-y-5">
                    {/* Tabs : Points de rassemblement / Head-count */}
                    <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
                        <TabBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<IconChartBar size={13} stroke={1.8} />}>
                            Tableau de bord
                        </TabBtn>
                        <TabBtn active={activeTab === 'rollcall'} onClick={() => setActiveTab('rollcall')} icon={<IconClipboardList size={13} stroke={1.8} />}>
                            Appel nominatif
                        </TabBtn>
                        <TabBtn active={activeTab === 'headcount'} onClick={() => setActiveTab('headcount')} icon={<IconUsers size={13} stroke={1.8} />}>
                            Total
                        </TabBtn>
                    </div>

                    {activeTab === 'dashboard' && (
                        <EvacuationDashboard
                            employees={employees}
                            checkIns={checkIns}
                            assemblyPoints={assemblyPoints}
                            triggeredAt={alert.triggeredAt}
                            isActive={isActive}
                            nowMs={Date.now()}
                        />
                    )}

                    {activeTab === 'rollcall' && (
                        <EvacuationRollCall
                            alertId={Number(id)}
                            employees={employees}
                            checkIns={checkIns}
                            isActive={isActive}
                            actorId={currentUser?.id}
                            onCheckInsUpdated={mergeCheckIns}
                            onOpenDetail={openEditStatus}
                        />
                    )}

                    {activeTab === 'points' && (
                        <div className="space-y-3">
                            {assemblyPoints.length === 0 ? (
                                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                                    <IconMapPin size={28} className="text-slate-300 mx-auto mb-2" />
                                    <p className="text-[13px] text-slate-500">Aucun point de rassemblement configuré.</p>
                                    <button
                                        onClick={() => navigate('/emergency/assembly-points/new')}
                                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700"
                                    >
                                        <IconMapPin size={12} stroke={2} /> Créer un point
                                    </button>
                                </div>
                            ) : (
                                assemblyPoints.map((pt) => (
                                    <AssemblyPointCard
                                        key={pt.id}
                                        point={pt}
                                        isActive={isActive}
                                        onNavigate={() => navigate(`/emergency/assembly-points/${pt.id}`)}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'headcount' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {CATEGORIES.map((cat) => {
                                const stats = byCategory[cat.key];
                                if (stats.total === 0) return null;
                                return (
                                    <CategoryPanel
                                        key={cat.key}
                                        title={cat.label}
                                        description={cat.description}
                                        stats={stats}
                                        checkedInByEmployee={checkedInByEmployee}
                                        onEditEmployee={openEditStatus}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Colonne droite : 1/3 ── */}
                <div className="space-y-5">
                    {/* Statut d'évacuation — donut */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                        <h3 className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-4 flex items-center gap-2">
                            <IconShieldCheck size={13} stroke={1.8} className="text-emerald-600" />
                            Statut des évacuations
                        </h3>
                        <div className="flex items-center justify-center">
                            <RingProgress
                                size={160}
                                thickness={14}
                                roundCaps
                                label={
                                    <div className="text-center">
                                        <p className="text-[28px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                            {evacuatedPct}%
                                        </p>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1">Évacué</p>
                                    </div>
                                }
                                sections={[
                                    { value: totals.total === 0 ? 0 : (totals.safe / totals.total) * 100, color: '#10B981' },
                                    { value: totals.total === 0 ? 0 : (totals.injured / totals.total) * 100, color: '#F59E0B' },
                                    { value: totals.total === 0 ? 0 : (totals.missing / totals.total) * 100, color: '#EF4444' },
                                ]}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <MiniStat label="Évacués" value={totals.safe} color="emerald" />
                            <MiniStat label="Blessés" value={totals.injured} color="amber" />
                            <MiniStat label="Manquants" value={totals.missing} color="red" />
                        </div>
                        {totals.total > 0 && (
                            <div className="mt-3 text-center">
                                <p className="text-[11px] text-slate-500">
                                    Total : <strong className="text-slate-700">{totals.total.toLocaleString('fr-FR')}</strong> personnes
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Caméras de surveillance */}
                    {totalCameras > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                            <h3 className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-3 flex items-center gap-2">
                                <IconCamera size={13} stroke={1.8} className="text-sky-600" />
                                Caméras de surveillance
                            </h3>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[11px] text-slate-600">{onlineCameras} en ligne</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                    <span className="text-[11px] text-slate-600">{totalCameras - onlineCameras} hors ligne</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                {assemblyPoints.flatMap((pt) =>
                                    pt.cameras.map((cam) => (
                                        <div key={cam.id ?? cam.name} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100">
                                            {cam.status === 'ONLINE' ? (
                                                <IconWifi size={12} stroke={1.8} className="text-emerald-600 flex-shrink-0" />
                                            ) : (
                                                <IconWifiOff size={12} stroke={1.8} className="text-red-400 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11.5px] font-medium text-slate-800 truncate">{cam.name}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{pt.name} · {cam.ipAddress || '—'}</p>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                                cam.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-700' :
                                                cam.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {cam.status === 'ONLINE' ? 'En ligne' : cam.status === 'MAINTENANCE' ? 'Maint.' : 'Hors ligne'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Communications */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                        <h3 className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-3 flex items-center gap-2">
                            <IconMessageCircle size={13} stroke={1.8} className="text-violet-600" />
                            Communications
                        </h3>
                        <div className="space-y-2">
                            <CommLine
                                icon={<IconBell size={12} stroke={1.8} />}
                                label="Alerte envoyée"
                                detail="Tous les utilisateurs"
                                time={formatTimeShort(alert.triggeredAt)}
                                color="red"
                            />
                            <CommLine
                                icon={<IconBellRinging size={12} stroke={1.8} />}
                                label="Sirène déclenchée"
                                detail="Tous les postes"
                                time={formatTimeShort(alert.triggeredAt)}
                                color="orange"
                            />
                            <CommLine
                                icon={<IconPhone size={12} stroke={1.8} />}
                                label="Message vocal TTS"
                                detail="Annonce en français"
                                time={formatTimeShort(alert.triggeredAt)}
                                color="sky"
                            />
                            {alert.endedAt && (
                                <CommLine
                                    icon={<IconShieldCheck size={12} stroke={1.8} />}
                                    label="Fin d'alerte"
                                    detail={`Par ${alert.endedByName || 'admin'}`}
                                    time={formatTimeShort(alert.endedAt)}
                                    color="emerald"
                                />
                            )}
                        </div>
                    </div>

                    {/* Alertes récentes (check-ins) */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                        <h3 className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-3 flex items-center gap-2">
                            <IconEye size={13} stroke={1.8} className="text-amber-600" />
                            Derniers pointages
                        </h3>
                        {checkIns.length === 0 ? (
                            <p className="text-[12px] text-slate-400 italic text-center py-4">Aucun pointage enregistré.</p>
                        ) : (
                            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                                {[...checkIns]
                                    .sort((a, b) => new Date(b.checkedAt ?? '').getTime() - new Date(a.checkedAt ?? '').getTime())
                                    .slice(0, 15)
                                    .map((ci, i) => {
                                        const StatusIcon = STATUS_COLORS[ci.status].icon;
                                        return (
                                            <div key={ci.id ?? i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${STATUS_COLORS[ci.status].bg}`}>
                                                    <StatusIcon size={12} stroke={1.8} className={STATUS_COLORS[ci.status].text} />
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11.5px] font-medium text-slate-800 truncate">{ci.employeeName || `#${ci.employeeId}`}</p>
                                                    <p className="text-[10px] text-slate-500 truncate">
                                                        {ci.assemblyPointName || ci.employeeDepartment || '—'}
                                                    </p>
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLORS[ci.status].bg} ${STATUS_COLORS[ci.status].text}`}>
                                                    {ci.status === 'SAFE' ? 'Sécu' : ci.status === 'INJURED' ? 'Blessé' : 'Manq.'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">{formatTimeShort(ci.checkedAt)}</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ════ Modal Admin : modifier le statut d'un employé ════ */}
            <Modal
                opened={editingEmployee !== null}
                onClose={closeEditStatus}
                centered
                size="md"
                withCloseButton={false}
                title={
                    <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-700 rounded-full p-1.5 flex items-center justify-center">
                            <IconUser size={14} stroke={1.8} />
                        </span>
                        <div>
                            <p className="text-slate-800 text-[14px]" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>
                                Mettre à jour le statut
                            </p>
                            {editingEmployee && (
                                <p className="text-[11.5px] text-slate-500">
                                    {editingEmployee.name}
                                    {editingEmployee.position && ` · ${editingEmployee.position}`}
                                </p>
                            )}
                        </div>
                    </div>
                }
            >
                <div className="space-y-4 mt-2">
                    <p className="text-[12px] text-slate-600 bg-amber-50 border border-amber-200 rounded-md p-3 leading-relaxed">
                        <strong>Admin :</strong> vous pouvez forcer le statut de cet employé si vous avez
                        une confirmation directe (radio, téléphone, présence vérifiée) ou si l'employé
                        vous a communiqué son état.
                    </p>

                    <div>
                        <label className="block text-[11px] uppercase tracking-wider text-slate-600 font-semibold mb-2">Nouveau statut</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['SAFE', 'INJURED', 'MISSING', 'NOT_APPLICABLE'] as CheckInStatus[]).map((s) => {
                                const conf = STATUS_BTN[s];
                                const active = editStatus === s;
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setEditStatus(s)}
                                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-md border-2 transition-colors ${
                                            active ? conf.active : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <conf.icon size={18} stroke={1.8} />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">{conf.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-wider text-slate-600 font-semibold mb-1.5">
                            Note (source de l'information)
                        </label>
                        <textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            rows={3}
                            placeholder="Ex : Confirmation radio à 14h32 — employé au poste de garde sud"
                            className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                        />
                        <p className="text-[10.5px] text-slate-500 mt-1">
                            Cette note sera tracée dans le journal d'audit avec votre identité.
                        </p>
                    </div>

                    {!isActive && (
                        <div className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-100 text-slate-600 text-[12px] font-medium">
                            <IconArchive size={13} stroke={1.8} /> Alerte terminée — le pointage est figé, aucun statut ne peut plus être modifié.
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button type="button" onClick={closeEditStatus} disabled={editSaving} className="inline-flex items-center gap-1 px-3.5 py-2 rounded-md border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 disabled:opacity-50">
                            <IconX size={12} stroke={2} /> {isActive ? 'Annuler' : 'Fermer'}
                        </button>
                        {isActive && (
                            <button type="button" onClick={handleSaveEmployeeStatus} disabled={editSaving} className="inline-flex items-center gap-1 px-3.5 py-2 rounded-md bg-amber-600 text-white text-[12.5px] font-semibold hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50">
                                <IconShieldCheck size={12} stroke={2} />
                                {editSaving ? 'Enregistrement…' : 'Enregistrer le statut'}
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                opened={endOpen}
                onClose={() => setEndOpen(false)}
                onConfirm={handleEnd}
                tone="warning"
                title="Mettre fin à l'Alerte Générale ?"
                message={
                    <>
                        La sirène et la voix TTS s'arrêteront chez tous les employés. Ils pourront
                        reprendre leur poste. L'historique de l'évacuation reste conservé.
                    </>
                }
                confirmLabel="Mettre fin à l'alerte"
                loading={ending}
            />
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_COLORS: Record<CheckInStatus, { bg: string; text: string; icon: any }> = {
    SAFE:           { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: IconShieldCheck },
    INJURED:        { bg: 'bg-amber-100',   text: 'text-amber-700',   icon: IconStethoscope },
    MISSING:        { bg: 'bg-red-100',     text: 'text-red-700',     icon: IconShieldX },
    NOT_APPLICABLE: { bg: 'bg-slate-100',   text: 'text-slate-600',   icon: IconCircleMinus },
};

const STATUS_BTN: Record<CheckInStatus, { icon: any; label: string; active: string }> = {
    SAFE:           { icon: IconShieldCheck, label: 'En sécurité',   active: 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200' },
    INJURED:        { icon: IconStethoscope, label: 'Blessé',        active: 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200' },
    MISSING:        { icon: IconShieldX,     label: 'Absent',        active: 'bg-red-50 border-red-500 text-red-900 ring-2 ring-red-200' },
    NOT_APPLICABLE: { icon: IconCircleMinus, label: 'Non concerné',  active: 'bg-slate-100 border-slate-500 text-slate-900 ring-2 ring-slate-200' },
};

const KPI_STYLES: Record<string, { bg: string; border: string; icon: string; value: string }> = {
    red:     { bg: 'bg-red-50',     border: 'border-red-200',     icon: 'text-red-600',     value: 'text-red-700' },
    orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  icon: 'text-orange-600',  value: 'text-orange-700' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', value: 'text-emerald-700' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-600',   value: 'text-amber-700' },
    slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',   icon: 'text-slate-600',   value: 'text-slate-700' },
};

function KpiCard({ icon, label, value, accent, highlight }: {
    icon: React.ReactNode; label: string; value: string; accent: string; highlight?: boolean;
}) {
    const s = KPI_STYLES[accent] ?? KPI_STYLES.slate;
    return (
        <div className={`${s.bg} border ${s.border} rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md ${highlight ? 'ring-2 ring-red-300 animate-pulse' : ''}`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border ${s.border} ${s.icon}`}>
                    {icon}
                </span>
            </div>
            <p className={`text-[28px] leading-none font-bold ${s.value}`} style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                {value}
            </p>
            <p className="text-[10.5px] uppercase tracking-[0.12em] text-slate-500 font-semibold mt-1.5">{label}</p>
        </div>
    );
}

function TabBtn({ active, onClick, icon, children }: {
    active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
                active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
            {icon}
            {children}
        </button>
    );
}

function AssemblyPointCard({ point, isActive, onNavigate }: {
    point: AssemblyPointLive; isActive: boolean; onNavigate: () => void;
}) {
    const capacity = point.maxCapacity ?? 150;
    const occupancy = point.currentOccupancy;
    const pct = Math.min(100, Math.round((occupancy / capacity) * 100));
    const onlineCams = point.cameras.filter((c) => c.status === 'ONLINE').length;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            pct >= 80 ? 'bg-red-100 text-red-600' : pct >= 50 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                            <IconMapPin size={18} stroke={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="text-[14px] font-semibold text-slate-900 truncate" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                    {point.name}
                                </h4>
                                {point.evacuationPriority === 1 && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700">P1</span>
                                )}
                            </div>
                            <p className="text-[11.5px] text-slate-500 truncate">{point.locationText || point.description || '—'}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onNavigate}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                    >
                        Détails <IconChevronRight size={11} stroke={2} />
                    </button>
                </div>

                {/* Jauge capacité */}
                <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-600">{occupancy} / {capacity} <span className="text-slate-400">occupants</span></span>
                        <span className={`font-bold ${pct >= 80 ? 'text-red-600' : pct >= 50 ? 'text-amber-600' : 'text-emerald-600'}`}>{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-[width] duration-500 ${
                                pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                {/* Footer : caméras + infos */}
                {point.cameras.length > 0 && (
                    <div className="mt-3 flex items-center gap-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <IconCamera size={12} stroke={1.8} className="text-sky-600" />
                            {onlineCams}/{point.cameras.length} caméra{point.cameras.length > 1 ? 's' : ''}
                        </div>
                        {point.cameras.map((cam) => (
                            <span key={cam.id ?? cam.name} className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                cam.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                            }`}>
                                {cam.status === 'ONLINE' ? <IconWifi size={9} stroke={2} /> : <IconWifiOff size={9} stroke={2} />}
                                {cam.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: 'emerald' | 'amber' | 'red' }) {
    const map = {
        emerald: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
        amber:   { dot: 'bg-amber-500',   text: 'text-amber-700' },
        red:     { dot: 'bg-red-500',      text: 'text-red-700' },
    };
    return (
        <div className="text-center py-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${map[color].dot}`} />
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
            </div>
            <p className={`text-[18px] font-bold leading-none ${map[color].text}`}>{value}</p>
        </div>
    );
}

function CommLine({ icon, label, detail, time, color }: {
    icon: React.ReactNode; label: string; detail: string; time: string; color: string;
}) {
    const bg = color === 'red' ? 'bg-red-100' : color === 'orange' ? 'bg-orange-100' : color === 'sky' ? 'bg-sky-100' : 'bg-emerald-100';
    const txt = color === 'red' ? 'text-red-600' : color === 'orange' ? 'text-orange-600' : color === 'sky' ? 'text-sky-600' : 'text-emerald-600';
    return (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${bg} ${txt} flex-shrink-0`}>
                {icon}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800">{label}</p>
                <p className="text-[10.5px] text-slate-500 truncate">{detail}</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">{time}</span>
        </div>
    );
}

function CategoryPanel({
    title, description, stats, checkedInByEmployee, onEditEmployee,
}: {
    title: string;
    description: string;
    stats: { total: number; safe: number; injured: number; missing: number; employees: EmployeeEnriched[] };
    checkedInByEmployee: Map<number, EvacuationCheckInDTO>;
    onEditEmployee?: (employee: EmployeeEnriched) => void;
}) {
    const pct = stats.total === 0 ? 0 : Math.round((stats.safe / stats.total) * 100);
    return (
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <header className="px-4 py-3 border-b border-slate-100 bg-slate-50/40">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-700" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                    {title}
                </h3>
                <p className="text-[10.5px] text-slate-500 mt-0.5">{description}</p>
            </header>
            <div className="p-4">
                <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                        <span>{stats.safe} / {stats.total} en sécurité</span>
                        <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${pct}%` }} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <Mini label="Sécu" value={stats.safe} color="emerald" />
                    <Mini label="Bless." value={stats.injured} color="amber" />
                    <Mini label="Manq." value={stats.missing} color="red" />
                </div>

                {stats.missing > 0 && (
                    <details className="text-[12px]" open>
                        <summary className="cursor-pointer text-red-700 font-semibold mb-1.5">
                            {stats.missing} manquant(s) — cliquer pour vérifier
                        </summary>
                        <ul className="space-y-1 mt-1">
                            {stats.employees
                                .filter((e) => !checkedInByEmployee.has(e.id))
                                .slice(0, 8)
                                .map((e) => (
                                    <li key={e.id}>
                                        <button
                                            type="button"
                                            onClick={() => onEditEmployee?.(e)}
                                            title="Modifier le statut de cet employé"
                                            className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-red-50 border border-red-100 rounded text-[11.5px] text-red-900 text-left hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
                                        >
                                            <IconUser size={11} stroke={1.8} className="text-red-500 flex-shrink-0" />
                                            <span className="truncate flex-1">{e.name}</span>
                                            {e.position && <span className="text-[10px] text-red-600 truncate">{e.position}</span>}
                                            <span className="text-[10px] text-red-700 font-semibold opacity-70 ml-1">→</span>
                                        </button>
                                    </li>
                                ))}
                            {stats.missing > 8 && (
                                <li className="text-[10px] text-slate-500 italic px-2 mt-1">+ {stats.missing - 8} autres…</li>
                            )}
                        </ul>
                    </details>
                )}
            </div>
        </section>
    );
}

function Mini({ label, value, color }: { label: string; value: number; color: 'emerald' | 'amber' | 'red' }) {
    const map = {
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        amber:   'bg-amber-50 border-amber-200 text-amber-700',
        red:     'bg-red-50 border-red-200 text-red-700',
    };
    return (
        <div className={`text-center px-1.5 py-1.5 rounded border ${map[color]}`}>
            <p className="text-[16px] font-bold leading-none">{value}</p>
            <p className="text-[9px] uppercase tracking-wider mt-0.5 opacity-80">{label}</p>
        </div>
    );
}

export default GeneralAlertDetailPage;
