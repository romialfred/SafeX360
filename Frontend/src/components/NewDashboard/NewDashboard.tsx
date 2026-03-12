import { Text, Progress } from '@mantine/core';
import { IconCalendarWeek, IconCircleOff, IconStopwatch, IconSquareCheck } from '@tabler/icons-react';

const cardData = [
    {
        icon: <div className="bg-green-200 p-3 rounded-full"><IconCalendarWeek size={30} className="text-green-700" /></div>,
        incident: "Days Without Incident",
        target: 180,
        days: 145,
        increment: "+12 days",
        label: "Consecutive days without recordable incidents",
        progress: 80,
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        progressColor: "green",
        incrementColor: "text-green-700"
    },
    {
        icon: <div className="bg-red-200 p-3 rounded-full"><IconCircleOff size={30} className="text-red-700" /></div>,
        incident: "Lost Time Injury Rate",
        target: 2,
        days: 2.5,
        increment: "-0.3 vs last month",
        label: "Injuries resulting in lost work time per 100 workers",
        progress: 75,
        bgColor: "bg-red-100",
        textColor: "text-red-700",
        progressColor: "red",
        incrementColor: "text-red-700"
    },
    {
        icon: <div className="bg-yellow-200 p-3 rounded-full"><IconStopwatch size={30} className="text-yellow-700" /></div>,
        incident: "Mean Time to Resolution",
        target: 3,
        days: 4.2,
        increment: "+0.8 days",
        label: "Average days to implement corrective actions",
        progress: 85,
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-700",
        progressColor: "yellow",
        incrementColor: "text-yellow-700"
    },
    {
        icon: <div className="bg-green-200 p-3 rounded-full"><IconSquareCheck size={30} className="text-green-700" /></div>,
        incident: "Safety Training Completion",
        target: 95,
        days: 94,
        increment: "+2% vs target",
        label: "Percentage of completed mandatory safety training",
        progress: 90,
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        progressColor: "green",
        incrementColor: "text-green-700"
    }
];

const IncidentCards = () => {
    return (
        cardData.map((card, index) => (
            <div key={index} className={`${card.bgColor} ${card.textColor} rounded-lg shadow-xl p-5 flex flex-col gap-4`}>
                <div className='flex justify-between'>
                    <div>{card.icon}</div>
                    <Text size="lg" fw={700}>Target: {card.target}</Text>
                </div>
                <Text mt="md" size="xl" fw={700}>{card.incident}</Text>

                <div className='flex gap-2 items-center'>
                    <Text size="xl" fw={500}>{card.days}</Text>
                    <Text className={card.incrementColor} size="sm">{card.increment}</Text>
                </div>

                <Text size="sm" color="dimmed">{card.label}</Text>
                <Progress color={card.progressColor} value={card.progress} mt="md" />
            </div>
        ))
    );
};

const NewDashboard = () => {
    return (
        <div className='flex flex-col gap-10'>
            {/* <div className="flex justify-between ">
                <div>
                    <p className="text-3xl font-bold text-blue-500 uppercase">Mine Xpert</p>
                </div>
                <div className="flex gap-4">
                    <Button leftSection={<IconAlertTriangle stroke={2} />} color="red">Report Incidents</Button>
                    <Button leftSection={<IconSearch stroke={2} />} className="!bg-home">Start Inspection</Button>
                </div>
            </div> */}

            <div className='grid grid-cols-4 gap-5'>
                <IncidentCards />
            </div>
        </div>
    );
};

export default NewDashboard;