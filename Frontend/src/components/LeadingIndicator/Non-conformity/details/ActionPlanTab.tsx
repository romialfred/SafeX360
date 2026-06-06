import { IconCalendarTime, IconUser, IconChecklist } from '@tabler/icons-react';
import { statusColors, statusLabels } from '../../../../Data/IncidentsData';
import { formatDateWithDay } from '../../../../utility/DateFormats';
import SafeHtml from '../../../UtilityComp/SafeHtml';

/**
 * ActionPlansTab — Onglet « Actions correctives » professionnel (LOT 43b v4).
 *
 * Wrapper section avec en-tête accent emerald + grille de cartes d'action.
 */

const STATUS_FR: Record<string, string> = {
    NOT_STARTED: 'À démarrer',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminée',
    OVERDUE: 'En retard',
    CANCELLED: 'Annulée',
    PENDING: 'En attente',
    APPROVED: 'Validée',
    REJECTED: 'Rejetée',
};

const STATUS_TONE: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    NOT_STARTED: { bg: 'bg-slate-50',   text: 'text-slate-700',   dot: 'bg-slate-400',   border: 'border-l-slate-300' },
    IN_PROGRESS: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-l-amber-400' },
    COMPLETED:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-l-emerald-400' },
    OVERDUE:     { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-l-red-500' },
    CANCELLED:   { bg: 'bg-slate-50',   text: 'text-slate-500',   dot: 'bg-slate-400',   border: 'border-l-slate-300' },
    PENDING:     { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-500',     border: 'border-l-sky-400' },
    APPROVED:    { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-l-emerald-400' },
    REJECTED:    { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-l-red-500' },
};

interface ActionPlansTabProps {
    actions: Array<{
        actionName?: string;
        description?: string;
        assignedEmployeeName?: string;
        deadline?: string;
        status?: string;
    }>;
}

const ActionPlansTab = ({ actions }: ActionPlansTabProps) => {
    const total = actions?.length || 0;
    const completed = actions?.filter((a) => ['COMPLETED', 'APPROVED'].includes(String(a.status || '').toUpperCase())).length || 0;
    const inProgress = actions?.filter((a) => String(a.status || '').toUpperCase() === 'IN_PROGRESS').length || 0;
    const overdue = actions?.filter((a) => String(a.status || '').toUpperCase() === 'OVERDUE').length || 0;

    return (
        <section className="bg-white border border-slate-200 border-l-[3px] border-l-emerald-400 rounded-xl p-5 shadow-sm">
            {/* En-tête avec statistiques rapides */}
            <header className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100 flex-wrap">
                <div className="flex items-start gap-2.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex-shrink-0" aria-hidden="true">
                        <IconChecklist size={15} stroke={1.6} />
                    </span>
                    <div>
                        <h3
                            className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                        >
                            Actions correctives
                        </h3>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                            {total} action{total > 1 ? 's' : ''} au total
                        </p>
                    </div>
                </div>

                {/* Mini KPIs */}
                <div className="flex items-center gap-3 text-[11px]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        <span className="text-slate-500">Terminées</span>
                        <span className="text-emerald-700 font-semibold font-mono">{completed}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                        <span className="text-slate-500">En cours</span>
                        <span className="text-amber-700 font-semibold font-mono">{inProgress}</span>
                    </div>
                    {overdue > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
                            <span className="text-slate-500">En retard</span>
                            <span className="text-red-700 font-semibold font-mono">{overdue}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Liste des actions */}
            <div className="space-y-2.5">
                {actions?.map((action, idx) => {
                    const statusKey = (action.status || '').toUpperCase();
                    const tone = STATUS_TONE[statusKey] || STATUS_TONE.NOT_STARTED;
                    const statusFr = STATUS_FR[statusKey] || statusLabels?.[action.status || ''] || action.status || '—';
                    const _legacy = statusColors?.[action.status || ''];
                    void _legacy;

                    return (
                        <article
                            key={idx}
                            className={`bg-white border border-slate-200 border-l-[3px] ${tone.border} rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition-all`}
                        >
                            <header className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                    <span
                                        className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center justify-center mt-0.5"
                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                                    >
                                        {idx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h4
                                            className="text-slate-900 leading-snug"
                                            style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontSize: '14.5px',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {action.actionName || '—'}
                                        </h4>
                                    </div>
                                </div>

                                <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.10em] ${tone.bg} ${tone.text} flex-shrink-0`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                                    {statusFr}
                                </span>
                            </header>

                            {action.description && (
                                <div className="pl-9 mb-2.5 text-[12.5px] text-slate-600 leading-relaxed">
                                    <SafeHtml html={action.description} />
                                </div>
                            )}

                            <footer className="pl-9 flex flex-wrap items-center gap-x-5 gap-y-1 pt-2 border-t border-slate-100 text-[11.5px] text-slate-600">
                                {action.assignedEmployeeName && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <IconUser size={12} stroke={1.6} className="text-slate-400" />
                                        <span className="text-slate-500">Assigné à</span>
                                        <span className="text-slate-800 font-medium">
                                            {action.assignedEmployeeName}
                                        </span>
                                    </span>
                                )}
                                {action.deadline && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <IconCalendarTime size={12} stroke={1.6} className="text-slate-400" />
                                        <span className="text-slate-500">Échéance</span>
                                        <span className="text-slate-800 font-medium">
                                            {formatDateWithDay(action.deadline)}
                                        </span>
                                    </span>
                                )}
                            </footer>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default ActionPlansTab;
