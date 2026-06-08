/**
 * BlastDashboardPage — Tableau de bord executif Blast Management (Phase 7 Frontend).
 *
 * Route : /blast (landing par defaut du module) + /blast/dashboard (alias).
 *
 * <p>RBAC : BLAST_VIEW (donnees STRICTEMENT agregees, aucun nom de boutefeu
 * ou destinataire ne transite par cette page).
 *
 * <p>Sections :
 *   1. Hero serif premium + breadcrumb + refresh manuel
 *   2. Compte a rebours du prochain tir CONFIRMED (alerte rouge si T-10)
 *   3. 6 KPI tiles (mois courant + tirs aujourd'hui)
 *   4. Aujourd'hui : timeline horizontale
 *   5. Cette semaine : DataTable PrimeReact 10 lignes max
 *   6. Repartition par statut : Recharts BarChart vertical (9 enums)
 *   7. Etat des notifications : 3 grandes stats (envoyees / en attente / echec)
 *   8. Derniers tirs : 5 cards compactes (cliquable vers la fiche)
 *
 * <p>Donnees : un seul endpoint backend GET /hns/blast/dashboard/summary?mineId=X
 * — refresh manuel + polling 30s. Le compte a rebours est tenu cote client via
 * un setInterval(1s) qui se nettoie au unmount (evite les fuites memoire).
 *
 * <p>Performance : React.memo sur les KPIs et le BarChart. Re-render limite
 * au tick du compte a rebours pour la card "Prochain tir".
 */

import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconChevronRight,
    IconRefresh,
    IconBolt,
    IconCalendarStats,
    IconWeight,
    IconAtom2,
    IconClockHour4,
    IconAlertOctagon,
    IconClock,
    IconBellRinging,
    IconBellPlus,
    IconBellOff,
    IconInfoCircle,
    IconExternalLink,
    IconMapPin,
    IconFlame,
} from '@tabler/icons-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RTooltip,
    CartesianGrid,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppSelector } from '../../slices/hooks';
import DosimetryKpiTile from '../Dosimetry/DosimetryKpiTile';
import BlastEvacuationAlarm from './BlastEvacuationAlarm';
import { formatZoneScope } from './formatZone';
import {
    getBlastDashboardSummary,
    type BlastDashboardDTO,
    type BlastListItemDTO,
    type BlastStatus,
    type NextBlastSummaryDTO,
} from '../../services/BlastService';

// ─────────────────────────────────────────────────────────────────────────────
//  Constantes
// ─────────────────────────────────────────────────────────────────────────────

/** Polling automatique : 30 secondes (rafraichit summary + reset le tick). */
const REFRESH_INTERVAL_MS = 30_000;

/** Seuil T-10 imminent : 10 minutes (600 s). */
const T_MINUS_10_SECONDS = 10 * 60;

/** Tirage des statuts dans l'ordre du cycle de vie pour le BarChart. */
const STATUS_ORDER: BlastStatus[] = [
    'DRAFT',
    'PLANNED',
    'CONFIRMED',
    'IMMINENT',
    'FIRED',
    'ALL_CLEAR',
    'MISFIRE',
    'CANCELLED',
    'POSTPONED',
];

/** Palette des statuts pour le BarChart (aligne sur le STATUS_CONFIG du registre). */
const STATUS_COLORS: Record<BlastStatus, string> = {
    DRAFT: '#94a3b8',     // slate-400
    PLANNED: '#0891b2',   // cyan-600
    CONFIRMED: '#d97706', // amber-600
    IMMINENT: '#ea580c',  // orange-600
    FIRED: '#64748b',     // slate-500
    ALL_CLEAR: '#16a34a', // green-600
    MISFIRE: '#dc2626',   // red-600
    CANCELLED: '#cbd5e1', // slate-300
    POSTPONED: '#a3a3a3', // neutral-400
};

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatDateTime = (iso: string | null | undefined, locale = 'fr-FR'): string => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso ?? '—';
        return d.toLocaleString(locale, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso ?? '—';
    }
};

const formatTimeOnly = (iso: string | null | undefined, locale = 'fr-FR'): string => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '—';
    }
};

const toInt = (v: unknown): number => {
    if (v == null) return 0;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? Math.round(n) : 0;
};

/**
 * Formate une duree en secondes sous forme "Xj YYh ZZ' SS"".
 * Compact et lisible meme sur de petites tuiles.
 */
