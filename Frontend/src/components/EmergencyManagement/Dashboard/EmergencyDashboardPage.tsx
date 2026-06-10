import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconUrgent,
    IconAlertTriangle,
    IconClock,
    IconShieldCheck,
    IconUsersGroup,
    IconRefresh,
    IconMapPin,
    IconChartBar,
    IconBolt,
    IconActivity,
    IconUser,
} from '@tabler/icons-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from 'recharts';
import PageHeader from '../../UtilityComp/PageHeader';
import { useAppSelector } from '../../../slices/hooks';
import {
    getEmergencyDashboardSummary,
    type EmergencyDashboardDTO,
} from '../../../services/EmergencyDashboardService';
import { useEmergencyWebSocket } from '../Sos/EmergencyWebSocketProvider';
import SosLiveMap from '../Sos/SosLiveMap';
import { listSosAlerts, type SosAlertDTO } from '../../../services/SosService';
import { formatReasonCode } from '../GeneralAlert/alertHelpers';

/**
 * Page Tableau de bord Emergency (LOT 48 Phase 5).
 *
 * <p>Agrège SOS + Alertes Générales + Lifecycle metrics avec :</p>
 * <ul>
 *   <li>8 KPIs tuiles (total / actifs / durée moyenne ack / résolution / drills)</li>
 *   <li>2 graphiques temporels (lines daily counts SOS et Alertes)</li>
 *   <li>Pie chart distribution statut SOS</li>
 *   <li>Bar chart top motifs</li>
 *   <li>Carte SOS récents avec pins par statut</li>
 *   <li>Top coordinateurs (qui a traité le plus)</li>
 * </ul>
 *
 * <p>Live updates via WebSocket : à chaque message SOS/GeneralAlert reçu,
 * on rafraîchit le summary backend (debounce 2s pour éviter les rafales).</p>
 */

const REASON_LABELS_SOS: Record<string, string> = {
    MEDICAL: 'Médical',
    ACCIDENT_TRAVAIL: 'Accident du travail',
    INCENDIE: 'Incendie',
    AGRESSION: 'Agression',
    FUITE_CHIMIQUE: 'Fuite chimique',
    EFFONDREMENT: 'Effondrement',
    AUTRE: 'Autre',
};

const STATUS_COLORS: Record<string, string> = {
    RECEIVED: '#dc2626',
    ACKNOWLEDGED: '#f97316',
    DISPATCHED: '#eab308',
    ON_SITE: '#0ea5e9',
    CLOSED: '#10b981',
    FALSE_ALARM: '#64748b',
};

const STATUS_LABELS: Record<string, string> = {
    RECEIVED: 'Nouveau',
    ACKNOWLEDGED: 'Pris en charge',
    DISPATCHED: 'Dispatché',
    ON_SITE: 'Sur place',
    CLOSED: 'Clôturé',
    FALSE_ALARM: 'Fausse alerte',
};

const REASON_COLORS = ['#dc2626', '#f97316', '#eab308', '#0ea5e9', '#8b5cf6', '#64748b'];

