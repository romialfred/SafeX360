import React from 'react';
import {
    IconShieldCheck,
    IconSearch,
    IconStack2,
    IconRefresh,
    IconUsersGroup,
    IconChartBar,
} from '@tabler/icons-react';

const SERIF = "'Source Serif 4', Georgia, serif";

interface GuideBlock {
    accent: string; // classe Tailwind de la bordure gauche
    iconColor: string; // classe Tailwind de la couleur d'icône
    titleColor: string; // classe Tailwind du titre
    icon: React.ReactNode;
    clause: string;
    title: string;
    body: string;
}

/**
 * Panneau « Bonnes pratiques ISO 45001 » du module Gestion des Risques.
 * Colonne latérale collante (même style que le guide des permissions) :
 * blocs à bordure gauche colorée, titres serif, type compacte 12-13 px.
 * Réutilisable : la page hôte décide où le placer.
 */
const Iso45001Guide: React.FC = () => {
    const blocks: GuideBlock[] = [
        {
            accent: 'border-emerald-500',
            iconColor: 'text-emerald-600',
            titleColor: 'text-emerald-900',
            icon: <IconSearch size={16} stroke={1.8} />,
            clause: '6.1.2',
            title: 'Identification proactive des dangers',
            body: "Repérez les dangers avant l'incident : tâches de routine et exceptionnelles, situations d'urgence, facteurs humains et organisationnels. Associez les travailleurs à cette identification.",
        },
        {
            accent: 'border-teal-600',
            iconColor: 'text-teal-700',
            titleColor: 'text-teal-900',
            icon: <IconStack2 size={16} stroke={1.8} />,
            clause: '8.1.2',
            title: 'Hiérarchie des mesures de maîtrise',
            body: "Réduisez le risque dans l'ordre : élimination, substitution, mesures d'ingénierie, mesures administratives, puis équipements de protection individuelle. L'EPI reste le dernier recours.",
        },
        {
            accent: 'border-amber-500',
            iconColor: 'text-amber-600',
            titleColor: 'text-amber-900',
            icon: <IconRefresh size={16} stroke={1.8} />,
            clause: 'Risque résiduel',
            title: 'Ré-évaluer après les mesures',
            body: "Une fois les mesures en place, recotez le risque pour mesurer le niveau résiduel. Vérifiez qu'il devient acceptable et planifiez de nouvelles actions si nécessaire.",
        },
        {
            accent: 'border-sky-500',
            iconColor: 'text-sky-600',
            titleColor: 'text-sky-900',
            icon: <IconUsersGroup size={16} stroke={1.8} />,
            clause: '5.4',
            title: 'Consultation des travailleurs',
            body: "Consultez et faites participer les travailleurs à l'évaluation et au choix des mesures de maîtrise. Leur connaissance du terrain renforce la pertinence des décisions.",
        },
        {
            accent: 'border-violet-500',
            iconColor: 'text-violet-600',
            titleColor: 'text-violet-900',
            icon: <IconChartBar size={16} stroke={1.8} />,
            clause: 'Clause 9',
            title: 'Revue et surveillance',
            body: "Surveillez l'efficacité des mesures et réexaminez les risques après tout incident, changement de procédé ou constat d'audit. La maîtrise du risque est un cycle continu.",
        },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:sticky lg:top-6">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <IconShieldCheck size={16} className="text-red-600" />
                <h2 className="text-slate-900" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 15 }}>
                    Bonnes pratiques ISO 45001
                </h2>
            </div>

            <div className="px-5 py-4 space-y-4">
                {blocks.map((b) => (
                    <div key={b.title} className={`border-l-[3px] ${b.accent} pl-3`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={b.iconColor}>{b.icon}</span>
                            <h3 className={`text-[13px] font-medium ${b.titleColor}`}>{b.title}</h3>
                        </div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium mb-1">
                            {b.clause}
                        </div>
                        <p className="text-[12px] text-slate-600 leading-relaxed">{b.body}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Iso45001Guide;
