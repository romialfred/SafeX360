import { useState } from 'react';
import { Badge, Button, Tooltip } from '@mantine/core';
import { IconEdit, IconPaperclip, IconSend } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { handlePreview } from '../../../utility/DocumentUtility';
import { sendCommunicationNow } from '../../../services/CommunicationService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import SafeHtml from '../../UtilityComp/SafeHtml';
import {
    CATEGORY_COLORS,
    categoryLabel,
    commStatusConfig,
    formatDateTimeFr,
    isUrgentValue,
    scheduleTypeLabel,
    typeLabel,
    urgencyConfig,
    weeklyDayLabel,
} from '../communicationLabels';

/**
 * Onglet « Détails » : contenu de la communication, planification et actions
 * (modifier, envoyer immédiatement).
 */

const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
};

const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3
        className="text-slate-800"
        style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
        }}
    >
        {children}
    </h3>
);

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-3 py-1.5 border-t border-slate-100">
        <dt className="text-slate-500 flex-shrink-0">{label}</dt>
        <dd className="text-slate-800 text-right">{children}</dd>
    </div>
);

const CommunicationDetailsTab = ({ communication, departmentMap, zoneMap }: any) => {
    const navigate = useNavigate();
    const [isSendingNow, setIsSendingNow] = useState(false);

    const schedule = communication?.schedule ?? {};
    const scheduleStatusRaw = schedule?.status?.toString?.() ?? communication?.status?.toString?.();
    const scheduleStatus = scheduleStatusRaw ? scheduleStatusRaw.toUpperCase() : null;
    const canEdit = scheduleStatus ? ['ACTIVE', 'PAUSED'].includes(scheduleStatus) : true;
    const canSendNow = scheduleStatus === 'ACTIVE';

    const statusCfg = scheduleStatus ? commStatusConfig(scheduleStatus) : null;
    const urgencyCfg = urgencyConfig(communication?.urgency);
    const urgent = isUrgentValue(communication?.urgency);

    const scheduleItems = [
        { label: 'Statut', value: schedule?.status ? commStatusConfig(schedule.status).label : null },
        { label: 'Type de planification', value: schedule?.scheduleType ? scheduleTypeLabel(schedule.scheduleType) : null },
        { label: 'Prochain envoi', value: schedule?.nextRunAt ? formatDateTimeFr(schedule.nextRunAt) : null },
        { label: 'Dernier envoi', value: schedule?.lastRunAt ? formatDateTimeFr(schedule.lastRunAt) : null },
        { label: 'Envoi unique le', value: schedule?.oneTimeAt ? formatDateTimeFr(schedule.oneTimeAt) : null },
        { label: "Heure d'envoi", value: schedule?.timeOfDay ?? null },
        { label: 'Jour de la semaine', value: schedule?.weeklyDay ? weeklyDayLabel(schedule.weeklyDay) : null },
        { label: 'Jour du mois', value: schedule?.monthlyDay ?? null },
    ].filter((item) => item.value !== null && item.value !== undefined && item.value !== '—');

    const handleSendNow = async () => {
        if (!communication?.id) return;
        if (!canSendNow) {
            errorNotification("L'envoi immédiat n'est possible que lorsque la communication est active.");
            return;
        }
        setIsSendingNow(true);
        try {
            await sendCommunicationNow(communication.id);
            successNotification("Communication placée en file d'envoi immédiat");
        } catch (error: any) {
            errorNotification(error?.response?.data?.errorMessage || "L'envoi immédiat a échoué");
        } finally {
            setIsSendingNow(false);
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
            {/* ─── Contenu et planification ───────────────────────────────── */}
            <div className="xl:col-span-3 flex flex-col gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                        <div className="min-w-0">
                            <SectionTitle>{communication?.title || '—'}</SectionTitle>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">{typeLabel(communication?.type)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {communication?.category && (
                                <Badge
                                    color={CATEGORY_COLORS[communication.category] ?? 'gray'}
                                    variant="light"
                                    size="sm"
                                    radius="sm"
                                >
                                    {categoryLabel(communication.category)}
                                </Badge>
                            )}
                            {urgent && (
                                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${urgencyCfg.chip}`}>
                                    {urgencyCfg.label}
                                </span>
                            )}
                            {statusCfg && (
                                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                    {statusCfg.label}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                        <SafeHtml html={communication?.content} />
                    </div>

                    <dl className="mt-3 grid grid-cols-1 gap-0 text-[12.5px]">
                        <InfoRow label="Expéditeur">{communication?.senderName || '—'}</InfoRow>
                        <InfoRow label="Département">
                            {departmentMap[communication?.departmentId]?.name ?? '—'}
                        </InfoRow>
                        {communication?.zoneId && (
                            <InfoRow label="Zone">{zoneMap[communication?.zoneId]?.name ?? '—'}</InfoRow>
                        )}
                        {communication?.expiresAt && (
                            <InfoRow label="Échéance">
                                <span className="inline-flex items-center gap-1.5">
                                    {formatDateTimeFr(communication.expiresAt)}
                                    {isExpiringSoon(communication.expiresAt) && (
                                        <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-700">
                                            Échéance proche
                                        </span>
                                    )}
                                    {isExpired(communication.expiresAt) && (
                                        <span className="inline-flex items-center rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-rose-700">
                                            Expirée
                                        </span>
                                    )}
                                </span>
                            </InfoRow>
                        )}
                    </dl>

                    {communication?.attachments?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-[11.5px] text-slate-500 mb-1.5">Pièces jointes</p>
                            <div className="flex flex-wrap gap-1.5">
                                {communication.attachments.map((item: any, index: number) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handlePreview(item)}
                                        className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11.5px] text-slate-700 hover:border-teal-300 hover:text-teal-700"
                                        aria-label={`Ouvrir la pièce jointe ${item.name}`}
                                    >
                                        <IconPaperclip size={12} aria-hidden="true" />
                                        {item.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>Planification</SectionTitle>
                    </div>
                    {scheduleItems.length ? (
                        <dl className="grid grid-cols-1 gap-0 text-[12.5px]">
                            {scheduleItems.map((item) => (
                                <InfoRow key={item.label} label={item.label}>
                                    {item.value}
                                </InfoRow>
                            ))}
                        </dl>
                    ) : (
                        <p className="text-[12.5px] text-slate-500">
                            Aucune planification : cette communication est diffusée manuellement.
                        </p>
                    )}
                </div>
            </div>

            {/* ─── Chronologie et actions ─────────────────────────────────── */}
            <div className="xl:col-span-2 flex flex-col gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>Chronologie</SectionTitle>
                    </div>
                    <dl className="grid grid-cols-1 gap-0 text-[12.5px]">
                        <InfoRow label="Créée le">{formatDateTimeFr(communication?.createdAt)}</InfoRow>
                        <InfoRow label="Publiée le">{formatDateTimeFr(communication?.scheduledAt)}</InfoRow>
                        {communication?.expiresAt && (
                            <InfoRow label="Expire le">
                                <span className={isExpired(communication.expiresAt) ? 'text-rose-700' : isExpiringSoon(communication.expiresAt) ? 'text-amber-700' : undefined}>
                                    {formatDateTimeFr(communication.expiresAt)}
                                </span>
                            </InfoRow>
                        )}
                    </dl>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>Actions</SectionTitle>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Tooltip
                            label="La modification n'est possible que lorsque la planification est active ou en pause."
                            withArrow
                            position="top"
                            disabled={canEdit}
                        >
                            <span className="w-full">
                                <Button
                                    fullWidth
                                    variant="default"
                                    size="sm"
                                    leftSection={<IconEdit size={15} />}
                                    onClick={() => navigate(`/communications/edit/${communication?.id}`)}
                                    disabled={!canEdit}
                                >
                                    Modifier la communication
                                </Button>
                            </span>
                        </Tooltip>
                        <Tooltip
                            label="L'envoi immédiat n'est possible que lorsque la communication est active."
                            withArrow
                            position="top"
                            disabled={canSendNow}
                        >
                            <span className="w-full">
                                <Button
                                    fullWidth
                                    color="teal"
                                    size="sm"
                                    leftSection={<IconSend size={15} />}
                                    onClick={handleSendNow}
                                    loading={isSendingNow}
                                    disabled={!canSendNow}
                                >
                                    Envoyer maintenant
                                </Button>
                            </span>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunicationDetailsTab;
