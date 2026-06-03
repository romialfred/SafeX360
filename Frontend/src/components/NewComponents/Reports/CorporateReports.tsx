import {
    IconAlertTriangle,
    IconAward,
    IconBuilding,
    IconCircleCheck,
    IconClock,
    IconTarget,
    IconTrendingUp,
} from "@tabler/icons-react";
import PageHeader from '../../UtilityComp/PageHeader';

const CorporateReports = () => {
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Rapports' },
                    { label: 'Rapport corporate' },
                ]}
                icon={<IconBuilding size={22} stroke={2} />}
                iconColor="slate"
                title="Rapport corporate"
                subtitle="Synthèse trimestrielle Santé & Sécurité — niveau exécutif"
            />

            {/* Période de revue */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-slate-500">Période</div>
                <div className="text-right">
                    <div className="text-lg text-slate-900">T4 2026</div>
                    <div className="text-sm text-slate-600">Revue trimestrielle</div>
                </div>
            </div>

            {/* Synthèse exécutive */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg text-slate-900 mb-6">Synthèse exécutive</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Réalisations clés</h4>
                        <div className="space-y-3">
                            <div className="flex items-center p-3 bg-green-50 rounded-lg">
                                <IconCircleCheck className="w-5 h-5 text-green-600 mr-3" />
                                <div>
                                    <div className="text-green-900">Zéro accident mortel</div>
                                    <div className="text-sm text-green-700">Excellent bilan sécurité maintenu</div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                                <IconAward className="w-5 h-5 text-blue-600 mr-3" />
                                <div>
                                    <div className="text-blue-900">Certification ISO 45001</div>
                                    <div className="text-sm text-blue-700">Renouvelée avec succès pour 2026</div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                                <IconTrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                                <div>
                                    <div className="text-purple-900">Excellence de la formation</div>
                                    <div className="text-sm text-purple-700">Taux d'achèvement de 96 % atteint</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Axes d'amélioration</h4>
                        <div className="space-y-3">
                            <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                                <IconAlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                                <div>
                                    <div className="text-yellow-900">Hausse du taux DART</div>
                                    <div className="text-sm text-yellow-700">183 % au-dessus des prévisions — nécessite attention</div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                                <IconClock className="w-5 h-5 text-orange-600 mr-3" />
                                <div>
                                    <div className="text-orange-900">Visites de la direction</div>
                                    <div className="text-sm text-orange-700">14,8 % sous la cible — augmenter la fréquence</div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-red-50 rounded-lg">
                                <IconTarget className="w-5 h-5 text-red-600 mr-3" />
                                <div>
                                    <div className="text-red-900">Inspections terrain</div>
                                    <div className="text-sm text-red-700">8,1 % sous la cible — allocation de ressources requise</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Initiatives stratégiques */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg text-slate-900 mb-6">Initiatives stratégiques sécurité 2026</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            title: 'Transformation digitale sécurité',
                            progress: 75,
                            status: 'Sur la bonne voie',
                            description: "Mise en œuvre d'outils numériques de management sécurité",
                            color: 'blue'
                        },
                        {
                            title: 'Programme de sécurité comportementale',
                            progress: 60,
                            status: 'En cours',
                            description: 'Initiative de changement culturel pour une sécurité proactive',
                            color: 'green'
                        },
                        {
                            title: "Modernisation de l'évaluation des risques",
                            progress: 45,
                            status: 'En retard',
                            description: "Méthodologies d'évaluation des risques actualisées",
                            color: 'orange'
                        }
                    ].map((initiative, index) => (
                        <div key={index} className={`border-2 border-${initiative.color}-200 rounded-lg p-4 bg-${initiative.color}-50`}>
                            <h4 className={`text-${initiative.color}-900 mb-2`}>{initiative.title}</h4>
                            <p className="text-sm text-slate-600 mb-4">{initiative.description}</p>
                            <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Progression</span>
                                    <span className={`text-${initiative.color}-700`}>{initiative.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className={`bg-${initiative.color}-500 h-2 rounded-full transition-all duration-300`}
                                        style={{ width: `${initiative.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${initiative.status === 'Sur la bonne voie' ? 'bg-green-100 text-green-800' :
                                initiative.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                                    'bg-orange-100 text-orange-800'
                                }`}>
                                {initiative.status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CorporateReports