const formatDuration = (sec?: number) => {
    if (sec == null || sec === 0) return '—';
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${sec % 60}s`;
    return `${sec}s`;
};

const formatDateShort = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const EmergencyDashboardPage = () => {
    const { t } = useTranslation(['emergency', 'common', 'navigation']);
    const navigate = useNavigate();
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const { connected, subscribe, subscribeGeneralAlert } = useEmergencyWebSocket();

    const [windowDays, setWindowDays] = useState<7 | 30 | 90>(7);
    const [data, setData] = useState<EmergencyDashboardDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);

    // Pour SOS live map - récupère également la liste des SOS actifs
    const [activeAlerts, setActiveAlerts] = useState<SosAlertDTO[]>([]);

    // ── Chargement summary ──
    useEffect(() => {
        if (!selectedCompanyId) return;
        setLoading(true);
        setLoadError(null);
        getEmergencyDashboardSummary(selectedCompanyId, windowDays)
            .then(setData)
            .catch((err: any) => {
                const msg = err?.response?.status
                    ? `Erreur ${err.response.status} — backend Health-Safety`
                    : 'Impossible de joindre le backend';
                setLoadError(msg);
            })
            .finally(() => setLoading(false));
    }, [selectedCompanyId, windowDays, refreshTick]);

    // ── Chargement SOS actifs pour la map ──
    useEffect(() => {
        if (!selectedCompanyId) return;
        listSosAlerts(selectedCompanyId, false)
            .then(setActiveAlerts)
            .catch(() => setActiveAlerts([]));
    }, [selectedCompanyId, refreshTick]);

    // ── Live refresh via WebSocket (debounce 2s) ──
    useEffect(() => {
        let timer: number | null = null;
        const triggerRefresh = () => {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(() => setRefreshTick((n) => n + 1), 2000);
        };
        const unsub1 = subscribe(triggerRefresh);
        const unsub2 = subscribeGeneralAlert(triggerRefresh);
        return () => {
            unsub1();
            unsub2();
            if (timer) window.clearTimeout(timer);
        };
    }, [subscribe, subscribeGeneralAlert]);

    // ── Données dérivées pour charts ──
    const sosDailySeries = useMemo(() => {
        if (!data) return [];
        return data.sosDailyCounts.map((d) => ({
            date: formatDateShort(d.date),
            SOS: d.count,
        }));
    }, [data]);

    const generalAlertDailySeries = useMemo(() => {
        if (!data) return [];
        return data.generalAlertDailyCounts.map((d) => ({
            date: formatDateShort(d.date),
            Alertes: d.count,
        }));
    }, [data]);

    const statusPieData = useMemo(() => {
        if (!data) return [];
        return Object.entries(data.sosByStatus)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => ({
                name: STATUS_LABELS[status] ?? status,
                value: count,
                color: STATUS_COLORS[status] ?? '#94a3b8',
            }));
    }, [data]);

    const reasonsBarData = useMemo(() => {
        if (!data) return [];
        return data.topReasonsSos.map((r) => ({
            reason: REASON_LABELS_SOS[r.reasonCode] ?? r.reasonCode,
            count: r.count,
        }));
    }, [data]);

    if (!selectedCompanyId) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-6 text-center">
                    <IconAlertTriangle size={28} className="text-amber-500 mx-auto mb-2" stroke={1.6} />
                    <p className="text-[13px] text-slate-700">Sélectionnez une mine active.</p>
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
                        { label: 'Tableau de bord' },
                    ]}
                    useSafeXLogo
                    title="Tableau de bord — Emergency"
                    subtitle="Pilotage temps réel des SOS et Alertes Générales"
                />
                <div className="mt-6 bg-red-50/60 border border-red-200 rounded-xl p-8 text-center">
                    <IconAlertTriangle size={32} className="text-red-500 mx-auto mb-3" stroke={1.6} />
                    <p className="text-[13px] text-slate-700 mb-4">{loadError}</p>
                    <button
                        type="button"
                        onClick={() => setRefreshTick((n) => n + 1)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-slate-800"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 lg:px-6 py-5">
            <PageHeader
                breadcrumbs={[
                    { label: t('navigation:breadcrumbs.home'), to: '/' },
                    { label: t('emergency:module.name') },
                    { label: 'Tableau de bord' },
                ]}
                useSafeXLogo
                title="Tableau de bord — Emergency"
                subtitle="Pilotage temps réel des SOS, évacuations et secours"
                actions={
                    <>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            connected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            {connected ? 'Temps réel actif' : 'Hors-ligne'}
                        </span>
                        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                            {([7, 30, 90] as const).map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setWindowDays(d)}
                                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors ${
                                        windowDays === d
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {d}j
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setRefreshTick((n) => n + 1)}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 shadow-sm disabled:opacity-50"
                        >
                            <IconRefresh size={12} stroke={1.8} className={loading ? 'animate-spin' : ''} />
                            Rafraîchir
                        </button>
                    </>
                }
            />

            {loading && !data ? (
                <div className="mt-6 bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                    <IconActivity size={28} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                    <p className="text-[13px] text-slate-500">{t('common:messages.loadingData')}</p>
                </div>
            ) : data ? (
                <>
                    {/* ════ KPI tuiles 4 colonnes ════ */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                        <KpiTile
                            icon={<IconUrgent size={14} stroke={1.7} />}
                            label="SOS Total"
                            value={data.sosTotal}
                            accent="red"
                            sub={`${data.sosActive} actif(s)`}
                        />
                        <KpiTile
                            icon={<IconClock size={14} stroke={1.7} />}
                            label="Temps moyen ACK"
                            value={formatDuration(data.sosAvgAckSeconds)}
                            accent="orange"
                            sub="Réactivité coordinateur"
                        />
                        <KpiTile
                            icon={<IconShieldCheck size={14} stroke={1.7} />}
                            label="Temps moyen résolution"
                            value={formatDuration(data.sosAvgResolutionSeconds)}
                            accent="sky"
                            sub="RECEIVED → CLOSED"
                        />
                        <KpiTile
                            icon={<IconBolt size={14} stroke={1.7} />}
                            label="Alertes Générales"
                            value={data.generalAlertsTotal}
                            accent="amber"
                            sub={`${data.generalAlertsReal} réelles · ${data.generalAlertsDrills} drills`}
                        />
                    </div>

                    {/* ════ KPI ligne 2 — annexes ════ */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <KpiTile
                            icon={<IconShieldCheck size={13} stroke={1.7} />}
                            label="SOS Clôturés"
                            value={data.sosClosed}
                            accent="emerald"
                            small
                        />
                        <KpiTile
                            icon={<IconAlertTriangle size={13} stroke={1.7} />}
                            label="Fausses alertes"
                            value={data.sosFalseAlarm}
                            accent="slate"
                            small
                        />
                        <KpiTile
                            icon={<IconUsersGroup size={13} stroke={1.7} />}
                            label="Évac. moyenne"
                            value={formatDuration(data.generalAlertAvgDurationSeconds)}
                            accent="violet"
                            sub="durée alerte"
                            small
                        />
                        <KpiTile
                            icon={<IconActivity size={13} stroke={1.7} />}
                            label="Alertes actives"
                            value={data.generalAlertsActive}
                            accent="rose"
                            small
                        />
                    </div>

                    {/* ════ Charts ligne 1 — timelines ════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                        <ChartCard
                            title={`SOS par jour (${windowDays}j)`}
                            icon={<IconChartBar size={14} stroke={1.7} />}
                            description="Évolution du volume de SOS déclenchés"
                        >
                            {sosDailySeries.length > 0 && (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={sosDailySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="sosGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#dc2626" stopOpacity={0.6} />
                                                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                                            labelStyle={{ color: '#334155', fontWeight: 600 }}
                                        />
                                        <Area type="monotone" dataKey="SOS" stroke="#dc2626" strokeWidth={2} fill="url(#sosGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard
                            title={`Alertes Générales par jour (${windowDays}j)`}
                            icon={<IconBolt size={14} stroke={1.7} />}
                            description="Évolution des évacuations déclenchées (drills + réels)"
                        >
                            {generalAlertDailySeries.length > 0 && (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={generalAlertDailySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                                            labelStyle={{ color: '#334155', fontWeight: 600 }}
                                        />
                                        <Line type="monotone" dataKey="Alertes" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* ════ Charts ligne 2 — pie + bar ════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                        <ChartCard
                            title="Répartition par statut"
                            icon={<IconUrgent size={14} stroke={1.7} />}
                            description="Distribution des SOS sur la fenêtre"
                        >
                            {statusPieData.length === 0 ? (
                                <EmptyChartState text="Aucun SOS sur la fenêtre" />
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={statusPieData}
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                            labelLine={false}
                                        >
                                            {statusPieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard
                            title="Top motifs déclenchement"
                            icon={<IconChartBar size={14} stroke={1.7} />}
                            description="Top 6 raisons les plus fréquentes"
                        >
                            {reasonsBarData.length === 0 ? (
                                <EmptyChartState text="Aucun motif sur la fenêtre" />
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={reasonsBarData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                                        <YAxis dataKey="reason" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={120} />
                                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                        <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]}>
                                            {reasonsBarData.map((_, i) => (
                                                <Cell key={i} fill={REASON_COLORS[i % REASON_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* ════ Map des SOS actifs + Top coordinateurs ════ */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
                        <div className="xl:col-span-2">
                            <ChartCard
                                title="Carte temps réel des SOS actifs"
                                icon={<IconMapPin size={14} stroke={1.7} />}
                                description={`${activeAlerts.length} SOS actif(s) localisé(s) sur la mine`}
                            >
                                {activeAlerts.length === 0 ? (
                                    <EmptyChartState text="Aucun SOS actif — la mine est sécurisée" />
                                ) : (
                                    <div className="-mx-4 -mb-4">
                                        <SosLiveMap
                                            alerts={activeAlerts}
                                            onClick={(a) => a.id && navigate(`/emergency/sos/${a.id}`)}
                                            height={380}
                                        />
                                    </div>
                                )}
                            </ChartCard>
                        </div>

                        <div>
                            <ChartCard
                                title="Top coordinateurs"
                                icon={<IconUsersGroup size={14} stroke={1.7} />}
                                description={`Qui a traité le plus de SOS (${windowDays}j)`}
                            >
                                {data.topCoordinators.length === 0 ? (
                                    <EmptyChartState text="Aucune intervention sur la fenêtre" />
                                ) : (
                                    <ul className="space-y-2">
                                        {data.topCoordinators.map((c, i) => (
                                            <li
                                                key={c.actorId}
                                                className="flex items-center gap-2.5 px-3 py-2 bg-slate-50/60 border border-slate-100 rounded-lg"
                                            >
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                                                    #{i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12.5px] text-slate-800 truncate">
                                                        {c.actorName ?? `Coordinateur #${c.actorId}`}
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 text-[10.5px] font-semibold">
                                                    <IconUrgent size={9} stroke={2} />
                                                    {c.count}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </ChartCard>
                        </div>
                    </div>

                    {/* ════ Footer info ════ */}
                    <p className="mt-4 text-[10.5px] text-slate-400 italic text-right">
                        Données générées à {new Date(data.generatedAt).toLocaleTimeString('fr-FR')} ·
                        Fenêtre : {windowDays} jour(s) ·
                        Mise à jour automatique sur événement SOS / Alerte Générale (live WebSocket)
                    </p>
                </>
            ) : null}
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ────────────────────────────────────────────────────────────────────────────

