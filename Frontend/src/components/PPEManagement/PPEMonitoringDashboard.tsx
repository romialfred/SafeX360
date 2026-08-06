import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select } from '@mantine/core';
import {
    IconAlertTriangle, IconArrowDownRight, IconArrowUpRight, IconBox, IconCoin, IconDownload,
    IconPackage, IconPlus, IconRefresh, IconShieldCheck, IconUsers,
} from '@tabler/icons-react';
import {
    Area, AreaChart, Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart,
    PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getPpeMonitoring } from '../../services/PPEMonitoringService';
import { getAllCompanies } from '../../services/HrmsService';
import { useAppSelector } from '../../slices/hooks';
import { ppeCategoryLabel } from './ppeLabels';

/**
 * Tableau de bord « Suivi des EPI » — pilotage des stocks & distributions.
 * Alimenté par /hns/ppe-monitoring (catalogue + journal de mouvements + demandes),
 * cloisonné sur la mine active. Aucune donnée fabriquée côté client.
 */

const TABS = [
    { id: 'exec', label: 'Vue exécutive' },
    { id: 'stocks', label: 'Stocks & mouvements' },
    { id: 'distrib', label: 'Distributions' },
    { id: 'value', label: 'Analyse & valorisation' },
];

const PERIODS = [
    { value: '30', label: '30 derniers jours' },
    { value: '90', label: '90 derniers jours' },
    { value: '180', label: '6 derniers mois' },
    { value: '365', label: '12 derniers mois' },
];

const GREEN = '#10b981', PURPLE = '#8b5cf6', BLUE = '#3b82f6', AMBER = '#f59e0b', ROSE = '#f43f5e', SLATE = '#94a3b8';

const fmtFcfa = (v?: number) => {
    if (v == null) return '—';
    const a = Math.abs(v);
    if (a >= 1e6) return `${(v / 1e6).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M FCFA`;
    if (a >= 1e3) return `${Math.round(v / 1e3).toLocaleString('fr-FR')} k FCFA`;
    return `${Math.round(v).toLocaleString('fr-FR')} FCFA`;
};
const fmtInt = (v?: number) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));

