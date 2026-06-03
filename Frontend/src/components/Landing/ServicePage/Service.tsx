import { Button } from "@mantine/core";
import ServiceCard from "./ServiceCard";
import { IconCrane, IconPlaneTilt, IconSettings, IconSun } from "@tabler/icons-react";
import serviceImg from "@/assets/img/Layout/service-img.jpg";
const Service = () => {
    const services = [
        { icon: <IconSun size={60} className="bg-primary p-4 rounded-4xl text-white group-hover:bg-hoverbg group-hover:text-primary" />, title: "Solar Energy", list: ["Solar Panel Installation", "Energy Storage", "System Maintenance"] },

        { icon: <IconSettings size={60} className="bg-primary p-4 rounded-4xl text-white group-hover:bg-hoverbg group-hover:text-primary" />, title: "Automotive", list: ["Parts Fabrication", "Parts Fabrication", "Vehicle Production"] },
        { icon: <IconCrane size={60} className="bg-primary p-4 rounded-4xl text-white group-hover:bg-hoverbg group-hover:text-primary" />, title: "Construction", list: ["Project Management", "Building Design", "Renovation Services"] },
        { icon: <IconPlaneTilt size={60} className="bg-primary p-4 rounded-4xl text-white group-hover:bg-hoverbg group-hover:text-primary" />, title: "Aviation", list: ["Wing Components", "Precision Engineering", "Quality Control"], }
    ];
    return (
        <div className="flex flex-col gap-5 p-20 bg-gray-100 r">
            <div className=" flex justify-between ">
                <div className="flex flex-col gap-2">
                    <p className="text-2xl text-primary">Our Services</p>
                    <h1 className="text-4xl max-w-[400px]">Tailored Solutions for Industry Growth</h1>

                </div>
                <div className="flex flex-col gap-4">
                    <p className="text-2xl max-w-[470px] text-gray-400">We offer a comprehensive range of services tailored to meet the unique needs.</p>
                    <div>
                        <Button>Our Service</Button>
                    </div>
                </div>
            </div>

            <div className="relative">
                <div className=" w-full h-[800px]">
                    <img src={serviceImg} alt="Service" className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-cols-4  flex-wrap justify-center absolute bottom-0   bg-gray-100/2 backdrop-blur-xs rounded-tl-sm">
                    {services.map((service, index) => (
                        <ServiceCard key={index} icon={service.icon} title={service.title} list={service.list} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Service