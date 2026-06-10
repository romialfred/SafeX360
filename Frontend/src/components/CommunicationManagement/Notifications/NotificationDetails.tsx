import { Link } from 'react-router-dom';
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
    const statusCfg = notifStatusConfig(notification?.status);
    const urgencyCfg = urgencyConfig(notification?.urgency);
    const failure = isNotifFailure(notification?.status);
    const recipientsCount = parseRecipientIds(notification?.recipients).length;
    const departmentName =
        notification?.departmentId !== null && notification?.departmentId !== undefined
            ? departmentMap[String(notification.departmentId)]?.name ?? `Département ${notification.departmentId}`
            : null;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
            <div className="xl:col-span-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                        <div className="min-w-0">
                            <SectionTitle>{notification?.title || `Notification n° ${notification?.id}`}</SectionTitle>
                            <p className="text-[11.5px] text-slate-500 mt-0.5">{typeLabel(notification?.type)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${urgencyCfg.chip}`}>
                                {urgencyCfg.label}
                            </span>
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                {statusCfg.label}
                            </span>
                        </div>
                    </div>

                    <dl className="grid grid-cols-1 gap-0 text-[12.5px]">
                        <InfoRow label="Destinataires">
                            {recipientsCount > 0 ? `${recipientsCount} employé${recipientsCount > 1 ? 's' : ''}` : '—'}
                        </InfoRow>
                        {departmentName && <InfoRow label="Département">{departmentName}</InfoRow>}
                        {notification?.zoneName && <InfoRow label="Zone">{notification.zoneName}</InfoRow>}
                        <InfoRow label="Envoyée le">{formatDateTimeFr(notification?.createdAt)}</InfoRow>
                        {notification?.communicationId && (
                            <InfoRow label="Communication d'origine">
                                <Link
                                    to={`/communications/communications-details/${notification.communicationId}`}
                                    className="text-teal-700 hover:underline"
                                >
                                    Consulter la communication
                                </Link>
                            </InfoRow>
                        )}
                    </dl>
                </div>
            </div>

            <div className="xl:col-span-2">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>Retour du canal d'envoi</SectionTitle>
                    </div>
                    <p className={`text-[12.5px] leading-relaxed ${failure ? 'text-rose-600' : 'text-slate-600'}`}>
                        {notification?.responseMessage ||
                            (failure
                                ? "L'envoi de la notification a échoué. Aucun détail supplémentaire n'a été retourné."
                                : "Aucun détail complémentaire retourné par le canal d'envoi.")}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetails;
