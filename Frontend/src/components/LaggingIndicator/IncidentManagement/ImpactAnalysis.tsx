const ImpactAnalysis = ({ incident }: any) => {
    return (
        <div className="flex flex-col gap-6">
            {/* Factual Description */}
            <div className="p-4 border-l-4 border-blue-500 bg-blue-100/30 rounded-md">
                <h4 className="text-lg font-semibold text-black mb-1">Factual Description</h4>
                <div dangerouslySetInnerHTML={{ __html: incident.factualDescription }} />
            </div>

            {/* Immediate Causes */}
            <div className="p-4 border-l-4 border-pink-500 bg-pink-100/30 rounded-md">
                <p className="text-lg font-medium text-black">Immediate Causes</p>
                <div dangerouslySetInnerHTML={{ __html: incident.immediateCauses }} />
            </div>

            {/* Root Causes */}
            <div className="p-4 border-l-4 border-green-500 bg-green-100/30 rounded-md">
                <h4 className="text-lg font-medium text-black">Root Causes</h4>
                <div dangerouslySetInnerHTML={{ __html: incident.rootCauses }} className="text-gray-600" />
            </div>

            {/* Contributing Factors */}
            <div className="p-4 border-l-4 border-violet-500 bg-violet-100/30 rounded-md">
                <h4 className="text-lg font-medium text-black mb-1">Contributing Factors</h4>
                <div dangerouslySetInnerHTML={{ __html: incident.contributingFactors }} className="text-gray-600" />
            </div>

            {/* Immediate Consequences */}
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-100/30 rounded-md">
                <h4 className="text-lg font-medium text-black">Immediate Consequences</h4>
                <div dangerouslySetInnerHTML={{ __html: incident.immediateConsequences }} className="text-gray-600" />
            </div>

            {/* Potential Consequences */}
            <div className="p-4 border-l-4 border-green-600 bg-green-100/30 rounded-md">
                <h4 className="text-lg font-medium text-black">Potential Consequences</h4>
                <div dangerouslySetInnerHTML={{ __html: incident.potentialConsequences }} className="text-gray-600" />
            </div>

            {/* Immediate Actions Taken */}
            <div className="p-4 border-l-4 border-red-500 bg-red-100/30 rounded-md">
                <h4 className="text-lg font-medium text-black">Immediate Actions Taken</h4>
                <div dangerouslySetInnerHTML={{ __html: incident.immediateActions }} className="text-gray-600" />
            </div>
        </div>
    );
};

export default ImpactAnalysis;