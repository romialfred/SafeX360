import { useEffect, useMemo, useState } from 'react';
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
    IconDeviceFloppy,
    IconFileDescription,
    IconMessageCircle,
    IconPaperclip,
    IconSearch,
    IconUser,
    IconUsers,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PageHeader from '../../UtilityComp/PageHeader';
import TextEditor from '../../UtilityComp/TextEditor';
import FileUpdateDropzone from '../../UtilityComp/FileUpdateDropzone';
import { getAllDepartments, getEmployeesWithPosition } from '../../../services/HrmsService';
import { GetAllWorkArea } from '../../../services/WorkAreaService';
import { mapIdToName, isValidRichText } from '../../../utility/OtherUtilities';
import { base64ToFileWithNameNew, convertFilesToBase64New } from '../../../utility/DocumentUtility';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { getCommunicationById, getRecentCommunications, updateCommunication } from '../../../services/CommunicationService';
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
 * Modification d'une communication HSE existante : mêmes sections que la
 * création, valeurs préchargées depuis le backend (contenu, destinataires,
 * planification, pièces jointes).
 */

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
    const [submitting, setSubmitting] = useState(false);
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
            type: (value) => (value.length > 0 ? null : 'Le type est obligatoire'),
            title: (value) => (value.trim().length > 0 ? null : 'Le titre est obligatoire'),
            content: (value) => (isValidRichText(value) ? null : 'Le contenu est obligatoire'),
            category: (value) => (value.length > 0 ? null : 'La catégorie est obligatoire'),
            senderId: (value) => (value.length > 0 ? null : "L'expéditeur est obligatoire"),
            recipients: (value) => (value.length > 0 ? null : 'Sélectionnez au moins un destinataire'),
            zoneId: (value) => (value ? null : 'La zone est obligatoire'),
            scheduleType: (_value, values) =>
                values.hasSchedule ? (values.scheduleType ? null : 'Le type de planification est obligatoire') : null,
            oneTimeAt: (value, values) =>
                values.hasSchedule && values.scheduleType === 'ONE_TIME'
                    ? (value ? null : "La date et l'heure d'envoi sont obligatoires")
                    : null,
            timeOfDay: (value, values) =>
                values.hasSchedule && ['WEEKLY', 'BI_WEEKLY', 'MONTHLY'].includes(values.scheduleType)
                    ? (value ? null : "L'heure d'envoi est obligatoire")
                    : null,
            weeklyDay: (value, values) =>
                values.hasSchedule && ['WEEKLY', 'BI_WEEKLY'].includes(values.scheduleType)
                    ? (value ? null : 'Choisissez un jour de la semaine')
                    : null,
            monthlyDay: (value, values) =>
                values.hasSchedule && values.scheduleType === 'MONTHLY'
                    ? (value ? null : 'Choisissez un jour du mois')
                    : null,
        },
    });

    useEffect(() => {
        dispatch(showOverlay());
        getEmployeesWithPosition()
            .then((data) => {
                setEmployees(data || []);
                setEmpMap(mapIdToName(data || []));
            })
            .catch(() => {
                errorNotification('Échec du chargement des employés');
            });
        getAllDepartments()
            .then((data) => {
                setDepartments(data || []);
            })
            .catch(() => {
                errorNotification('Échec du chargement des départements');
            });
        GetAllWorkArea({})
            .then((data) => {
                setZones(data || []);
            })
            .catch(() => {
                errorNotification('Échec du chargement des zones');
            })
            .finally(() => dispatch(hideOverlay()));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!communicationId) return;
        dispatch(showOverlay());
        getCommunicationById(communicationId)
            .then((data) => {
                if (!data) return;

                const recipientIds = parseRecipientIds(data.recipients);
                setSelectedRecipients(recipientIds);
                const attachments = data.attachments?.map((x: any) => {
                    const mimeType = x?.type?.split(',')[0]?.split(':')[1]; // extraction du type MIME
                    const file = base64ToFileWithNameNew(x.file, x.name, mimeType);
                    return {
                        id: x.id,
                        file,
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
            .catch(() => errorNotification("La communication n'a pas pu être chargée"))
            .finally(() => dispatch(hideOverlay()));
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleAddRecipient = (recipientId: string | number) => {
        const idString = String(recipientId);
        setSelectedRecipients((prev) => {
            if (prev.includes(idString)) {
                return prev;
            }
            const updated = [...prev, idString];
            form.setFieldValue('recipients', updated);
            return updated;
        });
    };

    const handleRemoveRecipient = (recipientId: string | number) => {
        const idString = String(recipientId);
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

            const senderId = Number(values.senderId);
            const zoneId = Number(values.zoneId);
            const departmentId = values.departmentId ? Number(values.departmentId) : null;
            const recipientIds = values.recipients
                .map((recipientId) => Number(recipientId))
                .filter((recipientId) => !Number.isNaN(recipientId));

            if (Number.isNaN(senderId)) {
                errorNotification("L'expéditeur sélectionné est invalide");
                return;
            }

            if (Number.isNaN(zoneId)) {
                errorNotification('La zone sélectionnée est invalide');
                return;
            }

            if (recipientIds.length !== values.recipients.length) {
                errorNotification("Certains destinataires n'ont pas pu être résolus. Sélectionnez-les à nouveau.");
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

            const payload: any = {
                id: values.id,
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
                attachments: docs,
                schedule,
            };

            await updateCommunication(payload);
            successNotification('Communication mise à jour');
            navigate(`/communications/communications-details/${values.id}`);
        } catch (error: any) {
            errorNotification(error?.response?.data?.errorMessage || "L'enregistrement a échoué");
        } finally {
            setSubmitting(false);
            dispatch(hideOverlay());
        }
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Communication Sécurité' },
                    { label: 'Communications HSE', to: '/communications' },
                    { label: 'Modifier la communication' },
                ]}
                icon={<IconMessageCircle size={22} stroke={2} />}
                iconColor="pink"
                title="Modifier la communication"
                subtitle="Mettre à jour le message, les destinataires et la planification"
            />

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                <div className="xl:col-span-3">
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <div className="flex flex-col gap-4">
                            <SectionCard
                                icon={<IconFileDescription size={15} stroke={1.8} />}
                                title="Identification"
                                subtitle="Type de message, catégorie et titre lisible par les équipes"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Select
                                        label="Type"
                                        placeholder="Choisir le type de communication"
                                        data={TYPE_OPTIONS}
                                        withAsterisk
                                        searchable
                                        size="sm"
                                        {...form.getInputProps('type')}
                                    />
                                    <Select
                                        label="Catégorie"
                                        placeholder="Choisir la catégorie"
                                        data={CATEGORY_OPTIONS}
                                        withAsterisk
                                        searchable
                                        size="sm"
                                        {...form.getInputProps('category')}
                                    />
                                </div>
                                <TextInput
                                    label="Titre"
                                    placeholder="ex. Tir de mine prévu vendredi à 14 h — Zone B"
                                    withAsterisk
                                    size="sm"
                                    {...form.getInputProps('title')}
                                />
                            </SectionCard>

                            <SectionCard
                                icon={<IconUser size={15} stroke={1.8} />}
                                title="Expéditeur"
                                subtitle="Personne au nom de laquelle la communication est diffusée"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Select
                                        label="Expéditeur"
                                        placeholder="Choisir l'expéditeur"
                                        data={employees.map((x) => ({ value: String(x.id), label: x.name }))}
                                        searchable
                                        withAsterisk
                                        size="sm"
                                        {...form.getInputProps('senderId')}
                                    />
                                    <TextInput
                                        disabled
                                        label="Courriel de l'expéditeur"
                                        placeholder="Renseigné automatiquement"
                                        size="sm"
                                        {...form.getInputProps('senderEmail')}
                                    />
                                </div>
                            </SectionCard>

                            <SectionCard
                                icon={<IconFileDescription size={15} stroke={1.8} />}
                                title="Contenu"
                                subtitle="Message diffusé aux destinataires, mise en forme comprise"
                            >
                                <TextEditor form={form} id="content" />
                            </SectionCard>

                            <SectionCard
                                icon={<IconUsers size={15} stroke={1.8} />}
                                title="Destinataires"
                                subtitle="Périmètre de diffusion et employés ciblés"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Select
                                        label="Département"
                                        placeholder="Choisir le département"
                                        data={departments.map((x) => ({ value: String(x.id), label: x.name }))}
                                        searchable
                                        clearable
                                        size="sm"
                                        {...form.getInputProps('departmentId')}
                                    />
                                    <Select
                                        label="Zone"
                                        placeholder="Choisir la zone"
                                        data={zones.map((x) => ({ value: String(x.id), label: x.name }))}
                                        searchable
                                        withAsterisk
                                        size="sm"
                                        {...form.getInputProps('zoneId')}
                                    />
                                </div>
                                <TextInput
                                    placeholder="Rechercher par nom, département ou poste…"
                                    leftSection={<IconSearch size={14} />}
                                    value={recipientSearchTerm}
                                    onChange={(e) => setRecipientSearchTerm(e.target.value)}
                                    size="sm"
                                    aria-label="Rechercher un destinataire"
                                />
                                {form.errors.recipients && (
                                    <p className="text-[11.5px] text-red-600 -mt-1">{form.errors.recipients}</p>
                                )}
                                {selectedRecipients.length > 0 && (
                                    <div>
                                        <p className="text-[11.5px] text-slate-500 mb-1.5">
                                            {selectedRecipients.length} destinataire{selectedRecipients.length > 1 ? 's' : ''} sélectionné{selectedRecipients.length > 1 ? 's' : ''}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedRecipients.map((recipientId) => {
                                                const rec = empMap[recipientId];
                                                return rec ? (
                                                    <Chip
                                                        key={recipientId}
                                                        checked
                                                        onChange={() => handleRemoveRecipient(recipientId)}
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
                                <ScrollArea h={220}>
                                    <div className="flex flex-col gap-1.5 pr-2">
                                        {filteredRecipientsForSelection.map((recipient) => {
                                            const idString = String(recipient.id);
                                            const isSelected = selectedRecipients.includes(idString);
                                            return (
                                                <button
                                                    type="button"
                                                    key={recipient.id}
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
                                                            {recipient.name.split(' ').map((n: any) => n[0]).join('')}
                                                        </Avatar>
                                                        <span className="min-w-0">
                                                            <span className="block text-[13px] text-slate-800 truncate">{recipient.name}</span>
                                                            <span className="block text-[11.5px] text-slate-500 truncate">
                                                                {recipient.position} · {recipient.department}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    {isSelected && (
                                                        <span className="flex-shrink-0 inline-flex items-center rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-teal-700">
                                                            Sélectionné
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
                                title="Planification"
                                subtitle="Échéance de la communication et envois récurrents"
                            >
                                <DateTimePicker
                                    label="Échéance (facultatif)"
                                    placeholder="Date et heure de fin de validité"
                                    withSeconds
                                    size="sm"
                                    value={form.values.expiresAt ?? null}
                                    onChange={(value) => form.setFieldValue('expiresAt', value || undefined)}
                                    minDate={new Date()}
                                    error={form.errors.expiresAt}
                                />
                                <Switch
                                    label="Planifier cette communication"
                                    description="Programmer un envoi unique ou récurrent au lieu d'une diffusion immédiate."
                                    color="teal"
                                    size="sm"
                                    {...form.getInputProps('hasSchedule', { type: 'checkbox' })}
                                />
                                {form.values.hasSchedule && (
                                    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                                        <Select
                                            label="Type de planification"
                                            data={SCHEDULE_TYPE_OPTIONS}
                                            withAsterisk
                                            size="sm"
                                            {...form.getInputProps('scheduleType')}
                                        />
                                        {form.values.scheduleType === 'ONE_TIME' && (
                                            <DateTimePicker
                                                label="Envoi unique le"
                                                placeholder="Choisir la date et l'heure"
                                                withSeconds
                                                size="sm"
                                                value={form.values.oneTimeAt ?? null}
                                                onChange={(value) => form.setFieldValue('oneTimeAt', value || undefined)}
                                                minDate={new Date()}
                                                error={form.errors.oneTimeAt}
                                            />
                                        )}
                                        {['WEEKLY', 'BI_WEEKLY', 'MONTHLY'].includes(form.values.scheduleType) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <TimeInput
                                                    label="Heure d'envoi"
                                                    withSeconds
                                                    size="sm"
                                                    value={form.values.timeOfDay}
                                                    onChange={(event) => form.setFieldValue('timeOfDay', normalizeTimeOfDay(event.currentTarget.value))}
                                                    error={form.errors.timeOfDay}
                                                />
                                                {['WEEKLY', 'BI_WEEKLY'].includes(form.values.scheduleType) && (
                                                    <Select
                                                        label="Jour de la semaine"
                                                        data={WEEKLY_DAY_OPTIONS}
                                                        withAsterisk
                                                        size="sm"
                                                        {...form.getInputProps('weeklyDay')}
                                                    />
                                                )}
                                                {form.values.scheduleType === 'MONTHLY' && (
                                                    <NumberInput
                                                        label="Jour du mois"
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
                                    label="Marquer comme urgente"
                                    description="La communication sera signalée comme urgente aux destinataires."
                                    color="red"
                                    size="sm"
                                    {...form.getInputProps('isUrgent', { type: 'checkbox' })}
                                />
                            </SectionCard>

                            <SectionCard
                                icon={<IconPaperclip size={15} stroke={1.8} />}
                                title="Pièces jointes"
                                subtitle="Documents transmis avec la communication"
                            >
                                <FileUpdateDropzone id="attachments" form={form} />
                            </SectionCard>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => navigate(-1)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    color="teal"
                                    size="sm"
                                    loading={submitting}
                                    leftSection={<IconDeviceFloppy size={15} />}
                                >
                                    Enregistrer les modifications
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
                            Dernières communications
                        </h3>
                        <p className="text-[11.5px] text-slate-500 mb-3">
                            Aperçu des diffusions récentes pour garder un message cohérent.
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
                                        comm?.type ? typeLabel(comm.type) : null,
                                        recipientCount > 0 ? `${recipientCount} destinataire${recipientCount > 1 ? 's' : ''}` : null,
                                    ].filter(Boolean);
                                    const primaryDate = selectPrimaryDate(comm);
                                    const dateLabel = primaryDate ? formatDateFr(primaryDate) : '—';

                                    return (
                                        <Timeline.Item
                                            key={comm?.id ?? `${comm?.title ?? 'communication'}-${dateLabel}`}
                                            title={
                                                <span className="text-[12.5px] text-slate-800">
                                                    {comm?.title || 'Communication sans titre'}
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
                                                            {categoryLabel(comm.category)}
                                                        </Badge>
                                                    )}
                                                    {urgent && (
                                                        <span className="inline-flex items-center rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-rose-700">
                                                            Urgente
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
                            <p className="text-[12px] text-slate-500">Aucune communication récente.</p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default EditCommunication;
