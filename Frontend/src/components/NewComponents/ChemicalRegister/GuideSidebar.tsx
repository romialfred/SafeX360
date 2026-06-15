import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Colonne d'aide latérale réutilisable (LOT 50) — cartes de conseils sobres
 * affichées à droite des formulaires d'évaluation.
 */

export type GuideSection = {
    title: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    color: string;
    accentClasses: string;
    tips: string[];
};

interface GuideSidebarProps {
    sections: GuideSection[];
    className?: string;
}

const GuideCard = ({ section }: { section: GuideSection }) => {
    const { title, icon: Icon, color, accentClasses, tips } = section;

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center gap-2.5 mb-2.5">
                <span className={`inline-flex p-1.5 rounded-md border ${accentClasses}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                </span>
                <h4
                    className="text-slate-800"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </h4>
            </div>
            <ul className="space-y-1.5 text-[12px] text-slate-600 leading-relaxed">
                {tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <span
                            className={`mt-1.5 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.replace('text-', 'bg-')}`}
                            aria-hidden="true"
                        />
                        <span>{tip}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const GuideSidebar: React.FC<GuideSidebarProps> = ({ sections, className }) => {
    const { t } = useTranslation('risk');
    const baseClasses =
        'w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-3 border-t border-slate-200 mt-4 pt-4 lg:mt-0 lg:pt-0 lg:border-t-0 lg:border-l lg:pl-4 lg:self-stretch lg:h-full lg:max-h-full lg:min-h-0 lg:overflow-y-auto';
    const sidebarClasses = className ? `${baseClasses} ${className}` : baseClasses;

    return (
        <aside className={sidebarClasses} aria-label={t('assessmentTab.guideAria')}>
            {sections.map((section) => (
                <GuideCard key={section.title} section={section} />
            ))}
        </aside>
    );
};

export default GuideSidebar;