const KPI_ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     ring: 'border-l-red-400' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  ring: 'border-l-orange-400' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'border-l-amber-400' },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-700',     ring: 'border-l-sky-400' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'border-l-emerald-400' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'border-l-violet-400' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'border-l-rose-400' },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   ring: 'border-l-slate-400' },
};

function KpiTile({
    icon, label, value, sub, accent, small,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    sub?: string;
    accent: keyof typeof KPI_ACCENT;
    small?: boolean;
}) {
    const tone = KPI_ACCENT[accent];
    return (
        <div className={`bg-white border border-slate-200 border-l-[3px] ${tone.ring} rounded-xl p-3 shadow-sm`}>
            <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-semibold">
                    {label}
                </p>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${tone.bg} ${tone.text}`}>
                    {icon}
                </span>
            </div>
            <p
                className={`${small ? 'text-[18px]' : 'text-[24px]'} text-slate-900 leading-none`}
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
            >
                {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            </p>
            {sub && <p className="text-[10.5px] text-slate-500 mt-1">{sub}</p>}
        </div>
    );
}

function ChartCard({
    title, description, icon, children,
}: {
    title: string;
    description?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <header className="px-4 py-3 border-b border-slate-100 flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">{icon}</span>
                <div className="min-w-0 flex-1">
                    <h3
                        className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        {title}
                    </h3>
                    {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
                </div>
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
}

function EmptyChartState({ text }: { text: string }) {
    return (
        <div className="h-[220px] flex items-center justify-center">
            <p className="text-[12px] text-slate-400 italic">{text}</p>
        </div>
    );
}

export default EmergencyDashboardPage;
