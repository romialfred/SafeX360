import { Card, Text, Badge, Group, Timeline } from '@mantine/core';
import { IconMapPin, IconClock, IconUser, IconPhoto, IconTarget } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getIncidentDetails } from '../../../services/IncidentService';
import { getActionsByNonConformityId, getCorrectiveActionByActivityId, getCorrectiveActionByIncidentId, getCorrectiveActionByInspectionId } from '../../../services/CorrectiveActionService';
import { formatDateWithDay } from '../../../utility/DateFormats';
import { getAllActionProcessByActionId } from '../../../services/ActionProcessService';
import { mapIdToProcess } from '../../../utility/OtherUtilities';
import { getPgiInfo } from '../../../services/PgiService';
import { getActivityInfo } from '../../../services/HsActivityService';
import { handlePreview } from '../../../utility/DocumentUtility';
import { getInfoByNonConformityId } from '../../../services/NonConformityService';
import SafeHtml from '../../UtilityComp/SafeHtml';
import EmptyState from '../../UtilityComp/EmptyState';
import PageHeader from '../../UtilityComp/PageHeader';
import { caStatusConfig, SERIF } from './correctiveLabels';

const Details = () => {
    const { id, type } = useParams();
    const [incident, setIncident] = useState<any>({});
    const [correctiveActions, setCorrectiveActions] = useState<any>([]);
    const [actionProcess, setActionProcess] = useState<Record<number, any>>({});

    useEffect(() => {
        const getDetails = type == "INCIDENT" ? getIncidentDetails : type == "HS_ACTIVITY" ? getActivityInfo : type == "NON_CONFORMITY" ? getInfoByNonConformityId : getPgiInfo;
        const getActions = type == "INCIDENT" ? getCorrectiveActionByIncidentId : type == "HS_ACTIVITY" ? getCorrectiveActionByActivityId : type == "NON_CONFORMITY" ? getActionsByNonConformityId : getCorrectiveActionByInspectionId;
        getDetails(id).then((res) => {
            setIncident(res);
        }).catch((_err) => { });

        getActions(id).then(async (res) => {
            setCorrectiveActions(res);
            const actionIds = res.map((item: any) => item.id);
            const processes = await Promise.all(
                actionIds.map(async (actionId: any) => ({
                    id: actionId,
                    process: await getAllActionProcessByActionId(actionId)
                }))
            );
            setActionProcess(mapIdToProcess(processes));
        }).catch((_err) => { });
    }, []);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Actions correctives', to: '/corrective' },
                    { label: "Détails de l'action" },
                ]}
                icon={<IconTarget size={22} stroke={2} />}
                iconColor="orange"
                title="Détails de l'action corrective"
                subtitle="Source de l'action, plans associés et historique de progression"
            />

            {/* Source de l'action */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-1">
                <h2 className="text-slate-800" style={{ fontFamily: SERIF, fontSize: '15px', fontWeight: 600 }}>
                    {incident.title}
                </h2>
                {type != "NON_CONFORMITY" && incident.location && (
                    <div className='flex items-center gap-1.5 text-slate-500 text-[12.5px]'>
                        <IconMapPin size={14} aria-hidden="true" />
                        <span>{incident.location}</span>
                    </div>
                )}
            </div>

            <div className='flex gap-2 items-center'>
                <IconClock className="text-slate-500" size={16} aria-hidden="true" />
                <h2 className='text-slate-800' style={{ fontFamily: SERIF, fontSize: '14.5px', fontWeight: 600 }}>
                    Historique des plans d'action
                </h2>
            </div>

            {(!correctiveActions || correctiveActions.length === 0) && (
                <div className="bg-white rounded-xl border border-slate-200">
                    <EmptyState
                        icon={<IconTarget size={22} />}
                        title="Aucun plan d'action"
                        description="Les plans d'action rattachés à cette source apparaîtront ici."
                        compact
                    />
                </div>
            )}

            {correctiveActions?.map((action: any, idx: number) => {
                const statusCfg = caStatusConfig(action.status);
                return (
                    <Card key={action.id ?? idx} shadow="xs" radius="md" withBorder className="bg-white flex flex-col gap-4 p-4">
                        <Group className="mb-1 !flex !justify-between">
                            <h3 className='text-slate-800' style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 600 }}>
                                {action.actionName}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${statusCfg.chip}`}>
                                {statusCfg.label}
                            </span>
                        </Group>

                        <div className='flex gap-3 flex-col bg-slate-50 p-3 rounded-lg mb-1 border border-slate-200'>
                            <SafeHtml html={action.description} className="text-slate-600 text-[12.5px] leading-relaxed" />
                            <Group className="!flex !justify-between">
                                <div className='text-slate-700 bg-white px-2 py-1 rounded-full flex gap-1 items-center border border-slate-200 text-[12px]'>
                                    <IconUser size={14} aria-hidden="true" />
                                    <p>{action.assignedEmployeeName}</p>
                                </div>
                                <div className='text-rose-700 bg-rose-50 px-2 py-1 rounded-full flex gap-1 items-center border border-rose-200 text-[12px]'>
                                    <IconClock size={14} aria-hidden="true" />
                                    <p>Échéance : {formatDateWithDay(action.deadline)}</p>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded border bg-amber-50 text-amber-700 border-amber-200 tabular-nums">
                                    {action.progress}%
                                </span>
                            </Group>
                        </div>

                        {actionProcess[action.id]?.length > 0 && (
                            <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-3">
                                <h4 className="text-slate-800" style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 600 }}>
                                    Chronologie de la progression
                                </h4>

                                <Timeline active={6} bulletSize={20} lineWidth={1} className="space-y-3">
                                    {actionProcess[action.id]?.map((process: any, pIdx: number) => {
                                        const processCfg = caStatusConfig(process.status);
                                        return (
                                            <Timeline.Item key={process?.id ?? pIdx}>
                                                <Card shadow="xs" padding="sm" radius="md" withBorder className="bg-slate-50 space-y-3">
                                                    <Group className='!flex !justify-between'>
                                                        <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${processCfg.chip}`}>
                                                            {processCfg.label}
                                                        </span>
                                                        <div className='px-2 py-0.5 bg-white border border-slate-200 rounded-full'>
                                                            <Text className="text-slate-600 text-xs">{formatDateWithDay(process.createdAt)}</Text>
                                                        </div>
                                                    </Group>
                                                    <div className='flex flex-col gap-2'>
                                                        <Text className="text-slate-600 text-[12.5px] leading-relaxed">{process.description}</Text>
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
                                        );
                                    })}
                                </Timeline>
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
};

export default Details;
