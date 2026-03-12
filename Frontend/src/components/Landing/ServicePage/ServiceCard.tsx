import { Text } from "@mantine/core";
import { IconCheck, IconChevronRight } from "@tabler/icons-react";

interface ServiceCardProps {
    icon: React.ReactNode;
    title: string;
    list: string[];
}

const ServiceCard = ({ icon, title, list }: ServiceCardProps) => {
    return (
        <div className="group w-[310px] h-[350px] border-blue-300   shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col p-1   hover:bg-primary hover:text-white ">
            {/* Top Icon */}
            <div className="flex p-4 ">{icon}</div>

            {/* Title with Check Icon */}
            <div className="flex flex-col gap-4 p-4 ">

                <p className="text-3xl font-bold text-white  ">{title}</p>

                {
                    list.map((x) => {
                        return <div className="flex items-center gap-2">
                            <IconCheck size={24} className="text-blue-400 group-hover:text-white" />
                            <Text size="xl" fw={500} color="white">{x}</Text>
                        </div>
                    })
                }



                <div className="flex items-center gap-2 text-white cursor-pointer ">
                    <Text size="md" fw={600}>Read More</Text>
                    <IconChevronRight size={20} className="bg-primary text-white rounded-3xl transtion group-hover:bg-hoverbg group-hover:text-primary" />
                </div>

            </div>



        </div>
    )
}

export default ServiceCard