import { Badge, Card, Divider, Grid, Group, Stack, Text } from "@mantine/core";
import { IconAlertTriangle, IconCalendar, IconMapPin, IconTarget, IconTool, IconUser, IconUsers } from "@tabler/icons-react";
import { formatDateShort } from "../../../../utility/DateFormats";


const NonConformityOverview = ({ nonConformity, empMap, analysis, locationMap, processMap }: any) => {
    // Helper for single value fallback
    const showValue = (val: any) => val ? val : '-';
    // Helper for array fallback
    const showArray = (arr: any[], emptyMsg = 'No members') => Array.isArray(arr) && arr.length > 0 ? arr.map((m) => typeof m === 'string' ? m : m?.name || '').join(', ') : emptyMsg;

    return (
        <Grid>
            {/* Basic Information */}
            <Grid.Col span={8}>
                <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 h-full">
                    <Group className="mb-6">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <IconAlertTriangle size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <Text size="lg" className="text-slate-800">
                                Basic Information
                            </Text>
                            <Text size="sm" className="text-slate-600">
                                General details about the non-conformity
                            </Text>
                        </div>
                    </Group>

                    <div className="space-y-4">
                        <Grid>
                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" className="text-slate-700 mb-1">Reference</Text>
                                    <Text className="text-slate-800 font-mono">{showValue(nonConformity?.number)}</Text>
                                </div>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" className="text-slate-700 mb-1">Title</Text>
                                    <Text className="text-slate-800">{showValue(nonConformity?.title)}</Text>
                                </div>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" className="text-slate-700 mb-1">Detection Date</Text>
                                    <Group gap="xs">
                                        <IconCalendar size={14} className="text-slate-400" />
                                        <Text className="text-slate-800">
                                            {nonConformity?.detectionDate ? formatDateShort(nonConformity.detectionDate) : '-'}
                                        </Text>
                                    </Group>
                                </div>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" className="text-slate-700 mb-1">Detected By</Text>
                                    <Group gap="xs">
                                        <IconUser size={14} className="text-slate-400" />
                                        <Text className="text-slate-800">{empMap?.[nonConformity?.reportedBy]?.name || '-'}</Text>
                                    </Group>
                                </div>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" className="text-slate-700 mb-1">Detection Source</Text>

                                    <Text className="text-slate-800">{showValue(nonConformity?.detectionSource)}</Text>
                                </div>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" className="text-slate-700 mb-1">Location</Text>
                                    <Group gap="xs">
                                        <IconMapPin size={14} className="text-slate-400" />
                                        <Text className="text-slate-800">{locationMap?.[nonConformity?.locationId]?.name || '-'}</Text>
                                    </Group>

                                </div>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" className="text-slate-700 mb-1">Work Process</Text>
                                    <Group gap="xs">
                                        <IconTool size={14} className="text-slate-400" />
                                        <Text className="text-slate-800">{processMap?.[nonConformity?.workProcessId]?.name || '-'}</Text>
                                    </Group>
                                </div>
                            </Grid.Col>
                            {/* <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" className="text-slate-700 mb-1">Emitter</Text>
                                    <Text className="text-slate-800">{empMap?.[nonConformity?.reportedBy]?.name}</Text>
                                </div>
                            </Grid.Col> */}
                        </Grid>

                        <Divider />

                        <div>
                            <Text size="sm" className="text-slate-700 mb-2">Description</Text>

                            <div dangerouslySetInnerHTML={{ __html: nonConformity?.description || '-' }} />
                        </div>

                        <div>
                            <Text size="sm" className="text-slate-700 mb-2">Impact</Text>
                            <Text className="text-slate-800">{showArray(nonConformity?.indirectImpacts, 'No data available')}</Text>
                        </div>
                    </div>
                </Card>
            </Grid.Col>

            {/* Assignment & Team */}
            <Grid.Col span={4}>
                <Stack gap="md">
                    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                        <Group className="mb-4">
                            <div className="p-2 rounded-lg bg-green-50">
                                <IconUsers size={20} className="text-green-500" />
                            </div>
                            <div>
                                <Text size="lg" className="text-slate-800">
                                    Analysis Team
                                </Text>
                            </div>
                        </Group>

                        <div className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">

                                {Array.isArray(analysis?.team) && analysis.team.length > 0 ? (
                                    analysis.team.map((member: any, index: any) => (
                                        <div key={index}>
                                            <Text size="sm" className="text-slate-700 mb-1">{member?.role || '-'}</Text>
                                            <Text size="sm" className="text-slate-600">{empMap?.[member?.id]?.name || '-'}</Text>
                                        </div>
                                    ))
                                ) : (
                                    <Text size="sm" className="text-slate-400">No members</Text>
                                )}

                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                        <Group className="mb-4">
                            <div className="p-2 rounded-lg bg-orange-50">
                                <IconTarget size={20} className="text-orange-500" />
                            </div>
                            <div>
                                <Text size="lg" className="text-slate-800">
                                    Classification
                                </Text>
                            </div>
                        </Group>

                        <div className="space-y-3">
                            {/* <div>
                                <Text size="sm" className="text-slate-700 mb-1">Process</Text>
                                <Text size="sm" className="text-slate-600">{nonConformity?.workProcessName || ''}</Text>
                            </div> */}
                            <div className="flex gap-2 items-center">
                                <Text size="sm" className="text-slate-700 mb-1">Cause Defect</Text>
                                <Text size="sm" className="text-slate-600">{showValue(analysis?.origin)}</Text>
                            </div>
                            <div className="flex gap-2 items-center">
                                <Text size="sm" className="text-slate-700 mb-1">Severity Level</Text>
                                <Badge
                                    color="grape"
                                    variant="light"
                                    className="rounded-full"
                                >
                                    {showValue(nonConformity?.severityLevel)}
                                </Badge>
                            </div>

                        </div>
                    </Card>
                </Stack>
            </Grid.Col>
        </Grid>
    )
}

export default NonConformityOverview