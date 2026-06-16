import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    IconAlertTriangle,
    IconClipboardCheck,
    IconReportAnalytics,
    IconShieldCheck,
    IconSparkles,
    IconCircleCheck,
    IconClock,
    IconActivity,
    IconBolt,
    IconChevronRight,
    IconChevronDown,
    IconFilter,
    IconX,
} from "@tabler/icons-react";

/**
 * SafeX 360 — Tableau de bord HSE exécutif (LOT 41 refonte BI).
 *
 * Inspiré du design "AHTLETE INJURY" (filtres latéraux + KPI top + grille
 * de graphiques + colonne d'alertes). Vision exécutive consolidée sur les
 * indicateurs HSE clés pour qu'un dirigeant comprenne la posture sécurité
 * de l'entreprise en moins de 10 secondes.
 *
 * Couches du tableau de bord :
 *   1. KPI bar : 4 indicateurs sentinelles (TF, TG, NM, Jours sans incident)
 *   2. Filtres latéraux (mine, période, gravité, département)
 *   3. Charts grid 2×2 : type d'incidents, mines, tendance mensuelle, risques
 *   4. Right column : alertes HSE actives + donut clôture CAPA
 *
 * Données fictives crédibles (mois en cours, mine Citizen Mining).
 * Toutes les visualisations sont en SVG inline (zéro dépendance lib).
 */

// ─────────────────────────────────────────────────────────────────────────────
//   DONNÉES MOCK (à brancher sur API en Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

const KPI_DATA = [
    {
        label: 'Incidents totaux YTD',
        value: '47',
        unit: '',
        delta: -18,
        deltaLabel: 'vs N-1',
        deltaGoodIfDown: true,
        icon: IconAlertTriangle,
        color: 'red',
    },
    {
        label: 'Taux de fréquence LTI',
        value: '1,2',
        unit: '/ 200 000h',
        delta: -0.8,
        deltaLabel: 'cible 2,0',
        deltaGoodIfDown: true,
        icon: IconActivity,
        color: 'amber',
    },
    {
        label: 'Quasi-accidents recensés',
        value: '128',
        unit: '/ trimestre',
        delta: 24,
        deltaLabel: 'culture sécurité ↑',
        deltaGoodIfDown: false, // déclarer + de near miss = positif
        icon: IconReportAnalytics,
        color: 'blue',
    },
    {
        label: 'Jours sans incident grave',
        value: '47',
        unit: 'jours',
        delta: 47,
        deltaLabel: 'record 92j',
        deltaGoodIfDown: false,
        icon: IconShieldCheck,
        color: 'emerald',
    },
];

const INCIDENT_BY_TYPE = [
    { label: 'Chute objet', count: 12, pct: 25.5 },
    { label: 'Glissade',    count: 9,  pct: 19.1 },
    { label: 'Chimique',    count: 7,  pct: 14.9 },
    { label: 'Équipement',  count: 6,  pct: 12.8 },
    { label: 'Routier',     count: 5,  pct: 10.6 },
    { label: 'Électrique',  count: 4,  pct: 8.5 },
    { label: 'Autre',       count: 4,  pct: 8.5 },
];

const INCIDENT_BY_MINE = [
    { label: 'Citizen Mining',     count: 28, pct: 59.6, color: '#0F766E' },
    { label: 'National Mining Co', count: 13, pct: 27.7, color: '#0EA5E9' },
    { label: 'Other sites',        count: 6,  pct: 12.8, color: '#94A3B8' },
];

const MONTHLY_TREND = [
    { month: 'Janv', incidents: 8, nearMiss: 24 },
    { month: 'Févr', incidents: 6, nearMiss: 31 },
    { month: 'Mars', incidents: 9, nearMiss: 28 },
    { month: 'Avr',  incidents: 5, nearMiss: 35 },
    { month: 'Mai',  incidents: 7, nearMiss: 42 },
    { month: 'Juin', incidents: 4, nearMiss: 38 },
    { month: 'Juil', incidents: 3, nearMiss: 45 },
    { month: 'Août', incidents: 5, nearMiss: 41 },
];

