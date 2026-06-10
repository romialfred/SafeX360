import { Select, TextInput } from "@mantine/core"
import TextEditor from "../../../UtilityComp/TextEditor"
import { PROBABILITY_OPTIONS, RISK_LEVEL_LABELS, SEVERITY_OPTIONS } from "../incidentLabels"

const IncidentRisk = ({ form }: any) => {
    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <h2 className="text-lg text-gray-800 ">Évaluation du risque</h2>
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-4">
                    <Select  {...form.getInputProps("probability")} label="Probabilité (1-5)" placeholder="Sélectionner la probabilité" withAsterisk data={PROBABILITY_OPTIONS} />
                    <Select {...form.getInputProps("severity")} label="Gravité (1-5)" placeholder="Sélectionner la gravité" withAsterisk data={SEVERITY_OPTIONS} />
                    <TextInput readOnly value={RISK_LEVEL_LABELS[String(form.values.severity)]} label="Niveau de risque" placeholder="Calculé automatiquement" withAsterisk />
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
