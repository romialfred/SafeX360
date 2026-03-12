import { Card, Group, Text, Paper, Badge } from "@mantine/core";
import { IconTool, IconCheck, IconPhoto } from "@tabler/icons-react";
import { handlePreview } from "../../../../utility/DocumentUtility";


const NonConformityTreatment = ({ nonConformity }: any) => {
    // Calculate total value
    const totalNCValue = (nonConformity.materialCost || 0) + (nonConformity.laborCost || 0) + (nonConformity.adminFees || 0) + (nonConformity.expenses || 0);
    const currencySymbols: Record<string, string> = {
        'EUR': '€',
        'USD': '$',
        'XOF': 'CFA'
    };

    const getCurrencySymbol = (currency: string) => currencySymbols[currency] || currency;

    // Get labels based on event type (from TreatmentStep)
    const isNearMiss = nonConformity.type === 'NEAR_MISS';
    const labels = {
        valorisationTitle: isNearMiss ? 'Prevention Cost' : 'Non-Conformity Valuation',
        valorisationDescription: isNearMiss ? 'Estimated costs of implementing preventive actions' : 'Direct costs related to the non-conformity',
        materialCost: isNearMiss ? 'Equipment/Material Cost' : 'Material/Equipment Cost',
        laborCost: isNearMiss ? 'Training/Personnel Cost' : 'Labor Cost',
        adminFees: isNearMiss ? 'Communication Fees' : 'Administrative Fees',
        expenses: 'Miscellaneous Expenses',
        totalLabel: isNearMiss ? 'Total Prevention:' : 'Total NC Value:',
        impactsTitle: isNearMiss ? 'Preventive Benefits' : 'Indirect Impacts',
        impactsDescription: isNearMiss
            ? 'Benefits obtained through prevention'
            : 'Consequences that cannot be financially quantified',
        detailsTitle: 'Details',
        docsTitle: 'Documents',
        impactsCommentTitle: isNearMiss ? 'Comment on preventive benefits' : 'Comment on indirect impacts',
    };

    return (
        <Card className="bg-white border border-slate-200 shadow-lg rounded-2xl p-8">
            <Group className="mb-5">
                <div className={`p-3 rounded-xl bg-gradient-to-tr ${isNearMiss ? 'from-green-100 to-lime-50' : 'from-orange-100 to-yellow-50'} shadow`}>
                    <IconTool size={28} className={isNearMiss ? 'text-green-600' : 'text-orange-600'} />
                </div>
                <div>
                    <Text size="xl" fw={700} className={isNearMiss ? 'text-green-700 tracking-tight' : 'text-orange-700 tracking-tight'}>
                        {isNearMiss ? 'Prevention Summary' : 'Treatment Summary'}
                    </Text>
                    <Text size="sm" className="text-slate-500">
                        {isNearMiss ? 'Preventive actions overview' : 'Corrective and preventive actions overview'}
                    </Text>
                </div>
            </Group>

            <div className="space-y-5">
                {/* Valuation Section */}
                <Paper radius="md" shadow="xs" className={`p-5 ${isNearMiss ? 'bg-green-50/60 border border-green-100' : 'bg-orange-50/60 border border-orange-100'}`}>
                    <Text size="md" fw={600} className={isNearMiss ? 'text-green-700 mb-3' : 'text-orange-700 mb-3'}>{labels.valorisationTitle}</Text>
                    <Text size="sm" className="text-slate-600 mb-3">{labels.valorisationDescription}</Text>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Text size="sm" className="text-slate-700">{labels.materialCost}</Text>
                            <Text className="text-slate-600">{nonConformity.materialCost} {getCurrencySymbol(nonConformity.currency)}</Text>
                        </div>
                        <div>
                            <Text size="sm" className="text-slate-700">{labels.laborCost}</Text>
                            <Text className="text-slate-600">{nonConformity.laborCost} {getCurrencySymbol(nonConformity.currency)}</Text>
                        </div>
                        <div>
                            <Text size="sm" className="text-slate-700">{labels.adminFees}</Text>
                            <Text className="text-slate-600">{nonConformity.adminFees} {getCurrencySymbol(nonConformity.currency)}</Text>
                        </div>
                        <div>
                            <Text size="sm" className="text-slate-700">{labels.expenses}</Text>
                            <Text className="text-slate-600">{nonConformity.expenses} {getCurrencySymbol(nonConformity.currency)}</Text>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <Text size="sm" fw={600} className={isNearMiss ? 'text-green-700' : 'text-orange-700'}>{labels.totalLabel}</Text>
                        <Text size="lg" fw={700} className={isNearMiss ? 'text-green-900' : 'text-orange-900'}>{totalNCValue} {getCurrencySymbol(nonConformity.currency)}</Text>
                    </div>
                </Paper>

                {/* Details */}
                {nonConformity.details && (
                    <Paper radius="md" shadow="xs" className="p-5 bg-white border border-slate-100">
                        <Text size="md" fw={600} className="text-slate-800 mb-2">{labels.detailsTitle}</Text>
                        <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: nonConformity.details }} />
                    </Paper>
                )}

                {/* Docs */}
                {nonConformity.docs && nonConformity.docs.length > 0 && (
                    <Paper radius="md" shadow="xs" className="p-5 bg-white border border-slate-100">
                        <Text size="md" mb={5} fw={600} className="text-slate-800 mb-2">{labels.docsTitle}</Text>
                        <Group className="flex flex-wrap gap-2">
                            {nonConformity.docs.map((doc: any) => (
                                <Badge
                                    key={doc.name}
                                    size="lg"
                                    className="!cursor-pointer"
                                    onClick={() => handlePreview(doc)}
                                    leftSection={<IconPhoto size={14} />}
                                    color={isNearMiss ? 'green' : 'orange'}
                                    variant="light"
                                >
                                    {doc.name}
                                </Badge>
                            ))}
                        </Group>
                    </Paper>
                )}

                {/* Indirect Impacts / Preventive Benefits */}
                {nonConformity.indirectImpacts && nonConformity.indirectImpacts.length > 0 && (
                    <Paper radius="md" shadow="xs" className="p-5 bg-white border border-slate-100">
                        <Text size="md" fw={600} className="text-slate-800 mb-2">{labels.impactsTitle}</Text>
                        <Text size="sm" className="text-slate-600 mb-2">{labels.impactsDescription}</Text>
                        <div className="flex flex-col gap-2">
                            {nonConformity.indirectImpacts.map((impact: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <IconCheck size={18} className={isNearMiss ? 'text-green-600' : 'text-orange-600'} />
                                    <span className="text-slate-600">{impact}</span>
                                </div>
                            ))}
                        </div>
                    </Paper>
                )}

                {/* Comments on indirect impacts / preventive benefits */}
                {nonConformity.comments && (
                    <Paper radius="md" shadow="xs" className="p-5 bg-white border border-slate-100">
                        <Text size="md" fw={600} className="text-slate-800 mb-2">{labels.impactsCommentTitle}</Text>
                        <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: nonConformity.comments }} />
                    </Paper>
                )}

                {/* Feedback on support */}
                {/* {nonConformity.supportComments && (
                    <Paper radius="md" shadow="xs" className="p-5 bg-white border border-slate-100">
                        <Text size="md" fw={600} className="text-slate-800 mb-2">Feedback on support</Text>
                        <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: nonConformity.supportComments }} />
                    </Paper>
                )} */}
            </div>
        </Card>
    )
}

export default NonConformityTreatment