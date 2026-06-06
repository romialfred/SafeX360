import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconClock,
    IconUsers,
    IconShieldCheck,
    IconStethoscope,
    IconShieldX,
    IconBuildingBank,
    IconUrgent,
    IconArchive,
    IconUser,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import ConfirmModal from '../../UtilityComp/ConfirmModal';
import { useAppSelector } from '../../../slices/hooks';
import {
    getAlert,
    getAlertCheckIns,
    endAlert,
    type GeneralAlertDTO,
    type EvacuationCheckInDTO,
    type CheckInStatus,
} from '../../../services/GeneralAlertService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { useEmergencyWebSocket } from '../Sos/EmergencyWebSocketProvider';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import { groupByCategory, CATEGORIES } from '../AssemblyPoints/departmentCategories';

/**
 * Page Suivi d'évacuation pour une Alerte Générale (LOT 48 Phase 4).
 *
 * <p>Coordinateur vue : tableau Effectif Total / En sécurité / Blessés /
 * Manquants groupé par catégorie métier (Services Généraux, Opérations,
 * Technique & HSE). Bouton « Mettre fin à l'alerte » au sommet.</p>
 */

interface EmployeeEnriched {
    id: number;
    name: string;
    department?: string;
    position?: string;
}

const STATUS_COLORS: Record<CheckInStatus, { bg: string; text: string; icon: any }> = {
    SAFE:    { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: IconShieldCheck },
    INJURED: { bg: 'bg-amber-100',   text: 'text-amber-700',   icon: IconStethoscope },
    MISSING: { bg: 'bg-red-100',     text: 'text-red-700',     icon: IconShieldX },
};

