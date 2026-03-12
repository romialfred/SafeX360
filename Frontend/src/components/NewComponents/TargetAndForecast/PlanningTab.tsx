import { IconAlertTriangle, IconCircleCheck, IconClock, IconDeviceFloppy, IconPlus } from "@tabler/icons-react";
import { useState } from "react";


interface HealthSafetyIndicator {
    id: string;
    name: string;
    definition: string;
    category: 'Leading' | 'Lagging' | 'Community';
    frequency: 'Monthly' | 'Quarterly' | 'Annual';
    hasForecast: boolean;
    unit: string;
    createdDate: string;
    isActive: boolean;
}
interface MonthlyTarget {
    month: string;
    target: number;
    forecast: number;
    actual?: number;
}
interface IndicatorPlan {
    indicatorId: string;
    year: number;
    monthlyTargets: MonthlyTarget[];
    quarterlyTargets?: { quarter: string; target: number; forecast: number; actual?: number; }[];
    annualTarget?: { target: number; forecast: number; actual?: number; };
}
const mockIndicators: HealthSafetyIndicator[] = [
    {
        id: 'LTIFR',
        name: 'Lost Time Injury Frequency Rate',
        definition: 'Number of lost time injuries per 200,000 hours worked',
        category: 'Lagging',
        frequency: 'Monthly',
        hasForecast: true,
        unit: 'per 200,000 hours',
        createdDate: '2024-01-01',
        isActive: true
    },
    {
        id: 'TRIR',
        name: 'Total Recordable Incident Rate',
        definition: 'Total number of recordable incidents per 200,000 hours worked',
        category: 'Lagging',
        frequency: 'Monthly',
        hasForecast: true,
        unit: 'per 200,000 hours',
        createdDate: '2024-01-01',
        isActive: true
    },
    {
        id: 'NEAR_MISS',
        name: 'Near Miss Reporting Rate',
        definition: 'Number of near miss reports submitted per month',
        category: 'Leading',
        frequency: 'Monthly',
        hasForecast: true,
        unit: 'reports/month',
        createdDate: '2024-01-01',
        isActive: true
    },
    {
        id: 'TRAINING_COMP',
        name: 'Safety Training Completion',
        definition: 'Percentage of employees who completed mandatory safety training',
        category: 'Leading',
        frequency: 'Quarterly',
        hasForecast: true,
        unit: '%',
        createdDate: '2024-01-01',
        isActive: true
    },
    {
        id: 'COMMUNITY_ENG',
        name: 'Community Engagement Score',
        definition: 'Score measuring community involvement in safety initiatives',
        category: 'Community',
        frequency: 'Quarterly',
        hasForecast: false,
        unit: 'score (1-10)',
        createdDate: '2024-01-01',
        isActive: true
    }
];

const mockPlans: IndicatorPlan[] = [
    {
        indicatorId: 'LTIFR',
        year: 2024,
        monthlyTargets: [
            { month: 'Jan', target: 2.0, forecast: 1.8, actual: 1.2 },
            { month: 'Feb', target: 2.0, forecast: 1.8, actual: 1.5 },
            { month: 'Mar', target: 2.0, forecast: 1.8, actual: 1.1 },
            { month: 'Apr', target: 2.0, forecast: 1.8 },
            { month: 'May', target: 2.0, forecast: 1.8 },
            { month: 'Jun', target: 2.0, forecast: 1.8 },
            { month: 'Jul', target: 2.0, forecast: 1.8 },
            { month: 'Aug', target: 2.0, forecast: 1.8 },
            { month: 'Sep', target: 2.0, forecast: 1.8 },
            { month: 'Oct', target: 2.0, forecast: 1.8 },
            { month: 'Nov', target: 2.0, forecast: 1.8 },
            { month: 'Dec', target: 2.0, forecast: 1.8 }
        ]
    }
];
const PlanningTab = () => {
    const [indicators, _setIndicators] = useState<HealthSafetyIndicator[]>(mockIndicators);
    const [selectedYear, setSelectedYear] = useState<number>(2024);
    const forecastIndicators = indicators.filter(ind => ind.hasForecast && ind.isActive);

    const years = [2022, 2023, 2024, 2025, 2026];
    return (
        <div>
            <div className="space-y-6">
                {/* Planning Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Année de Planification
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Indicateur à Planifier
                            </label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Sélectionner un indicateur</option>
                                {forecastIndicators.map(indicator => (
                                    <option key={indicator.id} value={indicator.id}>
                                        {indicator.name} ({indicator.frequency})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <IconPlus className="w-4 h-4 mr-2" />
                                Créer Plan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Monthly Planning Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Planification Mensuelle - LTIFR {selectedYear}</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forecast</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {mockPlans[0]?.monthlyTargets.map((month, index) => {
                                    const variance = month.actual ? ((month.actual - month.target) / month.target * 100) : null;
                                    const status = month.actual ?
                                        (month.actual <= month.target ? 'success' : 'warning') : 'pending';

                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {month.month}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={month.target}
                                                    step="0.1"
                                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={month.forecast}
                                                    step="0.1"
                                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {month.actual || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {variance !== null ? (
                                                    <span className={variance <= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {status === 'success' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <IconCircleCheck className="w-3 h-3 mr-1" />
                                                        Atteint
                                                    </span>
                                                )}
                                                {status === 'warning' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                        <IconAlertTriangle className="w-3 h-3 mr-1" />
                                                        Dépassé
                                                    </span>
                                                )}
                                                {status === 'pending' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        <IconClock className="w-3 h-3 mr-1" />
                                                        En cours
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
                            </div>
                            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <IconDeviceFloppy className="w-4 h-4 mr-2" />
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PlanningTab