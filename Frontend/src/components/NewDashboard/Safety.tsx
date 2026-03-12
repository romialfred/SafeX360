import { Text, Button, Card } from '@mantine/core';
import { IconBook, IconSquareCheck as IconCheck } from '@tabler/icons-react';

const Safety = () => {
    return (
        <Card
            shadow="xl"
            padding="lg"
            radius="md"
            className="bg-white w-full h-[450px] flex gap-5 border border-gray-200"
        >
            <Text size="xl" fw={700} className="mb-4 !text-3xl">
                Featured Safety Training
            </Text>
            <div className="flex gap-2 items-center h-full">
                {/* Left Section with Embedded YouTube Video */}
                <div className="w-1/2 h-full flex items-center justify-center rounded-lg overflow-hidden">
                    <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/YAkLb42JUUw?si=_zXFjb6w8YW33XsR"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        className="rounded-lg"
                    ></iframe>
                </div>

                {/* Right Section */}
                <div className="w-1/2 flex flex-col p-8 gap-4">
                    <Text size="xl" fw={700}>
                        Essential Workplace Safety Guidelines
                    </Text>
                    <Text size="sm" color="dimmed" className="overflow-auto">
                        Stay updated with our latest safety protocols and best practices. This video covers essential workplace safety guidelines that every employee should know and follow.
                    </Text>

                    <div className="flex gap-4 mt-4">
                        <Button color="green" leftSection={<IconCheck size={18} />} fullWidth>
                            Mark as Complete
                        </Button>
                        <Button variant="outline" color="gray" leftSection={<IconBook size={18} />} fullWidth>
                            View Training Materials
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default Safety;
