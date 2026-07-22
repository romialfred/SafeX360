import { IconAlertTriangle, IconChartBar, IconScale, IconShield, IconLock, IconArrowNarrowRight, IconTrendingDown } from "@tabler/icons-react";
import { PROBABILITY_LABELS, RISK_LEVEL_LABELS, SEVERITY_LABELS } from "./incidentLabels";
import SafeHtml from "../../UtilityComp/SafeHtml";

/**
 * Évaluation du risque ISO 31000 / ISO 45001 — refonte raffinée FR.
 * Depuis la mise en conformité §8.1.2 : risque AVANT vs APRÈS mesures.
 */

// Bande de risque d'un score P×G (matrice 5×5, max 25).
const bandOf = (score: number | null) =>
    score === null ? null
        : score <= 6 ? { label: 'Faible', color: 'text-green-700', bg: 'bg-green-50/60', border: 'border-green-200/70' }
        : score <= 12 ? { label: 'Modéré', color: 'text-amber-700', bg: 'bg-amber-50/60', border: 'border-amber-200/70' }
        : score <= 19 ? { label: 'Élevé', color: 'text-orange-700', bg: 'bg-orange-50/60', border: 'border-orange-200/70' }
        : { label: 'Critique', color: 'text-red-700', bg: 'bg-red-50/60', border: 'border-red-200/70' };

const RiskAssessment = ({ incident }: any) => {
    const probability = incident.probability;
    const severity = incident.severity;
    const score = probability && severity ? Number(probability) * Number(severity) : null;
    const riskBand = bandOf(score);

    // Risque APRÈS mesures (ISO 45001 §8.1.2) — affiché seulement s'il est renseigné.
    const postProbability = incident.postProbability;
    const postSeverity = incident.postSeverity;
    const postScore = postProbability && postSeverity ? Number(postProbability) * Number(postSeverity) : null;
    const postBand = bandOf(postScore);
    const reductionPct = score && postScore !== null && score > 0
        ? Math.round(((score - postScore) / score) * 100)
        : null;

    // Sévérité potentielle & Haut Potentiel (ICMM / §6.1.2).
    const potentialSeverity = incident.potentialSeverity;
    const potentialProbability = incident.potentialProbability;
    const isHighPotential = incident.highPotential === true || Number(potentialSeverity) >= 4;

    return (
        <div className="space-y-4">
            {/* === Bandeau Haut Potentiel (ICMM / §6.1.2) === */}
            {isHighPotential && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 flex items-start gap-2">
                    <IconAlertTriangle size={18} className="text-red-700 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-red-800">Incident à Haut Potentiel (HPI)</p>
                        <p className="text-[12px] text-red-700">
                            Pire scénario crédible : gravité {potentialSeverity ?? '—'}/5
                            {potentialProbability ? ` · probabilité ${potentialProbability}/5` : ''}. Une enquête approfondie est requise, quelle que soit la gravité réelle.
                        </p>
                    </div>
                </div>
            )}

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
                        <p className="text-[11px] text-slate-600 mt-1">{PROBABILITY_LABELS[probability] || 'Non renseignée'}</p>
                    </div>
                    <div className="bg-red-50/60 border border-red-200/70 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-red-700 mb-1">
                            <IconAlertTriangle size={12} />
                            Gravité (1-5)
                        </div>
                        <p className="text-2xl text-red-800 tabular-nums leading-none">{severity ?? '—'}</p>
                        <p className="text-[11px] text-slate-600 mt-1">{SEVERITY_LABELS[severity] || 'Non renseignée'}</p>
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
                            {riskBand?.label || RISK_LEVEL_LABELS[severity] || '—'}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">Détermine la priorité CAPA</p>
                    </div>
                </div>
            </section>

            {/* === Risque avant / après mesures (ISO 45001 §8.1.2) === */}
            {postScore !== null && (
                <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-teal-50/60 border-b border-teal-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-teal-100">
                            <IconTrendingDown size={14} className="text-teal-700" />
                        </div>
                        <h3 className="text-xs text-slate-800 uppercase tracking-wider flex-1">
                            Risque avant / après mesures
                        </h3>
                        <span className="text-[10px] text-slate-500 italic hidden md:inline">
                            ISO 45001 §8.1.2 — ré-évaluation
                        </span>
                    </header>
                    <div className="p-4 flex flex-wrap items-center gap-3">
                        {/* Avant */}
                        <div className={`flex-1 min-w-[130px] ${riskBand?.bg || 'bg-slate-50/60'} border ${riskBand?.border || 'border-slate-200/70'} rounded-md p-3`}>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Avant mesures</p>
                            <p className={`text-2xl ${riskBand?.color || 'text-slate-800'} tabular-nums leading-none`}>{score}</p>
                            <p className={`text-[11px] mt-1 ${riskBand?.color || 'text-slate-600'}`}>
                                {riskBand?.label} · P{probability} × G{severity}
                            </p>
                        </div>
                        <IconArrowNarrowRight size={22} className="text-slate-400 shrink-0" />
                        {/* Après */}
                        <div className={`flex-1 min-w-[130px] ${postBand?.bg || 'bg-slate-50/60'} border ${postBand?.border || 'border-slate-200/70'} rounded-md p-3`}>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Après mesures</p>
                            <p className={`text-2xl ${postBand?.color || 'text-slate-800'} tabular-nums leading-none`}>{postScore}</p>
                            <p className={`text-[11px] mt-1 ${postBand?.color || 'text-slate-600'}`}>
                                {postBand?.label} · P{postProbability} × G{postSeverity}
                            </p>
                        </div>
                        {/* Réduction */}
                        {reductionPct !== null && (
                            <div className={`shrink-0 rounded-md px-3 py-2 border ${reductionPct > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : reductionPct < 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                <p className="text-[10px] uppercase tracking-wider mb-0.5">
                                    {reductionPct > 0 ? 'Réduction' : reductionPct < 0 ? 'Aggravation' : 'Inchangé'}
                                </p>
                                <p className="text-lg tabular-nums leading-none">{reductionPct > 0 ? `−${reductionPct}%` : reductionPct < 0 ? `+${Math.abs(reductionPct)}%` : '0%'}</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

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
                        /* LOT 41 P0 XSS fix */
                        <SafeHtml html={incident.existingControlMeasures} className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none" />
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
                        /* LOT 41 P0 XSS fix */
                        <SafeHtml html={incident.residualRiskAssessment} className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none" />
                    ) : (
                        <p className="text-xs text-slate-400 italic">Évaluation du risque résiduel non renseignée.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default RiskAssessment;
