/**
 * TopExposedWorkersTable — Top 10 des workers les plus exposes (Phase 8 Frontend).
 *
 * <p>Donnees STRICTEMENT pseudonymisees cote backend : on n'affiche que
 * {@code rank}, {@code workerId} et le cumul annuel. AUCUN nom / matricule
 * apparait ici — l'utilisateur doit cliquer pour ouvrir la fiche 360 (qui elle
 * exige DOSIMETRY_READ_NOMINATIVE).
 *
 * <p>Tri descendant sur dose. Status badge couleur selon % limite :
 *   - {@code &lt; 50%}  : VERT
 *   - {@code 50-75%}    : JAUNE
 *   - {@code 75-90%}    : ORANGE
 *   - {@code 90-100%}   : ROUGE (warning)
 *   - {@code &gt;= 100%}: ROUGE FONCE (surexposition)
 */

import { useNavigate } from 'react-router-dom';
import { IconExternalLink, IconShieldLock } from '@tabler/icons-react';
import type { DosimetryTopExposedDTO, KpiCategory } from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TopExposedWorkersTableProps {
    data: DosimetryTopExposedDTO[];
    loading?: boolean;
    /** Libelles i18n. */
    labels?: {
        rank?: string;
        workerId?: string;
        category?: string;
        annualDose?: string;
        percentLimit?: string;
        status?: string;
        actions?: string;
        empty?: string;
        loadingText?: string;
        privacyNotice?: string;
        viewWorker?: string;
        statusSafe?: string;
        statusWatch?: string;
        statusInvestigation?: string;
        statusAction?: string;
        statusExceeded?: string;
    };
    /** Permet de naviguer vers /dosimetry/workers/detail/{id}. */
    enableNavigation?: boolean;
}

