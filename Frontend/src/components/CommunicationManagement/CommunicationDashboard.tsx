import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Box, Center, Loader, ScrollArea, ThemeIcon, Timeline } from '@mantine/core';
import { DonutChart, BarChart } from '@mantine/charts';
import {
    IconAlertTriangle,
    IconBell,
    IconChartBar,
    IconClock,
    IconMail,
    IconMessageCircle,
    IconUsers,
} from '@tabler/icons-react';
import { useElementSize } from '@mantine/hooks';
import PageHeader from '../UtilityComp/PageHeader';
import KpiTile from '../UtilityComp/KpiTile';
import ErrorBanner from '../UtilityComp/ErrorBanner';
import EmptyState from '../UtilityComp/EmptyState';
import { getCommunicationStats, getRecentCommunications } from '../../services/CommunicationService';
import { getAllDepartments } from '../../services/HrmsService';
import { mapIdToName } from '../../utility/OtherUtilities';
import {
    categoryLabel,
    commStatusConfig,
    formatDateFr,
    isUrgentValue,
    parseRecipientIds,
    scheduleTypeLabel,
    typeLabel,
} from './communicationLabels';

/**
 * Tableau de bord Communication HSE : volumes par canal, par catégorie et par
 * département, et fil des dernières communications diffusées.
 */

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

type CommunicationSummary = {
    id: number | string;
    category?: string | null;
    createdAt?: string | null;
    departmentId?: number | null;
    expiresAt?: string | null;
    recipients?: string | string[] | null;
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

const formatCount = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '—';
    }
    return value.toLocaleString('fr-FR');
};

const calculateShare = (part?: number | null, total?: number | null) => {
    if (!part || !total || total <= 0) {
        return null;
    }
    return Math.round((part / total) * 100);
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3
        className="text-slate-800"
        style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: '14.5px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
        }}
    >
        {children}
    </h3>
);

