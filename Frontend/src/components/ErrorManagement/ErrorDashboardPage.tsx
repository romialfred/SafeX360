import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconAlertTriangle,
    IconRefresh,
    IconShieldCheck,
    IconActivity,
    IconReportAnalytics,
    IconListSearch,
    IconChevronRight,
    IconInfoCircle,
    IconFlame,
    IconStairsUp,
} from '@tabler/icons-react';
import {
    getKpis,
    listEventTypes,
    listCriticalityMatrix,
    type ErrorKpiDTO,
    type ErrorEventType,
    type ErrorCriticalityMatrixCell,
    type CriticalityLevel,
} from '../../services/ErrorManagementService';
import {
    NAVY,
    NAVY_DEEP,
    TEAL,
    AMBER,
    STATUS_LABELS,
    STATUS_TONE,
    STATUS_FLOW,
    CRITICALITY_LABELS,
    CRITICALITY_TONE,
} from './errorManagementLabels';
import type { ErrorEventStatus } from '../../services/ErrorManagementService';

/**
 * ErrorDashboardPage — Tableau de bord exécutif du module « Gestion des Erreurs ».
 *
 * Matérialise la culture de gestion des erreurs (van Dyck & Frese) : pyramide de
 * la sécurité (presqu'accidents/accidents), criticité, maturité, causes récurrentes
 * et matrice de criticité. Charte SafeX + accent signature Navy (#1E3A5F).
 *
 * Données : /hns/error/kpis (ErrorKpiDTO) + référentiels (types, matrice). Les
 * indicateurs nécessitant des données d'exposition (TF/TG) sont explicitement
 * signalés comme dépendant de la saisie des heures travaillées / jours d'arrêt.
 */

