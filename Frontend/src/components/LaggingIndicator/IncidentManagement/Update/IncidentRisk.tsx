import { Select, TextInput } from "@mantine/core"
import { IconAlertTriangle } from "@tabler/icons-react"
import TextEditor from "../../../UtilityComp/TextEditor"
import { PROBABILITY_OPTIONS, RISK_LEVEL_LABELS, SEVERITY_OPTIONS } from "../incidentLabels"

const HPI_SEVERITY_THRESHOLD = 4;

const bandLabel = (score: number | null) =>
    score === null ? '—'
        : score <= 6 ? 'Faible'
        : score <= 12 ? 'Modéré'
        : score <= 19 ? 'Élevé'
        : 'Critique';

const IncidentRisk = ({ form }: any) => {
    // Comparaison avant / après pour guider l'investigateur (ISO 45001 §8.1.2).
    const p = Number(form.values.probability) || 0;
    const s = Number(form.values.severity) || 0;
    const initialScore = p && s ? p * s : null;
    const pp = Number(form.values.postProbability) || 0;
    const ps = Number(form.values.postSeverity) || 0;
    const postScore = pp && ps ? pp * ps : null;
    const reductionPct = initialScore && postScore !== null && initialScore > 0
        ? Math.round(((initialScore - postScore) / initialScore) * 100)
        : null;
    const isHighPotential = (Number(form.values.potentialSeverity) || 0) >= HPI_SEVERITY_THRESHOLD;

    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <h2 className="text-lg text-gray-800 ">Évaluation du risque</h2>
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-4">
                    <Select  {...form.getInputProps("probability")} label="Probabilité (1-5)" placeholder="Sélectionner la probabilité" withAsterisk data={PROBABILITY_OPTIONS} />
                    <Select {...form.getInputProps("severity")} label="Gravité réelle (1-5)" placeholder="Sélectionner la gravité" withAsterisk data={SEVERITY_OPTIONS} />
                    <TextInput readOnly value={RISK_LEVEL_LABELS[String(form.values.severity)]} label="Niveau de risque" placeholder="Calculé automatiquement" withAsterisk />
                </div>

                {/* Sévérité POTENTIELLE — pire scénario crédible (ICMM / §6.1.2). */}
                <div className={`rounded-lg border p-4 ${isHighPotential ? 'border-red-300 bg-red-50/50' : 'border-amber-200 bg-amber-50/40'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-medium text-slate-800">Sévérité potentielle (pire scénario crédible)</h3>
                            <p className="text-[11.5px] text-slate-500">Pilote le triage Haut Potentiel (ICMM / §6.1.2).</p>
                        </div>
                        {isHighPotential && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded border bg-red-100 border-red-300 text-red-800 uppercase tracking-wider">
                                <IconAlertTriangle size={14} /> Haut Potentiel
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select {...form.getInputProps("potentialProbability")} clearable label="Probabilité potentielle (1-5)" placeholder="Pire scénario" data={PROBABILITY_OPTIONS} />
                        <Select {...form.getInputProps("potentialSeverity")} clearable label="Gravité potentielle (1-5)" placeholder="Pire scénario" data={SEVERITY_OPTIONS} />
                    </div>
                </div>

                {/* Risque APRÈS mesures — ré-évaluation §8.1.2. Facultatif tant que
                    l'incident n'est pas prêt à clôturer ; requis à la clôture d'un
                    incident traité (garde serveur RESIDUAL_RISK_REQUIRED_FOR_CLOSURE). */}
                <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-medium text-slate-800">Risque après mesures</h3>
                            <p className="text-[11.5px] text-slate-500">Ré-évaluation une fois les mesures en place (ISO 45001 §8.1.2) — requis pour clôturer.</p>
                        </div>
                        {reductionPct !== null && (
                            <span className={`shrink-0 inline-flex items-center px-2.5 py-1 text-[11px] rounded border ${reductionPct > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : reductionPct < 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                {reductionPct > 0 ? `Risque réduit de ${reductionPct}%` : reductionPct < 0 ? `Risque aggravé de ${Math.abs(reductionPct)}%` : 'Risque inchangé'}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Select {...form.getInputProps("postProbability")} clearable label="Probabilité résiduelle (1-5)" placeholder="Après mesures" data={PROBABILITY_OPTIONS} />
                        <Select {...form.getInputProps("postSeverity")} clearable label="Gravité résiduelle (1-5)" placeholder="Après mesures" data={SEVERITY_OPTIONS} />
                        <TextInput readOnly value={postScore !== null ? `${bandLabel(postScore)} (${postScore})` : ''} label="Niveau résiduel" placeholder="Calculé automatiquement" />
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    <TextEditor withAsterisk form={form} id="existingControlMeasures" title="Mesures de maîtrise existantes" />
                    <TextEditor withAsterisk form={form} id="residualRiskAssessment" title="Évaluation du risque résiduel" />

                </div>
            </div>


        </div>
    )
}

export default IncidentRisk
