import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    IconShieldCheck, IconStethoscope, IconShieldX, IconUsers,
    IconAlertTriangle, IconMaximize, IconWifi, IconRefresh,
} from '@tabler/icons-react';
import {
    getAlert, getAlertCheckIns,
    type GeneralAlertDTO, type EvacuationCheckInDTO,
} from '../../../services/GeneralAlertService';
import { listAssemblyPoints, type AssemblyPointDTO } from '../../../services/EmergencyService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { formatReasonCode } from './alertHelpers';
import { computeEvacuationStats, formatClock, type EvacEmployee } from './evacuationStats';

/**
 * EvacuationWallboard — Écran géant détaché (salle de crise).
 *
 * Vue plein écran, fond sombre, gros chiffres lisibles à distance, sans aucune
 * chrome applicative (ni sidebar, ni popup employé). Conçue pour être ouverte
 * dans un onglet dédié puis passée en plein écran sur un mur d'images.
 *
 * Rafraîchissement par POLLING (5 s) — volontairement indépendant du WebSocket :
 * un écran mural doit survivre à une coupure de socket sans intervention. Une
 * horloge locale fait avancer le chrono chaque seconde.
 *
 * Le chiffre central est « NON LOCALISÉS » : celui qui doit tomber à zéro.
 */

const POLL_MS = 5000;

function BigTile({ icon, label, value, color, pulse }: {
    icon: React.ReactNode; label: string; value: number | string; color: string; pulse?: boolean;
}) {
    return (
        <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: `${color}14`, border: `1px solid ${color}33` }}>
            <div className="flex items-center gap-2" style={{ color }}>
                {icon}
                <span className="text-[13px] uppercase tracking-[0.15em] font-bold opacity-90">{label}</span>
            </div>
            <span className={`mt-2 text-[64px] leading-none font-black tabular-nums ${pulse ? 'animate-pulse' : ''}`} style={{ color }}>
                {value}
            </span>
        </div>
    );
}

