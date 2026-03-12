import React, { useState } from 'react';
import {
    IconArrowLeft,
    IconChartBar, // BarChart3
    IconCalendar,
    IconTrendingUp,
    IconBuilding,
    IconFileText,
    IconActivity,
    IconDownload,
    IconEye,
    IconRefresh, // RefreshCw
    IconAlertTriangle,
    IconCircleCheck, // CheckCircle
    IconClock,
    IconUsers,
    IconShield,
    IconTarget,
    IconAward,
    IconInfoCircle, // Info
    IconSettings,
    IconShare,
    IconMail,
    IconPrinter
} from '@tabler/icons-react';

interface ReportIntelligenceCenterProps {
    onBackToHome: () => void;
}

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

interface MonthlyMetric {
    month: string;
    ltifr: number;
    trir: number;
    nearMiss: number;
    training: number;
    incidents: number;
    investigations: number;
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

const monthlyTrends: MonthlyMetric[] = [
    { month: 'Jan', ltifr: 1.2, trir: 2.8, nearMiss: 45, training: 96, incidents: 3, investigations: 2 },
    { month: 'Feb', ltifr: 1.5, trir: 3.1, nearMiss: 52, training: 94, incidents: 4, investigations: 3 },
    { month: 'Mar', ltifr: 1.1, trir: 2.5, nearMiss: 48, training: 97, incidents: 2, investigations: 2 },
    { month: 'Apr', ltifr: 0.9, trir: 2.2, nearMiss: 55, training: 98, incidents: 1, investigations: 1 },
    { month: 'May', ltifr: 1.3, trir: 2.9, nearMiss: 41, training: 95, incidents: 3, investigations: 2 },
    { month: 'Jun', ltifr: 0.8, trir: 2.1, nearMiss: 58, training: 99, incidents: 1, investigations: 1 },
    { month: 'Jul', ltifr: 1.0, trir: 2.4, nearMiss: 49, training: 96, incidents: 2, investigations: 2 },
    { month: 'Aug', ltifr: 1.4, trir: 3.0, nearMiss: 44, training: 93, incidents: 4, investigations: 3 },
    { month: 'Sep', ltifr: 0.7, trir: 1.9, nearMiss: 61, training: 100, incidents: 1, investigations: 1 },
    { month: 'Oct', ltifr: 1.1, trir: 2.6, nearMiss: 47, training: 97, incidents: 2, investigations: 2 },
    { month: 'Nov', ltifr: 0.9, trir: 2.3, nearMiss: 53, training: 98, incidents: 1, investigations: 1 },
    { month: 'Dec', ltifr: 1.2, trir: 2.7, nearMiss: 46, training: 96, incidents: 3, investigations: 2 }
];

const ReportIntelligenceCenter: React.FC<ReportIntelligenceCenterProps> = ({ onBackToHome }) => {
    const [activeReport, setActiveReport] = useState<string>('monthly');
    // const [selectedPeriod, setSelectedPeriod] = useState<string>('2024');
    // const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    // const [showFilters, setShowFilters] = useState(false);

    const reportTypes = [
        { id: 'monthly', name: 'Monthly Report', icon: IconCalendar, color: 'text-blue-600' },
        { id: 'kpi', name: 'KPI Review', icon: IconChartBar, color: 'text-green-600' },
        { id: 'performance', name: 'Performance Report', icon: IconTrendingUp, color: 'text-purple-600' },
        { id: 'corporate', name: 'Corporate Report', icon: IconBuilding, color: 'text-orange-600' },
        { id: 'executive', name: 'Executive Summary', icon: IconFileText, color: 'text-indigo-600' },
        { id: 'trends', name: 'Trend Analysis', icon: IconActivity, color: 'text-teal-600' }
    ];

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

    const renderMonthlyReport = () => (
        <div className="space-y-8">
            {/* Executive Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg mr-4">
                            <IconFileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Monthly Safety Report</h2>
                            <p className="text-gray-600">January 2024 - Health & Safety Performance</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <IconDownload className="w-4 h-4 mr-2" />
                            Export PDF
                        </button>
                        <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <IconShare className="w-4 h-4 mr-2" />
                            Share
                        </button>
                    </div>
                </div>

                {/* Key Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Days Without LTI</p>
                                <p className="text-2xl font-bold text-green-700">47</p>
                            </div>
                            <IconAward className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-xs text-green-600 mt-2">↗ +47 from last month</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Training Completion</p>
                                <p className="text-2xl font-bold text-blue-700">96%</p>
                            </div>
                            <IconUsers className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-xs text-blue-600 mt-2">↗ +4% from target</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-600 font-medium">Near Miss Reports</p>
                                <p className="text-2xl font-bold text-yellow-700">45</p>
                            </div>
                            <IconEye className="w-8 h-8 text-yellow-500" />
                        </div>
                        <p className="text-xs text-yellow-600 mt-2">↗ +12 from target</p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600 font-medium">Open Incidents</p>
                                <p className="text-2xl font-bold text-red-700">3</p>
                            </div>
                            <IconAlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-xs text-red-600 mt-2">↓ -2 from last month</p>
                    </div>
                </div>

                {/* Monthly Trends Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Safety Trends</h3>
                    <div className="grid grid-cols-12 gap-2">
                        {monthlyTrends.map((month, index) => (
                            <div key={index} className="text-center">
                                <div className="text-xs text-gray-500 mb-2">{month.month}</div>
                                <div className="space-y-1">
                                    <div
                                        className="bg-red-500 rounded-sm mx-auto"
                                        style={{
                                            height: `${Math.max(month.ltifr * 20, 4)}px`,
                                            width: '8px'
                                        }}
                                        title={`LTIFR: ${month.ltifr}`}
                                    ></div>
                                    <div
                                        className="bg-blue-500 rounded-sm mx-auto"
                                        style={{
                                            height: `${Math.max(month.nearMiss / 2, 4)}px`,
                                            width: '8px'
                                        }}
                                        title={`Near Miss: ${month.nearMiss}`}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">{month.ltifr}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                            <span>LTIFR</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                            <span>Near Miss Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Department Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Department Performance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { name: 'Production', ltifr: 1.2, incidents: 8, training: 94, color: 'blue' },
                        { name: 'Maintenance', ltifr: 0.8, incidents: 3, training: 98, color: 'green' },
                        { name: 'Laboratory', ltifr: 1.5, incidents: 5, training: 96, color: 'purple' }
                    ].map((dept, index) => (
                        <div key={index} className={`border-2 border-${dept.color}-200 rounded-lg p-4 bg-${dept.color}-50`}>
                            <h4 className={`font-semibold text-${dept.color}-900 mb-3`}>{dept.name}</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">LTIFR:</span>
                                    <span className={`font-medium text-${dept.color}-700`}>{dept.ltifr}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Incidents:</span>
                                    <span className={`font-medium text-${dept.color}-700`}>{dept.incidents}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Training:</span>
                                    <span className={`font-medium text-${dept.color}-700`}>{dept.training}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderKPIReview = () => (
        <div className="space-y-8">
            {/* KPI Dashboard Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Health & Safety KPI Review</h2>
                        <p className="text-green-100">Leading and Lagging Indicators Performance Analysis</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">January 2024</div>
                        <div className="text-green-100">Reporting Period</div>
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
    );

    const renderPerformanceReport = () => (
        <div className="space-y-8">
            {/* Performance Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Safety Performance Analysis</h2>
                    <div className="flex items-center space-x-4">
                        <select className="px-3 py-2 border border-gray-300 rounded-lg">
                            <option>Last 12 Months</option>
                            <option>YTD 2024</option>
                            <option>Q4 2023</option>
                        </select>
                    </div>
                </div>

                {/* Performance Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-blue-900">Overall Safety Score</h3>
                            <IconChartBar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-blue-700 mb-2">87.5</div>
                        <div className="text-sm text-blue-600">↗ +5.2 from last quarter</div>
                        <div className="mt-4 bg-blue-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87.5%' }}></div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-green-900">Compliance Rate</h3>
                            <IconShield className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700 mb-2">94.2%</div>
                        <div className="text-sm text-green-600">↗ +2.1% from target</div>
                        <div className="mt-4 bg-green-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-purple-900">Risk Maturity</h3>
                            <IconTarget className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold text-purple-700 mb-2">Level 4</div>
                        <div className="text-sm text-purple-600">Advanced Risk Management</div>
                        <div className="mt-4 bg-purple-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Benchmark Comparison */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Benchmark Comparison</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { metric: 'LTIFR', our: 1.2, industry: 2.1, benchmark: 'Excellent' },
                            { metric: 'TRIR', our: 2.8, industry: 4.2, benchmark: 'Good' },
                            { metric: 'Training %', our: 96, industry: 85, benchmark: 'Excellent' },
                            { metric: 'Near Miss Rate', our: 45, industry: 28, benchmark: 'Excellent' }
                        ].map((item, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="text-sm text-gray-600 mb-1">{item.metric}</div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-bold text-gray-900">{item.our}</span>
                                    <span className="text-sm text-gray-500">vs {item.industry}</span>
                                </div>
                                <div className={`text-xs px-2 py-1 rounded-full ${item.benchmark === 'Excellent' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {item.benchmark}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCorporateReport = () => (
        <div className="space-y-8">
            {/* Corporate Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Corporate Safety Report</h2>
                        <p className="text-gray-300">Executive Level Health & Safety Performance</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold">Q4 2024</div>
                        <div className="text-gray-300">Quarterly Review</div>
                    </div>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Executive Summary</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Achievements</h4>
                        <div className="space-y-3">
                            <div className="flex items-center p-3 bg-green-50 rounded-lg">
                                <IconCircleCheck className="w-5 h-5 text-green-600 mr-3" />
                                <div>
                                    <div className="font-medium text-green-900">Zero Fatalities</div>
                                    <div className="text-sm text-green-700">Maintained excellent safety record</div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                                <IconAward className="w-5 h-5 text-blue-600 mr-3" />
                                <div>
                                    <div className="font-medium text-blue-900">ISO 45001 Certification</div>
                                    <div className="text-sm text-blue-700">Successfully renewed for 2024</div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                                <IconTrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                                <div>
                                    <div className="font-medium text-purple-900">Training Excellence</div>
                                    <div className="text-sm text-purple-700">96% completion rate achieved</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h4>
                        <div className="space-y-3">
                            <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                                <IconAlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                                <div>
                                    <div className="font-medium text-yellow-900">DART Rate Increase</div>
                                    <div className="text-sm text-yellow-700">183% above forecast - requires attention</div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                                <IconClock className="w-5 h-5 text-orange-600 mr-3" />
                                <div>
                                    <div className="font-medium text-orange-900">Management Visits</div>
                                    <div className="text-sm text-orange-700">14.8% below target - increase frequency</div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-red-50 rounded-lg">
                                <IconTarget className="w-5 h-5 text-red-600 mr-3" />
                                <div>
                                    <div className="font-medium text-red-900">Site Inspections</div>
                                    <div className="text-sm text-red-700">8.1% below target - resource allocation needed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategic Initiatives */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Strategic Safety Initiatives 2024</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            title: 'Digital Safety Transformation',
                            progress: 75,
                            status: 'On Track',
                            description: 'Implementation of digital safety management tools',
                            color: 'blue'
                        },
                        {
                            title: 'Behavioral Safety Program',
                            progress: 60,
                            status: 'In Progress',
                            description: 'Culture change initiative for proactive safety',
                            color: 'green'
                        },
                        {
                            title: 'Risk Assessment Modernization',
                            progress: 45,
                            status: 'Behind Schedule',
                            description: 'Updated risk assessment methodologies',
                            color: 'orange'
                        }
                    ].map((initiative, index) => (
                        <div key={index} className={`border-2 border-${initiative.color}-200 rounded-lg p-4 bg-${initiative.color}-50`}>
                            <h4 className={`font-semibold text-${initiative.color}-900 mb-2`}>{initiative.title}</h4>
                            <p className="text-sm text-gray-600 mb-4">{initiative.description}</p>
                            <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Progress</span>
                                    <span className={`font-medium text-${initiative.color}-700`}>{initiative.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`bg-${initiative.color}-500 h-2 rounded-full transition-all duration-300`}
                                        style={{ width: `${initiative.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${initiative.status === 'On Track' ? 'bg-green-100 text-green-800' :
                                initiative.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-orange-100 text-orange-800'
                                }`}>
                                {initiative.status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderExecutiveSummary = () => (
        <div className="space-y-8">
            {/* Executive Dashboard */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
                <h2 className="text-3xl font-bold mb-4">Executive Safety Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold">94.2%</div>
                        <div className="text-indigo-100">Overall Compliance</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold">1.2</div>
                        <div className="text-indigo-100">LTIFR Rate</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold">47</div>
                        <div className="text-indigo-100">Days Without LTI</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold">€2.1M</div>
                        <div className="text-indigo-100">Safety Investment</div>
                    </div>
                </div>
            </div>

            {/* Risk Heat Map */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Enterprise Risk Heat Map</h3>
                <div className="grid grid-cols-5 gap-2 mb-4">
                    {Array.from({ length: 25 }, (_, i) => {
                        const risk = Math.random();
                        const color = risk > 0.7 ? 'bg-red-500' : risk > 0.4 ? 'bg-yellow-500' : 'bg-green-500';
                        return (
                            <div key={i} className={`${color} h-8 rounded flex items-center justify-center text-white text-xs font-bold`}>
                                {Math.floor(risk * 10)}
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Low Risk</span>
                    <span>High Risk</span>
                </div>
            </div>

            {/* Financial Impact */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Safety Financial Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Cost Avoidance (2024)</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <span className="text-green-900">Prevented Incidents</span>
                                <span className="font-bold text-green-700">€850K</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-blue-900">Insurance Savings</span>
                                <span className="font-bold text-blue-700">€320K</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                <span className="text-purple-900">Productivity Gains</span>
                                <span className="font-bold text-purple-700">€1.2M</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Safety Investments</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-900">Training Programs</span>
                                <span className="font-bold text-gray-700">€450K</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-900">Safety Equipment</span>
                                <span className="font-bold text-gray-700">€680K</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-900">System Upgrades</span>
                                <span className="font-bold text-gray-700">€290K</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTrendAnalysis = () => (
        <div className="space-y-8">
            {/* Trend Analysis Header */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Safety Trend Analysis</h2>
                        <p className="text-teal-100">12-Month Performance Trends & Predictive Analytics</p>
                    </div>
                    <IconActivity className="w-12 h-12 text-teal-200" />
                </div>
            </div>

            {/* Trend Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">LTIFR Trend (12 Months)</h3>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-end justify-around p-4">
                        {monthlyTrends.map((month, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className="bg-red-500 rounded-t w-6 mb-2"
                                    style={{ height: `${Math.max(month.ltifr * 40, 8)}px` }}
                                ></div>
                                <div className="text-xs text-gray-600 transform -rotate-45">{month.month}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                            <span>Target: 2.0</span>
                            <span className="text-green-600 font-medium">Current: 1.2 ✓</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Completion Trend</h3>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-end justify-around p-4">
                        {monthlyTrends.map((month, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className="bg-blue-500 rounded-t w-6 mb-2"
                                    style={{ height: `${Math.max(month.training * 2, 8)}px` }}
                                ></div>
                                <div className="text-xs text-gray-600 transform -rotate-45">{month.month}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                            <span>Target: 95%</span>
                            <span className="text-green-600 font-medium">Current: 96% ✓</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Predictive Analytics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Predictive Analytics & Forecasting</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                        <h4 className="font-semibold text-blue-900 mb-3">Q1 2024 Forecast</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Predicted LTIFR:</span>
                                <span className="font-bold text-blue-700">1.1</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Expected Incidents:</span>
                                <span className="font-bold text-blue-700">6-8</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Training Target:</span>
                                <span className="font-bold text-blue-700">97%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                        <h4 className="font-semibold text-green-900 mb-3">Risk Indicators</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>High Risk Areas:</span>
                                <span className="font-bold text-green-700">3</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Mitigation Plans:</span>
                                <span className="font-bold text-green-700">12</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Completion Rate:</span>
                                <span className="font-bold text-green-700">78%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                        <h4 className="font-semibold text-purple-900 mb-3">Investment ROI</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Safety ROI:</span>
                                <span className="font-bold text-purple-700">340%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cost Avoidance:</span>
                                <span className="font-bold text-purple-700">€2.1M</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Investment:</span>
                                <span className="font-bold text-purple-700">€620K</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeReport) {
            case 'monthly': return renderMonthlyReport();
            case 'kpi': return renderKPIReview();
            case 'performance': return renderPerformanceReport();
            case 'corporate': return renderCorporateReport();
            case 'executive': return renderExecutiveSummary();
            case 'trends': return renderTrendAnalysis();
            default: return renderMonthlyReport();
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button
                                onClick={onBackToHome}
                                className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
                            >
                                <IconArrowLeft className="w-5 h-5 mr-2" />
                                Back to home
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                    Report & Analytics Center
                                </h1>
                                <p className="text-gray-600">Advanced reporting and business analytics for Health & Safety</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                                <IconRefresh className="w-4 h-4 mr-2" />
                                Refresh Data
                            </button>
                            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <IconSettings className="w-4 h-4 mr-2" />
                                Configure
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-8">
                {/* Report Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {reportTypes.map((report) => (
                            <button
                                key={report.id}
                                onClick={() => setActiveReport(report.id)}
                                className={`
                  flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200
                  ${activeReport === report.id
                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }
                `}
                            >
                                <report.icon className={`w-8 h-8 ${activeReport === report.id ? 'text-blue-600' : report.color} mb-2`} />
                                <span className={`text-sm font-medium text-center ${activeReport === report.id ? 'text-blue-900' : 'text-gray-700'
                                    }`}>
                                    {report.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Report Content */}
                {renderContent()}

                {/* Footer Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Last updated: {new Date().toLocaleString('en-GB')} | Data source: Safety Management System
                        </div>
                        <div className="flex space-x-3">
                            <button className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                <IconMail className="w-4 h-4 mr-2" />
                                Email Report
                            </button>
                            <button className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                <IconPrinter className="w-4 h-4 mr-2" />
                                Print
                            </button>
                            <button className="flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                                <IconDownload className="w-4 h-4 mr-2" />
                                Export All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportIntelligenceCenter;