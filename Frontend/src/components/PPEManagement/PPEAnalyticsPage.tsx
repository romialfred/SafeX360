import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select } from '@mantine/core';
import {
    Area, AreaChart, Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart,
    PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
    IconAlertTriangle, IconArrowDownRight, IconArrowUpRight, IconBox, IconCalendarStats, IconChartBar,
    IconCoin, IconClockHour4, IconFilter, IconPackage, IconRefresh, IconShieldCheck, IconShieldX,
    IconTrendingUp, IconUsers, IconX,
} from '@tabler/icons-react';
import { getPpeMonitoring } from '../../services/PPEMonitoringService';
import { getPpeConsumption } from '../../services/PPEMineService';
import { getEmployeesWithDepartment } from '../../services/EmployeeService';
import { getAllCompanies } from '../../services/HrmsService';
import { useAppSelector } from '../../slices/hooks';
import { ppeCategoryLabel } from './ppeLabels';

/**
 * Analyse & Valorisation des EPI — cockpit décisionnel 360°.
 * Alimenté par /ppe-monitoring/summary (stock, évolution, catégories, alertes,
 * rotation), /ppe-mine/consumption (coût/quantité par employé) et le référentiel RH.
 * Le BUDGET EPI est MODÉLISÉ (annualisation de la consommation réelle) — documenté.
 */

const GREEN = '#10b981', PURPLE = '#8b5cf6', BLUE = '#3b82f6', AMBER = '#f59e0b', ROSE = '#f43f5e', SLATE = '#94a3b8', TEAL = '#14b8a6';
const CAT_COLORS = [GREEN, BLUE, PURPLE, AMBER, TEAL, ROSE, '#6366f1', '#64748b'];

