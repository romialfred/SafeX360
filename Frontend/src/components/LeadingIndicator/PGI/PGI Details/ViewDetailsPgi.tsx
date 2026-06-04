import {
    IconSearch, IconMapPin, IconClock, IconCalendarEvent, IconFileText,
    IconAlertTriangle, IconUsers, IconShield, IconTarget,
} from '@tabler/icons-react';
import { formatDateWithDay, formatTo12Hour } from "../../../../utility/DateFormats";
import { inspectionTypesMap } from "../../../../Data/DropdownData";
import { ppeRecord } from "../../../../Data/IncidentsData";
import SafeHtml from "../../../UtilityComp/SafeHtml";

const Section = ({ title, icon: Icon, accent = 'green', hint, children, count }: {
    title: string; icon: any; accent?: 'green' | 'blue' | 'amber' | 'teal' | 'violet' | 'slate' | 'yellow' | 'red';
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
        red: { bg: 'bg-red-50/60', border: 'border-red-200/70', text: 'text-red-700', iconBg: 'bg-red-100' },
    };
    const c = colors[accent];
    return (
        <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <header className={`px-4 py-2.5 ${c.bg} border-b ${c.border} flex items-center gap-2`}>
                <div className={`p-1 rounded ${c.iconBg}`}>
                    <Icon size={14} className={c.text} />
                </div>
                <h3 className="text-xs text-slate-800 uppercase tracking-wider flex-1">{title}</h3>
                {count !== undefined && <span className="text-[10px] text-slate-500">{count}</span>}
                {hint && <span className="text-[10px] text-slate-500 italic hidden md:inline">{hint}</span>}
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
};

const ViewDetailsPgi = ({ inspection }: any) => {
    if (!inspection || !inspection.id) {
        return <p className="text-xs text-slate-400 italic p-4">Chargement des détails de l'inspection...</p>;
    }

    return (
        <div className="space-y-3">
            <Section title="Informations de l'inspection" icon={IconSearch} accent="green">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconMapPin size={12} className="text-pink-600" />
                            Site / lieu
                        </div>
                        <p className="text-sm text-slate-800">
                            {inspection.site || <span className="text-slate-400 italic">Non renseigné</span>}
                        </p>
                    </div>
                    <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconCalendarEvent size={12} className="text-orange-600" />
                            Date planifiée
                        </div>
                        <p className="text-sm text-slate-800">
                            {inspection.plannedDate ? formatDateWithDay(inspection.plannedDate) : '—'}
                        </p>
                    </div>
                    <div className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconClock size={12} className="text-blue-600" />
                            Créneau horaire
                        </div>
                        <p className="text-sm text-slate-800">
                            {inspection.startTime && inspection.endTime
                                ? `${formatTo12Hour(inspection.startTime)} → ${formatTo12Hour(inspection.endTime)}`
                                : '—'}
                        </p>
                    </div>
                </div>
            </Section>

            <Section title="Description et contexte" icon={IconFileText} accent="slate">
                {inspection.description ? (
                    /* LOT 41 P0 XSS fix */
                    <SafeHtml html={inspection.description} className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none" />
                ) : (
                    <p className="text-xs text-slate-400 italic">Aucune description renseignée.</p>
                )}
            </Section>

            <Section title="Objectif" icon={IconTarget} accent="teal">
                {inspection.objectives ? (
                    <p className="text-sm text-slate-700 leading-relaxed">{inspection.objectives}</p>
                ) : (
                    <p className="text-xs text-slate-400 italic">Aucun objectif défini.</p>
                )}
            </Section>

            <Section title="Types de risques évalués" icon={IconAlertTriangle} accent="red"
                count={Array.isArray(inspection.riskTypes) ? inspection.riskTypes.length : 0}>
                {(!inspection.riskTypes || inspection.riskTypes.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">Aucun type de risque sélectionné.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {inspection.riskTypes.map((x: any, index: number) => (
                            <span key={index}
                                className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-red-50 border border-red-200 text-red-800">
                                {inspectionTypesMap[x] || x}
                            </span>
                        ))}
                    </div>
                )}
            </Section>

            <Section title="Équipe d'inspection" icon={IconUsers} accent="violet"
                count={Array.isArray(inspection.participants) ? inspection.participants.length : 0}>
                {(!inspection.participants || inspection.participants.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">Aucun inspecteur identifié.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {inspection.participants.map((emp: any, index: number) => {
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
                                        <p className="text-[10px] text-slate-500 truncate">{role || 'Inspecteur'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Section>

            <Section title="Équipements de protection individuelle (EPI)" icon={IconShield} accent="yellow"
                count={Array.isArray(inspection.ppe) ? inspection.ppe.length : 0}>
                {(!inspection.ppe || inspection.ppe.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">Aucun EPI requis renseigné.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {(Array.isArray(inspection.ppe) ? inspection.ppe : String(inspection.ppe).split(',')).map((x: any, index: number) => (
                            <span key={index}
                                className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
                                {ppeRecord[x?.toString().trim()] || x}
                            </span>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
};

export default ViewDetailsPgi;
