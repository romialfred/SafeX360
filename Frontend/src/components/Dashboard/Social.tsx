
import { Card, Box, Text, Group, ActionIcon } from '@mantine/core';
import { IconMessage2 } from '@tabler/icons-react';
import { Link } from 'react-router-dom';


const Social = () => {
    return (
        <Card shadow="sm" p="lg" radius="md" withBorder >
            <Group gap="md" align="center" style={{ display: 'flex', flexWrap: 'nowrap' }}>
                {/* <Avatar src={ProfileImg} alt="Profile" size={70} radius="md" /> */}
                <Box>
                    <Text size="lg">Super awesome, Vue coming soon!</Text>
                    <Text size="sm" color="dimmed">22 March, 2025</Text>
                </Box>
            </Group>

            <Box mt="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box style={{ display: 'flex', gap: '8px' }}>
                    {/* <Avatar src={User1Img} alt="User 1" size={36} radius="xl" />
                    <Avatar src={User2Img} alt="User 2" size={36} radius="xl" />
                    <Avatar src={User3Img} alt="User 3" size={36} radius="xl" />
                    <Avatar src={User4Img} alt="User 4" size={36} radius="xl" /> */}
                </Box>
                <Link to="/">
                    <ActionIcon size={40} variant="light" color="blue" radius="md">
                        <IconMessage2 size={22} />
                    </ActionIcon>
                </Link>
            </Box>
        </Card>
    );
};

export default Social;