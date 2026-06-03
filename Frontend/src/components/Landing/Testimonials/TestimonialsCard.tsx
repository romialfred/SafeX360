import { Avatar, Card, Divider, Text } from "@mantine/core";
import { IconStar } from "@tabler/icons-react";

interface ServiceCardProps {
    icon: React.ReactNode;
    name: string;
    position: string;
    feedback: string;
    rating: number;
    image: string;


}

import img from "@/assets/img/Layout/feedback-logo.svg";

const TestimonialsCard = ({ name, position, feedback, rating, image }: ServiceCardProps) => {
    return (
        <Card className="w-[550px] h-[400px] !p-12 !flex flex-col gap-5 !shadow-lg !hover:shadow-xl !transition-all !duration-300">
            <div className="flex justify-between">
                <div className="flex items-center  gap-4">
                    <Avatar src={image} radius="xl" size={70} />
                    <div>
                        <Text size="xl">{name}</Text>
                        <Text size="sm" color="dimmed">{position}</Text>
                    </div>
                </div>


                <div>
                    <img src={img} alt="" />
                </div>
            </div>
            <Text mt="md" size="xl" color="gray">{feedback}</Text>

            <Divider size="sm" mt={4} />
            <div className="flex gap-1 mt-3 text-yellow-400">
                {[...Array(Number(rating))].map((_, i) => (
                    <IconStar key={i} size={20} />
                ))}
            </div>
        </Card>
    );
};



export default TestimonialsCard