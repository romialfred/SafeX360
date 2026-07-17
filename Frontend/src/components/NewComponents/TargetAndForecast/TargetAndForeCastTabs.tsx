/**
 * TargetAndForeCastTabs — En-tete + navigation du module « Indicateurs &
 * Performance » (Target and Forecast Set).
 *
 * Deux onglets :
 *   - details  : referentiel des indicateurs HSE (HsIndicators)
 *   - analysis : planification des cibles/previsions (PlanningTab)
 *
 * Style aligne sur EquipmentRegistryPage : fond creme, hero carte blanche avec
 * icone degradee + titre Source Serif 4. Chaque onglet gere ses propres cartes
 * sur le fond creme (pas de double encadrement des panels).
 */

import { Breadcrumbs, Tabs, Text } from '@mantine/core';
import { IconChartBar, IconTarget } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import HsIndicators from './HsIndicators';
import PlanningTab from './PlanningTab';
import { CREAM_BG, SECTION_TITLE_STYLE } from './indicatorLabels';

const TABS = [
    { key: 'details', label: 'Indicateurs Sante-Securite', icon: IconChartBar, content: <HsIndicators /> },
    { key: 'analysis', label: 'Planification des performances', icon: IconTarget, content: <PlanningTab /> },
] as const;

const TargetAndForeCastTabs = () => {
    const [activeTab, setActiveTab] = useState<string>('details');

    return (
        <div className="min-h-full px-4 sm:px-5 lg:px-6 py-6" style={{ backgroundColor: CREAM_BG }}>
            <div className="w-full">
                {/* Breadcrumb */}
                <Breadcrumbs className="mb-3 text-[11px]">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient" className="hover:!underline cursor-pointer">Accueil</Text>
                    </Link>
                    <Link className="hover:!underline" to="/settings">
                        <Text variant="gradient" className="hover:!underline cursor-pointer">Parametres</Text>
                    </Link>
                    <Text variant="gradient">Indicateurs &amp; Performance</Text>
                </Breadcrumbs>

                {/* Hero */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="px-4 py-3 flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <IconTarget size={18} stroke={1.8} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1
                                className="text-slate-900 leading-tight truncate"
                                style={{
                                    ...SECTION_TITLE_STYLE,
                                    fontSize: 'clamp(17px, 1.6vw, 20px)',
                                }}
                            >
                                Indicateurs &amp; Performance
                            </h1>
                            <p className="text-[12px] text-slate-500 truncate">
                                Definir les indicateurs HSE et planifier leurs cibles annuelles — ISO 45001 §9.1
                            </p>
                        </div>
                    </div>
                </div>

                {/* Onglets (pills segmentees) */}
                <Tabs value={activeTab} onChange={(v) => v && setActiveTab(v)} keepMounted={false}>
                    <Tabs.List className="bg-white border border-slate-200 rounded-xl p-1.5 !flex !gap-1 shadow-sm mb-4">
                        {TABS.map(({ key, label, icon: Icon }) => (
                            <Tabs.Tab
                                key={key}
                                value={key}
                                leftSection={<Icon size={15} stroke={1.8} />}
                                className="!text-slate-500 hover:!text-slate-700 data-[active]:!bg-violet-50 data-[active]:!text-violet-800 data-[active]:!font-medium !border-0 !rounded-lg px-3.5 py-2 text-[12.5px] transition-all duration-200"
                            >
                                {label}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>

                    {TABS.map(({ key, content }) => (
                        <Tabs.Panel value={key} key={key}>
                            {content}
                        </Tabs.Panel>
                    ))}
                </Tabs>
            </div>
        </div>
    );
};

export default TargetAndForeCastTabs;
