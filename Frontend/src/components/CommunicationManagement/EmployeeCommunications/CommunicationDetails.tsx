import { useEffect, useState } from 'react';
import { Tabs } from '@mantine/core';
import { IconBellRinging, IconInfoCircle, IconMessageCircle, IconUsers } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PageHeader from '../../UtilityComp/PageHeader';
import CommunicationDetailsTab from './CommunicationDetailsTab';
import CommunicationRecipientsPage from './CommunicationRecipientsPage';
import CommunicationNotificationHistory from './CommunicationNotificationHistory';
import { getCommunicationById } from '../../../services/CommunicationService';
import { getAllDepartments, getEmployeesWithPosition } from '../../../services/HrmsService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { GetAllWorkArea } from '../../../services/WorkAreaService';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { errorNotification } from '../../../utility/NotificationUtility';

/**
 * Fiche d'une communication HSE : détails et planification, destinataires,
 * historique des notifications générées.
 */

const CommunicationDetails = () => {
    const { id } = useParams();

    const [communication, setCommunication] = useState<any>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [zoneMap, setZoneMap] = useState<Record<string, any>>({});
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(showOverlay());
        getCommunicationById(id)
            .then((data) => {
                setCommunication(data ?? {});
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "La communication n'a pas pu être chargée");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        GetAllWorkArea({})
            .then((data) => setZoneMap(mapIdToName(data)))
            .catch(() => {
                // les noms de zones resteront vides
            });
    }, []);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Communication Sécurité' },
                    { label: 'Communications HSE', to: '/communications' },
                    { label: 'Détail de la communication' },
                ]}
                icon={<IconMessageCircle size={22} stroke={2} />}
                iconColor="pink"
                title={communication?.title || 'Détail de la communication'}
                subtitle="Contenu, planification, destinataires et historique des envois"
            />

            <Tabs defaultValue="details" color="teal">
                <Tabs.List>
                    <Tabs.Tab value="details" leftSection={<IconInfoCircle size={15} />}>
                        Détails
                    </Tabs.Tab>
                    <Tabs.Tab value="recipients" leftSection={<IconUsers size={15} />}>
                        Destinataires
                    </Tabs.Tab>
                    <Tabs.Tab value="notifications" leftSection={<IconBellRinging size={15} />}>
                        Historique des envois
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="details" pt="md">
                    <CommunicationDetailsTab
                        communication={communication}
                        departmentMap={departmentMap}
                        zoneMap={zoneMap}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="recipients" pt="md">
                    <CommunicationRecipientsPage communication={communication} empMap={empMap} />
                </Tabs.Panel>

                <Tabs.Panel value="notifications" pt="md">
                    <CommunicationNotificationHistory communicationId={communication?.id} />
                </Tabs.Panel>
            </Tabs>
        </div>
    );
};

export default CommunicationDetails;
