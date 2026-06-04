import { Button } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import {
    IconAlertTriangle,
    IconAward,
    IconCalendar,
    IconDownload,
    IconEye,
    IconShare,
    IconUsers,
} from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";

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
        { month: 'Fév', ltifr: 1.5, trir: 3.1, nearMiss: 52, training: 94, incidents: 4, investigations: 3 },
        { month: 'Mar', ltifr: 1.1, trir: 2.5, nearMiss: 48, training: 97, incidents: 2, investigations: 2 },
        { month: 'Avr', ltifr: 0.9, trir: 2.2, nearMiss: 55, training: 98, incidents: 1, investigations: 1 },
        { month: 'Mai', ltifr: 1.3, trir: 2.9, nearMiss: 41, training: 95, incidents: 3, investigations: 2 },
        { month: 'Juin', ltifr: 0.8, trir: 2.1, nearMiss: 58, training: 99, incidents: 1, investigations: 1 },
        { month: 'Juil', ltifr: 1.0, trir: 2.4, nearMiss: 49, training: 96, incidents: 2, investigations: 2 },
        { month: 'Août', ltifr: 1.4, trir: 3.0, nearMiss: 44, training: 93, incidents: 4, investigations: 3 },
        { month: 'Sep', ltifr: 0.7, trir: 1.9, nearMiss: 61, training: 100, incidents: 1, investigations: 1 },
        { month: 'Oct', ltifr: 1.1, trir: 2.6, nearMiss: 47, training: 97, incidents: 2, investigations: 2 },
        { month: 'Nov', ltifr: 0.9, trir: 2.3, nearMiss: 53, training: 98, incidents: 1, investigations: 1 },
        { month: 'Déc', ltifr: 1.2, trir: 2.7, nearMiss: 46, training: 96, incidents: 3, investigations: 2 }
    ];

    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Rapports' },
                    { label: 'Rapports mensuels' },
                ]}
                icon={<IconCalendar size={22} stroke={2} />}
                iconColor="blue"
                title="Rapports mensuels"
                subtitle="Synthèse mensuelle des performances Santé & Sécurité — ISO 45001"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg text-slate-900">Rapport mensuel de sécurité</h2>
                    <p className="text-sm text-slate-500 italic">Janvier 2026 — Performance Santé & Sécurité</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button leftSection={<IconDownload size={16} />} className="!text-sm !font-medium">
                        Export PDF
                    </Button>
                    <Button leftSection={<IconShare size={16} />} color="green" className="!text-sm !font-medium">
                        Partager
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Synthèse exécutive */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

                    {/* Points clés */}
                    {/* LOT 40 P1: ajout breakpoint sm:grid-cols-2 pour tablettes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-green-700">Jours sans accident avec arrêt</p>
                                    <p className="text-2xl text-green-700 mt-1">47</p>
                                </div>
                                <IconAward className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="text-xs text-green-600 mt-2">↗ +47 vs mois précédent</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-blue-700">Taux de formation</p>
                                    <p className="text-2xl text-blue-700 mt-1">96%</p>
                                </div>
                                <IconUsers className="w-8 h-8 text-blue-500" />
                            </div>
                            <p className="text-xs text-blue-600 mt-2">↗ +4% vs cible</p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-yellow-700">Quasi-accidents déclarés</p>
                                    <p className="text-2xl text-yellow-700 mt-1">45</p>
                                </div>
                                <IconEye className="w-8 h-8 text-yellow-500" />
                            </div>
                            <p className="text-xs text-yellow-600 mt-2">↗ +12 vs cible</p>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-red-700">Incidents ouverts</p>
                                    <p className="text-2xl text-red-700 mt-1">3</p>
                                </div>
                                <IconAlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-xs text-red-600 mt-2">↓ -2 vs mois précédent</p>
                        </div>
                    </div>

                    {/* Graphique tendances mensuelles */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg text-slate-900 mb-4">Tendances mensuelles de sécurité</h3>
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
                                        { name: 'nearMissRate', label: 'Taux de quasi-accidents (x0.1)', color: 'blue.6' },
                                    ]}
                                    gridAxis="none"
                                    tickLine="y"
                                    yAxisProps={{ tickFormatter: (v: number) => v.toFixed(1) }}
                                />
                            );
                        })()}
                    </div>
                </div>


                {/* Performance par département */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg text-slate-900 mb-6">Synthèse performance par département</h3>
                    {/* LOT 40 P1: ajout breakpoint sm:grid-cols-2 pour tablettes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {[
                            { name: 'Production', ltifr: 1.2, incidents: 8, training: 94, color: 'blue' },
                            { name: 'Maintenance', ltifr: 0.8, incidents: 3, training: 98, color: 'green' },
                            { name: 'Laboratoire', ltifr: 1.5, incidents: 5, training: 96, color: 'purple' }
                        ].map((dept, index) => (
                            <div key={index} className={`border-2 border-${dept.color}-200 rounded-lg p-4 bg-${dept.color}-50`}>
                                <h4 className={`text-${dept.color}-900 mb-3`}>{dept.name}</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600" title="Taux fréquence accidents avec arrêt">LTIFR :</span>
                                        <span className={`text-${dept.color}-700`}>{dept.ltifr}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Incidents :</span>
                                        <span className={`text-${dept.color}-700`}>{dept.incidents}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Formation :</span>
                                        <span className={`text-${dept.color}-700`}>{dept.training}%</span>
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
