import {
    Button,
    Group,
    Modal,
    SegmentedControl,
    Select,
    Text,
    TextInput,
    Title,
    Divider,
    Box,
    Stack,
    ThemeIcon,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconPointFilled, IconCirclePlus, IconInfoCircle } from '@tabler/icons-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState } from 'react';

type EventType = {
    title: string;
    start: string;
    end?: string;
    type: string;
};

const Calendar = () => {
    const [category, setCategory] = useState('all');
    const [events, setEvents] = useState<EventType[]>([
        { title: 'Team Sync', start: '2025-05-10', type: 'meetings' },
        { title: 'Strategy Meeting', start: '2025-05-15', end: '2025-05-16', type: 'meetings' },
        { title: 'Client Meeting', start: '2025-05-23', type: 'meetings' },
        { title: 'Internal Audit', start: '2025-05-06', type: 'audits' },
        { title: 'Audit Review', start: '2025-05-21', type: 'audits' },
        { title: 'Annual Safety Audit', start: '2025-05-12', end: '2025-05-17', type: 'audits' },
        { title: 'Safety Inspection', start: '2025-05-09', type: 'inspections' },
        { title: 'Site Inspection', start: '2025-05-14', end: '2025-05-15', type: 'inspections' },
        { title: 'Equipment Check', start: '2025-05-29', type: 'inspections' },
        { title: 'Fire Drill', start: '2025-05-05', type: 'drills' },
        { title: 'Evacuation Drill', start: '2025-05-24', type: 'drills' },
    ]);

    const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);

    const [newEvent, setNewEvent] = useState<{
        title: string;
        start: Date | null;
        end: Date | null;
        type: string;
    }>({
        title: '',
        start: null,
        end: null,
        type: '',
    });

    const options = [
        { label: 'All', value: 'all', color: '#9ca3af' },
        { label: 'Meetings', value: 'meetings', color: '#60a5fa' },
        { label: 'Audits', value: 'audits', color: '#c084fc' },
        { label: 'Inspections', value: 'inspections', color: '#4ade80' },
        { label: 'Drills', value: 'drills', color: '#fbbf24' },
    ];

    const filteredEvents =
        category === 'all'
            ? events
            : events.filter((event) => event.type === category);

    const handleDateClick = (arg: any) => {
        setNewEvent({
            title: '',
            start: new Date(arg.dateStr),
            end: null,
            type: '',
        });
        setAddModalOpen(true);
    };

    const handleEventClick = (arg: any) => {
        const event = events.find(
            (e) => e.title === arg.event.title && e.start === arg.event.startStr
        );
        if (event) {
            setSelectedEvent(event);
            setViewModalOpen(true);
        }
    };

    const handleAddEvent = () => {
        if (newEvent.title && newEvent.start && newEvent.type) {
            const formattedStart = newEvent.start.toISOString().split('T')[0];
            const formattedEnd = newEvent.end?.toISOString().split('T')[0];

            const eventToAdd: EventType = {
                title: newEvent.title,
                start: formattedStart,
                end: formattedEnd,
                type: newEvent.type,
            };

            setEvents((prev) => [...prev, eventToAdd]);
            setAddModalOpen(false);
        }
    };

    return (
        <Box>
            {/* Filter Bar */}
            <SegmentedControl
                fullWidth
                className="my-4"
                value={category}
                onChange={setCategory}
                data={options.map((opt) => ({
                    label: (
                        <Group gap={6}>
                            <IconPointFilled size={16} color={opt.color} />
                            <div>{opt.label}</div>
                        </Group>
                    ),
                    value: opt.value,
                }))}
                autoContrast
                color={options.find((opt) => opt.value === category)?.color}
            />

            {/* Calendar Section */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 space-y-5">
                <Group justify="space-between">
                    <Title order={3} className="text-gray-800">📅 Monthly Overview</Title>
                    <Group gap="xs">
                        {options.slice(1).map((opt) => (
                            <Group key={opt.value} gap={5}>
                                <IconPointFilled size={16} color={opt.color} />
                                <Text size="sm">{opt.label}</Text>
                            </Group>
                        ))}
                    </Group>
                </Group>

                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    height={550}
                    selectable
                    events={filteredEvents.map((event) => ({
                        title: event.title,
                        start: event.start,
                        end: event.end,
                        color:
                            options.find((opt) => opt.value === event.type)?.color ||
                            '#9ca3af',
                        textColor: '#000000',
                    }))}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                />
            </div>

            {/* View Modal */}
            <Modal
                opened={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title={
                    <Group>
                        <ThemeIcon color="blue" size={30}>
                            <IconInfoCircle size={20} />
                        </ThemeIcon>
                        <Text>Event Details</Text>
                    </Group>
                }
                centered
                radius="lg"
                size="md"
            >
                {selectedEvent && (
                    <Stack gap="xs" mt="sm">
                        <Divider label="General Info" />
                        <Text><strong>📌 Title:</strong> {selectedEvent.title}</Text>
                        <Text><strong>📅 Start:</strong> {selectedEvent.start}</Text>
                        {selectedEvent.end && (
                            <Text><strong>📅 End:</strong> {selectedEvent.end}</Text>
                        )}
                        <Text><strong>🏷️ Type:</strong> {selectedEvent.type}</Text>
                    </Stack>
                )}
            </Modal>

            {/* Add Modal */}
            <Modal
                opened={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                title={
                    <Group>
                        <ThemeIcon color="green" size={30}>
                            <IconCirclePlus size={20} />
                        </ThemeIcon>
                        <Text>Add New Event</Text>
                    </Group>
                }
                centered
                radius="lg"
                size="md"
            >
                <Stack mt="sm" gap="xs">
                    <TextInput
                        label="📌 Title"
                        placeholder="Enter event title"
                        value={newEvent.title}
                        onChange={(e) =>
                            setNewEvent({ ...newEvent, title: e.currentTarget.value })
                        }
                        required
                    />
                    <DateInput
                        label="📅 Start Date"
                        placeholder="Select start date"
                        value={newEvent.start}
                        onChange={(date) => setNewEvent({ ...newEvent, start: date })}
                        required
                    />
                    <DateInput
                        label="📅 End Date (optional)"
                        placeholder="Select end date"
                        value={newEvent.end}
                        onChange={(date) => setNewEvent({ ...newEvent, end: date })}
                    />
                    <Select
                        label="🏷️ Event Type"
                        placeholder="Choose type"
                        data={options.slice(1).map((opt) => ({
                            label: opt.label,
                            value: opt.value,
                        }))}
                        value={newEvent.type}
                        onChange={(value) =>
                            setNewEvent({ ...newEvent, type: value || '' })
                        }
                        required
                    />

                    <Group justify="flex-end" mt="md">
                        <Button onClick={handleAddEvent} leftSection={<IconCirclePlus size={16} />}>
                            Add Event
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Box>
    );
};

export default Calendar;