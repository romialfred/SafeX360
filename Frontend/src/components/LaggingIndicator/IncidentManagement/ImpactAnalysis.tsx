import {
    IconFileText, IconAlertTriangle, IconChartDots3, IconActivity,
    IconChartBar, IconScale, IconShield,
} from '@tabler/icons-react';
import SafeHtml from '../../UtilityComp/SafeHtml';

/**
 * Analyse causale ISO 45001 §10.2.1.c — sections raffinées (épuré, FR).
 */

const ImpactAnalysis = ({ incident }: any) => {
    const sections = [
        { key: 'factual', title: "Description factuelle", icon: IconFileText, color: 'slate', content: incident.factualDescription, hint: 'Récit chronologique et objectif des faits' },
        { key: 'immediate', title: "Causes immédiates", icon: IconAlertTriangle, color: 'red', content: incident.immediateCauses, hint: 'Actes ou conditions ayant directement déclenché l\'événement' },
        { key: 'root', title: "Causes profondes", icon: IconChartDots3, color: 'orange', content: incident.rootCauses, hint: 'Facteurs organisationnels ou systémiques sous-jacents (ISO 45001 §10.2.1.c)' },
        { key: 'contributing', title: "Facteurs contributifs", icon: IconActivity, color: 'yellow', content: incident.contributingFactors, hint: 'Conditions ayant aggravé ou facilité l\'incident' },
        { key: 'immediateConseq', title: "Conséquences immédiates", icon: IconChartBar, color: 'cyan', content: incident.immediateConsequences, hint: 'Impacts directs constatés' },
        { key: 'potentialConseq', title: "Conséquences potentielles", icon: IconScale, color: 'violet', content: incident.potentialConsequences, hint: 'Ce qui aurait pu se produire dans le pire scénario' },
        { key: 'actions', title: "Actions immédiates prises", icon: IconShield, color: 'green', content: incident.immediateActions, hint: 'Mesures conservatoires appliquées sur le champ' },
    ];

    const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
        slate: { bg: 'bg-slate-50/60', border: 'border-slate-200/70', text: 'text-slate-700', iconBg: 'bg-slate-100' },
        red: { bg: 'bg-red-50/60', border: 'border-red-200/70', text: 'text-red-700', iconBg: 'bg-red-100' },
        orange: { bg: 'bg-orange-50/60', border: 'border-orange-200/70', text: 'text-orange-700', iconBg: 'bg-orange-100' },
        yellow: { bg: 'bg-yellow-50/60', border: 'border-yellow-200/70', text: 'text-yellow-700', iconBg: 'bg-yellow-100' },
        cyan: { bg: 'bg-cyan-50/60', border: 'border-cyan-200/70', text: 'text-cyan-700', iconBg: 'bg-cyan-100' },
        violet: { bg: 'bg-violet-50/60', border: 'border-violet-200/70', text: 'text-violet-700', iconBg: 'bg-violet-100' },
        green: { bg: 'bg-green-50/60', border: 'border-green-200/70', text: 'text-green-700', iconBg: 'bg-green-100' },
    };

    return (
        <div className="space-y-3">
            {sections.map((s) => {
                const c = colorMap[s.color];
                const Icon = s.icon;
                const hasContent = s.content && s.content !== '<p></p>' && s.content !== '';
                return (
                    <section key={s.key} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <header className={`px-4 py-2.5 ${c.bg} border-b ${c.border} flex items-center gap-2`}>
                            <div className={`p-1 rounded ${c.iconBg}`}>
                                <Icon size={14} className={c.text} />
                            </div>
                            <h3 className="text-xs text-slate-800 uppercase tracking-wider flex-1">
                                {s.title}
                            </h3>
                            <span className="text-[10px] text-slate-500 italic hidden md:inline">{s.hint}</span>
                        </header>
                        <div className="p-4">
                            {hasContent ? (
                                /* LOT 41 P0 XSS fix */
                                <SafeHtml html={s.content} className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none" />
                            ) : (
                                <p className="text-xs text-slate-400 italic">Information non renseignée à ce stade de l'analyse.</p>
                            )}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

export default ImpactAnalysis;
