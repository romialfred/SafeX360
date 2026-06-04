import { IconActivity } from "@tabler/icons-react";
import PageHeader from '../../UtilityComp/PageHeader';

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

const TrendAnalysis = () => {
    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Rapports' },
                    { label: 'Analyse des tendances' },
                ]}
                icon={<IconActivity size={22} stroke={2} />}
                iconColor="teal"
                title="Analyse des tendances"
                subtitle="Tendances 12 mois et analyses prédictives — KPI Santé & Sécurité"
            />

            {/* Graphiques de tendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg text-slate-900 mb-4">Tendance LTIFR (12 mois)</h3>
                    <div className="h-64 bg-slate-50 rounded-lg flex items-end justify-around p-4">
                        {monthlyTrends.map((month, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className="bg-red-500 rounded-t w-6 mb-2"
                                    style={{ height: `${Math.max(month.ltifr * 40, 8)}px` }}
                                ></div>
                                <div className="text-xs text-slate-600 transform -rotate-45">{month.month}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                            <span>Cible : 2,0</span>
                            <span className="text-green-600">Actuel : 1,2 ✓</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg text-slate-900 mb-4">Tendance taux de formation</h3>
                    <div className="h-64 bg-slate-50 rounded-lg flex items-end justify-around p-4">
                        {monthlyTrends.map((month, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className="bg-blue-500 rounded-t w-6 mb-2"
                                    style={{ height: `${Math.max(month.training * 2, 8)}px` }}
                                ></div>
                                <div className="text-xs text-slate-600 transform -rotate-45">{month.month}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                            <span>Cible : 95 %</span>
                            <span className="text-green-600">Actuel : 96 % ✓</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analyses prédictives */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg text-slate-900 mb-6">Analyses prédictives et prévisions</h3>
                {/* LOT 40 P1: ajout breakpoint sm:grid-cols-2 pour tablettes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                        <h4 className="text-blue-900 mb-3">Prévisions T1 2026</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>LTIFR prévu :</span>
                                <span className="text-blue-700">1,1</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Incidents attendus :</span>
                                <span className="text-blue-700">6-8</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cible formation :</span>
                                <span className="text-blue-700">97 %</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                        <h4 className="text-green-900 mb-3">Indicateurs de risque</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Zones à risque élevé :</span>
                                <span className="text-green-700">3</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Plans d'atténuation :</span>
                                <span className="text-green-700">12</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Taux d'achèvement :</span>
                                <span className="text-green-700">78 %</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                        <h4 className="text-purple-900 mb-3">ROI investissement</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>ROI sécurité :</span>
                                <span className="text-purple-700">340 %</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Coûts évités :</span>
                                <span className="text-purple-700">2,1 M€</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Investissement :</span>
                                <span className="text-purple-700">620 k€</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TrendAnalysis
