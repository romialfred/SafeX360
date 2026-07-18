import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
    IconChecklist,
    IconClipboardCheck,
    IconRoute,
} from "@tabler/icons-react";

import {
    getOhsDashboard,
    type DashboardOhsDTO,
    type LabelCountDTO,
    type MonthlyPointDTO,
    type WorkloadSummaryDTO,
} from "../services/DashboardService";
import { getAllCompanies } from "../services/HrmsService";
import { riskLevelFromKey } from "../components/RiskManagement/riskLabels";
import {
    incidentStatusLabel,
    incidentStatusColor,
} from "../components/LaggingIndicator/IncidentManagement/incidentLabels";
import { caStatusConfig } from "../components/LaggingIndicator/CorrectiveAction/correctiveLabels";

/**
 * SafeX 360 — Tableau de bord HSE exécutif.
 *
 * Écran branché sur l'agrégat RÉEL `GET /hns/dashboard/ohs` (service
 * DashboardService). Il remplace une maquette dont tous les chiffres étaient
 * codés en dur et dont les filtres ne filtraient rien.
 *
 * RÈGLE CARDINALE — on n'invente aucun chiffre. Quand le backend renvoie
 * `null`, l'IHM affiche « — » assorti d'une explication courte ; jamais 0 à la
 * place d'« inconnu », jamais de valeur de repli. Aucun pourcentage n'est
 * affiché sur un dénominateur nul.
 *
 * Filtrage : le seul filtre honoré par le serveur est l'ANNÉE. La mine provient
 * du sélecteur du header (companyId injecté par l'intercepteur Axios) — aucun
 * sélecteur de mine dans les écrans.
 *
 * DENSITÉ (refonte 2026-07-18) — la version précédente consacrait l'essentiel
 * de la surface à quatre tuiles surdimensionnées et à une courbe géante quadrillée,
 * pour n'exposer au total que sept chiffres. Trois principes ont guidé la refonte :
 *   1. les KPI forment un BANDEAU compact, pas quatre cartes ;
 *   2. la courbe de tendance est un aplat SANS grille de fond — le quadrillage
 *      n'apportait aucune précision utile sur des effectifs à un chiffre ;
 *   3. la surface libérée sert à montrer les WORKFLOWS (traitement des
 *      incidents, actions correctives, inspections), c'est-à-dire ce qu'un
 *      responsable HSE doit piloter — pas seulement des volumes.
 *
 * SOURCE UNIQUE DES LIBELLÉS — les statuts ne sont PAS retraduits ici : les
 * libellés et la sémantique de couleur viennent des modules propriétaires
 * (`incidentLabels`, `correctiveLabels`, i18n `inspection:statuses`). Le
 * tableau de bord et les écrans métier disent donc exactement la même chose.
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
    'J', 'F', 'M', 'A', 'M', 'J',
    'J', 'A', 'S', 'O', 'N', 'D',
];

/** Placeholder unique pour toute valeur inconnue (jamais 0, jamais inventée). */
const UNKNOWN = '—';

const SERIF = "'Source Serif 4', Georgia, serif";

