import { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import {
    IconShieldCheck, IconStethoscope, IconShieldX, IconUsers, IconMapPin,
    IconMaximize, IconActivity, IconAlertTriangle, IconClock,
} from '@tabler/icons-react';
import {
    computeEvacuationStats, STATUS_COLOR,
    type EvacEmployee, type EvacCheckIn, type EvacAssemblyPoint, type RosterPerson,
} from './evacuationStats';

/**
 * EvacuationDashboard — Tableau de bord temps réel de l'évacuation.
 *
 * Vue analytique du centre de commande : KPI, courbe de progression (mise en
 * sécurité dans le temps), répartition des statuts, remplissage des points de
 * rassemblement et couverture par département. Alimenté par la même couche de
 * calcul que l'écran géant (evacuationStats) — chiffres strictement identiques.
 */

interface Props {
    employees: EvacEmployee[];
    checkIns: EvacCheckIn[];
    assemblyPoints: EvacAssemblyPoint[];
    triggeredAt?: string;
    isActive: boolean;
    /** Horloge qui avance (elapsedLive) pour animer la courbe en temps réel. */
    nowMs: number;
    /** Ouvre la vue plein écran détachable. */
    onDetach?: () => void;
}

function RosterPopover({ label, color, roster }: { label: string; color: string; roster: RosterPerson[] }) {
    // Popover affiché au survol : liste des employés (nom + département).
    return (
        <div className="absolute left-0 top-full mt-1.5 z-30 w-72 max-w-[90vw] opacity-0 invisible translate-y-1
                        group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                        transition-all duration-150 pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-3 py-2 flex items-center justify-between" style={{ background: `${color}12` }}>
                    <span className="text-[11.5px] font-bold" style={{ color }}>{label}</span>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">{roster.length}</span>
                </div>
                <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-50">
                    {roster.length === 0 ? (
                        <p className="px-3 py-3 text-[12px] text-slate-400 text-center">Personne dans cette catégorie</p>
                    ) : roster.map((p) => (
                        <div key={p.id} className="px-3 py-1.5 flex items-center justify-between gap-3">
                            <span className="text-[12.5px] text-slate-800 font-medium truncate">{p.name}</span>
                            <span className="text-[11px] text-slate-400 truncate flex-shrink-0 max-w-[45%]">{p.department}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Stat({ icon, label, value, sub, color, pulse, roster }: {
    icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string; pulse?: boolean;
    roster?: RosterPerson[];
}) {
    const hasRoster = Array.isArray(roster);
    return (
        <div className={`group relative bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm ${hasRoster ? 'cursor-help hover:border-slate-300 hover:shadow-md transition-all' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}1a`, color }}>
                    {icon}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={`text-[26px] leading-none font-bold tabular-nums ${pulse ? 'animate-pulse' : ''}`} style={{ color }}>
                    {value}
                </span>
                {sub && <span className="text-[12px] text-slate-500">{sub}</span>}
            </div>
            {hasRoster && <RosterPopover label={label} color={color} roster={roster!} />}
        </div>
    );
}

export default function EvacuationDashboard({
    employees, checkIns, assemblyPoints, triggeredAt, isActive, nowMs, onDetach,
}: Props) {
    const s = useMemo(
        () => computeEvacuationStats(employees, checkIns, assemblyPoints, triggeredAt, nowMs),
        [employees, checkIns, assemblyPoints, triggeredAt, nowMs],
    );

    const progressData = s.progression.map((p) => ({ ...p }));

    return (
        <div className="space-y-4">
            {/* ── Bandeau d'action ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <IconActivity size={16} className="text-slate-500" stroke={1.8} />
                    <h3 className="text-[14px] font-semibold text-slate-800">Tableau de bord de l'évacuation</h3>
                    {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> Live
                        </span>
                    )}
                </div>
                {onDetach && (
                    <button
                        type="button"
                        onClick={onDetach}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 shadow-sm"
                        title="Ouvrir sur un écran géant (salle de crise)"
                    >
                        <IconMaximize size={14} stroke={2} /> Détacher sur écran géant
                    </button>
                )}
            </div>

            {/* ── KPI ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <Stat icon={<IconShieldCheck size={15} stroke={2} />} label="Mis en sécurité" color="#059669"
                    value={s.safe} sub={`/ ${s.concerned}`} roster={s.rosterByStatus.SAFE} />
                <Stat icon={<IconStethoscope size={15} stroke={2} />} label="Blessés" color="#d97706" value={s.injured}
                    pulse={isActive && s.injured > 0} roster={s.rosterByStatus.INJURED} />
                <Stat icon={<IconShieldX size={15} stroke={2} />} label="Absents" color="#dc2626" value={s.missing}
                    pulse={isActive && s.missing > 0} roster={s.rosterByStatus.MISSING} />
                <Stat icon={<IconUsers size={15} stroke={2} />} label="Reste à pointer" color="#475569"
                    value={s.pending} pulse={isActive && s.pending > 0} roster={s.rosterByStatus.PENDING} />
                <Stat icon={<IconClock size={15} stroke={2} />} label="Taux sécurisé" color="#0f766e"
                    value={`${s.securedPct}%`} sub={`${s.accountedPct}% localisés`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ── Courbe de progression ── */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[12.5px] font-semibold text-slate-700">Progression de la mise en sécurité</h4>
                        <span className="text-[11px] text-slate-500">
                            {s.ratePerMin > 0 ? `≈ ${s.ratePerMin} / min` : '—'}
                        </span>
                    </div>
                    <div style={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                            <AreaChart data={progressData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gSafe" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                                    </linearGradient>
                                    <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#64748b" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} minTickGap={24} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} width={34} />
                                <Tooltip
                                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                                    formatter={(v: any, n: any) => [v, n === 'safe' ? 'En sécurité' : 'Localisés']}
                                    labelFormatter={(l) => `À ${l}`}
                                />
                                <Area type="monotone" dataKey="accounted" stroke="#94a3b8" strokeWidth={1.5} fill="url(#gAcc)" name="accounted" />
                                <Area type="monotone" dataKey="safe" stroke="#10b981" strokeWidth={2.2} fill="url(#gSafe)" name="safe" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Donut répartition ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h4 className="text-[12.5px] font-semibold text-slate-700 mb-2">Répartition de l'effectif</h4>
                    {s.total === 0 ? (
                        <p className="text-[12px] text-slate-400 py-10 text-center">Aucun effectif</p>
                    ) : (
                        <>
                            <div style={{ width: '100%', height: 168 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={s.donut} dataKey="value" nameKey="label" cx="50%" cy="50%"
                                            innerRadius={44} outerRadius={70} paddingAngle={2} stroke="none">
                                            {s.donut.map((d) => <Cell key={d.key} fill={d.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any, n: any) => [v, n]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-1 mt-1">
                                {s.donut.map((d) => (
                                    <div key={d.key} className="flex items-center gap-2 text-[11.5px]">
                                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                                        <span className="text-slate-600 flex-1">{d.label}</span>
                                        <span className="font-semibold text-slate-800 tabular-nums">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ── Points de rassemblement ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h4 className="text-[12.5px] font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                        <IconMapPin size={13} stroke={1.8} className="text-slate-400" /> Regroupement par point
                    </h4>
                    {s.byAssemblyPoint.length === 0 ? (
                        <p className="text-[12px] text-slate-400 py-8 text-center">Personne encore regroupé</p>
                    ) : (
                        <div style={{ width: '100%', height: Math.max(120, s.byAssemblyPoint.length * 42) }}>
                            <ResponsiveContainer>
                                <BarChart data={s.byAssemblyPoint} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10.5, fill: '#475569' }} tickLine={false} axisLine={false} width={120} />
                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => [v, 'Personnes']} cursor={{ fill: '#f1f5f9' }} />
                                    <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* ── Couverture par département ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h4 className="text-[12.5px] font-semibold text-slate-700 mb-2.5">Couverture par département</h4>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                        {s.byDepartment.map((d) => (
                            <div key={d.department}>
                                <div className="flex items-center justify-between text-[11.5px] mb-0.5">
                                    <span className="text-slate-700 font-medium truncate">{d.department}</span>
                                    <span className="text-slate-500 tabular-nums">
                                        {d.safe}/{d.concerned} sécurisés{d.pending > 0 ? ` · ${d.pending} à pointer` : ''}
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-emerald-500" style={{ width: `${d.total ? (d.safe / d.total) * 100 : 0}%` }} />
                                    <div className="h-full bg-amber-400" style={{ width: `${d.total ? (d.injured / d.total) * 100 : 0}%` }} />
                                    <div className="h-full bg-red-500" style={{ width: `${d.total ? (d.missing / d.total) * 100 : 0}%` }} />
                                    <div className="h-full bg-slate-300" style={{ width: `${d.total ? (d.notApplicable / d.total) * 100 : 0}%` }} />
                                </div>
                            </div>
                        ))}
                        {s.byDepartment.length === 0 && (
                            <p className="text-[12px] text-slate-400 py-6 text-center">Aucun département</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Personnes critiques ── */}
            {(s.criticalList.length > 0 || s.injuredList.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {s.criticalList.length > 0 && (
                        <div className="bg-red-50/60 border border-red-200 rounded-xl p-4">
                            <h4 className="text-[12.5px] font-semibold text-red-800 mb-2 flex items-center gap-1.5">
                                <IconAlertTriangle size={14} stroke={2} /> Non localisés / absents ({s.criticalList.length})
                            </h4>
                            <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto">
                                {s.criticalList.map((p) => (
                                    <span key={p.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-medium ${
                                        p.kind === 'missing' ? 'bg-red-600 text-white' : 'bg-white text-red-700 ring-1 ring-red-200'
                                    }`}>
                                        {p.name}
                                        <span className="opacity-70 text-[10px]">· {p.department}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {s.injuredList.length > 0 && (
                        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                            <h4 className="text-[12.5px] font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                                <IconStethoscope size={14} stroke={1.8} /> Blessés — assistance ({s.injuredList.length})
                            </h4>
                            <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto">
                                {s.injuredList.map((p) => (
                                    <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-medium bg-amber-500 text-white">
                                        {p.name}
                                        {p.assemblyPointName && <span className="opacity-80 text-[10px]">· {p.assemblyPointName}</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
