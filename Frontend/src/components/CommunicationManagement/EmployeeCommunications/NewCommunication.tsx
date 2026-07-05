import { useState, useMemo, useEffect } from 'react';
import {
    Avatar,
    Badge,
    Button,
    Chip,
    NumberInput,
    ScrollArea,
    Select,
    Switch,
    TextInput,
    Timeline,
} from '@mantine/core';
import { DateTimePicker, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
    IconCalendarTime,
    IconFileDescription,
    IconMessageCircle,
    IconPaperclip,
    IconSearch,
    IconSend,
    IconUser,
    IconUsers,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../UtilityComp/PageHeader';
import TextEditor from '../../UtilityComp/TextEditor';
import FileUpdateDropzone from '../../UtilityComp/FileUpdateDropzone';
import { getAllDepartments, getEmployeesWithPosition } from '../../../services/HrmsService';
import { GetAllWorkArea } from '../../../services/WorkAreaService';
import { mapIdToName, isValidRichText } from '../../../utility/OtherUtilities';
import { createCommunication, getRecentCommunications } from '../../../services/CommunicationService';
import { convertFilesToBase64New } from '../../../utility/DocumentUtility';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import {
    CATEGORY_COLORS,
    CATEGORY_OPTIONS,
    SCHEDULE_TYPE_OPTIONS,
    TYPE_OPTIONS,
    WEEKLY_DAY_OPTIONS,
    categoryLabel,
    formatDateFr,
    isUrgentValue,
    normalizeTimeOfDay,
    parseRecipientIds,
    toLocalDateTime,
    typeLabel,
} from '../communicationLabels';

/**
 * Création d'une communication HSE : identification, contenu, destinataires,
 * planification et pièces jointes. Les diffusions récentes sont rappelées en
 * aparté pour garder une vue du rythme de communication.
 */

const selectPrimaryDate = (communication: any): string | null => {
    const candidates = [
        communication?.createdAt,
        communication?.date,
        communication?.updatedAt,
        communication?.scheduledAt,
        communication?.schedule?.nextRunAt,
        communication?.expiresAt,
    ];

    for (const candidate of candidates) {
        if (candidate) return candidate;
    }
    return null;
};

const getSortTimestamp = (communication: any): number => {
    const rawDate = selectPrimaryDate(communication);
    if (!rawDate) return 0;
    const timestamp = new Date(rawDate).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getRecipientCount = (communication: any): number => {
    const candidates = [
        communication?.recipientCount,
        communication?.totalRecipients,
        communication?.recipientTotal,
        communication?.recipients,
        communication?.recipientIds,
        communication?.recipientList,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) return candidate;
        const count = parseRecipientIds(candidate).length;
        if (count > 0) return count;
    }
    return 0;
};

const SectionCard = ({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) => (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100">
            <span className="inline-flex p-1.5 rounded-md bg-teal-50 text-teal-700">{icon}</span>
            <div>
                <h3
                    className="text-slate-800"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </h3>
                <p className="text-[11.5px] text-slate-500">{subtitle}</p>
            </div>
        </div>
        <div className="flex flex-col gap-3">{children}</div>
    </section>
);

const NewCommunication = () => {
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [recentCommunications, setRecentCommunications] = useState<any[]>([]);
    const [recentLoading, setRecentLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation('communications');
    // Libellés bilingues : clés i18n `communications:*`, repli sur les libellés FR centralisés.
    const tType = (code?: string | null) => t(`type.${code ?? ''}`, { defaultValue: typeLabel(code) });
    const tCategory = (code?: string | null) => t(`category.${code ?? ''}`, { defaultValue: categoryLabel(code) });

    const form = useForm({
        initialValues: {
            type: '',
            title: '',
            content: '',
            category: '',
            senderId: '',
            senderName: '',
            senderEmail: '',
            departmentId: '',
            recipients: [] as string[],
            zoneId: '',
            isUrgent: false,
            expiresAt: undefined as Date | undefined,
            attachments: [] as File[],
            hasSchedule: false,
            scheduleType: 'ONE_TIME',
            oneTimeAt: undefined as Date | undefined,
            timeOfDay: '',
            weeklyDay: '',
            monthlyDay: null as number | null,
        },
        validate: {
            type: (value) => (value.length > 0 ? null : t('newCommunication.validation.typeRequired')),
            title: (value) => (value.trim().length > 0 ? null : t('newCommunication.validation.titleRequired')),
            content: (value) => (isValidRichText(value) ? null : t('newCommunication.validation.contentRequired')),
            category: (value) => (value.length > 0 ? null : t('newCommunication.validation.categoryRequired')),
            senderId: (value) => (value.length > 0 ? null : t('newCommunication.validation.senderRequired')),
            recipients: (value) => (value.length > 0 ? null : t('newCommunication.validation.recipientsRequired')),
            zoneId: (value) => (value ? null : t('newCommunication.validation.zoneRequired')),
            scheduleType: (_value, values) =>
                values.hasSchedule ? (values.scheduleType ? null : t('newCommunication.validation.scheduleTypeRequired')) : null,
            oneTimeAt: (value, values) =>
                values.hasSchedule && values.scheduleType === 'ONE_TIME'
                    ? (value ? null : t('newCommunication.validation.oneTimeAtRequired'))
                    : null,
            timeOfDay: (value, values) =>
                values.hasSchedule && ['WEEKLY', 'BI_WEEKLY', 'MONTHLY'].includes(values.scheduleType)
                    ? (value ? null : t('newCommunication.validation.timeOfDayRequired'))
                    : null,
            weeklyDay: (value, values) =>
                values.hasSchedule && ['WEEKLY', 'BI_WEEKLY'].includes(values.scheduleType)
                    ? (value ? null : t('newCommunication.validation.weeklyDayRequired'))
                    : null,
            monthlyDay: (value, values) =>
                values.hasSchedule && values.scheduleType === 'MONTHLY'
                    ? (value ? null : t('newCommunication.validation.monthlyDayRequired'))
                    : null,
        },
    });

    useEffect(() => {
        getEmployeesWithPosition()
            .then((data) => {
                setEmployees(data || []);
                setEmpMap(mapIdToName(data || []));
            })
            .catch(() => {
                errorNotification(t('newCommunication.loadEmployeesError'));
            });
        getAllDepartments()
            .then((data) => {
                setDepartments(data || []);
            })
            .catch(() => {
                errorNotification(t('newCommunication.loadDepartmentsError'));
            });
        GetAllWorkArea({})
            .then((data) => {
                setZones(data || []);
            })
            .catch(() => {
                errorNotification(t('newCommunication.loadZonesError'));
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (form.values.senderId) {
            const selected = empMap[form.values.senderId];
            form.setFieldValue('senderName', selected?.name || '');
            form.setFieldValue('senderEmail', selected?.email || '');
        } else {
            form.setFieldValue('senderName', '');
            form.setFieldValue('senderEmail', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empMap, form.values.senderId]);

    useEffect(() => {
        let ignore = false;
        setRecentLoading(true);
        getRecentCommunications(5)
            .then((data) => {
                if (ignore) return;
                setRecentCommunications(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (!ignore) {
                    setRecentCommunications([]);
                }
            })
            .finally(() => {
                if (!ignore) {
                    setRecentLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, []);

    const timelineItems = useMemo(() => (
        [...recentCommunications]
            .sort((a, b) => getSortTimestamp(b) - getSortTimestamp(a))
            .slice(0, 5)
    ), [recentCommunications]);

    const filteredRecipientsForSelection = useMemo(
        () => employees.filter((r) =>
            r.name?.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
            r.department?.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
            r.position?.toLowerCase().includes(recipientSearchTerm.toLowerCase())
        ),
        [employees, recipientSearchTerm]
    );

    useEffect(() => {
        const valueIds = (form.values.recipients || []).map((id) => String(id));
        const isSameLength = valueIds.length === selectedRecipients.length;
        const isSame = isSameLength && valueIds.every((id, index) => id === selectedRecipients[index]);
        if (!isSame) {
            setSelectedRecipients(valueIds);
        }
    }, [form.values.recipients, selectedRecipients]);

    useEffect(() => {
        if (!form.values.hasSchedule) {
            if (form.values.scheduleType !== 'ONE_TIME') {
                form.setFieldValue('scheduleType', 'ONE_TIME');
            }
            if (form.values.oneTimeAt) {
                form.setFieldValue('oneTimeAt', undefined);
            }
            if (form.values.timeOfDay) {
                form.setFieldValue('timeOfDay', '');
            }
            if (form.values.weeklyDay) {
                form.setFieldValue('weeklyDay', '');
            }
            if (form.values.monthlyDay !== null) {
                form.setFieldValue('monthlyDay', null);
            }
            return;
        }

        if (form.values.scheduleType === 'ONE_TIME') {
            if (form.values.timeOfDay) {
                form.setFieldValue('timeOfDay', '');
            }
            if (form.values.weeklyDay) {
                form.setFieldValue('weeklyDay', '');
            }
            if (form.values.monthlyDay !== null) {
                form.setFieldValue('monthlyDay', null);
            }
        }

        if (['WEEKLY', 'BI_WEEKLY'].includes(form.values.scheduleType)) {
            if (form.values.monthlyDay !== null) {
                form.setFieldValue('monthlyDay', null);
            }
            if (form.values.oneTimeAt) {
                form.setFieldValue('oneTimeAt', undefined);
            }
        }

        if (form.values.scheduleType === 'MONTHLY') {
            if (form.values.weeklyDay) {
                form.setFieldValue('weeklyDay', '');
            }
            if (form.values.oneTimeAt) {
                form.setFieldValue('oneTimeAt', undefined);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.values.hasSchedule, form.values.scheduleType]);

    const handleAddRecipient = (id: string | number) => {
        const idString = String(id);
        setSelectedRecipients((prev) => {
            if (prev.includes(idString)) {
                return prev;
            }
            const updated = [...prev, idString];
            form.setFieldValue('recipients', updated);
            return updated;
        });
    };

    const handleRemoveRecipient = (id: string | number) => {
        const idString = String(id);
        setSelectedRecipients((prev) => {
            const updated = prev.filter((r) => r !== idString);
            form.setFieldValue('recipients', updated);
            return updated;
        });
    };

    const handleSubmit = async (values: typeof form.values) => {
        setSubmitting(true);
        dispatch(showOverlay());
        try {
            const docs = await convertFilesToBase64New(values.attachments || []);
            const attachments = docs.map((doc: any) => {
                if (doc.id) {
                    return { id: Number(doc.id) };
                }

                const mime = doc.type ? doc.type.split(';')[0].replace('data:', '') : undefined;
                return {
                    name: doc.name,
                    type: mime,
                    file: doc.file,
                };
            });

            const senderId = Number(values.senderId);
            const zoneId = Number(values.zoneId);
            const departmentId = values.departmentId ? Number(values.departmentId) : null;
            const recipientIds = values.recipients
                .map((id) => Number(id))
                .filter((id) => !Number.isNaN(id));

            if (Number.isNaN(senderId)) {
                errorNotification(t('newCommunication.invalidSender'));
                return;
            }

            if (Number.isNaN(zoneId)) {
                errorNotification(t('newCommunication.invalidZone'));
                return;
            }

            if (recipientIds.length !== values.recipients.length) {
                errorNotification(t('newCommunication.unresolvedRecipients'));
                return;
            }

            const schedule = values.hasSchedule
                ? {
                    scheduleType: values.scheduleType,
                    timeOfDay: ['WEEKLY', 'BI_WEEKLY', 'MONTHLY'].includes(values.scheduleType) ? normalizeTimeOfDay(values.timeOfDay) : null,
                    oneTimeAt: values.scheduleType === 'ONE_TIME' && values.oneTimeAt ? toLocalDateTime(values.oneTimeAt) : null,
                    weeklyDay: ['WEEKLY', 'BI_WEEKLY'].includes(values.scheduleType) ? values.weeklyDay : null,
                    monthlyDay: values.scheduleType === 'MONTHLY' ? values.monthlyDay : null,
                }
                : null;

            const payload = {
                type: values.type,
                category: values.category,
                title: values.title.trim(),
                senderId,
                senderName: values.senderName || empMap[values.senderId]?.name || '',
                senderEmail: values.senderEmail || empMap[values.senderId]?.email || '',
                content: values.content,
                recipients: recipientIds,
                departmentId,
                zoneId,
                scheduledAt: null,
                expiresAt: values.expiresAt ? toLocalDateTime(values.expiresAt) : null,
                urgency: values.isUrgent ? 'URGENT' : 'NORMAL',
                attachments,
                schedule,
            };

            await createCommunication(payload);
            successNotification(t('newCommunication.createSuccess'));
            navigate('/communications');
        } catch (error: any) {
            errorNotification(error?.response?.data?.errorMessage || t('newCommunication.saveError'));
        } finally {
            setSubmitting(false);
            dispatch(hideOverlay());
        }
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('breadcrumbs.home'), to: '/' },
                    { label: t('breadcrumbs.module') },
                    { label: t('breadcrumbs.communications'), to: '/communications' },
                    { label: t('breadcrumbs.newCommunication') },
                ]}
                icon={<IconMessageCircle size={22} stroke={2} />}
                iconColor="pink"
                title={t('newCommunication.title')}
                subtitle={t('newCommunication.subtitle')}
            />

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                <div className="xl:col-span-3">
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <div className="flex flex-col gap-4">
                            <SectionCard
                                icon={<IconFileDescription size={15} stroke={1.8} />}
                                title={t('newCommunication.sectionIdentification')}
                                subtitle={t('newCommunication.sectionIdentificationSubtitle')}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Select
                                        label={t('newCommunication.fieldType')}
                                        placeholder={t('newCommunication.fieldTypePlaceholder')}
                                        data={TYPE_OPTIONS.map((o) => ({ value: o.value, label: tType(o.value) }))}
                                        withAsterisk
                                        searchable
                                        size="sm"
                                        {...form.getInputProps('type')}
                                    />
                                    <Select
                                        label={t('newCommunication.fieldCategory')}
                                        placeholder={t('newCommunication.fieldCategoryPlaceholder')}
                                        data={CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: tCategory(o.value) }))}
                                        withAsterisk
                                        searchable
                                        size="sm"
                                        {...form.getInputProps('category')}
                                    />
                                </div>
                                <TextInput
                                    label={t('newCommunication.fieldTitle')}
                                    placeholder={t('newCommunication.fieldTitlePlaceholder')}
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('title')}
                                />
                            </SectionCard>

                            <SectionCard
                                icon={<IconUser size={15} stroke={1.8} />}
                                title={t('newCommunication.sectionSender')}
                                subtitle={t('newCommunication.sectionSenderSubtitle')}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Select
                                        label={t('newCommunication.fieldSender')}
                                        placeholder={t('newCommunication.fieldSenderPlaceholder')}
                                        data={employees.map((x) => ({ value: String(x.id), label: x.name }))}
                                        searchable
                                        withAsterisk
                                        size="sm"
                                        {...form.getInputProps('senderId')}
                                    />
                                    <TextInput
                                        disabled
                                        label={t('newCommunication.fieldSenderEmail')}
                                        placeholder={t('newCommunication.fieldSenderEmailPlaceholder')}
                                        size="sm"
                                        {...form.getInputProps('senderEmail')}
                                    />
                                </div>
                            </SectionCard>

                            <SectionCard
                                icon={<IconFileDescription size={15} stroke={1.8} />}
                                title={t('newCommunication.sectionContent')}
                                subtitle={t('newCommunication.sectionContentSubtitle')}
                            >
                                <TextEditor form={form} id="content" />
                            </SectionCard>

                            <SectionCard
                                icon={<IconUsers size={15} stroke={1.8} />}
                                title={t('newCommunication.sectionRecipients')}
                                subtitle={t('newCommunication.sectionRecipientsSubtitle')}
                            >
                                <TextInput
                                    placeholder={t('newCommunication.recipientSearchPlaceholder')}
                                    leftSection={<IconSearch size={14} />}
                                    value={recipientSearchTerm}
                                    onChange={(e) => setRecipientSearchTerm(e.target.value)}
                                    size="sm"
                                    aria-label={t('newCommunication.recipientSearchAria')}
                                />
                                {form.errors.recipients && (
                                    <p className="text-[11.5px] text-red-600 -mt-1">{form.errors.recipients}</p>
                                )}
                                {selectedRecipients.length > 0 && (
                                    <div>
                                        <p className="text-[11.5px] text-slate-500 mb-1.5">
                                            {t('newCommunication.selectedCount', { count: selectedRecipients.length })}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedRecipients.map((id) => {
                                                const rec = empMap[id];
                                                return rec ? (
                                                    <Chip
                                                        key={id}
                                                        checked
                                                        onChange={() => handleRemoveRecipient(id)}
                                                        variant="light"
                                                        color="teal"
                                                        size="xs"
                                                    >
                                                        {rec.name}
                                                    </Chip>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                                <ScrollArea h={200}>
                                    <div className="flex flex-col gap-1.5 pr-2">
                                        {filteredRecipientsForSelection.map((r) => {
                                            const idString = String(r.id);
                                            const isSelected = selectedRecipients.includes(idString);
                                            return (
                                                <button
                                                    type="button"
                                                    key={r.id}
                                                    onClick={() => (isSelected ? handleRemoveRecipient(idString) : handleAddRecipient(idString))}
                                                    aria-pressed={isSelected}
                                                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left ${
                                                        isSelected
                                                            ? 'border-teal-300 bg-teal-50/60'
                                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2.5 min-w-0">
                                                        <Avatar size="sm" color="teal" radius="xl">
                                                            {r.name.split(' ').map((n: any) => n[0]).join('')}
                                                        </Avatar>
                                                        <span className="min-w-0">
                                                            <span className="block text-[13px] text-slate-800 truncate">{r.name}</span>
                                                            <span className="block text-[11.5px] text-slate-500 truncate">
                                                                {r.position} · {r.department}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    {isSelected && (
                                                        <span className="flex-shrink-0 inline-flex items-center rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-teal-700">
                                                            {t('newCommunication.selected')}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </SectionCard>

                            <SectionCard
                                icon={<IconCalendarTime size={15} stroke={1.8} />}
                                title={t('newCommunication.sectionSchedule')}
                                subtitle={t('newCommunication.sectionScheduleSubtitle')}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Select
                                        label={t('newCommunication.fieldDepartment')}
                                        placeholder={t('newCommunication.fieldDepartmentPlaceholder')}
                                        data={departments.map((x) => ({ value: String(x.id), label: x.name }))}
                                        searchable
                                        clearable
                                        size="sm"
                                        {...form.getInputProps('departmentId')}
                                    />
                                    <Select
                                        label={t('newCommunication.fieldZone')}
                                        placeholder={t('newCommunication.fieldZonePlaceholder')}
                                        data={zones.map((x) => ({ value: String(x.id), label: x.name }))}
                                        searchable
                                        withAsterisk
                                        size="sm"
                                        {...form.getInputProps('zoneId')}
                                    />
                                </div>
                                <DateTimePicker
                                    label={t('newCommunication.fieldDeadline')}
                                    placeholder={t('newCommunication.fieldDeadlinePlaceholder')}
                                    withSeconds
                                    size="sm"
                                    value={form.values.expiresAt ?? null}
                                    onChange={(value) => form.setFieldValue('expiresAt', value || undefined)}
                                    error={form.errors.expiresAt}
                                />
                                <Switch
                                    label={t('newCommunication.switchSchedule')}
                                    description={t('newCommunication.switchScheduleDescription')}
                                    color="teal"
                                    size="sm"
                                    {...form.getInputProps('hasSchedule', { type: 'checkbox' })}
                                />
                                {form.values.hasSchedule && (
                                    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                                        <Select
                                            label={t('newCommunication.fieldScheduleType')}
                                            data={SCHEDULE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(`scheduleType.${o.value}`, { defaultValue: o.label }) }))}
                                            withAsterisk
                                            size="sm"
                                            {...form.getInputProps('scheduleType')}
                                        />
                                        {form.values.scheduleType === 'ONE_TIME' && (
                                            <DateTimePicker
                                                label={t('newCommunication.fieldOneTimeAt')}
                                                placeholder={t('newCommunication.fieldOneTimeAtPlaceholder')}
                                                withSeconds
                                                size="sm"
                                                value={form.values.oneTimeAt ?? null}
                                                onChange={(value) => form.setFieldValue('oneTimeAt', value || undefined)}
                                                error={form.errors.oneTimeAt}
                                            />
                                        )}
                                        {['WEEKLY', 'BI_WEEKLY', 'MONTHLY'].includes(form.values.scheduleType) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <TimeInput
                                                    label={t('newCommunication.fieldTimeOfDay')}
                                                    withSeconds
                                                    size="sm"
                                                    value={form.values.timeOfDay}
                                                    onChange={(event) => form.setFieldValue('timeOfDay', normalizeTimeOfDay(event.currentTarget.value))}
                                                    error={form.errors.timeOfDay}
                                                />
                                                {['WEEKLY', 'BI_WEEKLY'].includes(form.values.scheduleType) && (
                                                    <Select
                                                        label={t('newCommunication.fieldWeeklyDay')}
                                                        data={WEEKLY_DAY_OPTIONS.map((o) => ({ value: o.value, label: t(`weeklyDay.${o.value}`, { defaultValue: o.label }) }))}
                                                        withAsterisk
                                                        size="sm"
                                                        {...form.getInputProps('weeklyDay')}
                                                    />
                                                )}
                                                {form.values.scheduleType === 'MONTHLY' && (
                                                    <NumberInput
                                                        label={t('newCommunication.fieldMonthlyDay')}
                                                        withAsterisk
                                                        min={1}
                                                        max={31}
                                                        size="sm"
                                                        value={form.values.monthlyDay ?? undefined}
                                                        onChange={(value) => form.setFieldValue('monthlyDay', typeof value === 'number' ? value : null)}
                                                        error={form.errors.monthlyDay}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <Switch
                                    label={t('newCommunication.switchUrgent')}
                                    description={t('newCommunication.switchUrgentDescription')}
                                    color="red"
                                    size="sm"
                                    {...form.getInputProps('isUrgent', { type: 'checkbox' })}
                                />
                            </SectionCard>

                            <SectionCard
                                icon={<IconPaperclip size={15} stroke={1.8} />}
                                title={t('newCommunication.sectionAttachments')}
                                subtitle={t('newCommunication.sectionAttachmentsSubtitle')}
                            >
                                <FileUpdateDropzone id="attachments" form={form} />
                            </SectionCard>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => navigate('/communications')}
                                >
                                    {t('newCommunication.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    color="teal"
                                    size="sm"
                                    loading={submitting}
                                    leftSection={<IconSend size={15} />}
                                >
                                    {t('newCommunication.submit')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* ─── Aparté : diffusions récentes ───────────────────────── */}
                <aside className="xl:col-span-2">
                    <div className="sticky top-4 bg-white rounded-xl border border-slate-200 p-4">
                        <h3
                            className="text-slate-800 mb-1"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: '14px',
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {t('newCommunication.recentTitle')}
                        </h3>
                        <p className="text-[11.5px] text-slate-500 mb-3">
                            {t('newCommunication.recentSubtitle')}
                        </p>

                        {recentLoading ? (
                            <div className="flex flex-col gap-2" aria-busy="true">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
                                ))}
                            </div>
                        ) : timelineItems.length ? (
                            <Timeline bulletSize={16} lineWidth={2} color="teal" className="pt-1">
                                {timelineItems.map((comm) => {
                                    const urgent = isUrgentValue(comm?.urgency);
                                    const recipientCount = getRecipientCount(comm);
                                    const infoParts = [
                                        comm?.type ? tType(comm.type) : null,
                                        recipientCount > 0 ? t('newCommunication.recipients', { count: recipientCount }) : null,
                                    ].filter(Boolean);
                                    const primaryDate = selectPrimaryDate(comm);
                                    const dateLabel = primaryDate ? formatDateFr(primaryDate) : '—';

                                    return (
                                        <Timeline.Item
                                            key={comm?.id ?? `${comm?.title ?? 'communication'}-${dateLabel}`}
                                            title={
                                                <span className="text-[12.5px] text-slate-800">
                                                    {comm?.title || t('newCommunication.untitledCommunication')}
                                                </span>
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {comm?.category && (
                                                        <Badge
                                                            color={CATEGORY_COLORS[comm.category] ?? 'gray'}
                                                            variant="light"
                                                            size="xs"
                                                            radius="sm"
                                                        >
                                                            {tCategory(comm.category)}
                                                        </Badge>
                                                    )}
                                                    {urgent && (
                                                        <span className="inline-flex items-center rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-rose-700">
                                                            {t('newCommunication.badgeUrgent')}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-slate-500">{dateLabel}</span>
                                            </div>
                                            {infoParts.length > 0 && (
                                                <p className="text-[11.5px] text-slate-500">{infoParts.join(' · ')}</p>
                                            )}
                                        </Timeline.Item>
                                    );
                                })}
                            </Timeline>
                        ) : (
                            <p className="text-[12px] text-slate-500">{t('newCommunication.noRecentCommunication')}</p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default NewCommunication;