const RISK_LEVEL = [
    { label: 'Faible',  count: 142, pct: 65, color: '#10B981' },
    { label: 'Modéré',  count: 56,  pct: 26, color: '#F59E0B' },
    { label: 'Élevé',   count: 14,  pct: 6,  color: '#EF4444' },
    { label: 'Critique', count: 6,  pct: 3,  color: '#7F1D1D' },
];

const RECOVERY_OUTCOME = [
    { label: 'Clôturé (efficacité ok)', count: 187, pct: 79, color: '#10B981' },
    { label: 'Clôturé (sans vérif)',    count: 35,  pct: 15, color: '#F59E0B' },
    { label: 'Rouvert / en suivi',      count: 14,  pct: 6,  color: '#EF4444' },
];

const MEDICAL_ALERTS = [
    {
        priority: 'high' as const,
        title: 'Pic de glissades — atelier maintenance',
        count: '+340%',
        description: 'Sur 14 jours, 5 glissades. Augmenter EPI antidérapants.',
    },
    {
        priority: 'medium' as const,
        title: 'Recommandations audit ISO en retard',
        count: '8 ouvertes',
        description: 'Audit Q1 - 8 actions correctives au-delà de leur échéance.',
    },
    {
        priority: 'medium' as const,
        title: 'Habilitations expirées',
        count: '12 employés',
        description: 'Travaux en hauteur — formation à reconduire avant juillet.',
    },
    {
        priority: 'low' as const,
        title: 'Stocks EPI sous seuil',
        count: '3 réf.',
        description: 'Masques FFP3, gants kevlar, casques avec jugulaire.',
    },
];

const FILTERS = {
    mines:      ['Toutes les mines', 'Citizen Mining', 'National Mining Co'],
    periods:    ['12 derniers mois', '3 derniers mois', 'Trimestre en cours', 'Mois en cours'],
    severities: ['Toutes', 'Critique', 'Élevé', 'Modéré', 'Faible'],
    departments:['Tous départements', 'Maintenance', 'Production', 'Logistique', 'Géologie'],
};

/** Valeur « tout afficher » de chaque filtre — sert de référence pour compter
 *  les filtres réellement actifs et pour la réinitialisation. */
const DEFAULT_FILTERS = {
    mine: FILTERS.mines[0],
    period: FILTERS.periods[0],
    severity: FILTERS.severities[0],
    department: FILTERS.departments[0],
};

// ─────────────────────────────────────────────────────────────────────────────
//   COULEURS PAR KPI
// ─────────────────────────────────────────────────────────────────────────────
const KPI_COLOR_MAP: Record<string, { bg: string; border: string; iconBg: string; iconText: string; barColor: string }> = {
    red:     { bg: 'bg-red-50',     border: 'border-red-200',     iconBg: 'bg-red-100',     iconText: 'text-red-700',     barColor: 'bg-red-500' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   iconBg: 'bg-amber-100',   iconText: 'text-amber-700',   barColor: 'bg-amber-500' },
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    iconBg: 'bg-blue-100',    iconText: 'text-blue-700',    barColor: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', barColor: 'bg-emerald-500' },
};

const ALERT_TONE_MAP = {
    high:   { border: 'border-red-200',    bg: 'bg-red-50',    dot: 'bg-red-500',    text: 'text-red-700' },
    medium: { border: 'border-amber-200',  bg: 'bg-amber-50',  dot: 'bg-amber-500',  text: 'text-amber-700' },
    low:    { border: 'border-slate-200',  bg: 'bg-slate-50',  dot: 'bg-slate-500',  text: 'text-slate-700' },
};

// ─────────────────────────────────────────────────────────────────────────────
//   PAGE
// ─────────────────────────────────────────────────────────────────────────────

