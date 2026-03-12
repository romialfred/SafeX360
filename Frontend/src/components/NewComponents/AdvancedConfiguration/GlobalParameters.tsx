import { IconAlertTriangle, IconCircleCheck, IconClipboardCheck, IconFileText, IconHelmet, IconSearch, IconSettings, IconShield, IconUsers } from "@tabler/icons-react";
import { useState } from "react";



interface GlobalParameter {
    id: string;
    name: string;
    description: string;
    value: number;
    unit: string;
    category: string;
    minValue: number;
    maxValue: number;
}

const mockGlobalParameters: GlobalParameter[] = [
    {
        id: 'incident-processing-duration',
        name: 'Incident Processing Duration',
        description: 'Maximum time allocated to process an incident',
        value: 7,
        unit: 'days',
        category: 'Incident Management',
        minValue: 1,
        maxValue: 30
    },
    {
        id: 'ppe-request-duration',
        name: 'PPE Request Duration',
        description: 'Processing time for personal protective equipment requests',
        value: 3,
        unit: 'days',
        category: 'PPE Management',
        minValue: 1,
        maxValue: 14
    },
    {
        id: 'hazard-processing-duration',
        name: 'Hazard Processing Duration',
        description: 'Time allocated to process a hazard identification',
        value: 5,
        unit: 'days',
        category: 'Risk Management',
        minValue: 1,
        maxValue: 21
    },
    {
        id: 'document-validation-duration',
        name: 'Document Validation Duration',
        description: 'Maximum time to validate a document',
        value: 10,
        unit: 'days',
        category: 'Document Management',
        minValue: 1,
        maxValue: 30
    },
    {
        id: 'audit-execution-duration',
        name: 'Audit Execution Duration',
        description: 'Time allocated to execute a complete audit',
        value: 14,
        unit: 'days',
        category: 'Audit Management',
        minValue: 1,
        maxValue: 60
    },
    {
        id: 'training-completion-duration',
        name: 'Training Completion Duration',
        description: 'Time limit to complete mandatory training',
        value: 30,
        unit: 'days',
        category: 'Training Management',
        minValue: 7,
        maxValue: 90
    },
    {
        id: 'investigation-duration',
        name: 'Investigation Duration',
        description: 'Maximum time to conduct an incident investigation',
        value: 21,
        unit: 'days',
        category: 'Investigation',
        minValue: 7,
        maxValue: 60
    },
    {
        id: 'corrective-action-duration',
        name: 'Corrective Action Duration',
        description: 'Time limit to implement a corrective action',
        value: 45,
        unit: 'days',
        category: 'Action Management',
        minValue: 7,
        maxValue: 180
    }
];
const GlobalParameters = () => {

    const [globalParameters, setGlobalParameters] = useState<GlobalParameter[]>(mockGlobalParameters);
    const categories = Array.from(new Set(globalParameters.map(param => param.category)));

    const handleGlobalParameterChange = (id: string, value: number) => {
        setGlobalParameters(prev =>
            prev.map(param =>
                param.id === id ? { ...param, value } : param
            )
        );
    };
    const getCategoryIcon = (category: string) => {
        switch (category) {
            // Category icons
            case 'Incident Management': return <IconAlertTriangle className="w-4 h-4" />;
            case 'PPE Management': return <IconHelmet className="w-4 h-4" />;
            case 'Risk Management': return <IconShield className="w-4 h-4" />;
            case 'Document Management': return <IconFileText className="w-4 h-4" />;
            case 'Audit Management': return <IconClipboardCheck className="w-4 h-4" />;
            case 'Training Management': return <IconUsers className="w-4 h-4" />;
            case 'Investigation': return <IconSearch className="w-4 h-4" />;
            case 'Action Management': return <IconCircleCheck className="w-4 h-4" />;
            default: return <IconSettings className="w-4 h-4" />;
        }
    };
    return (
        <div>
            <div className="space-y-6">
                {categories.map(category => (
                    <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                {getCategoryIcon(category)}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">{category}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {globalParameters
                                .filter(param => param.category === category)
                                .map(param => (
                                    <div key={param.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-gray-900 mb-1">{param.name}</h4>
                                                <p className="text-xs text-gray-600">{param.description}</p>
                                            </div>
                                            <div className="ml-4 text-right">
                                                <div className="text-lg font-bold text-blue-600">{param.value}</div>
                                                <div className="text-xs text-gray-500">{param.unit}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xs text-gray-500 w-8">{param.minValue}</span>
                                                <input
                                                    type="range"
                                                    min={param.minValue}
                                                    max={param.maxValue}
                                                    value={param.value}
                                                    onChange={(e) => handleGlobalParameterChange(param.id, parseInt(e.target.value))}
                                                    className="flex-1"
                                                />
                                                <span className="text-xs text-gray-500 w-8">{param.maxValue}</span>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    value={param.value}
                                                    onChange={(e) => handleGlobalParameterChange(param.id, parseInt(e.target.value))}
                                                    min={param.minValue}
                                                    max={param.maxValue}
                                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                <span className="text-sm text-gray-600">{param.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default GlobalParameters