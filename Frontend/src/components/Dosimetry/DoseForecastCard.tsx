/**
 * DoseForecastCard — Phase 10-B Frontend (Module Dosimetrie).
 *
 * Carte premium predisant la dose cumulee annuelle Hp(10) d'un travailleur
 * jusqu'a la fin de l'annee courante a partir de l'historique des 12 derniers
 * mois, via l'algorithme Holt-Winters (cf. {@link holtWintersForecastFull}).
 *
 * <p>Affichage :
 *   - Recharts LineChart avec deux series :
 *       * Observe (ligne pleine indigo) : cumul Hp(10) reel des mois ecoules.
 *       * Prevision (ligne pointillee orange) : projection HW jusqu'au mois 12.
 *   - Bande de confiance grise (Area shaded) +/- sigma autour de la prevision.
 *   - 3 ReferenceLine horizontales : 50%, 75% et 100% de la limite CIPR annuelle.
 *   - Badge couleur (vert / jaune / orange / rouge) reflechi sur la valeur
 *     cumulee fin d'annee predite vs limite.
 *   - Texte d'alerte preventive si la prevision depasse 90% de la limite.
 *
 * <p>RBAC : utilise les memes endpoints que DosesTab — pas de permission
 * supplementaire requise (DOSIMETRY_READ_AGGREGATE suffit cote backend).
 *
 * <p>i18n : namespace {@code dosimetry} -> bloc {@code doseForecast}.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LineChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RTooltip,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    ComposedChart,
} from 'recharts';
import {
    IconChartLine,
    IconTrendingUp,
    IconAlertTriangle,
    IconShieldCheck,
    IconInfoCircle,
} from '@tabler/icons-react';
import {
    getActiveDoseRecordsByWorker,
    type DoseRecordDTO,
} from '../../services/DosimetryService';
import { holtWintersForecastFull } from '../../utils/holtWinters';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DoseForecastCardProps {
    /** Id du travailleur expose. */
    workerId: number;
    /** Annee courante a projeter. */
    currentYear: number;
    /** Limite reglementaire annuelle Hp(10) en mSv (defaut : 20 Cat A). */
    annualLimitHp10: number;
    /** Coefficients optionnels — overridables par la page parent. */
    alpha?: number;
    beta?: number;
    gamma?: number;
    /** Hauteur du chart. Defaut 280px. */
    height?: number;
}

interface ChartRow {
    monthLabel: string;
    monthIdx: number; // 1..12
    observed: number | null;
    forecast: number | null;
    /** Bande de confiance, intervalle [lower, upper]. */
    band: [number, number] | null;
}

type Tone = 'green' | 'yellow' | 'orange' | 'red';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Resout le tone (couleur) du badge selon le ratio dose predite / limite.
 */
const resolveTone = (ratio: number): Tone => {
    if (ratio >= 0.9) return 'red';
    if (ratio >= 0.75) return 'orange';
    if (ratio >= 0.5) return 'yellow';
    return 'green';
};

const TONE_STYLE: Record<Tone, { bg: string; border: string; text: string; dot: string }> = {
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', dot: 'bg-orange-500' },
    red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', dot: 'bg-red-600' },
};

/**
 * Construit la serie observee = cumul mensuel Hp(10) du worker pour l'annee
 * courante. Les mois non encore renseignes sont laisses null.
 */
const buildObservedSeries = (
    records: DoseRecordDTO[],
    year: number,
): Array<number | null> => {
    const monthly: number[] = new Array(12).fill(0);
    const hasValue: boolean[] = new Array(12).fill(false);
    for (const r of records) {
        if (!r.period || typeof r.period !== 'string') continue;
        const [yStr, mStr] = r.period.split('-');
        const y = Number(yStr);
        const m = Number(mStr);
        if (y !== year || !Number.isFinite(m) || m < 1 || m > 12) continue;
        const idx = m - 1;
        const dose = Number(r.hp10 ?? 0);
        if (Number.isFinite(dose) && dose > 0) {
            monthly[idx] += dose;
            hasValue[idx] = true;
        }
    }
    let cumul = 0;
    const result: Array<number | null> = new Array(12).fill(null);
    for (let i = 0; i < 12; i += 1) {
        if (hasValue[i]) {
            cumul += monthly[i];
            result[i] = cumul;
        } else if (i > 0 && hasValue[i - 1]) {
            // Trou sans data : on conserve null pour clarte UX.
            result[i] = null;
        }
    }
    return result;
};