interface StatusBucket {
    label: string;
    badge: string;
    color: string;
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

const formatPct = (v: number | null | undefined): string => {
    if (v == null) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return '—';
    return `${n.toFixed(1)}%`;
};

const getStatusBucket = (
    percentOfLimit: number | null | undefined,
    labels: TopExposedWorkersTableProps['labels'],
): StatusBucket => {
    if (percentOfLimit == null) {
        return {
            label: '—',
            badge: 'bg-slate-100 text-slate-700 border-slate-200',
            color: '#64748b',
        };
    }
    const pct = typeof percentOfLimit === 'number' ? percentOfLimit : Number(percentOfLimit);
    if (pct >= 100) {
        return {
            label: labels?.statusExceeded ?? 'Depassement',
            badge: 'bg-red-100 text-red-900 border-red-300',
            color: '#991b1b',
        };
    }
    if (pct >= 90) {
        return {
            label: labels?.statusAction ?? 'Action',
            badge: 'bg-red-50 text-red-800 border-red-200',
            color: '#ef4444',
        };
    }
    if (pct >= 75) {
        return {
            label: labels?.statusInvestigation ?? 'Investigation',
            badge: 'bg-orange-50 text-orange-800 border-orange-200',
            color: '#f97316',
        };
    }
    if (pct >= 50) {
        return {
            label: labels?.statusWatch ?? 'Surveillance',
            badge: 'bg-yellow-50 text-yellow-800 border-yellow-200',
            color: '#facc15',
        };
    }
    return {
        label: labels?.statusSafe ?? 'Conforme',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        color: '#10b981',
    };
};

const CATEGORY_LABEL: Record<KpiCategory, string> = {
    WORKER_A: 'Cat. A',
    WORKER_B: 'Cat. B',
    APPRENTICE: 'Apprenti',
    PREGNANCY: 'Grossesse',
    PUBLIC: 'Public',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function TopExposedWorkersTable({
    data,
    loading = false,
    labels,
    enableNavigation = true,
}: TopExposedWorkersTableProps) {
    const navigate = useNavigate();

    // Tri desc sur la dose annuelle (defensif — le backend trie deja).
    const sorted = [...data].sort((a, b) => {
        const av = typeof a.annualDose === 'number' ? a.annualDose : Number(a.annualDose ?? 0);
        const bv = typeof b.annualDose === 'number' ? b.annualDose : Number(b.annualDose ?? 0);
        return bv - av;
    });

    const handleRowClick = (workerId: number) => {
        if (enableNavigation) {
            navigate(`/dosimetry/workers/detail/${workerId}`);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header : Privacy notice */}
            <div className="px-4 py-2.5 flex items-start gap-2 bg-violet-50/50 border-b border-violet-100">
                <IconShieldLock size={14} stroke={1.7} className="text-violet-700 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-violet-800 leading-tight">
                    {labels?.privacyNotice ??
                        'Donnees agregees - aucune donnee medicale visible ici. Le nom et le matricule du travailleur sont visibles uniquement dans la fiche 360 (permission DOSIMETRY_READ_NOMINATIVE).'}
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                    <thead>
                        <tr className="bg-slate-50/80 text-left text-[10.5px] uppercase tracking-[0.10em] text-slate-500">
                            <th className="px-4 py-2.5 font-semibold w-16">{labels?.rank ?? 'Rank'}</th>
                            <th className="px-4 py-2.5 font-semibold">{labels?.workerId ?? 'Worker ID'}</th>
                            <th className="px-4 py-2.5 font-semibold">{labels?.category ?? 'Categorie'}</th>
                            <th className="px-4 py-2.5 font-semibold text-right">
                                {labels?.annualDose ?? 'Dose annuelle (mSv)'}
                            </th>
                            <th className="px-4 py-2.5 font-semibold text-right">
                                {labels?.percentLimit ?? '% limite'}
                            </th>
                            <th className="px-4 py-2.5 font-semibold">{labels?.status ?? 'Statut'}</th>
                            {enableNavigation && (
                                <th className="px-4 py-2.5 font-semibold text-right w-16">
                                    {labels?.actions ?? 'Actions'}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={enableNavigation ? 7 : 6} className="px-4 py-10 text-center text-slate-500">
                                    <span className="inline-block w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin mr-2 align-middle" />
                                    {labels?.loadingText ?? 'Chargement du top 10…'}
                                </td>
                            </tr>
                        ) : sorted.length === 0 ? (
                            <tr>
                                <td colSpan={enableNavigation ? 7 : 6} className="px-4 py-10 text-center text-slate-500">
                                    {labels?.empty ?? 'Aucun travailleur expose enregistre pour cette periode.'}
                                </td>
                            </tr>
                        ) : (
                            sorted.map((row, idx) => {
                                const pct = row.percentOfLimit;
                                const bucket = getStatusBucket(pct, labels);
                                const isFirst = idx === 0;
                                return (
                                    <tr
                                        key={`top-${row.workerId}-${idx}`}
                                        onClick={() => handleRowClick(row.workerId)}
                                        className={`border-t border-slate-100 transition ${
                                            enableNavigation
                                                ? 'cursor-pointer hover:bg-violet-50/40'
                                                : ''
                                        } ${isFirst ? 'bg-amber-50/30' : ''}`}
                                    >
                                        <td className="px-4 py-2.5">
                                            <span
                                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold tabular-nums ${
                                                    row.rank === 1
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                        : row.rank === 2
                                                          ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                                          : row.rank === 3
                                                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                                                }`}
                                            >
                                                {row.rank}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <code className="text-[11.5px] font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                #{row.workerId}
                                            </code>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="text-[11px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                                {CATEGORY_LABEL[row.category] ?? row.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                                            {formatMsv(row.annualDose)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <span
                                                className="font-mono font-semibold tabular-nums"
                                                style={{ color: bucket.color }}
                                            >
                                                {formatPct(pct)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] uppercase tracking-[0.10em] font-bold border ${bucket.badge}`}
                                            >
                                                {bucket.label}
                                            </span>
                                        </td>
                                        {enableNavigation && (
                                            <td className="px-4 py-2.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRowClick(row.workerId);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-violet-700 hover:text-violet-900 text-[11px] font-medium"
                                                    aria-label={labels?.viewWorker ?? 'Ouvrir la fiche'}
                                                >
                                                    <IconExternalLink size={12} stroke={1.8} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
