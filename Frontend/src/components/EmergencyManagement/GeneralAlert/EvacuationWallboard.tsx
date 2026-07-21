import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar,
} from 'recharts';
import {
    IconShieldCheck, IconStethoscope, IconShieldX, IconUsers,
    IconAlertTriangle, IconMaximize, IconWifi, IconRefresh, IconMapPin, IconBuildingCommunity, IconActivity,
    IconLayoutDashboard, IconStar, IconMessage, IconSend, IconX,
} from '@tabler/icons-react';
import {
    getAlert, getAlertCheckIns,
    listAlertMessages, postAlertMessage,
    type GeneralAlertDTO, type EvacuationCheckInDTO, type AlertMessageDTO, type AlertMessageSender,
} from '../../../services/GeneralAlertService';
import { listAssemblyPoints, listRescueTeams, type AssemblyPointDTO, type RescueTeamDTO } from '../../../services/EmergencyService';
import {
    listEmployeeEvacuation,
    type EmployeeEvacuationDTO, type EvacPriorityLevel,
} from '../../../services/EmployeeEvacuationService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { useAppSelector } from '../../../slices/hooks';
import { formatReasonCode } from './alertHelpers';
import {
    computeEvacuationStats, formatClock, STATUS_COLOR, STATUS_LABEL,
    type EvacEmployee, type RosterPerson, type EvacStatus,
} from './evacuationStats';

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

const WALL_TABS = [
    { id: 'general' as const, label: 'Vue Générale', icon: <IconLayoutDashboard size={16} stroke={1.9} /> },
    { id: 'vip' as const, label: 'Évacuation VIP', icon: <IconStar size={16} stroke={1.9} /> },
    { id: 'liaison' as const, label: 'Liaison Équipe Secours', icon: <IconMessage size={16} stroke={1.9} /> },
];
type WallTab = (typeof WALL_TABS)[number]['id'];

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
            <span className={`mt-1 text-[clamp(2rem,5.5vh,3.6rem)] leading-none font-black tabular-nums ${pulse ? 'animate-pulse' : ''}`} style={{ color }}>
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

// ── Onglet « Évacuation VIP » (personnel prioritaire P1..P3) ─────────────────

const LEVEL_META: Record<EvacPriorityLevel, { c: string; label: string }> = {
    P1: { c: '#f87171', label: 'Priorité 1' },
    P2: { c: '#fbbf24', label: 'Priorité 2' },
    P3: { c: '#38bdf8', label: 'Priorité 3' },
};

function VipMetric({ label, value, sub, color, big }: {
    label: string; value: number | string; sub?: string; color: string; big?: boolean;
}) {
    return (
        <div className="rounded-2xl p-4 flex flex-col justify-between" style={{ background: `${color}18`, border: `1.5px solid ${color}55` }}>
            <span className="text-[12px] uppercase tracking-[0.12em] font-extrabold" style={{ color }}>{label}</span>
            <span className={`${big ? 'text-[clamp(1.8rem,4.5vh,2.9rem)]' : 'text-[clamp(1.5rem,3.4vh,2.2rem)]'} leading-none font-black tabular-nums mt-1`} style={{ color }}>{value}</span>
            {sub && <span className="text-[12px] text-slate-300 mt-1">{sub}</span>}
        </div>
    );
}

interface VipRowData {
    employeeId: number;
    level: EvacPriorityLevel;
    name: string;
    department: string;
    positionName?: string | null;
    director: boolean;
    status: EvacStatus | 'PENDING';
    at?: string;
    assignedPoint?: string | null;
}