const CommunicationDashboard = () => {
    const { t } = useTranslation('communications');
    // Libellés bilingues : clés i18n `communications:*`, repli sur les libellés FR centralisés.
    const tType = (code?: string | null) => t(`type.${code ?? ''}`, { defaultValue: typeLabel(code) });
    const tCategory = (code?: string | null) => t(`category.${code ?? ''}`, { defaultValue: categoryLabel(code) });
    const tScheduleType = (code?: string | null) =>
        t(`scheduleType.${(code ?? '').toUpperCase()}`, { defaultValue: scheduleTypeLabel(code) });
    const tCommStatus = (status?: string | null) =>
        t(`commStatus.${(status ?? '').toUpperCase()}`, { defaultValue: commStatusConfig(status).label });
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
                    setError(t('dashboard.loadErrorMessage'));
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
            name: tType(item.type),
            value: item.total ?? 0,
            color: CHART_COLORS[index % CHART_COLORS.length],
        })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sortedByType, t],
    );

    const categoryChartData = useMemo(
        () => sortedByCategory.map((item, index) => ({
            name: tCategory(item.category),
            total: item.total ?? 0,
            color: CHART_COLORS[index % CHART_COLORS.length],
        })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sortedByCategory, t],
    );

    const resolveDepartmentName = useCallback((id?: number | null) => {
        if (id === null || typeof id === 'undefined') return t('dashboard.unassignedDepartment');
        return departmentMap[id]?.name || t('dashboard.departmentFallback', { id });
    }, [departmentMap, t]);

    const departmentDonutData = useMemo(
        () => sortedByDepartment.map((item, index) => ({
            name: resolveDepartmentName(item.departmentId),
            value: item.total ?? 0,
            color: CHART_COLORS[index % CHART_COLORS.length],
        })),
        [sortedByDepartment, resolveDepartmentName],
    );

    const departmentDonutSize = useMemo(() => {
        const limitingDimension = Math.min(departmentChartHeight || 0, departmentChartWidth || 0);
        if (limitingDimension > 0) {
            return Math.max(200, Math.min(limitingDimension - 48, 360));
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

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('breadcrumbs.home'), to: '/' },
                    { label: t('breadcrumbs.module') },
                    { label: t('breadcrumbs.dashboard') },
                ]}
                icon={<IconMessageCircle size={22} stroke={2} />}
                iconColor="pink"
                title={t('dashboard.title')}
                subtitle={t('dashboard.subtitle')}
            />

            {error && (
                <ErrorBanner tone="error" title={t('dashboard.loadErrorTitle')}>
                    {error}
                </ErrorBanner>
            )}

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label={t('dashboard.kpiTotal')}
                    value={loading ? '…' : formatCount(totalByType)}
                    tone="slate"
                    icon={<IconMail size={14} stroke={1.8} />}
                    referenceValue={t('dashboard.kpiTotalReference')}
                />
                <KpiTile
                    label={t('dashboard.kpiMainChannel')}
                    value={loading ? '…' : topType ? tType(topType.type) : '—'}
                    tone="blue"
                    icon={<IconBell size={14} stroke={1.8} />}
                    referenceValue={
                        loading
                            ? undefined
                            : topType
                                ? `${t('dashboard.kpiMainChannelSend', { count: topType.total ?? 0 })}${topTypeShare ? t('dashboard.kpiShareSuffix', { share: topTypeShare }) : ''}`
                                : t('dashboard.kpiAwaitingStats')
                    }
                />
                <KpiTile
                    label={t('dashboard.kpiMainCategory')}
                    value={loading ? '…' : topCategory ? tCategory(topCategory.category) : '—'}
                    tone="teal"
                    icon={<IconChartBar size={14} stroke={1.8} />}
                    referenceValue={
                        loading
                            ? undefined
                            : topCategory
                                ? t('dashboard.kpiCommunication', { count: topCategory.total ?? 0 })
                                : t('dashboard.kpiAwaitingStats')
                    }
                />
                <KpiTile
                    label={t('dashboard.kpiMostActiveDepartment')}
                    value={loading ? '…' : topDepartment ? resolveDepartmentName(topDepartment.departmentId) : '—'}
                    tone="violet"
                    icon={<IconUsers size={14} stroke={1.8} />}
                    referenceValue={
                        loading
                            ? undefined
                            : topDepartment
                                ? `${t('dashboard.kpiCommunication', { count: topDepartment.total ?? 0 })}${topDepartmentShare ? t('dashboard.kpiVolumeShareSuffix', { share: topDepartmentShare }) : ''}`
                                : t('dashboard.kpiAwaitingStats')
                    }
                />
            </div>

            {/* Répartitions par canal et par catégorie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>{t('dashboard.byChannelTitle')}</SectionTitle>
                        <span className="text-[11.5px] text-slate-500">
                            {loading
                                ? t('dashboard.loading')
                                : typeChartData.length
                                    ? t('dashboard.channelsTracked', { count: typeChartData.length })
                                    : t('dashboard.noData')}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-7">
                            <Box h={250} className="flex items-center justify-center">
                                {loading ? (
                                    <Center h="100%">
                                        <Loader color="teal" size="sm" />
                                    </Center>
                                ) : typeChartData.length ? (
                                    <DonutChart
                                        data={typeChartData}
                                        size={210}
                                        thickness={40}
                                        withTooltip
                                        paddingAngle={3}
                                        strokeWidth={2}
                                        chartLabel={totalByType ? formatCount(totalByType) : '0'}
                                        valueFormatter={(value) => formatCount(value)}
                                        pieProps={{ cornerRadius: 6 }}
                                    />
                                ) : (
                                    <EmptyState
                                        icon={<IconChartBar size={20} />}
                                        title={t('dashboard.emptyChannelTitle')}
                                        description={t('dashboard.emptyChannelDescription')}
                                        compact
                                    />
                                )}
                            </Box>
                        </div>
                        <div className="sm:col-span-5">
                            <div className="flex flex-col gap-1.5">
                                {typeChartData.map((item) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: item.color }}
                                                aria-hidden="true"
                                            />
                                            <span className="text-[12px] text-slate-700 truncate">{item.name}</span>
                                        </div>
                                        <span className="text-[12px] text-slate-500 tabular-nums">{formatCount(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>{t('dashboard.byCategoryTitle')}</SectionTitle>
                        <span className="text-[11.5px] text-slate-500">
                            {loading
                                ? t('dashboard.loading')
                                : categoryChartData.length
                                    ? t('dashboard.categoryDistribution')
                                    : t('dashboard.noData')}
                        </span>
                    </div>
                    <Box h={260}>
                        {loading ? (
                            <Center h="100%">
                                <Loader color="teal" size="sm" />
                            </Center>
                        ) : categoryChartData.length ? (
                            <BarChart
                                h={250}
                                data={categoryChartData}
                                dataKey="name"
                                series={[{ name: 'total', color: CHART_COLORS[0], label: t('dashboard.communicationsSeriesLabel') }]}
                                withTooltip
                                gridAxis="y"
                                strokeDasharray="3 3"
                                maxBarWidth={28}
                                barProps={{ radius: [6, 6, 0, 0] }}
                                valueFormatter={(value) => formatCount(value)}
                            />
                        ) : (
                            <EmptyState
                                icon={<IconChartBar size={20} />}
                                title={t('dashboard.emptyCategoryTitle')}
                                description={t('dashboard.emptyCategoryDescription')}
                                compact
                            />
                        )}
                    </Box>
                </div>
            </div>

            {/* Répartition par département + fil récent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>{t('dashboard.byDepartmentTitle')}</SectionTitle>
                        <span className="text-[11.5px] text-slate-500">
                            {loading
                                ? t('dashboard.loading')
                                : topDepartmentShare
                                    ? t('dashboard.mainShare', { share: topDepartmentShare })
                                    : '—'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-7">
                            <Box
                                ref={departmentChartRef}
                                className="flex items-center justify-center w-full"
                                style={{ minHeight: 250 }}
                            >
                                {loading ? (
                                    <Center h="100%">
                                        <Loader color="teal" size="sm" />
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
                                        pieProps={{ cornerRadius: 6 }}
                                    />
                                ) : (
                                    <EmptyState
                                        icon={<IconUsers size={20} />}
                                        title={t('dashboard.emptyDepartmentTitle')}
                                        description={t('dashboard.emptyDepartmentDescription')}
                                        compact
                                    />
                                )}
                            </Box>
                        </div>
                        <div className="sm:col-span-5">
                            <div className="flex flex-col gap-1.5">
                                {departmentDonutData.map((item) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: item.color }}
                                                aria-hidden="true"
                                            />
                                            <span className="text-[12px] text-slate-700 truncate">{item.name}</span>
                                        </div>
                                        <span className="text-[12px] text-slate-500 tabular-nums">{formatCount(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>{t('dashboard.recentTitle')}</SectionTitle>
                        <span className="text-[11.5px] text-slate-500">
                            {loading
                                ? t('dashboard.loading')
                                : timelineItems.length
                                    ? t('dashboard.recentFiveEntries')
                                    : t('dashboard.noRecentCommunication')}
                        </span>
                    </div>
                    <ScrollArea h={300}>
                        {loading ? (
                            <Center py="xl">
                                <Loader color="teal" size="sm" />
                            </Center>
                        ) : timelineItems.length ? (
                            <Timeline bulletSize={22} lineWidth={2} color="teal" className="px-2 pt-1">
                                {timelineItems.map((comm) => {
                                    const urgent = isUrgentValue(comm.urgency);
                                    const scheduleStatus = comm.schedule?.status;
                                    const statusCfg = scheduleStatus ? commStatusConfig(scheduleStatus) : null;
                                    const statusLabel = scheduleStatus ? tCommStatus(scheduleStatus) : null;
                                    const recipientsTotal = parseRecipientIds(comm.recipients).length;
                                    const departmentName = resolveDepartmentName(comm.departmentId);
                                    const BulletIcon = urgent ? IconAlertTriangle : IconMail;

                                    return (
                                        <Timeline.Item
                                            key={comm.id}
                                            title={
                                                <span className="text-[13px] text-slate-800">
                                                    {comm.title || t('dashboard.untitledCommunication')}
                                                </span>
                                            }
                                            bullet={(
                                                <ThemeIcon
                                                    radius="xl"
                                                    size={22}
                                                    color={urgent ? 'red' : 'teal'}
                                                    variant={urgent ? 'filled' : 'light'}
                                                >
                                                    <BulletIcon size={13} />
                                                </ThemeIcon>
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {comm.category && (
                                                        <Badge color="gray" variant="light" size="xs" radius="sm">
                                                            {tCategory(comm.category)}
                                                        </Badge>
                                                    )}
                                                    {urgent && (
                                                        <span className="inline-flex items-center rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-rose-700">
                                                            {t('dashboard.badgeUrgent')}
                                                        </span>
                                                    )}
                                                    {statusCfg && (
                                                        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${statusCfg.chip}`}>
                                                            {statusLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-slate-500 flex-shrink-0">
                                                    {comm.createdAt ? formatDateFr(comm.createdAt) : '—'}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-slate-600">
                                                {tType(comm.type)} · {t('dashboard.recipients', { count: recipientsTotal })} · {departmentName}
                                            </p>
                                            {comm.schedule?.scheduleType && (
                                                <p className="text-[11.5px] text-slate-500 mt-0.5">
                                                    {t('dashboard.schedulePrefix', { value: tScheduleType(comm.schedule.scheduleType) })}
                                                </p>
                                            )}
                                            {comm.schedule?.nextRunAt && (
                                                <p className="text-[11.5px] text-slate-500 mt-0.5 inline-flex items-center gap-1">
                                                    <IconClock size={12} aria-hidden="true" />
                                                    {t('dashboard.nextRun', { date: formatDateFr(comm.schedule.nextRunAt) })}
                                                </p>
                                            )}
                                            {comm.expiresAt && (
                                                <p className="text-[11.5px] text-slate-500 mt-0.5">
                                                    {t('dashboard.deadline', { date: formatDateFr(comm.expiresAt) })}
                                                </p>
                                            )}
                                            {comm.senderName && (
                                                <p className="text-[11.5px] text-slate-500 mt-0.5">
                                                    {t('dashboard.sender', { name: comm.senderName })}
                                                </p>
                                            )}
                                        </Timeline.Item>
                                    );
                                })}
                            </Timeline>
                        ) : (
                            <EmptyState
                                icon={<IconMessageCircle size={20} />}
                                title={t('dashboard.emptyRecentTitle')}
                                description={t('dashboard.emptyRecentDescription')}
                                compact
                            />
                        )}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};

export default CommunicationDashboard;
