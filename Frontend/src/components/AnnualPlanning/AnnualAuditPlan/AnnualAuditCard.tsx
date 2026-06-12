import { useState } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconCheck, IconEdit, IconEye, IconRotateClockwise, IconX, IconCalendarTime, IconUserShield, IconMapPin } from '@tabler/icons-react';
import IsoBadge from '../../UtilityComp/IsoBadge';
import { auditCategoryConfig, formatDateFr, planStatusConfig } from '../planningLabels';

/**
 * Carte d'un plan d'audit (vue cartes du plan annuel) — LOT 54 :
 *   • Zoom raffiné au survol (élévation + ombre + accent de bordure) sur TOUTES
 *     les tuiles.
 *   • Retournement 3D « deux faces » réservé aux plans APPROUVÉS (les plans en
 *     attente affichent leurs actions d'approbation, pas de retournement) :
 *     la face arrière, au design distinct (dégradé teal sombre), présente une
 *     fiche de synthèse ISO 19011. Le retournement se déclenche par un bouton
 *     dédié et NE navigue PAS vers le détail (l'œil reste l'accès au détail).
 */

type AuditPlan = {
    id: string;
    refNumber: string;
    title: string;
    scopeId?: string;
    auditArea?: string;
    leadAuditor?: string;
    category: string;
    startDate: string;
    endDate: string;
    planningStatus: string;
    type?: string;
};

interface AnnualAuditCardProps {
    audit: AuditPlan;
    onEdit: (audit: AuditPlan) => void;
    onView: (audit: AuditPlan) => void;
    onApprove: (audit: AuditPlan) => void;
    onReject: (audit: AuditPlan) => void;
    auditAreaMap: Record<string, any>;
    leadAuditor?: any;
}

/** Durée en jours (inclusive) entre deux dates, ou null si indéterminable. */
const durationDays = (start?: string, end?: string): number | null => {
    if (!start || !end) return null;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) return null;
    return Math.max(1, Math.round((e - s) / 86_400_000) + 1);
};

