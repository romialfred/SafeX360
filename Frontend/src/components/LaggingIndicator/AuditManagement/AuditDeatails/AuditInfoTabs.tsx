import { Text } from '@mantine/core';
import {
    IconFlag, IconTargetArrow, IconChecklist, IconTags, IconBook2,
    IconZoomCode, IconChecks, IconUsers,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { getAllActiveWorkProcess } from '../../../../services/WorkProcessService';
import { mapIdToName } from '../../../../utility/OtherUtilities';

/**
 * Onglet "Détails de l'audit" — refonte raffinée FR avec sections délimitées
 * Pattern unifié avec IncidentDetailsTab.
 */

const Section = ({
    title, icon: Icon, accent = 'indigo', hint, children, count,
}: {
    title: string;
    icon: any;
    accent?: 'indigo' | 'red' | 'green' | 'amber' | 'teal' | 'blue' | 'violet' | 'slate';
    hint?: string;
    children: React.ReactNode;
    count?: number;
}) => {
    const colors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
        indigo: { bg: 'bg-indigo-50/60', border: 'border-indigo-200/70', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
        red: { bg: 'bg-red-50/60', border: 'border-red-200/70', text: 'text-red-700', iconBg: 'bg-red-100' },
        green: { bg: 'bg-green-50/60', border: 'border-green-200/70', text: 'text-green-700', iconBg: 'bg-green-100' },
        amber: { bg: 'bg-amber-50/60', border: 'border-amber-200/70', text: 'text-amber-700', iconBg: 'bg-amber-100' },
        teal: { bg: 'bg-teal-50/60', border: 'border-teal-200/70', text: 'text-teal-700', iconBg: 'bg-teal-100' },
        blue: { bg: 'bg-blue-50/60', border: 'border-blue-200/70', text: 'text-blue-700', iconBg: 'bg-blue-100' },
        violet: { bg: 'bg-violet-50/60', border: 'border-violet-200/70', text: 'text-violet-700', iconBg: 'bg-violet-100' },
        slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', iconBg: 'bg-slate-200' },
    };
    const c = colors[accent];
    return (
        <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <header className={`px-4 py-2.5 ${c.bg} border-b ${c.border} flex items-center gap-2`}>
                <div className={`p-1 rounded ${c.iconBg}`}>
                    <Icon size={14} className={c.text} />
                </div>
                <h3 className="text-xs text-slate-800 uppercase tracking-wider flex-1">{title}</h3>
                {count !== undefined && (
                    <span className="text-[10px] text-slate-500">{count}</span>
                )}
                {hint && <span className="text-[10px] text-slate-500 italic hidden md:inline">{hint}</span>}
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
};

const FieldList = ({ data }: { data: any }) => {
    let items: string[] = [];
    if (Array.isArray(data)) items = data;
    else if (typeof data === 'string') items = data.split(',').map((s: string) => s.trim()).filter(Boolean);

    if (!items.length) {
        return <p className="text-xs text-slate-400 italic">Aucune entrée renseignée.</p>;
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-slate-700">
                    <IconChecks size={13} className="text-green-600 flex-shrink-0" />
                    <span className="capitalize">{item}</span>
                </div>
            ))}
        </div>
    );
};

const AuditInfoTabs = ({ audit, auditors }: any) => {
    const [processMap, setProcessMap] = useState<any>({});

    useEffect(() => {
        getAllActiveWorkProcess().then((processes) => {
            setProcessMap(mapIdToName(processes));
        }).catch(() => { });
    }, []);

    if (!audit || !audit.id) {
        return <p className="text-xs text-slate-400 italic p-4">Chargement des détails de l'audit...</p>;
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Section title="Objectifs de l'audit" icon={IconTargetArrow} accent="indigo"
                    hint="ISO 19011 §5.4.2" count={audit?.objectives?.length}>
                    <FieldList data={audit?.objectives} />
                </Section>

                <Section title="Équipe d'audit" icon={IconUsers} accent="teal"
                    hint="Chef + auditeurs" count={auditors?.length}>
                    {!auditors || auditors.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Aucun auditeur affecté.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {auditors.map((item: any, index: number) => (
                                <div key={index} className="flex items-start gap-2 p-2 rounded-md bg-teal-50/40 border border-teal-100">
                                    <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 text-[10px] flex-shrink-0">
                                        {item.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-800 truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{item.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            </div>

            <Section title="Méthodes d'audit" icon={IconChecklist} accent="blue"
                hint="Combinaison méthodologique">
                <FieldList data={audit.methods} />
            </Section>

            <Section title="Description de la méthodologie" icon={IconFlag} accent="amber">
                {audit.description ? (
                    <div className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: audit.description }} />
                ) : (
                    <p className="text-xs text-slate-400 italic">Description non renseignée.</p>
                )}
            </Section>

            <Section title="Références documentaires" icon={IconBook2} accent="violet">
                <FieldList data={audit.references} />
            </Section>

            <Section title="Processus audités" icon={IconTags} accent="green"
                count={audit.processes?.length}>
                {(() => {
                    let items: any[] = [];
                    if (Array.isArray(audit.processes)) items = audit.processes;
                    else if (typeof audit.processes === 'string') items = audit.processes.split(',').map((s: string) => s.trim()).filter(Boolean);

                    if (!items.length) {
                        return <p className="text-xs text-slate-400 italic">Aucun processus renseigné.</p>;
                    }
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {items.map((p: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                                    <IconChecks size={13} className="text-green-600 flex-shrink-0" />
                                    <span className="capitalize">{processMap[p]?.name || p}</span>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </Section>

            {audit.auditTypes && Object.keys(audit.auditTypes).length > 0 && (
                <Section title="Types d'audit HSE et critères" icon={IconZoomCode} accent="red">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(audit.auditTypes).map(([key, value]: [string, any]) => (
                            <div key={key} className="bg-slate-50/40 border border-slate-200 rounded-md p-3">
                                <Text size="xs" className="!text-red-800 !uppercase !tracking-wider mb-2">{key}</Text>
                                <div className="space-y-1">
                                    {Array.isArray(value) && value.map((item: any, index: number) => (
                                        <div key={index} className="flex items-start gap-1.5 text-xs text-slate-700">
                                            <IconChecks size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="capitalize">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
};

export default AuditInfoTabs;