const formatCountdown = (secondsTotal: number, labels: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
}): string => {
    const s = Math.max(0, Math.floor(Math.abs(secondsTotal)));
    const days = Math.floor(s / 86_400);
    const hours = Math.floor((s % 86_400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    if (days > 0) {
        return `${days}${labels.days} ${String(hours).padStart(2, '0')}${labels.hours} ${String(minutes).padStart(2, '0')}${labels.minutes}`;
    }
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}${labels.hours} ${String(minutes).padStart(2, '0')}${labels.minutes} ${String(seconds).padStart(2, '0')}${labels.seconds}`;
    }
    return `${String(minutes).padStart(2, '0')}${labels.minutes} ${String(seconds).padStart(2, '0')}${labels.seconds}`;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : Card "Prochain tir" avec compte a rebours en temps reel
// ─────────────────────────────────────────────────────────────────────────────

interface NextBlastCardProps {
    next: NextBlastSummaryDTO | null;
    /** Heure de reference du backend (ISO) — point de depart du compte a rebours. */
    baselineNowIso: string;
    onOpen: (id: number) => void;
}

function NextBlastCardImpl({ next, baselineNowIso, onOpen }: NextBlastCardProps) {
    const { t } = useTranslation('blast');

    // Tick local pour mettre a jour le compte a rebours toutes les secondes.
    // On stocke la baseline backend (secondsUntil + baselineNow) puis on derive
    // dynamiquement le temps restant a partir de Date.now(). Cela evite la
    // derive entre l'horloge client et l'horloge serveur, tout en restant fluide.
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!next) return;
        const intervalId = setInterval(() => {
            setTick((v) => (v + 1) % 1_000_000);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [next]);

    const labels = useMemo(() => ({
        days: t('dashboard.next.days', { defaultValue: 'j' }),
        hours: t('dashboard.next.hours', { defaultValue: 'h' }),
        minutes: t('dashboard.next.minutes', { defaultValue: 'min' }),
        seconds: t('dashboard.next.seconds', { defaultValue: 's' }),
    }), [t]);

    if (!next) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="relative px-6 py-8 text-center">
                    <span
                        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-300 to-slate-400"
                        aria-hidden="true"
                    />
                    <IconClock size={40} stroke={1.4} className="mx-auto text-slate-300 mb-3" />
                    <p
                        className="text-slate-800 font-semibold text-[16px]"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        {t('dashboard.next.noUpcoming', {
                            defaultValue: 'Aucun tir confirme dans la fenetre de 7 jours.',
                        })}
                    </p>
                    <p className="text-[12px] text-slate-500 mt-1.5">
                        {t('dashboard.next.noUpcomingHint', {
                            defaultValue: 'Verrouillez un tir depuis le registre pour qu\'il apparaisse ici.',
                        })}
                    </p>
                </div>
            </div>
        );
    }

    // Calcul du compte a rebours actuel : on utilise la baseline backend.
    const baselineNowMs = new Date(baselineNowIso).getTime();
    const scheduledMs = new Date(next.scheduledAt).getTime();
    let secondsUntil: number;
    if (Number.isFinite(baselineNowMs) && Number.isFinite(scheduledMs)) {
        // Drift cote client = Date.now() - baselineNowMs depuis le dernier refresh.
        secondsUntil = Math.floor((scheduledMs - Date.now()) / 1000);
    } else {
        secondsUntil = next.secondsUntil;
    }

    const isInProgress = secondsUntil <= 0;
    const isImminent = !isInProgress && secondsUntil <= T_MINUS_10_SECONDS;

    let toneBg: string;
    let toneBorder: string;
    let toneText: string;
    let toneAccent: string;
    let badge: { label: string; cls: string } | null = null;
    if (isInProgress) {
        toneBg = 'bg-orange-50';
        toneBorder = 'border-orange-300';
        toneText = 'text-orange-900';
        toneAccent = 'from-orange-500 to-red-500';
        badge = {
            label: t('dashboard.next.inProgress', { defaultValue: 'Tir en cours' }),
            cls: 'bg-orange-100 text-orange-800 border border-orange-300 animate-pulse',
        };
    } else if (isImminent) {
        toneBg = 'bg-red-50';
        toneBorder = 'border-red-300';
        toneText = 'text-red-900';
        toneAccent = 'from-red-500 to-rose-600';
        badge = {
            label: t('dashboard.next.imminent', { defaultValue: 'Tir imminent — alerte T-10 attendue' }),
            cls: 'bg-red-100 text-red-800 border border-red-300 animate-pulse',
        };
    } else {
        toneBg = 'bg-white';
        toneBorder = 'border-amber-200';
        toneText = 'text-amber-900';
        toneAccent = 'from-amber-500 via-orange-500 to-red-500';
    }

    return (
        <div className={`relative ${toneBg} border ${toneBorder} rounded-2xl shadow-sm overflow-hidden`}>
            <span
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${toneAccent}`}
                aria-hidden="true"
            />
            <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                        isInProgress || isImminent ? 'bg-white' : 'bg-amber-100'
                    }`}>
                        <IconFlame size={24} stroke={1.8} className={toneText} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h2
                                className="text-slate-800 font-semibold text-[15px] leading-tight uppercase tracking-[0.12em]"
                            >
                                {t('dashboard.next.title', { defaultValue: 'Prochain tir confirme' })}
                            </h2>
                            {badge && (
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${badge.cls}`}>
                                    {badge.label}
                                </span>
                            )}
                        </div>
                        <p className="text-[12px] text-slate-500 leading-snug">
                            {t('dashboard.next.subtitle', {
                                defaultValue: 'Compte a rebours en temps reel jusqu\'au prochain tir verrouille.',
                            })}
                        </p>
                        <div className="mt-3 flex items-end gap-6 flex-wrap">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-1">
                                    {next.reference}
                                </p>
                                <p
                                    className={`font-mono font-bold tabular-nums ${toneText}`}
                                    style={{
                                        fontSize: 'clamp(28px, 4.5vw, 44px)',
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1,
                                    }}
                                >
                                    {formatCountdown(secondsUntil, labels)}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1.5 text-[12px] text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                    <IconClock size={13} stroke={1.7} className="text-slate-400" />
                                    {t('dashboard.next.scheduledAt', { defaultValue: 'Heure prevue' })} :{' '}
                                    <span className="font-medium text-slate-800 tabular-nums">
                                        {formatDateTime(next.scheduledAt)}
                                    </span>
                                </span>
                                {next.zone && next.zone.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <IconMapPin size={13} stroke={1.7} className="text-slate-400" />
                                        {t('dashboard.next.zoneLabel', { defaultValue: 'Zone d\'alerte' })} :{' '}
                                        <span className="font-medium text-slate-800">{formatZoneScope(next.zone)}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onOpen(next.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shrink-0"
                >
                    {t('dashboard.next.openDetail', { defaultValue: 'Ouvrir la fiche du tir' })}
                    <IconExternalLink size={13} stroke={1.8} />
                </button>
            </div>
        </div>
    );
}