const PERIODS = [{ value: '30', label: '30 jours' }, { value: '90', label: '90 jours' }, { value: '180', label: '6 mois' }, { value: '365', label: '12 mois' }];
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const fmtXof = (v?: number) => {
    if (v == null) return '—';
    const a = Math.abs(v);
    if (a >= 1e6) return `${(v / 1e6).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M XOF`;
    if (a >= 1e3) return `${Math.round(v / 1e3).toLocaleString('fr-FR')} k XOF`;
    return `${Math.round(v).toLocaleString('fr-FR')} XOF`;
};
const fmtXofShort = (v?: number) => { if (v == null) return '—'; const a = Math.abs(v); if (a >= 1e6) return `${(v / 1e6).toFixed(1)} M`; if (a >= 1e3) return `${Math.round(v / 1e3)} k`; return `${Math.round(v)}`; };
const fmtInt = (v?: number) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));
const isoDaysAgo = (d: number) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toLocaleDateString('fr-FR'); };
const dl = (name: string, rows: string[][]) => {
    const csv = '﻿' + rows.map((r) => r.map((c) => (/[;\n"]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click(); URL.revokeObjectURL(a.href);
};

const PPEAnalyticsPage = () => {
    const navigate = useNavigate();
    const selectedCompanyId = useAppSelector((s: any) => s.companySelection?.selectedCompanyId);
    const [mineName, setMineName] = useState('');
    const [period, setPeriod] = useState('90');
    const [data, setData] = useState<any>(null);
    const [cons, setCons] = useState<any[]>([]);
    const [emps, setEmps] = useState<any[]>([]);
    const [department, setDepartment] = useState<string | null>(null);
    const [category, setCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatedAt, setUpdatedAt] = useState('');

    const load = () => {
        setLoading(true);
        Promise.all([getPpeMonitoring(Number(period)), getPpeConsumption().catch(() => []), getEmployeesWithDepartment().catch(() => [])])
            .then(([d, c, e]: any[]) => { setData(d); setCons(Array.isArray(c) ? c : []); setEmps(Array.isArray(e) ? e : []); setUpdatedAt(new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })); })
            .catch((err) => console.error(err)).finally(() => setLoading(false));
    };
    useEffect(load, [period]);
    useEffect(() => { getAllCompanies().then((cs: any[]) => setMineName((cs || []).find((c) => c.id === selectedCompanyId)?.name || '')).catch(() => {}); }, [selectedCompanyId]);

    // ── Référentiel employé (dept) ──
    const empById = useMemo(() => { const m: Record<number, any> = {}; emps.forEach((e) => { m[e.id] = { name: e.name || `#${e.id}`, department: e.department || 'Sans département', position: e.position }; }); return m; }, [emps]);

    // ── Consommation valorisée (à partir des dotations par employé) ──
    const consTotals = useMemo(() => {
        let cost = 0, qty = 0, n = 0;
        cons.forEach((c) => { if (c.cost > 0 || c.quantity > 0) { cost += c.cost || 0; qty += c.quantity || 0; n++; } });
        return { cost, qty, employees: n, costPerEmp: n ? cost / n : 0, qtyPerEmp: n ? qty / n : 0 };
    }, [cons]);

    // ── Consommation par département (valorisée) ──
    const deptCons = useMemo(() => {
        const m: Record<string, { cost: number; qty: number; emps: number }> = {};
        cons.forEach((c) => { const d = empById[c.empId]?.department || 'Sans département'; (m[d] = m[d] || { cost: 0, qty: 0, emps: 0 }); m[d].cost += c.cost || 0; m[d].qty += c.quantity || 0; m[d].emps++; });
        const arr = Object.entries(m).map(([dept, v]) => ({ dept, ...v, avg: v.emps ? v.cost / v.emps : 0 }));
        const tot = arr.reduce((a, b) => a + b.cost, 0) || 1;
        return arr.map((x) => ({ ...x, pct: (x.cost / tot) * 100 })).sort((a, b) => b.cost - a.cost);
    }, [cons, empById]);
    const deptAvg = useMemo(() => { const m: Record<string, number> = {}; deptCons.forEach((d) => { m[d.dept] = d.avg; }); return m; }, [deptCons]);

    // ── Top 10 employés ──
    const top10 = useMemo(() => cons
        .filter((c) => (department ? empById[c.empId]?.department === department : true))
        .map((c) => { const e = empById[c.empId] || {}; const avg = deptAvg[e.department] || 0; const ecart = avg ? Math.round(((c.cost - avg) / avg) * 100) : 0; const status = ecart >= 30 ? 'Élevé' : ecart >= 15 ? 'À surveiller' : 'Normal'; return { empId: c.empId, name: e.name || `#${c.empId}`, department: e.department || '—', position: e.position || '—', cost: c.cost, qty: c.quantity, ecart, status }; })
        .sort((a, b) => b.cost - a.cost).slice(0, 10), [cons, empById, deptAvg, department]);

    // ── Budget EPI modélisé (annualisation de la consommation réelle) ──
    const budget = useMemo(() => {
        const annual = consTotals.cost * (12 / 24); // dotations seedées sur 24 mois → run-rate annuel
        const target = Math.max(5e6, Math.ceil(annual * 1.15 / 5e6) * 5e6);
        const exec = target ? Math.round((annual / target) * 1000) / 10 : 0;
        return { annual, target, exec, remaining: target - annual, status: annual > target ? 'Dépassement' : exec >= 90 ? 'À surveiller' : 'Sous contrôle' };
    }, [consTotals]);

    // ── Séries mensuelles (montant ≈ unités × prix moyen) ──
    const avgPrice = data && data.availableUnits ? data.stockValue / data.availableUnits : 0;
    const monthChart = useMemo(() => (data?.monthly || []).map((m: any) => { const [, mo] = m.label.split('-'); return { name: MONTHS_FR[Number(mo) - 1] || m.label, Montant: Math.round(m.issues * avgPrice), Quantité: m.issues, Entrées: Math.round(m.entries * avgPrice), Distributions: Math.round(m.issues * avgPrice), Budget: Math.round(budget.target / 12) }; }), [data, avgPrice, budget]);
    const cumulative = useMemo(() => { let cReal = 0; return monthChart.map((m: any, i: number) => { cReal += m.Distributions; return { name: m.name, Budget: Math.round((budget.target / 12) * (i + 1)), Réel: cReal, Projection: Math.round(cReal * (12 / Math.max(1, i + 1))) }; }); }, [monthChart, budget]);

    const catDonut = useMemo(() => (data?.valueByCategory || []).filter((c: any) => (category ? c.category === category : true)).slice(0, 6).map((c: any, i: number) => ({ label: ppeCategoryLabel(c.category), value: c.value, units: c.units, color: CAT_COLORS[i % CAT_COLORS.length] })), [data, category]);
    const catTotal = catDonut.reduce((a: number, b: any) => a + b.value, 0) || 1;

    const belowValue = useMemo(() => (data?.watchlist || []).filter((w: any) => w.status === 'LOW').reduce((a: number, w: any) => a + (w.value || 0), 0), [data]);
    const distributedTrend = data?.distributedTrend, stockTrend = data?.stockTrend;
    const coverageMonths = data?.rotation ? Math.round((data.rotation.avgCoverageDays / 30) * 10) / 10 : 0;
    const sev: Record<string, { label: string; color: string; chip: string }> = { CRITICAL: { label: 'Critique', color: ROSE, chip: 'bg-rose-50 text-rose-600' }, HIGH: { label: 'Élevée', color: '#f97316', chip: 'bg-orange-50 text-orange-600' }, MEDIUM: { label: 'Moyenne', color: AMBER, chip: 'bg-amber-50 text-amber-600' }, LOW: { label: 'Faible', color: SLATE, chip: 'bg-slate-100 text-slate-500' } };

    const stockSpark = (data?.monthly || []).map((m: any) => m.stock);
    const issueSpark = (data?.monthly || []).map((m: any) => m.issues);
    const activeFilters = [`Période : ${PERIODS.find((p) => p.value === period)?.label}`, mineName && `Mine : ${mineName}`, department && `Dépt : ${department}`, category && `Catégorie : ${ppeCategoryLabel(category)}`].filter(Boolean) as string[];

    if (loading && !data) return <div className="p-5 bg-slate-50 min-h-full"><div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />)}</div></div>;

    return (
        <div className="p-4 lg:p-5 space-y-4 w-full bg-slate-50 min-h-full">
            {/* En-tête */}
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '22px', fontWeight: 700 }}>Analyse &amp; Valorisation des EPI</h1>
                    <p className="text-[13px] text-slate-500">Vue 360° des stocks, consommations, coûts, risques et budget.</p>
                </div>
                <div className="flex items-center gap-2 text-[11.5px] text-slate-400">
                    Dernière mise à jour : {updatedAt || '—'}
                    <button onClick={load} className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"><IconRefresh size={13} className={loading ? 'animate-spin text-blue-500' : 'text-slate-500'} /></button>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="flex flex-wrap items-end gap-2">
                    <Field label="Période"><Select value={period} onChange={(v) => setPeriod(v || '90')} data={PERIODS} size="xs" w={130} allowDeselect={false} /></Field>
                    <Field label="Du"><Select value={isoDaysAgo(Number(period))} data={[isoDaysAgo(Number(period))]} size="xs" w={140} disabled /></Field>
                    <Field label="Au"><Select value={new Date().toLocaleDateString('fr-FR')} data={[new Date().toLocaleDateString('fr-FR')]} size="xs" w={140} disabled /></Field>
                    <Field label="Mine / Site"><Select value={mineName || 'Mine active'} data={[mineName || 'Mine active']} size="xs" w={150} disabled /></Field>
                    <Field label="Département"><Select placeholder="Tous" value={department} onChange={setDepartment} data={deptCons.map((d) => d.dept)} clearable searchable size="xs" w={170} /></Field>
                    <Field label="Catégorie EPI"><Select placeholder="Toutes" value={category} onChange={setCategory} data={(data?.valueByCategory || []).map((c: any) => ({ value: c.category, label: ppeCategoryLabel(c.category) }))} clearable size="xs" w={170} /></Field>
                    <Button variant="default" size="xs" leftSection={<IconFilter size={14} />}>Plus de filtres</Button>
                    <Button variant="default" size="xs" ml="auto" onClick={() => dl('analyse-epi-departements.csv', [['Département', 'Montant XOF', 'Part %', 'Employés'], ...deptCons.map((d) => [d.dept, String(Math.round(d.cost)), d.pct.toFixed(1), String(d.emps)])])}>Exporter</Button>
                </div>
                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                        <span className="text-slate-500">Filtres actifs :</span>
                        {activeFilters.map((f) => <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{f}{(f.startsWith('Dépt') || f.startsWith('Catégorie')) && <button onClick={() => { if (f.startsWith('Dépt')) setDepartment(null); else setCategory(null); }}><IconX size={11} /></button>}</span>)}
                        {(department || category) && <button className="text-teal-600 font-semibold" onClick={() => { setDepartment(null); setCategory(null); }}>Réinitialiser tout</button>}
                    </div>
                )}
            </div>

            {/* Synthèse financière & consommation */}
            <SectionTitle icon={<IconCoin size={15} />}>Synthèse financière &amp; consommation</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                <Metric icon={<IconCoin size={16} />} color={GREEN} label="Valeur actuelle du stock" value={fmtXof(data.stockValue)} trend={stockTrend} spark={stockSpark} sparkColor={GREEN}
                    footer={<Objective current={data.stockValue} target={data.stockValue / 1.1} />} />
                <Metric icon={<IconTrendingUp size={16} />} color={ROSE} label="Consommation totale valorisée" value={fmtXof(consTotals.cost)} trend={distributedTrend} spark={issueSpark} sparkColor={ROSE}
                    footer={<Bar2 label={`Budget consommé : ${budget.exec} %`} pct={budget.exec} color={budget.exec > 90 ? ROSE : GREEN} />} />
                <Metric icon={<IconPackage size={16} />} color={GREEN} label="Quantité totale distribuée" value={`${fmtInt(consTotals.qty)} unités`} trend={distributedTrend} spark={issueSpark} sparkColor={GREEN}
                    footer={<span className="text-[11px] text-slate-400">Moyenne / employé : {consTotals.qtyPerEmp.toFixed(1)} unités</span>} />
                <Metric icon={<IconUsers size={16} />} color={PURPLE} label="Coût moyen par employé" value={fmtXof(consTotals.costPerEmp)} trend={distributedTrend} spark={issueSpark} sparkColor={PURPLE}
                    footer={<span className="text-[11px] text-slate-400">Employés bénéficiaires : {fmtInt(consTotals.employees)}</span>} />
                <BudgetGauge budget={budget} />
            </div>

            {/* Stock & disponibilité */}
            <SectionTitle icon={<IconBox size={15} />}>Stock &amp; disponibilité</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                <Metric icon={<IconBox size={16} />} color={BLUE} label="Références actives" value={String(data.totalReferences)} footer={<span className="text-[11px] text-slate-400">Disponibles : {data.totalReferences - data.rupturesCount}</span>} />
                <Metric icon={<IconAlertTriangle size={16} />} color={AMBER} label="Articles en stock bas" value={`${data.belowThresholdCount} réf.`} footer={<span className="text-[11px] text-slate-400">Valeur concernée : {fmtXofShort(belowValue)}</span>} />
                <Metric icon={<IconShieldX size={16} />} color={ROSE} label="Risques de rupture" value={`${data.rupturesCount} réf.`} footer={<span className="text-[11px] text-slate-400">Ruptures effectives : {data.rupturesCount}</span>} />
                <Metric icon={<IconClockHour4 size={16} />} color={SLATE} label="Stock dormant (>90 j)" value={fmtXof(data.rotation?.dormantValue)} footer={<span className="text-[11px] text-slate-400">% du stock total : {data.rotation?.dormantPct ?? 0} %</span>} />
                <Metric icon={<IconCalendarStats size={16} />} color={GREEN} label="Couverture moyenne du stock" value={`${coverageMonths} mois`} footer={<span className="text-[11px] text-slate-400">Minimum requis : 2 mois</span>} />
            </div>

            {/* Évolution + Département + Top 10 */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <ChartCard title="Évolution mensuelle des consommations (Montant en XOF)" className="xl:col-span-5">
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <ComposedChart data={monthChart} margin={{ top: 5, right: 6, left: -6, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                                <YAxis yAxisId="l" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={46} tickFormatter={(v) => fmtXofShort(v)} />
                                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={40} />
                                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v: any, n: any) => n === 'Quantité' ? [fmtInt(Number(v)), 'Quantité (u.)'] : [fmtXof(Number(v)), n]} />
                                <Bar yAxisId="l" dataKey="Montant" name="Montant consommé" fill={GREEN} radius={[3, 3, 0, 0]} barSize={22} />
                                <Line yAxisId="r" type="monotone" dataKey="Quantité" name="Quantité distribuée" stroke={BLUE} strokeWidth={2.2} dot={{ r: 2.5 }} />
                                <Line yAxisId="l" type="monotone" dataKey="Budget" name="Budget mensuel" stroke={AMBER} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[11.5px] mt-1">
                        <Lg color={GREEN} label="Montant consommé (XOF)" /><Lg color={BLUE} label="Quantité distribuée (unités)" line /><Lg color={AMBER} label="Budget mensuel" line />
                    </div>
                </ChartCard>

                <ChartCard title="Consommation par département (Top 6)" className="xl:col-span-4"
                    action={<button className="text-[12px] text-teal-600 font-semibold" onClick={() => navigate('/ppe-monitoring')}>Voir le détail par service →</button>}>
                    {deptCons.length === 0 ? <Empty /> : (
                        <div className="space-y-2.5 pt-1">
                            {deptCons.slice(0, 6).map((d) => { const max = deptCons[0].cost || 1; return (
                                <button key={d.dept} onClick={() => setDepartment(department === d.dept ? null : d.dept)} className="w-full text-left">
                                    <div className="flex items-center justify-between text-[12.5px] mb-0.5"><span className={`truncate max-w-[55%] ${department === d.dept ? 'font-bold text-teal-700' : 'text-slate-600'}`}>{d.dept}</span><span className="tabular-nums text-slate-500">{fmtXofShort(d.cost)} · {d.pct.toFixed(1)} %</span></div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(d.cost / max) * 100}%`, background: BLUE }} /></div>
                                </button>
                            ); })}
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Top 10 des employés par consommation (en valeur)" className="xl:col-span-3">
                    <div className="overflow-y-auto max-h-[300px]">
                        <table className="w-full text-[12px]">
                            <thead className="text-slate-400 text-[10.5px] tracking-wide sticky top-0 bg-white">
                                <tr><th className="text-left font-semibold py-1 pr-1">#</th><th className="text-left font-semibold py-1">Employé</th><th className="text-right font-semibold py-1 px-1">Montant</th><th className="text-right font-semibold py-1">Écart</th></tr>
                            </thead>
                            <tbody>
                                {top10.map((e, i) => { const cfg = e.status === 'Élevé' ? { c: ROSE, t: 'text-rose-600' } : e.status === 'À surveiller' ? { c: AMBER, t: 'text-amber-600' } : { c: GREEN, t: 'text-emerald-600' }; return (
                                    <tr key={e.empId} className="border-t border-slate-50">
                                        <td className="py-1.5 pr-1 text-slate-400 tabular-nums">{i + 1}</td>
                                        <td className="py-1.5"><div className="text-slate-800 font-medium truncate max-w-[120px]">{e.name}</div><div className="text-[10px] text-slate-400 truncate">{e.department}</div></td>
                                        <td className="py-1.5 px-1 text-right tabular-nums text-slate-700">{fmtXofShort(e.cost)}</td>
                                        <td className="py-1.5 text-right"><span className={`tabular-nums font-semibold ${cfg.t}`}>{e.ecart >= 0 ? '+' : ''}{e.ecart}%</span></td>
                                    </tr>
                                ); })}
                                {top10.length === 0 && <tr><td colSpan={4}><Empty /></td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <button className="text-[12px] text-teal-600 font-semibold mt-2" onClick={() => navigate('/ppe-management/my-ppe')}>Voir le top 10 complet →</button>
                </ChartCard>
            </div>

            {/* Catégories + Réceptions/Distributions + Budget + Alertes */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <ChartCard title="Consommation par catégorie d'EPI (Montant en XOF)" className="xl:col-span-3">
                    {catDonut.length === 0 ? <Empty /> : (
                        <div className="flex items-center gap-3">
                            <div style={{ width: 130, height: 130 }}>
                                <ResponsiveContainer><PieChart><Pie data={catDonut} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={2} stroke="none">{catDonut.map((d: any) => <Cell key={d.label} fill={d.color} />)}</Pie><Tooltip formatter={(v: any) => fmtXof(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} /></PieChart></ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-1">
                                {catDonut.map((d: any) => <div key={d.label} className="flex items-center gap-1.5 text-[11.5px]"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} /><span className="text-slate-600 flex-1 truncate">{d.label}</span><span className="text-slate-400 tabular-nums">{Math.round((d.value / catTotal) * 100)} %</span><span className="font-semibold text-slate-700 tabular-nums w-12 text-right">{fmtXofShort(d.value)}</span></div>)}
                            </div>
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Réceptions vs Distributions (Montant en XOF)" className="xl:col-span-4">
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                            <ComposedChart data={monthChart} margin={{ top: 5, right: 6, left: -6, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => fmtXofShort(v)} />
                                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v: any, n: any) => [fmtXof(Number(v)), n]} />
                                <Bar dataKey="Entrées" name="Réceptions" fill={GREEN} radius={[3, 3, 0, 0]} barSize={11} />
                                <Bar dataKey="Distributions" fill={PURPLE} radius={[3, 3, 0, 0]} barSize={11} />
                                <Line type="monotone" dataKey="Montant" name="Variation nette" stroke={BLUE} strokeWidth={2} dot={{ r: 2 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-4 text-[11.5px] mt-1"><Lg color={GREEN} label="Réceptions" /><Lg color={PURPLE} label="Distributions" /><Lg color={BLUE} label="Variation nette" line /></div>
                </ChartCard>

                <ChartCard title="Budget vs Consommation (Cumulatif)" className="xl:col-span-3">
                    <div style={{ width: '100%', height: 190 }}>
                        <ResponsiveContainer>
                            <ComposedChart data={cumulative} margin={{ top: 5, right: 6, left: -6, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} minTickGap={12} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => fmtXofShort(v)} />
                                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v: any, n: any) => [fmtXof(Number(v)), n]} />
                                <Line type="monotone" dataKey="Budget" name="Budget théorique" stroke={AMBER} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                                <Line type="monotone" dataKey="Réel" name="Consommation réelle" stroke={GREEN} strokeWidth={2.4} dot={false} />
                                <Line type="monotone" dataKey="Projection" name="Projection" stroke={BLUE} strokeWidth={1.6} strokeDasharray="2 3" dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-[11.5px] text-slate-500 mt-1">Projection fin d'année : <span className="font-bold text-slate-800">{fmtXofShort(budget.annual)} XOF</span> · Écart : <span className={budget.annual > budget.target ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>{budget.annual > budget.target ? '+' : ''}{fmtXofShort(budget.annual - budget.target)}</span></div>
                </ChartCard>

                <ChartCard title="Alertes critiques" className="xl:col-span-2">
                    {(data.alerts || []).length === 0 ? <p className="text-[12px] text-slate-400 py-6 text-center flex flex-col items-center gap-1"><IconShieldCheck size={18} className="text-emerald-500" /> Aucune alerte.</p> : (
                        <div className="space-y-1.5">
                            {data.alerts.slice(0, 6).map((a: any, i: number) => { const s = sev[a.severity] || sev.LOW; return (
                                <div key={i} className="flex items-start gap-1.5 p-1.5 rounded-lg border border-slate-100">
                                    <IconAlertTriangle size={13} style={{ color: s.color }} className="mt-0.5 shrink-0" />
                                    <div className="min-w-0 flex-1"><div className="text-[11.5px] font-semibold text-slate-700 truncate">{a.title}</div></div>
                                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold ${s.chip}`}>{s.label}</span>
                                </div>
                            ); })}
                            <button className="text-[11.5px] text-teal-600 font-semibold mt-1" onClick={() => navigate('/ppe-monitoring')}>Voir toutes les alertes →</button>
                        </div>
                    )}
                </ChartCard>
            </div>
        </div>
    );
};

