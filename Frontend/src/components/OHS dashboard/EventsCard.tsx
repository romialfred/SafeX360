import { Badge, Button } from "@mantine/core";
import { IconCalendarEvent, IconInfoCircle, IconMapPin, IconUser } from "@tabler/icons-react";
import dayjs from "dayjs";
import { type UpcomingEventDTO } from "../../services/EventService";

const typeLabels: Record<UpcomingEventDTO["type"], string> = {
    INSPECTION: "Inspection",
    AUDIT: "Audit",
    NON_CONFORMITY: "Non Conformity",
    NEAR_MISS: "Near Miss",
    HAZARD: "Hazard",
    HS_MEETING: "HS Meeting",
    STEERING_TOUR: "Steering Tour",
};

const typeColors: Record<UpcomingEventDTO["type"], { badge: string; indicator: string }> = {
    INSPECTION: { badge: "blue", indicator: "bg-blue-100" },
    AUDIT: { badge: "indigo", indicator: "bg-indigo-100" },
    NON_CONFORMITY: { badge: "red", indicator: "bg-red-100" },
    NEAR_MISS: { badge: "orange", indicator: "bg-orange-100" },
    HAZARD: { badge: "grape", indicator: "bg-grape-100" },
    HS_MEETING: { badge: "teal", indicator: "bg-teal-100" },
    STEERING_TOUR: { badge: "green", indicator: "bg-green-100" },
};

interface EventsCardProps {
    event: UpcomingEventDTO;
}

const EventsCard = ({ event }: EventsCardProps) => {
    const dateLabel = event.scheduledDate ? dayjs(event.scheduledDate).format("DD MMM YYYY") : "Date TBD";
    const description = event.description || "No additional description provided.";
    const location = event.location || "Location not specified";

    const label = typeLabels[event.type];
    const colors = typeColors[event.type];

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${colors.indicator}`} />
                    <Badge
                        leftSection={<IconUser size={14} />}
                        color={colors.badge}
                        variant="light"
                        radius="md"
                    >
                        {label}
                    </Badge>
                </div>
                {/* <Badge variant="outline" color="gray" radius="md">
                    ID #{event.id}
                </Badge> */}
            </div>

            <div className="space-y-2">
                <h3 className="text-lg text-gray-800 leading-tight">{event.title}</h3>
                <div dangerouslySetInnerHTML={{ __html: description }} className="text-sm text-gray-600 font-light line-clamp-3" />
            </div>

            <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                    <IconCalendarEvent size={16} className="text-gray-500" />
                    <span>{dateLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <IconMapPin size={16} className="text-gray-500" />
                    <span>{location}</span>
                </div>
            </div>

            <Button
                variant="light"
                color={colors.badge}
                size="sm"
                radius="md"
                leftSection={<IconInfoCircle size={16} />}
            >
                View details
            </Button>
        </div>
    );
};

export default EventsCard;
