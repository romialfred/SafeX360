import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Breadcrumbs,
    Card,
    Center,
    Grid,
    Group,
    Loader,
    SimpleGrid,
    Text,
    ThemeIcon,
    Timeline,
    Title,
    ScrollArea,
    Badge,
} from '@mantine/core';
import { DonutChart, BarChart } from '@mantine/charts';
import {
    IconAlertTriangle,
    IconBell,
    IconChartBar,
    IconClock,
    IconMail,
    IconUsers,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { getCommunicationStats, getRecentCommunications } from '../../services/CommunicationService';
import { getAllDepartments } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import { formatDateShort } from '../../utility/DateFormats';
import { useElementSize } from '@mantine/hooks';

type CommunicationTypeCount = { type?: string | null; total?: number | null };
type CommunicationCategoryCount = { category?: string | null; total?: number | null };
type CommunicationDepartmentCount = { departmentId?: number | null; total?: number | null };

type CommunicationStatsResponse = {
    byType?: CommunicationTypeCount[];
    byCategory?: CommunicationCategoryCount[];
    byDepartment?: CommunicationDepartmentCount[];
};

type CommunicationScheduleSummary = {
    id?: number;
    scheduleType?: string | null;
    status?: string | null;
    nextRunAt?: string | null;
};

type RecipientValue = string | string[] | null | undefined;

type CommunicationSummary = {
    id: number | string;
    category?: string | null;
    createdAt?: string | null;
    departmentId?: number | null;
    expiresAt?: string | null;
    recipients?: RecipientValue;
    senderName?: string | null;
    title?: string | null;
    type?: string | null;
    zoneId?: number | null;
    urgency?: string | null;
    schedule?: CommunicationScheduleSummary | null;
};

type DepartmentRecord = {
    id: number;
    name?: string | null;
};

type DepartmentsMap = Record<number, DepartmentRecord>;

const CHART_COLORS = [
    '#4C6EF5',
    '#12B886',
    '#F59F00',
    '#845EF7',
    '#FF6B6B',
    '#1C7ED6',
    '#51CF66',
    '#FCC419',
];

const DEFAULT_STATS: CommunicationStatsResponse = {
    byType: [],
    byCategory: [],
    byDepartment: [],
};

const formatEnumValue = (value?: string | null) => {
    if (!value) return '-';
    return value
        .toString()
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const formatCount = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '--';
    }
    return value.toLocaleString();
};

const calculateShare = (part?: number | null, total?: number | null) => {
    if (!part || !total || total <= 0) {
        return null;
    }
    return Math.round((part / total) * 100);
};

const resolveRecipientCount = (recipients: RecipientValue): number => {
    if (!recipients) return 0;
    if (Array.isArray(recipients)) return recipients.length;
    if (typeof recipients === 'string') {
        return recipients
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean).length;
    }
    return 0;
};

const getScheduleBadgeColor = (status?: string | null) => {
    const normalized = (status ?? '').toUpperCase();
    switch (normalized) {
        case 'ACTIVE':
            return 'green';
        case 'PAUSED':
        case 'PENDING':
            return 'orange';
        case 'CANCELLED':
        case 'CANCELED':
        case 'FAILED':
            return 'red';
        default:
            return 'gray';
    }
};

const getCategoryColor = (category?: string | null) => {
    switch ((category ?? '').toLowerCase()) {
        case 'safety':
            return 'red';
        case 'operations':
            return 'blue';
        case 'training':
            return 'green';
        case 'administrative':
            return 'gray';
        case 'emergency':
            return 'orange';
        default:
            return 'gray';
    }
};

