import { Accordion, ActionIcon, ThemeIcon, Tooltip } from '@mantine/core';
import { IconHelpCircle, IconX } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';

/**
 * HelpPanel — composant générique pour le volet d'aide latéral des formulaires SafeX360.
 *
 * Inspiré du panneau du formulaire de déclaration d'incident (ReportHelp).
 * Reprend la même esthétique sobre / éditeur logiciel pro.
 *
 * Convention :
 *  - Accordions repliables (l'utilisateur ouvre uniquement ce dont il a besoin)
 *  - Tokens slate neutres + couleur sémantique HSE uniquement sur l'icône
 *  - Pas de fonds colorés tape-à-l'œil
 *  - Textes courts, précis, références ISO citées quand pertinent
 *
 * Utilisation :
 *  <HelpPanel
 *      title="Aide : Programmer un audit"
 *      subtitle="Renseignez les paramètres essentiels à la planification."
 *      items={[
 *          { key:'scope', icon: IconTarget, iconColor:'teal', title:'Périmètre',
 *            content:'Définit les processus et zones couvertes.', isoRef:'ISO 19011 §5.4' }
 *      ]}
 *      onClose={() => setHelpVisible(false)}
 *  />
 */

export interface HelpItem {
    key: string;
    icon: Icon;
    iconColor: HelpIconColor;
    title: string;
    content: string;
    isoRef?: string;
}

export type HelpIconColor =
    | 'slate' | 'teal' | 'red' | 'orange' | 'yellow'
    | 'green' | 'blue' | 'indigo' | 'cyan' | 'pink'
    | 'amber' | 'violet';

interface HelpPanelProps {
    title: string;
    subtitle?: string;
    items: HelpItem[];
    tip?: string;
    onClose?: () => void;
    /** Couleur du header / icône d'en-tête (défaut: teal) */
    accentColor?: HelpIconColor;
}

const colorClassMap: Record<HelpIconColor, { bg: string; text: string; ring: string }> = {
    slate: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200' },
    red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
    green: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-200' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-700', ring: 'ring-pink-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200' },
};

const HelpPanel = ({
    title,
    subtitle,
    items,
    tip,
    onClose,
    accentColor = 'teal',
}: HelpPanelProps) => {
    const accent = colorClassMap[accentColor] ?? colorClassMap.teal;

    return (
        <aside className="sticky top-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg ${accent.bg} border ${accent.ring} border flex-shrink-0`}>
                            <IconHelpCircle size={16} className={accent.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm text-slate-900 leading-tight">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        {onClose && (
                            <Tooltip label="Fermer le volet d'aide">
                                <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="gray"
                                    onClick={onClose}
                                    aria-label="Fermer le volet d'aide"
                                    className="flex-shrink-0"
                                >
                                    <IconX size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </div>
                </div>

                <Accordion
                    multiple
                    variant="default"
                    chevronPosition="right"
                    styles={{
                        item: {
                            borderTop: '1px solid #E2E8F0',
                            borderBottom: 'none',
                            backgroundColor: 'transparent',
                        },
                        control: {
                            padding: '10px 14px',
                        },
                        label: { padding: 0, fontSize: '13px', fontWeight: 500, color: '#0F172A' },
                        panel: { padding: '0 14px 12px 14px' },
                        content: { paddingTop: 0 },
                        chevron: { color: '#94A3B8' },
                    }}
                >
                    {items.map((item) => {
                        const colors = colorClassMap[item.iconColor] ?? colorClassMap.slate;
                        const ItemIcon = item.icon;
                        return (
                            <Accordion.Item key={item.key} value={item.key}>
                                <Accordion.Control>
                                    <div className="flex items-center gap-2.5">
                                        <ThemeIcon size="sm" radius="md" variant="light" className={`${colors.bg} ${colors.text}`}>
                                            <ItemIcon size={14} stroke={2} />
                                        </ThemeIcon>
                                        <span>{item.title}</span>
                                    </div>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <div className="pl-8 -mt-1">
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {item.content}
                                        </p>
                                        {item.isoRef && (
                                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Réf.</span>
                                                <span className="text-[10px] text-slate-700">{item.isoRef}</span>
                                            </div>
                                        )}
                                    </div>
                                </Accordion.Panel>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>

                {tip && (
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
                        <p className="text-[11px] text-slate-500 leading-snug">
                            <span className="text-slate-700">Astuce :</span> {tip}
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default HelpPanel;