export default function EvacuationWallboard() {
    const { id } = useParams<{ id: string }>();
    const [alert, setAlert] = useState<GeneralAlertDTO | null>(null);
    const [checkIns, setCheckIns] = useState<EvacuationCheckInDTO[]>([]);
    const [employees, setEmployees] = useState<EvacEmployee[]>([]);
    const [assemblyPoints, setAssemblyPoints] = useState<AssemblyPointDTO[]>([]);
    const [nowMs, setNowMs] = useState<number>(() => 0); // 0 → hydraté au 1er tick (Date interdit au top-level)
    const [lastSync, setLastSync] = useState<number>(0);
    const [syncing, setSyncing] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    // Horloge locale (chrono + courbe qui "vit").
    useEffect(() => {
        const iv = setInterval(() => setNowMs(Date.now()), 1000);
        setNowMs(Date.now());
        return () => clearInterval(iv);
    }, []);

    // Chargement initial (alerte + effectif).
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

    // Points de rassemblement (une fois la mine connue).
    useEffect(() => {
        if (!alert?.companyId) return;
        listAssemblyPoints(alert.companyId).then(setAssemblyPoints).catch(() => setAssemblyPoints([]));
    }, [alert?.companyId]);

    // Polling des pointages + statut de l'alerte.
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

    const s = useMemo(
        () => computeEvacuationStats(employees, checkIns, assemblyPoints, alert?.triggeredAt, nowMs || undefined),
        [employees, checkIns, assemblyPoints, alert?.triggeredAt, nowMs],
    );

    const isActive = alert?.status === 'ACTIVE';
    const isDrill = Boolean(alert?.drillMode);
    const clock = nowMs ? new Date(nowMs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

    const goFullscreen = () => {
        const el = rootRef.current;
        if (!el) return;
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else el.requestFullscreen?.().catch(() => {});
    };

    const progressData = s.progression.map((p) => ({ ...p }));

    return (
        <div ref={rootRef} className="min-h-screen w-full text-white overflow-x-hidden"
            style={{ background: 'radial-gradient(1200px 600px at 50% -10%, #1e293b 0%, #0b1220 55%, #060a12 100%)' }}>
            {/* ── En-tête ── */}
            <header className="flex items-center justify-between gap-4 px-8 pt-6 pb-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isActive ? 'bg-red-600' : 'bg-emerald-600'}`}>
                        {isActive ? <IconAlertTriangle size={30} stroke={2} className="animate-pulse" /> : <IconShieldCheck size={30} stroke={2} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <p className="text-[13px] uppercase tracking-[0.25em] font-bold text-slate-300">
                                Centre de commande — Évacuation
                            </p>
                            {isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-[11px] font-bold uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Alerte en cours
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-[11px] font-bold uppercase tracking-wider">Terminée</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${isDrill ? 'bg-sky-500/25 text-sky-200' : 'bg-red-500/25 text-red-200'}`}>
                                {isDrill ? 'EXERCICE' : 'RÉEL'}
                            </span>
                        </div>
                        <h1 className="text-[26px] font-bold mt-1" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                            {alert ? formatReasonCode(alert.reasonCode) : 'Chargement…'}
                            {alert?.message ? <span className="text-slate-300 font-normal text-[18px]"> — {alert.message}</span> : null}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[11px] uppercase tracking-widest text-slate-400">Durée</p>
                        <p className="text-[40px] leading-none font-mono font-bold tabular-nums">{formatClock(s.elapsedSec)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] uppercase tracking-widest text-slate-400">Heure</p>
                        <p className="text-[24px] leading-none font-mono tabular-nums text-slate-200 mt-1.5">{clock}</p>
                    </div>
                    <button type="button" onClick={goFullscreen} title="Plein écran"
                        className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center">
                        <IconMaximize size={20} stroke={1.8} />
                    </button>
                </div>
            </header>

            <div className="px-8 pb-8 grid grid-cols-12 gap-5">
                {/* ── Colonne gauche : chiffres héros ── */}
                <div className="col-span-12 xl:col-span-5 space-y-5">
                    {/* Non localisés — LE chiffre */}
                    <div className={`rounded-3xl p-7 ${s.unaccounted > 0 ? 'bg-red-600/15 border border-red-500/40' : 'bg-emerald-600/15 border border-emerald-500/40'}`}>
                        <p className="text-[15px] uppercase tracking-[0.2em] font-bold text-slate-300">Personnes non localisées</p>
                        <div className="flex items-end gap-4 mt-1">
                            <span className={`text-[120px] leading-none font-black tabular-nums ${s.unaccounted > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                                {s.unaccounted}
                            </span>
                            <span className="mb-4 text-[18px] text-slate-300">
                                {s.unaccounted > 0 ? 'à retrouver' : 'effectif localisé'}
                            </span>
                        </div>
                        {/* Barre de progression localisation */}
                        <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${s.accountedPct}%`, background: s.unaccounted > 0 ? '#f59e0b' : '#10b981' }} />
                        </div>
                        <p className="mt-1.5 text-[13px] text-slate-300">
                            {s.accounted}/{s.total} localisés · {s.securedPct}% mis en sécurité
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <BigTile icon={<IconShieldCheck size={20} stroke={2} />} label="En sécurité" color="#10b981" value={s.safe} />
                        <BigTile icon={<IconStethoscope size={20} stroke={2} />} label="Blessés" color="#f59e0b" value={s.injured} pulse={isActive && s.injured > 0} />
                        <BigTile icon={<IconShieldX size={20} stroke={2} />} label="Absents" color="#ef4444" value={s.missing} pulse={isActive && s.missing > 0} />
                        <BigTile icon={<IconUsers size={20} stroke={2} />} label="Reste à pointer" color="#94a3b8" value={s.pending} />
                    </div>
                </div>

                {/* ── Colonne droite : courbe + critiques ── */}
                <div className="col-span-12 xl:col-span-7 space-y-5">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <h3 className="text-[14px] font-semibold text-slate-200 mb-3">Progression de la mise en sécurité</h3>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                                <AreaChart data={progressData} margin={{ top: 5, right: 10, left: -16, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="wSafe" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.55} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
                                        </linearGradient>
                                        <linearGradient id="wAcc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} minTickGap={30} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }}
                                        formatter={(v: any, n: any) => [v, n === 'safe' ? 'En sécurité' : 'Localisés']} labelFormatter={(l) => `À ${l}`} />
                                    <Area type="monotone" dataKey="accounted" stroke="#38bdf8" strokeWidth={1.6} fill="url(#wAcc)" name="accounted" />
                                    <Area type="monotone" dataKey="safe" stroke="#10b981" strokeWidth={2.6} fill="url(#wSafe)" name="safe" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Non localisés / absents — noms en gros */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <h3 className="text-[14px] font-semibold text-slate-200 mb-3 flex items-center gap-2">
                            <IconAlertTriangle size={16} className="text-red-400" stroke={2} />
                            À localiser en priorité ({s.criticalList.length})
                        </h3>
                        {s.criticalList.length === 0 ? (
                            <p className="text-emerald-400 text-[15px] font-semibold flex items-center gap-2">
                                <IconShieldCheck size={18} /> Tout l'effectif concerné est localisé.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2 max-h-[190px] overflow-y-auto">
                                {s.criticalList.map((p) => (
                                    <span key={p.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[15px] font-semibold ${
                                        p.kind === 'missing' ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-100 ring-1 ring-white/15'
                                    }`}>
                                        {p.name}
                                        <span className="opacity-60 text-[12px] font-normal">{p.department}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Pied : sync ── */}
            <footer className="px-8 py-3 flex items-center justify-between text-[11.5px] text-slate-500 border-t border-white/5">
                <span className="inline-flex items-center gap-1.5">
                    <IconWifi size={13} className={syncing ? 'text-sky-400' : 'text-slate-500'} />
                    Actualisation automatique toutes les {POLL_MS / 1000}s
                    {syncing && <IconRefresh size={12} className="animate-spin text-sky-400" />}
                </span>
                <span>
                    {lastSync ? `Dernière synchro : ${new Date(lastSync).toLocaleTimeString('fr-FR')}` : 'Connexion…'}
                    {' · '}SafeX 360
                </span>
            </footer>
        </div>
    );
}