function VipRow({ r }: { r: VipRowData }) {
    const color = STATUS_COLOR[r.status];
    return (
        <div className="rounded-xl border p-3 flex flex-col gap-2" style={{ borderColor: `${color}55`, background: `${color}12` }}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-white font-bold text-[14.5px] truncate">{r.name}</div>
                    <div className="text-slate-300 text-[11.5px] truncate">{r.positionName || r.department}</div>
                </div>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: `${LEVEL_META[r.level].c}33`, color: LEVEL_META[r.level].c }}>{r.level}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}26`, color }}>
                    {STATUS_LABEL[r.status]}
                </span>
                {r.at && <span className="text-[10.5px] text-slate-400">{new Date(r.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                {r.assignedPoint && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-400 truncate max-w-[55%]">
                        <IconMapPin size={11} stroke={1.8} /> {r.assignedPoint}
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Onglet VIP — LECTURE SEULE. La priorité vient du SIRH (fiche employé →
 * Personnel & Évacuation) : tout Directeur est P1 automatiquement. La salle de
 * crise ne désigne pas les VIP, elle surveille leur mise en sécurité en croisant
 * la priorité effective (HRMS) avec les pointages temps réel.
 */
function VipView({ companyId, checkIns, assemblyPoints }: {
    companyId?: number; checkIns: EvacuationCheckInDTO[]; assemblyPoints: AssemblyPointDTO[];
}) {
    const [profiles, setProfiles] = useState<EmployeeEvacuationDTO[]>([]);

    const refetch = useCallback(() => {
        if (!companyId) return;
        listEmployeeEvacuation(companyId).then(setProfiles).catch(() => setProfiles([]));
    }, [companyId]);
    useEffect(() => { refetch(); const iv = setInterval(refetch, 10000); return () => clearInterval(iv); }, [refetch]);

    const ciMap = useMemo(() => {
        const m = new Map<number, EvacuationCheckInDTO>();
        checkIns.forEach((c) => m.set(c.employeeId, c));
        return m;
    }, [checkIns]);
    const apMap = useMemo(() => {
        const m = new Map<number, string>();
        assemblyPoints.forEach((a) => { if (a.id != null) m.set(a.id, a.name); });
        return m;
    }, [assemblyPoints]);

    const rows = useMemo<VipRowData[]>(() => profiles
        .filter((p) => !!p.effectivePriority)
        .map((p) => {
            const ci = ciMap.get(p.employeeId);
            return {
                employeeId: p.employeeId,
                level: p.effectivePriority as EvacPriorityLevel,
                name: p.employeeName || `Employé #${p.employeeId}`,
                department: p.department?.trim() || 'Sans département',
                positionName: p.positionName,
                director: p.director,
                status: (ci?.status ?? 'PENDING') as EvacStatus | 'PENDING',
                at: ci?.checkedAt,
                assignedPoint: p.assemblyPointId != null ? (apMap.get(p.assemblyPointId) ?? null) : null,
            };
        }), [profiles, ciMap, apMap]);

    const byLevel = (lv: EvacPriorityLevel) => rows.filter((r) => r.level === lv);
    const p1 = byLevel('P1'), p2 = byLevel('P2'), p3 = byLevel('P3');
    const cnt = (list: VipRowData[], st: string) => list.filter((r) => r.status === st).length;
    const p1safe = cnt(p1, 'SAFE'), p1inj = cnt(p1, 'INJURED'), p1miss = cnt(p1, 'MISSING'), p1pend = cnt(p1, 'PENDING');
    const p1concerned = p1.filter((r) => r.status !== 'NOT_APPLICABLE').length;
    const p1pct = p1concerned ? Math.round((p1safe / p1concerned) * 100) : 0;

    return (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6 space-y-4 lg:space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <div className="text-[clamp(1.15rem,2.4vh,1.5rem)] font-black text-white" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                        Personnel prioritaire à évacuer
                    </div>
                    <p className="text-[13px] text-slate-300 mt-0.5">Suivi rapproché des personnalités (P1) et du personnel sensible pendant l'évacuation.</p>
                </div>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold bg-white/8 text-slate-300 border border-white/15">
                    <IconStar size={14} stroke={1.8} className="text-amber-300" /> Défini dans le SIRH · Directeurs = P1 automatique
                </span>
            </div>

            {!companyId ? (
                <p className="text-slate-400 py-10 text-center">Mine indéterminée.</p>
            ) : rows.length === 0 ? (
                <div className="rounded-2xl bg-slate-800/60 border border-white/15 p-10 text-center">
                    <IconStar size={34} className="text-slate-500 mx-auto mb-2" stroke={1.5} />
                    <p className="text-[15px] text-white font-semibold">Aucune personne prioritaire définie</p>
                    <p className="text-[12.5px] text-slate-400 mt-1">La priorité d'évacuation se définit dans le SIRH : fiche employé → « Personnel &amp; Évacuation ». Tout Directeur est automatiquement P1.</p>
                </div>
            ) : (
                <>
                    {/* Tableau de bord P1 */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <VipMetric big label="P1 sécurisés" value={`${p1pct}%`} sub={`${p1safe}/${p1concerned} concernés`} color={p1miss > 0 ? '#f87171' : p1pct >= 100 ? '#34d399' : '#fbbf24'} />
                        <VipMetric label="Sécurisés" value={p1safe} color="#34d399" />
                        <VipMetric label="Blessés" value={p1inj} color="#fbbf24" />
                        <VipMetric label="Absents" value={p1miss} color="#f87171" />
                        <VipMetric label="Reste à pointer" value={p1pend} color="#cbd5e1" />
                    </div>

                    {/* Roster P1 */}
                    {p1.length > 0 && (
                        <div>
                            <div className="text-[13px] font-extrabold text-white uppercase tracking-[0.1em] mb-2 pl-2.5 border-l-4 border-red-400 flex items-center gap-2">
                                <IconStar size={15} className="text-red-300" /> Priorité 1 — VIP ({p1.length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {p1.map((r) => <VipRow key={r.employeeId} r={r} />)}
                            </div>
                        </div>
                    )}

                    {/* P2 / P3 */}
                    {[{ lv: 'P2' as const, list: p2 }, { lv: 'P3' as const, list: p3 }].filter((g) => g.list.length > 0).map((g) => (
                        <div key={g.lv}>
                            <div className="text-[13px] font-extrabold text-white uppercase tracking-[0.1em] mb-2 pl-2.5 border-l-4 flex items-center gap-2"
                                style={{ borderColor: LEVEL_META[g.lv].c }}>
                                {LEVEL_META[g.lv].label} ({g.list.length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {g.list.map((r) => <VipRow key={r.employeeId} r={r} />)}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

// ── Onglet « Liaison Équipe Secours » (messagerie salle de crise ↔ terrain) ──

const BUBBLE_META: Record<AlertMessageSender, { align: string; bg: string; ring: string; name: string }> = {
    CONTROL_ROOM: { align: 'items-end',    bg: 'rgba(20,184,166,0.16)', ring: 'rgba(20,184,166,0.5)',  name: 'text-teal-200' },
    RESCUE_TEAM:  { align: 'items-start',  bg: 'rgba(245,158,11,0.15)', ring: 'rgba(245,158,11,0.5)',  name: 'text-amber-200' },
    SYSTEM:       { align: 'items-center', bg: 'rgba(148,163,184,0.12)', ring: 'rgba(148,163,184,0.35)', name: 'text-slate-300' },
};

function LiaisonView({ alertId, companyId, currentUserId, controllerName }: {
    alertId: number; companyId?: number; currentUserId?: number; controllerName: string;
}) {
    const [teams, setTeams] = useState<RescueTeamDTO[]>([]);
    const [messages, setMessages] = useState<AlertMessageDTO[]>([]);
    const [text, setText] = useState('');
    const [addressed, setAddressed] = useState<RescueTeamDTO | null>(null);
    const [asTeam, setAsTeam] = useState(false);
    const [sending, setSending] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => { if (companyId) listRescueTeams(companyId).then(setTeams).catch(() => setTeams([])); }, [companyId]);
    const refetch = useCallback(() => {
        if (alertId) listAlertMessages(alertId).then(setMessages).catch(() => setMessages([]));
    }, [alertId]);
    useEffect(() => { refetch(); const iv = setInterval(refetch, 4000); return () => clearInterval(iv); }, [refetch]);
    useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages]);

    const send = () => {
        if (!text.trim() || sending) return;
        setSending(true);
        postAlertMessage(alertId, {
            body: text.trim(),
            senderType: asTeam && addressed ? 'RESCUE_TEAM' : 'CONTROL_ROOM',
            senderName: asTeam && addressed ? addressed.name : controllerName,
            rescueTeamId: addressed?.id ?? null,
            rescueTeamName: addressed?.name ?? null,
        }, currentUserId).then(() => { setText(''); refetch(); }).finally(() => setSending(false));
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col xl:flex-row">
            {/* Colonne équipes */}
            <aside className="w-full xl:w-[300px] shrink-0 xl:border-r border-white/10 bg-slate-900/30 flex flex-col min-h-0 max-xl:max-h-[34vh]">
                <div className="shrink-0 px-4 py-3 border-b border-white/10 text-[13px] font-extrabold text-white uppercase tracking-[0.1em] flex items-center gap-2">
                    <IconUsers size={16} className="text-sky-300" /> Équipes de secours
                    <span className="ml-auto text-[12px] text-slate-400">{teams.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {teams.length === 0 ? (
                        <p className="text-[12.5px] text-slate-400 text-center py-6">Aucune équipe de secours configurée pour cette mine.</p>
                    ) : teams.map((tm) => {
                        const on = addressed?.id === tm.id;
                        return (
                            <div key={tm.id} className={`rounded-xl border p-3 ${on ? 'border-sky-400/60 bg-sky-500/10' : 'border-white/12 bg-white/5'}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-white font-bold text-[13.5px] truncate">{tm.name}</div>
                                        <div className="text-slate-400 text-[11px]">{tm.memberCount ?? 0} membre(s)</div>
                                    </div>
                                    {tm.status && <span className="text-[9.5px] uppercase font-bold text-emerald-300">{tm.status}</span>}
                                </div>
                                <button type="button" onClick={() => setAddressed(on ? null : tm)}
                                    className={`mt-2 w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] font-bold ${
                                        on ? 'bg-sky-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                    <IconMessage size={13} stroke={1.9} /> {on ? 'Adressé ✓' : 'Message au chef'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* Fil + composeur */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="shrink-0 px-5 py-3 border-b border-white/10 flex items-center gap-2">
                    <IconMessage size={17} className="text-sky-300" stroke={2} />
                    <div className="text-[13px] font-extrabold text-white uppercase tracking-[0.1em]">Fil de liaison</div>
                    <span className="ml-auto text-[12px] text-slate-400 tabular-nums">{messages.length}</span>
                </div>

                <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-6">
                            <IconMessage size={30} className="text-slate-600 mb-2" stroke={1.5} />
                            <p className="text-[13px] text-slate-400">Aucun message pour le moment.</p>
                            <p className="text-[11.5px] text-slate-500 mt-1">Communiquez avec les équipes de secours et consignez leurs retours ici.</p>
                        </div>
                    ) : messages.map((m) => {
                        const meta = BUBBLE_META[m.senderType] ?? BUBBLE_META.SYSTEM;
                        const center = m.senderType === 'SYSTEM';
                        return (
                            <div key={m.id} className={`flex flex-col ${meta.align}`}>
                                <div className={`max-w-[82%] rounded-2xl border px-3.5 py-2 ${center ? 'text-center' : ''}`}
                                    style={{ background: meta.bg, borderColor: meta.ring }}>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-[11px] font-bold ${meta.name}`}>
                                            {m.senderName || (m.senderType === 'CONTROL_ROOM' ? 'Salle de contrôle' : m.senderType === 'RESCUE_TEAM' ? 'Équipe de secours' : 'Système')}
                                        </span>
                                        {m.rescueTeamName && m.senderType === 'CONTROL_ROOM' && (
                                            <span className="text-[10px] text-slate-400">→ {m.rescueTeamName}</span>
                                        )}
                                        <span className="text-[10px] text-slate-400 ml-auto">
                                            {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="text-[13.5px] text-white whitespace-pre-wrap break-words">{m.body}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Composeur */}
                <div className="shrink-0 border-t border-white/10 p-3 space-y-2 bg-slate-900/40">
                    <div className="flex items-center gap-2 flex-wrap text-[12px]">
                        <span className="text-slate-400">À :</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold">
                            {addressed ? `Chef d'équipe — ${addressed.name}` : 'Toutes les équipes'}
                        </span>
                        {addressed && (
                            <>
                                <button type="button" onClick={() => setAddressed(null)} className="text-slate-400 hover:text-white inline-flex items-center gap-0.5">
                                    <IconX size={12} /> retirer
                                </button>
                                <label className="ml-auto inline-flex items-center gap-1.5 text-slate-300 cursor-pointer">
                                    <input type="checkbox" checked={asTeam} onChange={(e) => setAsTeam(e.target.checked)} className="accent-amber-500" />
                                    Consigner une réponse de l'équipe
                                </label>
                            </>
                        )}
                    </div>
                    <div className="flex items-end gap-2">
                        <textarea value={text} onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                            rows={2} placeholder={addressed ? `Message au chef d'équipe ${addressed.name}…` : 'Message aux équipes de secours…'}
                            className="flex-1 resize-none px-3 py-2 rounded-xl bg-slate-900/70 border border-white/15 text-white text-[13.5px] placeholder:text-slate-500 focus:outline-none focus:border-sky-400" />
                        <button type="button" onClick={send} disabled={!text.trim() || sending}
                            className="h-[46px] px-4 rounded-xl bg-sky-500 text-white font-bold inline-flex items-center gap-1.5 hover:bg-sky-400 disabled:opacity-40">
                            <IconSend size={16} stroke={1.9} /> Envoyer
                        </button>
                    </div>
                </div>
            </div>
        </div>
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
    const [tab, setTab] = useState<WallTab>('general');
    const rootRef = useRef<HTMLDivElement>(null);

    // Utilisateur courant (pour attribuer les messages / actions de la salle de crise).
    const user = useAppSelector((state: any) => state.user);
    const currentUserId = Number(user?.id) || undefined;
    const controllerName = [user?.firstName, user?.familyName ?? user?.lastName].filter(Boolean).join(' ')
        || user?.name || user?.username || 'Salle de contrôle';

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
            <header className="shrink-0 flex items-center justify-between gap-4 px-4 lg:px-8 pt-3 lg:pt-5 pb-3 lg:pb-4 flex-wrap border-b border-white/10">
                <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                    <div className={`w-11 h-11 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-red-600' : 'bg-emerald-600'}`}>
                        {isActive ? <IconAlertTriangle size={26} stroke={2} className="animate-pulse" /> : <IconShieldCheck size={26} stroke={2} />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                            <div className="text-[clamp(1.25rem,2.6vh,1.9rem)] leading-none font-black tracking-tight" style={{ color: '#ffffff', fontFamily: "'Source Serif 4', Georgia, serif" }}>
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
                <div className="flex items-center gap-3 lg:gap-6 flex-shrink-0">
                    <div className="text-right">
                        <p className="text-[12px] uppercase tracking-widest text-slate-300 font-semibold">Durée</p>
                        <p className="text-[clamp(1.5rem,4vh,2.6rem)] leading-none font-mono font-bold tabular-nums text-white">{formatClock(s.elapsedSec)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[12px] uppercase tracking-widest text-slate-300 font-semibold">Heure</p>
                        <p className="text-[clamp(1rem,2.6vh,1.6rem)] leading-none font-mono tabular-nums text-slate-100 mt-1.5">{clock}</p>
                    </div>
                    <button type="button" onClick={goFullscreen} title="Plein écran"
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center border border-white/20">
                        <IconMaximize size={22} stroke={1.8} />
                    </button>
                </div>
            </header>

            {/* ── Onglets de la Salle de Crise ── */}
            <nav className="shrink-0 px-8 flex items-end gap-1 border-b border-white/10 bg-slate-900/30 overflow-x-auto">
                {WALL_TABS.map((tb) => {
                    const on = tab === tb.id;
                    return (
                        <button key={tb.id} type="button" onClick={() => setTab(tb.id)}
                            className={`inline-flex items-center gap-2 px-4 py-3 text-[13.5px] font-bold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                                on ? 'border-sky-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                            {tb.icon}{tb.label}
                        </button>
                    );
                })}
            </nav>

            {tab === 'general' && (
            <div className="flex-1 min-h-0 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden">
                <main className="flex-1 min-w-0 min-h-0 px-4 lg:px-8 py-4 lg:py-6 space-y-4 lg:space-y-6 xl:overflow-y-auto">
                {/* ═══ Rangée 1 : Hero + Jauge + Progression ═══ */}
                <div className="grid grid-cols-12 gap-4 lg:gap-6">
                    {/* Non localisés — LE chiffre */}
                    <div className={`col-span-12 lg:col-span-4 rounded-3xl p-4 lg:p-7 flex flex-col justify-center ${s.unaccounted > 0 ? 'bg-red-600/20 border-2 border-red-500/50' : 'bg-emerald-600/20 border-2 border-emerald-500/50'}`}>
                        <p className="text-[clamp(0.8rem,1.7vh,1.05rem)] uppercase tracking-[0.18em] font-extrabold text-white">Personnes non localisées</p>
                        <div className="flex items-end gap-4 mt-1">
                            <span className={`text-[clamp(3.25rem,13vh,8rem)] leading-none font-black tabular-nums ${s.unaccounted > 0 ? 'text-red-300 animate-pulse' : 'text-emerald-300'}`}>
                                {s.unaccounted}
                            </span>
                            <span className="mb-3 lg:mb-5 text-[clamp(0.85rem,1.6vh,1.2rem)] font-semibold text-slate-200">
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
                        <div className="relative flex-1 min-h-[clamp(120px,16vh,190px)]">
                            <ResponsiveContainer>
                                <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: s.securedPct }]} startAngle={90} endAngle={-270}>
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar background={{ fill: '#334155' }} dataKey="value" cornerRadius={30} fill={gaugeColor} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[clamp(1.9rem,5vh,3.25rem)] leading-none font-black tabular-nums" style={{ color: gaugeColor }}>{s.securedPct}%</span>
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
            )}

            {tab === 'vip' && (
                <VipView companyId={alert?.companyId} checkIns={checkIns} assemblyPoints={assemblyPoints} />
            )}

            {tab === 'liaison' && (
                <LiaisonView alertId={Number(id)} companyId={alert?.companyId}
                    currentUserId={currentUserId} controllerName={controllerName} />
            )}

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
