import { Card, Text, Title, Badge, Group, Breadcrumbs } from '@mantine/core';
import { Timeline } from '@mantine/core';
import { IconMapPin, IconClock, IconUser, IconPhoto } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getIncidentDetails } from '../../../services/IncidentService';
import { getActionsByNonConformityId, getCorrectiveActionByActivityId, getCorrectiveActionByIncidentId, getCorrectiveActionByInspectionId } from '../../../services/CorrectiveActionService';
import { statusColors, statusLabels } from '../../../Data/IncidentsData';
import { formatDateWithDay } from '../../../utility/DateFormats';
import { getAllActionProcessByActionId } from '../../../services/ActionProcessService';
import { mapIdToProcess } from '../../../utility/OtherUtilities';
import { getPgiInfo } from '../../../services/PgiService';
import { getActivityInfo } from '../../../services/HsActivityService';
import { handlePreview } from '../../../utility/DocumentUtility';
import { getInfoByNonConformityId } from '../../../services/NonConformityService';

const Details = () => {
    const { id, type } = useParams();
    const [incident, setIncident] = useState<any>({});
    const [correctiveActions, setCorrectiveActions] = useState<any>([]);
    const [actionProcess, setActionProcess] = useState<Record<number, any>>({});
    useEffect(() => {
        const getDetails = type == "INCIDENT" ? getIncidentDetails : type == "HS_ACTIVITY" ? getActivityInfo : type == "NON_CONFORMITY" ? getInfoByNonConformityId : getPgiInfo;
        const getActions = type == "INCIDENT" ? getCorrectiveActionByIncidentId : type == "HS_ACTIVITY" ? getCorrectiveActionByActivityId : type == "NON_CONFORMITY" ? getActionsByNonConformityId : getCorrectiveActionByInspectionId;
        getDetails(id).then((res) => {
            console.log(res);
            setIncident(res);
        }).catch((_err) => {
        })

        getActions(id).then(async (res) => {
            setCorrectiveActions(res);
            let actionIds = res.map((item: any) => item.id);
            let processes = await Promise.all(
                actionIds.map(async (actionId: any) => ({
                    id: actionId,
                    process: await getAllActionProcessByActionId(actionId)
                }))
            );
            setActionProcess(mapIdToProcess(processes));


        }).catch((_err) => {
        })
    }, []);


    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Corrective Action Details</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/corrective" ><Text variant="gradient" className="hover:!underline cursor-pointer">Corrective Action</Text></Link>
                        <Text variant="gradient">Corrective Action Details</Text>
                    </Breadcrumbs>
                </div>

            </div>
            <Card shadow="xs" radius="md" withBorder className="bg-white flex flex-col gap-1 p-4">
                <div className='flex items-center justify-between'>
                    <Title order={4} className="text-gray-800 font-semibold">{incident.title}</Title>
                </div>

                {type != "NON_CONFORMITY" && (
                    <div className='flex items-center gap-2 text-gray-600 text-sm'>
                        <IconMapPin size={16} />
                        <Text className="text-gray-600">{incident.location}</Text>
                    </div>
                )}
            </Card>
            <div className='flex gap-2 items-center'>
                <IconClock color='gray' size={18} />
                <h2 className='text-lg font-medium text-gray-700'>Action Plans History</h2>
            </div>

            {correctiveActions?.map((action: any, idx: number) => <Card key={action.id ?? idx} shadow="xs" radius="md" withBorder className="bg-white flex flex-col gap-4 p-4">

                <Group className="mb-1 !flex !justify-between">
                    <h3 className='text-lg font-semibold text-primary'>{action.actionName}</h3>
                    <Badge size='md' variant="light" color={statusColors[action.status]}>{statusLabels[action.status]}</Badge>
                </Group>

                <div className='flex gap-3 flex-col bg-blue-50 p-3 rounded-lg shadow-xs mb-1 border border-blue-100'>

                    <div dangerouslySetInnerHTML={{ __html: action.description }} className="text-gray-600 text-sm leading-relaxed" />
                    <Group className="!flex !justify-between">
                        <div className='text-blue-700 bg-blue-100 px-2 py-1 rounded-full flex gap-1 items-center border border-blue-200 shadow-xs text-sm'>
                            <IconUser size={16} />
                            <p>{action.assignedEmployeeName}</p>
                        </div>
                        <div className='text-red-700 bg-red-100 px-2 py-1 rounded-full flex gap-1 items-center border border-red-200 shadow-xs text-sm'>
                            <IconClock size={16} />
                            <p>Deadline: {formatDateWithDay(action.deadline)}</p>
                        </div>
                        <Badge color="yellow" size='md' variant="light" className='shadow-xs'>{action.progress}%</Badge>
                    </Group>
                </div>

                {actionProcess[action.id]?.length > 0 && <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex flex-col gap-3">
                    <Title order={5} className="text-primary">Progress Timeline</Title>

                    <Timeline active={6} bulletSize={20} lineWidth={1} className="space-y-3">
                        {actionProcess[action.id]?.map((process: any, pIdx: number) => (
                            <Timeline.Item key={process?.id ?? pIdx}>
                                <Card shadow="xs" padding="sm" radius="md" withBorder className="bg-gray-50 space-y-3">
                                    <Group className='!flex !justify-between'>
                                        <Badge size='sm' variant="light" color={statusColors[process.status]}>{statusLabels[process.status]}</Badge>
                                        <div className='px-2 py-0.5 bg-yellow-100 border border-yellow-300 rounded-full shadow-xs'>
                                            <Text className="text-yellow-700 text-xs">{formatDateWithDay(process.createdAt)}</Text>
                                        </div>
                                    </Group>
                                    <div className='flex flex-col gap-2'>
                                        <Text className="text-gray-600 text-sm leading-relaxed">{process.description}</Text>
                                        <Group>
                                            {process?.docs?.map((doc: any, dIdx: number) => (
                                                <Badge key={dIdx} size='sm' className='!cursor-pointer' onClick={() => handlePreview(doc)} leftSection={<IconPhoto size={12} />} color="orange" variant="light">
                                                    {doc.name}
                                                </Badge>
                                            ))}
                                        </Group>
                                    </div>
                                </Card>
                            </Timeline.Item>
                        ))}


                    </Timeline>
                </div>}
            </Card>
            )}
        </div>
    );
};

export default Details;
