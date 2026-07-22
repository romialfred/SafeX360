import { Select, TextInput } from "@mantine/core"
import { IconAlertTriangle } from "@tabler/icons-react"
import TextEditor from "../../../UtilityComp/TextEditor"
import { PROBABILITY_OPTIONS, RISK_LEVEL_LABELS, SEVERITY_OPTIONS } from "../incidentLabels"

// Un pire scénario crédible de gravité ≥ 4/5 (grave à mortel) classe l'incident
// « Haut Potentiel » (ICMM / ISO 45001 §6.1.2) — même s'il n'a rien causé.
const HPI_SEVERITY_THRESHOLD = 4;

const IncidentRisk = ({ form }: any) => {
    const potentialSeverity = Number(form.values.potentialSeverity) || 0;
    const isHighPotential = potentialSeverity >= HPI_SEVERITY_THRESHOLD;

    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <h2 className="text-lg text-gray-800 ">Évaluation du risque</h2>
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-4">
                    <Select  {...form.getInputProps("probability")} label="Probabilité (1-5)" placeholder="Sélectionner la probabilité" withAsterisk data={PROBABILITY_OPTIONS} />
                    <Select {...form.getInputProps("severity")} label="Gravité réelle (1-5)" placeholder="Sélectionner la gravité" withAsterisk data={SEVERITY_OPTIONS} />
                    <TextInput readOnly value={RISK_LEVEL_LABELS[String(form.values.severity)]} label="Niveau de risque" placeholder="Calculé automatiquement" withAsterisk />
                </div>

                {/* Sévérité POTENTIELLE — pire scénario crédible (ICMM / §6.1.2).
                    Pilote le triage Haut Potentiel : un presque-accident à potentiel
                    mortel doit déclencher la même enquête qu'un accident grave. */}
                <div className={`rounded-lg border p-4 ${isHighPotential ? 'border-red-300 bg-red-50/50' : 'border-amber-200 bg-amber-50/40'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-medium text-slate-800">Sévérité potentielle (pire scénario crédible)</h3>
                            <p className="text-[11.5px] text-slate-500">Ce que l'événement AURAIT pu causer — pilote le triage Haut Potentiel (ICMM / §6.1.2).</p>
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
                    {isHighPotential && (
                        <p className="mt-2 text-[12px] text-red-700">
                            Incident classé <strong>Haut Potentiel</strong> : une enquête approfondie est requise, quelle que soit la gravité réelle.
                        </p>
                    )}
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
