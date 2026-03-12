import { Table, Text, Progress, Badge } from '@mantine/core';

const tasks = [
    {
        activity: 'Safety Inspection - Building A',
        type: 'Inspection',
        progress: 65,
        status: 'PENDING',
        progressColor: 'yellow',
    },
    {
        activity: 'Monthly Safety Meeting',
        type: 'Meeting',
        progress: 30,
        status: 'PENDING',
        progressColor: 'red',
    },
    {
        activity: 'Fire Drill Exercise',
        type: 'Training',
        progress: 80,
        status: 'PENDING',
        progressColor: 'green',
    },
];

const ActiveTasks = () => {
    return (
        <div className="p-6 flex flex-col gap-5 bg-white rounded-xl shadow-lg border border-gray-200 ">
            {/* Header */}
            <Text size="xl" fw={700} className="mb-4 text-gray-700">
                Active Tasks
            </Text>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                            <th className="text-left p-3 text-gray-600">Activity</th>
                            <th className="text-left p-3 text-gray-600">Type</th>
                            <th className="text-left p-3 text-gray-600">Progress</th>
                            <th className="text-left p-3 text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                        {tasks.map((task, index) => (
                            <tr key={index} className="border-b border-gray-300 hover:bg-gray-50 transition-all">
                                <td className="p-3  text-gray-600 font-medium">{task.activity}</td>
                                <td className="p-3 text-gray-600 font-medium">{task.type}</td>
                                <td className="p-3">
                                    <Progress value={task.progress} color={task.progressColor} size="md" radius="lg" />
                                    {/* <Text size="sm" ta="center" mt={4} className="font-medium">
                                        {task.progress}%
                                    </Text> */}
                                </td>
                                <td className="p-3">
                                    <Badge color="blue" size="md" variant="light">
                                        {task.status}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default ActiveTasks;