const NextBlastCard = memo(NextBlastCardImpl);

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : BarChart repartition statuts (memo)
// ─────────────────────────────────────────────────────────────────────────────

interface StatusBreakdownChartProps {
    breakdown: Partial<Record<BlastStatus, number>>;
    statusLabels: Record<BlastStatus, string>;
    tooltipLabel: string;
    emptyLabel: string;
    axisCount: string;
}

function StatusBreakdownChartImpl({
    breakdown,
    statusLabels,
    tooltipLabel,
    emptyLabel,
    axisCount,
}: StatusBreakdownChartProps) {
    const rows = useMemo(
        () =>
            STATUS_ORDER.map((s) => ({
                statusKey: s,
                label: statusLabels[s],
                count: toInt(breakdown[s]),
                color: STATUS_COLORS[s],
            })),
        [breakdown, statusLabels],
    );

    const totalCount = rows.reduce((acc, r) => acc + r.count, 0);

    if (totalCount === 0) {
        return (
            <div className="h-[280px] flex items-center justify-center text-[13px] text-slate-400 italic">
                {emptyLabel}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
                <BarChart
                    data={rows}
                    margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
                    barCategoryGap={'18%'}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10.5, fill: '#475569' }}
                        interval={0}
                        angle={-18}
                        textAnchor="end"
                        height={50}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#475569' }}
                        label={{
                            value: axisCount,
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize: 10.5, fill: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' },
                        }}
                    />
                    <RTooltip
                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                        contentStyle={{
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            fontSize: 12,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        }}
                        formatter={(value: number) => [tooltipLabel.replace('{{count}}', String(value)), '']}
                        labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {rows.map((r) => (
                            <Cell key={r.statusKey} fill={r.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

const StatusBreakdownChart = memo(StatusBreakdownChartImpl);

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : Timeline horizontale des tirs du jour
// ─────────────────────────────────────────────────────────────────────────────

interface TodayTimelineProps {
    blasts: BlastListItemDTO[];
    statusLabels: Record<BlastStatus, string>;
    onOpen: (id: number) => void;
    emptyLabel: string;
    locale: string;
}

function TodayTimelineImpl({ blasts, statusLabels, onOpen, emptyLabel, locale }: TodayTimelineProps) {
    if (blasts.length === 0) {
        return (
            <div className="px-4 py-6 text-center text-[13px] text-slate-400 italic border border-dashed border-slate-200 rounded-lg">
                {emptyLabel}
            </div>
        );
    }
    return (
        <ol className="relative pl-2 pr-2 overflow-x-auto">
            <div className="flex items-stretch gap-3 min-w-max py-2">
                {blasts.map((b) => (
                    <li key={b.id} className="list-none">
                        <button
                            type="button"
                            onClick={() => onOpen(b.id)}
                            className="w-[200px] text-left rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm hover:shadow-md hover:border-slate-300 transition focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-1"
                        >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="font-mono text-[11.5px] font-semibold text-slate-800 truncate">
                                    {b.reference}
                                </span>
                                <span
                                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: STATUS_COLORS[b.status] }}
                                    aria-hidden="true"
                                />
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-medium mb-0.5">
                                {statusLabels[b.status]}
                            </p>
                            <p className="text-[13px] font-mono font-bold tabular-nums text-slate-900">
                                {formatTimeOnly(b.scheduledAt, locale)}
                            </p>
                            {b.pit && (
                                <p className="text-[11px] text-slate-500 mt-1 truncate inline-flex items-center gap-1">
                                    <IconMapPin size={10} stroke={1.7} />
                                    {b.pit}
                                    {b.bench ? ` / ${b.bench}` : ''}
                                </p>
                            )}
                        </button>
                    </li>
                ))}
            </div>
        </ol>
    );
}

const TodayTimeline = memo(TodayTimelineImpl);

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const BlastDashboardPage = () => {
    const { t, i18n } = useTranslation('blast');
    const navigate = useNavigate();
    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR';

    const user = useAppSelector((state: any) => state.user);
    const reduxMineId: number | null = useAppSelector(
        (state: any) => state?.companySelection?.selectedCompanyId ?? null,
    );
    const mineId: number = reduxMineId ?? user?.mineId ?? user?.companyId ?? 1;

    const [data, setData] = useState<BlastDashboardDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [lastFetchAt, setLastFetchAt] = useState<string>(() => new Date().toISOString());

    // ─── Loader ────────────────────────────────────────────────────────────
    const loadData = useCallback(
        async (signal?: AbortSignal) => {
            setLoadError(null);
            try {
                const summary = await getBlastDashboardSummary(mineId);
                if (signal?.aborted) return;
                setData(summary);
                setLastFetchAt(new Date().toISOString());
            } catch {
                if (!signal?.aborted) {
                    setLoadError(
                        t('dashboard.loadError', {
                            defaultValue:
                                "Le tableau de bord n'a pas pu etre charge. Verifiez vos droits ou ressayez plus tard.",
                        }),
                    );
                }
            }
        },
        [mineId, t],
    );

    // Premier load + polling 30s
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        loadData(controller.signal).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });
        const intervalId = setInterval(() => {
            loadData();
        }, REFRESH_INTERVAL_MS);
        return () => {
            controller.abort();
            clearInterval(intervalId);
        };
    }, [loadData]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const handleOpenBlast = useCallback(
        (id: number) => navigate(`/blast/detail/${id}`),
        [navigate],
    );

    const handleOpenRegistry = useCallback(
        () => navigate('/blast/registry'),
        [navigate],
    );

    // ─── Derivations ──────────────────────────────────────────────────────
    const statusLabels: Record<BlastStatus, string> = useMemo(
        () => ({
            DRAFT: t('statuses.DRAFT', { defaultValue: 'Brouillon' }),
            PLANNED: t('statuses.PLANNED', { defaultValue: 'Planifie' }),
            CONFIRMED: t('statuses.CONFIRMED', { defaultValue: 'Confirme' }),
            IMMINENT: t('statuses.IMMINENT', { defaultValue: 'Imminent' }),
            FIRED: t('statuses.FIRED', { defaultValue: 'Tire' }),
            ALL_CLEAR: t('statuses.ALL_CLEAR', { defaultValue: 'Site degage' }),
            MISFIRE: t('statuses.MISFIRE', { defaultValue: 'Rate' }),
            CANCELLED: t('statuses.CANCELLED', { defaultValue: 'Annule' }),
            POSTPONED: t('statuses.POSTPONED', { defaultValue: 'Reporte' }),
        }),
        [t],
    );

    const kpis = data?.kpis;
    const notifications = data?.notificationsState;
    const upcomingToday = data?.upcomingToday ?? [];
    const upcomingWeek = data?.upcomingThisWeek ?? [];
    const lastFinished = data?.lastFinishedBlasts ?? [];
    const breakdown = data?.statusBreakdown ?? {};
    const next = data?.nextConfirmedBlast ?? null;

    // ─── Render ───────────────────────────────────────────────────────────

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            {/* Alarme d'evacuation automatique : montee au top du Dashboard pour
                couvrir le retour de l'utilisateur sur cette page apres redirect.
                Le composant gere lui-meme son tick + sirene + TTS + acquittement. */}
            {next && (
                <BlastEvacuationAlarm
                    blastReference={next.reference}
                    zone={next.zone}
                    scheduledAtIso={next.scheduledAt}
                    blastId={next.id}
                />
            )}
            <div className="w-full">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('dashboard.breadcrumbRoot', { defaultValue: 'Dynamitages' })}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {t('dashboard.breadcrumbCurrent', { defaultValue: 'Tableau de bord' })}
                    </span>
                </div>

                {/* ─── Hero compact (LOT 49 — densification) ─── */}
                {/* Hauteur reduite : py-3 au lieu de py-5, icone 36px au lieu de 48px,
                    titre clamp(18, 2vw, 22) au lieu de (22, 2.4vw, 28), suppression
                    de la barre gradient haute et de la ligne "Derniere mise a jour"
                    (deplacee a cote du bouton Actualiser). */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                                <IconBolt size={18} stroke={1.8} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-slate-900 leading-tight truncate"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(17px, 1.6vw, 20px)',
                                        letterSpacing: '-0.015em',
                                    }}
                                >
                                    {t('dashboard.title', { defaultValue: 'Tableau de bord dynamitage' })}
                                </h1>
                                <p className="text-[12px] text-slate-500 truncate">
                                    {t('dashboard.subtitle', {
                                        defaultValue: 'Suivi des tirs et de la chaine d\'annonce.',
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="hidden md:inline text-[11px] text-slate-500">
                                {t('dashboard.lastUpdate', { defaultValue: 'Derniere MAJ' })} :{' '}
                                <span className="font-mono tabular-nums text-slate-700">
                                    {formatTimeOnly(lastFetchAt, locale)}
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                                aria-label={t('dashboard.refresh', { defaultValue: 'Actualiser' })}
                            >
                                <IconRefresh
                                    size={13}
                                    stroke={1.8}
                                    className={refreshing ? 'animate-spin' : ''}
                                />
                                <span className="hidden sm:inline">
                                    {t('dashboard.refresh', { defaultValue: 'Actualiser' })}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Bandeau d'erreur non bloquant ─── */}
                {loadError && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                        <IconInfoCircle size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ─── Section 1 : Prochain tir ─── */}
                <div className="mb-5">
                    <NextBlastCard
                        next={next}
                        baselineNowIso={lastFetchAt}
                        onOpen={handleOpenBlast}
                    />
                </div>

                {/* ─── Section 2 : 6 KPI tiles ─── */}
                <div className="mb-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <DosimetryKpiTile
                            icon={IconCalendarStats}
                            label={t('dashboard.kpi.monthLabel', { defaultValue: 'Tirs du mois' })}
                            value={toInt(kpis?.blastsThisMonth)}
                            sub={t('dashboard.kpi.monthSub', { defaultValue: 'Tous statuts confondus' })}
                            tone="info"
                            loading={loading}
                        />
                        <DosimetryKpiTile
                            icon={IconWeight}
                            label={t('dashboard.kpi.explosivesLabel', { defaultValue: 'Explosifs consommes' })}
                            value={kpis ? kpis.totalExplosivesKg.toFixed(0) : 0}
                            unit={t('dashboard.kpi.explosivesUnit', { defaultValue: 'kg' })}
                            sub={t('dashboard.kpi.explosivesSub', {
                                defaultValue: 'Cumul tirs realises ce mois',
                            })}
                            tone="warning"
                            loading={loading}
                        />
                        <DosimetryKpiTile
                            icon={IconAtom2}
                            label={t('dashboard.kpi.powderFactorLabel', {
                                defaultValue: 'Charge specifique moyenne',
                            })}
                            value={kpis ? kpis.avgPowderFactor.toFixed(2) : 0}
                            unit={t('dashboard.kpi.powderFactorUnit', { defaultValue: 'kg/m³' })}
                            sub={t('dashboard.kpi.powderFactorSub', {
                                defaultValue: 'Moyenne sur tirs realises',
                            })}
                            tone="neutral"
                            loading={loading}
                        />
                        <DosimetryKpiTile
                            icon={IconClockHour4}
                            label={t('dashboard.kpi.onTimeLabel', { defaultValue: 'Taux a l\'heure' })}
                            value={kpis ? kpis.onTimeRate.toFixed(0) : 0}
                            unit={t('dashboard.kpi.onTimeUnit', { defaultValue: '%' })}
                            sub={t('dashboard.kpi.onTimeSub', {
                                defaultValue: 'Tirs tires a +/- 15 min de l\'heure prevue',
                            })}
                            tone={
                                kpis == null
                                    ? 'neutral'
                                    : kpis.onTimeRate >= 80
                                        ? 'success'
                                        : kpis.onTimeRate >= 50
                                            ? 'warning'
                                            : 'alert'
                            }
                            loading={loading}
                        />
                        <DosimetryKpiTile
                            icon={IconAlertOctagon}
                            label={t('dashboard.kpi.misfireLabel', { defaultValue: 'Rates du mois' })}
                            value={toInt(kpis?.misfireCount)}
                            sub={t('dashboard.kpi.misfireSub', {
                                defaultValue: 'A resoudre avant tout tir suivant',
                            })}
                            tone={(kpis?.misfireCount ?? 0) > 0 ? 'critical' : 'success'}
                            pulse={(kpis?.misfireCount ?? 0) > 0}
                            urgent={(kpis?.misfireCount ?? 0) > 0}
                            loading={loading}
                        />
                        <DosimetryKpiTile
                            icon={IconFlame}
                            label={t('dashboard.kpi.todayLabel', { defaultValue: 'Tirs aujourd\'hui' })}
                            value={toInt(kpis?.blastsToday)}
                            sub={t('dashboard.kpi.todaySub', { defaultValue: 'Planifies dans la journee' })}
                            tone={(kpis?.blastsToday ?? 0) > 0 ? 'info' : 'neutral'}
                            loading={loading}
                        />
                    </div>
                </div>

                {/* ─── Section 3 : Aujourd'hui + Cette semaine (cote a cote) ─── */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-5">
                    {/* Aujourd'hui */}
                    <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100">
                            <h2
                                className="text-slate-800 font-semibold text-[15px] leading-tight"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                            >
                                {t('dashboard.today.title', { defaultValue: 'Aujourd\'hui' })}
                            </h2>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">
                                {t('dashboard.today.subtitle', {
                                    defaultValue: 'Chronologie horizontale des tirs prevus dans la journee.',
                                })}
                            </p>
                        </div>
                        <div className="p-4">
                            <TodayTimeline
                                blasts={upcomingToday}
                                statusLabels={statusLabels}
                                onOpen={handleOpenBlast}
                                emptyLabel={t('dashboard.today.empty', {
                                    defaultValue: 'Aucun tir n\'est planifie pour aujourd\'hui.',
                                })}
                                locale={locale}
                            />
                        </div>
                    </div>

                    {/* Cette semaine */}
                    <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <h2
                                    className="text-slate-800 font-semibold text-[15px] leading-tight"
                                    style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                                >
                                    {t('dashboard.week.title', { defaultValue: 'Cette semaine' })}
                                </h2>
                                <p className="text-[11.5px] text-slate-500 mt-0.5">
                                    {t('dashboard.week.subtitle', {
                                        defaultValue: 'Tirs prevus sur les 7 prochains jours, plus proches en premier.',
                                    })}
                                </p>
                            </div>
                            {(data?.upcomingThisWeekCount ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                    {t('dashboard.week.totalCount', {
                                        count: data?.upcomingThisWeekCount ?? 0,
                                        defaultValue:
                                            '{{count}} tirs planifies au total',
                                    })}
                                </span>
                            )}
                        </div>
                        <div className="p-2">
                            {upcomingWeek.length === 0 ? (
                                <div className="px-4 py-8 text-center text-[13px] text-slate-400 italic">
                                    {t('dashboard.week.empty', {
                                        defaultValue: 'Aucun tir prevu sur les 7 prochains jours.',
                                    })}
                                </div>
                            ) : (
                                <DataTable
                                    value={upcomingWeek}
                                    onRowClick={(e) => handleOpenBlast((e.data as BlastListItemDTO).id)}
                                    rowClassName={() => 'cursor-pointer hover:bg-amber-50/40'}
                                    stripedRows
                                    size="small"
                                    emptyMessage={t('dashboard.week.empty', {
                                        defaultValue: 'Aucun tir prevu sur les 7 prochains jours.',
                                    })}
                                >
                                    <Column
                                        field="reference"
                                        header={t('dashboard.week.ref', { defaultValue: 'Reference' })}
                                        body={(row: BlastListItemDTO) => (
                                            <span className="font-mono text-[12px] text-slate-800">{row.reference}</span>
                                        )}
                                        style={{ minWidth: 130 }}
                                    />
                                    <Column
                                        field="scheduledAt"
                                        header={t('dashboard.week.scheduled', { defaultValue: 'Heure prevue' })}
                                        body={(row: BlastListItemDTO) => (
                                            <span className="font-mono tabular-nums text-[12px]">
                                                {formatDateTime(row.scheduledAt, locale)}
                                            </span>
                                        )}
                                        style={{ minWidth: 170 }}
                                    />
                                    <Column
                                        field="type"
                                        header={t('dashboard.week.type', { defaultValue: 'Type' })}
                                        body={(row: BlastListItemDTO) => (
                                            <span className="text-[12px] text-slate-700">
                                                {t(`types.${row.type}`, { defaultValue: row.type })}
                                            </span>
                                        )}
                                    />
                                    <Column
                                        field="pit"
                                        header={t('dashboard.week.pit', { defaultValue: 'Fosse' })}
                                        body={(row: BlastListItemDTO) => (
                                            <span className="text-[12px] text-slate-700">{row.pit ?? '—'}</span>
                                        )}
                                    />
                                    <Column
                                        field="status"
                                        header={t('dashboard.week.status', { defaultValue: 'Statut' })}
                                        body={(row: BlastListItemDTO) => (
                                            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-700">
                                                <span
                                                    className="inline-block w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: STATUS_COLORS[row.status] }}
                                                    aria-hidden="true"
                                                />
                                                {statusLabels[row.status]}
                                            </span>
                                        )}
                                    />
                                </DataTable>
                            )}
                            <div className="px-3 py-2 border-t border-slate-100 mt-1 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleOpenRegistry}
                                    className="inline-flex items-center gap-1 text-[12px] text-amber-700 hover:text-amber-800 hover:underline font-medium"
                                >
                                    {t('dashboard.week.moreLink', { defaultValue: 'Voir tout le registre' })}
                                    <IconChevronRight size={11} stroke={2} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Section 4 : Repartition statuts (BarChart) ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100">
                        <h2
                            className="text-slate-800 font-semibold text-[15px] leading-tight"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                        >
                            {t('dashboard.statusBreakdown.title', {
                                defaultValue: 'Repartition par statut',
                            })}
                        </h2>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                            {t('dashboard.statusBreakdown.subtitle', {
                                defaultValue: 'Distribution des tirs du mois selon leur etat dans le cycle de vie.',
                            })}
                        </p>
                    </div>
                    <div className="p-4">
                        <StatusBreakdownChart
                            breakdown={breakdown}
                            statusLabels={statusLabels}
                            tooltipLabel={t('dashboard.statusBreakdown.tooltipLabel', {
                                defaultValue: '{{count}} tir(s)',
                            })}
                            emptyLabel={t('dashboard.statusBreakdown.empty', {
                                defaultValue: 'Aucun tir enregistre ce mois.',
                            })}
                            axisCount={t('dashboard.statusBreakdown.axisCount', {
                                defaultValue: 'Nombre',
                            })}
                        />
                    </div>
                </div>

                {/* ─── Section 5 : Notifications ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100">
                        <h2
                            className="text-slate-800 font-semibold text-[15px] leading-tight"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                        >
                            {t('dashboard.notifications.title', { defaultValue: 'Etat des notifications' })}
                        </h2>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                            {t('dashboard.notifications.subtitle', {
                                defaultValue:
                                    'Suivi des rappels e-mails, popups et alertes T-10 sur le mois.',
                            })}
                        </p>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                            <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <IconBellRinging size={22} stroke={1.8} className="text-emerald-700" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-emerald-700 leading-tight">
                                    {t('dashboard.notifications.sent', { defaultValue: 'Envoyees' })}
                                </p>
                                <p
                                    className="text-emerald-900 font-bold tabular-nums"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontSize: '28px',
                                        lineHeight: 1.05,
                                    }}
                                >
                                    {toInt(notifications?.sent)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50/60 border border-blue-100">
                            <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <IconBellPlus size={22} stroke={1.8} className="text-blue-700" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-blue-700 leading-tight">
                                    {t('dashboard.notifications.scheduled', { defaultValue: 'En attente' })}
                                </p>
                                <p
                                    className="text-blue-900 font-bold tabular-nums"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontSize: '28px',
                                        lineHeight: 1.05,
                                    }}
                                >
                                    {toInt(notifications?.scheduled)}
                                </p>
                            </div>
                        </div>
                        <div
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                                (notifications?.failed ?? 0) > 0
                                    ? 'bg-red-50/70 border border-red-200'
                                    : 'bg-slate-50 border border-slate-100'
                            }`}
                        >
                            <div
                                className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    (notifications?.failed ?? 0) > 0 ? 'bg-red-100' : 'bg-slate-100'
                                }`}
                            >
                                <IconBellOff
                                    size={22}
                                    stroke={1.8}
                                    className={
                                        (notifications?.failed ?? 0) > 0
                                            ? 'text-red-700'
                                            : 'text-slate-500'
                                    }
                                />
                            </div>
                            <div>
                                <p
                                    className={`text-[10px] uppercase tracking-[0.14em] font-semibold leading-tight ${
                                        (notifications?.failed ?? 0) > 0
                                            ? 'text-red-700'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    {t('dashboard.notifications.failed', { defaultValue: 'En echec' })}
                                </p>
                                <p
                                    className={`font-bold tabular-nums ${
                                        (notifications?.failed ?? 0) > 0
                                            ? 'text-red-900'
                                            : 'text-slate-700'
                                    }`}
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontSize: '28px',
                                        lineHeight: 1.05,
                                    }}
                                >
                                    {toInt(notifications?.failed)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="px-5 pb-4 -mt-1 flex justify-end">
                        <button
                            type="button"
                            onClick={handleOpenRegistry}
                            className="inline-flex items-center gap-1 text-[12px] text-slate-600 hover:text-slate-800 hover:underline"
                        >
                            {t('dashboard.notifications.viewLog', {
                                defaultValue: 'Consulter le journal complet',
                            })}
                            <IconChevronRight size={11} stroke={2} />
                        </button>
                    </div>
                </div>

                {/* ─── Section 6 : Derniers tirs ─── */}
                <div className="mb-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100">
                        <h2
                            className="text-slate-800 font-semibold text-[15px] leading-tight"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                        >
                            {t('dashboard.lastFinished.title', { defaultValue: 'Derniers tirs' })}
                        </h2>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                            {t('dashboard.lastFinished.subtitle', {
                                defaultValue:
                                    'Cinq dernieres operations cloturees (site degage ou annule).',
                            })}
                        </p>
                    </div>
                    <div className="p-4">
                        {lastFinished.length === 0 ? (
                            <div className="px-4 py-6 text-center text-[13px] text-slate-400 italic">
                                {t('dashboard.lastFinished.empty', {
                                    defaultValue: 'Aucun tir cloture pour le moment.',
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                {lastFinished.map((b) => (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => handleOpenBlast(b.id)}
                                        className="text-left rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm hover:shadow-md hover:border-slate-300 transition focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-1"
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-mono text-[11.5px] font-semibold text-slate-800 truncate">
                                                {b.reference}
                                            </span>
                                            <span
                                                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: STATUS_COLORS[b.status] }}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-medium mb-1">
                                            {statusLabels[b.status]}
                                        </p>
                                        <p className="text-[12px] font-mono tabular-nums text-slate-700">
                                            {formatDateTime(b.scheduledAt, locale)}
                                        </p>
                                        {b.pit && (
                                            <p className="text-[11px] text-slate-500 mt-1 inline-flex items-center gap-1 truncate">
                                                <IconMapPin size={10} stroke={1.7} />
                                                {b.pit}
                                                {b.bench ? ` / ${b.bench}` : ''}
                                            </p>
                                        )}
                                        <p className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-amber-700 font-medium">
                                            {t('dashboard.lastFinished.viewDetail', {
                                                defaultValue: 'Fiche du tir',
                                            })}
                                            <IconExternalLink size={10} stroke={1.8} />
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Footer ─── */}
                <footer className="mt-4 text-center text-[10.5px] text-slate-400 leading-relaxed">
                    {t('dashboard.footer', {
                        defaultValue:
                            'Donnees agregees, multi-tenant. Les noms des boutefeux et des destinataires ne sont jamais affiches sur cette page.',
                    })}
                </footer>
            </div>
        </div>
    );
};

export default BlastDashboardPage;
