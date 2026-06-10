import {
    IconCalendarEvent, IconMapPin, IconClock, IconFileText, IconChecks,
    IconUsers, IconShield, IconTarget,
} from '@tabler/icons-react';
import { formatDateWithDay } from "../../../../utility/DateFormats";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import { formatTimeFr, ppeLabel, SERIF } from "../hsMeetingsLabels";

const Section = ({ title, icon: Icon, accent = 'green', hint, children, count }: {
    title: string; icon: any; accent?: 'green' | 'blue' | 'amber' | 'teal' | 'violet' | 'slate' | 'yellow';
    hint?: string; children: React.ReactNode; count?: number;
}) => {
    const colors: Record<string, any> = {
        green: { bg: 'bg-green-50/60', border: 'border-green-200/70', text: 'text-green-700', iconBg: 'bg-green-100' },
        blue: { bg: 'bg-blue-50/60', border: 'border-blue-200/70', text: 'text-blue-700', iconBg: 'bg-blue-100' },
        amber: { bg: 'bg-amber-50/60', border: 'border-amber-200/70', text: 'text-amber-700', iconBg: 'bg-amber-100' },
        teal: { bg: 'bg-teal-50/60', border: 'border-teal-200/70', text: 'text-teal-700', iconBg: 'bg-teal-100' },
        violet: { bg: 'bg-violet-50/60', border: 'border-violet-200/70', text: 'text-violet-700', iconBg: 'bg-violet-100' },
        slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', iconBg: 'bg-slate-200' },
        yellow: { bg: 'bg-yellow-50/60', border: 'border-yellow-200/70', text: 'text-yellow-700', iconBg: 'bg-yellow-100' },
    };
    const c = colors[accent];
    return (
        <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <header className={`px-4 py-2.5 ${c.bg} border-b ${c.border} flex items-center gap-2`}>
                <div className={`p-1 rounded ${c.iconBg}`}>
                    <Icon size={14} className={c.text} />
                </div>
                <h3 className="text-slate-800 flex-1" style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 600 }}>{title}</h3>
                {count !== undefined && <span className="text-[10px] text-slate-500">{count}</span>}
                {hint && <span className="text-[10px] text-slate-500 italic hidden md:inline">{hint}</span>}
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
};

const ViewDetailsMeeting = ({ activity }: any) => {
    if (!activity || !activity.id) {
        return <p className="text-xs text-slate-400 italic p-4">Chargement des détails de la réunion...</p>;
    }

    return (
        <div className="space-y-3">
            {/* Identifiants */}
            <Section title="Informations générales" icon={IconCalendarEvent} accent="green">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconFileText size={12} className="text-slate-500" />
                            Titre
                        </div>
                        <p className="text-sm text-slate-800">{activity.title || '—'}</p>
                    </div>
                    <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconMapPin size={12} className="text-pink-600" />
                            Lieu
                        </div>
                        <p className="text-sm text-slate-800">
                            {activity?.location || <span className="text-slate-400 italic">Non renseigné</span>}
                        </p>
                    </div>
                    <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconCalendarEvent size={12} className="text-orange-600" />
                            Date planifiée
                        </div>
                        <p className="text-sm text-slate-800">
                            {activity.plannedDate ? formatDateWithDay(activity.plannedDate) : '—'}
                        </p>
                    </div>
                    <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconClock size={12} className="text-blue-600" />
                            Créneau horaire
                        </div>
                        <p className="text-sm text-slate-800">
                            {activity.startTime && activity.endTime
                                ? `${formatTimeFr(activity.startTime)} → ${formatTimeFr(activity.endTime)}`
                                : '—'}
                        </p>
                    </div>
                </div>
            </Section>

            {/* Objectifs */}
            <Section title="Objectifs de la réunion" icon={IconTarget} accent="teal" hint="ISO 45001 §5.4.b">
                {activity.objectives ? (
                    /* LOT 41 P0 XSS fix */
                    <SafeHtml html={activity.objectives} className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none" />
                ) : (
                    <p className="text-xs text-slate-400 italic">Aucun objectif renseigné.</p>
                )}
            </Section>

            {/* Agenda */}
            <Section title="Agenda" icon={IconFileText} accent="amber">
                {activity.agenda ? (
                    /* LOT 41 P0 XSS fix */
                    <SafeHtml html={activity.agenda} className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none" />
                ) : (
                    <p className="text-xs text-slate-400 italic">Aucun agenda défini.</p>
                )}
            </Section>

            {/* Résultats attendus */}
            <Section title="Résultats attendus" icon={IconChecks} accent="blue">
                {activity.expectedResults ? (
                    /* LOT 41 P0 XSS fix */
                    <SafeHtml html={activity.expectedResults} className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none" />
                ) : (
                    <p className="text-xs text-slate-400 italic">Aucun résultat attendu défini.</p>
                )}
            </Section>

            {/* Participants */}
            <Section title="Participants" icon={IconUsers} accent="violet"
                count={Array.isArray(activity.participants) ? activity.participants.length : 0}>
                {(!activity.participants || activity.participants.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">Aucun participant identifié.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {activity.participants.map((emp: any, index: number) => {
                            const name = emp?.name || (typeof emp === 'string' ? emp : 'Inconnu');
                            const role = emp?.role || '';
                            const initials = name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                            return (
                                <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-violet-50/40 border border-violet-100">
                                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-800 text-[10px] flex-shrink-0">
                                        {initials || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-800 truncate">{name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{role || 'Participant'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Section>

            {/* EPI */}
            <Section title="Équipements de protection individuelle (EPI)" icon={IconShield} accent="yellow"
                count={Array.isArray(activity.ppe) ? activity.ppe.length : 0}>
                {(!activity.ppe || activity.ppe.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">Aucun EPI requis renseigné.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {(Array.isArray(activity.ppe) ? activity.ppe : String(activity.ppe).split(',')).map((x: any, index: number) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
                                {ppeLabel(x?.toString())}
                            </span>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
};

export default ViewDetailsMeeting;
