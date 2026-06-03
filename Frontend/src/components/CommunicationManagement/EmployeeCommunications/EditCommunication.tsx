import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Group,
    Button,
    Title,
    Grid,
    Card,
    Stack,
    Select,
    TextInput,
    Text,
    ScrollArea,
    Chip,
    Flex,
    Avatar,
    Badge,
    Switch,
    Timeline,
    Breadcrumbs,
    NumberInput,
    Center,
    Loader,
} from '@mantine/core';
import { DateTimePicker, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconSearch, IconSend } from '@tabler/icons-react';
import { communicationCategories, communicationTypes } from '../../../Data/dummyData/communicationData';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TextEditor from '../../UtilityComp/TextEditor';
import { getAllDepartments, getEmployeesWithPosition } from '../../../services/HrmsService';
import { GetAllWorkArea } from '../../../services/WorkAreaService';
import { mapIdToName, isValidRichText } from '../../../utility/OtherUtilities';
import { base64ToFileWithNameNew, convertFilesToBase64New } from '../../../utility/DocumentUtility';
import FileUpdateDropzone from '../../UtilityComp/FileUpdateDropzone';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getCommunicationById, getRecentCommunications, updateCommunication } from '../../../services/CommunicationService';
import { formatDateShort } from '../../../utility/DateFormats';

const scheduleTypeOptions = [
    { value: 'ONE_TIME', label: 'One time' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'BI_WEEKLY', label: 'Bi-weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
];

const weeklyDayOptions = [
    { value: 'MONDAY', label: 'Monday' },
    { value: 'TUESDAY', label: 'Tuesday' },
    { value: 'WEDNESDAY', label: 'Wednesday' },
    { value: 'THURSDAY', label: 'Thursday' },
    { value: 'FRIDAY', label: 'Friday' },
    { value: 'SATURDAY', label: 'Saturday' },
    { value: 'SUNDAY', label: 'Sunday' },
];

const formatLocalDateTime = (date: Date) => {
    const pad = (val: number) => val.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const normalizeTimeOfDay = (time: string) => {
    if (!time) {
        return '';
    }
    const segments = time.split(':');
    if (segments.length === 3) {
        return `${segments[0].padStart(2, '0')}:${segments[1].padStart(2, '0')}:${segments[2].padStart(2, '0')}`;
    }
    if (segments.length === 2) {
        return `${segments[0].padStart(2, '0')}:${segments[1].padStart(2, '0')}:00`;
    }
    return time;
};

const parseRecipients = (recipients: any): string[] => {
    if (!recipients) return [];
    if (Array.isArray(recipients)) {
        return recipients.map((value) => String(value));
    }
    if (typeof recipients === 'string') {
        try {
            const parsed = JSON.parse(recipients);
            return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
        } catch (_err) {
            return [];
        }
    }
    return [];
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

const stripHtml = (value?: string | null) => {
    if (!value) return '';
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const resolveRecipientCount = (input: unknown): number => {
    if (!input && input !== 0) return 0;
    if (typeof input === 'number' && Number.isFinite(input)) return input;
    if (Array.isArray(input)) return input.length;
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed) return 0;
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed.length;
        } catch (_err) {
            // ignore parse failures
        }
        return trimmed.split(',').map((item) => item.trim()).filter(Boolean).length;
    }
    if (typeof input === 'object') {
        const values = Object.values(input as Record<string, unknown>);
        return values.length;
    }
    return 0;
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
        const count = resolveRecipientCount(candidate);
        if (count > 0) {
            return count;
        }
    }
    return 0;
};

const selectPrimaryDate = (communication: any): string | null => {
    const candidates = [
        communication?.updatedAt,
        communication?.createdAt,
        communication?.date,
        communication?.scheduledAt,
        communication?.schedule?.nextRunAt,
        communication?.expiresAt,
    ];

    for (const candidate of candidates) {
        if (candidate) {
            return candidate;
        }
    }
    return null;
};

