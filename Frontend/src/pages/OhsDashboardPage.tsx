import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "@mantine/core";
import {
    IconAlertTriangle,
    IconReportAnalytics,
    IconShieldCheck,
    IconCircleCheck,
    IconClock,
    IconActivity,
    IconBolt,
    IconChevronRight,
    IconChevronDown,
    IconAlertOctagon,
    IconRefresh,
    IconBuildingFactory2,
    IconMoodSmile,
} from "@tabler/icons-react";

import {
    getOhsDashboard,
    type DashboardOhsDTO,
    type LabelCountDTO,
    type MonthlyPointDTO,
} from "../services/DashboardService";
import { getAllCompanies } from "../services/HrmsService";
import { riskLevelFromKey } from "../components/RiskManagement/riskLabels";

/**
 * SafeX 360 — Tableau de bord HSE exécutif.
 *
 * Écran branché sur l'agrégat RÉEL `GET /hns/dashboard/ohs` (service
 * DashboardService). Il remplace une maquette dont tous les chiffres étaient
 * codés en dur et dont les filtres ne filtraient rien.
 *
 * RÈGLE CARDINALE — on n'invente aucun chiffre. Quand le backend renvoie
 * `null`, l'IHM affiche « — » assorti d'une explication courte ; jamais 0 à la
 * place d'« inconnu », jamais de valeur de repli.
 *
 * Filtrage : le seul filtre honoré par le serveur est l'ANNÉE. La mine provient
 * du sélecteur du header (companyId injecté par l'intercepteur Axios) — aucun
 * sélecteur de mine dans les écrans. Les filtres gravité/département de la
 * maquette ont été retirés : un filtre décoratif est un mensonge.
 */

// ─────────────────────────────────────────────────────────────────────────────
//   CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const FIRST_YEAR = 2022;
const CURRENT_YEAR = new Date().getFullYear();

const YEAR_OPTIONS = Array.from(
    { length: Math.max(1, CURRENT_YEAR - FIRST_YEAR + 1) },
    (_v, i) => CURRENT_YEAR - i,
);

const MONTH_LABELS_FR = [
    'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc',
];

/** Placeholder unique pour toute valeur inconnue (jamais 0, jamais inventée). */
const UNKNOWN = '—';

