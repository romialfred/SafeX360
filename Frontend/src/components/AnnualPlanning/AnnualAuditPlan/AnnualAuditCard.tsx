import { ActionIcon, Tooltip } from '@mantine/core';
import { IconCheck, IconEdit, IconEye, IconX } from '@tabler/icons-react';
import { auditCategoryConfig, formatDateFr, planStatusConfig } from '../planningLabels';

/**
 * Carte d'un plan d'audit (vue cartes du plan annuel) : référence, périmètre,
 * auditeur principal, fenêtre d'exécution et actions selon le statut.
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

const AnnualAuditCard = ({ audit, onEdit, onView, onApprove, onReject, auditAreaMap, leadAuditor }: AnnualAuditCardProps) => {
    const statusCfg = planStatusConfig(audit.planningStatus);
    const categoryCfg = auditCategoryConfig(audit.category);
    const isPending = String(audit.planningStatus ?? '').toUpperCase() === 'PENDING';
    const scope = auditAreaMap[audit?.scopeId || '']?.name || audit.auditArea || '—';

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-full">
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
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                }}
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
                    <dd className="text-slate-800 text-right">{leadAuditor?.name ?? '—'}</dd>
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
};

export default AnnualAuditCard;