/** Accent de chaque cellule du bandeau KPI (pastille + valeur). */
const KPI_ACCENT: Record<string, { dot: string; icon: string }> = {
    red:     { dot: 'bg-red-500',     icon: 'text-red-600'     },
    amber:   { dot: 'bg-amber-500',   icon: 'text-amber-600'   },
    blue:    { dot: 'bg-blue-500',    icon: 'text-blue-600'    },
    emerald: { dot: 'bg-emerald-500', icon: 'text-emerald-600' },
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

/**
 * Traduction des noms de couleur Mantine (rendus par `incidentStatusColor`)
 * en hexadécimal, seul format exploitable dans un SVG.
 *
 * On ne redéfinit PAS ici quel statut porte quelle couleur : cette
 * correspondance reste la propriété d'`incidentLabels`. Ce tableau ne fait que
 * matérialiser une couleur nommée — dupliquer la sémantique aurait garanti que
 * le tableau de bord et le registre des incidents finissent par diverger.
 */
const MANTINE_HEX: Record<string, string> = {
    gray:   '#94A3B8',
    blue:   '#3B82F6',
    cyan:   '#06B6D4',
    yellow: '#EAB308',
    orange: '#F97316',
    green:  '#10B981',
    red:    '#EF4444',
    teal:   '#14B8A6',
    violet: '#8B5CF6',
};

const hexOfMantine = (name: string) => MANTINE_HEX[name] ?? MANTINE_HEX.gray;

/**
 * Couleur des statuts d'inspection — miroir de la charte d'InspectionStatusBadge.
 * Le partage terminal/non terminal, lui, est tranché par le SERVEUR
 * (`CLOSED_INSPECTION_STATUSES`) : l'IHM ne le recalcule pas.
 */
const INSPECTION_STATUS_HEX: Record<string, string> = {
    SCHEDULED:   '#06B6D4',
    IN_PROGRESS: '#F59E0B',
    SUBMITTED:   '#8B5CF6',
    APPROVED:    '#10B981',
    ARCHIVED:    '#64748B',
    REJECTED:    '#F43F5E',
    PENDING:     '#94A3B8',
    COMPLETED:   '#10B981',
    CANCELLED:   '#CBD5E1',
};

/** Couleur des statuts d'action corrective — miroir de CA_STATUS_CONFIG. */
const ACTION_STATUS_HEX: Record<string, string> = {
    PENDING:     '#8B5CF6',
    IN_PROGRESS: '#F59E0B',
    COMPLETED:   '#10B981',
    CANCELLED:   '#F43F5E',
};

// ─────────────────────────────────────────────────────────────────────────────
//   PAGE
// ─────────────────────────────────────────────────────────────────────────────

const OhsDashboardPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('inspection');

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

    /**
     * Pipeline de traitement des incidents (ISO 45001 §10.2). Série EXCLUSIVE :
     * chaque incident porte un seul statut, la somme des segments est donc le
     * total de l'année — une part du total y est légitime, contrairement aux
     * catégories.
     */
    const incidentPipeline = useMemo(() => {
        const raw = data?.incidentsByStatus ?? [];
        const total = raw.reduce((s, r) => s + (r.count ?? 0), 0);
        return {
            total,
            segments: raw.map((r) => ({
                label: incidentStatusLabel(r.label),
                count: r.count ?? 0,
                pct: total > 0 ? ((r.count ?? 0) / total) * 100 : 0,
                color: hexOfMantine(incidentStatusColor(r.label)),
            })),
        };
    }, [data?.incidentsByStatus]);

    const alerts = data?.alerts ?? [];

    return (
        <div className="px-6 lg:px-8 py-5 space-y-4 w-full bg-[#FAF8F3] min-h-full">

            {/* ─── En-tête : titre + sélecteur d'année ─────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        Direction Santé · Sécurité · Environnement
                    </p>
                    <h1
                        className="text-slate-900 mt-1"
                        style={{
                            fontFamily: SERIF,
                            fontWeight: 500,
                            fontSize: 'clamp(22px, 2.4vw, 27px)',
                            letterSpacing: '-0.014em',
                        }}
                    >
                        Tableau de bord HSE consolidé
                    </h1>
                    <p className="text-[12.5px] text-slate-600 mt-0.5">
                        Indicateurs sentinelles, pilotage des workflows et alertes prioritaires — mine active du bandeau.
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
                                className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-[13px] font-medium text-slate-800 cursor-pointer hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-colors tabular-nums"
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
                    {/* ─── BANDEAU KPI — 4 cellules dans UNE carte ─────────
                        Quatre cartes distinctes occupaient une bande de 132 px
                        pour quatre nombres. Regroupées, elles tiennent en 90 px
                        et se lisent d'un seul balayage. */}
                    {/* `gap-px` sur fond ardoise : les séparateurs sont produits par
                        la gouttière elle-même. `divide-x` aurait posé une bordure
                        gauche au premier élément de la 2ᵉ rangée en affichage à deux
                        colonnes — le tracé aurait été faux dès qu'une rangée se replie. */}
                    <section className="rounded-xl border border-slate-200 bg-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden">
                        <KpiCell
                            accent="red"
                            icon={<IconAlertTriangle size={14} aria-hidden="true" />}
                            label={`Incidents ${year}`}
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

                        <KpiCell
                            accent="blue"
                            icon={<IconReportAnalytics size={14} aria-hidden="true" />}
                            label="Quasi-accidents"
                            value={String(kpis?.nearMissCount ?? 0)}
                            footer="En déclarer davantage traduit une culture proactive"
                        />

                        <KpiCell
                            accent="emerald"
                            icon={<IconShieldCheck size={14} aria-hidden="true" />}
                            label="Jours sans incident grave"
                            value={
                                kpis?.daysWithoutSeriousIncident === null || kpis?.daysWithoutSeriousIncident === undefined
                                    ? UNKNOWN
                                    : String(kpis.daysWithoutSeriousIncident)
                            }
                            unit={
                                kpis?.daysWithoutSeriousIncident === null || kpis?.daysWithoutSeriousIncident === undefined
                                    ? undefined
                                    : 'j'
                            }
                            footer={
                                kpis?.daysWithoutSeriousIncident === null || kpis?.daysWithoutSeriousIncident === undefined
                                    ? 'aucun incident grave enregistré'
                                    : 'depuis le dernier incident grave'
                            }
                        />

                        {/* LTIFR — valeur DÉCLARÉE, jamais calculée. */}
                        <KpiCell
                            accent="amber"
                            icon={<IconActivity size={14} aria-hidden="true" />}
                            label="Taux de fréquence LTI"
                            value={kpis?.ltifr ? formatNumberFr(kpis.ltifr.value) : UNKNOWN}
                            unit={kpis?.ltifr?.period ?? undefined}
                            declared={Boolean(kpis?.ltifr)}
                            footer={
                                kpis?.ltifr
                                    ? kpis.ltifr.target !== null && kpis.ltifr.target !== undefined
                                        ? `cible ${formatNumberFr(kpis.ltifr.target)}`
                                        : 'aucune cible définie'
                                    : 'non défini — à créer dans Indicateurs & Performance'
                            }
                        />
                    </section>

                    {/* ─── PIPELINE DE TRAITEMENT DES INCIDENTS (ISO 45001 §10.2) ─── */}
                    <StatusPipelineCard
                        pipeline={incidentPipeline}
                        year={year}
                        onNavigate={() => navigate('/incidents')}
                    />

                    {/* ─── BODY : graphiques + colonne d'alertes ──────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4">

                        <div className="space-y-4 min-w-0">

                            {/* Row 1 : plans de charge — ce qu'il faut PILOTER */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <WorkloadCard
                                    title="Actions correctives"
                                    subtitle={`Ouvertes en ${year} · ISO 45001 §10.2`}
                                    icon={<IconChecklist size={14} />}
                                    summary={data.actions}
                                    colorOf={(code) => ACTION_STATUS_HEX[code] ?? '#94A3B8'}
                                    labelOf={(code) => caStatusConfig(code).label}
                                    overdueLabel="en retard"
                                    emptyText={`Aucune action corrective créée en ${year}.`}
                                    footnote="Le décompte des retards ci-dessus porte sur le seul exercice affiché ; l'alerte de droite, elle, couvre toutes les années."
                                    onClick={() => navigate('/corrective')}
                                />

                                <WorkloadCard
                                    title="Inspections planifiées"
                                    subtitle={`Programmées en ${year} · ISO 45001 §9.1`}
                                    icon={<IconClipboardCheck size={14} />}
                                    summary={data.inspections}
                                    colorOf={(code) => INSPECTION_STATUS_HEX[code] ?? '#94A3B8'}
                                    labelOf={(code) => t(`statuses.${code}`, { defaultValue: code })}
                                    overdueLabel="date dépassée"
                                    emptyText={`Aucune inspection planifiée en ${year}.`}
                                    onClick={() => navigate('/inspections')}
                                />
                            </div>

                            {/* Row 2 : tendance COMPACTE, sans grille de fond */}
                            <ChartCard
                                title="Tendance mensuelle"
                                subtitle="Incidents avérés vs quasi-accidents signalés"
                                icon={<IconRoute size={14} />}
                            >
                                <DualAreaChart data={data.monthlyTrend ?? []} />
                            </ChartCard>

                            {/* Row 3 : catégories + gravité */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ChartCard
                                    title="Incidents par catégorie"
                                    subtitle={`${kpis?.totalIncidentsYtd ?? 0} incident(s) déclaré(s) en ${year}`}
                                    icon={<IconAlertTriangle size={14} />}
                                >
                                    {data.incidentsByCategory?.length ? (
                                        <>
                                            <CountBars data={data.incidentsByCategory} />
                                            <p className="text-[10.5px] text-slate-400 mt-3 leading-relaxed">
                                                Un incident peut relever de plusieurs catégories : la somme des barres
                                                peut dépasser le total. Aucune part du total n'est donc affichée.
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

                            {/* Row 4 : niveaux de risque + répartition par mine */}
                            {(riskByLevel.length > 0 || mineDistribution.length > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {riskByLevel.length > 0 && (
                                        <ChartCard
                                            title="Niveaux de risque (registre)"
                                            subtitle="Paliers de la matrice probabilité × gravité"
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
            <section className="mt-1">
                <div className="flex items-center gap-2 mb-2.5">
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

/**
 * Cellule du bandeau KPI. Compacte par construction : pas de pavé d'icône, pas
 * de bordure propre — la séparation vient du `divide-x` de la carte parente.
 */
function KpiCell({
    accent,
    icon,
    label,
    value,
    unit,
    badge,
    footer,
    declared,
}: {
    accent: keyof typeof KPI_ACCENT | string;
    icon: React.ReactNode;
    label: string;
    value: string;
    unit?: string;
    badge?: { text: string; positive: boolean } | null;
    footer: string;
    declared?: boolean;
}) {
    const a = KPI_ACCENT[accent] ?? KPI_ACCENT.blue;
    const isUnknown = value === UNKNOWN;
    return (
        <div className="bg-white px-4 py-3 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
                <span className={a.icon} aria-hidden="true">{icon}</span>
                <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 truncate">{label}</p>
                {declared && (
                    <Tooltip
                        multiline
                        w={250}
                        withArrow
                        label="Valeur saisie dans le module Indicateurs — le calcul automatique exigerait les heures travaillées, non disponibles."
                    >
                        <span className="ml-auto inline-flex items-center px-1 py-px rounded border border-slate-200 bg-slate-50 text-slate-500 text-[9.5px] font-medium cursor-help flex-shrink-0">
                            déclaré
                        </span>
                    </Tooltip>
                )}
                {badge && (
                    <span
                        className={`ml-auto inline-flex items-center px-1.5 py-px rounded text-[10.5px] font-medium flex-shrink-0 ${
                            badge.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}
                    >
                        {badge.text}
                    </span>
                )}
            </div>
            <p className="flex items-baseline gap-1.5">
                <span
                    className={isUnknown ? 'text-slate-300' : 'text-slate-900'}
                    style={{
                        fontFamily: SERIF,
                        fontWeight: 600,
                        fontSize: '26px',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                    }}
                >
                    {value}
                </span>
                {unit && <span className="text-[11px] text-slate-500 truncate">{unit}</span>}
            </p>
            <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">{footer}</p>
        </div>
    );
}

/**
 * Pipeline de traitement des incidents — barre empilée pleine largeur.
 *
 * Répond à la question que ne posait aucun graphique précédent : « où en sont
 * les incidents déclarés ? ». Un volume total sans pipeline ne dit pas si les
 * incidents sont traités, or c'est exactement ce que la norme exige de suivre.
 */
function StatusPipelineCard({
    pipeline,
    year,
    onNavigate,
}: {
    pipeline: { total: number; segments: Array<{ label: string; count: number; pct: number; color: string }> };
    year: number;
    onNavigate: () => void;
}) {
    if (pipeline.total === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                    <IconRoute size={14} className="text-teal-700" />
                    <h3 className="text-[13px] text-slate-900" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                        Traitement des incidents
                    </h3>
                </div>
                <p className="text-[12px] text-slate-500">Aucun incident déclaré en {year}.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                    <IconRoute size={14} className="text-teal-700" />
                    <h3 className="text-[13px] text-slate-900" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                        Traitement des incidents
                    </h3>
                    <span className="text-[11px] text-slate-500">
                        · {pipeline.total} déclaré{pipeline.total > 1 ? 's' : ''} en {year} · ISO 45001 §10.2
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onNavigate}
                    className="text-[11.5px] text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-0.5 flex-shrink-0"
                >
                    Ouvrir le registre
                    <IconChevronRight size={12} />
                </button>
            </div>

            {/* Barre empilée — série exclusive, la somme fait 100 %. */}
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                {pipeline.segments.map((s) => (
                    <Tooltip key={s.label} label={`${s.label} · ${s.count}`} withArrow>
                        <div
                            className="h-full transition-all hover:brightness-110"
                            style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                            aria-label={`${s.label} : ${s.count}`}
                        />
                    </Tooltip>
                ))}
            </div>

            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
                {pipeline.segments.map((s) => (
                    <li key={s.label} className="inline-flex items-center gap-1.5 text-[11.5px]">
                        <span
                            className="w-2 h-2 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: s.color }}
                            aria-hidden="true"
                        />
                        <span className="text-slate-600">{s.label}</span>
                        <span className="text-slate-900 font-medium tabular-nums">{s.count}</span>
                        <span className="text-slate-400 tabular-nums">({s.pct.toFixed(0)} %)</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * Plan de charge (actions correctives / inspections) — anneau d'avancement,
 * trois compteurs, détail par statut.
 *
 * Un SEUL composant pour les deux domaines : ils répondent à la même question
 * de pilotage. Deux composants jumeaux auraient divergé au premier ajustement.
 *
 * HONNÊTETÉ : le taux d'avancement n'est affiché que si `total > 0` — un
 * pourcentage sur un dénominateur nul serait une invention.
 */
function WorkloadCard({
    title,
    subtitle,
    icon,
    summary,
    colorOf,
    labelOf,
    overdueLabel,
    emptyText,
    footnote,
    onClick,
}: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    summary?: WorkloadSummaryDTO | null;
    colorOf: (statusCode: string) => string;
    labelOf: (statusCode: string) => string;
    overdueLabel: string;
    emptyText: string;
    footnote?: string;
    onClick: () => void;
}) {
    const total = summary?.total ?? 0;
    const closed = summary?.closed ?? 0;
    const open = summary?.open ?? 0;
    const overdue = summary?.overdue ?? 0;
    const rate = total > 0 ? Math.round((closed / total) * 100) : null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <header className="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3
                        className="flex items-center gap-1.5 text-[13.5px] text-slate-900"
                        style={{ fontFamily: SERIF, fontWeight: 500 }}
                    >
                        <span className="text-teal-700">{icon}</span>
                        {title}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">{subtitle}</p>
                </div>
                <button
                    type="button"
                    onClick={onClick}
                    className="text-[11.5px] text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-0.5 flex-shrink-0"
                >
                    Ouvrir
                    <IconChevronRight size={12} />
                </button>
            </header>

            <div className="p-4">
                {total === 0 ? (
                    <EmptyBlock text={emptyText} />
                ) : (
                    <>
                        <div className="flex items-center gap-4">
                            <ProgressRing
                                pct={rate ?? 0}
                                centerValue={rate === null ? UNKNOWN : `${rate}%`}
                                color={overdue > 0 ? '#F59E0B' : '#0F766E'}
                            />
                            <dl className="flex-1 min-w-0 space-y-1.5">
                                <StatRow label="Total" value={total} />
                                <StatRow label="En cours" value={open} tone={open > 0 ? 'amber' : 'neutral'} />
                                <StatRow label={overdueLabel} value={overdue} tone={overdue > 0 ? 'rose' : 'neutral'} />
                            </dl>
                        </div>

                        {/* Détail par statut — série exclusive. */}
                        <ul className="flex flex-wrap gap-x-3.5 gap-y-1.5 mt-3.5 pt-3 border-t border-slate-100">
                            {(summary?.byStatus ?? []).map((s) => (
                                <li key={s.label} className="inline-flex items-center gap-1.5 text-[11.5px]">
                                    <span
                                        className="w-2 h-2 rounded-sm flex-shrink-0"
                                        style={{ backgroundColor: colorOf(s.label) }}
                                        aria-hidden="true"
                                    />
                                    <span className="text-slate-600">{labelOf(s.label)}</span>
                                    <span className="text-slate-900 font-medium tabular-nums">{s.count ?? 0}</span>
                                </li>
                            ))}
                        </ul>

                        {footnote && (
                            <p className="text-[10.5px] text-slate-400 mt-2.5 leading-relaxed">{footnote}</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function StatRow({
    label,
    value,
    tone = 'neutral',
}: {
    label: string;
    value: number;
    tone?: 'neutral' | 'amber' | 'rose';
}) {
    const valueClass = {
        neutral: 'text-slate-900',
        amber: 'text-amber-700',
        rose: 'text-rose-700',
    }[tone];
    return (
        <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[12px] text-slate-600 truncate">{label}</dt>
            <dd className={`text-[14px] font-semibold tabular-nums flex-shrink-0 ${valueClass}`}>{value}</dd>
        </div>
    );
}

/** Anneau d'avancement — SVG pur, aucune dépendance graphique. */
function ProgressRing({
    pct,
    centerValue,
    color,
}: {
    pct: number;
    centerValue: string;
    color: string;
}) {
    const size = 78;
    const stroke = 8;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, pct));
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={`${(clamped / 100) * c} ${c}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <text
                x={size / 2}
                y={size / 2 + 5}
                textAnchor="middle"
                className="fill-slate-900"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: '16px' }}
            >
                {centerValue}
            </text>
        </svg>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Chargement du tableau de bord">
            <div className="h-[90px] rounded-xl border border-slate-200 bg-white" />
            <div className="h-[104px] rounded-xl border border-slate-200 bg-white" />
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-[200px] rounded-xl border border-slate-200 bg-white" />
                        <div className="h-[200px] rounded-xl border border-slate-200 bg-white" />
                    </div>
                    <div className="h-[190px] rounded-xl border border-slate-200 bg-white" />
                </div>
                <div className="h-[300px] rounded-xl border border-slate-200 bg-white" />
            </div>
        </div>
    );
}

function EmptyBlock({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center text-center gap-1.5 py-6">
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
                    <h3 className="flex items-center gap-1.5 text-[13.5px] text-slate-900" style={{ fontFamily: SERIF, fontWeight: 500 }}>
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
                    <div className="flex-1 h-4 rounded-full bg-slate-100 overflow-hidden relative">
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
        <div className="space-y-2.5">
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
    const r = 52;
    const cx = 78;
    const cy = 78;
    const strokeWidth = 20;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div className="flex items-center gap-5">
            <svg width="156" height="156" viewBox="0 0 156 156" className="flex-shrink-0">
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
                    <text x={cx} y={cy - 2} textAnchor="middle" className="fill-slate-900" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: '24px' }}>
                        {centerValue}
                    </text>
                )}
                {centerLabel && (
                    <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-500" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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

/**
 * Tendance mensuelle — deux aplats superposés, SANS grille de fond.
 *
 * La version précédente dessinait cinq lignes de grille horizontales et une
 * échelle Y sur une courbe dont les valeurs sont des effectifs à un chiffre :
 * le quadrillage n'ajoutait aucune précision et saturait visuellement une zone
 * de 200 px de haut. Ici la lecture fine passe par l'infobulle de chaque mois,
 * et la hauteur descend à 130 px : la forme de la courbe suffit à la lecture
 * d'ensemble, seul usage réel d'un tableau de bord de direction.
 */
function DualAreaChart({ data }: { data: MonthlyPointDTO[] }) {
    const points = useMemo(
        () =>
            (data ?? []).map((d, i) => ({
                monthIndex: i,
                month: MONTH_LABELS_FR[Math.min(11, Math.max(0, (d.month ?? 1) - 1))],
                incidents: d.incidents ?? 0,
                nearMiss: d.nearMiss ?? 0,
            })),
        [data],
    );

    if (points.length < 2) {
        return <EmptyBlock text="Série mensuelle indisponible." />;
    }

    const w = 620, h = 130, padX = 8, padTop = 12, padBottom = 20;
    // Garde anti-division par zéro : une année sans aucun événement reste lisible.
    const maxV = Math.max(1, ...points.map((d) => Math.max(d.incidents, d.nearMiss))) * 1.2;
    const stepX = (w - 2 * padX) / (points.length - 1);
    const yOf = (v: number) => h - padBottom - (v / maxV) * (h - padTop - padBottom);

    const buildPath = (key: 'incidents' | 'nearMiss') =>
        points.map((d, i) => `${i === 0 ? 'M' : 'L'} ${padX + i * stepX} ${yOf(d[key])}`).join(' ');

    const buildArea = (key: 'incidents' | 'nearMiss') =>
        `${buildPath(key)} L ${padX + (points.length - 1) * stepX} ${h - padBottom} L ${padX} ${h - padBottom} Z`;

    const totalIncidents = points.reduce((s, d) => s + d.incidents, 0);
    const totalNearMiss = points.reduce((s, d) => s + d.nearMiss, 0);

    return (
        <div>
            <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ minWidth: 420 }}>
                    <defs>
                        <linearGradient id="gradNearMiss" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.20" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gradIncidents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Ligne de base seule — aucune grille de fond. */}
                    <line
                        x1={padX}
                        x2={w - padX}
                        y1={h - padBottom}
                        y2={h - padBottom}
                        stroke="#E2E8F0"
                        strokeWidth="1"
                    />

                    <path d={buildArea('nearMiss')} fill="url(#gradNearMiss)" />
                    <path d={buildArea('incidents')} fill="url(#gradIncidents)" />
                    <path d={buildPath('nearMiss')} fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinejoin="round" />
                    <path d={buildPath('incidents')} fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinejoin="round" />

                    {points.map((d, i) => {
                        const x = padX + i * stepX;
                        return (
                            <g key={i}>
                                <circle cx={x} cy={yOf(d.nearMiss)} r="2.4" fill="#3B82F6" />
                                <circle cx={x} cy={yOf(d.incidents)} r="2.8" fill="#EF4444" />
                                <text x={x} y={h - 6} textAnchor="middle" fontSize="9.5" fill="#94A3B8">
                                    {d.month}
                                </text>
                                {/* Zone de survol pleine hauteur : la lecture fine
                                    passe par l'infobulle, non par une grille. */}
                                <title>
                                    {`${d.incidents} incident(s) · ${d.nearMiss} quasi-accident(s)`}
                                </title>
                                <rect
                                    x={x - stepX / 2}
                                    y={0}
                                    width={stepX}
                                    height={h - padBottom}
                                    fill="transparent"
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="flex items-center justify-center gap-5 mt-1 text-[11.5px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-red-500" aria-hidden="true" />
                    Incidents avérés
                    <span className="text-slate-900 font-medium tabular-nums">{totalIncidents}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-blue-500" aria-hidden="true" />
                    Quasi-accidents
                    <span className="text-slate-900 font-medium tabular-nums">{totalNearMiss}</span>
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
        <div className="space-y-2.5">
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