// ── UI helpers ──
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<div><div className="text-[10px] text-slate-400 font-semibold mb-0.5">{label}</div>{children}</div>);
const SectionTitle = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (<div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 pt-1"><span className="text-teal-600">{icon}</span>{children}</div>);
const Lg = ({ color, label, line }: { color: string; label: string; line?: boolean }) => (<span className="inline-flex items-center gap-1.5 text-slate-500"><span className={line ? 'w-3.5 h-0.5 rounded' : 'w-2.5 h-2.5 rounded-sm'} style={{ background: color }} />{label}</span>);
const Empty = () => <p className="text-[12px] text-slate-400 py-6 text-center">Aucune donnée.</p>;

const ChartCard = ({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) => (
    <section className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
        <header className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2"><h2 className="text-slate-800 text-[13.5px] font-semibold">{title}</h2>{action}</header>
        <div className="p-4">{children}</div>
    </section>
);

const Sparkline = ({ data, color }: { data: number[]; color: string }) => (
    <div style={{ width: '100%', height: 30 }}><ResponsiveContainer><AreaChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}><defs><linearGradient id={`m-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs><Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} fill={`url(#m-${color})`} dot={false} /></AreaChart></ResponsiveContainer></div>
);

const Metric = ({ icon, color, label, value, trend, spark, sparkColor, footer }: { icon: React.ReactNode; color: string; label: string; value: string; trend?: number | null; spark?: number[]; sparkColor?: string; footer?: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>{icon}</span><span className="text-[11px] text-slate-500 font-semibold leading-tight">{label}</span></div>
        <div className="text-[22px] font-black text-slate-800 tabular-nums mt-2 leading-none">{value}</div>
        {trend != null && <div className="flex items-center gap-1 mt-1"><span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trend >= 0 ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />}{trend >= 0 ? '+' : ''}{trend} %</span><span className="text-[10.5px] text-slate-400">vs période précédente</span></div>}
        {spark && spark.length > 1 && <div className="mt-1.5"><Sparkline data={spark} color={sparkColor || color} /></div>}
        {footer && <div className="mt-1.5">{footer}</div>}
    </div>
);

const Objective = ({ current, target }: { current: number; target: number }) => (
    <div><div className="text-[10.5px] text-slate-400">Objectif : {fmtXofShort(target)} XOF</div><span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${current >= target ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{current >= target ? 'Au-dessus de l\'objectif' : 'Sous l\'objectif'}</span></div>
);
const Bar2 = ({ label, pct, color }: { label: string; pct: number; color: string }) => (
    <div><div className="text-[10.5px] text-slate-400 mb-0.5">{label}</div><div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} /></div></div>
);

const BudgetGauge = ({ budget }: { budget: any }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1"><span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f59e0b18', color: AMBER }}><IconChartBar size={16} /></span><span className="text-[11px] text-slate-500 font-semibold leading-tight">Budget EPI</span></div>
        <div className="flex items-center gap-2">
            <div className="relative" style={{ width: 78, height: 62 }}>
                <ResponsiveContainer><RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: Math.min(100, budget.exec) }]} startAngle={210} endAngle={-30}><PolarAngleAxis type="number" domain={[0, 100]} tick={false} /><RadialBar background={{ fill: '#eef2f7' }} dataKey="value" cornerRadius={10} fill={budget.exec > 100 ? ROSE : budget.exec >= 90 ? AMBER : GREEN} /></RadialBarChart></ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-[15px] font-black text-slate-800 tabular-nums leading-none">{budget.exec}%</span><span className="text-[8px] text-slate-400">Exécution</span></div>
            </div>
            <div className="min-w-0">
                <div className="text-[16px] font-black text-slate-800 tabular-nums leading-none">{fmtXofShort(budget.annual)}<span className="text-[11px] text-slate-400"> / {fmtXofShort(budget.target)} XOF</span></div>
                <div className="text-[10.5px] text-slate-400 mt-1">Restant : {fmtXofShort(budget.remaining)} XOF</div>
                <div className="text-[10.5px] text-slate-400">Projection : {fmtXofShort(budget.annual)} XOF</div>
                <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-semibold ${budget.status === 'Dépassement' ? 'bg-rose-50 text-rose-600' : budget.status === 'À surveiller' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{budget.status}</span>
            </div>
        </div>
    </div>
);

export default PPEAnalyticsPage;
