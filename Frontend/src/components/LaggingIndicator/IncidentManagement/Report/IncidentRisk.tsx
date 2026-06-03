import { Select, TextInput } from "@mantine/core"
import TextEditor from "../../../UtilityComp/TextEditor"

const riskLevels: { [key: string]: string } = {
    "1": "Low",
    "2": "Low",
    "3": "Medium",
    "4": "Medium",
    "5": "High"
}

const severities = [
    { label: "1 - Negligible", value: "1" },
    { label: "2 - Minor", value: "2" },
    { label: "3 - Moderate", value: "3" },
    { label: "4 - Major", value: "4" },
    { label: "5 - Catastrophic", value: "5" }
]
const probabilities = [
    { label: "1 - Very Unlikely", value: "1" },
    { label: "2 - Unlikely", value: "2" },
    { label: "3 - Possible", value: "3" },
    { label: "4 - Likely", value: "4" },
    { label: "5 - Very Likely", value: "5" }
]
const IncidentRisk = ({ form }: any) => {
    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <h2 className="text-lg text-gray-800 ">Risk Assessment</h2>
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-4">
                    <Select  {...form.getInputProps("probability")} label="Probability (1-5)" placeholder="Select Probability" withAsterisk data={probabilities} />
                    <Select {...form.getInputProps("severity")} label="Severity (1-5)" placeholder="Select Severity" withAsterisk data={severities} />
                    <TextInput readOnly value={riskLevels[String(form.values.severity)]} label="Risk Level" placeholder="Enter Risk Level" withAsterisk />
                </div>
                <div className="flex flex-col gap-10">
                    <TextEditor withAsterisk form={form} id="existingControlMeasures" title="Existing Control Measures" />
                    <TextEditor withAsterisk form={form} id="residualRiskAssessment" title="Residual Risk Assessment" />

                </div>
            </div>


        </div>
    )
}

export default IncidentRisk