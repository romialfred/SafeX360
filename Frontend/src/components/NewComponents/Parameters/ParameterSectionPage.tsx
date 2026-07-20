import { ReactNode, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tooltip } from '@mantine/core';
import { IconChevronRight, IconInfoCircle } from '@tabler/icons-react';
import ColoredTabs from '../../UtilityComp/ColoredTabs';

/**
 * ParameterSectionPage — Shell commun des pages de paramètres.
 *
 * Une section de paramètres (Sites & Environnement, Incidents, Outils…) est
 * UNE page dont les onglets sont ses référentiels. Le contenu de l'onglet est
 * rendu en place : plus de navigation vers un écran isolé au design différent.
 *
 * L'onglet actif est porté par l'URL (?tab=…), ce qui rend le lien partageable
 * et surtout préserve l'onglet au retour arrière du navigateur.
 */

type Tone = 'teal' | 'red' | 'violet' | 'blue';

export interface ParameterTab {
    id: string;
    label: string;
    /** Sous-titre affiché sous le titre de la page quand l'onglet est actif. */
    description?: string;
    content: ReactNode;
}

interface Props {
    /** Dernier niveau du fil d'Ariane, ex. « Sites & Environnement ». */
    breadcrumb: string;
    title: string;
    /** Phrase d'accroche décrivant la section. */
    intro: string;
    icon: React.ComponentType<any>;
    tone?: Tone;
    tabs: ParameterTab[];
    /** Infobulle d'aide au niveau de la page. */
    helpText?: string;
}

const TONE_GRADIENT: Record<Tone, string> = {
    teal: 'from-teal-500 to-teal-700',
    red: 'from-rose-500 to-rose-700',
    violet: 'from-violet-500 to-violet-700',
    blue: 'from-sky-500 to-sky-700',
};

export default function ParameterSectionPage({
    breadcrumb,
    title,
    intro,
    icon: Icon,
    tone = 'teal',
    tabs,
    helpText,
}: Props) {
    const [searchParams, setSearchParams] = useSearchParams();

    const requested = searchParams.get('tab');
    const activeId = useMemo(
        () => (tabs.some((t) => t.id === requested) ? (requested as string) : tabs[0]?.id),
        [requested, tabs],
    );
    const activeTab = tabs.find((t) => t.id === activeId);

    const handleChange = (id: string) => {
        // replace: naviguer entre onglets ne doit pas empiler d'entrées d'historique,
        // sinon « retour » reparcourt les onglets au lieu de quitter la page.
        setSearchParams({ tab: id }, { replace: true });
    };

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-8 py-5">
            <div className="max-w-[1280px] mx-auto">
                {/* En-tête */}
                <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                        <span className="uppercase tracking-[0.14em] font-medium">SafeX 360</span>
                        <IconChevronRight size={9} className="text-slate-400" />
                        <span className="uppercase tracking-[0.14em] font-medium">Paramètres</span>
                        <IconChevronRight size={9} className="text-slate-400" />
                        <span className="uppercase tracking-[0.14em] text-slate-700 font-medium">{breadcrumb}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div
                            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${TONE_GRADIENT[tone]} flex items-center justify-center shadow-sm flex-shrink-0`}
                        >
                            <Icon size={17} stroke={1.8} className="text-white" />
                        </div>
                        <h1
                            className="text-slate-900"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(20px, 2.2vw, 24px)',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {title}
                        </h1>
                        {helpText && (
                            <Tooltip label={helpText} multiline w={320} withArrow position="bottom-start">
                                <span className="cursor-help text-slate-400 hover:text-teal-600 transition-colors">
                                    <IconInfoCircle size={16} stroke={1.6} />
                                </span>
                            </Tooltip>
                        )}
                    </div>

                    <p className="text-[12.5px] text-slate-600 mt-1.5 max-w-3xl">
                        {activeTab?.description || intro}
                    </p>
                </div>

                {/* Onglets */}
                <div className="mb-4">
                    <ColoredTabs
                        tabs={tabs.map((t) => ({ id: t.id, label: t.label, tone }))}
                        activeId={activeId}
                        onChange={handleChange}
                    />
                </div>

                {/* Contenu de l'onglet actif — monté uniquement quand sélectionné */}
                <div key={activeId}>{activeTab?.content}</div>
            </div>
        </div>
    );
}