/**
 * Construit la serie historique des 12 derniers mois (cross-year) servant
 * de base au modele Holt-Winters. On utilise des doses mensuelles brutes
 * (pas cumul) pour ne pas biaiser le modele avec une derivee artificielle.
 */
const buildMonthlyHistory = (
    records: DoseRecordDTO[],
    refYear: number,
): number[] => {
    const arr: number[] = new Array(12).fill(0);
    // 12 mois precedant decembre de l'annee precedente, jusqu'a decembre refYear-1
    const refYearMonths: string[] = [];
    for (let m = 1; m <= 12; m += 1) {
        refYearMonths.push(`${refYear - 1}-${String(m).padStart(2, '0')}`);
    }
    const byPeriod: Record<string, number> = {};
    for (const r of records) {
        if (!r.period || typeof r.period !== 'string') continue;
        const dose = Number(r.hp10 ?? 0);
        if (!Number.isFinite(dose) || dose <= 0) continue;
        byPeriod[r.period] = (byPeriod[r.period] ?? 0) + dose;
    }
    for (let i = 0; i < 12; i += 1) {
        arr[i] = byPeriod[refYearMonths[i]] ?? 0;
    }
    return arr;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const DoseForecastCard = ({
    workerId,
    currentYear,
    annualLimitHp10,
    alpha = 0.3,
    beta = 0.1,
    gamma = 0.1,
    height = 280,
}: DoseForecastCardProps) => {
    const { t } = useTranslation('dosimetry');
    const [records, setRecords] = useState<DoseRecordDTO[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // ─── Fetch ──────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        if (workerId == null || !Number.isFinite(workerId)) return;
        setLoading(true);
        setError(null);
        getActiveDoseRecordsByWorker(workerId)
            .then((res) => {
                if (cancelled) return;
                const list: DoseRecordDTO[] = Array.isArray(res)
                    ? res
                    : (res?.content ?? []);
                setRecords(list);
            })
            .catch(() => {
                if (cancelled) return;
                setError(t('doseForecast.errors.loadFailed'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [workerId, t]);

    // ─── Compute ────────────────────────────────────────────────────────
    const { rows, predictedEoy, tone, lastObservedIdx } = useMemo(() => {
        if (!records || records.length === 0) {
            return {
                rows: [] as ChartRow[],
                predictedEoy: 0,
                tone: 'green' as Tone,
                lastObservedIdx: -1,
            };
        }
        const observed = buildObservedSeries(records, currentYear);
        const lastIdx = (() => {
            for (let i = 11; i >= 0; i -= 1) {
                if (observed[i] != null) return i;
            }
            return -1;
        })();
        const monthsRemaining = lastIdx >= 0 ? 11 - lastIdx : 12;

        // Historique pour Holt-Winters : doses mensuelles brutes annee precedente.
        const history = buildMonthlyHistory(records, currentYear);
        const hwResult = holtWintersForecastFull(
            history,
            monthsRemaining,
            alpha,
            beta,
            gamma,
            12,
        );
        const monthlyForecast = hwResult.forecast.map((v) => Math.max(0, v));
        const sigma = hwResult.sigma;

        const currentCumul = lastIdx >= 0 ? (observed[lastIdx] ?? 0) : 0;
        const rowsBuilt: ChartRow[] = [];
        let runningForecastCumul = currentCumul;
        let bandRunning = currentCumul;
        for (let i = 0; i < 12; i += 1) {
            const obs = observed[i];
            let forecastValue: number | null = null;
            let band: [number, number] | null = null;
            if (i === lastIdx && obs != null) {
                // Point de jonction : on positionne le start de la forecast.
                forecastValue = obs;
                band = [obs, obs];
                runningForecastCumul = obs;
                bandRunning = obs;
            } else if (i > lastIdx) {
                const step = monthlyForecast[i - lastIdx - 1] ?? 0;
                runningForecastCumul += step;
                bandRunning += step;
                // Bande de confiance : croit lineairement avec h * sigma.
                const h = i - lastIdx;
                const halfWidth = sigma * Math.sqrt(h);
                forecastValue = runningForecastCumul;
                band = [
                    Math.max(0, runningForecastCumul - halfWidth),
                    runningForecastCumul + halfWidth,
                ];
            }
            rowsBuilt.push({
                monthLabel: MONTHS[i],
                monthIdx: i + 1,
                observed: obs,
                forecast: forecastValue,
                band,
            });
        }

        const eoy =
            lastIdx >= 11
                ? currentCumul
                : runningForecastCumul;
        const ratio = annualLimitHp10 > 0 ? eoy / annualLimitHp10 : 0;
        return {
            rows: rowsBuilt,
            predictedEoy: eoy,
            tone: resolveTone(ratio),
            lastObservedIdx: lastIdx,
        };
    }, [records, currentYear, alpha, beta, gamma, annualLimitHp10]);

    const toneStyle = TONE_STYLE[tone];
    const ratioPct =
        annualLimitHp10 > 0 ? Math.round((predictedEoy / annualLimitHp10) * 100) : 0;

    // ─── Chart data pour Recharts (transforme band en deux series) ──────
    const chartData = useMemo(
        () =>
            rows.map((r) => ({
                monthLabel: r.monthLabel,
                observed: r.observed,
                forecast: r.forecast,
                bandLower: r.band ? r.band[0] : null,
                bandUpper: r.band ? r.band[1] : null,
            })),
        [rows],
    );

    // ─── Render ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="h-5 w-48 bg-slate-100 rounded animate-pulse mb-3" />
                <div className="h-[260px] w-full bg-slate-50 rounded animate-pulse" />
            </div>
        );
    }

    if (error) {
        return (
            <div
                role="alert"
                className="bg-white border border-red-200 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start gap-3"
            >
                <IconAlertTriangle size={18} stroke={1.8} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-[12.5px] text-red-800">{error}</div>
            </div>
        );
    }

    if (rows.length === 0 || lastObservedIdx < 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700">
                        <IconChartLine size={14} stroke={1.8} />
                    </span>
                    <h3 className="text-[14px] font-semibold text-slate-800">
                        {t('doseForecast.title')}
                    </h3>
                </div>
                <p className="text-[12.5px] text-slate-500 flex items-center gap-1.5">
                    <IconInfoCircle size={13} stroke={1.8} className="text-slate-400" />
                    {t('doseForecast.empty')}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="relative px-4 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-br from-indigo-50/40 to-white">
                <div
                    className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                    aria-hidden="true"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700">
                            <IconTrendingUp size={14} stroke={1.8} />
                        </span>
                        <div>
                            <h3 className="text-[14px] font-semibold text-slate-800 leading-tight">
                                {t('doseForecast.title')}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                {t('doseForecast.subtitle', { year: currentYear })}
                            </p>
                        </div>
                    </div>
                    <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${toneStyle.bg} ${toneStyle.border} ${toneStyle.text}`}
                        aria-label={t('doseForecast.badgeAria', { pct: ratioPct })}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${toneStyle.dot}`} aria-hidden="true" />
                        <span className="text-[11.5px] font-semibold tabular-nums">
                            {predictedEoy.toFixed(2)} mSv ({ratioPct}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="px-3 sm:px-4 pt-3 pb-2" style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 6, right: 16, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="monthLabel"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            stroke="#cbd5e1"
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            stroke="#cbd5e1"
                            unit=" mSv"
                            width={60}
                        />
                        <RTooltip
                            formatter={(value: any, name: string) => {
                                if (value == null) return ['—', name];
                                return [`${Number(value).toFixed(2)} mSv`, name];
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                            iconType="line"
                        />

                        {/* Lignes de reference CIPR */}
                        <ReferenceLine
                            y={annualLimitHp10 * 0.5}
                            stroke="#16a34a"
                            strokeDasharray="4 4"
                            label={{
                                value: t('doseForecast.refLines.p50'),
                                position: 'right',
                                fontSize: 9,
                                fill: '#16a34a',
                            }}
                        />
                        <ReferenceLine
                            y={annualLimitHp10 * 0.75}
                            stroke="#d97706"
                            strokeDasharray="4 4"
                            label={{
                                value: t('doseForecast.refLines.p75'),
                                position: 'right',
                                fontSize: 9,
                                fill: '#d97706',
                            }}
                        />
                        <ReferenceLine
                            y={annualLimitHp10}
                            stroke="#dc2626"
                            strokeDasharray="4 4"
                            label={{
                                value: t('doseForecast.refLines.p100', { limit: annualLimitHp10 }),
                                position: 'right',
                                fontSize: 9,
                                fill: '#dc2626',
                            }}
                        />

                        {/* Bande de confiance (Area entre bandLower et bandUpper) */}
                        <Area
                            type="monotone"
                            dataKey="bandUpper"
                            stroke="none"
                            fill="#cbd5e1"
                            fillOpacity={0.35}
                            name={t('doseForecast.legend.bandUpper')}
                            legendType="none"
                            isAnimationActive={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="bandLower"
                            stroke="none"
                            fill="#ffffff"
                            fillOpacity={1}
                            name={t('doseForecast.legend.bandLower')}
                            legendType="none"
                            isAnimationActive={false}
                        />

                        {/* Serie observee */}
                        <Line
                            type="monotone"
                            dataKey="observed"
                            stroke="#4f46e5"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#4f46e5' }}
                            activeDot={{ r: 5 }}
                            name={t('doseForecast.legend.observed')}
                            connectNulls={false}
                            isAnimationActive={false}
                        />

                        {/* Serie prevision (pointillee) */}
                        <Line
                            type="monotone"
                            dataKey="forecast"
                            stroke="#ea580c"
                            strokeWidth={2}
                            strokeDasharray="5 4"
                            dot={{ r: 2.5, fill: '#ea580c' }}
                            activeDot={{ r: 4 }}
                            name={t('doseForecast.legend.forecast')}
                            connectNulls={false}
                            isAnimationActive={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Footer alerte */}
            <div
                className={`px-4 sm:px-5 py-3 border-t border-slate-100 flex items-start gap-2.5 text-[12px] ${
                    tone === 'red' ? 'bg-red-50/60' : 'bg-slate-50/60'
                }`}
            >
                {tone === 'red' ? (
                    <>
                        <IconAlertTriangle
                            size={14}
                            stroke={1.8}
                            className="text-red-600 flex-shrink-0 mt-0.5"
                        />
                        <p className="text-red-800 leading-relaxed">
                            <span className="font-semibold">{t('doseForecast.alertTitle')}</span>{' '}
                            {t('doseForecast.alertMessage', {
                                predicted: predictedEoy.toFixed(2),
                                limit: annualLimitHp10,
                            })}
                        </p>
                    </>
                ) : (
                    <>
                        <IconShieldCheck
                            size={14}
                            stroke={1.8}
                            className="text-slate-500 flex-shrink-0 mt-0.5"
                        />
                        <p className="text-slate-600 leading-relaxed">
                            {t('doseForecast.helper')}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default DoseForecastCard;
