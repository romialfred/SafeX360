import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useMemo } from 'react';
import { IconUsers } from '@tabler/icons-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../UtilityComp/EmptyState';
import { notifStatusConfig, parseRecipientIds } from '../communicationLabels';

/**
 * Onglet « Destinataires » : employés visés par la notification, avec l'état
 * de l'envoi qui leur est associé.
 */

const NotificationRecipients = ({ notification, empMap }: any) => {
    const { t } = useTranslation('communications');
    // Libellés bilingues : clés i18n `communications:*`, repli sur les libellés FR centralisés.
    const tNotifStatus = (status?: string | null) =>
        t(`notifStatus.${(status ?? '').toUpperCase()}`, { defaultValue: notifStatusConfig(status).label });

    const rows = useMemo(() => {
        return parseRecipientIds(notification?.recipients).map((recipientId: string) => ({
            id: recipientId,
            name: empMap[recipientId]?.name || t('notificationsDetail.unknownEmployee'),
            department: empMap[recipientId]?.department || '—',
            position: empMap[recipientId]?.position || '—',
        }));
    }, [notification, empMap, t]);

    const statusCfg = notifStatusConfig(notification?.status);

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
                    {t('notificationsDetail.recipientsTitle')}
                </h3>
                <span className="text-[11.5px] text-slate-500">
                    {t('notificationsDetail.recipientsCount', { count: rows.length })}
                </span>
            </div>

            {!rows.length ? (
                <EmptyState
                    icon={<IconUsers size={24} />}
                    title={t('notificationsDetail.noRecipientsTitle')}
                    description={t('notificationsDetail.noRecipientsDescription')}
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
                    currentPageReportTemplate={t('notificationsDetail.paginatorReport')}
                    emptyMessage={t('notificationsDetail.emptyMessage')}
                >
                    <Column
                        field="name"
                        header={t('notificationsDetail.colName')}
                        body={(row) => <span className="text-[13px] text-slate-800">{row.name}</span>}
                        sortable
                    />
                    <Column
                        field="department"
                        header={t('notificationsDetail.colDepartment')}
                        body={(row) => <span className="text-[12.5px] text-slate-600">{row.department}</span>}
                        sortable
                    />
                    <Column
                        field="position"
                        header={t('notificationsDetail.colPosition')}
                        body={(row) => <span className="text-[12.5px] text-slate-600">{row.position}</span>}
                        sortable
                    />
                    <Column
                        header={t('notificationsDetail.colSendStatus')}
                        body={() => (
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                {tNotifStatus(notification?.status)}
                            </span>
                        )}
                        style={{ width: '9rem' }}
                        bodyStyle={{ textAlign: 'center' }}
                        headerStyle={{ textAlign: 'center' }}
                    />
                </DataTable>
            )}
        </div>
    );
};

export default NotificationRecipients;
