import { IconActivity } from "@tabler/icons-react";

interface MonthlyMetric {
    month: string;
    ltifr: number;
    trir: number;
    nearMiss: number;
    training: number;
    incidents: number;
    investigations: number;
}
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

const TrendAnalysis = () => {
    return (
        <div className="p-5">
            <div className="space-y-5">
                {/* Trend Analysis Header */}
                <div className=" rounded-xl  p-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg mr-4">
                                <IconActivity className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-blue-600">Safety Trend Analysis</h2>
                                <p className="italic">12-Month Performance Trends & Predictive Analytics</p>
                            </div>
                        </div>


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
        </div>
    )
}

export default TrendAnalysis