const OhsDashboardPage = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const totalIncidents = useMemo(
        () => INCIDENT_BY_TYPE.reduce((s, x) => s + x.count, 0),
        [],
    );

    // Nombre de filtres réellement actifs (≠ valeur « tout afficher »).
    const activeFilters = useMemo(
        () => ([
            { key: 'mine' as const,       value: filters.mine,       def: DEFAULT_FILTERS.mine },
            { key: 'period' as const,     value: filters.period,     def: DEFAULT_FILTERS.period },
            { key: 'severity' as const,   value: filters.severity,   def: DEFAULT_FILTERS.severity },
            { key: 'department' as const, value: filters.department, def: DEFAULT_FILTERS.department },
        ]).filter((f) => f.value !== f.def),
        [filters],
    );
    const activeCount = activeFilters.length;

    return (
        <div className="px-6 lg:px-8 py-5 space-y-5 w-full bg-[#FAF8F3] min-h-full">

            {/* ─── En-tête : titre + sous-titre + chrono ───────────────── */}
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
                        Pilotage opérationnel multi-sites — indicateurs sentinelles, distribution des risques et alertes prioritaires.
                    </p>
                </div>
                <div className="flex items-center gap-3 self-start md:self-end">
                    <span className="text-[12px] text-slate-500 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                        Dernière maj · {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>

                    {/* ─── Bouton Filtres + panneau déroulant ─── */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setFiltersOpen((o) => !o)}
                            aria-expanded={filtersOpen}
                            aria-haspopup="dialog"
                            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                                filtersOpen || activeCount > 0
                                    ? 'border-teal-300 bg-teal-50 text-teal-800'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <IconFilter size={15} aria-hidden="true" />
                            Filtres
                            {activeCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-teal-600 text-white text-[10.5px] font-semibold tabular-nums">
                                    {activeCount}
                                </span>
                            )}
                            <IconChevronDown
                                size={14}
                                className={`text-slate-400 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                            />
                        </button>

                        {filtersOpen && (
                            <>
                                {/* Couche de fermeture au clic extérieur */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setFiltersOpen(false)}
                                    aria-hidden="true"
                                />
                                {/* Panneau */}
                                <div
                                    role="dialog"
                                    aria-label="Filtres du tableau de bord"
                                    className="absolute right-0 z-50 mt-2 w-[300px] rounded-xl border border-slate-200 bg-white shadow-xl p-4 origin-top-right"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                            Filtrer le tableau de bord
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setFiltersOpen(false)}
                                            className="text-slate-400 hover:text-slate-700 transition-colors"
                                            aria-label="Fermer les filtres"
                                        >
                                            <IconX size={15} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {([
                                            { key: 'mine',       label: 'Mine',       options: FILTERS.mines },
                                            { key: 'period',     label: 'Période',    options: FILTERS.periods },
                                            { key: 'severity',   label: 'Gravité',    options: FILTERS.severities },
                                            { key: 'department', label: 'Département', options: FILTERS.departments },
                                        ] as const).map((g) => (
                                            <FilterSelect
                                                key={g.key}
                                                label={g.label}
                                                value={filters[g.key]}
                                                options={g.options}
                                                onChange={(v) => setFilters((f) => ({ ...f, [g.key]: v }))}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setFilters(DEFAULT_FILTERS)}
                                            disabled={activeCount === 0}
                                            className="text-[12px] text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Réinitialiser
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFiltersOpen(false)}
                                            className="rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[12.5px] font-medium px-4 py-1.5 transition-colors"
                                        >
                                            Appliquer
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ─── Bandeau filtres actifs (chips) ─────────────────────── */}
            {activeCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        Filtres actifs
                    </span>
                    {activeFilters.map((f) => (
                        <span
                            key={f.key}
                            className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 pl-2.5 pr-1.5 py-1 text-[12px] text-teal-800"
                        >
                            {f.value}
                            <button
                                type="button"
                                onClick={() => setFilters((prev) => ({ ...prev, [f.key]: DEFAULT_FILTERS[f.key] }))}
                                className="text-teal-500 hover:text-teal-900 transition-colors"
                                aria-label={`Retirer le filtre ${f.value}`}
                            >
                                <IconX size={12} />
                            </button>
                        </span>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFilters(DEFAULT_FILTERS)}
                        className="text-[11.5px] text-slate-500 hover:text-slate-900 underline underline-offset-2 transition-colors"
                    >
                        Tout effacer
                    </button>
                </div>
            )}

            {/* ─── KPI BAR — 4 indicateurs sentinelles ─────────────────── */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {KPI_DATA.map((kpi) => {
                    const c = KPI_COLOR_MAP[kpi.color];
                    const isPositive = kpi.deltaGoodIfDown ? kpi.delta < 0 : kpi.delta > 0;
                    return (
                        <div
                            key={kpi.label}
                            className={`relative rounded-xl border ${c.border} bg-white p-4 overflow-hidden hover:shadow-md transition-shadow`}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.barColor}`} aria-hidden="true" />
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                                <div className={`p-2 rounded-lg ${c.iconBg} ${c.iconText}`}>
                                    <kpi.icon size={18} aria-hidden="true" />
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                        isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                    }`}
                                >
                                    {kpi.delta > 0 ? '+' : ''}{kpi.delta}
                                </span>
                            </div>
                            <p className="text-[11.5px] uppercase tracking-[0.1em] text-slate-500">
                                {kpi.label}
                            </p>
                            <p className="flex items-baseline gap-1.5 mt-1">
                                <span
                                    className="text-slate-900"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: '34px',
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1,
                                    }}
                                >
                                    {kpi.value}
                                </span>
                                {kpi.unit && (
                                    <span className="text-[12px] text-slate-500">{kpi.unit}</span>
                                )}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                                {kpi.deltaLabel}
                            </p>
                        </div>
                    );
                })}
            </section>

            {/* ─── BODY : grille de graphiques + colonne d'alertes ───── */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4">

                {/* ===== GRILLE CHARTS (gauche) ===== */}
                <div className="space-y-4 min-w-0">

                    {/* Row 1 : Distribution par type + Distribution par mine */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ChartCard
                            title="Distribution des incidents par type"
                            subtitle={`Total : ${totalIncidents} incidents · ${filters.period}`}
                            icon={<IconAlertTriangle size={14} />}
                        >
                            <HorizontalBars data={INCIDENT_BY_TYPE} />
                        </ChartCard>

                        <ChartCard
                            title="Répartition par site minier"
                            subtitle="Périmètre : tous départements"
                            icon={<IconShieldCheck size={14} />}
                        >
                            <DonutChart data={INCIDENT_BY_MINE} centerLabel="Total" centerValue={totalIncidents.toString()} />
                        </ChartCard>
                    </div>

                    {/* Row 2 : Trend mensuel large */}
                    <ChartCard
                        title="Tendance mensuelle — incidents vs quasi-accidents"
                        subtitle="8 derniers mois · meilleur ratio = + de quasi-accidents (signalement proactif)"
                        icon={<IconActivity size={14} />}
                    >
                        <DualLineChart data={MONTHLY_TREND} />
                    </ChartCard>

                    {/* Row 3 : Risk level + Recovery outcome */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ChartCard
                            title="Niveau de risque (registre)"
                            subtitle="Risques résiduels post-traitement"
                            icon={<IconBolt size={14} />}
                        >
                            <RiskLevelBars data={RISK_LEVEL} />
                        </ChartCard>

                        <ChartCard
                            title="Devenir des actions correctives"
                            subtitle="CAPA · 12 derniers mois"
                            icon={<IconCircleCheck size={14} />}
                        >
                            <DonutChart
                                data={RECOVERY_OUTCOME}
                                centerLabel="CAPA"
                                centerValue={`${RECOVERY_OUTCOME.reduce((s, r) => s + r.count, 0)}`}
                            />
                        </ChartCard>
                    </div>
                </div>

                {/* ===== ALERTES (droite) ===== */}
                <aside className="bg-white rounded-xl border border-slate-200 p-4 h-fit">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            Alertes HSE
                        </h2>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-medium">
                            {MEDICAL_ALERTS.length} actives
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {MEDICAL_ALERTS.map((alert, i) => {
                            const tone = ALERT_TONE_MAP[alert.priority];
                            return (
                                <div
                                    key={i}
                                    className={`p-3 rounded-lg border ${tone.border} ${tone.bg}`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
                                            <p className={`text-[12px] font-medium ${tone.text}`}>{alert.count}</p>
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-slate-900 leading-tight">
                                        {alert.title}
                                    </p>
                                    <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                                        {alert.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Synthèse */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mb-2 flex items-center gap-1.5">
                            <IconSparkles size={11} aria-hidden="true" />
                            Synthèse exécutive
                        </p>
                        <p className="text-[12.5px] text-slate-600 leading-relaxed">
                            Tendance globale en baisse (<span className="text-emerald-700 font-medium">−18 %</span>),
                            mais vigilance sur le pic de glissades en maintenance.
                            La culture proactive s'améliore (+24 % near miss).
                        </p>
                    </div>
                </aside>
            </div>

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
                            className={`group bg-white rounded-lg border border-slate-200 hover:border-${q.tone}-300 hover:shadow-md transition-all px-3 py-2.5 flex items-center justify-between gap-2 text-left`}
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
//   SOUS-COMPOSANTS : Card + Charts SVG inline
// ─────────────────────────────────────────────────────────────────────────────

/** Liste déroulante raffinée (select natif stylé + chevron). */
function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: readonly string[];
    onChange: (v: string) => void;
}) {
    return (
        <label className="block">
            <span className="block text-[11px] font-medium text-slate-600 mb-1">{label}</span>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 py-2 text-[13px] text-slate-800 cursor-pointer hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-colors"
                >
                    {options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                    ))}
                </select>
                <IconChevronDown
                    size={15}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                />
            </div>
        </label>
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

function HorizontalBars({ data }: { data: Array<{ label: string; count: number; pct: number }> }) {
    const maxPct = Math.max(...data.map((d) => d.pct));
    return (
        <div className="space-y-2">
            {data.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                    <span className="text-[12px] text-slate-700 w-24 flex-shrink-0 truncate">
                        {d.label}
                    </span>
                    <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden relative">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${(d.pct / maxPct) * 100}%`,
                                background: 'linear-gradient(90deg, #0F766E 0%, #14B8A6 100%)',
                            }}
                        />
                    </div>
                    <span className="text-[12px] text-slate-900 font-medium w-12 text-right tabular-nums">
                        {d.pct.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-slate-400 w-6 text-right tabular-nums">
                        {d.count}
                    </span>
                </div>
            ))}
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

