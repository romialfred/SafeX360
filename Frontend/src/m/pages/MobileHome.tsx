import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconClipboardList,
    IconExclamationCircle,
    IconShield,
    IconCertificate,
    IconBolt,
    IconChevronRight,
    IconCalendarStats,
    IconAlertTriangle,
    IconUserCircle,
    IconCircleDot,
    IconCircleCheck,
    IconTrendingUp,
    IconBrain,
    IconAlertCircle,
    IconFileAlert,
    IconUsers,
    IconShieldCheck,
    IconChecklist,
    IconRefresh,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { getCached } from '../services/mobileApi';
import { toIsoDateLocal } from '../components/MobileUI';

interface DashboardData {
    inspectionsToday: number;
    inspectionsOverdue: number;
    pendingActions: number;
    openIncidents: number;
    nextBlastRef?: string;
    nextBlastAt?: string;
    complianceRate?: number;
    todayList: any[];
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
}

function formatRelativeTime(isoDate: string): string {
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return 'En cours';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 24) return `${Math.floor(h / 24)}j ${h % 24}h`;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
    return `${m}min`;
}

export default function MobileHome() {
    useStatusBarColor('#0E7490', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    // « Réessayer » relance le useEffect (cleanup respecté — pas d'appel direct
    // de fetchDashboard en onClick, qui ignorait le cleanup et créait une course)
    const [retryTick, setRetryTick] = useState(0);

    const rawName = user?.firstName
        ? `${user.firstName} ${user.familyName || ''}`.trim()
        : user?.name || user?.sub || '';
    const displayName = (typeof rawName === 'string' && rawName) ? rawName : 'Personnel';
    const role = (typeof user?.role === 'string' && user.role) ? user.role
        : (typeof user?.position === 'string' && user.position) ? user.position
        : 'Personnel HSE';
    const initials = displayName
        .split(' ')
        .filter((w: string) => w.length > 0)
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'SX';

    // KPIs agrégés côté client depuis les VRAIS endpoints métier (Aiven) :
    // « /hns/mobile/dashboard » n'a jamais existé côté backend — la page
    // affichait des zéros en permanence. Chaque flux est tolérant à l'échec
    // (Promise.allSettled) pour ne pas sacrifier les autres indicateurs.
    const fetchDashboard = useCallback(() => {
        setLoading(true);
        setFetchError(false);
        let cancelled = false;
        (async () => {
            const mineId = Number(user?.mineId ?? user?.companyId ?? 1);
            const g = <T,>(endpoint: string, cacheKey: string) => getCached<T>({
                endpoint, cacheStore: 'inspectionCache', cacheKey, ttlMs: 2 * 60 * 1000,
            });
            const [inspections, incidents, actions, blast] = await Promise.allSettled([
                g<any[]>('/hns/inspection/list', 'dash-inspections'),
                g<any[]>('/hns/incidents/getAll', 'dash-incidents'),
                g<any[]>('/hns/corrective-action/getAllPending', 'dash-actions'),
                // cacheKey par mine : sinon un changement de site sert le tir de l'ancienne mine
                g<any>(`/hns/blast/dashboard/summary?mineId=${mineId}`, `dash-blast-${mineId}`),
            ]);
            if (cancelled) return;

            const arr = (r: PromiseSettledResult<any>): any[] =>
                r.status === 'fulfilled' && Array.isArray(r.value?.data) ? r.value.data : [];

            const inspList = arr(inspections);
            const today = toIsoDateLocal();
            // InspectionSummaryDTO expose plannedDate (pas scheduledDate)
            const todayList = inspList.filter((i) =>
                String(i.plannedDate ?? '').slice(0, 10) === today
                || i.status === 'IN_PROGRESS');
            const inspectionsToday = todayList.length;
            const inspectionsOverdue = inspList.filter((i) =>
                i.status === 'SCHEDULED' && String(i.plannedDate ?? '9999').slice(0, 10) < today).length;

            const incList = arr(incidents);
            const openIncidents = incList.filter((i) => {
                const s = String(i.status ?? '').toUpperCase();
                return s !== 'CLOSED' && s !== 'REJECTED' && s !== 'CANCELLED';
            }).length;

            const pendingActions = arr(actions).length;
            const closedIncidents = incList.length - openIncidents;
            const complianceRate = incList.length > 0
                ? Math.round((closedIncidents / incList.length) * 100)
                : undefined;

            let nextBlastRef: string | undefined;
            let nextBlastAt: string | undefined;
            if (blast.status === 'fulfilled' && blast.value?.data && typeof blast.value.data === 'object') {
                // Le DTO backend s'appelle nextConfirmedBlast (nextBlast n'existe pas)
                const raw = blast.value.data as any;
                const nb = raw.nextConfirmedBlast ?? raw.nextBlast ?? raw;
                if (nb?.scheduledAt) {
                    nextBlastRef = nb.reference ?? undefined;
                    nextBlastAt = nb.scheduledAt;
                }
            }

            const allFailed = [inspections, incidents, actions].every((r) => r.status === 'rejected');
            setFetchError(allFailed);
            setDashboard({ inspectionsToday, inspectionsOverdue, pendingActions, openIncidents, nextBlastRef, nextBlastAt, complianceRate, todayList });
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [user?.mineId, user?.companyId, retryTick]);

    useEffect(fetchDashboard, [fetchDashboard]);

    const go = (path: string) => {
        haptic('light');
        navigate(path);
    };

    return (
        <>
            <MobileTopBar
                title="SafeX 360 Field"
                subtitle={role}
                accent="#0E7490"
                rightSlot={
                    <button
                        type="button"
                        onClick={() => go('/m/profile')}
                        className="rounded-full bg-white/20 flex items-center justify-center"
                        style={{ minWidth: 44, minHeight: 44 }}
                        aria-label="Mon profil"
                    >
                        <IconUserCircle size={18} stroke={2} />
                    </button>
                }
            />

            {/* User greeting card */}
            <section className="px-4 pt-4 pb-1">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-teal-700 text-white flex items-center justify-center flex-shrink-0 text-[15px] font-bold">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                            {getGreeting()},
                        </p>
                        <h2
                            className="text-slate-900 truncate"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '19px',
                                letterSpacing: '-0.015em',
                            }}
                        >
                            {displayName}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => go('/m/profile')}
                        className="p-2 -mr-1 rounded-full hover:bg-slate-50 inline-flex items-center justify-center"
                        style={{ minHeight: 44, minWidth: 44 }}
                        aria-label="Mon profil"
                    >
                        <IconChevronRight size={18} stroke={1.8} className="text-slate-400" />
                    </button>
                </div>
            </section>

            {/* KPI dashboard strip */}
            <section className="px-4 pt-3">
                <div className="grid grid-cols-4 gap-2">
                    <KpiCard
                        value={loading ? '—' : String(dashboard?.inspectionsToday ?? 0)}
                        label="Inspections"
                        icon={<IconClipboardList size={16} stroke={1.8} />}
                        accent="bg-cyan-50 text-cyan-700"
                        onClick={() => go('/m/inspections')}
                    />
                    <KpiCard
                        value={loading ? '—' : String(dashboard?.openIncidents ?? 0)}
                        label="Incidents"
                        icon={<IconExclamationCircle size={16} stroke={1.8} />}
                        accent="bg-amber-50 text-amber-700"
                        onClick={() => go('/m/incidents/history')}
                    />
                    <KpiCard
                        value={loading ? '—' : String(dashboard?.pendingActions ?? 0)}
                        label="Actions"
                        icon={<IconCircleDot size={16} stroke={1.8} />}
                        accent="bg-violet-50 text-violet-700"
                        onClick={() => go('/m/corrective-actions')}
                    />
                    <KpiCard
                        value={loading ? '—' : dashboard?.complianceRate === undefined ? '—' : `${dashboard.complianceRate}%`}
                        label="Conformité"
                        icon={<IconTrendingUp size={16} stroke={1.8} />}
                        accent="bg-emerald-50 text-emerald-700"
                        onClick={() => go('/m/compliance')}
                    />
                </div>
            </section>

            {/* Erreur de chargement */}
            {fetchError && !loading && (
                <section className="px-4 pt-2">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5">
                        <IconAlertTriangle size={14} stroke={1.8} className="text-amber-600 flex-shrink-0" />
                        <p className="text-[12px] text-amber-900 flex-1">Données hors ligne — les chiffres affichés peuvent être incomplets.</p>
                        <button
                            type="button"
                            onClick={() => { haptic('light'); setRetryTick((t) => t + 1); }}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-medium flex-shrink-0 inline-flex items-center justify-center"
                            style={{ minHeight: 44, minWidth: 44 }}
                            aria-label="Actualiser les indicateurs"
                        >
                            <IconRefresh size={14} stroke={2} />
                        </button>
                    </div>
                </section>
            )}

            {/* Overdue alert banner */}
            {dashboard && dashboard.inspectionsOverdue > 0 && (
                <section className="px-4 pt-3">
                    <button
                        type="button"
                        onClick={() => go('/m/inspections')}
                        className="w-full bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2.5 active:bg-rose-100 transition"
                    >
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <IconAlertTriangle size={16} stroke={2} className="text-rose-600" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-[13px] font-semibold text-rose-900">
                                {dashboard.inspectionsOverdue} inspection{dashboard.inspectionsOverdue > 1 ? 's' : ''} en retard
                            </p>
                            <p className="text-[11.5px] text-rose-700">
                                Délai dépassé — action requise
                            </p>
                        </div>
                        <IconChevronRight size={16} stroke={1.8} className="text-rose-400 flex-shrink-0" />
                    </button>
                </section>
            )}

            {/* Next blast card */}
            <section className="px-4 pt-3">
                <article className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <IconBolt size={20} stroke={1.8} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10.5px] uppercase tracking-[0.16em] text-amber-700">
                                Prochain tir
                            </p>
                            <p
                                className="text-slate-900 truncate"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 600,
                                    fontSize: '15px',
                                }}
                            >
                                {dashboard?.nextBlastRef
                                    ? `${dashboard.nextBlastRef} — ${formatRelativeTime(dashboard.nextBlastAt!)}`
                                    : 'Aucun tir programmé'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => go('/m/blast/next')}
                        className="text-[12.5px] text-amber-800 font-medium inline-flex items-center gap-1 active:text-amber-900"
                        style={{ minHeight: 44 }}
                    >
                        Voir le planning des tirs
                        <IconChevronRight size={14} stroke={1.8} />
                    </button>
                </article>
            </section>

            {/* Mes inspections du jour */}
            <section className="px-4 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-semibold text-slate-800 uppercase tracking-[0.08em]">
                        Mes inspections du jour
                    </h3>
                    <button
                        type="button"
                        onClick={() => go('/m/inspections')}
                        className="text-[12px] text-cyan-700 font-medium"
                        style={{ minHeight: 44 }}
                    >
                        Tout voir
                    </button>
                </div>
                {loading ? (
                    <div className="space-y-2">
                        {[0, 1].map((i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-3.5 animate-pulse">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-6 bg-slate-200 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : dashboard && dashboard.todayList.length > 0 ? (
                    <div className="space-y-2">
                        {dashboard.todayList.slice(0, 3).map((it: any) => (
                            <button
                                key={it.id}
                                type="button"
                                onClick={() => go(
                                    it.status === 'SCHEDULED' || it.status === 'IN_PROGRESS' || it.status === 'REJECTED'
                                        ? `/m/inspections/${it.id}`
                                        : `/m/inspection-detail/${it.id}`,
                                )}
                                className="w-full text-left bg-white border border-slate-200 rounded-2xl p-3.5 active:scale-[0.99] transition shadow-sm flex items-center gap-3"
                                style={{ minHeight: 64 }}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    it.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700' : 'bg-cyan-50 text-cyan-700'
                                }`}>
                                    <IconClipboardList size={17} stroke={1.8} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13.5px] font-semibold text-slate-900 truncate"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                        {it.templateName ?? 'Inspection'}
                                    </p>
                                    <p className="text-[11.5px] text-slate-500 truncate">
                                        {it.targetLabel ?? '—'}
                                        {it.status === 'IN_PROGRESS' ? ' · En cours' : ''}
                                    </p>
                                </div>
                                <IconChevronRight size={16} stroke={1.8} className="text-slate-300 flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center text-[13px] text-slate-500">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-2">
                            <IconCalendarStats size={22} stroke={1.6} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-slate-700 mb-0.5">Aucune inspection planifiée</p>
                        <p className="text-[12px] text-slate-400">
                            Les inspections programmées apparaîtront ici automatiquement.
                        </p>
                    </div>
                )}
            </section>

            {/* Quick actions */}
            <section className="px-4 pt-5 pb-4">
                <h3 className="text-[13px] font-semibold text-slate-800 uppercase tracking-[0.08em] mb-2">
                    Actions rapides
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <ShortcutTile
                        icon={<IconClipboardList size={22} stroke={1.8} />}
                        label="Inspecter"
                        sublabel="Démarrer une inspection"
                        accent="from-cyan-500 to-blue-600"
                        onClick={() => go('/m/inspections')}
                    />
                    <ShortcutTile
                        icon={<IconExclamationCircle size={22} stroke={1.8} />}
                        label="Incident"
                        sublabel="Déclarer en 90 s"
                        accent="from-amber-500 to-orange-600"
                        onClick={() => go('/m/incident/new')}
                    />
                    <ShortcutTile
                        icon={<IconShield size={22} stroke={1.8} />}
                        label="Mes EPI"
                        sublabel="Dotation personnelle"
                        accent="from-emerald-500 to-teal-600"
                        onClick={() => go('/m/profile/ppe')}
                    />
                    <ShortcutTile
                        icon={<IconCertificate size={22} stroke={1.8} />}
                        label="Mes formations"
                        sublabel="Habilitations à jour"
                        accent="from-violet-500 to-purple-600"
                        onClick={() => go('/m/profile/trainings')}
                    />
                </div>
            </section>

            {/* Tous les modules */}
            <section className="px-4 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-semibold text-slate-800 uppercase tracking-[0.08em]">
                        Tous les modules
                    </h3>
                    <button
                        type="button"
                        onClick={() => go('/m/modules')}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-teal-700"
                        style={{ minHeight: 44 }}
                    >
                        Tout voir <IconChevronRight size={13} stroke={2.2} />
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <ModuleTile icon={<IconBrain size={18} stroke={1.8} />} label="Incident IA" accent="bg-violet-50 text-violet-700" onClick={() => go('/m/incident/ai')} />
                    <ModuleTile icon={<IconFileAlert size={18} stroke={1.8} />} label="Événements" accent="bg-pink-50 text-pink-700" onClick={() => go('/m/errors')} />
                    <ModuleTile icon={<IconAlertCircle size={18} stroke={1.8} />} label="Non-conformités" accent="bg-red-50 text-red-700" onClick={() => go('/m/non-conformities')} />
                    <ModuleTile icon={<IconShieldCheck size={18} stroke={1.8} />} label="Risques" accent="bg-purple-50 text-purple-700" onClick={() => go('/m/risks')} />
                    <ModuleTile icon={<IconChecklist size={18} stroke={1.8} />} label="Audits" accent="bg-sky-50 text-sky-700" onClick={() => go('/m/audits')} />
                    <ModuleTile icon={<IconUsers size={18} stroke={1.8} />} label="Réunions HSE" accent="bg-emerald-50 text-emerald-700" onClick={() => go('/m/meetings')} />
                    <ModuleTile icon={<IconAlertTriangle size={18} stroke={1.8} />} label="Alerte générale" accent="bg-orange-50 text-orange-700" onClick={() => go('/m/alert')} />
                    <ModuleTile icon={<IconShield size={18} stroke={1.8} />} label="EPI" accent="bg-emerald-50 text-emerald-700" onClick={() => go('/m/ppe/catalog')} />
                    <ModuleTile icon={<IconCircleDot size={18} stroke={1.8} />} label="Actions corr." accent="bg-amber-50 text-amber-700" onClick={() => go('/m/corrective-actions')} />
                    <ModuleTile icon={<IconChecklist size={18} stroke={1.8} />} label="Conformité" accent="bg-violet-50 text-violet-700" onClick={() => go('/m/compliance')} />
                    <ModuleTile icon={<IconFileAlert size={18} stroke={1.8} />} label="Documents" accent="bg-sky-50 text-sky-700" onClick={() => go('/m/documents')} />
                    <ModuleTile icon={<IconTrendingUp size={18} stroke={1.8} />} label="Tableau de bord" accent="bg-cyan-50 text-cyan-700" onClick={() => go('/m/dashboard')} />
                </div>
            </section>

            {/* Compliance footer */}
            <section className="px-4 pt-4 pb-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
                    <IconCircleCheck size={16} stroke={1.8} className="text-emerald-600 flex-shrink-0" />
                    <p className="text-[11.5px] text-slate-600 leading-snug">
                        Conforme ISO 45001 · Données synchronisées en temps réel
                    </p>
                </div>
                <p className="text-[9.5px] text-slate-400 mt-2 text-center">
                    SafeX 360 : HSE · Data Universe · contact@datauniverse.bf
                </p>
            </section>
        </>
    );
}

function KpiCard({
    value,
    label,
    icon,
    accent,
    onClick,
}: {
    value: string;
    label: string;
    icon: React.ReactNode;
    accent: string;
    onClick?: () => void;
}) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={`${accent} rounded-xl p-2.5 text-center active:scale-[0.97] transition`}
            style={{ minHeight: 72 }}
        >
            <div className="flex items-center justify-center mb-1">
                {icon}
            </div>
            <div className="text-[18px] font-bold leading-none tabular-nums">
                {value}
            </div>
            <div className="text-[10px] mt-0.5 opacity-80 leading-tight">
                {label}
            </div>
        </Tag>
    );
}

function ShortcutTile({
    icon,
    label,
    sublabel,
    accent,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    accent: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="bg-white border border-slate-200 rounded-2xl p-3.5 text-left active:scale-[0.97] transition shadow-sm"
            style={{ minHeight: 96 }}
        >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center mb-2`}>
                {icon}
            </div>
            <div className="text-[13.5px] font-semibold text-slate-900 leading-tight">
                {label}
            </div>
            <div className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
                {sublabel}
            </div>
        </button>
    );
}

function ModuleTile({
    icon,
    label,
    accent,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    accent: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${accent} rounded-xl p-2.5 text-center active:scale-[0.97] transition`}
            style={{ minHeight: 64 }}
        >
            <div className="flex items-center justify-center mb-1">{icon}</div>
            <div className="text-[10.5px] font-medium leading-tight">{label}</div>
        </button>
    );
}
