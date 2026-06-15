import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useMemo, useState } from 'react';
import { IconUsers } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import EmptyState from '../../UtilityComp/EmptyState';
import { getNotificationsByCommunication } from '../../../services/NotificationService';
import { notifStatusConfig, parseRecipientIds } from '../communicationLabels';

/**
 * Onglet « Destinataires » : liste des employés visés par la communication
 * et état du dernier envoi qui leur a été adressé.
 */

const CommunicationRecipientsPage = ({ communication, empMap }: any) => {
    const { t } = useTranslation('communications');
    // Libellé de statut bilingue : clé i18n, repli sur le libellé FR centralisé.
    const tNotifStatus = (status?: string | null) =>
        t(`notifStatus.${(status ?? '').toUpperCase()}`, { defaultValue: notifStatusConfig(status).label });
    const [latestNotificationStatus, setLatestNotificationStatus] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const communicationId = communication?.id;

        if (!communicationId) {
            setLatestNotificationStatus(null);
            return () => {
                isMounted = false;
            };
        }

        getNotificationsByCommunication(communicationId)
            .then((notifications) => {
                if (!isMounted) return;
                if (!Array.isArray(notifications) || notifications.length === 0) {
                    setLatestNotificationStatus(null);
                    return;
                }

                const normalized = notifications
                    .map((item: any) => ({
                        status: item?.status?.toString?.().toUpperCase?.() ?? null,
                        createdAt: item?.createdAt ?? null,
                    }))
                    .filter((item: { status: string | null }) => Boolean(item.status));

                if (!normalized.length) {
                    setLatestNotificationStatus(null);
                    return;
                }

                const successNotification = normalized.find((item) => item.status === 'SUCCESS');
                if (successNotification) {
                    setLatestNotificationStatus(successNotification.status);
                    return;
                }

                const latest = normalized.reduce((latestItem, currentItem) => {
                    const latestTime = latestItem?.createdAt ? new Date(latestItem.createdAt).getTime() : 0;
                    const currentTime = currentItem?.createdAt ? new Date(currentItem.createdAt).getTime() : 0;
                    return currentTime > latestTime ? currentItem : latestItem;
                });

                setLatestNotificationStatus(latest?.status ?? null);
            })
            .catch(() => {
                if (!isMounted) return;
                setLatestNotificationStatus(null);
            });

        return () => {
            isMounted = false;
        };
    }, [communication?.id]);

    const rows = useMemo(() => {
        return parseRecipientIds(communication?.recipients).map((recipientId: string) => ({
            id: recipientId,
            name: empMap[recipientId]?.name || t('recipientsPage.unknownEmployee'),
            department: empMap[recipientId]?.department || '—',
            position: empMap[recipientId]?.position || '—',
            sentStatus: latestNotificationStatus,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [communication, empMap, latestNotificationStatus, t]);

    const sentStatusBody = (row: any) => {
        if (!row.sentStatus) {
            return (
                <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-slate-600">
                    {t('recipientsPage.notSent')}
                </span>
            );
        }
        const cfg = notifStatusConfig(row.sentStatus);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {tNotifStatus(row.sentStatus)}
            </span>
        );
    };

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
                    {t('recipientsPage.title')}
                </h3>
                <span className="text-[11.5px] text-slate-500">
                    {t('recipientsPage.count', { count: rows.length })}
                </span>
            </div>

            {!rows.length ? (
                <EmptyState
                    icon={<IconUsers size={24} />}
                    title={t('recipientsPage.emptyTitle')}
                    description={t('recipientsPage.emptyDescription')}
                    compact
                />
            ) : (
                <DataTable
                    value={rows}
                    dataKey="id"
                    stripedRows
                    size="small"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate={t('recipientsPage.paginatorReport')}
                    emptyMessage={t('recipientsPage.emptyMessage')}
                >
                    <Column
                        field="name"
                        header={t('recipientsPage.colName')}
                        body={(row) => <span className="text-[13px] text-slate-800">{row.name}</span>}
                        sortable
                    />
                    <Column
                        field="department"
                        header={t('recipientsPage.colDepartment')}
                        body={(row) => <span className="text-[12.5px] text-slate-600">{row.department}</span>}
                        sortable
                    />
                    <Column
                        field="position"
                        header={t('recipientsPage.colPosition')}
                        body={(row) => <span className="text-[12.5px] text-slate-600">{row.position}</span>}
                        sortable
                    />
                    <Column
                        header={t('recipientsPage.colLastSend')}
                        body={sentStatusBody}
                        style={{ width: '9rem' }}
                        bodyStyle={{ textAlign: 'center' }}
                        headerStyle={{ textAlign: 'center' }}
                    />
                </DataTable>
            )}
        </div>
    );
};

export default CommunicationRecipientsPage;
