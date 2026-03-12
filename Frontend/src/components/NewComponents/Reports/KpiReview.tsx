import { IconAlertTriangle, IconCircleCheck, IconClock, IconInfoCircle, IconTarget } from "@tabler/icons-react";

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
    // Leading Indicators
    {
        name: 'Crew Safety Meetings Held',
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
        name: 'Management Site Safety Visits',
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
        name: 'Monthly Joint H&S Meetings',
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
        name: 'Site Inspections (IGP)',
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
    // Lagging Indicators
    {
        name: 'DART (Days Away, Restricted, Transfer)',
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
        name: 'TRIR (Total Recordable Incident Rate)',
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
        name: 'DART Severity Rate',
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
        name: 'Fatality',
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
        name: 'Total Incidents',
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
        name: 'Community Incidents (Cat 4 or 5)',
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
        name: 'Environmental Incidents (Cat 4 or 5)',
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
        <div className="p-5">
            <div className="space-y-5">

                {/* KPI Dashboard Header */}
                <div className=" rounded-xl  p-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg mr-4">
                                <IconInfoCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl text-blue-500 font-bold ">Health & Safety KPI Review</h2>
                                <p className="italic text-gray">Leading and Lagging Indicators Performance Analysis</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xl font-bold text-gray-700">January 2024</div>
                            <div className="text-gray-600">Reporting Period</div>
                        </div>
                    </div>
                </div>

                {/* KPI Table - Corporate Style */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">HEALTH & SAFETY</h3>
                            <div className="flex space-x-2">
                                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                    Leading Indicators
                                </button>
                                <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">
                                    Lagging Indicators
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Actual Month</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Forecast Month</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Variance %</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-300 bg-blue-50">Metric Name</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Actual YTD</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Budget YTD</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Variance %</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Forecast FY</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Budget FY</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Variance %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Leading Indicators Section */}
                                <tr className="bg-green-50">
                                    <td colSpan={10} className="px-4 py-2 font-semibold text-green-800 border-b border-green-200">
                                        Leading Indicators
                                    </td>
                                </tr>
                                {healthSafetyKPIs.filter(kpi => kpi.category === 'Leading').map((kpi, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 border-r border-gray-200 text-center font-medium">
                                            {kpi.actualMonth}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center">
                                            {kpi.forecastMonth}
                                        </td>
                                        <td className={`px-4 py-3 border-r border-gray-200 text-center font-medium ${getVarianceColor(kpi.varianceMonth)} ${getVarianceBackground(kpi.varianceMonth)}`}>
                                            {kpi.varianceMonth > 0 ? '+' : ''}{kpi.varianceMonth.toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 bg-blue-50">
                                            <div className="flex items-center">
                                                {getStatusIcon(kpi.status)}
                                                <span className="ml-2 font-medium text-gray-900">{kpi.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center font-medium">
                                            {kpi.actualYTD}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center">
                                            {kpi.budgetYTD}
                                        </td>
                                        <td className={`px-4 py-3 border-r border-gray-200 text-center font-medium ${getVarianceColor(kpi.varianceYTD)} ${getVarianceBackground(kpi.varianceYTD)}`}>
                                            {kpi.varianceYTD > 0 ? '+' : ''}{kpi.varianceYTD.toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center">
                                            {kpi.forecastFY}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center">
                                            {kpi.budgetFY}
                                        </td>
                                        <td className={`px-4 py-3 text-center font-medium ${getVarianceColor(kpi.varianceFY)} ${getVarianceBackground(kpi.varianceFY)}`}>
                                            {kpi.varianceFY > 0 ? '+' : ''}{kpi.varianceFY.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}

                                {/* Lagging Indicators Section */}
                                <tr className="bg-red-50">
                                    <td colSpan={10} className="px-4 py-2 font-semibold text-red-800 border-b border-red-200">
                                        Lagging Indicators
                                    </td>
                                </tr>
                                {healthSafetyKPIs.filter(kpi => kpi.category === 'Lagging').map((kpi, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 border-r border-gray-200 text-center font-medium">
                                            {kpi.actualMonth}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center">
                                            {kpi.forecastMonth}
                                        </td>
                                        <td className={`px-4 py-3 border-r border-gray-200 text-center font-medium ${getVarianceColor(kpi.varianceMonth)} ${getVarianceBackground(kpi.varianceMonth)}`}>
                                            {kpi.varianceMonth > 0 ? '+' : ''}{kpi.varianceMonth.toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 bg-blue-50">
                                            <div className="flex items-center">
                                                {getStatusIcon(kpi.status)}
                                                <span className="ml-2 font-medium text-gray-900">{kpi.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center font-medium">
                                            {kpi.actualYTD}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center">
                                            {kpi.budgetYTD}
                                        </td>
                                        <td className={`px-4 py-3 border-r border-gray-200 text-center font-medium ${getVarianceColor(kpi.varianceYTD)} ${getVarianceBackground(kpi.varianceYTD)}`}>
                                            {kpi.varianceYTD > 0 ? '+' : ''}{kpi.varianceYTD.toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center">
                                            {kpi.forecastFY}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center">
                                            {kpi.budgetFY}
                                        </td>
                                        <td className={`px-4 py-3 text-center font-medium ${getVarianceColor(kpi.varianceFY)} ${getVarianceBackground(kpi.varianceFY)}`}>
                                            {kpi.varianceFY > 0 ? '+' : ''}{kpi.varianceFY.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Key Insights */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Insights & Recommendations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start p-4 bg-green-50 rounded-lg border border-green-200">
                                <IconCircleCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-green-900">Positive Trends</h4>
                                    <ul className="text-sm text-green-800 mt-2 space-y-1">
                                        <li>• Safety meetings exceeded target by 15.4%</li>
                                        <li>• 47 days without lost time injury</li>
                                        <li>• Training completion above 95% target</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <IconInfoCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-blue-900">Opportunities</h4>
                                    <ul className="text-sm text-blue-800 mt-2 space-y-1">
                                        <li>• Increase near miss reporting culture</li>
                                        <li>• Enhance management safety visits</li>
                                        <li>• Improve site inspection frequency</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start p-4 bg-red-50 rounded-lg border border-red-200">
                                <IconAlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-900">Areas of Concern</h4>
                                    <ul className="text-sm text-red-800 mt-2 space-y-1">
                                        <li>• DART rate 183% above forecast</li>
                                        <li>• TRIR increased by 88.9%</li>
                                        <li>• One fatality recorded YTD</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-start p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <IconTarget className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-yellow-900">Action Items</h4>
                                    <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                                        <li>• Review incident investigation processes</li>
                                        <li>• Implement additional safety controls</li>
                                        <li>• Increase management engagement</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default KpiReview