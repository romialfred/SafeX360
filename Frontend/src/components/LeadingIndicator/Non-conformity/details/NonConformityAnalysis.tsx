import { Badge, Card, Group, Text } from "@mantine/core"
import { IconTarget } from "@tabler/icons-react"
import { analysisMethodsMap } from "../../../../Data/DropdownData"
import { formatDateShort } from "../../../../utility/DateFormats"


const NonConformityAnalysis = ({ analysis }: any) => {
    // Helper for single value fallback
    const showValue = (val: any) => val ? val : '-';
    // Helper for array fallback
    const showArray = (arr: any[], emptyMsg = 'No data available') => Array.isArray(arr) && arr.length > 0 ? arr.join(', ') : emptyMsg;
    return (
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
            <Group className="mb-6">
                <div className="p-2 rounded-lg bg-yellow-50">
                    <IconTarget size={20} className="text-yellow-600" />
                </div>
                <div>
                    <Text size="lg" fw={600} className="text-slate-800">
                        Root Cause Analysis
                    </Text>
                    <Text size="sm" className="text-slate-600">
                        Detailed analysis and findings
                    </Text>
                </div>
            </Group>

            <div className="space-y-6">
                {/* Analysis Method & Origin */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Text size="sm" fw={500} className="text-slate-700 mb-2">Analysis Method</Text>
                        <Badge variant="light" className="!bg-blue-100 !text-blue-700">
                            {analysis?.method ? (analysisMethodsMap[analysis?.method] || analysis?.method) : '-'}
                        </Badge>
                    </div>
                    <div>
                        <Text size="sm" fw={500} className="text-slate-700 mb-2">Origin</Text>
                        <Badge variant="light" className="!bg-green-100 !text-green-700">
                            {showValue(analysis?.origin)}
                        </Badge>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <Text size="sm" fw={500} className="text-slate-700 mb-2">Description</Text>
                    <Text className="text-slate-600">
                        {showValue(analysis?.description) === '-' ? 'No description available.' : analysis?.description}
                    </Text>
                </div>

                {/* Factors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Text size="sm" fw={500} className="text-slate-700 mb-2">Individual Factors</Text>
                        <Text className="text-slate-600">{showValue(analysis?.individualFactors)}</Text>
                    </div>
                    <div>
                        <Text size="sm" fw={500} className="text-slate-700 mb-2">Technical Factors</Text>
                        <Text className="text-slate-600">{showValue(analysis?.technicalFactors)}</Text>
                    </div>
                    <div>
                        <Text size="sm" fw={500} className="text-slate-700 mb-2">Organizational Factors</Text>
                        <Text className="text-slate-600">{showValue(analysis?.organizationalFactors)}</Text>
                    </div>
                </div>

                {/* Root Causes */}
                <div>
                    <Text size="sm" fw={500} className="text-slate-700 mb-2">Root Causes</Text>
                    <Text className="text-slate-600">{showArray(analysis?.rootCauses, 'No data available')}</Text>
                </div>

                {/* Dates Only */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Text size="sm" fw={500} className="text-slate-700 mb-2">Start Date</Text>
                        <Text className="text-slate-600">{analysis?.startDate ? formatDateShort(analysis.startDate) : '-'}</Text>
                    </div>
                    <div>
                        <Text size="sm" fw={500} className="text-slate-700 mb-2">Deadline</Text>
                        <Text className="text-slate-600">{analysis?.deadline ? formatDateShort(analysis.deadline) : '-'}</Text>
                    </div>
                </div>

                {/* Summary */}
                <div>
                    <Text size="sm" fw={500} className="text-slate-700 mb-2">Summary</Text>
                    <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: analysis?.summary || '-' }} />
                </div>

                {/* Conclusion */}
                <div>
                    <Text size="sm" fw={500} className="text-slate-700 mb-2">Conclusion</Text>
                    <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: analysis?.conclusion || '-' }} />
                </div>
            </div>
        </Card>
    )
}

export default NonConformityAnalysis