import { Button } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import {
    IconAlertTriangle,
    IconAward,
    IconDownload,
    IconEye,
    IconFileText,
    IconShare,
    IconUsers,
} from "@tabler/icons-react";
interface MonthlyMetric {
    month: string;
    ltifr: number;
    trir: number;
    nearMiss: number;
    training: number;
    incidents: number;
    investigations: number;
}
const MonthlyReports = () => {
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

    return (
        <div className="flex flex-col gap-5 p-5">




            <div className="flex items-center justify-between  p-2">
                <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg mr-4">
                        <IconFileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-blue-600">Monthly Safety Report</h2>
                        <p className="italic">January 2024 - Health & Safety Performance</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button leftSection={<IconDownload />}>

                        Export PDF
                    </Button>
                    <Button leftSection={<IconShare />} color="green">

                        Share
                    </Button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Executive Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">


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
                        {(() => {
                            const chartData = monthlyTrends.map((m) => ({
                                month: m.month,
                                ltifr: m.ltifr,
                                nearMissRate: Number((m.nearMiss / 10).toFixed(1)),
                            }));

                            return (
                                <BarChart
                                    h={280}
                                    data={chartData}
                                    dataKey="month"
                                    withLegend
                                    withBarValueLabel
                                    withTooltip={false}
                                    legendProps={{ layout: 'horizontal', align: 'center', verticalAlign: 'bottom' }}
                                    series={[
                                        { name: 'ltifr', label: 'LTIFR', color: 'red.6' },
                                        { name: 'nearMissRate', label: 'Near Miss (x0.1)', color: 'blue.6' },
                                    ]}
                                    gridAxis="none"
                                    tickLine="y"
                                    yAxisProps={{ tickFormatter: (v: number) => v.toFixed(1) }}
                                />
                            );
                        })()}
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
        </div>
    )
}

export default MonthlyReports
