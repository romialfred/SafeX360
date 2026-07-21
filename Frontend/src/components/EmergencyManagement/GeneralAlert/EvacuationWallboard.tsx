import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar,
} from 'recharts';
import {
    IconShieldCheck, IconStethoscope, IconShieldX, IconUsers,
    IconAlertTriangle, IconMaximize, IconWifi, IconRefresh, IconMapPin, IconBuildingCommunity, IconActivity,
} from '@tabler/icons-react';
import {
    getAlert, getAlertCheckIns,
    type GeneralAlertDTO, type EvacuationCheckInDTO,
} from '../../../services/GeneralAlertService';
import { listAssemblyPoints, type AssemblyPointDTO } from '../../../services/EmergencyService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { formatReasonCode } from './alertHelpers';
import { computeEvacuationStats, formatClock, type EvacEmployee, type RosterPerson, type EvacStatus } from './evacuationStats';

/**
 * EvacuationWallboard — Écran géant détaché (salle de crise).
 *
 * Vue plein écran pensée pour un mur d'images : fort contraste, gros chiffres,
 * lecture à distance, aucune chrome applicative. Rafraîchissement par POLLING
 * (5 s) indépendant du WebSocket — un mur doit survivre à une coupure de socket.
 *
 * Refonte contraste + visuels (LOT 64.1) : panneaux clairs sur fond sombre,
 * titres et libellés lumineux, + jauge radiale, donut, distribution par point
 * de rassemblement et couverture par département.
 */

const POLL_MS = 5000;

