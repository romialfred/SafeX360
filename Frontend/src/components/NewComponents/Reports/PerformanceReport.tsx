import { Select } from "@mantine/core";
import { IconChartBar, IconShield, IconTarget } from "@tabler/icons-react";

const PerformanceReport = () => {
    return (
        <div className="p-5 flex flex-col gap-5">

            <div className=" flex items-center justify-between  rounded-xl p-2">
                <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg mr-4">
                        <IconShield className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-blue-500">Safety Performance Analysis</h2>
                        <p className="italic">January 2024 - Health & Safety Performance</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <Select placeholder="select time" data={["Last 12 Months", "YTD 2024", "Q4 2023"]} />


                </div>
            </div>
            <div className="space-y-8">
                {/* Performance Overview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">


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
        </div >
    )
}

export default PerformanceReport