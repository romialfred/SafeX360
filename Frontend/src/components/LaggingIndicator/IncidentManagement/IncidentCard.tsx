import { useNavigate } from "react-router-dom";
import {
    IconArrowUpRight,
    IconBook,
    IconCalendarEvent,
    IconEdit,
    IconRotateClockwise,
    IconSearch,
    IconUser,
} from "@tabler/icons-react";
import { incidentStatusLabel } from "./incidentLabels";
import { formatDateShort } from "../../../utility/DateFormats";

interface IncidentData {
    id: number;
    number?: string;
    severityLevelName?: string;
    maxSeverityLevel?: string;
    incidentCategoryName?: string;
    subDepartment?: string;
    status?: string;
    title: string;
    description: string;
    incidentDate: string;
    reporterId: number;
}

/** Métadonnées visuelles par niveau de gravité (1 → 5). */
const SEVERITY: Record<string, { chip: string; accent: string; grad: string }> = {
    '1': { chip: 'bg-green-50 text-green-700 border-green-200', accent: '#16a34a', grad: 'linear-gradient(150deg,#16a34a 0%,#15803d 55%,#14532d 100%)' },
    '2': { chip: 'bg-amber-50 text-amber-700 border-amber-200', accent: '#d97706', grad: 'linear-gradient(150deg,#d97706 0%,#b45309 55%,#78350f 100%)' },
    '3': { chip: 'bg-orange-50 text-orange-700 border-orange-200', accent: '#ea580c', grad: 'linear-gradient(150deg,#ea580c 0%,#c2410c 55%,#7c2d12 100%)' },
    '4': { chip: 'bg-red-50 text-red-700 border-red-200', accent: '#dc2626', grad: 'linear-gradient(150deg,#dc2626 0%,#b91c1c 55%,#7f1d1d 100%)' },
    '5': { chip: 'bg-rose-50 text-rose-700 border-rose-200', accent: '#9f1239', grad: 'linear-gradient(150deg,#9f1239 0%,#881337 55%,#4c0519 100%)' },
};
const SEVERITY_FALLBACK = { chip: 'bg-slate-100 text-slate-600 border-slate-200', accent: '#64748b', grad: 'linear-gradient(150deg,#475569 0%,#334155 55%,#1e293b 100%)' };

