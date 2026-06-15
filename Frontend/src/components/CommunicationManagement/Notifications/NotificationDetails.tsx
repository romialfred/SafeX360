import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    formatDateTimeFr,
    isNotifFailure,
    notifStatusConfig,
    parseRecipientIds,
    typeLabel,
    urgencyConfig,
} from '../communicationLabels';

/**
 * Onglet « Détails » : fiche de l'envoi (type, urgence, périmètre, message
 * de réponse du canal d'envoi et rattachement à la communication d'origine).
 */

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-3 py-1.5 border-t border-slate-100">
        <dt className="text-slate-500 flex-shrink-0">{label}</dt>
        <dd className="text-slate-800 text-right">{children}</dd>
    </div>
);

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

const NotificationDetails = ({ notification, departmentMap }: any) => {
    const { t } = useTranslation('communications');
    // Libellés bilingues : clés i18n `communications:*`, repli sur les libellés FR centralisés.
    const tType = (code?: string | null) => t(`type.${code ?? ''}`, { defaultValue: typeLabel(code) });
    const tNotifStatus = (status?: string | null) =>
        t(`notifStatus.${(status ?? '').toUpperCase()}`, { defaultValue: notifStatusConfig(status).label });
    const tUrgency = (urgency?: string | null) =>
        t(`urgency.${(urgency ?? '').toUpperCase()}`, { defaultValue: urgencyConfig(urgency).label });

    const statusCfg = notifStatusConfig(notification?.status);
    const urgencyCfg = urgencyConfig(notification?.urgency);
    const failure = isNotifFailure(notification?.status);
    const recipientsCount = parseRecipientIds(notification?.recipients).length;
    const departmentName =
        notification?.departmentId !== null && notification?.departmentId !== undefined
            ? departmentMap[String(notification.departmentId)]?.name ?? t('notificationsDetail.departmentFallback', { id: notification.departmentId })
            : null;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
            <div className="xl:col-span-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                        <div className="min-w-0">
                            <SectionTitle>{notification?.title || t('notificationsDetail.notificationNumber', { id: notification?.id })}</SectionTitle>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">{tType(notification?.type)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${urgencyCfg.chip}`}>
                                {tUrgency(notification?.urgency)}
                            </span>
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                {tNotifStatus(notification?.status)}
                            </span>
                        </div>
                    </div>

                    <dl className="grid grid-cols-1 gap-0 text-[12.5px]">
                        <InfoRow label={t('notificationsDetail.recipients')}>
                            {recipientsCount > 0 ? t('notificationsDetail.employeeCount', { count: recipientsCount }) : '—'}
                        </InfoRow>
                        {departmentName && <InfoRow label={t('notificationsDetail.department')}>{departmentName}</InfoRow>}
                        {notification?.zoneName && <InfoRow label={t('notificationsDetail.zone')}>{notification.zoneName}</InfoRow>}
                        <InfoRow label={t('notificationsDetail.sentAt')}>{formatDateTimeFr(notification?.createdAt)}</InfoRow>
                        {notification?.communicationId && (
                            <InfoRow label={t('notificationsDetail.originCommunication')}>
                                <Link
                                    to={`/communications/communications-details/${notification.communicationId}`}
                                    className="text-teal-700 hover:underline"
                                >
                                    {t('notificationsDetail.viewNotificationCommunication')}
                                </Link>
                            </InfoRow>
                        )}
                    </dl>
                </div>
            </div>

            <div className="xl:col-span-2">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>{t('notificationsDetail.channelResponseTitle')}</SectionTitle>
                    </div>
                    <p className={`text-[12.5px] leading-relaxed ${failure ? 'text-rose-600' : 'text-slate-600'}`}>
                        {notification?.responseMessage ||
                            (failure
                                ? t('notificationsDetail.channelResponseFailure')
                                : t('notificationsDetail.channelResponseEmpty'))}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetails;