const getSortTimestamp = (communication: any): number => {
    const rawDate = selectPrimaryDate(communication);
    if (!rawDate) return 0;
    const timestamp = new Date(rawDate).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getCategoryColor = (category: string) => {
    const normalized = category?.replace(/_/g, ' ').toLowerCase();
    switch (normalized) {
        case 'safety':
        case 'safety alert':
            return 'red';
        case 'operations':
        case 'event':
            return 'blue';
        case 'training':
            return 'green';
        case 'administrative':
        case 'policy update':
            return 'gray';
        case 'emergency':
            return 'orange';
        case 'news':
            return 'teal';
        default:
            return 'gray';
    }
};

const EditCommunication = () => {
    const { id } = useParams();
    const communicationId = id ? Number(id) : null;

    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [recentCommunications, setRecentCommunications] = useState<any[]>([]);
    const [recentLoading, setRecentLoading] = useState<boolean>(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            id: '' as string | number,
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
            attachments: [] as any[],
            hasSchedule: false,
            scheduleType: 'ONE_TIME',
            oneTimeAt: undefined as Date | undefined,
            timeOfDay: '',
            weeklyDay: '',
            monthlyDay: null as number | null,
        },
        validate: {
            type: (value) => (value.length > 0 ? null : 'Type is required'),
            title: (value) => (value.length > 0 ? null : 'Title is required'),
            content: (value) => (isValidRichText(value) ? null : 'Content is required'),
            category: (value) => (value.length > 0 ? null : 'Category is required'),
            senderId: (value) => (value.length > 0 ? null : 'Sender is required'),
            recipients: (value) => (value.length > 0 ? null : 'At least one recipient is required'),
            zoneId: (value) => (value ? null : 'Zone is required'),
            scheduleType: (_value, values) => (values.hasSchedule ? values.scheduleType ? null : 'Schedule type is required' : null),
            oneTimeAt: (value, values) => (values.hasSchedule && values.scheduleType === 'ONE_TIME' ? (value ? null : 'Schedule date and time is required') : null),
            timeOfDay: (value, values) => (values.hasSchedule && ['WEEKLY', 'BI_WEEKLY', 'MONTHLY'].includes(values.scheduleType) ? (value ? null : 'Time of day is required') : null),
            weeklyDay: (value, values) => (values.hasSchedule && ['WEEKLY', 'BI_WEEKLY'].includes(values.scheduleType) ? (value ? null : 'Select a day of week') : null),
            monthlyDay: (value, values) => (values.hasSchedule && values.scheduleType === 'MONTHLY' ? (value ? null : 'Select a day of month') : null),
        }
    });

    useEffect(() => {
        dispatch(showOverlay());
        getEmployeesWithPosition()
            .then((data) => {
                setEmployees(data || []);
                setEmpMap(mapIdToName(data || []));
            })
            .catch(() => {
                errorNotification('Failed to load employees');
            });
        getAllDepartments()
            .then((data) => {
                setDepartments(data || []);
            })
            .catch(() => {
                errorNotification('Failed to load departments');
            });
        GetAllWorkArea({})
            .then((data) => {
                setZones(data || []);
            })
            .catch(() => {
                errorNotification('Failed to load zones');
            })
            .finally(() => dispatch(hideOverlay()));
    }, []);

    useEffect(() => {
        if (!communicationId) return;
        dispatch(showOverlay());
        getCommunicationById(communicationId)
            .then((data) => {
                if (!data) return;

                const recipientIds = parseRecipients(data.recipients);
                setSelectedRecipients(recipientIds);
                const attachments = data.attachments?.map((x: any) => {
                    const mimeType = x?.type?.split(',')[0]?.split(':')[1]; // Extract MIME type
                    const file = base64ToFileWithNameNew(x.file, x.name, mimeType);
                    return {
                        id: x.id,
                        file
                    };
                });



                form.setValues({
                    id: data.id,
                    type: data.type ?? '',
                    title: data.title ?? '',
                    content: data.content ?? '',
                    category: data.category ?? '',
                    senderId: data.senderId ? String(data.senderId) : '',
                    senderName: data.senderName ?? '',
                    senderEmail: data.senderEmail ?? '',
                    departmentId: data.departmentId ? String(data.departmentId) : '',
                    recipients: recipientIds,
                    zoneId: data.zoneId ? String(data.zoneId) : '',
                    isUrgent: data.urgency === 'URGENT',
                    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
                    attachments,
                    hasSchedule: Boolean(data.schedule),
                    scheduleType: data.schedule?.scheduleType ?? 'ONE_TIME',
                    oneTimeAt: data.schedule?.oneTimeAt ? new Date(data.schedule.oneTimeAt) : undefined,
                    timeOfDay: data.schedule?.timeOfDay ?? '',
                    weeklyDay: data.schedule?.weeklyDay ?? '',
                    monthlyDay: data.schedule?.monthlyDay ?? null,
                });
            })
            .catch(() => errorNotification('Failed to load communication'))
            .finally(() => dispatch(hideOverlay()));
    }, [communicationId]);

    useEffect(() => {
        if (form.values.senderId) {
            const selected = empMap[form.values.senderId];
            form.setFieldValue('senderName', selected?.name || '');
            form.setFieldValue('senderEmail', selected?.email || '');
        } else {
            form.setFieldValue('senderName', '');
            form.setFieldValue('senderEmail', '');
        }
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
                    errorNotification('Failed to load recent communications');
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
        dispatch(showOverlay());
        try {
            const docs = await convertFilesToBase64New(values.attachments || []);


            const senderId = Number(values.senderId);
            const zoneId = Number(values.zoneId);
            const departmentId = values.departmentId ? Number(values.departmentId) : null;
            const recipientIds = values.recipients
                .map((id) => Number(id))
                .filter((id) => !Number.isNaN(id));

            if (Number.isNaN(senderId)) {
                errorNotification('Invalid sender selected');
                return;
            }

            if (Number.isNaN(zoneId)) {
                errorNotification('Invalid zone selected');
                return;
            }

            if (recipientIds.length !== values.recipients.length) {
                errorNotification('Some recipients could not be resolved. Please reselect them.');
                return;
            }

            const schedule = values.hasSchedule
                ? {
                    scheduleType: values.scheduleType,
                    timeOfDay: ['WEEKLY', 'BI_WEEKLY', 'MONTHLY'].includes(values.scheduleType) ? normalizeTimeOfDay(values.timeOfDay) : null,
                    oneTimeAt: values.scheduleType === 'ONE_TIME' && values.oneTimeAt ? formatLocalDateTime(values.oneTimeAt) : null,
                    weeklyDay: ['WEEKLY', 'BI_WEEKLY'].includes(values.scheduleType) ? values.weeklyDay : null,
                    monthlyDay: values.scheduleType === 'MONTHLY' ? values.monthlyDay : null,
                }
                : null;

            const payload: any = {
                id: values.id,
                type: values.type,
                category: values.category,
                title: values.title,
                senderId,
                senderName: values.senderName || empMap[values.senderId]?.name || '',
                senderEmail: values.senderEmail || empMap[values.senderId]?.email || '',
                content: values.content,
                recipients: recipientIds,
                departmentId,
                zoneId,
                scheduledAt: null,
                expiresAt: values.expiresAt ? formatLocalDateTime(values.expiresAt) : null,
                urgency: values.isUrgent ? 'URGENT' : 'NORMAL',
                attachments: docs,
                schedule,
            };

            await updateCommunication(payload);
            successNotification('Communication updated successfully');
            navigate(`/communications/communications-details/${values.id}`);
        } catch (error: any) {
            errorNotification(error?.response?.data?.errorMessage || 'Something went wrong');
        } finally {
            dispatch(hideOverlay());
        }
    };

    return (
        <div>
            <div>
                <div className="text-2xl text-blue-500 w-fit">Edit Communication</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/communications">
                        <Text variant="gradient">Employee Communications</Text>
                    </Link>
                    <Text variant="gradient">Edit Communication</Text>
                </Breadcrumbs>
            </div>

            <Grid>
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="lg">
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">
                                    Communication Details
                                </Title>
                                <Grid mb="md">
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Type"
                                            placeholder="Select communication type"
                                            data={communicationTypes}
                                            withAsterisk
                                            searchable
                                            {...form.getInputProps('type')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Category"
                                            placeholder="Select category"
                                            data={communicationCategories}
                                            withAsterisk
                                            searchable
                                            {...form.getInputProps('category')}
                                        />
                                    </Grid.Col>
                                </Grid>
                                <TextInput
                                    label="Title"
                                    placeholder="Enter communication title"
                                    required
                                    size="md"
                                    {...form.getInputProps('title')}
                                />
                            </Card>

                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">
                                    Sender Information
                                </Title>
                                <Grid mb="md">
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Sender Name"
                                            data={employees.map((x) => ({ value: String(x.id), label: x.name }))}
                                            placeholder='Select sender'
                                            searchable
                                            withAsterisk
                                            {...form.getInputProps('senderId')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <TextInput
                                            disabled
                                            label="Sender Email"
                                            placeholder="sender@company.com"
                                            required
                                            {...form.getInputProps('senderEmail')}
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Card>

                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">
                                    Content
                                </Title>
                                <TextEditor form={form} id="content" />
                            </Card>

                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">
                                    Recipients
                                </Title>
                                <Grid mb="md">
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Department"
                                            data={departments.map((x) => ({ value: String(x.id), label: x.name }))}
                                            placeholder="Select department"
                                            searchable
                                            clearable
                                            {...form.getInputProps('departmentId')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Select
                                            label="Zone"
                                            placeholder="Select zone"
                                            data={zones.map((x) => ({ value: String(x.id), label: x.name }))}
                                            searchable
                                            withAsterisk
                                            {...form.getInputProps('zoneId')}
                                        />
                                    </Grid.Col>
                                </Grid>
                                <Grid mb="md">
                                    <Grid.Col span={6}>
                                        <DateTimePicker
                                            label="Expires At (Optional)"
                                            placeholder="Select expiry date and time"
                                            withSeconds
                                            value={form.values.expiresAt ?? null}
                                            onChange={(value) => form.setFieldValue('expiresAt', value || undefined)}
                                            minDate={new Date()}
                                            error={form.errors.expiresAt}
                                        />
                                    </Grid.Col>
                                </Grid>
                                <TextInput
                                    placeholder="Search recipients by name, department, or position..."
                                    leftSection={<IconSearch size={16} />}
                                    value={recipientSearchTerm}
                                    onChange={(e) => setRecipientSearchTerm(e.target.value)}
                                    mb="md"
                                />
                                {selectedRecipients.length > 0 && (
                                    <Box mb="md">
                                        <Text size="sm" mb="xs">
                                            Selected Recipients ({selectedRecipients.length})
                                        </Text>
                                        <Flex gap="xs" wrap="wrap">
                                            {selectedRecipients.map((id) => {
                                                const rec = empMap[id];
                                                return rec ? (
                                                    <Chip key={id} checked onChange={() => handleRemoveRecipient(id)} variant="filled" color="blue">
                                                        {rec.name}
                                                    </Chip>
                                                ) : null;
                                            })}
                                        </Flex>
                                    </Box>
                                )}

                                <ScrollArea h={220}>
                                    <Stack gap="xs">
                                        {filteredRecipientsForSelection.map((recipient) => {
                                            const idString = String(recipient.id);
                                            const isSelected = selectedRecipients.includes(idString);
                                            return (
                                                <Card
                                                    key={recipient.id}
                                                    withBorder
                                                    p="sm"
                                                    radius="md"
                                                    shadow="sm"
                                                    className={`transition-colors cursor-pointer ${isSelected ? '!border-blue-500 !bg-blue-50' : 'hover:border-blue-400'}`}
                                                    onClick={() => (isSelected ? handleRemoveRecipient(idString) : handleAddRecipient(idString))}
                                                >
                                                    <Group justify="space-between">
                                                        <Group>
                                                            <Avatar size="sm" color="blue">
                                                                {recipient.name.split(' ').map((n: any) => n[0]).join('')}
                                                            </Avatar>
                                                            <Box>
                                                                <Text size="sm">
                                                                    {recipient.name}
                                                                </Text>
                                                                <Text size="xs" c="dimmed">
                                                                    {recipient.position} • {recipient.department}
                                                                </Text>
                                                            </Box>
                                                        </Group>
                                                        <Badge color={isSelected ? 'blue' : 'green'} variant="light" size="sm">
                                                            {isSelected ? 'Selected' : 'Active'}
                                                        </Badge>
                                                    </Group>
                                                </Card>
                                            );
                                        })}
                                    </Stack>
                                </ScrollArea>
                            </Card>

                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">
                                    Scheduling
                                </Title>
                                <Stack gap="sm">
                                    <Switch label="Enable Schedule" {...form.getInputProps('hasSchedule', { type: 'checkbox' })} />

                                    {form.values.hasSchedule && (
                                        <Stack gap="md">
                                            <Select
                                                label="Schedule Type"
                                                data={scheduleTypeOptions}
                                                withAsterisk
                                                {...form.getInputProps('scheduleType')}
                                            />

                                            {form.values.scheduleType === 'ONE_TIME' && (
                                                <DateTimePicker
                                                    label="One-time send at"
                                                    placeholder="Select date and time"
                                                    withSeconds
                                                    value={form.values.oneTimeAt ?? null}
                                                    onChange={(value) => form.setFieldValue('oneTimeAt', value || undefined)}
                                                    minDate={new Date()}
                                                    error={form.errors.oneTimeAt}
                                                />
                                            )}

                                            {['WEEKLY', 'BI_WEEKLY', 'MONTHLY'].includes(form.values.scheduleType) && (
                                                <Grid>
                                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                                        <TimeInput
                                                            label="Time of day"
                                                            withSeconds
                                                            value={form.values.timeOfDay}
                                                            onChange={(event) => form.setFieldValue('timeOfDay', normalizeTimeOfDay(event.currentTarget.value))}
                                                            error={form.errors.timeOfDay}
                                                        />
                                                    </Grid.Col>
                                                    {['WEEKLY', 'BI_WEEKLY'].includes(form.values.scheduleType) && (
                                                        <Grid.Col span={{ base: 12, sm: 6 }}>
                                                            <Select
                                                                label="Day of week"
                                                                data={weeklyDayOptions}
                                                                withAsterisk
                                                                {...form.getInputProps('weeklyDay')}
                                                            />
                                                        </Grid.Col>
                                                    )}
                                                    {form.values.scheduleType === 'MONTHLY' && (
                                                        <Grid.Col span={{ base: 12, sm: 6 }}>
                                                            <NumberInput
                                                                label="Day of month"
                                                                withAsterisk
                                                                min={1}
                                                                max={31}
                                                                value={form.values.monthlyDay ?? undefined}
                                                                onChange={(value) => form.setFieldValue('monthlyDay', typeof value === 'number' ? value : null)}
                                                                error={form.errors.monthlyDay}
                                                            />
                                                        </Grid.Col>
                                                    )}
                                                </Grid>
                                            )}
                                        </Stack>
                                    )}
                                    <Switch label="Mark as Urgent" {...form.getInputProps('isUrgent', { type: 'checkbox' })} />
                                </Stack>
                            </Card>

                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={3} mb="md">
                                    Attachments
                                </Title>
                                <FileUpdateDropzone id="attachments" form={form} />
                            </Card>

                            <Group justify="flex-end">
                                <Button variant="outline" onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button type="submit" color="green" leftSection={<IconSend size={16} />}>
                                    Update Communication
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="md">Recent Communications</Title>

                        {recentLoading ? (
                            <Center py="md">
                                <Loader size="sm" color="blue" />
                            </Center>
                        ) : (
                            <Timeline>
                                {timelineItems.length ? (
                                    timelineItems.map((comm) => {
                                        const urgency = (comm?.urgency ?? '').toString().toUpperCase();
                                        const isUrgent = ['URGENT', 'HIGH', 'CRITICAL'].includes(urgency);
                                        const recipientCount = getRecipientCount(comm);
                                        const acknowledgedCount = typeof comm?.acknowledgedCount === 'number' ? comm.acknowledgedCount : null;
                                        const infoParts = [
                                            comm?.type ? formatEnumValue(comm.type) : null,
                                            recipientCount > 0 ? `${recipientCount} ${recipientCount === 1 ? 'recipient' : 'recipients'}` : null,
                                            acknowledgedCount !== null ? `${acknowledgedCount} acknowledged` : null,
                                        ].filter(Boolean);
                                        const primaryDate = selectPrimaryDate(comm);
                                        const dateLabel = primaryDate ? formatDateShort(primaryDate) : '-';
                                        const preview = stripHtml(comm?.preview ?? comm?.summary ?? comm?.content ?? '');

                                        return (
                                            <Timeline.Item key={comm?.id ?? `${comm?.title ?? 'communication'}-${dateLabel}`} title={comm?.title || 'Untitled Communication'}>
                                                <Group justify="space-between" mb="xs">
                                                    <Group gap="xs">
                                                        {comm?.category && (
                                                            <Badge color={getCategoryColor(comm.category)} variant="light" size="sm">
                                                                {formatEnumValue(comm.category)}
                                                            </Badge>
                                                        )}
                                                        {isUrgent && (
                                                            <Badge color="red" variant="filled" size="xs">
                                                                Urgent
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                    <Text size="xs" c="dimmed">{dateLabel}</Text>
                                                </Group>
                                                {infoParts.length > 0 && (
                                                    <Text size="sm" c="dimmed" mb="xs">
                                                        {infoParts.join(' • ')}
                                                    </Text>
                                                )}
                                                <Text size="sm" c="dimmed" lineClamp={3}>
                                                    {preview || 'No preview available.'}
                                                </Text>
                                            </Timeline.Item>
                                        );
                                    })
                                ) : (
                                    <Timeline.Item title="No recent communications">
                                        <Text size="sm" c="dimmed">No communications returned yet.</Text>
                                    </Timeline.Item>
                                )}
                            </Timeline>
                        )}
                    </Card>
                </Grid.Col>
            </Grid>
        </div>
    );
};

export default EditCommunication;
