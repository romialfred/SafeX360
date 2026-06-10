import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useMemo } from 'react';
import { IconUsers } from '@tabler/icons-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import EmptyState from '../../UtilityComp/EmptyState';
import { notifStatusConfig, parseRecipientIds } from '../communicationLabels';

/**
 * Onglet « Destinataires » : employés visés par la notification, avec l'état
 * de l'envoi qui leur est associé.
 */

const NotificationRecipients = ({ notification, empMap }: any) => {
    const rows = useMemo(() => {
        return parseRecipientIds(notification?.recipients).map((recipientId: string) => ({
            id: recipientId,
            name: empMap[recipientId]?.name || 'Employé inconnu',
            department: empMap[recipientId]?.department || '—',
            position: empMap[recipientId]?.position || '—',
        }));
    }, [notification, empMap]);

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
                    Liste des destinataires
                </h3>
                <span className="text-[11.5px] text-slate-500">
                    {rows.length} destinataire{rows.length > 1 ? 's' : ''}
                </span>
            </div>

            {!rows.length ? (
                <EmptyState
                    icon={<IconUsers size={24} />}
                    title="Aucun destinataire"
                    description="Cette notification ne référence aucun employé."
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
                    currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                    emptyMessage="Aucun destinataire."
                >
                    <Column
                        field="name"
                        header="Nom"
                        body={(row) => <span className="text-[13px] text-slate-800">{row.name}</span>}
                        sortable
                    />
                    <Column
                        field="department"
                        header="Département"
                        body={(row) => <span className="text-[12.5px] text-slate-600">{row.department}</span>}
                        sortable
                    />
                    <Column
                        field="position"
                        header="Poste"
                        body={(row) => <span className="text-[12.5px] text-slate-600">{row.position}</span>}
                        sortable
                    />
                    <Column
                        header="État de l'envoi"
                        body={() => (
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                {statusCfg.label}
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