const CommunicationDashboard = () => {
    const [stats, setStats] = useState<CommunicationStatsResponse>(DEFAULT_STATS);
    const [recentCommunications, setRecentCommunications] = useState<CommunicationSummary[]>([]);
    const [departmentMap, setDepartmentMap] = useState<DepartmentsMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {
        ref: departmentChartRef,
        height: departmentChartHeight,
        width: departmentChartWidth,
    } = useElementSize();

    useEffect(() => {
        let ignore = false;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [statsResponse, recentResponse, departmentsResponse] = await Promise.all([
                    getCommunicationStats(),
                    getRecentCommunications(5),
                    getAllDepartments(),
                ]);

                if (ignore) return;

                const statsPayload: CommunicationStatsResponse = statsResponse ?? DEFAULT_STATS;
                setStats({
                    byType: Array.isArray(statsPayload.byType) ? statsPayload.byType : [],
                    byCategory: Array.isArray(statsPayload.byCategory) ? statsPayload.byCategory : [],
                    byDepartment: Array.isArray(statsPayload.byDepartment) ? statsPayload.byDepartment : [],
                });

                setRecentCommunications(Array.isArray(recentResponse) ? recentResponse : []);

                const departmentsList = (Array.isArray(departmentsResponse) ? departmentsResponse : []) as DepartmentRecord[];
                setDepartmentMap(mapIdToName(departmentsList) as DepartmentsMap);
            } catch (_err) {
                if (!ignore) {
                    setError('Unable to load communication dashboard data at the moment.');
                    setStats(DEFAULT_STATS);
                    setRecentCommunications([]);
                    setDepartmentMap({});
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            ignore = true;
        };
    }, []);

    const sortedByType = useMemo(
        () => [...(stats.byType ?? [])].sort((a, b) => (b.total ?? 0) - (a.total ?? 0)),
        [stats.byType],
    );

    const sortedByCategory = useMemo(
        () => [...(stats.byCategory ?? [])].sort((a, b) => (b.total ?? 0) - (a.total ?? 0)),
        [stats.byCategory],
    );

    const sortedByDepartment = useMemo(
        () => [...(stats.byDepartment ?? [])].sort((a, b) => (b.total ?? 0) - (a.total ?? 0)),
        [stats.byDepartment],
    );

    const totalByType = useMemo(
        () => sortedByType.reduce((acc, item) => acc + (item.total ?? 0), 0),
        [sortedByType],
    );

    const totalByDepartment = useMemo(
        () => sortedByDepartment.reduce((acc, item) => acc + (item.total ?? 0), 0),
        [sortedByDepartment],
    );

    const topType = sortedByType[0];
    const topCategory = sortedByCategory[0];
    const topDepartment = sortedByDepartment[0];

    const typeChartData = useMemo(
        () => sortedByType.map((item, index) => ({
            name: formatEnumValue(item.type),
            value: item.total ?? 0,
            color: CHART_COLORS[index % CHART_COLORS.length],
        })),
        [sortedByType],
    );

    const categoryChartData = useMemo(
        () => sortedByCategory.map((item, index) => ({
            name: formatEnumValue(item.category),
            total: item.total ?? 0,
            color: CHART_COLORS[index % CHART_COLORS.length],
        })),
        [sortedByCategory],
    );

    const resolveDepartmentName = useCallback((id?: number | null) => {
        if (id === null || typeof id === 'undefined') return 'Unassigned';
        return departmentMap[id]?.name || `Department ${id}`;
    }, [departmentMap]);

    const departmentDonutData = useMemo(
        () => sortedByDepartment.map((item, index) => ({
            name: resolveDepartmentName(item.departmentId),
            value: item.total ?? 0,
            color: CHART_COLORS[index % CHART_COLORS.length],
        })),
        [sortedByDepartment, resolveDepartmentName],
    );

    const departmentDonutSize = useMemo(() => {
        const effectiveHeight = departmentChartHeight || 0;
        const effectiveWidth = departmentChartWidth || 0;
        const limitingDimension = Math.min(effectiveHeight, effectiveWidth);

        if (limitingDimension > 0) {
            const rawSize = limitingDimension - 48; // account for padding around the chart
            const clamped = Math.max(200, Math.min(rawSize, 360));
            return clamped;
        }
        return 240;
    }, [departmentChartHeight, departmentChartWidth]);

    const departmentDonutThickness = useMemo(() => {
        return Math.max(40, Math.min(Math.round(departmentDonutSize * 0.22), 64));
    }, [departmentDonutSize]);

    const timelineItems = useMemo(
        () => [...recentCommunications]
            .sort((a, b) => {
                const first = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const second = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return second - first;
            })
            .slice(0, 5),
        [recentCommunications],
    );

    const topTypeShare = calculateShare(topType?.total ?? null, totalByType);
    const topDepartmentShare = calculateShare(topDepartment?.total ?? null, totalByDepartment);

    const metricCards = useMemo(
        () => [
            {
                label: 'Total Communications',
                primary: loading ? '--' : formatCount(totalByType),
                secondary: 'Records',
                icon: IconMail,
                iconColor: 'blue',
                background: 'linear-gradient(135deg, rgba(76,110,245,0.18) 0%, rgba(37,201,173,0.05) 100%)',
            },
            {
                label: 'Top Type',
                primary: loading ? '--' : formatEnumValue(topType?.type),
                secondary: loading ? 'Calculating most common channel' : topType ? `${formatCount(topType.total)} communications${topTypeShare ? ` • ${topTypeShare}%` : ''}` : 'Awaiting statistics',
                icon: IconBell,
                iconColor: 'orange',
                background: 'linear-gradient(135deg, rgba(255,146,43,0.18) 0%, rgba(253,203,110,0.08) 100%)',
            },
            {
                label: 'Top Category',
                primary: loading ? '--' : formatEnumValue(topCategory?.category),
                secondary: loading ? 'Crunching category mix' : topCategory ? `${formatCount(topCategory.total)} communications` : 'Awaiting statistics',
                icon: IconChartBar,
                iconColor: 'teal',
                background: 'linear-gradient(135deg, rgba(18,184,134,0.18) 0%, rgba(111,197,169,0.08) 100%)',
            },
            {
                label: 'Top Department',
                primary: loading ? '--' : resolveDepartmentName(topDepartment?.departmentId),
                secondary: loading ? 'Highlighting departments' : topDepartment ? `${formatCount(topDepartment.total)} communications${topDepartmentShare ? ` • ${topDepartmentShare}% share` : ''}` : 'Awaiting statistics',
                icon: IconUsers,
                iconColor: 'grape',
                background: 'linear-gradient(135deg, rgba(132,94,247,0.18) 0%, rgba(232,201,255,0.1) 100%)',
            },
        ],
        [loading, totalByType, topType, topTypeShare, topCategory, topDepartment, topDepartmentShare, resolveDepartmentName],
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">Communication Management Dashboard</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Text variant="gradient">Communication Management Dashboard</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <p className="italic text-gray-600">Real-time insights into communication reach, engagement patterns, and distribution.</p>

            {error && (
                <Card shadow="sm" padding="sm" radius="md" withBorder>
                    <Text size="sm" c="red">{error}</Text>
                </Card>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                {metricCards.map((metric) => {
                    // const Icon = metric.icon;
                    return (
                        <Card
                            key={metric.label}
                            shadow="sm"
                            padding="lg"
                            radius="lg"
                            withBorder
                            className="relative overflow-hidden"
                            style={{ borderColor: 'var(--mantine-color-gray-3)' }}
                        >
                            <Box className="absolute inset-0 pointer-events-none" style={{ background: metric.background }} />
                            <Group justify="space-between" align="flex-start" className="relative z-10">
                                <Box>
                                    <Text size="xs" fw={600} c="dimmed" className="uppercase tracking-wide">
                                        {metric.label}
                                    </Text>
                                    <Text fw={700} style={{ fontSize: '1rem', lineHeight: 1.1 }} mt={6}>
                                        {metric.primary}
                                    </Text>
                                    <Text size="sm" c="dimmed" mt={8}>
                                        {metric.secondary}
                                    </Text>
                                </Box>
                                {/* <ThemeIcon radius="xl" size={44} color={metric.iconColor} variant="light">
                                    <Icon size={22} />
                                </ThemeIcon> */}
                            </Group>
                        </Card>
                    );
                })}
            </SimpleGrid>

            <Grid gutter="xl" align="stretch">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ height: '100%' }}>
                        <Group justify="space-between" mb="lg">
                            <Title order={3}>Communications by Type</Title>
                            <Text size="sm" c="dimmed">
                                {loading
                                    ? 'Loading distribution...'
                                    : typeChartData.length
                                        ? `${typeChartData.length} channel${typeChartData.length > 1 ? 's' : ''} tracked`
                                        : 'No data available'}
                            </Text>
                        </Group>
                        <Grid align="center" justify='center'>
                            <Grid.Col span={{ base: 12, sm: 7 }}>
                                <Box h={260} className="flex items-center justify-center">
                                    {loading ? (
                                        <Center h="100%">
                                            <Loader color="blue" />
                                        </Center>
                                    ) : typeChartData.length ? (
                                        <DonutChart
                                            data={typeChartData}
                                            size={220}
                                            thickness={42}
                                            withTooltip
                                            paddingAngle={3}
                                            strokeWidth={2}
                                            chartLabel={totalByType ? formatCount(totalByType) : '0'}
                                            valueFormatter={(value) => formatCount(value)}
                                            pieProps={{ cornerRadius: 8 }}
                                        />
                                    ) : (
                                        <Center h="100%">
                                            <Text c="dimmed">No type data available.</Text>
                                        </Center>
                                    )}
                                </Box>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 5 }}>
                                <Group gap="sm" wrap="wrap">
                                    {typeChartData.map((item) => (
                                        <Card
                                            key={item.name}
                                            padding="xs"
                                            radius="md"
                                            withBorder
                                            className="flex items-center !flex-row gap-3"
                                            style={{ borderColor: 'var(--mantine-color-gray-3)' }}
                                        >
                                            <Box
                                                w={10}
                                                h={10}
                                                style={{ backgroundColor: item.color }}
                                                className="rounded-full"
                                            />
                                            <Box className='!flex-row'>
                                                <Text size="xs" fw={600}>{item.name}</Text>
                                                <Text size="xs" c="dimmed">{formatCount(item.value)}</Text>
                                            </Box>
                                        </Card>
                                    ))}
                                </Group>
                            </Grid.Col>
                        </Grid>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ height: '100%' }}>
                        <Group justify="space-between" mb="lg">
                            <Title order={3}>Communications by Category</Title>
                            <Text size="sm" c="dimmed">
                                {loading
                                    ? 'Loading breakdown...'
                                    : categoryChartData.length
                                        ? 'Category split of recent communications'
                                        : 'No data available'}
                            </Text>
                        </Group>
                        <Box h={280}>
                            {loading ? (
                                <Center h="100%">
                                    <Loader color="blue" />
                                </Center>
                            ) : categoryChartData.length ? (
                                <BarChart
                                    h={260}
                                    data={categoryChartData}
                                    dataKey="name"
                                    series={[{ name: 'total', color: CHART_COLORS[0], label: 'Communications' }]}
                                    withTooltip
                                    // withLegend
                                    legendProps={{ verticalAlign: 'bottom', height: 36 }}
                                    gridAxis="y"
                                    strokeDasharray="3 3"
                                    maxBarWidth={28}
                                    barProps={{ radius: [8, 8, 0, 0] }}
                                    valueFormatter={(value) => `${formatCount(value)}`}
                                />
                            ) : (
                                <Center h="100%">
                                    <Text c="dimmed">No category data available.</Text>
                                </Center>
                            )}
                        </Box>
                    </Card>
                </Grid.Col>
            </Grid>

            <Grid gutter="xl" align="stretch">
                <Grid.Col span={{ base: 12, lg: 6 }}>
                    <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ height: '100%' }}>
                        <Group justify="space-between" mb="md">
                            <Title order={4}>Department Distribution</Title>
                            {!loading && topDepartmentShare && (
                                <Text size="sm" c="dimmed">Top share: {topDepartmentShare}%</Text>
                            )}
                        </Group>
                        <Grid align="stretch">
                            <Grid.Col span={{ base: 12, sm: 7 }} className="flex">
                                <Box
                                    ref={departmentChartRef}
                                    className="flex items-center justify-center h-full w-full"
                                    style={{ minHeight: 260 }}
                                >
                                    {loading ? (
                                        <Center h="100%">
                                            <Loader color="blue" />
                                        </Center>
                                    ) : departmentDonutData.length ? (
                                        <DonutChart
                                            data={departmentDonutData}
                                            size={departmentDonutSize}
                                            thickness={departmentDonutThickness}
                                            withTooltip
                                            paddingAngle={2}
                                            strokeWidth={2}
                                            chartLabel={totalByDepartment ? formatCount(totalByDepartment) : '0'}
                                            valueFormatter={(value) => formatCount(value)}
                                            pieProps={{ cornerRadius: 8 }}
                                        />
                                    ) : (
                                        <Center h="100%">
                                            <Text c="dimmed">No department data available.</Text>
                                        </Center>
                                    )}
                                </Box>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 5 }} className="flex">
                                <Group gap="sm" wrap="wrap" align="stretch" className="my-auto">
                                    {departmentDonutData.map((item) => (
                                        <Card
                                            key={item.name}
                                            padding="xs"
                                            radius="md"
                                            withBorder
                                            className="flex !flex-row items-center gap-3"
                                            style={{ borderColor: 'var(--mantine-color-gray-3)' }}
                                        >
                                            <Box
                                                w={10}
                                                h={10}
                                                style={{ backgroundColor: item.color }}
                                                className="rounded-full"
                                            />
                                            <Box>
                                                <Text size="xs" fw={600}>{item.name}</Text>
                                                <Text size="xs" c="dimmed">{formatCount(item.value)}</Text>
                                            </Box>
                                        </Card>
                                    ))}
                                </Group>
                            </Grid.Col>
                        </Grid>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 6 }}>
                    <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ height: '100%' }}>
                        <Group justify="space-between" mb="md">
                            <Title order={4}>Recent Communications</Title>
                            <Text size="sm" c="dimmed">
                                {loading
                                    ? 'Fetching latest records...'
                                    : timelineItems.length
                                        ? 'Most recent five entries'
                                        : 'No recent communications'}
                            </Text>
                        </Group>
                        <ScrollArea h={300} >
                            {loading ? (
                                <Center py="xl">
                                    <Loader color="blue" />
                                </Center>
                            ) : (
                                <Timeline bulletSize={18} p="md" lineWidth={2} radius="lg" color="blue">
                                    {timelineItems.length ? (
                                        timelineItems.map((comm) => {
                                            const urgency = (comm.urgency ?? '').toUpperCase();
                                            const isUrgent = ['URGENT', 'HIGH', 'CRITICAL'].includes(urgency);
                                            const scheduleStatus = comm.schedule?.status;
                                            const recipientsTotal = resolveRecipientCount(comm.recipients);
                                            const departmentName = resolveDepartmentName(comm.departmentId);
                                            const BulletIcon = isUrgent ? IconAlertTriangle : IconMail;
                                            const bulletColor = isUrgent ? 'red' : 'blue';

                                            return (
                                                <Timeline.Item
                                                    key={comm.id}
                                                    title={comm.title || 'Untitled Communication'}
                                                    bullet={(
                                                        <ThemeIcon radius="xl" size={26} color={bulletColor} variant={isUrgent ? 'filled' : 'light'}>
                                                            <BulletIcon size={16} />
                                                        </ThemeIcon>
                                                    )}
                                                >
                                                    <Group justify="space-between" align="flex-start" mb="xs" wrap="wrap">
                                                        <Group gap="xs" wrap="wrap">
                                                            {comm.category && (
                                                                <Badge color={getCategoryColor(comm.category)} variant="light" size="sm">
                                                                    {formatEnumValue(comm.category)}
                                                                </Badge>
                                                            )}
                                                            {isUrgent && (
                                                                <Badge color="red" variant="filled" size="sm">
                                                                    Urgent
                                                                </Badge>
                                                            )}
                                                            {scheduleStatus && (
                                                                <Badge color={getScheduleBadgeColor(scheduleStatus)} variant="light" size="sm">
                                                                    {formatEnumValue(scheduleStatus)}
                                                                </Badge>
                                                            )}
                                                            {comm.schedule?.scheduleType && (
                                                                <Badge color="blue" variant="outline" size="sm">
                                                                    {formatEnumValue(comm.schedule.scheduleType)}
                                                                </Badge>
                                                            )}
                                                            <Badge color="gray" variant="light" size="sm">
                                                                {departmentName}
                                                            </Badge>
                                                        </Group>
                                                        <Text size="xs" c="dimmed">{comm.createdAt ? formatDateShort(comm.createdAt) : '-'}</Text>
                                                    </Group>
                                                    <Text size="sm" c="dimmed" mb="xs">
                                                        {formatEnumValue(comm.type)} • {recipientsTotal} {recipientsTotal === 1 ? 'recipient' : 'recipients'}
                                                    </Text>
                                                    {comm.schedule?.nextRunAt && (
                                                        <Group gap="xs" mb="xs">
                                                            <ThemeIcon size={20} radius="xl" color="blue" variant="light">
                                                                <IconClock size={14} />
                                                            </ThemeIcon>
                                                            <Text size="xs" c="dimmed">
                                                                Next run: {formatDateShort(comm.schedule.nextRunAt)}
                                                            </Text>
                                                        </Group>
                                                    )}
                                                    {comm.expiresAt && (
                                                        <Text size="xs" c="dimmed" mb="xs">
                                                            Expires: {formatDateShort(comm.expiresAt)}
                                                        </Text>
                                                    )}
                                                    {comm.senderName && (
                                                        <Text size="xs" c="dimmed">
                                                            Sender: {comm.senderName}
                                                        </Text>
                                                    )}
                                                </Timeline.Item>
                                            );
                                        })
                                    ) : (
                                        <Timeline.Item title="No recent communications">
                                            <Text size="sm" c="dimmed">No communications records were returned.</Text>
                                        </Timeline.Item>
                                    )}
                                </Timeline>
                            )}
                        </ScrollArea>
                    </Card>
                </Grid.Col>
            </Grid>
        </div>
    );
};

export default CommunicationDashboard;
