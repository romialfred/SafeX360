import { IconAlertTriangle, IconCircleCheck, IconHourglassHigh, IconUsers } from '@tabler/icons-react';
import KpiTile from '../../UtilityComp/KpiTile';
import {
    formatDateTimeFr,
    isNotifFailure,
    notifStatusConfig,
    parseRecipientIds,
} from '../communicationLabels';

/**
 * Onglet « Livraison » : état réel de l'envoi tel que retourné par le canal
 * de diffusion (réussite, attente ou échec).
 */

const DELIVERED_STATUSES = ['SUCCESS', 'SENT', 'DELIVERED', 'COMPLETED'];
const PENDING_STATUSES = ['PENDING', 'QUEUED', 'IN_PROGRESS', 'SENDING', 'SCHEDULED'];

const NotificationDelivery = ({ notification }: any) => {
    const statusCfg = notifStatusConfig(notification?.status);
    const status = (notification?.status ?? '').toUpperCase();
    const recipientsCount = parseRecipientIds(notification?.recipients).length;

    const isDelivered = DELIVERED_STATUSES.includes(status);
    const isPending = PENDING_STATUSES.includes(status);
    const isFailed = isNotifFailure(status);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile
                    label="Destinataires"
                    value={recipientsCount}
                    tone="slate"
                    icon={<IconUsers size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="Livraison réussie"
                    value={isDelivered ? recipientsCount : 0}
                    tone="green"
                    icon={<IconCircleCheck size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="En attente"
                    value={isPending ? recipientsCount : 0}
                    tone="violet"
                    icon={<IconHourglassHigh size={14} stroke={1.8} />}
                />
                <KpiTile
                    label="En échec"
                    value={isFailed ? recipientsCount : 0}
                    tone="rose"
                    icon={<IconAlertTriangle size={14} stroke={1.8} />}
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                    <h3
                        className="text-slate-800"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: '14px',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        État de livraison
                    </h3>
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                        {statusCfg.label}
                    </span>
                </div>

                <dl className="grid grid-cols-1 gap-0 text-[12.5px]">
                    <div className="flex items-start justify-between gap-3 py-1.5 border-t border-slate-100">
                        <dt className="text-slate-500 flex-shrink-0">Envoyée le</dt>
                        <dd className="text-slate-800 text-right">{formatDateTimeFr(notification?.createdAt)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3 py-1.5 border-t border-slate-100">
                        <dt className="text-slate-500 flex-shrink-0">Retour du canal</dt>
                        <dd className={`text-right ${isFailed ? 'text-rose-600' : 'text-slate-800'}`}>
                            {notification?.responseMessage ||
                                (isFailed
                                    ? "L'envoi a échoué sans détail complémentaire."
                                    : 'Aucun détail complémentaire.')}
                        </dd>
                    </div>
                </dl>

                <p className="text-[11.5px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    {isFailed
                        ? "Vérifiez la communication d'origine puis relancez un envoi depuis sa fiche (« Envoyer maintenant »)."
                        : isPending
                            ? "L'envoi est en cours de traitement : le statut sera mis à jour automatiquement."
                            : "La notification a été remise au canal de diffusion pour l'ensemble des destinataires."}
                </p>
            </div>
        </div>
    );
};

export default NotificationDelivery;
