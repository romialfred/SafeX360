import { Carousel } from "@mantine/carousel";
import { Alert, Center, Loader, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconCalendarPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getUpcomingEvents, type UpcomingEventDTO } from "../../services/EventService";
import EventsCard from "./EventsCard";

const UpcomingEvents = () => {
    const [events, setEvents] = useState<UpcomingEventDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getUpcomingEvents()
            .then((response) => {
                if (!isMounted) return;
                setEvents(Array.isArray(response) ? response : []);
            })
            .catch(() => {
                if (!isMounted) return;
                setError("Unable to load upcoming events. Please try again later.");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-50 text-red-600 p-2">
                    <IconCalendarPlus size={22} />
                </div>
                <div>
                    <h1 className="text-2xl text-gray-700">Upcoming OH&S Events</h1>
                    <Text size="sm" c="gray.6">Stay aligned with the next inspections, audits, and key H&S activities.</Text>
                </div>
            </div>

            {loading && (
                <Center h={220}>
                    <Loader color="red" />
                </Center>
            )}

            {!loading && error && (
                <Alert color="red" radius="md">
                    {error}
                </Alert>
            )}

            {!loading && !error && events.length === 0 && (
                <Center h={180}>
                    <Text size="sm" c="gray.6">No upcoming events found. Check back soon.</Text>
                </Center>
            )}

            {!loading && !error && events.length > 0 && (
                <div className="mt-1 group relative">
                    <Carousel
                        slideSize={{ base: "100%", md: "50%", lg: "33.3333%" }}
                        slideGap="md"
                        align="start"
                        loop={events.length > 3}
                        controlSize={48}
                        nextControlIcon={<IconChevronRight size={32} />}
                        previousControlIcon={<IconChevronLeft size={32} />}
                        classNames={{
                            control: 'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                        }}
                        styles={{
                            control: {
                                backgroundColor: '#dc2626',
                                color: 'white',
                                borderRadius: '9999px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            },
                        }}
                    >
                        {events.map((event) => (
                            <Carousel.Slide key={event.id}>
                                <EventsCard event={event} />
                            </Carousel.Slide>
                        ))}
                    </Carousel>
                </div>
            )}
        </div>
    );
};

export default UpcomingEvents;
