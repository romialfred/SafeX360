import React from 'react';
import { IconShieldCheck } from '@tabler/icons-react';
import { RISK_LEVEL_CONFIG } from './riskLabels';

const SERIF = "'Source Serif 4', Georgia, serif";

/**
 * Bandeau « Cadre ISO 45001 » de la vue d'ensemble des risques.
 * Deux blocs côte à côte : critères de cotation (légende des niveaux,
 * couleurs reprises de riskLabels.ts) et hiérarchie des mesures de
 * maîtrise (8.1.2) sous forme de stepper vertical, du plus efficace
 * au dernier recours. Style charte : carte blanche, titres serif.
 */

// Légende des paliers de cotation (couleurs centralisées dans riskLabels.ts).
const RATING_LEGEND = [
    { key: 'Low', label: RISK_LEVEL_CONFIG.Low.label, chip: RISK_LEVEL_CONFIG.Low.chip },
    { key: 'Medium', label: RISK_LEVEL_CONFIG.Medium.label, chip: RISK_LEVEL_CONFIG.Medium.chip },
    { key: 'Med High', label: RISK_LEVEL_CONFIG['Med High'].label, chip: RISK_LEVEL_CONFIG['Med High'].chip },
    { key: 'High', label: RISK_LEVEL_CONFIG.High.label, chip: RISK_LEVEL_CONFIG.High.chip },
];

// Hiérarchie des mesures de maîtrise (clause 8.1.2), du plus efficace au moins efficace.
interface ControlTier {
    rank: number;
    title: string;
    desc: string;
    dot: string; // pastille du numéro (fond + texte)
    rail: string; // teinte du rail vertical
}

const CONTROL_TIERS: ControlTier[] = [
    {
        rank: 1,
        title: 'Élimination',
        desc: 'Supprimer le danger à la source. La mesure la plus efficace.',
        dot: 'bg-emerald-600 text-white',
        rail: 'bg-emerald-200',
    },
    {
        rank: 2,
        title: 'Substitution',
        desc: 'Remplacer le danger par une option moins dangereuse.',
        dot: 'bg-teal-600 text-white',
        rail: 'bg-teal-200',
    },
    {
        rank: 3,
        title: "Mesures d'ingénierie",
        desc: 'Protection collective : isolement, ventilation, protecteurs de machine.',
        dot: 'bg-amber-500 text-white',
        rail: 'bg-amber-200',
    },
    {
        rank: 4,
        title: 'Mesures administratives',
        desc: 'Procédures, consignes, signalisation, rotation et formation.',
        dot: 'bg-orange-500 text-white',
        rail: 'bg-orange-200',
    },
    {
        rank: 5,
        title: 'Équipements de protection individuelle (EPI)',
        desc: 'Casque, gants, harnais : le dernier recours, en complément des autres mesures.',
        dot: 'bg-rose-500 text-white',
        rail: 'bg-rose-200',
    },
];

const Iso45001Band: React.FC = () => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <IconShieldCheck size={16} className="text-red-600" />
                <h2 className="text-slate-900" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 15 }}>
                    Cadre ISO 45001
                </h2>
            </div>

            <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Bloc 1 : critères de cotation du risque */}
                <div>
                    <div className="text-[11.5px] uppercase tracking-wide text-slate-400 font-medium mb-2.5">
                        Critères de cotation du risque
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {RATING_LEGEND.map((lvl) => (
                            <span
                                key={lvl.key}
                                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium ${lvl.chip}`}
                            >
                                <span className="w-2 h-2 rounded-full bg-current opacity-70" aria-hidden="true" />
                                {lvl.label}
                            </span>
                        ))}
                    </div>
                    <p className="text-[11.5px] text-slate-500 leading-relaxed mt-3">
                        Niveau calculé par la combinaison probabilité × gravité. Au-delà de « Modéré », un plan
                        d'action suivi est attendu.
                    </p>
                </div>

                {/* Bloc 2 : hiérarchie des mesures de maîtrise (8.1.2) */}
                <div className="lg:border-l lg:border-slate-100 lg:pl-5">
                    <div className="flex items-baseline justify-between mb-2.5">
                        <div className="text-[11.5px] uppercase tracking-wide text-slate-400 font-medium">
                            Hiérarchie des mesures de maîtrise
                        </div>
                        <span className="text-[10.5px] text-slate-400 tracking-wide">8.1.2</span>
                    </div>

                    <ol className="space-y-0">
                        {CONTROL_TIERS.map((tier, idx) => (
                            <li key={tier.rank} className="flex gap-3">
                                {/* Colonne pastille + rail vertical */}
                                <div className="flex flex-col items-center flex-shrink-0">
                                    <span
                                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold tabular-nums ${tier.dot}`}
                                    >
                                        {tier.rank}
                                    </span>
                                    {idx < CONTROL_TIERS.length - 1 && (
                                        <span className={`w-px flex-1 my-1 ${tier.rail}`} aria-hidden="true" />
                                    )}
                                </div>
                                {/* Contenu */}
                                <div className={idx < CONTROL_TIERS.length - 1 ? 'pb-2.5' : ''}>
                                    <div className="text-[12.5px] font-medium text-slate-800 leading-tight">
                                        {tier.title}
                                        {idx === 0 && (
                                            <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-700">
                                                le plus efficace
                                            </span>
                                        )}
                                        {idx === CONTROL_TIERS.length - 1 && (
                                            <span className="ml-2 text-[10px] uppercase tracking-wide text-rose-700">
                                                dernier recours
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11.5px] text-slate-500 leading-snug mt-0.5">{tier.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Iso45001Band;
