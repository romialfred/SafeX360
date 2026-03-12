import { Tabs, Breadcrumbs, Text } from '@mantine/core';
import CommunicationDetailsTab from './CommunicationDetailsTab';
import CommunicationRecipientsPage from './CommunicationRecipientsPage';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCommunicationById } from '../../../services/CommunicationService';
import { getAllDepartments, getEmployeesWithPosition } from '../../../services/HrmsService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { GetAllWorkArea } from '../../../services/WorkAreaService';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import CommunicationNotificationHistory from './CommunicationNotificationHistory';

const CommunicationDetails = () => {
    const { id } = useParams(); // id string hogi (e.g. "COMM-001")

    const [communication, setCommunication] = useState<any>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [zoneMap, setZoneMap] = useState<Record<string, any>>({});
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(showOverlay());
        getCommunicationById(id).then((data) => {
            setCommunication(data);
            console.log(data);

        }).finally(() => {
            dispatch(hideOverlay());
        })
    }, [id]);

    useEffect(() => {
        getEmployeesWithPosition().then((data) => {
            setEmpMap(mapIdToName(data));
        });
        getAllDepartments().then((data) => {
            setDepartmentMap(mapIdToName(data));
        });
        GetAllWorkArea({}).then((data) => {
            setZoneMap(mapIdToName(data));
        });
    }, []);

    return (
        <div className='p-5'>
            <div>
                <div className="font-semibold text-2xl text-blue-500 w-fit">Communication Details</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/communications">
                        <Text variant="gradient">Employee Communications</Text>
                    </Link>
                    <Text variant="gradient">Communication Details</Text>
                </Breadcrumbs>
            </div>


            <Tabs defaultValue="details">
                <Tabs.List mb="md">
                    <Tabs.Tab value="details">Details</Tabs.Tab>
                    <Tabs.Tab value="recipients">Recipients</Tabs.Tab>
                    <Tabs.Tab value="notifications">Notification History</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="details" pt="md">
                    <CommunicationDetailsTab communication={communication} departmentMap={departmentMap} zoneMap={zoneMap} />


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
