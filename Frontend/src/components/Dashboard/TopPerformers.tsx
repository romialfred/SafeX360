import { Card, Table, Select, Avatar, Box, Text, Badge } from '@mantine/core';

const TopPerformers = () => {
    const performers = [
        { id: 1, name: 'John Doe', post: 'Manager', pname: 'Project X', status: 'High', budget: 50, imgsrc: '/avatar.png' },
        { id: 2, name: 'Jane Smith', post: 'Developer', pname: 'Project Y', status: 'Medium', budget: 30, imgsrc: './user-5.jpg' },
        { id: 3, name: 'Mark Taylor', post: 'Designer', pname: 'Project Z', status: 'Low', budget: 40, imgsrc: '/avatar5.png' },
        { id: 4, name: 'Alice Johnson', post: 'Team Lead', pname: 'Project A', status: 'High', budget: 60, imgsrc: '/avatar4.png' },
        { id: 5, name: 'Robert Brown', post: 'QA Engineer', pname: 'Project B', status: 'Medium', budget: 35, imgsrc: '/user-10.jpg' },
    ];

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder >
            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Box>
                    <Text size="lg" fw={700}>Top Projects</Text>
                    <Text size="sm" color="dimmed">Best Products</Text>
                </Box>
                <Select
                    data={[
                        { value: '1', label: 'March 2025' },
                        { value: '2', label: 'April 2025' },
                        { value: '3', label: 'May 2025' },
                    ]}
                    size="sm"
                />
            </Box>

            <Table mt="md" striped highlightOnHover>
                <thead style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                    <tr>
                        <th style={{ padding: '10px' }}>Assigned</th>
                        <th style={{ padding: '10px' }}>Project</th>
                        <th style={{ padding: '10px' }}>Priority</th>
                        <th style={{ padding: '10px' }}>Budget</th>
                    </tr>
                </thead>
                <tbody>
                    {performers.map((basic) => (
                        <tr key={basic.id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Avatar src={basic.imgsrc} alt={basic.name} radius="xl" size={40} />
                                <Box>
                                    <Text size="sm" fw={600}>{basic.name}</Text>
                                    <Text size="xs" color="dimmed">{basic.post}</Text>
                                </Box>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <Text size="sm" color="dimmed">{basic.pname}</Text>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <Badge
                                    color={
                                        basic.status === 'High' ? 'red' :
                                            basic.status === 'Medium' ? 'yellow' :
                                                basic.status === 'Low' ? 'green' : 'gray'
                                    }
                                    radius="md"
                                    size="sm"
                                >
                                    {basic.status}
                                </Badge>
                            </td>
                            <td style={{ padding: '15px', fontWeight: 600 }}>
                                <Text size="sm">${basic.budget}k</Text>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Card>
    );
};

export default TopPerformers;