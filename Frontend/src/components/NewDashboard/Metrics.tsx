
import { Text, Progress } from '@mantine/core';

const metricsData = [
    {
        title: 'Employee Training',
        progress: 92,
        target: 100,
        color: 'green',
    },
    {
        title: 'Safety Inspections',
        progress: 78,
        target: 80,
        color: 'yellow',
    },
    {
        title: 'Document Reviews',
        progress: 85,
        target: 90,
        color: 'yellow',
    },
    {
        title: 'Emergency Drills',
        progress: 95,
        target: 60,
        color: 'green',
    },
];
const Metrics = () => {
    return (
        <div className="flex flex-col  gap-6 shadow-2xl border border-gray-200 p-6 rounded-xl">

            <div>
                <p className='text-2xl font-semibold '>Compliance Metrics</p>
            </div>
            <div className='grid grid-cols-4 gap-4'>

                {metricsData.map((metric, index) => (
                    <div key={index} className="p-6 bg-white border border-gray-200 shadow-2xl rounded-2xl ">
                        {/* Heading */}


                        {/* Metric Card */}

                        <Text size="md" className="text-gray-700">
                            {metric.title}
                        </Text>

                        {/* Progress Bar */}
                        <Progress value={metric.progress} color={metric.color} size="lg" radius="md" className="my-3" />

                        {/* Target Info */}
                        <div className="flex justify-between text-gray-600 text-sm">
                            <Text>{metric.progress}%</Text>
                            <Text>Target: {metric.target}%</Text>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    )
}

export default Metrics