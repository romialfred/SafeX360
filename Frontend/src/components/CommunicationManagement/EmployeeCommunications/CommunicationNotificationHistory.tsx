import { useEffect, useMemo, useState } from 'react';
import { IconBellRinging } from '@tabler/icons-react';
import { getNotificationsByCommunication } from '../../../services/NotificationService';
import EmptyState from '../../UtilityComp/EmptyState';
import { SkeletonTable } from '../../UtilityComp/LoadingSkeleton';
import { formatDateTimeFr, isNotifFailure, notifStatusConfig } from '../communicationLabels';

/**
 * Onglet « Historique des envois » : journal des notifications générées pour
 * cette communication, de la plus récente à la plus ancienne.
 */

type NotificationHistoryProps = {
    communicationId?: number | string;
};

type NotificationItem = {
    id: number;
    communicationId: number;
    commTimeId: number | null;
    dedupedKey: string;
    status: string;
    responseMessage: string | null;
    createdAt: string;
    updatedAt: string | null;
};

const CommunicationNotificationHistory = ({ communicationId }: NotificationHistoryProps) => {
    const [data, setData] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        if (!communicationId) {
            setData([]);
            return;
        }

        setLoading(true);
        setLoadError(false);
        getNotificationsByCommunication(communicationId)
            .then((response) => {
                setData(response || []);
            })
            .catch(() => {
                setData([]);
                setLoadError(true);
            })
            .finally(() => setLoading(false));
    }, [communicationId]);

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [data]);

    if (!communicationId) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <EmptyState
                    icon={<IconBellRinging size={24} />}
                    title="Communication introuvable"
                    description="L'historique des envois n'a pas pu être rattaché à une communication."
                    compact
                />
            </div>
        );
    }

    return (
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
                    Historique des envois
                </h3>
                {!loading && sortedData.length > 0 && (
                    <span className="text-[11.5px] text-slate-500">
                        {sortedData.length} envoi{sortedData.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {loading ? (
                <SkeletonTable rows={5} cols={3} />
            ) : loadError ? (
                <EmptyState
                    icon={<IconBellRinging size={24} />}
                    title="Historique indisponible"
                    description="L'historique des envois n'a pas pu être chargé. Réessayez plus tard."
                    iconColor="rose"
                    compact
                />
            ) : sortedData.length === 0 ? (
                <EmptyState
                    icon={<IconBellRinging size={24} />}
                    title="Aucune notification générée"
                    description="Aucune notification n'a encore été envoyée pour cette communication."
                    compact
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-2 pr-4 text-[12px] font-medium text-slate-500 w-36">Statut</th>
                                <th className="py-2 pr-4 text-[12px] font-medium text-slate-500">Détail</th>
                                <th className="py-2 text-[12px] font-medium text-slate-500 w-44">Envoyée le</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedData.map((item) => {
                                const cfg = notifStatusConfig(item.status);
                                const failure = isNotifFailure(item.status);
                                const detail = failure
                                    ? item.responseMessage || "L'envoi de la notification a échoué."
                                    : item.responseMessage || 'Aucun détail complémentaire';
                                return (
                                    <tr key={item.id}>
                                        <td className="py-2 pr-4">
                                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className={`py-2 pr-4 text-[12.5px] ${failure ? 'text-rose-600' : 'text-slate-600'}`}>
                                            {detail}
                                        </td>
                                        <td className="py-2 text-[12.5px] text-slate-600">
                                            {formatDateTimeFr(item.createdAt)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CommunicationNotificationHistory;
