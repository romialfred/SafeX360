/**
 * MultiMineComparisonCard — Comparatif KPI cross-tenant (Phase 8 Frontend).
 *
 * <p>Grille de cards 2 colonnes par mine. Pour chaque mine on affiche
 *   - libelle / id
 *   - {@code workersCount}
 *   - dose annuelle moyenne (mSv)
 *   - dose max (mSv)
 *   - workers en surexposition ({@code workersOver100Pct})
 *   - alertes actives + dossiers ouverts
 *
 * <p>Clic mine -> callback {@code onSelectMine(mineId)} -> le parent peut
 * filtrer le dashboard sur cette mine. La card courante (selectedMineId) est
 * surlignee en violet.
 */

import { memo } from 'react';
import {
    IconBuildingFactory2,
    IconUsersGroup,
    IconAlertOctagon,
    IconFolderOpen,
    IconActivity,
    IconArrowUpRight,
} from '@tabler/icons-react';
import type { DosimetryMineComparisonDTO } from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MultiMineComparisonCardProps {
    data: DosimetryMineComparisonDTO[];
    loading?: boolean;
    /** Mine courante (affichage selected). */
    selectedMineId?: number | null;
    /** Callback de selection. */
    onSelectMine?: (mineId: number) => void;
    /** Resolution optionnelle id -> label (sinon affiche "Mine #id"). */
    mineLabels?: Record<number, string>;
    /** Libelles i18n. */
    labels?: {
        title?: string;
        subtitle?: string;
        workers?: string;
        avgDose?: string;
        maxDose?: string;
        over100?: string;
        alerts?: string;
        cases?: string;
        empty?: string;
        loadingText?: string;
        unitMsv?: string;
        currentBadge?: string;
        clickHint?: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatMsv = (v: number | null | undefined): string => {
    if (v == null) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(2);
};

const formatInt = (v: number | null | undefined): string => {
    if (v == null) return '0';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return '0';
    return n.toLocaleString('fr-FR');
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sous-composant : MineCard
// ─────────────────────────────────────────────────────────────────────────────

interface MineCardProps {
    mine: DosimetryMineComparisonDTO;
    selected: boolean;
    label: string;
    onClick?: () => void;
    labels: MultiMineComparisonCardProps['labels'];
}

function MineCard({ mine, selected, label, onClick, labels }: MineCardProps) {
    const isInteractive = typeof onClick === 'function';
    const hasOverexposure = mine.workersOver100Pct > 0;
    const hasOpenCases = mine.overexposureCasesOpen > 0;
    const hasAlerts = mine.activeAlertsCount > 0;
    const criticalCount = Number(mine.workersOver100Pct ?? 0) + Number(mine.overexposureCasesOpen ?? 0);

    const cardBase = `relative bg-white rounded-xl border shadow-sm overflow-hidden transition group ${
        selected
            ? 'border-violet-300 ring-2 ring-violet-200'
            : hasOverexposure
              ? 'border-red-200'
              : 'border-slate-200'
    } ${isInteractive ? 'cursor-pointer hover:shadow-md hover:border-violet-300' : ''}`;

    const content = (
        <>
            {/* Accent top stripe */}
            <span
                className={`absolute top-0 left-0 right-0 h-1 ${
                    hasOverexposure
                        ? 'bg-gradient-to-r from-red-500 to-rose-600'
                        : hasAlerts
                          ? 'bg-gradient-to-r from-orange-400 to-amber-500'
                          : 'bg-gradient-to-r from-violet-400 to-indigo-500'
                }`}
                aria-hidden="true"
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-4 pt-5">
                <div className="flex items-start gap-2.5 min-w-0">
                    <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            selected ? 'bg-violet-100' : 'bg-slate-100'
                        }`}
                    >
                        <IconBuildingFactory2
                            size={18}
                            stroke={1.8}
                            className={selected ? 'text-violet-700' : 'text-slate-700'}
                        />
                    </div>
                    <div className="min-w-0">
                        <p
                            className="text-[14px] font-semibold text-slate-900 leading-tight truncate"
                            title={label}
                        >
                            {label}
                        </p>
                        <p className="text-[10.5px] uppercase tracking-[0.12em] text-slate-500 mt-0.5">
                            ID #{mine.mineId}
                        </p>
                    </div>
                </div>
                {selected && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-[0.10em] font-bold bg-violet-100 text-violet-800 border border-violet-200 flex-shrink-0">
                        {labels?.currentBadge ?? 'Active'}
                    </span>
                )}
            </div>

            {/* Body : KPI mini-grid */}
            <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                <div className="px-2.5 py-2 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center gap-1 mb-0.5">
                        <IconUsersGroup size={11} stroke={1.7} className="text-slate-500" />
                        <span className="text-[9.5px] uppercase tracking-[0.10em] text-slate-500 font-semibold">
                            {labels?.workers ?? 'Workers'}
                        </span>
                    </div>
                    <p className="text-[15px] font-mono font-bold text-slate-900 tabular-nums">
                        {formatInt(mine.workersCount)}
                    </p>
                </div>
                <div className="px-2.5 py-2 rounded-lg bg-blue-50/70 border border-blue-100">
                    <div className="flex items-center gap-1 mb-0.5">
                        <IconActivity size={11} stroke={1.7} className="text-blue-600" />
                        <span className="text-[9.5px] uppercase tracking-[0.10em] text-blue-700 font-semibold">
                            {labels?.avgDose ?? 'Avg'}
                        </span>
                    </div>
                    <p className="text-[15px] font-mono font-bold text-blue-900 tabular-nums">
                        {formatMsv(mine.avgAnnualDose)}
                        <span className="text-[10px] text-blue-600 ml-0.5">{labels?.unitMsv ?? 'mSv'}</span>
                    </p>
                </div>
                <div className="px-2.5 py-2 rounded-lg bg-orange-50/70 border border-orange-100">
                    <div className="flex items-center gap-1 mb-0.5">
                        <IconArrowUpRight size={11} stroke={1.7} className="text-orange-600" />
                        <span className="text-[9.5px] uppercase tracking-[0.10em] text-orange-700 font-semibold">
                            {labels?.maxDose ?? 'Max'}
                        </span>
                    </div>
                    <p className="text-[15px] font-mono font-bold text-orange-900 tabular-nums">
                        {formatMsv(mine.maxAnnualDose)}
                        <span className="text-[10px] text-orange-600 ml-0.5">{labels?.unitMsv ?? 'mSv'}</span>
                    </p>
                </div>

                {/* Critical row */}
                <div
                    className={`px-2.5 py-2 rounded-lg border ${
                        hasOverexposure ? 'bg-red-50 border-red-200' : 'bg-emerald-50/40 border-emerald-100'
                    }`}
                >
                    <div className="flex items-center gap-1 mb-0.5">
                        <IconAlertOctagon
                            size={11}
                            stroke={1.7}
                            className={hasOverexposure ? 'text-red-700' : 'text-emerald-600'}
                        />
                        <span
                            className={`text-[9.5px] uppercase tracking-[0.10em] font-semibold ${
                                hasOverexposure ? 'text-red-700' : 'text-emerald-700'
                            }`}
                        >
                            {labels?.over100 ?? '>100%'}
                        </span>
                    </div>
                    <p
                        className={`text-[15px] font-mono font-bold tabular-nums ${
                            hasOverexposure ? 'text-red-900' : 'text-emerald-900'
                        }`}
                    >
                        {formatInt(mine.workersOver100Pct)}
                    </p>
                </div>
                <div
                    className={`px-2.5 py-2 rounded-lg border ${
                        hasAlerts ? 'bg-amber-50 border-amber-200' : 'bg-slate-50/70 border-slate-100'
                    }`}
                >
                    <div className="flex items-center gap-1 mb-0.5">
                        <IconActivity
                            size={11}
                            stroke={1.7}
                            className={hasAlerts ? 'text-amber-700' : 'text-slate-500'}
                        />
                        <span
                            className={`text-[9.5px] uppercase tracking-[0.10em] font-semibold ${
                                hasAlerts ? 'text-amber-700' : 'text-slate-500'
                            }`}
                        >
                            {labels?.alerts ?? 'Alertes'}
                        </span>
                    </div>
                    <p
                        className={`text-[15px] font-mono font-bold tabular-nums ${
                            hasAlerts ? 'text-amber-900' : 'text-slate-700'
                        }`}
                    >
                        {formatInt(mine.activeAlertsCount)}
                    </p>
                </div>
                <div
                    className={`px-2.5 py-2 rounded-lg border ${
                        hasOpenCases ? 'bg-red-50/70 border-red-200' : 'bg-slate-50/70 border-slate-100'
                    }`}
                >
                    <div className="flex items-center gap-1 mb-0.5">
                        <IconFolderOpen
                            size={11}
                            stroke={1.7}
                            className={hasOpenCases ? 'text-red-700' : 'text-slate-500'}
                        />
                        <span
                            className={`text-[9.5px] uppercase tracking-[0.10em] font-semibold ${
                                hasOpenCases ? 'text-red-700' : 'text-slate-500'
                            }`}
                        >
                            {labels?.cases ?? 'Dossiers'}
                        </span>
                    </div>
                    <p
                        className={`text-[15px] font-mono font-bold tabular-nums ${
                            hasOpenCases ? 'text-red-900' : 'text-slate-700'
                        }`}
                    >
                        {formatInt(mine.overexposureCasesOpen)}
                    </p>
                </div>
            </div>

            {/* Footer : critical badge si besoin */}
            {criticalCount > 0 && (
                <div className="px-4 py-2 bg-red-50/40 border-t border-red-100 flex items-center gap-1.5">
                    <IconAlertOctagon size={12} stroke={1.8} className="text-red-700" />
                    <span className="text-[10.5px] text-red-800 font-medium">
                        {criticalCount} situation(s) critique(s) en cours
                    </span>
                </div>
            )}
            {isInteractive && !selected && (
                <div className="px-4 py-1.5 bg-slate-50/60 border-t border-slate-100 text-right opacity-0 group-hover:opacity-100 transition">
                    <span className="text-[10.5px] text-violet-700 font-medium">
                        {labels?.clickHint ?? 'Cliquer pour filtrer →'}
                    </span>
                </div>
            )}
        </>
    );

    if (isInteractive) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`${cardBase} text-left w-full focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-1`}
                aria-pressed={selected}
            >
                {content}
            </button>
        );
    }
    return <div className={cardBase}>{content}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

function MultiMineComparisonCardImpl({
    data,
    loading = false,
    selectedMineId = null,
    onSelectMine,
    mineLabels,
    labels,
}: MultiMineComparisonCardProps) {
    // Loading
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((idx) => (
                    <div
                        key={`skeleton-${idx}`}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm h-48 animate-pulse"
                    >
                        <div className="h-1 bg-slate-200 rounded-t-xl" />
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                                <div className="flex-1">
                                    <div className="h-3 w-32 bg-slate-100 rounded mb-2" />
                                    <div className="h-2 w-16 bg-slate-100 rounded" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[0, 1, 2].map((j) => (
                                    <div key={j} className="h-14 bg-slate-50 rounded-lg" />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Empty
    if (data.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm py-10 px-6 text-center">
                <IconBuildingFactory2 size={32} stroke={1.5} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-600 text-[13px] font-medium">
                    {labels?.empty ?? 'Aucune donnee de comparaison disponible'}
                </p>
                <p className="text-slate-400 text-[11px] mt-1">
                    Le snapshot multi-mine sera produit lors du prochain job KPI quotidien.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((mine) => {
                const label = mineLabels?.[mine.mineId] ?? `Mine #${mine.mineId}`;
                const isSelected = selectedMineId === mine.mineId;
                return (
                    <MineCard
                        key={`mine-${mine.mineId}`}
                        mine={mine}
                        selected={isSelected}
                        label={label}
                        onClick={onSelectMine ? () => onSelectMine(mine.mineId) : undefined}
                        labels={labels}
                    />
                );
            })}
        </div>
    );
}

// 2026-06-07 perf : memoization
const MultiMineComparisonCard = memo(MultiMineComparisonCardImpl);
export default MultiMineComparisonCard;