const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
    const { subscribeGeneralAlert } = useEmergencyWebSocket();

    const [alert, setAlert] = useState<GeneralAlertDTO | null>(null);
    const [checkIns, setCheckIns] = useState<EvacuationCheckInDTO[]>([]);
    const [employees, setEmployees] = useState<EmployeeEnriched[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [endOpen, setEndOpen] = useState(false);
    const [ending, setEnding] = useState(false);

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

    // ── Live updates ──
    useEffect(() => {
        if (!id) return;
        const unsubscribe = subscribeGeneralAlert((updated) => {
            if (updated.id === Number(id)) {
                setAlert(updated);
                getAlertCheckIns(Number(id)).then(setCheckIns).catch(() => {});
            }
        });
        return unsubscribe;
    }, [id, subscribeGeneralAlert]);

    // ── Compute by category ──
    const checkedInByEmployee = useMemo(() => {
        const m = new Map<number, EvacuationCheckInDTO>();
        checkIns.forEach((c) => m.set(c.employeeId, c));
        return m;
    }, [checkIns]);

    /** Catégorise les départements présents puis compte les employés par statut. */
    const byCategory = useMemo(() => {
        // Liste unique des départements présents chez les employés
        const deptNames = new Set<string>();
        employees.forEach((e) => { if (e.department) deptNames.add(e.department); });
        const dummyDepts = Array.from(deptNames).map((name, idx) => ({ id: idx, name }));
        const groups = groupByCategory(dummyDepts);

        const computeForCategory = (deps: { name: string }[]) => {
            const employeesInCat = employees.filter((e) => e.department && deps.some((d) => d.name.toLowerCase() === e.department!.toLowerCase()));
            const safe = employeesInCat.filter((e) => checkedInByEmployee.get(e.id)?.status === 'SAFE').length;
            const injured = employeesInCat.filter((e) => checkedInByEmployee.get(e.id)?.status === 'INJURED').length;
            const missing = employeesInCat.length - safe - injured;
            return { total: employeesInCat.length, safe, injured, missing, employees: employeesInCat };
        };

        return {
            general: computeForCategory(groups.general),
            operations: computeForCategory(groups.operations),
            technical: computeForCategory(groups.technical),
        };
    }, [employees, checkedInByEmployee]);

    // ── Actions ──
    const handleEnd = async () => {
        if (!alert?.id) return;
        setEnding(true);
        try {
            const updated = await endAlert(alert.id, currentUser?.id);
            setAlert(updated);
            setEndOpen(false);
            successNotification('Alerte Générale terminée');
        } catch {
            errorNotification('Échec de la fin d\'alerte');
        } finally {
            setEnding(false);
        }
    };

    // ── Empty / error ──
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

    return (
        <div className="px-4 lg:px-6 py-5">
            <PageHeader
                breadcrumbs={[
                    { label: t('navigation:breadcrumbs.home'), to: '/' },
                    { label: t('emergency:module.name') },
                    { label: 'Alerte Générale' },
                    { label: `#${alert.id}` },
                ]}
                useSafeXLogo
                title={`Alerte Générale #${alert.id}`}
                subtitle={alert.reasonCode ?? 'Évacuation'}
                actions={
                    <>
                        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 shadow-sm">
                            <IconArrowLeft size={12} stroke={2} /> Retour
                        </button>
                        {isActive && (
                            <button onClick={() => setEndOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 text-white text-[12.5px] font-semibold hover:bg-slate-900 shadow-sm">
                                <IconArchive size={12} stroke={1.8} /> Mettre fin à l'alerte
                            </button>
                        )}
                    </>
                }
            />

            {/* Bandeau statut */}
            <div className={`mt-5 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm ${
                isActive ? 'bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
                <div className="flex items-center gap-3">
                    {isActive ? <IconUrgent size={32} stroke={2.2} /> : <IconShieldCheck size={32} stroke={2.2} />}
                    <div>
                        <p className="text-[10.5px] uppercase tracking-[0.15em] font-bold opacity-90">
                            {isActive ? 'ALERTE EN COURS' : 'ALERTE TERMINÉE'}
                        </p>
                        <p className="text-[18px] mt-0.5" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>
                            {alert.message || 'Évacuation générale'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10.5px] uppercase tracking-wider opacity-80">Durée</p>
                    <p className="text-[22px] font-mono" style={{ fontWeight: 600 }}>{formatElapsed(alert.elapsedSeconds)}</p>
                </div>
            </div>

            {/* KPI ligne */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                <KpiCard icon={<IconUsers size={14} stroke={1.7} />} label="Effectif total" value={totals.total} accent="slate" />
                <KpiCard icon={<IconShieldCheck size={14} stroke={1.7} />} label="En sécurité" value={totals.safe} accent="emerald" />
                <KpiCard icon={<IconStethoscope size={14} stroke={1.7} />} label="Blessés" value={totals.injured} accent="amber" />
                <KpiCard icon={<IconShieldX size={14} stroke={1.7} />} label="Manquants" value={totals.missing} accent="red" pulse={isActive && totals.missing > 0} />
            </div>

            {/* Tableau par catégorie */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                        />
                    );
                })}
            </div>

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

// ── Sous-composants ───────────────────────────────────────────────────────

const KPI_ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   ring: 'border-l-slate-400' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'border-l-emerald-400' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'border-l-amber-400' },
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     ring: 'border-l-red-400' },
};

function KpiCard({ icon, label, value, accent, pulse }: { icon: React.ReactNode; label: string; value: number; accent: keyof typeof KPI_ACCENT; pulse?: boolean }) {
    const t = KPI_ACCENT[accent];
    return (
        <div className={`bg-white border border-slate-200 border-l-[3px] ${t.ring} rounded-xl p-3 shadow-sm ${pulse ? 'animate-pulse ring-2 ring-red-200' : ''}`}>
            <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-semibold">{label}</p>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${t.bg} ${t.text}`}>{icon}</span>
            </div>
            <p className="text-[28px] text-slate-900 leading-none" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                {value.toLocaleString('fr-FR')}
            </p>
        </div>
    );
}

function CategoryPanel({
    title, description, stats, checkedInByEmployee,
}: {
    title: string;
    description: string;
    stats: { total: number; safe: number; injured: number; missing: number; employees: EmployeeEnriched[] };
    checkedInByEmployee: Map<number, EvacuationCheckInDTO>;
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
                {/* Barre progression */}
                <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                        <span>{stats.safe} / {stats.total} en sécurité</span>
                        <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                {/* Stats détaillées */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <Mini label="Sécu" value={stats.safe} color="emerald" />
                    <Mini label="Bless." value={stats.injured} color="amber" />
                    <Mini label="Manq." value={stats.missing} color="red" />
                </div>

                {/* Liste manquants prioritaires */}
                {stats.missing > 0 && (
                    <details className="text-[12px]">
                        <summary className="cursor-pointer text-red-700 font-semibold mb-1.5">
                            ⚠ {stats.missing} manquant(s) — vérifier
                        </summary>
                        <ul className="space-y-1 mt-1">
                            {stats.employees
                                .filter((e) => !checkedInByEmployee.has(e.id))
                                .slice(0, 8)
                                .map((e) => (
                                    <li key={e.id} className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-100 rounded text-[11.5px] text-red-900">
                                        <IconUser size={10} stroke={1.8} className="text-red-500" />
                                        <span className="truncate">{e.name}</span>
                                        {e.position && <span className="text-[10px] text-red-600">· {e.position}</span>}
                                    </li>
                                ))}
                            {stats.missing > 8 && (
                                <li className="text-[10px] text-slate-500 italic px-2">+ {stats.missing - 8} autres…</li>
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