const KPI_COLOR_MAP: Record<string, { border: string; iconBg: string; iconText: string; barColor: string }> = {
    red:     { border: 'border-red-200',     iconBg: 'bg-red-100',     iconText: 'text-red-700',     barColor: 'bg-red-500' },
    amber:   { border: 'border-amber-200',   iconBg: 'bg-amber-100',   iconText: 'text-amber-700',   barColor: 'bg-amber-500' },
    blue:    { border: 'border-blue-200',    iconBg: 'bg-blue-100',    iconText: 'text-blue-700',    barColor: 'bg-blue-500' },
    emerald: { border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', barColor: 'bg-emerald-500' },
};

const ALERT_TONE_MAP: Record<string, { border: string; bg: string; dot: string; text: string }> = {
    high:   { border: 'border-red-200',    bg: 'bg-red-50',    dot: 'bg-red-500',    text: 'text-red-700' },
    medium: { border: 'border-amber-200',  bg: 'bg-amber-50',  dot: 'bg-amber-500',  text: 'text-amber-700' },
    low:    { border: 'border-slate-200',  bg: 'bg-slate-50',  dot: 'bg-slate-500',  text: 'text-slate-700' },
};

const alertTone = (priority: string) => ALERT_TONE_MAP[priority] ?? ALERT_TONE_MAP.low;

/**
 * Bordure de survol par tonalité — carte d'accès rapide.
 * Tailwind JIT PURGE les classes interpolées (`hover:border-${tone}-300`),
 * donc on déclare ici une carte STATIQUE couvrant chaque `tone` réellement
 * utilisé dans le tableau d'accès rapides ci-dessous.
 */
const TONE_HOVER_BORDER: Record<string, string> = {
    red:     'hover:border-red-300',
    indigo:  'hover:border-indigo-300',
    violet:  'hover:border-violet-300',
    teal:    'hover:border-teal-300',
    amber:   'hover:border-amber-300',
    emerald: 'hover:border-emerald-300',
    blue:    'hover:border-blue-300',
    slate:   'hover:border-slate-300',
};

/**
 * Couleur de barre par rang de criticité — même rampe que la charte du module
 * Gestion des Risques (faible=emerald → critique=rose). On ne redéfinit aucun
 * SEUIL ici : les paliers viennent exclusivement de `riskLevelFromKey()`.
 */
const RISK_RANK_BAR: Record<number, string> = {
    1: '#10B981', // emerald-500
    2: '#84CC16', // lime-500
    3: '#F59E0B', // amber-500
    4: '#F97316', // orange-500
    5: '#F43F5E', // rose-500
};

/** Palette de la répartition par mine (aucune sémantique : simple distinction). */
const MINE_PALETTE = ['#0F766E', '#0EA5E9', '#6366F1', '#F59E0B', '#94A3B8', '#EC4899'];

// ─────────────────────────────────────────────────────────────────────────────
//   PAGE
// ─────────────────────────────────────────────────────────────────────────────

const OhsDashboardPage = () => {
    const navigate = useNavigate();

    const [year, setYear] = useState<number>(CURRENT_YEAR);
    const [data, setData] = useState<DashboardOhsDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [companyNames, setCompanyNames] = useState<Record<string, string>>({});

    const load = useCallback(async (refYear: number) => {
        setLoading(true);
        setLoadError(null);
        try {
            const dto = await getOhsDashboard(refYear);
            setData(dto);
        } catch (e: any) {
            setData(null);
            setLoadError(
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                "Impossible de charger les indicateurs du tableau de bord. Les chiffres ne sont pas affichés tant que la source n'a pas répondu.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load(year);
    }, [load, year]);

    // Noms des mines — utiles uniquement en vue consolidée (`incidentsByMine`).
    useEffect(() => {
        if (!data?.incidentsByMine?.length) return;
        let cancelled = false;
        getAllCompanies()
            .then((rows: any[]) => {
                if (cancelled || !Array.isArray(rows)) return;
                const map: Record<string, string> = {};
                rows.forEach((c) => {
                    const label = c?.name || c?.shortName;
                    if (c?.id !== undefined && label) map[String(c.id)] = String(label);
                });
                setCompanyNames(map);
            })
            .catch(() => { /* repli « Mine {id} » — non bloquant */ });
        return () => { cancelled = true; };
    }, [data?.incidentsByMine]);

    const kpis = data?.kpis;

    /**
     * Évolution vs N-1. Si N-1 vaut 0, AUCUN pourcentage n'est calculable
     * (division par zéro) : on affiche le brut « N-1 : 0 » au lieu d'un
     * « +∞ % » ou d'un « +100 % » qui seraient faux.
     */
    const incidentDelta = useMemo(() => {
        if (!kpis) return null;
        const prev = kpis.totalIncidentsPreviousYtd ?? 0;
        if (prev === 0) return null;
        const pct = ((kpis.totalIncidentsYtd - prev) / prev) * 100;
        return Math.round(pct);
    }, [kpis]);

    /** Agrégation des clés « PS » brutes vers les paliers du registre des risques. */
    const riskByLevel = useMemo(() => {
        const raw = data?.riskByLevel;
        if (!raw?.length) return [];
        const buckets = new Map<string, { label: string; count: number; rank: number }>();
        raw.forEach((row) => {
            const cfg = riskLevelFromKey(row.label);
            if (!cfg) return; // clé hors matrice : on ne l'invente pas dans un palier
            const current = buckets.get(cfg.label);
            if (current) current.count += row.count ?? 0;
            else buckets.set(cfg.label, { label: cfg.label, count: row.count ?? 0, rank: cfg.rank });
        });
        const total = Array.from(buckets.values()).reduce((s, b) => s + b.count, 0);
        return Array.from(buckets.values())
            .sort((a, b) => a.rank - b.rank)
            .map((b) => ({
                label: b.label,
                count: b.count,
                pct: total > 0 ? (b.count / total) * 100 : 0,
                color: RISK_RANK_BAR[b.rank] ?? '#94A3B8',
            }));
    }, [data?.riskByLevel]);

    const mineDistribution = useMemo(() => {
        const raw = data?.incidentsByMine;
        if (!raw?.length) return [];
        const total = raw.reduce((s, r) => s + (r.count ?? 0), 0);
        return raw.map((r, i) => ({
            label: companyNames[r.label] ?? `Mine ${r.label}`,
            count: r.count ?? 0,
            pct: total > 0 ? Math.round(((r.count ?? 0) / total) * 100) : 0,
            color: MINE_PALETTE[i % MINE_PALETTE.length],
        }));
    }, [data?.incidentsByMine, companyNames]);

    const severityTotal = useMemo(
        () => (data?.incidentsBySeverity ?? []).reduce((s, r) => s + (r.count ?? 0), 0),
        [data?.incidentsBySeverity],
    );

    const alerts = data?.alerts ?? [];

    return (
        <div className="px-6 lg:px-8 py-5 space-y-5 w-full bg-[#FAF8F3] min-h-full">

            {/* ─── En-tête : titre + sélecteur d'année ─────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        Direction Santé · Sécurité · Environnement
                    </p>
                    <h1
                        className="text-slate-900 mt-1.5"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 500,
                            fontSize: 'clamp(26px, 3vw, 32px)',
                            letterSpacing: '-0.014em',
                        }}
                    >
                        Tableau de bord HSE consolidé
                    </h1>
                    <p className="text-[13.5px] text-slate-600 mt-1">
                        Indicateurs sentinelles, distribution des risques et alertes prioritaires — mine active du bandeau.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-end">
                    <span className="text-[12px] text-slate-500 inline-flex items-center gap-1.5">
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
                            aria-hidden="true"
                        />
                        {loading ? 'Chargement…' : `Chargé · ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                    </span>

                    {/* Sélecteur d'ANNÉE — seul filtre réellement honoré par le serveur. */}
                    <label className="inline-flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                            Année
                        </span>
                        <span className="relative">
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                aria-label="Année de référence du tableau de bord"
                                className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-2 text-[13px] font-medium text-slate-800 cursor-pointer hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-colors tabular-nums"
                            >
                                {YEAR_OPTIONS.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <IconChevronDown
                                size={15}
                                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                aria-hidden="true"
                            />
                        </span>
                    </label>
                </div>
            </header>

            {/* ─── Bandeau d'erreur non bloquant ──────────────────────── */}
            {loadError && (
                <div
                    className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]"
                    role="alert"
                >
                    <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span className="flex-1">{loadError}</span>
                    <button
                        type="button"
                        onClick={() => void load(year)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[12px] font-medium text-amber-900 hover:bg-amber-100 transition-colors flex-shrink-0"
                    >
                        <IconRefresh size={13} stroke={1.8} />
                        Réessayer
                    </button>
                </div>
            )}

            {loading && !data ? (
                <DashboardSkeleton />
            ) : !data ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <p className="text-[13.5px] text-slate-600">
                        Aucune donnée disponible pour {year}. Les indicateurs restent masqués tant que la source n'a pas répondu.
                    </p>
                </div>
            ) : (
                <>
                    {/* ─── KPI BAR — 4 indicateurs sentinelles ─────────── */}
                    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. Incidents totaux */}
                        <KpiCard
                            color="red"
                            icon={<IconAlertTriangle size={18} aria-hidden="true" />}
                            label={`Incidents totaux ${year}`}
                            value={String(kpis?.totalIncidentsYtd ?? 0)}
                            badge={
                                incidentDelta === null
                                    ? null
                                    : {
                                          text: `${incidentDelta > 0 ? '+' : ''}${incidentDelta} %`,
                                          positive: incidentDelta < 0, // baisse = bon
                                      }
                            }
                            footer={
                                incidentDelta === null
                                    ? `N-1 : ${kpis?.totalIncidentsPreviousYtd ?? 0} — évolution non calculable`
                                    : `vs N-1 (${kpis?.totalIncidentsPreviousYtd ?? 0})`
                            }
                        />

                        {/* 2. Quasi-accidents — déclarer PLUS est positif */}
                        <KpiCard
                            color="blue"
                            icon={<IconReportAnalytics size={18} aria-hidden="true" />}
                            label="Quasi-accidents déclarés"
                            value={String(kpis?.nearMissCount ?? 0)}
                            badge={null}
                            footer="Signalements de l'année — en déclarer davantage traduit une culture proactive"
                        />

                        {/* 3. Jours sans incident grave — « — » si aucun incident grave */}
                        <KpiCard
                            color="emerald"
                            icon={<IconShieldCheck size={18} aria-hidden="true" />}
                            label="Jours sans incident grave"
                            value={
                                kpis?.daysWithoutSeriousIncident === null || kpis?.daysWithoutSeriousIncident === undefined
                                    ? UNKNOWN
                                    : String(kpis.daysWithoutSeriousIncident)
                            }
                            unit={
                                kpis?.daysWithoutSeriousIncident === null || kpis?.daysWithoutSeriousIncident === undefined
                                    ? undefined
                                    : 'jours'
                            }
                            badge={null}
                            footer={
                                kpis?.daysWithoutSeriousIncident === null || kpis?.daysWithoutSeriousIncident === undefined
                                    ? 'aucun incident grave enregistré'
                                    : 'depuis le dernier incident grave'
                            }
                        />

                        {/* 4. LTIFR — valeur DÉCLARÉE, jamais calculée */}
                        <KpiCard
                            color="amber"
                            icon={<IconActivity size={18} aria-hidden="true" />}
                            label="Taux de fréquence LTI"
                            value={kpis?.ltifr ? formatNumberFr(kpis.ltifr.value) : UNKNOWN}
                            unit={kpis?.ltifr?.period ?? undefined}
                            badge={null}
                            declared={Boolean(kpis?.ltifr)}
                            footer={
                                kpis?.ltifr
                                    ? kpis.ltifr.target !== null && kpis.ltifr.target !== undefined
                                        ? `cible ${formatNumberFr(kpis.ltifr.target)}`
                                        : 'aucune cible définie pour cette période'
                                    : 'non défini'
                            }
                            help={
                                kpis?.ltifr
                                    ? undefined
                                    : "Définissez un indicateur de code LTIFR dans Indicateurs & Performance pour suivre ce taux."
                            }
                        />
                    </section>

                    {/* ─── BODY : graphiques + colonne d'alertes ──────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4">

                        <div className="space-y-4 min-w-0">

                            {/* Row 1 : catégories + gravité */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ChartCard
                                    title="Répartition des incidents par catégorie"
                                    subtitle={`${kpis?.totalIncidentsYtd ?? 0} incident(s) déclaré(s) en ${year}`}
                                    icon={<IconAlertTriangle size={14} />}
                                >
                                    {data.incidentsByCategory?.length ? (
                                        <>
                                            <CountBars data={data.incidentsByCategory} />
                                            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                                                Un incident peut relever de plusieurs catégories : la somme des barres
                                                peut dépasser le total d'incidents. Aucune part du total n'est donc affichée.
                                            </p>
                                        </>
                                    ) : (
                                        <EmptyBlock text={`Aucune catégorie d'incident enregistrée en ${year}.`} />
                                    )}
                                </ChartCard>

                                <ChartCard
                                    title="Répartition par gravité"
                                    subtitle="Gravité la plus élevée retenue par incident"
                                    icon={<IconBolt size={14} />}
                                >
                                    {data.incidentsBySeverity?.length ? (
                                        <ShareBars data={data.incidentsBySeverity} total={severityTotal} />
                                    ) : (
                                        <EmptyBlock text={`Aucune gravité renseignée en ${year}.`} />
                                    )}
                                </ChartCard>
                            </div>

                            {/* Row 2 : tendance mensuelle */}
                            <ChartCard
                                title="Tendance mensuelle — incidents vs quasi-accidents"
                                subtitle={`12 mois de ${year} · davantage de quasi-accidents signalés = signalement proactif`}
                                icon={<IconActivity size={14} />}
                            >
                                <DualLineChart data={data.monthlyTrend ?? []} />
                            </ChartCard>

                            {/* Row 3 : niveaux de risque + répartition par mine */}
                            {(riskByLevel.length > 0 || mineDistribution.length > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {riskByLevel.length > 0 && (
                                        <ChartCard
                                            title="Niveaux de risque (registre)"
                                            subtitle="Paliers de la matrice probabilité × gravité du registre des risques"
                                            icon={<IconBolt size={14} />}
                                        >
                                            <RiskLevelBars data={riskByLevel} />
                                        </ChartCard>
                                    )}

                                    {mineDistribution.length > 0 && (
                                        <ChartCard
                                            title="Répartition par site minier"
                                            subtitle="Vue consolidée toutes mines"
                                            icon={<IconBuildingFactory2 size={14} />}
                                        >
                                            <DonutChart
                                                data={mineDistribution}
                                                centerLabel="Total"
                                                centerValue={String(
                                                    mineDistribution.reduce((s, m) => s + m.count, 0),
                                                )}
                                            />
                                        </ChartCard>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ===== ALERTES (droite) ===== */}
                        <aside className="bg-white rounded-xl border border-slate-200 p-4 h-fit">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    Alertes HSE
                                </h2>
                                <span
                                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium ${
                                        alerts.length > 0
                                            ? 'bg-red-50 text-red-700'
                                            : 'bg-emerald-50 text-emerald-700'
                                    }`}
                                >
                                    {alerts.length} active{alerts.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {alerts.length === 0 ? (
                                <div className="flex flex-col items-center text-center gap-2 py-6">
                                    <span className="p-2.5 rounded-full bg-emerald-50 text-emerald-600">
                                        <IconMoodSmile size={22} stroke={1.6} aria-hidden="true" />
                                    </span>
                                    <p className="text-[13px] text-slate-800">Aucune alerte active</p>
                                    <p className="text-[11.5px] text-slate-500 leading-relaxed">
                                        Aucun seuil d'alerte n'est franchi sur le périmètre et l'année sélectionnés.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {alerts.map((alert, i) => {
                                        const tone = alertTone(alert.priority);
                                        return (
                                            <div key={i} className={`p-3 rounded-lg border ${tone.border} ${tone.bg}`}>
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
                                                        <p className={`text-[12px] font-medium ${tone.text}`}>{alert.value}</p>
                                                    </span>
                                                </div>
                                                <p className="text-[13px] text-slate-900 leading-tight">{alert.title}</p>
                                                <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                                                    {alert.description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </aside>
                    </div>
                </>
            )}

            {/* ─── ACCÈS RAPIDES ─────────────────────────────────────── */}
            <section className="mt-2">
                <div className="flex items-center gap-2 mb-3">
                    <IconClock size={13} className="text-slate-500" />
                    <h2 className="text-[11px] uppercase tracking-[0.18em] text-slate-600">
                        Accès rapides
                    </h2>
                    <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {[
                        { label: 'Déclarer incident',    path: '/incidents/report',         tone: 'red'    },
                        { label: 'Nouvel audit',          path: '/audit-management/create',  tone: 'indigo' },
                        { label: 'Constat central',       path: '/non-conformity/create',    tone: 'violet' },
                        { label: 'Planifier tournée',     path: '/add-tour',                 tone: 'teal'   },
                        { label: 'Évaluer un risque',     path: '/risk-assessment',          tone: 'amber'  },
                        { label: 'Rapports analytics',    path: '/monthly-reports',          tone: 'emerald' },
                    ].map((q) => (
                        <button
                            key={q.label}
                            type="button"
                            onClick={() => navigate(q.path)}
                            className={`group bg-white rounded-lg border border-slate-200 ${TONE_HOVER_BORDER[q.tone] ?? TONE_HOVER_BORDER.slate} hover:shadow-md transition-all px-3 py-2.5 flex items-center justify-between gap-2 text-left`}
                        >
                            <span className="text-[12.5px] text-slate-700 group-hover:text-slate-900">
                                {q.label}
                            </span>
                            <IconChevronRight
                                size={13}
                                className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"
                            />
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//   UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

const formatNumberFr = (value: number): string =>
    Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────────────────────
//   SOUS-COMPOSANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Carte KPI — le style de la maquette, la donnée du backend. */
function KpiCard({
    color,
    icon,
    label,
    value,
    unit,
    badge,
    footer,
    help,
    declared,
}: {
    color: keyof typeof KPI_COLOR_MAP | string;
    icon: React.ReactNode;
    label: string;
    value: string;
    unit?: string;
    badge: { text: string; positive: boolean } | null;
    footer: string;
    help?: string;
    declared?: boolean;
}) {
    const c = KPI_COLOR_MAP[color] ?? KPI_COLOR_MAP.blue;
    const isUnknown = value === UNKNOWN;
    return (
        <div className={`relative rounded-xl border ${c.border} bg-white p-4 overflow-hidden hover:shadow-md transition-shadow`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.barColor}`} aria-hidden="true" />
            <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className={`p-2 rounded-lg ${c.iconBg} ${c.iconText}`}>{icon}</div>
                <div className="flex items-center gap-1.5">
                    {declared && (
                        <Tooltip
                            multiline
                            w={250}
                            withArrow
                            label="Valeur saisie dans le module Indicateurs — le calcul automatique exigerait les heures travaillées, non disponibles."
                        >
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[10.5px] font-medium cursor-help">
                                déclaré
                            </span>
                        </Tooltip>
                    )}
                    {badge && (
                        <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                badge.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}
                        >
                            {badge.text}
                        </span>
                    )}
                </div>
            </div>
            <p className="text-[11.5px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
            <p className="flex items-baseline gap-1.5 mt-1">
                <span
                    className={isUnknown ? 'text-slate-400' : 'text-slate-900'}
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '34px',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                    }}
                >
                    {value}
                </span>
                {unit && <span className="text-[12px] text-slate-500">{unit}</span>}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">{footer}</p>
            {help && (
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{help}</p>
            )}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Chargement du tableau de bord">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-[132px] rounded-xl border border-slate-200 bg-white" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-[260px] rounded-xl border border-slate-200 bg-white" />
                        <div className="h-[260px] rounded-xl border border-slate-200 bg-white" />
                    </div>
                    <div className="h-[280px] rounded-xl border border-slate-200 bg-white" />
                </div>
                <div className="h-[320px] rounded-xl border border-slate-200 bg-white" />
            </div>
        </div>
    );
}

function EmptyBlock({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center text-center gap-1.5 py-8">
            <IconCircleCheck size={20} stroke={1.6} className="text-slate-300" aria-hidden="true" />
            <p className="text-[12.5px] text-slate-500">{text}</p>
        </div>
    );
}

function ChartCard({
    title,
    subtitle,
    icon,
    children,
}: {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <header className="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="flex items-center gap-1.5 text-[13.5px] text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}>
                        {icon && <span className="text-teal-700">{icon}</span>}
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-[11.5px] text-slate-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
            </header>
            <div className="p-4">{children}</div>
        </div>
    );
}

/**
 * Barres proportionnelles au MAXIMUM de la série (et non au total) : les
 * catégories ne sont pas exclusives, un pourcentage « part du total » y serait
 * faux. On n'affiche donc que le décompte brut.
 */
function CountBars({ data }: { data: LabelCountDTO[] }) {
    const maxCount = Math.max(1, ...data.map((d) => d.count ?? 0));
    return (
        <div className="space-y-2">
            {data.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                    <Tooltip label={d.label} withArrow>
                        <span className="text-[12px] text-slate-700 w-28 flex-shrink-0 truncate">{d.label}</span>
                    </Tooltip>
                    <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden relative">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${((d.count ?? 0) / maxCount) * 100}%`,
                                background: 'linear-gradient(90deg, #0F766E 0%, #14B8A6 100%)',
                            }}
                        />
                    </div>
                    <span className="text-[12px] text-slate-900 font-medium w-8 text-right tabular-nums">
                        {d.count ?? 0}
                    </span>
                </div>
            ))}
        </div>
    );
}

