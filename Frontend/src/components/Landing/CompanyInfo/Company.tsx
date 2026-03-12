import { Button, Divider, Select, TextInput } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";


import solar1 from '@/assets/img/Layout/solar.jpg';
import solar2 from '@/assets/img/Layout/solar-2.jpg';
import solar3 from '@/assets/img/Layout/solar-3.jpg';

const images = [solar1, solar2, solar3];

const cardData = [
    {
        title: " Solar",
        count: "Solar Farm Development",
        description: " Forefront of renewable energy innovation, transforming sunlight into a sustainable power source."
    },
    {
        title: "Solar",
        count: "Solar Power Installation",
        description: "A step towards a greener future, solar power installation is a key component of modern energy solutions."
    },
    {
        title: "Aerospace",
        count: "Aerospace Tech Upgrade",
        description: "Advancing aerospace technology is revolutionizing travel with faster, safer, and more efficient solutions."
    }
];

const Company = () => {


    const [currentIndex, setCurrentIndex] = useState(0);

    const prevImage = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const nextImage = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };
    return (
        <div className="w-full  relative">

            <div className="relative w-full min-h-screen">
                <img
                    src={images[currentIndex]}
                    alt="Hero Background"
                    className="w-full h-[900px] object-cover"
                />

                {/* Hero Content */}
                <div className="absolute inset-0 flex  gap-2 text-white p-30 justify-between items-center px-12">

                    <div className="flex items-center gap-5">
                        <div>
                            <IconChevronLeft
                                size={50}
                                className="text-white bg-primary p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-all duration-300"
                                onClick={prevImage}
                            />
                        </div>


                        <div className="flex flex-col gap-2  ">





                            <h1 className="text-5xl font-bold leading-tight mt-4 hover:text-primary">
                                {cardData[currentIndex].count}
                            </h1>



                            <p className="text-2xl text-bg-gray-400 max-w-2xl mt-4">
                                {cardData[currentIndex].description}
                            </p>


                        </div>
                    </div>





                    {/* Chevron Icons Below Button */}
                    <div className="flex gap-4 ">

                        <IconChevronRight
                            size={50}
                            className="text-white bg-primary p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-all duration-300"
                            onClick={nextImage}
                        />
                    </div>
                </div>
            </div>
            <div>
                <div className="flex flex-col gap-5  shadow-2xl p-14  bg-primary w-[1100px]   absolute -bottom-10 right-0">
                    <div className="flex justify-between">
                        <p className="text-white text-4xl font-bold">Get your free quote today</p>

                    </div>

                    <Divider color="black" size="xs"></Divider>

                    <div className="flex justify-between items-end">
                        <TextInput label="Full Name" placeholder="Your Name" withAsterisk />
                        <TextInput label="Phone" placeholder="Your Phone Number" withAsterisk />
                        <Select label="Service Type:" placeholder="Select Your Service" withAsterisk data={['Manufacturing Solutions', 'Energy & Sustainbility', 'Maintenance & Support']} />
                        <div>
                            <Button color="white" className="!text-primary hover:!bg-hoverbg">Submit Details</Button>
                        </div>



                    </div>
                </div>
            </div>

        </div>
    )
}

export default Company