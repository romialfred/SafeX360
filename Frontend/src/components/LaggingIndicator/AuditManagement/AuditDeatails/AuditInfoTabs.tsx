import { Card, Group, Stack, Text, Title, Divider, ThemeIcon, Box } from '@mantine/core';
import {
    IconFlag,
    IconTargetArrow,
    IconChecklist,
    IconTags,
    IconBook2,
    IconZoomCode,
    IconChecks,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { getAllActiveWorkProcess } from '../../../../services/WorkProcessService';
import { mapIdToName } from '../../../../utility/OtherUtilities';

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <Card shadow="md" radius="md" withBorder className="bg-gray-50 mb-4">
        <Group gap="xs" mb={10}>
            <ThemeIcon variant="light" color="blue" radius="xl" size="lg">
                {icon}
            </ThemeIcon>
            <Title order={4}>{title}</Title>
        </Group>
        <Divider mb="sm" />
        {children}
    </Card>
);

const FieldList = ({ data, label }: { data: string[]; label?: string }) => {
    if (!Array.isArray(data)) return null;

    return (
        <Stack gap="xs">
            {label && <Title order={4} className="text-blue-800">{label}</Title>}
            <div className='grid grid-cols-2 gap-2'>

                {data.map((item, index) => (
                    <Text key={index} className="!capitalize flex gap-2 " fw={400} variant="transparent" size="sm">
                        {<IconChecks color='green' size={20} />} {item}
                    </Text>


                ))}
            </div>
        </Stack>
    );
};

const AuditInfoTabs = ({ audit, auditors }: any) => {
    if (!audit) return <Text>Loading...</Text>;
    const [processMap, setProcessMap] = useState<any>({});
    useEffect(() => {
        getAllActiveWorkProcess().then((processes) => {
            setProcessMap(mapIdToName(processes));
        }).catch((_error) => {

        });
    }, []);

    return (
        <Stack className="p-4">
            {/* <SectionCard title="Basic Information" icon={<IconFileDescription size={20} />}>
                <div className='grid grid-cols-4 gap-05'>

                    <Text><b>Ref No:</b> {audit.refNumber}</Text>
                    <Text><b>Title:</b> {audit.title}</Text>
                    <Text><b>Category:</b> <Badge radius="xs" color='red' >{audit.category}</Badge></Text>
                    <Text><b>Status:</b> <Badge color="orange">{audit.status}</Badge></Text>
                </div>
            </SectionCard> */}

            {/* <SectionCard title="Audit Dates" icon={<IconCalendarEvent size={20} />}>
                <Group className='!grid !grid-cols-2 !gap-5'>
                    <Text><b>Start:</b> {formatDateShort(audit.startDate)}</Text>
                    <Text><b>End:</b> {formatDateShort(audit.endDate)}</Text>
                </Group>
            </SectionCard> */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

                <SectionCard title="Objectives" icon={<IconTargetArrow size={20} />}>
                    <div className='grid grid-cols-1 !gap-2'>

                        {audit?.objectives?.map((item: any, index: any) => (
                            <Text key={index} className="!capitalize flex gap-2 " fw={400} variant="transparent" size="sm">
                                {<IconChecks color='green' size={20} />} {item}
                            </Text>


                        ))}
                    </div>
                </SectionCard>
                <SectionCard title="Audit Team" icon={<IconTargetArrow size={20} />}>
                    <div className='grid grid-cols-1 !gap-2'>

                        {auditors?.map((item: any, index: any) => (
                            <Text key={index} className="!capitalize flex gap-2 " fw={400} variant="transparent" size="sm">

                                {<IconChecks color='green' size={20} />} {item.name + " - " + item.role}
                            </Text>


                        ))}
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="Methods" icon={<IconChecklist size={20} />}>
                <FieldList data={audit.methods} />
            </SectionCard>
            <SectionCard title="Method description" icon={<IconFlag size={20} />}>
                <Box dangerouslySetInnerHTML={{ __html: audit.description }} className="prose prose-sm max-w-none" />
            </SectionCard>
            <SectionCard title="References" icon={<IconBook2 size={20} />}>
                <FieldList data={audit.references} />
            </SectionCard>

            <SectionCard title="Processes" icon={<IconTags size={20} />}>
                <div className='grid grid-cols-2 gap-2'>
                    {audit.processes?.map((p: any, i: number) => (
                        <Text key={i} className="!capitalize flex gap-2 " fw={400} variant="transparent" size="sm">
                            {<IconChecks color='green' size={20} />}{processMap[p]?.name || p}
                        </Text>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Audit types" icon={<IconZoomCode size={20} />}>
                <div className='grid grid-cols-2 gap-4'>
                    {Object.entries(audit.auditTypes || {}).map(([key, value]: [string, any]) => (
                        <Box key={key}>
                            <Stack gap="xs">
                                {key && <Title order={6} className="text-blue-800">{key}</Title>}

                                {value.map((item: any, index: any) => (
                                    <Text key={index} className="!capitalize flex gap-2 " fw={400} variant="transparent" size="sm">
                                        {<IconChecks color='green' size={20} />} {item}
                                    </Text>


                                ))}
                            </Stack>
                        </Box>
                    ))}
                </div>
            </SectionCard>


        </Stack>
    );
};
export default AuditInfoTabs;