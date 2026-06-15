import { useEffect, useState } from 'react';
import { Button, Tabs } from '@mantine/core';
import { IconBell, IconInfoCircle, IconSend, IconUsers } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../UtilityComp/PageHeader';
import EmptyState from '../../UtilityComp/EmptyState';
import { SkeletonTable } from '../../UtilityComp/LoadingSkeleton';
import NotificationDetails from './NotificationDetails';
import NotificationRecipients from './NotificationRecipients';
import NotificationDelivery from './NotificationDelivery';
import { getNotifications } from '../../../services/NotificationService';
import { getAllDepartments, getEmployeesWithPosition } from '../../../services/HrmsService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { errorNotification } from '../../../utility/NotificationUtility';
import { notifStatusConfig } from '../communicationLabels';

/**
 * Fiche d'une notification : détails de l'envoi, destinataires et état de
 * livraison, alimentés par le journal réel des notifications.
 */

const NotificationTabs = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation('communications');
    // Libellés bilingues : clés i18n `communications:*`, repli sur les libellés FR centralisés.
    const tNotifStatus = (status?: string | null) =>
        t(`notifStatus.${(status ?? '').toUpperCase()}`, { defaultValue: notifStatusConfig(status).label });

    const [notification, setNotification] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});

    useEffect(() => {
        setLoading(true);
        getNotifications()
            .then((response) => {
                const found = (response ?? []).find((item: any) => String(item.id) === String(id));
                setNotification(found ?? null);
            })
            .catch((error: any) => {
                errorNotification(error?.response?.data?.errorMessage || t('notificationsDetail.loadError'));
                setNotification(null);
            })
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        getEmployeesWithPosition()
            .then((data) => setEmpMap(mapIdToName(data)))
            .catch(() => {
                // les noms d'employés resteront vides
            });
        getAllDepartments()
            .then((data) => setDepartmentMap(mapIdToName(data)))
            .catch(() => {
                // les noms de départements resteront vides
            });
    }, []);

    const statusCfg = notification ? notifStatusConfig(notification.status) : null;

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('breadcrumbs.home'), to: '/' },
                    { label: t('breadcrumbs.module') },
                    { label: t('breadcrumbs.notificationsCenter'), to: '/notifications' },
                    { label: t('notificationsDetail.breadcrumb') },
                ]}
                icon={<IconBell size={22} stroke={2} />}
                iconColor="pink"
                title={notification?.title || t('notificationsDetail.defaultTitle')}
                subtitle={t('notificationsDetail.subtitle')}
                badge={
                    statusCfg ? (
                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                            {tNotifStatus(notification?.status)}
                        </span>
                    ) : undefined
                }
                actions={
                    notification?.communicationId ? (
                        <Button
                            size="sm"
                            variant="default"
                            leftSection={<IconSend size={15} />}
                            onClick={() => navigate(`/communications/communications-details/${notification.communicationId}`)}
                        >
                            {t('notificationsDetail.viewCommunication')}
                        </Button>
                    ) : undefined
                }
            />

            {loading ? (
                <div aria-busy="true">
                    <SkeletonTable rows={6} cols={3} />
                </div>
            ) : !notification ? (
                <div className="bg-white rounded-xl border border-slate-200 p-2">
                    <EmptyState
                        icon={<IconBell size={24} />}
                        title={t('notificationsDetail.notFoundTitle')}
                        description={t('notificationsDetail.notFoundDescription')}
                        compact
                        action={
                            <Button variant="default" size="xs" onClick={() => navigate('/notifications')}>
                                {t('notificationsDetail.backToCenter')}
                            </Button>
                        }
                    />
                </div>
            ) : (
                <Tabs defaultValue="details" color="teal">
                    <Tabs.List>
                        <Tabs.Tab value="details" leftSection={<IconInfoCircle size={15} />}>
                            {t('notificationsDetail.tabDetails')}
                        </Tabs.Tab>
                        <Tabs.Tab value="recipients" leftSection={<IconUsers size={15} />}>
                            {t('notificationsDetail.tabRecipients')}
                        </Tabs.Tab>
                        <Tabs.Tab value="delivery" leftSection={<IconSend size={15} />}>
                            {t('notificationsDetail.tabDelivery')}
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="details" pt="md">
                        <NotificationDetails notification={notification} departmentMap={departmentMap} />
                    </Tabs.Panel>

                    <Tabs.Panel value="recipients" pt="md">
                        <NotificationRecipients notification={notification} empMap={empMap} />
                    </Tabs.Panel>

                    <Tabs.Panel value="delivery" pt="md">
                        <NotificationDelivery notification={notification} />
                    </Tabs.Panel>
                </Tabs>
            )}
        </div>
    );
};

export default NotificationTabs;
