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
    IconTrendingUp,
    IconGauge,
    IconFlame,
    IconHeartRateMonitor,
} from '@tabler/icons-react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
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
    RadialBarChart,
    RadialBar,
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
import { SOS_REASON_LABELS, SOS_STATUS_COLORS } from '../Sos/sosLabels';

/**
 * Page Tableau de bord Emergency — refonte 2026-07-21.
 *
 * <p>Refonte demandée : les KPI sont regroupés en <strong>3 cartes composites sur une seule ligne</strong>
 * (SOS / Alertes Générales / Performance) au lieu de 8 tuiles éparpillées sur 2 lignes, et les
 * graphiques sont plus aboutis (timeline combinée SOS+Alertes, jauge radiale de taux de résolution,
 * donut avec total central).</p>
 *
 * <p>Live updates via WebSocket : à chaque message SOS/GeneralAlert reçu on rafraîchit le summary
 * backend (debounce 2s). Aucun changement backend : tout est dérivé du même DTO.</p>
 */

const REASON_LABELS_SOS = SOS_REASON_LABELS;
const STATUS_COLORS = SOS_STATUS_COLORS;

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

    // ── Timeline combinée SOS + Alertes (fusion par date) ──
    const activitySeries = useMemo(() => {
        if (!data) return [];
        const map = new Map<string, { date: string; SOS: number; Alertes: number }>();
        data.sosDailyCounts.forEach((d) => map.set(d.date, { date: d.date, SOS: d.count, Alertes: 0 }));
        data.generalAlertDailyCounts.forEach((d) => {
            const e = map.get(d.date) ?? { date: d.date, SOS: 0, Alertes: 0 };
            e.Alertes = d.count;
            map.set(d.date, e);
        });
        return Array.from(map.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((e) => ({ ...e, label: formatDateShort(e.date) }));
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

    // ── Indicateurs dérivés ──
    const resolutionRate = useMemo(() => {
        if (!data || data.sosTotal === 0) return 0;
        return Math.round((data.sosClosed / data.sosTotal) * 100);
    }, [data]);

    const falseAlarmRate = useMemo(() => {
        if (!data || data.sosTotal === 0) return 0;
        return Math.round((data.sosFalseAlarm / data.sosTotal) * 100);
    }, [data]);

    const totalEvents = useMemo(() => (data ? data.sosTotal + data.generalAlertsTotal : 0), [data]);

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
                    {/* ════ KPI — 3 cartes composites sur UNE ligne ════ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                        {/* ── Carte SOS composite ── */}
                        <CompositeCard
                            accent="red"
                            icon={<IconUrgent size={16} stroke={1.8} />}
                            title="SOS"
                            headline={data.sosTotal}
                            headlineLabel="déclenchés"
                            badge={
                                data.sosActive > 0
                                    ? { text: `${data.sosActive} actif${data.sosActive > 1 ? 's' : ''}`, tone: 'live' }
                                    : { text: 'Aucun actif', tone: 'ok' }
                            }
                            stats={[
                                { label: 'Actifs', value: data.sosActive, tone: data.sosActive > 0 ? 'red' : 'slate' },
                                { label: 'Clôturés', value: data.sosClosed, tone: 'emerald' },
                                { label: 'Fausses alertes', value: data.sosFalseAlarm, tone: 'slate' },
                            ]}
                        />

                        {/* ── Carte Alertes Générales composite ── */}
                        <CompositeCard
                            accent="orange"
                            icon={<IconBolt size={16} stroke={1.8} />}
                            title="Alertes Générales"
                            headline={data.generalAlertsTotal}
                            headlineLabel="évacuations"
                            badge={
                                data.generalAlertsActive > 0
                                    ? { text: `${data.generalAlertsActive} active${data.generalAlertsActive > 1 ? 's' : ''}`, tone: 'live' }
                                    : { text: 'Aucune active', tone: 'ok' }
                            }
                            stats={[
                                { label: 'Actives', value: data.generalAlertsActive, tone: data.generalAlertsActive > 0 ? 'orange' : 'slate' },
                                { label: 'Réelles', value: data.generalAlertsReal, tone: 'sky' },
                                { label: 'Exercices', value: data.generalAlertsDrills, tone: 'violet' },
                            ]}
                        />

                        {/* ── Carte Performance & réactivité ── */}
                        <div className="bg-white border border-slate-200 border-l-[3px] border-l-sky-400 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-700">
                                        <IconGauge size={16} stroke={1.8} />
                                    </span>
                                    <p
                                        className="text-[13px] font-semibold text-slate-800"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                                    >
                                        Performance & réactivité
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <MetricRow
                                    icon={<IconClock size={13} stroke={1.8} />}
                                    label="Prise en charge (ACK)"
                                    value={formatDuration(data.sosAvgAckSeconds)}
                                    tone="orange"
                                />
                                <MetricRow
                                    icon={<IconShieldCheck size={13} stroke={1.8} />}
                                    label="Résolution SOS"
                                    value={formatDuration(data.sosAvgResolutionSeconds)}
                                    tone="emerald"
                                />
                                <MetricRow
                                    icon={<IconUsersGroup size={13} stroke={1.8} />}
                                    label="Durée moy. évacuation"
                                    value={formatDuration(data.generalAlertAvgDurationSeconds)}
                                    tone="violet"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ════ Timeline combinée SOS + Alertes (pleine largeur) ════ */}
                    <div className="mt-4">
                        <ChartCard
                            title={`Activité des urgences (${windowDays}j)`}
                            icon={<IconTrendingUp size={14} stroke={1.7} />}
                            description="Volume quotidien de SOS et d'alertes générales déclenchés"
                            right={
                                <div className="flex items-center gap-3">
                                    <LegendDot color="#dc2626" label="SOS" />
                                    <LegendDot color="#f97316" label="Alertes" />
                                </div>
                            }
                        >
                            {activitySeries.length === 0 ? (
                                <EmptyChartState text="Aucune activité sur la fenêtre" />
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <ComposedChart data={activitySeries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="sosGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#dc2626" stopOpacity={0.55} />
                                                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.04} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                                        <YAxis tick={{ fontSize: 10.5, fill: '#64748b' }} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                                        <Tooltip
                                            contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,.08)' }}
                                            labelStyle={{ color: '#334155', fontWeight: 600 }}
                                        />
                                        <Area type="monotone" dataKey="SOS" stroke="#dc2626" strokeWidth={2.2} fill="url(#sosGrad)" />
                                        <Line type="monotone" dataKey="Alertes" stroke="#f97316" strokeWidth={2.4} dot={{ fill: '#f97316', r: 2.5 }} activeDot={{ r: 4 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* ════ Ligne : Donut statut · Jauge résolution · Barres motifs ════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                        {/* Donut statut avec total central */}
                        <ChartCard
                            title="Cycle de vie des SOS"
                            icon={<IconUrgent size={14} stroke={1.7} />}
                            description="Répartition par statut sur la fenêtre"
                        >
                            {statusPieData.length === 0 ? (
                                <EmptyChartState text="Aucun SOS sur la fenêtre" />
                            ) : (
                                <div className="relative">
                                    <ResponsiveContainer width="100%" height={230}>
                                        <PieChart>
                                            <Pie
                                                data={statusPieData}
                                                innerRadius={62}
                                                outerRadius={92}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {statusPieData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                                            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ top: '-28px' }}>
                                        <span
                                            className="text-[30px] leading-none text-slate-900"
                                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                                        >
                                            {data.sosTotal}
                                        </span>
                                        <span className="text-[10.5px] uppercase tracking-[0.1em] text-slate-400 mt-1">SOS total</span>
                                    </div>
                                </div>
                            )}
                        </ChartCard>

                        {/* Jauge radiale taux de résolution */}
                        <ChartCard
                            title="Qualité de réponse"
                            icon={<IconGauge size={14} stroke={1.7} />}
                            description="Taux de résolution & fiabilité des alertes"
                        >
                            {data.sosTotal === 0 ? (
                                <EmptyChartState text="Aucun SOS à évaluer" />
                            ) : (
                                <div className="relative">
                                    <ResponsiveContainer width="100%" height={190}>
                                        <RadialBarChart
                                            innerRadius="72%"
                                            outerRadius="100%"
                                            data={[{ name: 'Résolution', value: resolutionRate, fill: '#10b981' }]}
                                            startAngle={210}
                                            endAngle={-30}
                                        >
                                            <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={12} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ top: '-14px' }}>
                                        <span
                                            className="text-[34px] leading-none text-emerald-600"
                                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                                        >
                                            {resolutionRate}%
                                        </span>
                                        <span className="text-[10.5px] uppercase tracking-[0.1em] text-slate-400 mt-1">résolus</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div className="text-center px-2 py-1.5 bg-slate-50/70 border border-slate-100 rounded-lg">
                                            <p className="text-[15px] text-slate-800 leading-none font-semibold">{data.sosClosed}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Clôturés</p>
                                        </div>
                                        <div className="text-center px-2 py-1.5 bg-slate-50/70 border border-slate-100 rounded-lg">
                                            <p className="text-[15px] text-slate-800 leading-none font-semibold">{falseAlarmRate}%</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Fausses alertes</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ChartCard>

                        {/* Barres top motifs */}
                        <ChartCard
                            title="Motifs de déclenchement"
                            icon={<IconFlame size={14} stroke={1.7} />}
                            description="Causes les plus fréquentes"
                        >
                            {reasonsBarData.length === 0 ? (
                                <EmptyChartState text="Aucun motif sur la fenêtre" />
                            ) : (
                                <ResponsiveContainer width="100%" height={230}>
                                    <BarChart data={reasonsBarData} layout="vertical" margin={{ top: 5, right: 24, left: 8, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="reason" type="category" tick={{ fontSize: 10.5, fill: '#334155' }} width={110} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={18}>
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
                    <p className="mt-4 text-[10.5px] text-slate-400 italic text-right flex items-center justify-end gap-1.5">
                        <IconHeartRateMonitor size={12} stroke={1.6} />
                        {totalEvents} événement(s) sur {windowDays}j · Données à {new Date(data.generatedAt).toLocaleTimeString('fr-FR')} ·
                        Mise à jour automatique (live WebSocket)
                    </p>
                </>
            ) : null}
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ────────────────────────────────────────────────────────────────────────────

const ACCENT: Record<string, { border: string; iconBg: string; iconText: string; head: string }> = {
    red:     { border: 'border-l-red-500',    iconBg: 'bg-red-50',    iconText: 'text-red-700',    head: 'text-red-700' },
    orange:  { border: 'border-l-orange-500', iconBg: 'bg-orange-50', iconText: 'text-orange-700', head: 'text-orange-700' },
    sky:     { border: 'border-l-sky-500',    iconBg: 'bg-sky-50',    iconText: 'text-sky-700',    head: 'text-sky-700' },
};

const STAT_TONE: Record<string, string> = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    emerald: 'text-emerald-600',
    sky: 'text-sky-600',
    violet: 'text-violet-600',
    slate: 'text-slate-700',
};

/** Carte KPI composite : un gros chiffre + 3 mini-stats regroupées (ex. tout le SOS en une tuile). */
function CompositeCard({
    accent, icon, title, headline, headlineLabel, badge, stats,
}: {
    accent: 'red' | 'orange' | 'sky';
    icon: React.ReactNode;
    title: string;
    headline: number;
    headlineLabel: string;
    badge: { text: string; tone: 'live' | 'ok' };
    stats: { label: string; value: number; tone: keyof typeof STAT_TONE }[];
}) {
    const a = ACCENT[accent];
    return (
        <div className={`bg-white border border-slate-200 border-l-[3px] ${a.border} rounded-xl p-4 shadow-sm flex flex-col`}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${a.iconBg} ${a.iconText}`}>
                        {icon}
                    </span>
                    <p
                        className={`text-[13px] font-semibold ${a.head}`}
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        {title}
                    </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                    badge.tone === 'live'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                    {badge.tone === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {badge.text}
                </span>
            </div>

            <div className="flex items-end gap-2 mb-3">
                <span
                    className="text-[38px] leading-none text-slate-900"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                >
                    {headline.toLocaleString('fr-FR')}
                </span>
                <span className="text-[11px] text-slate-400 mb-1.5">{headlineLabel}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto">
                {stats.map((s) => (
                    <div key={s.label} className="text-center px-1 py-2 bg-slate-50/70 border border-slate-100 rounded-lg">
                        <p className={`text-[17px] leading-none font-semibold ${STAT_TONE[s.tone]}`}>
                            {s.value.toLocaleString('fr-FR')}
                        </p>
                        <p className="text-[9.5px] text-slate-500 mt-1 leading-tight">{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Ligne métrique compacte pour la carte Performance. */
function MetricRow({
    icon, label, value, tone,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tone: keyof typeof STAT_TONE;
}) {
    return (
        <div className="flex items-center gap-2.5 px-2.5 py-2 bg-slate-50/60 border border-slate-100 rounded-lg">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md bg-white border border-slate-100 ${STAT_TONE[tone]}`}>
                {icon}
            </span>
            <span className="text-[11.5px] text-slate-600 flex-1">{label}</span>
            <span
                className="text-[14px] text-slate-900"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
            >
                {value}
            </span>
        </div>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {label}
        </span>
    );
}

function ChartCard({
    title, description, icon, children, right,
}: {
    title: string;
    description?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    right?: React.ReactNode;
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
                {right && <div className="shrink-0">{right}</div>}
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
