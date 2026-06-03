import React from 'react';

export type GuideSection = {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
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
        <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg border ${accentClasses}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h4 className="text-base text-gray-900">{title}</h4>
            </div>
            <div className={`rounded-lg p-4 border bg-white/60 ${accentClasses}`}>
                <ul className="space-y-2 text-xs text-gray-700">
                    {tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <span className={`mt-1 inline-block w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`}></span>
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const GuideSidebar: React.FC<GuideSidebarProps> = ({ sections, className }) => {
    const baseClasses = "w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-4 border-t border-gray-200 mt-4 pt-4 lg:mt-0 lg:pt-0 lg:border-t-0 lg:border-l lg:pl-4 lg:self-stretch lg:h-full lg:max-h-full lg:min-h-0 lg:overflow-y-auto";
    const sidebarClasses = className ? `${baseClasses} ${className}` : baseClasses;

    return (
        <aside className={sidebarClasses}>
            {sections.map((section) => (
                <GuideCard key={section.title} section={section} />
            ))}
        </aside>
    );
};

export default GuideSidebar;
