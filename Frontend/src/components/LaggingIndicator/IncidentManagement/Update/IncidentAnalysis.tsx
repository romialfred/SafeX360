import TextEditor from "../../../UtilityComp/TextEditor"


const IncidentAnalysis = ({ form }: any) => {
    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <h2 className="text-lg text-gray-800">Analyse de l'incident</h2>
            <div className="flex flex-col gap-5">
                <TextEditor withAsterisk form={form} id="factualDescription" title="Description factuelle" />
                <TextEditor withAsterisk form={form} id="immediateCauses" title="Causes immédiates" />
                <TextEditor withAsterisk form={form} id="rootCauses" title="Causes profondes" />
                <TextEditor withAsterisk form={form} id="contributingFactors" title="Facteurs contributifs" />
                <TextEditor withAsterisk form={form} id="immediateConsequences" title="Conséquences immédiates" />
                <TextEditor withAsterisk form={form} id="potentialConsequences" title="Conséquences potentielles" />
                <TextEditor withAsterisk form={form} id="immediateActions" title="Actions immédiates prises" />
            </div>

        </div>
    )
}

export default IncidentAnalysis