const CRITICALITY_ORDER: CriticalityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const CRITICALITY_HEX: Record<CriticalityLevel, string> = {
    LOW: '#10B981',
    MEDIUM: '#EAB308',
    HIGH: '#F97316',
    CRITICAL: '#DC2626',
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

const ErrorDashboardPage = () => {
    const navigate = useNavigate();
    const [kpi, setKpi] = useState<ErrorKpiDTO | null>(null);
    const [types, setTypes] = useState<ErrorEventType[]>([]);
    const [matrix, setMatrix] = useState<ErrorCriticalityMatrixCell[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const [k, t, m] = await Promise.all([
                getKpis(),
                listEventTypes().catch(() => [] as ErrorEventType[]),
                listCriticalityMatrix().catch(() => [] as ErrorCriticalityMatrixCell[]),
            ]);
            setKpi(k);
            setTypes(t);
            setMatrix(m);
        } catch {
            setError(
                "Les indicateurs n'ont pas pu être chargés. Vérifiez vos droits d'accès ou réessayez.",
            );
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        load().finally(() => setLoading(false));
    }, [load]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const typeLabel = useMemo(() => {
        const map: Record<string, string> = {};
        types.forEach((t) => { map[String(t.id)] = t.label || t.code || `Type ${t.id}`; });
        return map;
    }, [types]);

    // ─── Dérivés ────────────────────────────────────────────────────────────
    const total = kpi?.total ?? 0;
    const criticalityRows = useMemo(() => {
        const c = kpi?.countByCriticality ?? {};
        const max = Math.max(1, ...CRITICALITY_ORDER.map((l) => c[l] ?? 0));
        return CRITICALITY_ORDER.map((level) => ({
            level,
            count: c[level] ?? 0,
            pct: max > 0 ? ((c[level] ?? 0) / max) * 100 : 0,
        }));
    }, [kpi]);

    const statusRows = useMemo(() => {
        const c = kpi?.countByStatus ?? {};
        const order: ErrorEventStatus[] = [...STATUS_FLOW, 'REOPENED'];
        const max = Math.max(1, ...order.map((s) => c[s] ?? 0));
        return order
            .map((s) => ({ status: s, count: c[s] ?? 0, pct: ((c[s] ?? 0) / max) * 100 }))
            .filter((r) => r.count > 0);
    }, [kpi]);

    const typeRows = useMemo(() => {
        const c = kpi?.countByEventType ?? {};
        const entries = Object.entries(c).map(([id, n]) => ({ id, label: typeLabel[id] || `Type ${id}`, count: n }));
        const max = Math.max(1, ...entries.map((e) => e.count));
        return entries.sort((a, b) => b.count - a.count).map((e) => ({ ...e, pct: (e.count / max) * 100 }));
    }, [kpi, typeLabel]);

    const recurrent = useMemo(() => {
        const list = kpi?.recurrentCauses ?? [];
        const max = Math.max(1, ...list.map((r) => r.occurrences));
        return list.slice(0, 8).map((r) => ({ ...r, pct: (r.occurrences / max) * 100 }));
    }, [kpi]);

    // Matrice 5×5 : sévérité (lignes, 5 en haut) × probabilité (colonnes, 1→5)
    const matrixGrid = useMemo(() => {
        const get = (sev: number, prob: number) =>
            matrix.find((c) => c.severityLevel === sev && c.probabilityLevel === prob) || null;
        const rows = [5, 4, 3, 2, 1].map((sev) => ({
            sev,
            cells: [1, 2, 3, 4, 5].map((prob) => get(sev, prob)),
        }));
        return rows;
    }, [matrix]);

    // ─── KPI hero ─────────────────────────────────────────────────────────────
    const heroTiles = useMemo(() => ([
        { label: 'Événements (total)', value: total, icon: IconReportAnalytics, accent: NAVY, sub: 'Tous statuts confondus' },
        { label: 'Presqu’accidents', value: kpi?.nearMissCount ?? 0, icon: IconActivity, accent: TEAL, sub: 'Signaux précurseurs' },
        { label: 'Accidents', value: kpi?.accidentCount ?? 0, icon: IconAlertTriangle, accent: '#DC2626', sub: 'Événements avérés' },
        { label: 'Haut potentiel (HiPo)', value: kpi?.hipoCount ?? 0, icon: IconShieldCheck, accent: AMBER, sub: 'Potentiel grave / mortel' },
        { label: 'Indice de maturité', value: kpi ? pct(kpi.maturityProxy) : 'n/d', icon: IconStairsUp, accent: '#0F766E', sub: 'Anonymes + presqu’accidents' },
        { label: 'CAPA en retard', value: kpi?.overdueCapa ?? 0, icon: IconFlame, accent: '#B45309', sub: 'Au-delà de l’échéance' },
    ]), [kpi, total]);

    const ratio = kpi?.nearMissAccidentRatio ?? 0;

    return (
        <div className="px-4 sm:px-5 lg:px-6 py-5 space-y-5 w-full min-h-full bg-[#FAF8F3]">

            {/* ─── En-tête (accent Navy) ─── */}
            <div className="mb-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                    <span className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${NAVY} 0%, ${TEAL} 60%, ${AMBER} 100%)` }} aria-hidden="true" />
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0" style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DEEP})`, boxShadow: `0 8px 20px -8px ${NAVY}66` }}>
                            <IconAlertTriangle size={22} stroke={1.8} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                Gestion des Erreurs · Culture apprenante
                            </p>
                            <h1 className="text-slate-900 leading-tight mt-0.5" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 'clamp(22px, 2.4vw, 28px)', letterSpacing: '-0.02em' }}>
                                Pilotage des erreurs
                            </h1>
                            <p className="text-[13px] text-slate-600 mt-1 truncate" title="Signaux faibles, criticité et maturité de la culture erreur. Démarche apprenante, non punitive.">
                                Signaux faibles, criticité et maturité de la culture erreur. Démarche apprenante, non punitive.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start">
                        <button
                            type="button"
                            onClick={() => navigate('/error-management')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <IconListSearch size={14} /> Registre des événements
                        </button>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-white transition-colors disabled:opacity-50"
                            style={{ background: NAVY }}
                        >
                            <IconRefresh size={14} className={refreshing ? 'animate-spin' : ''} /> Actualiser
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]">
                    <IconInfoCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* ─── KPI hero ─── */}
            <section className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 auto-rows-fr">
                {heroTiles.map((t) => (
                    <div key={t.label} className="relative rounded-xl border border-slate-200 bg-white pl-4 pr-3 py-3 shadow-sm overflow-hidden">
                        <span className="absolute top-0 left-0 bottom-0 w-1" style={{ background: t.accent }} aria-hidden="true" />
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${t.accent}14`, color: t.accent }}>
                                <t.icon size={15} aria-hidden="true" />
                            </span>
                            <p className="text-[10.5px] uppercase tracking-[0.08em] text-slate-500 truncate" title={t.label}>{t.label}</p>
                        </div>
                        <p className="text-slate-900 mt-1.5" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '26px', lineHeight: 1, letterSpacing: '-0.02em' }}>
                            {loading ? '…' : t.value}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={t.sub}>{t.sub}</p>
                    </div>
                ))}
            </section>

            {/* ─── Pyramide + criticité ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pyramide de la sécurité */}
                <ChartCard title="Pyramide de la sécurité" subtitle="Ratio presqu’accidents / accidents.">
                    <div className="flex items-center gap-6">
                        <div className="flex-shrink-0 text-center">
                            <p className="text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 700, fontSize: '40px', lineHeight: 1, color: NAVY }}>
                                {ratio >= 1000 ? '∞' : ratio.toFixed(1)}
                            </p>
                            <p className="text-[11px] uppercase tracking-wider text-slate-500 mt-1">presqu’accidents / accident</p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <PyramidRow label="Presqu’accidents" value={kpi?.nearMissCount ?? 0} color={TEAL} max={Math.max(1, kpi?.nearMissCount ?? 0, kpi?.accidentCount ?? 0)} width={100} />
                            <PyramidRow label="Accidents" value={kpi?.accidentCount ?? 0} color="#DC2626" max={Math.max(1, kpi?.nearMissCount ?? 0, kpi?.accidentCount ?? 0)} width={60} />
                            <PyramidRow label="À haut potentiel (HiPo)" value={kpi?.hipoCount ?? 0} color={AMBER} max={Math.max(1, kpi?.nearMissCount ?? 0, kpi?.accidentCount ?? 0)} width={38} />
                        </div>
                    </div>
                </ChartCard>

                {/* Répartition par criticité */}
                <ChartCard title="Répartition par criticité" subtitle="Criticité (gravité × probabilité) des événements.">
                    <div className="space-y-2.5">
                        {criticalityRows.map((r) => (
                            <div key={r.level} className="flex items-center gap-3">
                                <span className={`text-[12px] w-20 flex-shrink-0 ${CRITICALITY_TONE[r.level].text}`}>{CRITICALITY_LABELS[r.level]}</span>
                                <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, background: CRITICALITY_HEX[r.level] }} />
                                </div>
                                <span className="text-[12px] text-slate-900 font-medium w-8 text-right tabular-nums">{r.count}</span>
                            </div>
                        ))}
                        {total === 0 && <EmptyHint />}
                    </div>
                </ChartCard>
            </div>

            {/* ─── Matrice de criticité (cartographie thermique) + statut ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Matrice de criticité" subtitle="Cartographie thermique gravité × probabilité.">
                    {matrix.length === 0 ? <EmptyHint label="Référentiel de matrice non chargé." /> : (
                        <div className="overflow-x-auto">
                            <div className="inline-grid" style={{ gridTemplateColumns: `auto repeat(5, 40px)` }}>
                                <div />
                                {[1, 2, 3, 4, 5].map((p) => (
                                    <div key={p} className="text-center text-[10px] text-slate-500 pb-1">P{p}</div>
                                ))}
                                {matrixGrid.map((row) => (
                                    <Fragment key={`row-${row.sev}`}>
                                        <div className="text-[10px] text-slate-500 pr-2 flex items-center justify-end">G{row.sev}</div>
                                        {row.cells.map((cell, i) => {
                                            const lvl = cell?.criticalityLevel ?? null;
                                            const bg = cell?.colorHex || (lvl ? CRITICALITY_HEX[lvl] : '#E2E8F0');
                                            // Probabilité = colonne (1→5), gravité = ligne (row.sev) ;
                                            // le score gravité × probabilité lève l'ambiguïté du libellé d'une lettre.
                                            const score = row.sev * (i + 1);
                                            return (
                                                <div
                                                    key={`${row.sev}-${i}`}
                                                    className="m-0.5 h-9 rounded-md flex items-center justify-center"
                                                    style={{ background: bg }}
                                                    title={lvl ? `${CRITICALITY_LABELS[lvl]} · G${row.sev} × P${i + 1} = ${score}` : `G${row.sev} × P${i + 1} = ${score}`}
                                                >
                                                    <span className="text-[11px] font-semibold text-white/95 tabular-nums">{score}</span>
                                                </div>
                                            );
                                        })}
                                    </Fragment>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 mt-3 text-[10.5px] text-slate-500">
                                {CRITICALITY_ORDER.slice().reverse().map((l) => (
                                    <span key={l} className="inline-flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CRITICALITY_HEX[l] }} />{CRITICALITY_LABELS[l]}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </ChartCard>

                {/* Répartition par statut */}
                <ChartCard title="Répartition par statut" subtitle="Position des événements dans le cycle de vie.">
                    <div className="space-y-2">
                        {statusRows.map((r) => (
                            <div key={r.status} className="flex items-center gap-3">
                                <span className="text-[12px] text-slate-600 w-28 flex-shrink-0 truncate">{STATUS_LABELS[r.status]}</span>
                                <div className="flex-1 h-4 rounded-full bg-slate-100 overflow-hidden">
                                    <div className={`h-full rounded-full ${STATUS_TONE[r.status].dot}`} style={{ width: `${r.pct}%` }} />
                                </div>
                                <span className="text-[12px] text-slate-900 font-medium w-8 text-right tabular-nums">{r.count}</span>
                            </div>
                        ))}
                        {statusRows.length === 0 && <EmptyHint />}
                    </div>
                </ChartCard>
            </div>

            {/* ─── Causes récurrentes + types ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Causes récurrentes" subtitle="Causes les plus fréquentes.">
                    <div className="space-y-2">
                        {recurrent.map((r) => (
                            <div key={r.label} className="flex items-center gap-3">
                                <span className="text-[12px] text-slate-700 w-40 flex-shrink-0 truncate" title={r.label}>{r.label}</span>
                                <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: `linear-gradient(90deg, ${NAVY}, ${TEAL})` }} />
                                </div>
                                <span className="text-[12px] text-slate-900 font-medium w-8 text-right tabular-nums">{r.occurrences}</span>
                            </div>
                        ))}
                        {recurrent.length === 0 && <EmptyHint label="Aucune cause analysée pour l’instant." />}
                    </div>
                </ChartCard>

                <ChartCard title="Répartition par type d’événement" subtitle="Typologie des événements déclarés.">
                    <div className="space-y-2">
                        {typeRows.map((r) => (
                            <div key={r.id} className="flex items-center gap-3">
                                <span className="text-[12px] text-slate-700 w-40 flex-shrink-0 truncate" title={r.label}>{r.label}</span>
                                <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: NAVY }} />
                                </div>
                                <span className="text-[12px] text-slate-900 font-medium w-8 text-right tabular-nums">{r.count}</span>
                            </div>
                        ))}
                        {typeRows.length === 0 && <EmptyHint />}
                    </div>
                </ChartCard>
            </div>

            {/* ─── TF / TG — dépendance explicite (pas de dette silencieuse) ─── */}
            <ChartCard title="Taux de fréquence (TF) & taux de gravité (TG)" subtitle="Indicateurs réglementaires de sinistralité.">
                <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
                    <IconInfoCircle size={15} className="mt-0.5 flex-shrink-0 text-slate-500" />
                    <p className="text-[12.5px] text-slate-600 leading-relaxed">
                        Le calcul du TF (accidents × 1 000 000 / heures travaillées) et du TG (jours d’arrêt × 1 000 / heures travaillées)
                        nécessite la saisie des <strong>heures travaillées</strong> et des <strong>jours d’arrêt</strong> par période.
                        Ces données seront branchées sur le module RH et la saisie d’exposition, à activer en phase d’intégration.
                    </p>
                </div>
            </ChartCard>

            <footer className="text-center text-[10.5px] text-slate-400 leading-relaxed pt-1">
                Données agrégées du module Gestion des Erreurs. Analyse apprenante non punitive (Just Culture). La dimension disciplinaire est traitée séparément.
            </footer>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <header className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-slate-900 text-[14px]" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>{title}</h3>
                {subtitle && <p className="text-[11.5px] text-slate-500 mt-0.5 truncate" title={subtitle}>{subtitle}</p>}
            </header>
            <div className="p-4">{children}</div>
        </div>
    );
}

function PyramidRow({ label, value, color, max, width }: { label: string; value: number; color: string; max: number; width: number }) {
    const w = max > 0 ? Math.max(8, (value / max) * width) : 8;
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 flex justify-center">
                <div className="h-6 rounded flex items-center justify-center text-white text-[11px] font-medium" style={{ width: `${w}%`, background: color, minWidth: 28 }}>
                    {value}
                </div>
            </div>
            <span className="text-[11.5px] text-slate-600 w-44 flex-shrink-0">{label}</span>
        </div>
    );
}

function EmptyHint({ label = 'Aucune donnée pour la période.' }: { label?: string }) {
    return (
        <div className="flex items-center gap-2 text-[12px] text-slate-400 py-3">
            <IconChevronRight size={13} /> {label}
        </div>
    );
}

export default ErrorDashboardPage;