const STATUS_CHIP: Record<string, string> = {
    REPORTED: 'bg-blue-50 text-blue-700 border-blue-200',
    ANALYSIS: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    IN_INVESTIGATION: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    ACTION_TAKEN: 'bg-orange-50 text-orange-700 border-orange-200',
    CLOSED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

/**
 * Carte d'incident (vue cartes) — LOT 55 :
 *   • Recto raffiné : liseré de gravité, puces gravité/catégorie/statut, titre, méta.
 *   • Retournement « deux faces » AU SURVOL (CSS pur) : la face arrière, au design
 *     distinct (dégradé coloré selon la gravité), présente le résumé + les actions
 *     (Détail / Modifier / Investigation / Leçon).
 */
const IncidentCard = ({ incidentData, emps }: { incidentData: IncidentData; emps: any }) => {
    const navigate = useNavigate();

    const sev = SEVERITY[incidentData.maxSeverityLevel ?? ''] ?? SEVERITY_FALLBACK;
    const statusUpper = String(incidentData?.status || '').toUpperCase();
    const statusChip = STATUS_CHIP[statusUpper] ?? 'bg-slate-100 text-slate-600 border-slate-200';
    const canEdit = !['CLOSED', 'REJECTED'].includes(statusUpper);
    const canInvestigate = canEdit;
    const reporter = emps ? emps[incidentData.reporterId]?.name || '—' : '—';

    return (
        <div className="group h-full min-h-[212px] [perspective:1300px]">
            <div className="relative h-full min-h-[212px] transition-transform duration-[600ms] [transform-style:preserve-3d] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] group-hover:[transform:rotateY(180deg)]">

                {/* ── Recto ──────────────────────────────────────────────── */}
                <div className="absolute inset-0 flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm [backface-visibility:hidden]">
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-t-xl" style={{ background: sev.accent }} />

                    <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${sev.chip}`}>
                            {incidentData.severityLevelName || '—'}
                        </span>
                        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                            {incidentData.incidentCategoryName || '—'}
                        </span>
                        <span className={`ml-auto inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wide ${statusChip}`}>
                            {incidentStatusLabel(incidentData.status)}
                        </span>
                    </div>

                    <h3
                        className="line-clamp-2 leading-snug text-slate-800"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14.5px', fontWeight: 600, letterSpacing: '-0.01em' }}
                    >
                        {incidentData.title}
                    </h3>

                    {incidentData.number && (
                        <span className="mt-1 font-mono text-[11px] text-slate-400">{incidentData.number}</span>
                    )}

                    <dl className="mt-3 space-y-1.5 text-[12.5px]">
                        <div className="flex items-center gap-2 text-slate-600">
                            <IconCalendarEvent size={14} className="shrink-0 text-slate-400" />
                            <span>Survenance</span>
                            <span className="ml-auto text-slate-800">{formatDateShort(incidentData.incidentDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                            <IconUser size={14} className="shrink-0 text-slate-400" />
                            <span>Déclarant</span>
                            <span className="ml-auto truncate text-slate-800">{reporter}</span>
                        </div>
                    </dl>

                    <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] text-slate-400">
                        <IconRotateClockwise size={13} className="transition-transform duration-300 group-hover:rotate-180" />
                        Survolez pour les actions
                    </div>
                </div>

                {/* ── Verso (au survol) : design distinct coloré gravité ─────── */}
                <div
                    className="absolute inset-0 flex flex-col overflow-hidden rounded-xl p-4 text-white shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]"
                    style={{ background: sev.grad }}
                >
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[10.5px] uppercase tracking-[0.16em] text-white/70">
                            {incidentData.incidentCategoryName || 'Incident'}
                        </span>
                        <span className="rounded border border-white/25 bg-white/10 px-2 py-0.5 text-[10.5px] uppercase tracking-wide">
                            {incidentStatusLabel(incidentData.status)}
                        </span>
                    </div>

                    <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-white" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                        {incidentData.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-white/80">
                        {incidentData.description || 'Aucune description fournie pour cet incident.'}
                    </p>

                    <div className="mt-auto space-y-2 pt-3">
                        <button
                            type="button"
                            onClick={() => navigate(`${incidentData.id}`)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-[12.5px] font-medium text-slate-800 transition-all hover:bg-white hover:shadow-md"
                        >
                            Voir le détail
                            <IconArrowUpRight size={14} stroke={1.9} />
                        </button>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => { if (canEdit) navigate(`edit/${incidentData.id}`); }}
                                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/30 bg-white/10 px-2 py-1.5 text-[11.5px] text-white transition-colors enabled:hover:bg-white/20 disabled:opacity-40"
                                title={canEdit ? 'Modifier' : 'Verrouillé'}
                            >
                                <IconEdit size={13} /> Modifier
                            </button>
                            <button
                                type="button"
                                disabled={!canInvestigate}
                                onClick={() => { if (canInvestigate) navigate(`investigation/${incidentData.id}`); }}
                                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/30 bg-white/10 px-2 py-1.5 text-[11.5px] text-white transition-colors enabled:hover:bg-white/20 disabled:opacity-40"
                                title={canInvestigate ? 'Investigation' : 'Verrouillé'}
                            >
                                <IconSearch size={13} /> Enquête
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`${incidentData.id}?tab=lessons`)}
                                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/30 bg-white/10 px-2 py-1.5 text-[11.5px] text-white transition-colors hover:bg-white/20"
                                title="Leçon apprise"
                            >
                                <IconBook size={13} /> Leçon
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncidentCard;
