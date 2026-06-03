import { IconAlertTriangle, IconChartBar, IconCircleCheck, IconClock, IconInfoCircle, IconTarget } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";

interface KPIData {
    name: string;
    actualMonth: number;
    forecastMonth: number;
    varianceMonth: number;
    actualYTD: number;
    budgetYTD: number;
    varianceYTD: number;
    forecastFY: number;
    budgetFY: number;
    varianceFY: number;
    category: 'Leading' | 'Lagging';
    status: 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
}
const healthSafetyKPIs: KPIData[] = [
    // Indicateurs avancés (Leading)
    {
        name: 'Réunions sécurité tenues',
        actualMonth: 240,
        forecastMonth: 208,
        varianceMonth: 15.4,
        actualYTD: 2682,
        budgetYTD: 2080,
        varianceYTD: 28.9,
        forecastFY: 2504,
        budgetFY: 2504,
        varianceFY: 0.0,
        category: 'Leading',
        status: 'good',
        trend: 'up'
    },
    {
        name: 'Visites sécurité de la direction',
        actualMonth: 22,
        forecastMonth: 12,
        varianceMonth: 83.3,
        actualYTD: 115,
        budgetYTD: 135,
        varianceYTD: -14.8,
        forecastFY: 162,
        budgetFY: 162,
        varianceFY: 0.0,
        category: 'Leading',
        status: 'warning',
        trend: 'down'
    },
    {
        name: 'Réunions HSE mensuelles paritaires',
        actualMonth: 1,
        forecastMonth: 1,
        varianceMonth: 0.0,
        actualYTD: 10,
        budgetYTD: 10,
        varianceYTD: 0.0,
        forecastFY: 12,
        budgetFY: 12,
        varianceFY: 0.0,
        category: 'Leading',
        status: 'good',
        trend: 'stable'
    },
    {
        name: 'Inspections terrain (IGP)',
        actualMonth: 59,
        forecastMonth: 64,
        varianceMonth: -7.8,
        actualYTD: 647,
        budgetYTD: 704,
        varianceYTD: -8.1,
        forecastFY: 845,
        budgetFY: 845,
        varianceFY: 0.0,
        category: 'Leading',
        status: 'warning',
        trend: 'down'
    },
    // Indicateurs retardés (Lagging)
    {
        name: "DART (jours d'arrêt, restriction, transfert)",
        actualMonth: 0.34,
        forecastMonth: 0.12,
        varianceMonth: 183.8,
        actualYTD: 0.27,
        budgetYTD: 0.12,
        varianceYTD: 125.0,
        forecastFY: 0.12,
        budgetFY: 0.12,
        varianceFY: 0.0,
        category: 'Lagging',
        status: 'critical',
        trend: 'up'
    },
    {
        name: "TRIR (Taux total d'incidents enregistrables)",
        actualMonth: 0.68,
        forecastMonth: 0.36,
        varianceMonth: 88.9,
        actualYTD: 0.60,
        budgetYTD: 0.36,
        varianceYTD: 66.7,
        forecastFY: 0.36,
        budgetFY: 0.36,
        varianceFY: 0.0,
        category: 'Lagging',
        status: 'critical',
        trend: 'up'
    },
    {
        name: 'Taux de gravité DART',
        actualMonth: 33.04,
        forecastMonth: 16.00,
        varianceMonth: 106.5,
        actualYTD: 22.70,
        budgetYTD: 16.00,
        varianceYTD: 41.9,
        forecastFY: 16.00,
        budgetFY: 16.00,
        varianceFY: 0.0,
        category: 'Lagging',
        status: 'critical',
        trend: 'up'
    },
    {
        name: 'Accident mortel',
        actualMonth: 0,
        forecastMonth: 0,
        varianceMonth: 0.0,
        actualYTD: 1,
        budgetYTD: 0,
        varianceYTD: 100.0,
        forecastFY: 0,
        budgetFY: 0,
        varianceFY: 0.0,
        category: 'Lagging',
        status: 'critical',
        trend: 'stable'
    },
    {
        name: 'Total incidents',
        actualMonth: 2,
        forecastMonth: 0,
        varianceMonth: 100.0,
        actualYTD: 18,
        budgetYTD: 0,
        varianceYTD: 100.0,
        forecastFY: 0,
        budgetFY: 0,
        varianceFY: 0.0,
        category: 'Lagging',
        status: 'critical',
        trend: 'up'
    },
    {
        name: 'Incidents communautaires (Cat 4 ou 5)',
        actualMonth: 0,
        forecastMonth: 0,
        varianceMonth: 0.0,
        actualYTD: 0,
        budgetYTD: 0,
        varianceYTD: 0.0,
        forecastFY: 0,
        budgetFY: 0,
        varianceFY: 0.0,
        category: 'Lagging',
        status: 'good',
        trend: 'stable'
    },
    {
        name: 'Incidents environnementaux (Cat 4 ou 5)',
        actualMonth: 0,
        forecastMonth: 0,
        varianceMonth: 0.0,
        actualYTD: 0,
        budgetYTD: 0,
        varianceYTD: 0.0,
        forecastFY: 0,
        budgetFY: 0,
        varianceFY: 0.0,
        category: 'Lagging',
        status: 'good',
        trend: 'stable'
    }
];
const KpiReview = () => {


    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'good': return <IconCircleCheck className="w-4 h-4 text-green-500" />;
            case 'warning': return <IconAlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'critical': return <IconAlertTriangle className="w-4 h-4 text-red-500" />;
            default: return <IconClock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getVarianceColor = (variance: number) => {
        if (Math.abs(variance) <= 5) return 'text-green-600';
        if (Math.abs(variance) <= 15) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getVarianceBackground = (variance: number) => {
        if (Math.abs(variance) <= 5) return 'bg-green-50';
        if (Math.abs(variance) <= 15) return 'bg-yellow-50';
        return 'bg-red-50';
    };
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Rapports' },
                    { label: 'Revue des KPI' },
                ]}
                icon={<IconChartBar size={22} stroke={2} />}
                iconColor="green"
                title="Revue des KPI HSE"
                subtitle="Indicateurs avancés (Leading) et retardés (Lagging) — Performance vs cible"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs uppercase tracking-wider text-slate-500">
                    Analyse des performances des indicateurs avancés et retardés
                </div>
                <div className="text-right">
                    <div className="text-lg text-slate-800">Janvier 2026</div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">Période de reporting</div>
                </div>
            </div>

            {/* Tableau KPI - style corporate */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg text-slate-900">SANTÉ & SÉCURITÉ</h3>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                Indicateurs avancés (Leading)
                            </button>
                            <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">
                                Indicateurs retardés (Lagging)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-gray-700 border-r border-gray-300">Réel mois</th>
                                <th className="px-4 py-3 text-left text-gray-700 border-r border-gray-300">Prévision mois</th>
                                <th className="px-4 py-3 text-left text-gray-700 border-r border-gray-300">Écart %</th>
                                <th className="px-4 py-3 text-left text-gray-700 border-r border-gray-300 bg-blue-50">Indicateur</th>
                                <th className="px-4 py-3 text-left text-gray-700 border-r border-gray-300">Réel cumulé</th>
                                <th className="px-4 py-3 text-left text-gray-700 border-r border-gray-300">Budget cumulé</th>
                                <th className="px-4 py-3 text-left text-gray-700 border-r border-gray-300">Écart %</th>
                                <th className="px-4 py-3 text-left text-gray-700 border-r border-gray-300">Prévision exercice</th>
                                <th className="px-4 py-3 text-left text-gray-700 border-r border-gray-300">Budget exercice</th>
                                <th className="px-4 py-3 text-left text-gray-700">Écart %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Section indicateurs avancés */}
                            <tr className="bg-green-50">
                                <td colSpan={10} className="px-4 py-2 text-green-800 border-b border-green-200">
                                    Indicateurs avancés (Leading)
                                </td>
                            </tr>
                            {healthSafetyKPIs.filter(kpi => kpi.category === 'Leading').map((kpi, index) => (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.actualMonth}
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.forecastMonth}
                                    </td>
                                    <td className={`px-4 py-3 border-r border-gray-200 text-center ${getVarianceColor(kpi.varianceMonth)} ${getVarianceBackground(kpi.varianceMonth)}`}>
                                        {kpi.varianceMonth > 0 ? '+' : ''}{kpi.varianceMonth.toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 bg-blue-50">
                                        <div className="flex items-center">
                                            {getStatusIcon(kpi.status)}
                                            <span className="ml-2 text-gray-900">{kpi.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.actualYTD}
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.budgetYTD}
                                    </td>
                                    <td className={`px-4 py-3 border-r border-gray-200 text-center ${getVarianceColor(kpi.varianceYTD)} ${getVarianceBackground(kpi.varianceYTD)}`}>
                                        {kpi.varianceYTD > 0 ? '+' : ''}{kpi.varianceYTD.toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.forecastFY}
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.budgetFY}
                                    </td>
                                    <td className={`px-4 py-3 text-center ${getVarianceColor(kpi.varianceFY)} ${getVarianceBackground(kpi.varianceFY)}`}>
                                        {kpi.varianceFY > 0 ? '+' : ''}{kpi.varianceFY.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}

                            {/* Section indicateurs retardés */}
                            <tr className="bg-red-50">
                                <td colSpan={10} className="px-4 py-2 text-red-800 border-b border-red-200">
                                    Indicateurs retardés (Lagging)
                                </td>
                            </tr>
                            {healthSafetyKPIs.filter(kpi => kpi.category === 'Lagging').map((kpi, index) => (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.actualMonth}
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.forecastMonth}
                                    </td>
                                    <td className={`px-4 py-3 border-r border-gray-200 text-center ${getVarianceColor(kpi.varianceMonth)} ${getVarianceBackground(kpi.varianceMonth)}`}>
                                        {kpi.varianceMonth > 0 ? '+' : ''}{kpi.varianceMonth.toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 bg-blue-50">
                                        <div className="flex items-center">
                                            {getStatusIcon(kpi.status)}
                                            <span className="ml-2 text-gray-900">{kpi.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.actualYTD}
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.budgetYTD}
                                    </td>
                                    <td className={`px-4 py-3 border-r border-gray-200 text-center ${getVarianceColor(kpi.varianceYTD)} ${getVarianceBackground(kpi.varianceYTD)}`}>
                                        {kpi.varianceYTD > 0 ? '+' : ''}{kpi.varianceYTD.toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.forecastFY}
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                                        {kpi.budgetFY}
                                    </td>
                                    <td className={`px-4 py-3 text-center ${getVarianceColor(kpi.varianceFY)} ${getVarianceBackground(kpi.varianceFY)}`}>
                                        {kpi.varianceFY > 0 ? '+' : ''}{kpi.varianceFY.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Points clés et recommandations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg text-slate-900 mb-6">Points clés et recommandations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-start p-4 bg-green-50 rounded-lg border border-green-200">
                            <IconCircleCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="text-green-900">Tendances positives</h4>
                                <ul className="text-sm text-green-800 mt-2 space-y-1">
                                    <li>• Réunions sécurité au-dessus de la cible de 15,4 %</li>
                                    <li>• 47 jours sans accident avec arrêt</li>
                                    <li>• Taux de formation supérieur à la cible de 95 %</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <IconInfoCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="text-blue-900">Opportunités d'amélioration</h4>
                                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                                    <li>• Renforcer la culture de déclaration des quasi-accidents</li>
                                    <li>• Accroître les visites sécurité de la direction</li>
                                    <li>• Améliorer la fréquence des inspections terrain</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start p-4 bg-red-50 rounded-lg border border-red-200">
                            <IconAlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="text-red-900">Points de vigilance</h4>
                                <ul className="text-sm text-red-800 mt-2 space-y-1">
                                    <li>• Taux DART supérieur de 183 % à la prévision</li>
                                    <li>• TRIR en hausse de 88,9 %</li>
                                    <li>• Un accident mortel enregistré sur l'exercice</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-start p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <IconTarget className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                            <div>
                                <h4 className="text-yellow-900">Actions à entreprendre</h4>
                                <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                                    <li>• Revoir les processus d'enquête incident</li>
                                    <li>• Mettre en place des contrôles sécurité supplémentaires</li>
                                    <li>• Renforcer l'engagement du management</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default KpiReview
