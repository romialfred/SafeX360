import { probabilitiesMap, riskLevels, severitiesMap } from "../../../Data/DropdownData"

const RiskAssessment = ({ incident }: any) => {
    return (
        <div className="bg-white shadow-md rounded-2xl p-6 space-y-6 ">
            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Risk Assessment</h2>
                </div>

            </div>

            <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-500">Probability (1–5)</p>
                    <p className="font-medium text-gray-800">{probabilitiesMap[incident.probability]}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Severity (1–5)</p>
                    <p className="font-medium text-gray-800">{severitiesMap[incident.severity]}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Risk Level</p>
                    <p className="font-medium text-red-600">{riskLevels[incident.severity]}</p>
                </div>
            </div>

            <div>
                <h4 className="text-md font-semibold text-gray-700 mb-1">Existing Control Measures</h4>
                <div
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700"
                    dangerouslySetInnerHTML={{ __html: incident.existingControlMeasures }}
                />
            </div>

            <div>
                <h4 className="text-md font-semibold text-gray-700 mb-1">Residual Risk Assessment</h4>
                <div
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700"
                    dangerouslySetInnerHTML={{ __html: incident.residualRiskAssessment }}
                />
            </div>
        </div>
    )
}

export default RiskAssessment