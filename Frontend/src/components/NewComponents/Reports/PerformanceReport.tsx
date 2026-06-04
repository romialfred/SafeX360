import { Select } from "@mantine/core";
import { IconChartBar, IconShield, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";

const PerformanceReport = () => {
    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Rapports' },
                    { label: 'Rapport de performance' },
                ]}
                icon={<IconTrendingUp size={22} stroke={2} />}
                iconColor="violet"
                title="Rapport de performance"
                subtitle="Analyse comparative et benchmark sectoriel des KPI HSE"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg text-slate-900">Analyse de la performance sécurité</h2>
                    <p className="text-sm text-slate-500 italic">Janvier 2026 — Performance Santé & Sécurité</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Select
                        placeholder="Sélectionner la période"
                        data={["12 derniers mois", "Cumulé 2026", "T4 2025"]}
                        className="text-sm"
                        size="sm"
                    />
                </div>
            </div>

            <div className="space-y-6">
                {/* Aperçu de la performance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

                    {/* Grille des indicateurs de performance */}
                    {/* LOT 40 P1: ajout breakpoint sm:grid-cols-2 pour tablettes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-blue-900">Score sécurité global</h3>
                                <IconChartBar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-2xl font-semibold text-blue-700 mb-2">87,5</div>
                            <div className="text-sm text-blue-600">↗ +5,2 vs trimestre précédent</div>
                            <div className="mt-4 bg-blue-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87.5%' }}></div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-green-900">Taux de conformité</h3>
                                <IconShield className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="text-2xl font-semibold text-green-700 mb-2">94,2 %</div>
                            <div className="text-sm text-green-600">↗ +2,1 % vs cible</div>
                            <div className="mt-4 bg-green-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-purple-900">Maturité du risque</h3>
                                <IconTarget className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="text-2xl font-semibold text-purple-700 mb-2">Niveau 4</div>
                            <div className="text-sm text-purple-600">Gestion avancée des risques</div>
                            <div className="mt-4 bg-purple-200 rounded-full h-2">
                                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Comparaison benchmark sectoriel */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg text-slate-900 mb-4">Comparaison benchmark sectoriel</h3>
                        {/* LOT 40 P1: ajout breakpoint sm:grid-cols-2 pour tablettes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { metric: 'LTIFR', our: 1.2, industry: 2.1, benchmark: 'Excellent' },
                                { metric: 'TRIR', our: 2.8, industry: 4.2, benchmark: 'Bon' },
                                { metric: 'Formation %', our: 96, industry: 85, benchmark: 'Excellent' },
                                { metric: 'Taux de quasi-accidents', our: 45, industry: 28, benchmark: 'Excellent' }
                            ].map((item, index) => (
                                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{item.metric}</div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-lg text-slate-900">{item.our}</span>
                                        <span className="text-sm text-gray-500">vs {item.industry}</span>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${item.benchmark === 'Excellent' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {item.benchmark}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PerformanceReport