function DualLineChart({ data }: { data: Array<{ month: string; incidents: number; nearMiss: number }> }) {
    const w = 600, h = 200, pad = 30;
    const maxV = Math.max(...data.map((d) => Math.max(d.incidents, d.nearMiss))) * 1.15;
    const stepX = (w - 2 * pad) / (data.length - 1);

    const pathIncidents = data
        .map((d, i) => {
            const x = pad + i * stepX;
            const y = h - pad - (d.incidents / maxV) * (h - 2 * pad);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

    const pathNearMiss = data
        .map((d, i) => {
            const x = pad + i * stepX;
            const y = h - pad - (d.nearMiss / maxV) * (h - 2 * pad);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

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
                {data.map((d, i) => (
                    <text key={d.month} x={pad + i * stepX} y={h - pad + 14} textAnchor="middle" fontSize="10" fill="#64748B">
                        {d.month}
                    </text>
                ))}
                {/* Near miss area */}
                <path d={`${pathNearMiss} L ${pad + (data.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`} fill="rgba(59,130,246,0.08)" />
                {/* Lines */}
                <path d={pathNearMiss} fill="none" stroke="#3B82F6" strokeWidth="2" />
                <path d={pathIncidents} fill="none" stroke="#EF4444" strokeWidth="2.5" />
                {/* Points */}
                {data.map((d, i) => {
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
                            <span className="ml-1.5 text-slate-400">({d.pct}%)</span>
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
