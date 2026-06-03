import { IconAlertTriangle, IconChartBar, IconScale, IconShield, IconLock } from "@tabler/icons-react";
import { probabilitiesMap, riskLevels, severitiesMap } from "../../../Data/DropdownData";

/**
 * Évaluation du risque ISO 31000 / ISO 45001 — refonte raffinée FR.
 */

const RiskAssessment = ({ incident }: any) => {
    const probability = incident.probability;
    const severity = incident.severity;
    const score = probability && severity ? Number(probability) * Number(severity) : null;
    const riskBand = score === null ? null
        : score <= 6 ? { label: 'Faible', color: 'text-green-700', bg: 'bg-green-50/60', border: 'border-green-200/70' }
        : score <= 12 ? { label: 'Modéré', color: 'text-amber-700', bg: 'bg-amber-50/60', border: 'border-amber-200/70' }
        : score <= 19 ? { label: 'Élevé', color: 'text-orange-700', bg: 'bg-orange-50/60', border: 'border-orange-200/70' }
        : { label: 'Critique', color: 'text-red-700', bg: 'bg-red-50/60', border: 'border-red-200/70' };

    return (
        <div className="space-y-4">
            {/* === KPIs matrice risque === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-red-50/60 border-b border-red-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-red-100">
                        <IconAlertTriangle size={14} className="text-red-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Évaluation du risque
                    </h2>
                    <span className="ml-auto text-[10px] text-slate-500 italic">
                        ISO 31000 — Probabilité × Gravité
                    </span>
                </header>
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50/60 border border-blue-200/70 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-blue-700 mb-1">
                            <IconChartBar size={12} />
                            Probabilité (1-5)
                        </div>
                        <p className="text-2xl text-blue-800 tabular-nums leading-none">{probability ?? '—'}</p>
                        <p className="text-[11px] text-slate-600 mt-1">{probabilitiesMap[probability] || 'Non renseignée'}</p>
                    </div>
                    <div className="bg-red-50/60 border border-red-200/70 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-red-700 mb-1">
                            <IconAlertTriangle size={12} />
                            Gravité (1-5)
                        </div>
                        <p className="text-2xl text-red-800 tabular-nums leading-none">{severity ?? '—'}</p>
                        <p className="text-[11px] text-slate-600 mt-1">{severitiesMap[severity] || 'Non renseignée'}</p>
                    </div>
                    <div className={`${riskBand?.bg || 'bg-slate-50/60'} border ${riskBand?.border || 'border-slate-200/70'} rounded-md p-3`}>
                        <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${riskBand?.color || 'text-slate-700'} mb-1`}>
                            <IconScale size={12} />
                            Score (P × G)
                        </div>
                        <p className={`text-2xl ${riskBand?.color || 'text-slate-800'} tabular-nums leading-none`}>{score ?? '—'}</p>
                        <p className="text-[11px] text-slate-600 mt-1">{score !== null ? `/ 25 max` : 'Non calculé'}</p>
                    </div>
                    <div className={`${riskBand?.bg || 'bg-slate-50/60'} border ${riskBand?.border || 'border-slate-200/70'} rounded-md p-3`}>
                        <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${riskBand?.color || 'text-slate-700'} mb-1`}>
                            <IconAlertTriangle size={12} />
                            Niveau de risque
                        </div>
                        <p className={`text-lg ${riskBand?.color || 'text-slate-800'} leading-tight`}>
                            {riskBand?.label || riskLevels[severity] || '—'}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">Détermine la priorité CAPA</p>
                    </div>
                </div>
            </section>

            {/* === Contrôles existants === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-green-50/60 border-b border-green-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-green-100">
                        <IconShield size={14} className="text-green-700" />
                    </div>
                    <h3 className="text-xs text-slate-800 uppercase tracking-wider flex-1">
                        Contrôles existants
                    </h3>
                    <span className="text-[10px] text-slate-500 italic hidden md:inline">
                        Hiérarchie ISO 45001 §8.1.2 : Élimination · Substitution · Ingénierie · Administratif · EPI
                    </span>
                </header>
                <div className="p-4">
                    {incident.existingControlMeasures ? (
                        <div className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: incident.existingControlMeasures }} />
                    ) : (
                        <p className="text-xs text-slate-400 italic">Aucun contrôle existant renseigné.</p>
                    )}
                </div>
            </section>

            {/* === Risque résiduel === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-teal-50/60 border-b border-teal-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-teal-100">
                        <IconLock size={14} className="text-teal-700" />
                    </div>
                    <h3 className="text-xs text-slate-800 uppercase tracking-wider flex-1">
                        Risque résiduel
                    </h3>
                    <span className="text-[10px] text-slate-500 italic hidden md:inline">
                        Doit être ALARP (As Low As Reasonably Practicable)
                    </span>
                </header>
                <div className="p-4">
                    {incident.residualRiskAssessment ? (
                        <div className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: incident.residualRiskAssessment }} />
                    ) : (
                        <p className="text-xs text-slate-400 italic">Évaluation du risque résiduel non renseignée.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default RiskAssessment;
