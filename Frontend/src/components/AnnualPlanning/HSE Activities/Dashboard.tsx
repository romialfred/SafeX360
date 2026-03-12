import { IconCircleCheck, IconClock, IconAlertCircle, IconTrendingUp, IconChartBar, IconUsers, IconRoute, IconShield, IconTarget, IconAward, IconActivity } from '@tabler/icons-react';


interface DashboardProps {
    selectedMonth: string;
    selectedDepartment: string;
    activities: any[];
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard({ selectedMonth: _selectedMonth, selectedDepartment: _selectedDepartment, activities }: DashboardProps) {
    // Compute stats by category
    const stats = {
        'IGP': { planned: 0, completed: 0, inProgress: 0, pending: 0 },
        'RSS': { planned: 0, completed: 0, inProgress: 0, pending: 0 },
        'TDM': { planned: 0, completed: 0, inProgress: 0, pending: 0 },
    };
    activities.forEach(act => {
        let cat: 'IGP' | 'RSS' | 'TDM' | undefined = undefined;
        if (act.category === 'IGP') cat = 'IGP';
        else if (act.category === 'HSE') cat = 'RSS';
        else if (act.category === 'TDM') cat = 'TDM';
        if (cat) {
            stats[cat].planned++;
            // For demo, randomly assign status (replace with real status if available)
            // You can use act.status if available
            // All as pending for now, unless you add status to activities
            stats[cat].pending++;
        }
    });

    // Department stats (mocked, as no department info in activities)
    const departmentStats = [
        { name: 'Production', planned: 0, completed: 0, inProgress: 0, pending: 0, performance: 0 },
        { name: 'Maintenance', planned: 0, completed: 0, inProgress: 0, pending: 0, performance: 0 },
        { name: 'Quality', planned: 0, completed: 0, inProgress: 0, pending: 0, performance: 0 },
        { name: 'HSE', planned: 0, completed: 0, inProgress: 0, pending: 0, performance: 0 },
        { name: 'Management', planned: 0, completed: 0, inProgress: 0, pending: 0, performance: 0 },
        { name: 'IT', planned: 0, completed: 0, inProgress: 0, pending: 0, performance: 0 },
    ];
    // If department info is available in activities, compute real stats here

    // Monthly data
    const monthlyData = monthNames.map((month, idx) => {
        const monthStr = `2025-${String(idx + 1).padStart(2, '0')}-01`;
        const igp = activities.filter(a => (a.category === 'IGP') && a.month === monthStr).length;
        const rss = activities.filter(a => (a.category === 'HSE') && a.month === monthStr).length;
        const tdm = activities.filter(a => (a.category === 'TDM') && a.month === monthStr).length;
        return { month, igp, rss, tdm };
    });

    const totalActivities = activities.length;
    // For demo, completed = 60% of activities
    const totalCompleted = Math.round(activities.length * 0.6);
    const overallPerformance = totalActivities ? Math.round((totalCompleted / totalActivities) * 100) : 0;

    return (
        <div className="space-y-8">
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <IconTarget className="w-8 h-8 text-teal-600" />
                        <span className="text-2xl font-bold text-teal-600">{totalActivities}</span>
                    </div>
                    <p className="text-sm text-slate-600">Total Planned</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <IconAward className="w-8 h-8 text-green-600" />
                        <span className="text-2xl font-bold text-teal-600">{totalCompleted}</span>
                    </div>
                    <p className="text-sm text-slate-600">Total Completed</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <IconActivity className="w-8 h-8 text-blue-600" />
                        <span className="text-2xl font-bold text-blue-600">{overallPerformance}%</span>
                    </div>
                    <p className="text-sm text-slate-600">Overall Performance</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <IconTrendingUp className="w-8 h-8 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-600">+12%</span>
                    </div>
                    <p className="text-sm text-slate-600">Improvement</p>
                </div>
            </div>

            {/* Statistiques par catégorie avec design moderne */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Object.entries(stats).map(([category, data]) => {
                    const percentage = Math.round((data.completed / data.planned) * 100);
                    const categoryIcons = {
                        'IGP': IconShield,
                        'RSS': IconUsers,
                        'TDM': IconRoute
                    };
                    const categoryColors = {
                        'IGP': 'from-blue-500 to-blue-600',
                        'RSS': 'from-green-500 to-green-600',
                        'TDM': 'from-purple-500 to-purple-600'
                    };
                    const Icon = categoryIcons[category as keyof typeof categoryIcons];

                    return (
                        <div key={category} className="bg-white rounded-2xl shadow-sm p-8 border border-gray-300 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-16 h-16 bg-gradient-to-r ${categoryColors[category as keyof typeof categoryColors]} rounded-2xl flex items-center justify-center shadow-lg`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-slate-800">{data.planned}</div>
                                    <div className="text-sm text-slate-500">Planifiées</div>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-6">
                                {category === 'IGP' ? 'General Inspections' :
                                    category === 'RSS' ? 'Health Safety Meetings' :
                                        'Leadership Walks'}
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center">
                                        <IconCircleCheck className="w-5 h-5 text-green-500 mr-3" />
                                        <span className="text-sm font-medium text-slate-700">Completed</span>
                                    </div>
                                    <span className="font-bold text-green-600 text-lg">{data.completed}</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                    <div className="flex items-center">
                                        <IconClock className="w-5 h-5 text-orange-500 mr-3" />
                                        <span className="text-sm font-medium text-slate-700">In Progress</span>
                                    </div>
                                    <span className="font-bold text-orange-600 text-lg">{data.inProgress}</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                    <div className="flex items-center">
                                        <IconAlertCircle className="w-5 h-5 text-red-500 mr-3" />
                                        <span className="text-sm font-medium text-slate-700">Overdue</span>
                                    </div>
                                    <span className="font-bold text-red-600 text-lg">{data.pending}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-600">Completion Rate</span>
                                    <span className="text-lg font-bold text-teal-600">{percentage}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-teal-500 to-teal-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Performance par département */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-300">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">Performance by Department</h3>
                        <p className="text-slate-600 mt-1">HSE activities tracking by department</p>
                    </div>
                    <IconTrendingUp className="w-8 h-8 text-teal-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {departmentStats.map((dept, _index) => (
                        <div key={dept.name} className="bg-slate-50 rounded-xl p-6 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-slate-800">{dept.name}</h4>
                                <span className="text-2xl font-bold text-slate-800">{dept.performance}%</span>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">{dept.planned}</div>
                                    <div className="text-xs text-slate-500">Planned</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">{dept.completed}</div>
                                    <div className="text-xs text-slate-500">Completed</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-orange-600">{dept.inProgress}</div>
                                    <div className="text-xs text-slate-500">In Progress</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">{dept.pending}</div>
                                    <div className="text-xs text-slate-500">Overdue</div>
                                </div>
                            </div>

                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${dept.performance}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activités par mois - Design moderne */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-300">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">Activities by Month</h3>
                        <p className="text-slate-600 mt-1">Monthly distribution of HSE activities</p>
                    </div>
                    <IconChartBar className="w-8 h-8 text-teal-500" />
                </div>

                <div className="space-y-6">
                    {monthlyData.map((data, index) => (
                        <div key={index} className="flex items-center space-x-6 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                            <div className="w-12 text-center">
                                <div className="text-sm font-bold text-slate-800">{data.month}</div>
                            </div>

                            <div className="flex-1 flex items-center space-x-4">
                                {/* IGP */}
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className="flex space-x-1">
                                        {Array.from({ length: data.igp }).map((_, i) => (
                                            <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm flex items-center justify-center">
                                                <IconShield className="w-4 h-4 text-white" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-blue-600">IGP ({data.igp})</span>
                                </div>

                                {/* RSS */}
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className="flex space-x-1">
                                        {Array.from({ length: data.rss }).map((_, i) => (
                                            <div key={i} className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm flex items-center justify-center">
                                                <IconUsers className="w-4 h-4 text-white" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-green-600">RSS ({data.rss})</span>
                                </div>

                                {/* TDM */}
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className="flex space-x-1">
                                        {Array.from({ length: data.tdm }).map((_, i) => (
                                            <div key={i} className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm flex items-center justify-center">
                                                <IconRoute className="w-4 h-4 text-white" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-purple-600">TDM ({data.tdm})</span>
                                </div>
                            </div>

                            <div className="w-16 text-center">
                                <div className="text-xl font-bold text-slate-800 bg-white rounded-lg py-2 px-3 shadow-sm">
                                    {data.igp + data.rss + data.tdm}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Légende améliorée */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-center space-x-8 text-sm">
                        <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <IconShield className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-medium text-slate-700">IGP - General Planned Inspections</span>
                        </div>
                        <div className="flex items-center space-x-3 bg-green-50 px-4 py-2 rounded-lg">
                            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                <IconUsers className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-medium text-slate-700">RSS - Health Safety Meetings</span>
                        </div>
                        <div className="flex items-center space-x-3 bg-purple-50 px-4 py-2 rounded-lg">
                            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <IconRoute className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-medium text-slate-700">TDM - Leadership Walks</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}