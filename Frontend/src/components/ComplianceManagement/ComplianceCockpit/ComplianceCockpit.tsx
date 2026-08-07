import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Tabs } from '@mantine/core';
import {
    IconArrowRight, IconBook, IconCertificate, IconClipboardCheck, IconGauge, IconRefresh,
    IconScale, IconShieldCheck, IconTools, IconUsers,
} from '@tabler/icons-react';
import {
    Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip,
    XAxis, YAxis,
} from 'recharts';

import PageHeader from '../../UtilityComp/PageHeader';
import CompDashboard from '../CompDashboard/CompDashboard';
import { getAllLicenses, type License } from '../../../services/RegulatoryLicenseService';
import { getAllAuthorizations, type WorkAuthorization } from '../../../services/WorkAuthorizationService';
import { getAllInspections, type MandatoryInspection } from '../../../services/MandatoryInspectionService';
import { getAllObligations, type RegulatoryObligation } from '../../../services/RegulatoryObligationService';
import { formatDateFr } from '../regulatoryLabels';

const GREEN = '#10b981', AMBER = '#f59e0b', ROSE = '#f43f5e', SLATE = '#94a3b8', BLUE = '#0284c7', TEAL = '#14b8a6';

interface Deadline { kind: string; label: string; ref?: string; date?: string | null; days?: number | null; color: string }

