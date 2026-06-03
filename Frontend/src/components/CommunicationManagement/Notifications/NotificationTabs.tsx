import { Breadcrumbs, Button, Group, Tabs, Text } from "@mantine/core";
import { IconCheck, IconEdit, IconInfoCircle, IconSend, IconUsers } from "@tabler/icons-react";
import NotificationDetails from "./NotificationDetails";
import NotificationRecipients from "./NotificationRecipients";
import NotificationDelivery from "./NotificationDelivery";
import { Link, useParams } from "react-router-dom";
import { notificationsData } from "../../../Data/dummyData/communicationData";

const NotificationTabs = () => {
    const { id } = useParams(); // id string hogi (e.g. "COMM-001")

    const notification = notificationsData.find(
        (c) => c.id === id
    );
    if (!notification) {
        return <div>notification not found</div>;
    }
    return (
        <div>

            <div>
                <div className="text-2xl text-blue-500 w-fit">Notification Details</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/notifications">
                        <Text variant="gradient">Notifications Management</Text>
                    </Link>
                    <Text variant="gradient">Notification Details</Text>
                </Breadcrumbs>
            </div>

            <Group justify="space-between" mb="xl">


                <Group>

                    <Button
                        leftSection={<IconSend size={16} />}

                        color="green"
                    >
                        Send Now
                    </Button>

                    <Button
                        leftSection={<IconEdit size={16} />}
                        variant="outline"
                    >
                        Edit
                    </Button>
                </Group>
            </Group>

            <Tabs defaultValue="details">
                <Tabs.List>
                    <Tabs.Tab value="details" leftSection={<IconInfoCircle size={16} />}>
                        Details
                    </Tabs.Tab>
                    <Tabs.Tab value="recipients" leftSection={<IconUsers size={16} />}>
                        Recipients
                    </Tabs.Tab>
                    <Tabs.Tab value="delivery" leftSection={<IconCheck size={16} />}>
                        Delivery Status
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="details" pt="md">
                    <NotificationDetails notification={notification} />
                </Tabs.Panel>

                <Tabs.Panel value="recipients" pt="md">
                    <NotificationRecipients notification={notification} />
                </Tabs.Panel>

                <Tabs.Panel value="delivery" pt="md">
                    <NotificationDelivery notification={notification} />
                </Tabs.Panel>
            </Tabs>
        </div>
    )
}

export default NotificationTabs