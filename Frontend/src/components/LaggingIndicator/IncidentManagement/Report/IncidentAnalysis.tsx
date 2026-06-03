import TextEditor from "../../../UtilityComp/TextEditor"


const IncidentAnalysis = ({ form }: any) => {
    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <h2 className="text-lg text-gray-800">Incident Analysis</h2>
            <div className="flex flex-col gap-5">
                <TextEditor withAsterisk form={form} id="factualDescription" title="Factual Description" />
                <TextEditor withAsterisk form={form} id="immediateCauses" title="Immediate Causes" />
                <TextEditor withAsterisk form={form} id="rootCauses" title="Root Causes" />
                <TextEditor withAsterisk form={form} id="contributingFactors" title="Contributing Factors" />
                <TextEditor withAsterisk form={form} id="immediateConsequences" title="Immediate Consequences" />
                <TextEditor withAsterisk form={form} id="potentialConsequences" title="Potential Consequences" />
                <TextEditor withAsterisk form={form} id="immediateActions" title="Immediate Actions Taken" />
            </div>

        </div>
    )
}

export default IncidentAnalysis