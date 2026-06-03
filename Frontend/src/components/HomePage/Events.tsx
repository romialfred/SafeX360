import { useState } from "react";
import { Text, Menu, Button, Card, Image, Group, Stack } from "@mantine/core";
import { IconCalendar, IconCalendarTime, IconFilter, IconMapPin, IconUsers } from "@tabler/icons-react";
import img1 from "@/assets/img/Dashboard/HomeImage.jpeg";
import img2 from "@/assets/img/Dashboard/home2.jpeg";
import img3 from "@/assets/img/Dashboard/home3.jpeg";
import img4 from "@/assets/img/Dashboard/home4.jpeg";
const eventData = [
    {
        title: "Annual Safety Summit 2024",
        category: "Training",
        date: "April 15, 2024",
        location: "Main Conference Hall",
        attendees: "150 attendees",
        image: img1
    },
    {
        title: "Leadership Workshop",
        category: "Workshop",
        date: "April 20, 2024",
        location: "Training Center B",
        attendees: "45 attendees",
        image: img2
    },
    {
        title: "Team Building Day",
        category: "Team Event",
        date: "April 25, 2024",
        location: "Recreation Center",
        attendees: "200 attendees",
        image: img3
    },
    {
        title: "Environmental Awareness Session",
        category: "Training",
        date: "May 2, 2024",
        location: "Auditorium",
        attendees: "120 attendees",
        image: img4
    },
];

const Events = () => {
    const [selectedFilter, setSelectedFilter] = useState("All Events");
    const filterOptions = ["All Events", "Workshops", "Training", "Team Event"];

    return (
        <Card shadow="lg" radius="md" p="lg" withBorder className="">
            {/* Header Section */}
            <div className="flex gap-5 items-center mb-6">
                <div className="flex items-center gap-3">
                    <IconCalendarTime size={30} className="text-orange-500" />
                    <Text size="lg" className="text-gray-900">
                        Upcoming Events
                    </Text>
                </div>

                <Menu shadow="md" width={180}>
                    <Menu.Target>
                        <Button variant="light" leftSection={<IconFilter size={18} />}>
                            {selectedFilter}
                        </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {filterOptions.map((option, index) => (
                            <Menu.Item key={index} onClick={() => setSelectedFilter(option)}>
                                {option}
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-4 gap-5">
                {eventData.map((event, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">

                        {/* Event Image */}
                        <Image
                            src={event.image}
                            height={180}
                            width="100%"
                            alt="Event Image"
                            className="object-cover"
                        />

                        {/* Event Details */}
                        <Stack p="md" className="flex-grow">
                            <Text size="md" className="text-gray-900">
                                {event.title}
                            </Text>
                            <Text size="sm" className="!text-blue-600 !bg-hoverbg !p-2 w-fit !rounded-4xl">
                                {event.category}
                            </Text>

                            {/* Event Info with Icons */}
                            <Stack>
                                <Group gap="xs">
                                    <IconCalendar size={16} className="text-gray-500" />
                                    <Text size="xs" className="text-gray-700">
                                        {event.date}
                                    </Text>
                                </Group>
                                <Group gap="xs">
                                    <IconMapPin size={16} className="text-gray-500" />
                                    <Text size="xs" className="text-gray-700">
                                        {event.location}
                                    </Text>
                                </Group>
                                <Group gap="xs">
                                    <IconUsers size={16} className="text-gray-500" />
                                    <Text size="xs" className="text-gray-700">
                                        {event.attendees}
                                    </Text>
                                </Group>
                            </Stack>
                            <Button fullWidth variant="filled" color="primary" className="mt-auto p-2">
                                Register Now
                            </Button>
                        </Stack>

                        {/* Register Now Button (Full Width & Bottom) */}

                    </div>
                ))}
            </div>
        </Card>
    );
};

export default Events;
