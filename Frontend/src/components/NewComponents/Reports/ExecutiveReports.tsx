import { IconActivity, IconCalendarEvent, IconCurrencyEuro, IconFileText, IconShieldCheck } from "@tabler/icons-react";
import PageHeader from '../../UtilityComp/PageHeader';

const ExecutiveReports = () => {
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Rapports' },
                    { label: 'Rapport exécutif' },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="indigo"
                title="Rapport exécutif"
                subtitle="Tableau de bord direction — conformité, LTIFR, impact financier"
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg text-slate-900 mb-6">Tableau de bord sécurité exécutif</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Conformité globale */}
                    <div className="relative rounded-xl p-6 bg-green-50 border border-green-200 shadow-sm hover:shadow-md transition-transform duration-200">
                        <div className="absolute top-4 right-4 bg-green-100 rounded-full p-2">
                            <IconShieldCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-3xl font-extrabold text-green-700">94,2 %</div>
                        <div className="text-sm text-slate-600">Conformité globale</div>
                    </div>

                    {/* Taux LTIFR */}
                    <div className="relative rounded-xl p-6 bg-blue-50 border border-blue-200 shadow-sm hover:shadow-md transition-transform duration-200">
                        <div className="absolute top-4 right-4 bg-blue-100 rounded-full p-2">
                            <IconActivity className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-3xl font-extrabold text-blue-700">1,2</div>
                        <div className="text-sm text-slate-600">Taux LTIFR</div>
                    </div>

                    {/* Jours sans accident avec arrêt */}
                    <div className="relative rounded-xl p-6 bg-yellow-50 border border-yellow-200 shadow-sm hover:shadow-md transition-transform duration-200">
                        <div className="absolute top-4 right-4 bg-yellow-100 rounded-full p-2">
                            <IconCalendarEvent className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="text-3xl font-extrabold text-yellow-700">47</div>
                        <div className="text-sm text-slate-600">Jours sans accident avec arrêt</div>
                    </div>

                    {/* Investissement sécurité */}
                    <div className="relative rounded-xl p-6 bg-purple-50 border border-purple-200 shadow-sm hover:shadow-md transition-transform duration-200">
                        <div className="absolute top-4 right-4 bg-purple-100 rounded-full p-2">
                            <IconCurrencyEuro className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-3xl font-extrabold text-purple-700">2,1 M€</div>
                        <div className="text-sm text-slate-600">Investissement sécurité</div>
                    </div>
                </div>
            </div>

            {/* Carte des risques */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg text-slate-900 mb-6">Carte des risques de l'entreprise</h3>
                <div className="grid grid-cols-5 gap-2 mb-4">
                    {Array.from({ length: 25 }, (_, i) => {
                        const risk = Math.random();
                        const color = risk > 0.7 ? 'bg-red-100' : risk > 0.4 ? 'bg-yellow-100' : 'bg-green-100';
                        const textColor = risk > 0.7 ? 'text-red-600' : risk > 0.4 ? 'text-yellow-700' : 'text-green-700';
                        return (
                            <div key={i} className={`${color} ${textColor} h-8 rounded flex items-center justify-center text-sm`}>
                                {Math.floor(risk * 10)}
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-500">
                    <span>Risque faible</span>
                    <span>Risque élevé</span>
                </div>
            </div>

            {/* Impact financier */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg text-slate-900 mb-6">Impact financier de la sécurité</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Coûts évités (2026)</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <span className="text-green-900">Incidents évités</span>
                                <span className="text-green-700">850 k€</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-blue-900">Économies assurance</span>
                                <span className="text-blue-700">320 k€</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                <span className="text-purple-900">Gains de productivité</span>
                                <span className="text-purple-700">1,2 M€</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Investissements sécurité</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-900">Programmes de formation</span>
                                <span className="text-slate-700">450 k€</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-900">Équipements de sécurité</span>
                                <span className="text-slate-700">680 k€</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-900">Mises à niveau système</span>
                                <span className="text-slate-700">290 k€</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExecutiveReports
