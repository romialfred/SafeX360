import { IconUser, IconCalendar, IconClock, IconCheck, IconHistory } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('fr');

/**
 * NonConformityHistory — Onglet « Journal » professionnel (LOT 43b v4).
 *
 * Wrapper section avec accent rose + timeline verticale élégante des changements de statut.
 */

// Mapping FR
const STATUS_FR: Record<string, string> = {
    REPORTED: 'Déclaré',
    ANALYSIS: 'Analyse',
    AC_IMPLEMENTATION: 'Traitement',
    CLOSED: 'Clôturé',
    CANCELLED: 'Annulé',
    REJECTED: 'Rejeté',
    INPROGRESS: 'En cours',
    REOPENED: 'Réouvert',
};

const STATUS_TONE: Record<string, { dot: string; bg: string; text: string; ring: string }> = {
    REPORTED:           { dot: 'bg-sky-500',     bg: 'bg-sky-50',     text: 'text-sky-700',     ring: 'ring-sky-100' },
    ANALYSIS:           { dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-100' },
    AC_IMPLEMENTATION:  { dot: 'bg-orange-500',  bg: 'bg-orange-50',  text: 'text-orange-700',  ring: 'ring-orange-100' },
    CLOSED:             { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
    CANCELLED:          { dot: 'bg-slate-400',   bg: 'bg-slate-50',   text: 'text-slate-600',   ring: 'ring-slate-100' },
    REJECTED:           { dot: 'bg-red-500',     bg: 'bg-red-50',     text: 'text-red-700',     ring: 'ring-red-100' },
    INPROGRESS:         { dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-100' },
    REOPENED:           { dot: 'bg-violet-500',  bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-100' },
};

interface NCHistoryEntry {
    id: number;
    ownerId: number;
    ownerName?: string;
    date: string;
    status: string;
    comment?: string;
    nonConformityId: number;
    createdAt?: string;
}

interface NCHistoryProps {
    history: NCHistoryEntry[];
    empMap: Record<number, { name?: string }>;
}

const formatDuration = (days: number): string => {
    if (days === 0) return 'le jour même';
    if (days === 1) return 'pendant 1 jour';
    if (days < 7) return `pendant ${days} jours`;
    if (days < 30) {
        const w = Math.floor(days / 7);
        const remain = days % 7;
        return remain === 0
            ? `pendant ${w} semaine${w > 1 ? 's' : ''}`
            : `pendant ~${w} semaine${w > 1 ? 's' : ''}`;
    }
    if (days < 365) {
        const m = Math.floor(days / 30);
        return `pendant ~${m} mois`;
    }
    const y = Math.floor(days / 365);
    return `pendant ~${y} an${y > 1 ? 's' : ''}`;
};

const NonConformityHistory = ({ history, empMap }: NCHistoryProps) => {
    const sorted = [...history].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return (
        <section className="bg-white border border-slate-200 border-l-[3px] border-l-rose-400 rounded-xl p-5 shadow-sm">
            {/* En-tête section */}
            <header className="flex items-start gap-2.5 mb-4 pb-3 border-b border-slate-100">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex-shrink-0" aria-hidden="true">
                    <IconHistory size={15} stroke={1.6} />
                </span>
                <div>
                    <h3
                        className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                        Journal des changements
                    </h3>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                        {sorted.length} entrée{sorted.length > 1 ? 's' : ''} dans l'historique
                    </p>
                </div>
            </header>

            {/* Timeline verticale */}
            <div className="relative pl-2">
                {/* Ligne verticale */}
                <div className="absolute left-[16px] top-3 bottom-3 w-px bg-slate-200" aria-hidden="true" />

                <ol className="space-y-4">
                    {sorted.map((entry, idx) => {
                        const statusKey = String(entry.status || '').toUpperCase();
                        const tone = STATUS_TONE[statusKey] || STATUS_TONE.REPORTED;
                        const statusFr = STATUS_FR[statusKey] || entry.status;

                        const isLast = idx === sorted.length - 1;
                        const nextDate = isLast ? dayjs() : dayjs(sorted[idx + 1].date);
                        const days = nextDate.diff(dayjs(entry.date), 'day');

                        const ownerName = empMap[entry.ownerId]?.name || entry.ownerName || '—';

                        return (
                            <li key={entry.id} className="relative pl-10">
                                {/* Dot timeline */}
                                <div
                                    className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center ${tone.dot} text-white ring-[3px] ${tone.ring}`}
                                >
                                    <IconCheck size={13} stroke={2.6} />
                                </div>

                                {/* Carte entrée */}
                                <div className="bg-slate-50/60 border border-slate-100 rounded-lg p-3.5">
                                    <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                                        <h4
                                            className="text-slate-900 leading-tight"
                                            style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontSize: '14px',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Passage en « {statusFr} »
                                        </h4>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.10em] ${tone.bg} ${tone.text}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                                            {statusFr}
                                        </span>
                                    </div>

                                    {entry.comment ? (
                                        <p className="text-[12.5px] text-slate-700 leading-relaxed mb-2.5">
                                            {entry.comment}
                                        </p>
                                    ) : (
                                        <p className="text-[11.5px] text-slate-400 italic mb-2.5">
                                            Aucun commentaire renseigné.
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <IconUser size={12} stroke={1.6} className="text-slate-400" />
                                            <span className="text-slate-700 font-medium">{ownerName}</span>
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <IconCalendar size={12} stroke={1.6} className="text-slate-400" />
                                            <span>{dayjs(entry.date).format('DD MMM YYYY')}</span>
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <IconClock size={12} stroke={1.6} className="text-slate-400" />
                                            <span>Statut {formatDuration(days)}</span>
                                        </span>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
};

export default NonConformityHistory;