/** Barres avec part du total — valide uniquement sur une série EXCLUSIVE. */
function ShareBars({ data, total }: { data: LabelCountDTO[]; total: number }) {
    return (
        <div className="space-y-3">
            {data.map((d) => {
                const pct = total > 0 ? ((d.count ?? 0) / total) * 100 : 0;
                return (
                    <div key={d.label}>
                        <div className="flex items-center justify-between text-[12px] mb-1">
                            <span className="text-slate-700 font-medium truncate">{d.label}</span>
                            <span className="text-slate-500 tabular-nums flex-shrink-0">
                                <span className="text-slate-900 font-medium">{d.count ?? 0}</span> / {total}
                                <span className="ml-1.5 text-slate-400">({pct.toFixed(1)}%)</span>
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0F766E 0%, #14B8A6 100%)' }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DonutChart({
    data,
    centerLabel,
    centerValue,
}: {
    data: Array<{ label: string; count: number; pct: number; color: string }>;
    centerLabel?: string;
    centerValue?: string;
}) {
    const r = 60;
    const cx = 90;
    const cy = 90;
    const strokeWidth = 22;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div className="flex items-center gap-5">
            <svg width="180" height="180" viewBox="0 0 180 180">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
                {data.map((seg, i) => {
                    const len = (seg.pct / 100) * circumference;
                    const dashArray = `${len} ${circumference}`;
                    const rotation = (offset / circumference) * 360;
                    offset += len;
                    return (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashArray}
                            transform={`rotate(${rotation - 90} ${cx} ${cy})`}
                            strokeLinecap="butt"
                        />
                    );
                })}
                {centerValue && (
                    <text x={cx} y={cy - 3} textAnchor="middle" className="fill-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '28px' }}>
                        {centerValue}
                    </text>
                )}
                {centerLabel && (
                    <text x={cx} y={cy + 15} textAnchor="middle" className="fill-slate-500" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {centerLabel}
                    </text>
                )}
            </svg>
            <ul className="flex-1 space-y-1.5 min-w-0">
                {data.map((seg) => (
                    <li key={seg.label} className="flex items-center gap-2 text-[12px]">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} aria-hidden="true" />
                        <span className="text-slate-700 flex-1 truncate">{seg.label}</span>
                        <span className="text-slate-900 font-medium tabular-nums">{seg.pct}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function DualLineChart({ data }: { data: MonthlyPointDTO[] }) {
    const points = useMemo(
        () =>
            (data ?? []).map((d) => ({
                month: MONTH_LABELS_FR[Math.min(11, Math.max(0, (d.month ?? 1) - 1))],
                incidents: d.incidents ?? 0,
                nearMiss: d.nearMiss ?? 0,
            })),
        [data],
    );

    if (points.length < 2) {
        return <EmptyBlock text="Série mensuelle indisponible." />;
    }

    const w = 600, h = 200, pad = 30;
    // Garde anti-division par zéro : une année sans aucun événement reste lisible.
    const maxV = Math.max(1, ...points.map((d) => Math.max(d.incidents, d.nearMiss))) * 1.15;
    const stepX = (w - 2 * pad) / (points.length - 1);

    const buildPath = (key: 'incidents' | 'nearMiss') =>
        points
            .map((d, i) => {
                const x = pad + i * stepX;
                const y = h - pad - (d[key] / maxV) * (h - 2 * pad);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');

    const pathIncidents = buildPath('incidents');
    const pathNearMiss = buildPath('nearMiss');

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ minWidth: 480 }}>
                {/* Grid Y */}
                {[0, 0.25, 0.5, 0.75, 1].map((p) => {
                    const y = h - pad - p * (h - 2 * pad);
                    return (
                        <g key={p}>
                            <line x1={pad} x2={w - pad} y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                            <text x={pad - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94A3B8">{Math.round(p * maxV)}</text>
                        </g>
                    );
                })}
                {/* X labels */}
                {points.map((d, i) => (
                    <text key={`${d.month}-${i}`} x={pad + i * stepX} y={h - pad + 14} textAnchor="middle" fontSize="10" fill="#64748B">
                        {d.month}
                    </text>
                ))}
                {/* Near miss area */}
                <path d={`${pathNearMiss} L ${pad + (points.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`} fill="rgba(59,130,246,0.08)" />
                {/* Lines */}
                <path d={pathNearMiss} fill="none" stroke="#3B82F6" strokeWidth="2" />
                <path d={pathIncidents} fill="none" stroke="#EF4444" strokeWidth="2.5" />
                {/* Points */}
                {points.map((d, i) => {
                    const x = pad + i * stepX;
                    const yI = h - pad - (d.incidents / maxV) * (h - 2 * pad);
                    const yN = h - pad - (d.nearMiss / maxV) * (h - 2 * pad);
                    return (
                        <g key={i}>
                            <circle cx={x} cy={yN} r="3" fill="#3B82F6" />
                            <circle cx={x} cy={yI} r="3.5" fill="#EF4444" />
                        </g>
                    );
                })}
            </svg>
            {/* Légende */}
            <div className="flex items-center justify-center gap-4 mt-2 text-[11.5px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-red-500" aria-hidden="true" />
                    Incidents avérés
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-blue-500" aria-hidden="true" />
                    Quasi-accidents signalés
                </span>
            </div>
        </div>
    );
}

/**
 * Paliers de risque — les libellés et l'ordre viennent de RISK_LEVEL_CONFIG
 * (module Gestion des Risques) : le tableau de bord et le registre disent
 * exactement la même chose.
 */
function RiskLevelBars({ data }: { data: Array<{ label: string; count: number; pct: number; color: string }> }) {
    const totalCount = data.reduce((s, d) => s + d.count, 0);
    return (
        <div className="space-y-3">
            {data.map((d) => (
                <div key={d.label}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="text-slate-700 font-medium">{d.label}</span>
                        <span className="text-slate-500 tabular-nums">
                            <span className="text-slate-900 font-medium">{d.count}</span> / {totalCount}
                            <span className="ml-1.5 text-slate-400">({d.pct.toFixed(1)}%)</span>
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default OhsDashboardPage;