export default function ComplianceCockpit() {
    const navigate = useNavigate();
    const [licenses, setLicenses] = useState<License[]>([]);
    const [authorizations, setAuthorizations] = useState<WorkAuthorization[]>([]);
    const [inspections, setInspections] = useState<MandatoryInspection[]>([]);
    const [obligations, setObligations] = useState<RegulatoryObligation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState<string | null>('overview');

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [lic, auth, insp, obl] = await Promise.all([
                getAllLicenses().catch(() => []),
                getAllAuthorizations().catch(() => []),
                getAllInspections().catch(() => []),
                getAllObligations().catch(() => []),
            ]);
            setLicenses(lic); setAuthorizations(auth); setInspections(insp); setObligations(obl);
        } finally { setLoading(false); setRefreshing(false); }
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    // ─── Agrégations (toutes cloisonnées par mine côté serveur) ───────────────
    const stats = useMemo(() => {
        const licAttn = licenses.filter((l) => l.conformity === 'EXPIRE' || l.conformity === 'A_RENOUVELER').length;
        const authActive = authorizations.filter((a) => a.conformity === 'EN_COURS').length;
        const authExpired = authorizations.filter((a) => a.conformity === 'EXPIRE').length;
        const inspAttn = inspections.filter((i) => i.conformity === 'EXPIRE' || i.conformity === 'A_RENOUVELER'
            || i.result === 'NON_CONFORME').length;
        const oblAttn = obligations.filter((o) => o.conformity === 'NON_CONFORME' || o.conformity === 'PARTIEL'
            || o.reviewOverdue).length;

        const assessable = obligations.filter((o) => o.conformity && o.conformity !== 'A_EVALUER' && o.conformity !== 'SUSPENDU');
        const oblRate = assessable.length
            ? Math.round((assessable.filter((o) => o.conformity === 'CONFORME').length / assessable.length) * 100)
            : null;

        return {
            licTotal: licenses.length, licAttn,
            authTotal: authorizations.length, authActive, authExpired,
            inspTotal: inspections.length, inspAttn,
            oblTotal: obligations.length, oblAttn, oblRate,
            attention: licAttn + authExpired + inspAttn + oblAttn,
        };
    }, [licenses, authorizations, inspections, obligations]);

    const registers = [
        {
            key: 'obl', name: 'Obligations & code minier', icon: <IconScale size={18} />, route: '/compliance-obligations',
            total: stats.oblTotal, attn: stats.oblAttn, color: '#7c3aed',
            breakdown: [
                { label: 'Conforme', n: obligations.filter((o) => o.conformity === 'CONFORME').length, c: GREEN },
                { label: 'Partiel', n: obligations.filter((o) => o.conformity === 'PARTIEL').length, c: AMBER },
                { label: 'Non conforme', n: obligations.filter((o) => o.conformity === 'NON_CONFORME').length, c: ROSE },
                { label: 'À évaluer', n: obligations.filter((o) => o.conformity === 'A_EVALUER').length, c: SLATE },
            ],
        },
        {
            key: 'lic', name: 'Licences & permis', icon: <IconCertificate size={18} />, route: '/compliance-licenses',
            total: stats.licTotal, attn: stats.licAttn, color: '#0f766e',
            breakdown: [
                { label: 'Conforme', n: licenses.filter((l) => l.conformity === 'CONFORME').length, c: GREEN },
                { label: 'À renouveler', n: licenses.filter((l) => l.conformity === 'A_RENOUVELER').length, c: AMBER },
                { label: 'Expiré', n: licenses.filter((l) => l.conformity === 'EXPIRE').length, c: ROSE },
            ],
        },
        {
            key: 'auth', name: 'Autorisations de travaux', icon: <IconTools size={18} />, route: '/compliance-authorizations',
            total: stats.authTotal, attn: stats.authExpired, color: '#ea580c',
            breakdown: [
                { label: 'En cours', n: authorizations.filter((a) => a.conformity === 'EN_COURS').length, c: GREEN },
                { label: 'Planifié', n: authorizations.filter((a) => a.conformity === 'PLANIFIE').length, c: BLUE },
                { label: 'Expiré', n: authorizations.filter((a) => a.conformity === 'EXPIRE').length, c: ROSE },
            ],
        },
        {
            key: 'insp', name: 'Inspections équipements', icon: <IconGauge size={18} />, route: '/compliance-inspections',
            total: stats.inspTotal, attn: stats.inspAttn, color: '#0284c7',
            breakdown: [
                { label: 'Conforme', n: inspections.filter((i) => i.conformity === 'CONFORME').length, c: GREEN },
                { label: 'À planifier', n: inspections.filter((i) => i.conformity === 'A_RENOUVELER').length, c: AMBER },
                { label: 'En retard', n: inspections.filter((i) => i.conformity === 'EXPIRE').length, c: ROSE },
            ],
        },
    ];

    const deadlines = useMemo<Deadline[]>(() => {
        const items: Deadline[] = [];
        licenses.forEach((l) => l.expiryDate && items.push({ kind: 'Licence', label: l.title || '', ref: l.reference || undefined, date: l.expiryDate, days: l.daysToExpiry ?? null, color: '#0f766e' }));
        authorizations.forEach((a) => a.validTo && a.conformity !== 'CLOTURE' && items.push({ kind: 'Autorisation', label: a.title || '', ref: a.reference || undefined, date: a.validTo, days: a.daysToEnd ?? null, color: '#ea580c' }));
        inspections.forEach((i) => i.nextInspectionDate && items.push({ kind: 'Inspection', label: i.title || '', ref: i.equipmentRef || undefined, date: i.nextInspectionDate, days: i.daysToNext ?? null, color: '#0284c7' }));
        obligations.forEach((o) => o.nextReviewDate && items.push({ kind: 'Revue obligation', label: o.title || '', ref: o.reference || undefined, date: o.nextReviewDate, days: o.daysToReview ?? null, color: '#7c3aed' }));
        return items.filter((d) => d.days != null).sort((a, b) => (a.days! - b.days!)).slice(0, 10);
    }, [licenses, authorizations, inspections, obligations]);

    const registerChartData = registers.map((r) => ({
        name: r.name.split(' ')[0],
        conforme: r.breakdown.find((b) => b.label === 'Conforme' || b.label === 'En cours')?.n ?? 0,
        attention: r.attn,
    }));

    const globalDonut = [
        { name: 'Sans alerte', value: Math.max(0, (stats.licTotal + stats.authTotal + stats.inspTotal + stats.oblTotal) - stats.attention), color: GREEN },
        { name: 'À traiter', value: stats.attention, color: ROSE },
    ];

    const header = (
        <PageHeader
            breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Conformité Réglementaire' }, { label: 'Tableau de bord' }]}
            icon={<IconShieldCheck size={22} stroke={2} />}
            iconColor="green"
            title="Tableau de bord — Conformité Réglementaire"
            subtitle="Vue consolidée de la conformité de la mine : réglementaire et personnel."
            actions={
                <button onClick={fetchData} aria-label="Actualiser"
                    className="w-[34px] h-[34px] grid place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                    <IconRefresh size={16} className={refreshing ? 'animate-spin text-teal-500' : 'text-slate-500'} />
                </button>
            }
        />
    );

    if (loading) {
        return <div className="p-5 space-y-4 w-full">{header}<div className="flex items-center justify-center py-24"><Loader color="teal" /></div></div>;
    }

    return (
        <div className="p-5 space-y-4 w-full">
            {header}
            <Tabs value={tab} onChange={setTab} color="teal" keepMounted={false}>
                <Tabs.List>
                    <Tabs.Tab value="overview" leftSection={<IconShieldCheck size={16} />}>Vue d'ensemble</Tabs.Tab>
                    <Tabs.Tab value="personnel" leftSection={<IconUsers size={16} />}>Conformité du personnel</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt="md">
                    {/* KPIs consolidés */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        {[
                            { label: 'Taux conformité obligations', value: stats.oblRate == null ? '—' : `${stats.oblRate}%`, color: '#7c3aed', icon: <IconScale size={16} /> },
                            { label: 'Points à traiter', value: stats.attention, color: '#f43f5e', icon: <IconShieldCheck size={16} /> },
                            { label: 'Licences à renouveler', value: stats.licAttn, color: '#0f766e', icon: <IconCertificate size={16} /> },
                            { label: 'Autorisations en cours', value: stats.authActive, color: '#10b981', icon: <IconTools size={16} /> },
                            { label: 'Inspections en retard', value: inspections.filter((i) => i.conformity === 'EXPIRE').length, color: '#0284c7', icon: <IconGauge size={16} /> },
                            { label: 'Obligations non conformes', value: obligations.filter((o) => o.conformity === 'NON_CONFORME').length, color: '#e11d48', icon: <IconBook size={16} /> },
                        ].map((k) => (
                            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm" style={{ borderTop: `2px solid ${k.color}` }}>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10.5px] uppercase tracking-[0.08em] text-slate-500 font-semibold leading-tight">{k.label}</span>
                                    <span className="w-6 h-6 rounded-md grid place-items-center shrink-0" style={{ background: `${k.color}18`, color: k.color }}>{k.icon}</span>
                                </div>
                                <div className="mt-1 text-[24px] font-black tabular-nums text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>{k.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Cartes par registre */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {registers.map((r) => {
                            const tot = r.breakdown.reduce((s, b) => s + b.n, 0) || 1;
                            return (
                                <button key={r.key} onClick={() => navigate(r.route)}
                                    className="text-left bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-slate-300 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: `${r.color}18`, color: r.color }}>{r.icon}</span>
                                            <div>
                                                <div className="text-[13.5px] font-semibold text-slate-800">{r.name}</div>
                                                <div className="text-[11.5px] text-slate-500">{r.total} élément{r.total > 1 ? 's' : ''} · {r.attn} à traiter</div>
                                            </div>
                                        </div>
                                        <IconArrowRight size={16} className="text-slate-400" />
                                    </div>
                                    <div className="mt-3 h-2 rounded-full overflow-hidden flex bg-slate-100">
                                        {r.breakdown.map((b) => b.n > 0 && (
                                            <div key={b.label} style={{ width: `${(b.n / tot) * 100}%`, background: b.c }} title={`${b.label}: ${b.n}`} />
                                        ))}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                                        {r.breakdown.map((b) => (
                                            <span key={b.label} className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
                                                <span className="w-2 h-2 rounded-full" style={{ background: b.c }} />{b.label} {b.n}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Graphiques + échéances */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
                        <section className="xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <header className="px-4 py-2.5 border-b border-slate-100"><h2 className="text-slate-800 text-[13.5px] font-semibold">État global</h2></header>
                            <div className="p-4" style={{ width: '100%', height: 240 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={globalDonut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2}>
                                            {globalDonut.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                                        </Pie>
                                        <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                        <section className="xl:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <header className="px-4 py-2.5 border-b border-slate-100"><h2 className="text-slate-800 text-[13.5px] font-semibold">Conforme vs à traiter — par registre</h2></header>
                            <div className="p-4" style={{ width: '100%', height: 240 }}>
                                <ResponsiveContainer>
                                    <BarChart data={registerChartData} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar dataKey="conforme" name="Conforme / en cours" fill={TEAL} radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="attention" name="À traiter" fill={ROSE} radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </div>

                    {/* Prochaines échéances */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
                        <header className="px-4 py-2.5 border-b border-slate-100"><h2 className="text-slate-800 text-[13.5px] font-semibold">Prochaines échéances réglementaires</h2></header>
                        {deadlines.length === 0 ? (
                            <div className="p-6 text-center text-[13px] text-slate-500">Aucune échéance à venir.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {deadlines.map((d, idx) => {
                                    const overdue = (d.days ?? 0) < 0;
                                    const soon = !overdue && (d.days ?? 999) <= 30;
                                    return (
                                        <div key={idx} className="px-4 py-2.5 flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[13px] text-slate-700 truncate">{d.label}</div>
                                                <div className="text-[11.5px] text-slate-400">{d.kind}{d.ref ? ` · ${d.ref}` : ''}</div>
                                            </div>
                                            <div className="text-[12px] tabular-nums text-slate-500 shrink-0">{formatDateFr(d.date)}</div>
                                            <span className={`text-[11px] font-semibold tabular-nums shrink-0 px-2 py-0.5 rounded ${overdue ? 'bg-rose-50 text-rose-600' : soon ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
                                                {overdue ? `échue ${Math.abs(d.days!)} j` : `J-${d.days}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </Tabs.Panel>

                <Tabs.Panel value="personnel" pt="xs">
                    {/* Tableau de bord existant (conformité du personnel) — inchangé. */}
                    <CompDashboard />
                </Tabs.Panel>
            </Tabs>
        </div>
    );
}
