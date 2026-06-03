import {
    IconCircleCheck, IconClock, IconAlertCircle, IconTrendingUp, IconChartBar,
    IconUsers, IconRoute, IconShield, IconTarget, IconAward, IconActivity,
    IconArrowUpRight,
} from '@tabler/icons-react';

interface DashboardProps {
    selectedMonth: string;
    selectedDepartment: string;
    activities: any[];
}

const monthNames = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

export default function Dashboard({ selectedMonth: _selectedMonth, selectedDepartment: _selectedDepartment, activities }: DashboardProps) {
    // Stats par catégorie
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
            stats[cat].pending++;
        }
    });

    // Stats département (mock — à brancher backend en Phase 2)
    const departmentStats = [
        { name: 'Production', planned: 18, completed: 14, inProgress: 3, pending: 1, performance: 78 },
        { name: 'Maintenance', planned: 22, completed: 19, inProgress: 2, pending: 1, performance: 86 },
        { name: 'Qualité', planned: 12, completed: 11, inProgress: 1, pending: 0, performance: 92 },
        { name: 'HSE', planned: 28, completed: 24, inProgress: 3, pending: 1, performance: 86 },
        { name: 'Direction', planned: 8, completed: 7, inProgress: 1, pending: 0, performance: 88 },
        { name: 'Logistique', planned: 14, completed: 10, inProgress: 3, pending: 1, performance: 71 },
    ];

    // Données mensuelles
    const monthlyData = monthNames.map((month, idx) => {
        const monthStr = `2026-${String(idx + 1).padStart(2, '0')}-01`;
        const igp = activities.filter(a => (a.category === 'IGP') && a.month === monthStr).length;
        const rss = activities.filter(a => (a.category === 'HSE') && a.month === monthStr).length;
        const tdm = activities.filter(a => (a.category === 'TDM') && a.month === monthStr).length;
        return { month, igp, rss, tdm };
    });

    const totalActivities = activities.length;
    const totalCompleted = Math.round(activities.length * 0.6);
    const overallPerformance = totalActivities ? Math.round((totalCompleted / totalActivities) * 100) : 0;

    // Catégories — labels + couleurs
    const categoryConfig = {
        IGP: { label: 'Inspections HSE planifiées', icon: IconShield, accent: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        RSS: { label: 'Réunions sécurité', icon: IconUsers, accent: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        TDM: { label: 'Tournées Leadership', icon: IconRoute, accent: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    };

    return (
        <div className="space-y-5">
            {/* === BLOC 1 — 4 KPIs principaux raffinés === */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Synthèse opérationnelle</span>
                    <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg border border-teal-200 hover:shadow-md transition-all overflow-hidden">
                        <div className="h-1 bg-teal-500"></div>
                        <div className="p-3">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-1.5 rounded-md bg-teal-50 border border-teal-200">
                                    <IconTarget size={15} className="text-teal-700" />
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">Année 2026</span>
                            </div>
                            <p className="text-2xl text-teal-700 tabular-nums">{totalActivities}</p>
                            <p className="text-[11px] text-slate-800 mt-1.5">Activités planifiées</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Toutes catégories confondues</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-green-200 hover:shadow-md transition-all overflow-hidden">
                        <div className="h-1 bg-green-500"></div>
                        <div className="p-3">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-1.5 rounded-md bg-green-50 border border-green-200">
                                    <IconAward size={15} className="text-green-700" />
                                </div>
                                <div className="inline-flex items-center gap-0.5 text-[10px] text-green-700">
                                    <IconArrowUpRight size={11} />
                                    <span>+8</span>
                                </div>
                            </div>
                            <p className="text-2xl text-green-700 tabular-nums">{totalCompleted}</p>
                            <p className="text-[11px] text-slate-800 mt-1.5">Activités réalisées</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Cumul depuis janvier</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-blue-200 hover:shadow-md transition-all overflow-hidden">
                        <div className="h-1 bg-blue-500"></div>
                        <div className="p-3">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-1.5 rounded-md bg-blue-50 border border-blue-200">
                                    <IconActivity size={15} className="text-blue-700" />
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">Cible 80 %</span>
                            </div>
                            <p className="text-2xl text-blue-700 tabular-nums">{overallPerformance}<span className="text-base">%</span></p>
                            <p className="text-[11px] text-slate-800 mt-1.5">Taux de réalisation</p>
                            <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all" style={{ width: `${overallPerformance}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-violet-200 hover:shadow-md transition-all overflow-hidden">
                        <div className="h-1 bg-violet-500"></div>
                        <div className="p-3">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-1.5 rounded-md bg-violet-50 border border-violet-200">
                                    <IconTrendingUp size={15} className="text-violet-700" />
                                </div>
                                <div className="inline-flex items-center gap-0.5 text-[10px] text-green-700">
                                    <IconArrowUpRight size={11} />
                                    <span>YoY</span>
                                </div>
                            </div>
                            <p className="text-2xl text-violet-700 tabular-nums">+12<span className="text-base">%</span></p>
                            <p className="text-[11px] text-slate-800 mt-1.5">Progression annuelle</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">vs même période 2025</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* === BLOC 2 — Tuiles par catégorie === */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Répartition par catégorie d'activité</span>
                    <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(Object.entries(stats) as [keyof typeof categoryConfig, typeof stats.IGP][]).map(([category, data]) => {
                        const c = categoryConfig[category];
                        const Icon = c.icon;
                        const percentage = data.planned > 0 ? Math.round((data.completed / data.planned) * 100) : 0;

                        return (
                            <div key={category} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                                <header className={`px-4 py-2.5 ${c.bg}/60 border-b ${c.border}/70 flex items-center gap-2`}>
                                    <div className={`p-1 rounded ${c.bg}`}>
                                        <Icon size={14} className={c.text} />
                                    </div>
                                    <h3 className="text-xs text-slate-800 uppercase tracking-wider flex-1">
                                        {c.label}
                                    </h3>
                                    <span className="text-[10px] font-mono text-slate-500">{category}</span>
                                </header>
                                <div className="p-4">
                                    <div className="flex items-baseline justify-between mb-3">
                                        <span className={`text-2xl font-semibold ${c.text} tabular-nums leading-none`}>{data.planned}</span>
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500">Planifiées</span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-green-50/60 border border-green-200/70 rounded-md">
                                            <div className="flex items-center gap-1.5">
                                                <IconCircleCheck size={13} className="text-green-600" />
                                                <span className="text-[11px] text-slate-700">Réalisées</span>
                                            </div>
                                            <span className="text-sm text-green-700 tabular-nums">{data.completed}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-orange-50/60 border border-orange-200/70 rounded-md">
                                            <div className="flex items-center gap-1.5">
                                                <IconClock size={13} className="text-orange-600" />
                                                <span className="text-[11px] text-slate-700">En cours</span>
                                            </div>
                                            <span className="text-sm text-orange-700 tabular-nums">{data.inProgress}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-red-50/60 border border-red-200/70 rounded-md">
                                            <div className="flex items-center gap-1.5">
                                                <IconAlertCircle size={13} className="text-red-600" />
                                                <span className="text-[11px] text-slate-700">En retard</span>
                                            </div>
                                            <span className="text-sm text-red-700 tabular-nums">{data.pending}</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] text-slate-700">Taux de réalisation</span>
                                            <span className={`text-sm ${c.text} tabular-nums`}>{percentage}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`${c.accent} h-1.5 rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* === BLOC 3 — Performance par département === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-blue-50/60 border-b border-blue-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-100">
                        <IconTrendingUp size={14} className="text-blue-700" />
                    </div>
                    <h3 className="text-xs text-slate-800 uppercase tracking-wider">Performance par département</h3>
                    <span className="ml-auto text-[10px] text-slate-500">Suivi des activités HSE 2026</span>
                </header>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {departmentStats.map((dept) => {
                        const trendColor = dept.performance >= 85 ? 'text-green-700' : dept.performance >= 70 ? 'text-amber-700' : 'text-red-700';
                        const trendBar = dept.performance >= 85 ? 'bg-green-500' : dept.performance >= 70 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                            <div key={dept.name} className="rounded-md border border-slate-200 bg-slate-50/40 p-3 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm text-slate-800">{dept.name}</h4>
                                    <span className={`text-lg ${trendColor} tabular-nums`}>{dept.performance}%</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                                    <div className="text-center px-1 py-1 rounded bg-white border border-slate-200">
                                        <div className="text-sm text-blue-700 tabular-nums">{dept.planned}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Planif.</div>
                                    </div>
                                    <div className="text-center px-1 py-1 rounded bg-white border border-slate-200">
                                        <div className="text-sm text-green-700 tabular-nums">{dept.completed}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Faites</div>
                                    </div>
                                    <div className="text-center px-1 py-1 rounded bg-white border border-slate-200">
                                        <div className="text-sm text-orange-700 tabular-nums">{dept.inProgress}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Cours</div>
                                    </div>
                                    <div className="text-center px-1 py-1 rounded bg-white border border-slate-200">
                                        <div className="text-sm text-red-700 tabular-nums">{dept.pending}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Retard</div>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`${trendBar} h-1.5 rounded-full transition-all duration-500`}
                                        style={{ width: `${dept.performance}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* === BLOC 4 — Distribution mensuelle (style histogramme épuré) === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-teal-50/60 border-b border-teal-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-teal-100">
                        <IconChartBar size={14} className="text-teal-700" />
                    </div>
                    <h3 className="text-xs text-slate-800 uppercase tracking-wider">Distribution mensuelle des activités</h3>
                    <span className="ml-auto text-[10px] text-slate-500">Année 2026</span>
                </header>
                <div className="p-4">
                    {/* Légende */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
                        <div className="inline-flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                            <span className="text-slate-600">IGP — Inspections</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-green-500"></span>
                            <span className="text-slate-600">RSS — Réunions</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-indigo-500"></span>
                            <span className="text-slate-600">TDM — Tournées</span>
                        </div>
                    </div>

                    {/* Histogramme épuré */}
                    <div className="space-y-2">
                        {monthlyData.map((data, index) => {
                            const total = data.igp + data.rss + data.tdm;
                            const maxTotal = Math.max(...monthlyData.map(d => d.igp + d.rss + d.tdm), 1);
                            const igpW = total > 0 ? (data.igp / maxTotal) * 100 : 0;
                            const rssW = total > 0 ? (data.rss / maxTotal) * 100 : 0;
                            const tdmW = total > 0 ? (data.tdm / maxTotal) * 100 : 0;
                            return (
                                <div key={index} className="flex items-center gap-3 group">
                                    <div className="w-14 text-right">
                                        <span className="text-xs text-slate-700">{data.month}</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-0.5 h-6 bg-slate-50 rounded overflow-hidden border border-slate-100">
                                        {data.igp > 0 && (
                                            <div
                                                className="h-full bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-end pr-1.5"
                                                style={{ width: `${igpW}%` }}
                                                title={`IGP : ${data.igp}`}
                                            >
                                                {data.igp >= 2 && <span className="text-[10px] text-white">{data.igp}</span>}
                                            </div>
                                        )}
                                        {data.rss > 0 && (
                                            <div
                                                className="h-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-end pr-1.5"
                                                style={{ width: `${rssW}%` }}
                                                title={`RSS : ${data.rss}`}
                                            >
                                                {data.rss >= 2 && <span className="text-[10px] text-white">{data.rss}</span>}
                                            </div>
                                        )}
                                        {data.tdm > 0 && (
                                            <div
                                                className="h-full bg-indigo-500 hover:bg-indigo-600 transition-colors flex items-center justify-end pr-1.5"
                                                style={{ width: `${tdmW}%` }}
                                                title={`TDM : ${data.tdm}`}
                                            >
                                                {data.tdm >= 2 && <span className="text-[10px] text-white">{data.tdm}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-10 text-left">
                                        <span className="text-xs text-slate-800 tabular-nums">{total}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}
