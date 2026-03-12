import {
    IconAlertTriangle,
    IconAward,
    IconCalculator,
    IconCircleCheck,
    IconClock,
    IconTarget,
    IconTrendingUp,
} from "@tabler/icons-react";

const CorporateReports = () => {
    return (
        <div className="p-5">
            <div className="space-y-5">
                {/* Corporate Header */}
                <div className="  p-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg mr-4">
                                <IconCalculator className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-blue-500">Corporate Safety Report</h2>
                                <p className="text-gray-600 italic ">Executive Level Health & Safety Performance</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xl font-bold">Q4 2024</div>
                            <div className="text-gray-600">Quarterly Review</div>
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
        </div>
    )
}

export default CorporateReports