const AnnualAuditCard = ({ audit, onEdit, onView, onApprove, onReject, auditAreaMap, leadAuditor }: AnnualAuditCardProps) => {
    const statusCfg = planStatusConfig(audit.planningStatus);
    const categoryCfg = auditCategoryConfig(audit.category);
    const status = String(audit.planningStatus ?? '').toUpperCase();
    const isPending = status === 'PENDING';
    const isApproved = status === 'APPROVED';
    const scope = auditAreaMap[audit?.scopeId || '']?.name || audit.auditArea || '—';
    const leadName = leadAuditor?.name ?? '—';
    const days = durationDays(audit.startDate, audit.endDate);

    // Seuls les plans approuvés disposent du retournement (fiche de synthèse).
    const flippable = isApproved;
    const [flipped, setFlipped] = useState(false);

    // ─── Face avant (commune) ────────────────────────────────────────────────
    const front = (
        <div
            className="absolute inset-0 flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm
                       transition-all duration-300 group-hover:border-teal-300 group-hover:shadow-[0_12px_30px_-12px_rgba(15,118,110,0.35)]"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
            {/* liseré d'accent qui se révèle au survol */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-t-xl bg-gradient-to-r from-teal-500 to-emerald-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="flex items-start justify-between gap-2 mb-2.5">
                <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-mono text-slate-600">
                    {audit.refNumber || '—'}
                </span>
                <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${categoryCfg.chip}`}>
                        {categoryCfg.label}
                    </span>
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                        {statusCfg.label}
                    </span>
                </div>
            </div>

            <h3
                className="text-slate-800 leading-snug line-clamp-2"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em' }}
            >
                {audit.title}
            </h3>

            <dl className="mt-3 space-y-1.5 text-[12.5px]">
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Périmètre</dt>
                    <dd className="text-slate-800 text-right truncate">{scope}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Auditeur principal</dt>
                    <dd className="text-slate-800 text-right">{leadName}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Période</dt>
                    <dd className="text-slate-800 text-right">
                        {formatDateFr(audit.startDate)} → {formatDateFr(audit.endDate)}
                    </dd>
                </div>
            </dl>

            <div className="flex items-center justify-end gap-1.5 pt-3 mt-auto border-t border-slate-100">
                <Tooltip label="Consulter le plan" withArrow>
                    <ActionIcon variant="light" size="sm" color="teal" onClick={() => onView(audit)} aria-label="Consulter le plan">
                        <IconEye size={14} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
                {flippable && (
                    <Tooltip label="Retourner — fiche de synthèse" withArrow>
                        <ActionIcon
                            variant="light"
                            size="sm"
                            color="indigo"
                            onClick={() => setFlipped(true)}
                            aria-label="Retourner la carte"
                        >
                            <IconRotateClockwise size={14} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                )}
                {isPending && (
                    <>
                        <Tooltip label="Modifier le plan" withArrow>
                            <ActionIcon variant="light" size="sm" color="blue" onClick={() => onEdit(audit)} aria-label="Modifier le plan">
                                <IconEdit size={14} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Approuver le plan" withArrow>
                            <ActionIcon variant="light" size="sm" color="teal" onClick={() => onApprove(audit)} aria-label="Approuver le plan">
                                <IconCheck size={14} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Rejeter le plan" withArrow>
                            <ActionIcon variant="light" size="sm" color="red" onClick={() => onReject(audit)} aria-label="Rejeter le plan">
                                <IconX size={14} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    </>
                )}
            </div>
        </div>
    );

    // ─── Face arrière (design distinct : dégradé teal sombre) ────────────────
    const back = (
        <div
            className="absolute inset-0 flex flex-col rounded-xl border border-teal-900/40 p-4 text-slate-100 shadow-sm overflow-hidden"
            style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'linear-gradient(150deg, #0f766e 0%, #115e59 45%, #1e293b 100%)',
            }}
        >
            <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                    <p className="text-[10.5px] uppercase tracking-[0.18em] text-teal-200/80">Fiche de synthèse</p>
                    <p className="text-[13px] font-medium text-white" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                        {audit.refNumber}
                    </p>
                </div>
                <IsoBadge norm="ISO 19011" size="sm" />
            </div>

            <div className="space-y-2.5 text-[12.5px]">
                <div className="flex items-center gap-2.5">
                    <IconMapPin size={15} className="text-teal-200 shrink-0" stroke={1.6} />
                    <span className="text-teal-100/70 w-24 shrink-0">Périmètre</span>
                    <span className="text-white truncate">{scope}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <IconUserShield size={15} className="text-teal-200 shrink-0" stroke={1.6} />
                    <span className="text-teal-100/70 w-24 shrink-0">Auditeur</span>
                    <span className="text-white truncate">{leadName}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <IconCalendarTime size={15} className="text-teal-200 shrink-0" stroke={1.6} />
                    <span className="text-teal-100/70 w-24 shrink-0">Durée</span>
                    <span className="text-white">{days != null ? `${days} jour${days > 1 ? 's' : ''}` : '—'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center rounded border border-white/25 bg-white/10 px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-white">
                        {categoryCfg.label}
                    </span>
                    <span className="inline-flex items-center rounded border border-emerald-300/40 bg-emerald-400/15 px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-emerald-100">
                        {statusCfg.label}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 mt-auto border-t border-white/15">
                <button
                    type="button"
                    onClick={() => onView(audit)}
                    className="text-[12px] text-teal-100 hover:text-white underline-offset-2 hover:underline transition-colors"
                >
                    Ouvrir le détail
                </button>
                <Tooltip label="Revenir au recto" withArrow>
                    <ActionIcon variant="white" size="sm" color="dark" onClick={() => setFlipped(false)} aria-label="Revenir au recto">
                        <IconRotateClockwise size={14} stroke={1.5} style={{ transform: 'scaleX(-1)' }} />
                    </ActionIcon>
                </Tooltip>
            </div>
        </div>
    );

    // ─── Tuile non retournable : zoom seul (pas de scène 3D) ─────────────────
    if (!flippable) {
        return (
            <div className="group relative h-full min-h-[212px] transition-transform duration-300 will-change-transform hover:-translate-y-1 hover:scale-[1.02]">
                {front}
            </div>
        );
    }

    // ─── Tuile retournable : scène 3D + zoom ─────────────────────────────────
    return (
        <div className="group h-full min-h-[212px]" style={{ perspective: '1200px' }}>
            <div
                className="relative h-full transition-transform duration-300 will-change-transform group-hover:-translate-y-1 group-hover:scale-[1.02]"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div
                    className="relative h-full min-h-[212px]"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    }}
                >
                    {front}
                    {back}
                </div>
            </div>
        </div>
    );
};

export default AnnualAuditCard;
