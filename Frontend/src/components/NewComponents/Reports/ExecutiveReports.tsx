import { IconActivity, IconCalendarEvent, IconCurrencyEuro, IconShieldCheck } from "@tabler/icons-react";

const ExecutiveReports = () => {
    return (
        <div className="p-5">
            <div className="space-y-3">
                <h2 className="text-3xl font-bold text-blue-500 ">Executive Safety Dashboard</h2>

                <p className="italic ">High-level overview of key safety metrics, trends, and compliance insights for leadership decision-making</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Overall Compliance */}
                    <div className="relative rounded-xl p-6 bg-green-50 border border-green-200 shadow-sm hover:shadow-md transition-transform duration-200">
                        <div className="absolute top-4 right-4 bg-green-100 rounded-full p-2">
                            <IconShieldCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-3xl font-extrabold text-green-700">94.2%</div>
                        <div className="text-sm font-medium text-gray-600">Overall Compliance</div>
                    </div>

                    {/* LTIFR Rate */}
                    <div className="relative rounded-xl p-6 bg-blue-50 border border-blue-200 shadow-sm hover:shadow-md transition-transform duration-200">
                        <div className="absolute top-4 right-4 bg-blue-100 rounded-full p-2">
                            <IconActivity className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-3xl font-extrabold text-blue-700">1.2</div>
                        <div className="text-sm font-medium text-gray-600">LTIFR Rate</div>
                    </div>

                    {/* Days Without LTI */}
                    <div className="relative rounded-xl p-6 bg-yellow-50 border border-yellow-200 shadow-sm hover:shadow-md transition-transform duration-200">
                        <div className="absolute top-4 right-4 bg-yellow-100 rounded-full p-2">
                            <IconCalendarEvent className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="text-3xl font-extrabold text-yellow-700">47</div>
                        <div className="text-sm font-medium text-gray-600">Days Without LTI</div>
                    </div>

                    {/* Safety Investment */}
                    <div className="relative rounded-xl p-6 bg-purple-50 border border-purple-200 shadow-sm hover:shadow-md transition-transform duration-200">
                        <div className="absolute top-4 right-4 bg-purple-100 rounded-full p-2">
                            <IconCurrencyEuro className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-3xl font-extrabold text-purple-700">€2.1M</div>
                        <div className="text-sm font-medium text-gray-600">Safety Investment</div>
                    </div>
                </div>
                {/* Risk Heat Map */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Enterprise Risk Heat Map</h3>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                        {Array.from({ length: 25 }, (_, i) => {
                            const risk = Math.random();
                            const color = risk > 0.7 ? 'bg-red-100' : risk > 0.4 ? 'bg-yellow-100' : 'bg-green-100';
                            const textColor = risk > 0.7 ? 'text-red-600' : risk > 0.4 ? 'text-yellow-700' : 'text-green-700';
                            return (
                                <div key={i} className={`${color} ${textColor} h-8 rounded flex items-center justify-center  text-sm`}>
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
        </div>
    )
}

export default ExecutiveReports