function BigTile({ icon, label, value, color, pulse, roster }: {
    icon: React.ReactNode; label: string; value: number | string; color: string; pulse?: boolean;
    roster?: RosterPerson[];
}) {
    const hasRoster = Array.isArray(roster);
    return (
        <div className={`group relative rounded-2xl p-4 flex flex-col justify-between ${hasRoster ? 'cursor-help' : ''}`}
            style={{ background: `${color}22`, border: `1.5px solid ${color}66` }}>
            <div className="flex items-center gap-2" style={{ color }}>
                {icon}
                <span className="text-[14px] uppercase tracking-[0.14em] font-extrabold">{label}</span>
            </div>
            <span className={`mt-1 text-[58px] leading-none font-black tabular-nums ${pulse ? 'animate-pulse' : ''}`} style={{ color }}>
                {value}
            </span>
            {hasRoster && (
                <div className="absolute left-0 top-full mt-2 z-40 w-80 max-w-[90vw] opacity-0 invisible translate-y-1
                                group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150">
                    <div className="rounded-xl bg-slate-900 border border-white/25 shadow-2xl overflow-hidden">
                        <div className="px-3 py-2 flex items-center justify-between" style={{ background: `${color}26` }}>
                            <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
                            <span className="text-[12px] font-semibold text-slate-300 tabular-nums">{roster!.length}</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
                            {roster!.length === 0 ? (
                                <p className="px-3 py-3 text-[13px] text-slate-400 text-center">Personne dans cette catégorie</p>
                            ) : roster!.map((p) => (
                                <div key={p.id} className="px-3 py-1.5 flex items-center justify-between gap-3">
                                    <span className="text-[13.5px] text-white font-medium truncate">{p.name}</span>
                                    <span className="text-[11.5px] text-slate-400 truncate flex-shrink-0 max-w-[45%]">{p.department}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Panel({ title, icon, children, className = '' }: {
    title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={`rounded-2xl bg-slate-800/80 border border-white/20 p-4 ${className}`}>
            <div className="text-[13px] font-extrabold text-white uppercase tracking-[0.1em] mb-3 flex items-center gap-2 pl-2.5 border-l-4 border-sky-400">
                {icon}{title}
            </div>
            {children}
        </div>
    );
}

// ── Journal temps réel (volet droit, façon fil d'actualité pro) ──────────────

type FeedEvent = {
    employeeId: number;
    name: string;
    department: string;
    status: EvacStatus;
    at: string;
    assemblyPointName?: string | null;
};

const FEED_META: Record<EvacStatus, { emoji: string; verb: string; color: string; bg: string; ring: string }> = {
    SAFE:           { emoji: '🎉', verb: 'mis en sécurité',     color: '#34d399', bg: 'rgba(16,185,129,0.12)',  ring: 'rgba(16,185,129,0.45)' },
    INJURED:        { emoji: '🤕', verb: 'signalé blessé',       color: '#fbbf24', bg: 'rgba(245,158,11,0.13)',  ring: 'rgba(245,158,11,0.45)' },
    MISSING:        { emoji: '🚨', verb: 'porté absent',         color: '#f87171', bg: 'rgba(239,68,68,0.15)',   ring: 'rgba(239,68,68,0.5)'   },
    NOT_APPLICABLE: { emoji: '➖', verb: 'déclaré non concerné', color: '#cbd5e1', bg: 'rgba(148,163,184,0.10)', ring: 'rgba(148,163,184,0.35)' },
};

const fmtFeedTime = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

function ActivityFeed({ events, active }: { events: FeedEvent[]; active: boolean }) {
    const listRef = useRef<HTMLDivElement>(null);
    // Auto-défilement : la dernière mise à jour reste visible en bas (façon chat).
    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [events]);

    return (
        <>
            <style>{`@keyframes feedIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
            <div className="shrink-0 px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <IconActivity size={17} className="text-sky-300" stroke={2} />
                <div className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-white">Journal du centre de commande</div>
                {active && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />}
                <span className="ml-auto text-[12px] text-slate-400 tabular-nums">{events.length}</span>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {events.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <IconActivity size={30} className="text-slate-600 mb-2" stroke={1.5} />
                        <p className="text-[13px] text-slate-400">En attente d'actions du centre de commande…</p>
                        <p className="text-[11.5px] text-slate-500 mt-1">Chaque mise en sécurité, blessure ou absence s'affiche ici en direct.</p>
                    </div>
                ) : (
                    events.map((ev) => {
                        const m = FEED_META[ev.status] ?? FEED_META.NOT_APPLICABLE;
                        return (
                            <div key={`${ev.employeeId}:${ev.at}`}
                                className="px-3 py-2 rounded-xl border flex items-start gap-2.5"
                                style={{ background: m.bg, borderColor: m.ring, animation: 'feedIn .35s ease' }}>
                                <span className="text-[19px] leading-none mt-0.5 select-none">{m.emoji}</span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[14.5px] font-bold text-white truncate">{ev.name}</span>
                                        <span className="ml-auto text-[11px] tabular-nums text-slate-400 shrink-0">{fmtFeedTime(ev.at)}</span>
                                    </div>
                                    <div className="text-[12.5px] font-bold" style={{ color: m.color }}>{m.verb}</div>
                                    <div className="text-[11.5px] text-slate-400 truncate">
                                        {ev.department}{ev.assemblyPointName ? ` · ${ev.assemblyPointName}` : ''}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
}

export default function EvacuationWallboard() {
    const { id } = useParams<{ id: string }>();
    const [alert, setAlert] = useState<GeneralAlertDTO | null>(null);
    const [checkIns, setCheckIns] = useState<EvacuationCheckInDTO[]>([]);
    const [employees, setEmployees] = useState<EvacEmployee[]>([]);
    const [assemblyPoints, setAssemblyPoints] = useState<AssemblyPointDTO[]>([]);
    const [nowMs, setNowMs] = useState<number>(() => 0); // hydraté au 1er tick
    const [lastSync, setLastSync] = useState<number>(0);
    const [syncing, setSyncing] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const iv = setInterval(() => setNowMs(Date.now()), 1000);
        setNowMs(Date.now());
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        if (!id) return;
        getAlert(Number(id)).then(setAlert).catch(() => setAlert(null));
        getEmployeesWithDepartment()
            .then((res: any[]) => setEmployees(Array.isArray(res) ? res.map((e) => ({
                id: e.id,
                name: e.name || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
                department: e.department,
                position: e.position,
            })) : []))
            .catch(() => setEmployees([]));
    }, [id]);

    useEffect(() => {
        if (!alert?.companyId) return;
        listAssemblyPoints(alert.companyId).then(setAssemblyPoints).catch(() => setAssemblyPoints([]));
    }, [alert?.companyId]);

    useEffect(() => {
        if (!id) return;
        let alive = true;
        const tick = async () => {
            setSyncing(true);
            try {
                const [ci, al] = await Promise.all([
                    getAlertCheckIns(Number(id)).catch(() => null),
                    getAlert(Number(id)).catch(() => null),
                ]);
                if (!alive) return;
                if (ci) setCheckIns(ci);
                if (al) setAlert(al);
                setLastSync(Date.now());
            } finally {
                if (alive) setSyncing(false);
            }
        };
        tick();
        const iv = setInterval(tick, POLL_MS);
        return () => { alive = false; clearInterval(iv); };
    }, [id]);

    const isActive = alert?.status === 'ACTIVE';
    // La durée doit se FIGER à la clôture : dès que l'alerte n'est plus active,
    // on gèle « maintenant » sur endedAt — sinon le chrono continue de courir.
    const endedAtMs = alert?.endedAt ? new Date(alert.endedAt).getTime() : null;
    const effectiveNowMs = !isActive && endedAtMs && !Number.isNaN(endedAtMs)
        ? endedAtMs
        : (nowMs || undefined);

    const s = useMemo(
        () => computeEvacuationStats(employees, checkIns, assemblyPoints, alert?.triggeredAt, effectiveNowMs),
        [employees, checkIns, assemblyPoints, alert?.triggeredAt, effectiveNowMs],
    );

    // Journal temps réel : un événement par pointage horodaté (plus ancien → plus récent).
    const feedEvents = useMemo<FeedEvent[]>(() => {
        const empMap = new Map(employees.map((e) => [e.id, e]));
        return checkIns
            .filter((c) => c.checkedAt)
            .map((c) => {
                const emp = empMap.get(c.employeeId);
                return {
                    employeeId: c.employeeId,
                    name: c.employeeName || emp?.name || `Employé #${c.employeeId}`,
                    department: (c.employeeDepartment || emp?.department || 'Sans département').trim(),
                    status: c.status as EvacStatus,
                    at: c.checkedAt as string,
                    assemblyPointName: c.assemblyPointName ?? null,
                };
            })
            .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    }, [checkIns, employees]);
    const isDrill = Boolean(alert?.drillMode);
    const clock = nowMs ? new Date(nowMs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

    const goFullscreen = () => {
        const el = rootRef.current;
        if (!el) return;
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else el.requestFullscreen?.().catch(() => {});
    };

    const progressData = s.progression.map((p) => ({ ...p }));
    const gaugeColor = s.securedPct >= 100 ? '#10b981' : s.securedPct >= 60 ? '#38bdf8' : '#f59e0b';
    const topPoints = s.byAssemblyPoint.slice(0, 6);
    const worstDepts = s.byDepartment.slice(0, 6); // les moins avancés (déjà triés)

    return (
        <div ref={rootRef} className="h-screen w-full text-white flex flex-col overflow-hidden"
            style={{ background: 'linear-gradient(180deg,#111a2e 0%,#0d1424 60%,#0a0f1c 100%)' }}>
            {/* ── En-tête ── */}
            <header className="shrink-0 flex items-center justify-between gap-4 px-8 pt-5 pb-4 flex-wrap border-b border-white/10">
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-red-600' : 'bg-emerald-600'}`}>
                        {isActive ? <IconAlertTriangle size={30} stroke={2} className="animate-pulse" /> : <IconShieldCheck size={30} stroke={2} />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="text-[30px] leading-none font-black tracking-tight" style={{ color: '#ffffff', fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                Salle de Crise
                            </div>
                            {isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-[12px] font-bold uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Alerte en cours
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-[12px] font-bold uppercase tracking-wider">Terminée</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-md text-[12px] font-extrabold ${isDrill ? 'bg-sky-500/40 text-sky-100' : 'bg-red-500/40 text-red-100'}`}>
                                {isDrill ? 'EXERCICE' : 'RÉEL'}
                            </span>
                        </div>
                        <p className="text-[15px] mt-1 text-slate-200 truncate">
                            <span className="uppercase tracking-[0.16em] text-[11px] font-bold text-sky-300 mr-2">Évacuation</span>
                            {alert ? formatReasonCode(alert.reasonCode) : 'Chargement…'}
                            {alert?.message ? <span className="text-slate-300"> — {alert.message}</span> : null}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                        <p className="text-[12px] uppercase tracking-widest text-slate-300 font-semibold">Durée</p>
                        <p className="text-[42px] leading-none font-mono font-bold tabular-nums text-white">{formatClock(s.elapsedSec)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[12px] uppercase tracking-widest text-slate-300 font-semibold">Heure</p>
                        <p className="text-[26px] leading-none font-mono tabular-nums text-slate-100 mt-1.5">{clock}</p>
                    </div>
                    <button type="button" onClick={goFullscreen} title="Plein écran"
                        className="w-12 h-12 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center border border-white/20">
                        <IconMaximize size={22} stroke={1.8} />
                    </button>
                </div>
            </header>

            <div className="flex-1 min-h-0 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden">
                <main className="flex-1 min-w-0 min-h-0 px-8 py-6 space-y-6 xl:overflow-y-auto">
                {/* ═══ Rangée 1 : Hero + Jauge + Progression ═══ */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Non localisés — LE chiffre */}
                    <div className={`col-span-12 lg:col-span-4 rounded-3xl p-7 flex flex-col justify-center ${s.unaccounted > 0 ? 'bg-red-600/20 border-2 border-red-500/50' : 'bg-emerald-600/20 border-2 border-emerald-500/50'}`}>
                        <p className="text-[17px] uppercase tracking-[0.18em] font-extrabold text-white">Personnes non localisées</p>
                        <div className="flex items-end gap-4 mt-1">
                            <span className={`text-[128px] leading-none font-black tabular-nums ${s.unaccounted > 0 ? 'text-red-300 animate-pulse' : 'text-emerald-300'}`}>
                                {s.unaccounted}
                            </span>
                            <span className="mb-5 text-[19px] font-semibold text-slate-200">
                                {s.unaccounted > 0 ? 'à retrouver' : 'effectif localisé'}
                            </span>
                        </div>
                        <div className="mt-3 h-4 rounded-full bg-white/15 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${s.accountedPct}%`, background: s.unaccounted > 0 ? '#f59e0b' : '#10b981' }} />
                        </div>
                        <p className="mt-2 text-[15px] font-semibold text-slate-100">
                            {s.accounted}/{s.total} localisés · {s.securedPct}% mis en sécurité
                        </p>
                    </div>

                    {/* Jauge radiale — taux de mise en sécurité */}
                    <div className="col-span-12 lg:col-span-3 rounded-3xl bg-slate-800/70 border border-white/15 p-5 flex flex-col">
                        <div className="text-[13px] font-extrabold text-white uppercase tracking-[0.1em] mb-1 pl-2.5 border-l-4 border-sky-400">Taux de mise en sécurité</div>
                        <div className="relative flex-1 min-h-[190px]">
                            <ResponsiveContainer>
                                <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: s.securedPct }]} startAngle={90} endAngle={-270}>
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar background={{ fill: '#334155' }} dataKey="value" cornerRadius={30} fill={gaugeColor} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[52px] leading-none font-black tabular-nums" style={{ color: gaugeColor }}>{s.securedPct}%</span>
                                <span className="text-[13px] text-slate-300 mt-1">{s.safe}/{s.concerned} concernés</span>
                            </div>
                        </div>
                    </div>

                    {/* Progression temporelle */}
                    <div className="col-span-12 lg:col-span-5 rounded-3xl bg-slate-800/70 border border-white/15 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-[13px] font-extrabold text-white uppercase tracking-[0.1em] pl-2.5 border-l-4 border-sky-400">Progression de la mise en sécurité</div>
                            <span className="text-[13px] text-slate-300">{s.ratePerMin > 0 ? `≈ ${s.ratePerMin}/min` : ''}</span>
                        </div>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <AreaChart data={progressData} margin={{ top: 5, right: 10, left: -14, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="wSafe" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
                                        </linearGradient>
                                        <linearGradient id="wAcc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#cbd5e1' }} tickLine={false} axisLine={{ stroke: '#475569' }} minTickGap={34} />
                                    <YAxis tick={{ fontSize: 12, fill: '#cbd5e1' }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                                    <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
                                        formatter={(v: any, n: any) => [v, n === 'safe' ? 'En sécurité' : 'Localisés']} labelFormatter={(l) => `À ${l}`} />
                                    <Area type="monotone" dataKey="accounted" stroke="#38bdf8" strokeWidth={2} fill="url(#wAcc)" name="accounted" />
                                    <Area type="monotone" dataKey="safe" stroke="#34d399" strokeWidth={3} fill="url(#wSafe)" name="safe" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center gap-5 mt-1 text-[13px]">
                            <span className="inline-flex items-center gap-1.5 text-slate-200"><span className="w-3 h-1.5 rounded-full bg-emerald-400" /> En sécurité</span>
                            <span className="inline-flex items-center gap-1.5 text-slate-200"><span className="w-3 h-1.5 rounded-full bg-sky-400" /> Localisés</span>
                        </div>
                    </div>
                </div>

                {/* ═══ Rangée 2 : 4 tuiles ═══ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <BigTile icon={<IconShieldCheck size={22} stroke={2} />} label="En sécurité" color="#34d399" value={s.safe} roster={s.rosterByStatus.SAFE} />
                    <BigTile icon={<IconStethoscope size={22} stroke={2} />} label="Blessés" color="#fbbf24" value={s.injured} pulse={isActive && s.injured > 0} roster={s.rosterByStatus.INJURED} />
                    <BigTile icon={<IconShieldX size={22} stroke={2} />} label="Absents" color="#f87171" value={s.missing} pulse={isActive && s.missing > 0} roster={s.rosterByStatus.MISSING} />
                    <BigTile icon={<IconUsers size={22} stroke={2} />} label="Reste à pointer" color="#cbd5e1" value={s.pending} roster={s.rosterByStatus.PENDING} />
                </div>

                {/* ═══ Rangée 3 : Donut + Points + Départements ═══ */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Donut répartition */}
                    <Panel title="Répartition de l'effectif" className="col-span-12 lg:col-span-3">
                        {s.total === 0 ? <p className="text-slate-400 py-10 text-center">Aucun effectif</p> : (
                            <>
                                <div style={{ width: '100%', height: 150 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={s.donut} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={2} stroke="none">
                                                {s.donut.map((d) => <Cell key={d.key} fill={d.color} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-1.5 mt-1">
                                    {s.donut.map((d) => (
                                        <div key={d.key} className="flex items-center gap-2 text-[14px]">
                                            <span className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                                            <span className="text-slate-200 flex-1">{d.label}</span>
                                            <span className="font-bold text-white tabular-nums">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Panel>

                    {/* Points de rassemblement */}
                    <Panel title="Regroupement par point" icon={<IconMapPin size={16} className="text-sky-300" stroke={1.8} />} className="col-span-12 lg:col-span-4">
                        {topPoints.length === 0 ? <p className="text-slate-400 py-8 text-center">Personne encore regroupé</p> : (
                            <div style={{ width: '100%', height: Math.max(140, topPoints.length * 40) }}>
                                <ResponsiveContainer>
                                    <BarChart data={topPoints} layout="vertical" margin={{ top: 0, right: 22, left: 4, bottom: 0 }}>
                                        <XAxis type="number" tick={{ fontSize: 12, fill: '#cbd5e1' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12.5, fill: '#e2e8f0' }} tickLine={false} axisLine={false} width={130} />
                                        <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }} formatter={(v: any) => [v, 'Personnes']} cursor={{ fill: '#ffffff10' }} />
                                        <Bar dataKey="count" fill="#38bdf8" radius={[0, 5, 5, 0]} barSize={18} label={{ position: 'right', fill: '#e2e8f0', fontSize: 12 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Panel>

                    {/* Couverture par département */}
                    <Panel title="Départements à surveiller" icon={<IconBuildingCommunity size={16} className="text-amber-300" stroke={1.8} />} className="col-span-12 lg:col-span-5">
                        <div className="space-y-2.5">
                            {worstDepts.map((d) => (
                                <div key={d.department}>
                                    <div className="flex items-center justify-between text-[13.5px] mb-1">
                                        <span className="text-white font-semibold truncate">{d.department}</span>
                                        <span className="text-slate-300 tabular-nums font-medium">
                                            {d.safe}/{d.concerned} sécurisés{d.pending > 0 ? ` · ${d.pending} à pointer` : ''}
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-emerald-400" style={{ width: `${d.total ? (d.safe / d.total) * 100 : 0}%` }} />
                                        <div className="h-full bg-amber-400" style={{ width: `${d.total ? (d.injured / d.total) * 100 : 0}%` }} />
                                        <div className="h-full bg-red-400" style={{ width: `${d.total ? (d.missing / d.total) * 100 : 0}%` }} />
                                        <div className="h-full bg-slate-400" style={{ width: `${d.total ? (d.notApplicable / d.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            ))}
                            {worstDepts.length === 0 && <p className="text-slate-400 py-6 text-center">Aucun département</p>}
                        </div>
                    </Panel>
                </div>

                {/* ═══ Rangée 4 : Non localisés (noms) ═══ */}
                <Panel
                    title={`À localiser en priorité (${s.criticalList.length})`}
                    icon={<IconAlertTriangle size={18} className="text-red-400" stroke={2} />}
                >
                    {s.criticalList.length === 0 ? (
                        <p className="text-emerald-300 text-[16px] font-semibold flex items-center gap-2">
                            <IconShieldCheck size={20} /> Tout l'effectif concerné est localisé.
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto">
                            {s.criticalList.map((p) => (
                                <span key={p.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[15px] font-semibold ${
                                    p.kind === 'missing' ? 'bg-red-600 text-white' : 'bg-white/12 text-white ring-1 ring-white/20'
                                }`}>
                                    {p.name}
                                    <span className="opacity-70 text-[12.5px] font-normal">{p.department}</span>
                                </span>
                            ))}
                        </div>
                    )}
                </Panel>

                {/* Blessés (si présents) */}
                {s.injuredList.length > 0 && (
                    <Panel title={`Blessés — assistance requise (${s.injuredList.length})`} icon={<IconStethoscope size={18} className="text-amber-300" stroke={1.8} />}>
                        <div className="flex flex-wrap gap-2">
                            {s.injuredList.map((p) => (
                                <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[15px] font-semibold bg-amber-500 text-white">
                                    {p.name}
                                    {p.assemblyPointName && <span className="opacity-80 text-[12.5px] font-normal">· {p.assemblyPointName}</span>}
                                </span>
                            ))}
                        </div>
                    </Panel>
                )}
                </main>

                {/* ── Volet droit : journal temps réel du centre de commande ── */}
                <aside className="w-full xl:w-[380px] shrink-0 flex flex-col min-h-0 border-t xl:border-t-0 xl:border-l border-white/10 bg-slate-900/40 max-xl:h-[42vh]">
                    <ActivityFeed events={feedEvents} active={isActive} />
                </aside>
            </div>

            {/* ── Pied ── */}
            <footer className="shrink-0 px-8 py-3 flex items-center justify-between text-[12.5px] text-slate-400 border-t border-white/10">
                <span className="inline-flex items-center gap-1.5">
                    <IconWifi size={14} className={syncing ? 'text-sky-300' : 'text-slate-400'} />
                    Actualisation automatique toutes les {POLL_MS / 1000}s
                    {syncing && <IconRefresh size={13} className="animate-spin text-sky-300" />}
                </span>
                <span>
                    {lastSync ? `Dernière synchro : ${new Date(lastSync).toLocaleTimeString('fr-FR')}` : 'Connexion…'} · SafeX 360
                </span>
            </footer>
        </div>
    );
}