const STATUS_CFG: Record<string, { label: string; chip: string }> = {
    HEALTHY: { label: 'Sain', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    LOW: { label: 'Sous seuil', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    OUT: { label: 'Rupture', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};
const SEV_CFG: Record<string, { label: string; chip: string; color: string }> = {
    CRITICAL: { label: 'Critique', chip: 'bg-rose-50 text-rose-700 border-rose-200', color: ROSE },
    HIGH: { label: 'Élevée', chip: 'bg-orange-50 text-orange-700 border-orange-200', color: '#f97316' },
    MEDIUM: { label: 'Moyenne', chip: 'bg-amber-50 text-amber-700 border-amber-200', color: AMBER },
    LOW: { label: 'Faible', chip: 'bg-slate-100 text-slate-600 border-slate-200', color: SLATE },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
    const d = data.map((v, i) => ({ i, v }));
    return (
        <div style={{ width: '100%', height: 36 }}>
            <ResponsiveContainer>
                <AreaChart data={d} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`sp-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.8} fill={`url(#sp-${color})`} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function Kpi({ icon, iconColor, label, value, sub, trend, spark, sparkColor }: {
    icon: React.ReactNode; iconColor: string; label: string; value: string; sub?: React.ReactNode;
    trend?: { up: boolean; text: string }; spark?: number[]; sparkColor?: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${iconColor}18`, color: iconColor }}>{icon}</span>
                <span className="text-[11.5px] uppercase tracking-[0.1em] font-bold text-slate-500 leading-tight">{label}</span>
            </div>
            <div className="mt-2">
                <div className="text-[24px] font-black text-slate-800 leading-none tabular-nums">{value}</div>
                <div className="flex items-center gap-2 mt-1">
                    {trend && (
                        <span className={`inline-flex items-center gap-0.5 text-[11.5px] font-bold ${trend.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {trend.up ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />}{trend.text}
                        </span>
                    )}
                    {sub && <span className="text-[11.5px] text-slate-400">{sub}</span>}
                </div>
            </div>
            {spark && spark.length > 1 && <div className="mt-2"><Sparkline data={spark} color={sparkColor || iconColor} /></div>}
        </div>
    );
}

function Card({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
    return (
        <section className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${className}`}>
            <header className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
                <h2 className="text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}>{title}</h2>
                {action}
            </header>
            <div className="p-4 flex-1 min-h-0">{children}</div>
        </section>
    );
}

const PPEMonitoringDashboard = () => {
    const navigate = useNavigate();
    const selectedCompanyId = useAppSelector((state: any) => state.companySelection?.selectedCompanyId);
    const [mineName, setMineName] = useState<string>('');
    const [period, setPeriod] = useState('30');
    const [tab, setTab] = useState('exec');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshedAt, setRefreshedAt] = useState<string>('');

    useEffect(() => {
        getAllCompanies().then((cs: any[]) => {
            const c = (cs || []).find((x) => x.id === selectedCompanyId);
            if (c) setMineName(c.name || '');
        }).catch(() => {});
    }, [selectedCompanyId]);

    const load = () => {
        setLoading(true);
        getPpeMonitoring(Number(period))
            .then((d) => { setData(d); setRefreshedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })); })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };
    useEffect(load, [period]);

    const stockSpark = useMemo(() => (data?.monthly || []).map((m: any) => m.stock), [data]);
    const issueSpark = useMemo(() => (data?.monthly || []).map((m: any) => m.issues), [data]);
    const entrySpark = useMemo(() => (data?.monthly || []).map((m: any) => m.entries), [data]);

    const monthChart = useMemo(() => (data?.monthly || []).map((m: any) => {
        const [y, mo] = m.label.split('-');
        const names = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        return { name: names[Number(mo) - 1] || m.label, Entrées: m.entries, Sorties: m.issues, Stock: m.stock, year: y };
    }), [data]);

    const health = data?.health;
    const healthLegend = health ? [
        { key: 'sain', label: 'Sain', value: health.healthy, color: GREEN },
        { key: 'below', label: 'Sous seuil', value: health.belowThreshold, color: AMBER },
        { key: 'out', label: 'Rupture', value: health.outOfStock, color: ROSE },
        { key: 'dormant', label: 'Dormant', value: health.dormant, color: SLATE },
    ] : [];
    const healthTotal = healthLegend.reduce((a, b) => a + b.value, 0) || 1;

    const valueSplit = data?.valueSplit;
    const valueDonut = valueSplit ? [
        { key: 'avail', label: 'Disponible', value: valueSplit.available, color: GREEN },
        { key: 'resv', label: 'Réservé', value: valueSplit.reserved, color: AMBER },
        { key: 'dorm', label: 'Dormant', value: valueSplit.dormant, color: SLATE },
        { key: 'scrap', label: 'À réformer', value: valueSplit.toScrap, color: '#475569' },
    ].filter((s) => s.value > 0) : [];
    const valueTotal = valueDonut.reduce((a, b) => a + b.value, 0) || 1;

    const showExec = tab === 'exec';
    const showStocks = tab === 'exec' || tab === 'stocks';
    const showDistrib = tab === 'exec' || tab === 'distrib';
    const showValue = tab === 'exec' || tab === 'value';

    return (
        <div className="p-4 lg:p-5 space-y-4 w-full bg-slate-50 min-h-full">
            {/* En-tête */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="text-[11px] text-slate-400">Accueil › Gestion des EPI › Tableau de bord</div>
                    <h1 className="text-slate-900 mt-0.5" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '22px', fontWeight: 700 }}>
                        Pilotage des stocks &amp; distributions EPI
                    </h1>
                    <p className="text-[13px] text-slate-500">Suivi opérationnel, dotations, inventaire et valorisation{mineName ? ` — ${mineName}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-slate-500">
                    Dernière actualisation : {refreshedAt || '—'}
                    <button onClick={load} className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50">
                        <IconRefresh size={14} className={loading ? 'animate-spin text-blue-500' : 'text-slate-500'} />
                    </button>
                </div>
            </div>

            {/* Filtres + actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={period} onChange={(v) => setPeriod(v || '30')} data={PERIODS} size="xs" w={170} allowDeselect={false} />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="default" size="xs" leftSection={<IconDownload size={14} />}>Exporter</Button>
                    <Button variant="default" size="xs" leftSection={<IconPlus size={14} />} onClick={() => navigate('/ppe-management/create-ppe')}>Nouvel EPI</Button>
                    <Button color="teal" size="xs" leftSection={<IconPackage size={14} />} onClick={() => navigate('/ppe-management/stock-form')}>Entrée de stock</Button>
                </div>
            </div>

            {/* Onglets */}
            <div className="flex items-end gap-1 border-b border-slate-200">
                {TABS.map((tb) => (
                    <button key={tb.id} onClick={() => setTab(tb.id)}
                        className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px ${tab === tb.id ? 'border-teal-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {tb.label}
                    </button>
                ))}
            </div>

            {loading && !data ? (
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />)}
                </div>
            ) : !data ? (
                <div className="text-center text-slate-500 py-16">Aucune donnée.</div>
            ) : (
                <>
                    {/* KPI */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <Kpi icon={<IconCoin size={17} />} iconColor={GREEN} label="Valeur du stock" value={fmtFcfa(data.stockValue)} spark={stockSpark} sparkColor={GREEN} />
                        <Kpi icon={<IconBox size={17} />} iconColor={BLUE} label="Stock disponible" value={`${fmtInt(data.availableUnits)}`} sub={`${fmtInt(data.reservedUnits)} réservées`} spark={stockSpark} sparkColor={BLUE} />
                        <Kpi icon={<IconAlertTriangle size={17} />} iconColor={ROSE} label="Références critiques" value={String(data.criticalCount)} sub={`${data.rupturesCount} ruptures · ${data.belowThresholdCount} sous seuil`} spark={issueSpark} sparkColor={ROSE} />
                        <Kpi icon={<IconUsers size={17} />} iconColor={PURPLE} label="Distribué ce mois" value={`${fmtInt(data.distributedThisMonth)}`} sub="unités" spark={issueSpark} sparkColor={PURPLE} />
                        <Kpi icon={<IconPackage size={17} />} iconColor={AMBER} label="Demandes en attente" value={String(data.pendingRequests)} sub={`${data.priorityPending} prioritaires`} spark={entrySpark} sparkColor={AMBER} />
                        <Kpi icon={<IconShieldCheck size={17} />} iconColor="#0ea5e9" label="Taux de couverture" value={`${data.coverageRate}%`} spark={stockSpark} sparkColor="#0ea5e9" />
                    </div>

                    {/* Rangée charts */}
                    {(showStocks || showDistrib) && (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                            {showStocks && (
                                <Card title="Évolution des stocks et distributions" className="xl:col-span-5">
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <ComposedChart data={monthChart} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={44} />
                                                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                                                <Bar dataKey="Entrées" fill={GREEN} radius={[3, 3, 0, 0]} barSize={10} />
                                                <Bar dataKey="Sorties" fill={PURPLE} radius={[3, 3, 0, 0]} barSize={10} />
                                                <Line type="monotone" dataKey="Stock" stroke={BLUE} strokeWidth={2.4} dot={{ r: 2.5 }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex items-center gap-4 text-[12px] mt-1">
                                        <Legend color={GREEN} label="Entrées (u.)" />
                                        <Legend color={PURPLE} label="Sorties / distributions (u.)" />
                                        <Legend color={BLUE} label="Stock disponible (u.)" line />
                                    </div>
                                </Card>
                            )}

                            {showStocks && (
                                <Card title="Santé du stock" className="xl:col-span-3">
                                    <div className="relative" style={{ width: '100%', height: 150 }}>
                                        <ResponsiveContainer>
                                            <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: health?.score ?? 0 }]} startAngle={210} endAngle={-30}>
                                                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                                <RadialBar background={{ fill: '#eef2f7' }} dataKey="value" cornerRadius={20}
                                                    fill={(health?.score ?? 0) >= 80 ? GREEN : (health?.score ?? 0) >= 60 ? AMBER : ROSE} />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[26px] font-black text-slate-800 tabular-nums leading-none">{health?.score ?? 0}<span className="text-[14px] text-slate-400">/100</span></span>
                                            <span className="text-[11px] text-slate-500 mt-0.5">Score de santé</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1 mt-1">
                                        {healthLegend.map((h) => (
                                            <div key={h.key} className="flex items-center gap-2 text-[12.5px]">
                                                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: h.color }} />
                                                <span className="text-slate-600 flex-1">{h.label}</span>
                                                <span className="font-semibold text-slate-800 tabular-nums">{Math.round((h.value / healthTotal) * 100)} %</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2">Objectif : ≥ 80</p>
                                </Card>
                            )}

                            {showDistrib && (
                                <Card title="Distributions par département" className="xl:col-span-4">
                                    {(data.byDepartment || []).length === 0 ? (
                                        <p className="text-[12.5px] text-slate-400 py-8 text-center">Aucune distribution sur la période.</p>
                                    ) : (
                                        <div className="space-y-2.5 pt-1">
                                            {data.byDepartment.slice(0, 6).map((d: any) => {
                                                const max = data.byDepartment[0].units || 1;
                                                return (
                                                    <div key={d.department}>
                                                        <div className="flex items-center justify-between text-[12.5px] mb-0.5">
                                                            <span className="text-slate-700 truncate max-w-[60%]">{d.department}</span>
                                                            <span className="tabular-nums font-semibold text-slate-800">{fmtInt(d.units)}</span>
                                                        </div>
                                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full" style={{ width: `${(d.units / max) * 100}%`, background: PURPLE }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Alertes + Références */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                        {showStocks && (
                            <Card title="Références à surveiller" className="xl:col-span-8"
                                action={<button className="text-[12px] text-teal-600 font-semibold" onClick={() => navigate('/ppe-management')}>Voir toutes les références ({data.totalReferences}) →</button>}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[13px]">
                                        <thead className="text-slate-400 text-[11.5px] uppercase tracking-wider">
                                            <tr>
                                                <th className="text-left font-semibold py-1.5 pr-2">EPI</th>
                                                <th className="text-left font-semibold py-1.5 px-2">Catégorie</th>
                                                <th className="text-right font-semibold py-1.5 px-2">Disponible</th>
                                                <th className="text-right font-semibold py-1.5 px-2">Réservé</th>
                                                <th className="text-right font-semibold py-1.5 px-2">Seuil</th>
                                                <th className="text-right font-semibold py-1.5 px-2">Couverture</th>
                                                <th className="text-right font-semibold py-1.5 px-2">Valeur</th>
                                                <th className="text-left font-semibold py-1.5 pl-2">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(data.watchlist || []).map((w: any) => {
                                                const cfg = STATUS_CFG[w.status] || STATUS_CFG.HEALTHY;
                                                return (
                                                    <tr key={w.ppeId} className="border-t border-slate-100">
                                                        <td className="py-2 pr-2 text-slate-800 font-medium truncate max-w-[190px]">{w.name}</td>
                                                        <td className="py-2 px-2 text-slate-500">{ppeCategoryLabel(w.category)}</td>
                                                        <td className={`py-2 px-2 text-right tabular-nums font-semibold ${w.status === 'OUT' ? 'text-rose-600' : w.status === 'LOW' ? 'text-amber-600' : 'text-slate-700'}`}>{fmtInt(w.available)}</td>
                                                        <td className="py-2 px-2 text-right tabular-nums text-slate-500">{fmtInt(w.reserved)}</td>
                                                        <td className="py-2 px-2 text-right tabular-nums text-slate-500">{w.threshold ?? '—'}</td>
                                                        <td className="py-2 px-2 text-right tabular-nums text-slate-600">{w.coverageDays != null ? `${w.coverageDays} j` : '—'}</td>
                                                        <td className="py-2 px-2 text-right tabular-nums text-slate-700">{fmtFcfa(w.value)}</td>
                                                        <td className="py-2 pl-2"><span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-semibold ${cfg.chip}`}>{cfg.label}</span></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {showExec && (
                            <Card title="Alertes & actions prioritaires" className="xl:col-span-4">
                                {(data.alerts || []).length === 0 ? (
                                    <p className="text-[12.5px] text-slate-400 py-8 text-center flex items-center justify-center gap-2"><IconShieldCheck size={16} className="text-emerald-500" /> Aucune alerte active.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {data.alerts.map((a: any, i: number) => {
                                            const sev = SEV_CFG[a.severity] || SEV_CFG.LOW;
                                            return (
                                                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100">
                                                    <IconAlertTriangle size={16} style={{ color: sev.color }} className="mt-0.5 shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-[13px] font-semibold text-slate-800 truncate">{a.title}</div>
                                                        <div className="text-[11.5px] text-slate-500 truncate">{a.detail}</div>
                                                    </div>
                                                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full border text-[10.5px] font-semibold ${sev.chip}`}>{sev.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* Rotation + Valeur */}
                    {showValue && (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                            <Card title="Rotation &amp; couverture" className="xl:col-span-4">
                                <div className="space-y-3">
                                    <Metric icon={<IconRefresh size={16} />} label="Rotation moyenne" value={`${data.rotation?.avgRotation ?? 0} ×`} sub={`Sur ${period} jours`} color={BLUE} />
                                    <Metric icon={<IconBox size={16} />} label="Stock dormant" value={fmtFcfa(data.rotation?.dormantValue)} sub={`${data.rotation?.dormantPct ?? 0} % de la valeur totale`} color={SLATE} />
                                    <Metric icon={<IconShieldCheck size={16} />} label="Couverture moyenne" value={`${data.rotation?.avgCoverageDays ?? 0} jours`} sub="Objectif : ≥ 60 jours" color={GREEN} />
                                </div>
                            </Card>

                            <Card title="Répartition de la valeur" className="xl:col-span-8">
                                {valueDonut.length === 0 ? <p className="text-[12.5px] text-slate-400 py-8 text-center">Aucune valorisation.</p> : (
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="relative" style={{ width: 200, height: 200 }}>
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie data={valueDonut} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
                                                        {valueDonut.map((d) => <Cell key={d.key} fill={d.color} />)}
                                                    </Pie>
                                                    <Tooltip formatter={(v: any) => fmtFcfa(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-[17px] font-black text-slate-800 tabular-nums leading-none">{fmtFcfa(data.stockValue).replace(' FCFA', '')}</span>
                                                <span className="text-[10.5px] text-slate-400">FCFA</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2 w-full">
                                            {valueDonut.map((d) => (
                                                <div key={d.key} className="flex items-center gap-2 text-[13px]">
                                                    <span className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                                                    <span className="text-slate-600 flex-1">{d.label}</span>
                                                    <span className="font-semibold text-slate-800 tabular-nums">{fmtFcfa(d.value)}</span>
                                                    <span className="text-slate-400 tabular-nums w-14 text-right">({Math.round((d.value / valueTotal) * 100)} %)</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const Legend = ({ color, label, line }: { color: string; label: string; line?: boolean }) => (
    <span className="inline-flex items-center gap-1.5 text-slate-500">
        <span className={line ? 'w-3.5 h-0.5 rounded' : 'w-2.5 h-2.5 rounded-sm'} style={{ background: color }} />{label}
    </span>
);

const Metric = ({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>{icon}</span>
        <div className="min-w-0">
            <div className="text-[12px] text-slate-500">{label}</div>
            <div className="text-[17px] font-bold text-slate-800 tabular-nums leading-tight">{value}</div>
            {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
        </div>
    </div>
);

export default PPEMonitoringDashboard;
