import { Box, Card, Text, Image, Flex } from '@mantine/core';


interface CardType {
    icon: string;
    title: string;
    digits: string;
    bgcolor: string;
}

const topcards: CardType[] = [
    { icon: '', title: 'Employees', digits: '96', bgcolor: 'blue' },
    { icon: '', title: 'Clients', digits: '3,650', bgcolor: 'yellow' },
    { icon: '', title: 'Projects', digits: '356', bgcolor: 'grape' },
    { icon: '', title: 'Events', digits: '696', bgcolor: 'red' },
    { icon: '', title: 'Payroll', digits: '$96k', bgcolor: 'green' },
    { icon: '', title: 'Reports', digits: '59', bgcolor: 'cyan' },
];

const TopCards = () => {
    return (
        <Flex gap="md" justify="center" align="center" wrap="nowrap" className='!grid !grid-cols-6'>
            {topcards.map((topcard, i) => (
                <Card
                    key={i}
                    shadow="sm"
                    padding="md"
                    radius="md"
                    className="text-center"
                    bg={`${topcard.bgcolor}.1`}  // Light color variant
                >
                    <Box className="flex flex-col items-center">
                        <Image src={topcard.icon} alt={topcard.title} h={30} w={30} />
                        <Text color={`${topcard.bgcolor}.7`} mt="sm" size="sm" fw={500}>
                            {topcard.title}
                        </Text>
                        <Text color={`${topcard.bgcolor}.9`} size="sm" fw={500}>
                            {topcard.digits}
                        </Text>
                    </Box>
                </Card>
            ))}
        </Flex>
    );
};

export default TopCards;
