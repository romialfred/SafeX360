import {
    IconCircleCheck, IconClock, IconAlertCircle, IconTrendingUp, IconChartBar,
    IconUsers, IconRoute, IconShield, IconTarget, IconAward, IconActivity,
} from '@tabler/icons-react';
import KpiTile from '../../UtilityComp/KpiTile';
import { MONTHS_FR_SHORT } from '../planningLabels';

/**
 * Tableau de bord de la planification annuelle : synthèse opérationnelle,
 * répartition par catégorie d'activité, performance par département
 * et distribution mensuelle.
 */

interface DashboardProps {
    year: number;
    selectedDepartment: string;
    activities: any[];
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-slate-200"></div>
        <span className="text-[10.5px] text-slate-500 uppercase tracking-wider">{children}</span>
        <div className="h-px flex-1 bg-slate-200"></div>
    </div>
);

export default function Dashboard({ year, selectedDepartment: _selectedDepartment, activities }: DashboardProps) {
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

    // Données d'illustration par département — à brancher sur le backend (Phase 2)
    const departmentStats = [
        { name: 'Production', planned: 18, completed: 14, inProgress: 3, pending: 1, performance: 78 },
        { name: 'Maintenance', planned: 22, completed: 19, inProgress: 2, pending: 1, performance: 86 },
        { name: 'Qualité', planned: 12, completed: 11, inProgress: 1, pending: 0, performance: 92 },
        { name: 'HSE', planned: 28, completed: 24, inProgress: 3, pending: 1, performance: 86 },
        { name: 'Direction', planned: 8, completed: 7, inProgress: 1, pending: 0, performance: 88 },
        { name: 'Logistique', planned: 14, completed: 10, inProgress: 3, pending: 1, performance: 71 },
    ];

    // Distribution mensuelle des activités de l'année sélectionnée
    const monthlyData = MONTHS_FR_SHORT.map((month, idx) => {
        const monthStr = `${year}-${String(idx + 1).padStart(2, '0')}-01`;
        const igp = activities.filter(a => (a.category === 'IGP') && a.month === monthStr).length;
        const rss = activities.filter(a => (a.category === 'HSE') && a.month === monthStr).length;
        const tdm = activities.filter(a => (a.category === 'TDM') && a.month === monthStr).length;
        return { month, igp, rss, tdm };
    });

    const totalActivities = activities.length;
    // Estimation d'avancement en attendant le statut réel des activités (Phase 2)
    const totalCompleted = Math.round(activities.length * 0.6);
    const overallPerformance = totalActivities ? Math.round((totalCompleted / totalActivities) * 100) : 0;

    // Catégories — libellés + couleurs
    const categoryConfig = {
        IGP: { label: 'Inspections HSE planifiées', icon: IconShield, accent: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        RSS: { label: 'Réunions sécurité', icon: IconUsers, accent: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        TDM: { label: 'Tournées Leadership', icon: IconRoute, accent: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    };

    return (
        <div className="space-y-4">
            {/* === BLOC 1 — Synthèse opérationnelle === */}
            <section>
                <SectionTitle>Synthèse opérationnelle</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiTile
                        label="Activités planifiées"
                        value={totalActivities}
                        tone="teal"
                        icon={<IconTarget size={14} stroke={1.8} />}
                        referenceValue={`Année ${year} — toutes catégories`}
                    />
                    <KpiTile
                        label="Activités réalisées"
                        value={totalCompleted}
                        tone="green"
                        icon={<IconAward size={14} stroke={1.8} />}
                        referenceValue="Cumul depuis janvier"
                    />
                    <KpiTile
                        label="Taux de réalisation"
                        value={overallPerformance}
                        unit="%"
                        tone="blue"
                        icon={<IconActivity size={14} stroke={1.8} />}
                        referenceValue="Cible : ≥80 %"
                    />
                    <KpiTile
                        label="Réunions sécurité"
                        value={stats.RSS.planned}
                        tone="violet"
                        icon={<IconUsers size={14} stroke={1.8} />}
                        referenceValue="RSS planifiées sur l'année"
                    />
                </div>
            </section>

            {/* === BLOC 2 — Tuiles par catégorie === */}
            <section>
                <SectionTitle>Répartition par catégorie d'activité</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(Object.entries(stats) as [keyof typeof categoryConfig, typeof stats.IGP][]).map(([category, data]) => {
                        const c = categoryConfig[category];
                        const Icon = c.icon;
                        const percentage = data.planned > 0 ? Math.round((data.completed / data.planned) * 100) : 0;

                        return (
                            <div key={category} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
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
                                        <span
                                            className={`${c.text} tabular-nums leading-none`}
                                            style={{
                                                fontFamily: "'Source Serif 4', Georgia, serif",
                                                fontSize: '24px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {data.planned}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500">Planifiées</span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-green-50/60 border border-green-200/70 rounded-md">
                                            <div className="flex items-center gap-1.5">
                                                <IconCircleCheck size={13} className="text-green-600" />
                                                <span className="text-[11px] text-slate-700">Réalisées</span>
                                            </div>
                                            <span className="text-[13px] text-green-700 tabular-nums">{data.completed}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-orange-50/60 border border-orange-200/70 rounded-md">
                                            <div className="flex items-center gap-1.5">
                                                <IconClock size={13} className="text-orange-600" />
                                                <span className="text-[11px] text-slate-700">En cours</span>
                                            </div>
                                            <span className="text-[13px] text-orange-700 tabular-nums">{data.inProgress}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-red-50/60 border border-red-200/70 rounded-md">
                                            <div className="flex items-center gap-1.5">
                                                <IconAlertCircle size={13} className="text-red-600" />
                                                <span className="text-[11px] text-slate-700">En retard</span>
                                            </div>
                                            <span className="text-[13px] text-red-700 tabular-nums">{data.pending}</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] text-slate-700">Taux de réalisation</span>
                                            <span className={`text-[13px] ${c.text} tabular-nums`}>{percentage}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`${c.accent} h-1.5 rounded-full transition-[width] duration-500`}
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
                    <span className="ml-auto text-[10px] text-slate-500">Suivi des activités HSE {year}</span>
                </header>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {departmentStats.map((dept) => {
                        const trendColor = dept.performance >= 85 ? 'text-green-700' : dept.performance >= 70 ? 'text-amber-700' : 'text-red-700';
                        const trendBar = dept.performance >= 85 ? 'bg-green-500' : dept.performance >= 70 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                            <div key={dept.name} className="rounded-md border border-slate-200 bg-slate-50/40 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[13px] text-slate-800">{dept.name}</h4>
                                    <span className={`text-[15px] ${trendColor} tabular-nums`}>{dept.performance}%</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                                    <div className="text-center px-1 py-1 rounded bg-white border border-slate-200">
                                        <div className="text-[13px] text-blue-700 tabular-nums">{dept.planned}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Planif.</div>
                                    </div>
                                    <div className="text-center px-1 py-1 rounded bg-white border border-slate-200">
                                        <div className="text-[13px] text-green-700 tabular-nums">{dept.completed}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Faites</div>
                                    </div>
                                    <div className="text-center px-1 py-1 rounded bg-white border border-slate-200">
                                        <div className="text-[13px] text-orange-700 tabular-nums">{dept.inProgress}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Cours</div>
                                    </div>
                                    <div className="text-center px-1 py-1 rounded bg-white border border-slate-200">
                                        <div className="text-[13px] text-red-700 tabular-nums">{dept.pending}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Retard</div>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`${trendBar} h-1.5 rounded-full transition-[width] duration-500`}
                                        style={{ width: `${dept.performance}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* === BLOC 4 — Distribution mensuelle === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-teal-50/60 border-b border-teal-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-teal-100">
                        <IconChartBar size={14} className="text-teal-700" />
                    </div>
                    <h3 className="text-xs text-slate-800 uppercase tracking-wider">Distribution mensuelle des activités</h3>
                    <span className="ml-auto text-[10px] text-slate-500">Année {year}</span>
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
                                <div key={index} className="flex items-center gap-3">
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
