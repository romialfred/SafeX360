import { useEffect, useState } from 'react';
import { Button, Tabs } from '@mantine/core';
import { IconBell, IconInfoCircle, IconSend, IconUsers } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
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
                errorNotification(error?.response?.data?.errorMessage || "La notification n'a pas pu être chargée");
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
                    { label: 'Accueil', to: '/' },
                    { label: 'Communication Sécurité' },
                    { label: 'Centre de notifications', to: '/notifications' },
                    { label: 'Détail de la notification' },
                ]}
                icon={<IconBell size={22} stroke={2} />}
                iconColor="pink"
                title={notification?.title || 'Détail de la notification'}
                subtitle="Contenu de l'envoi, destinataires et état de livraison"
                badge={
                    statusCfg ? (
                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                            {statusCfg.label}
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
                            Voir la communication
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
                        title="Notification introuvable"
                        description="Cette notification n'existe pas ou n'est plus disponible dans le journal des envois."
                        compact
                        action={
                            <Button variant="default" size="xs" onClick={() => navigate('/notifications')}>
                                Retour au centre de notifications
                            </Button>
                        }
                    />
                </div>
            ) : (
                <Tabs defaultValue="details" color="teal">
                    <Tabs.List>
                        <Tabs.Tab value="details" leftSection={<IconInfoCircle size={15} />}>
                            Détails
                        </Tabs.Tab>
                        <Tabs.Tab value="recipients" leftSection={<IconUsers size={15} />}>
                            Destinataires
                        </Tabs.Tab>
                        <Tabs.Tab value="delivery" leftSection={<IconSend size={15} />}>
                            Livraison
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
