import { Button, Divider } from "@mantine/core";
import { IconArrowUpRight, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";

// Import images
import heroImg1 from "@/assets/img/Layout/hero-img-1.jpg";
import heroImg2 from "@/assets/img/Layout/hero-img-2.jpg";
import heroImg3 from "@/assets/img/Layout/hero-img-3.jpg";

const images = [heroImg1, heroImg2, heroImg3];

const cardData = [
    {
        title: "1. Manufacturing",
        count: "01/03",
        description: "Customized manufacturing solutions."
    },
    {
        title: "2. Construction",
        count: "02/03",
        description: "High-quality construction services."
    },
    {
        title: "3. Industrial Services",
        count: "03/03",
        description: "Reliable industrial solutions."
    }
];

const Hero = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const prevImage = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const nextImage = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="w-full min-h-screen overflow-hidden relative">
            {/* Background Image */}
            <div className="relative w-full min-h-screen">
                <img
                    src={images[currentIndex]}
                    alt="Hero Background"
                    className="w-full h-full object-cover"
                />

                {/* Hero Content */}
                <div className="absolute inset-0 flex flex-col gap-2 text-white p-30 justify-center items-start px-12">
                    <p className="text-lg uppercase">
                        Welcome to <span className="text-2xl font-extrabold text-blue-500 italic uppercase">Mine Xpert</span>
                    </p>
                    <h1 className="text-7xl leading-tight mt-4">
                        Innovative Manufacturing & Construction Solutions
                    </h1>
                    <p className="text-lg max-w-2xl mt-4">
                        We provide high-quality manufacturing, construction, and industrial services tailored to your business needs. With years of expertise, we deliver innovative solutions ensuring efficiency, safety, and sustainability.
                    </p>
                    <div>
                        <Button size="lg" className="mt-6 bg-blue-600 hover:bg-blue-700 transition-all duration-300 shadow-lg px-6 py-3 text-lg rounded-full">
                            Get a Quote
                        </Button>
                    </div>

                    {/* Chevron Icons */}
                    <div className="flex gap-4 mt-6">
                        <IconChevronLeft
                            size={50}
                            className="text-white bg-black/50 p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-all duration-300"
                            onClick={prevImage}
                        />
                        <IconChevronRight
                            size={50}
                            className="text-white bg-black/50 p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-all duration-300"
                            onClick={nextImage}
                        />
                    </div>
                </div>
            </div>

            <div className="flex ">
                {/* Statistics Section */}
                <div className="flex gap-20 p-10 ">
                    <div className="flex flex-col  gap-2">
                        <span className="text-7xl">15+ </span>
                        <span className="text-2xl text-gray-500">Awards</span>
                    </div>
                    <Divider size="sm" orientation="vertical" />
                    <div className="flex flex-col  gap-2">
                        <span className="text-7xl">1K+ </span>
                        <span className="text-2xl text-gray-500">Happy Clients</span>
                    </div>
                    <Divider size="sm" orientation="vertical" />
                    <div className="flex flex-col  gap-2">
                        <span className="text-7xl">10+</span>
                        <span className="text-2xl text-gray-500">Years of Expertise</span>
                    </div>
                </div>

                <div className="flex flex-col gap-5  shadow-2xl p-12 place-self-center bg-gray-100 w-[350px] absolute bottom-10 right-0 ">
                    <div className="flex justify-between">
                        <p className="text-primary text-lg">{cardData[currentIndex].title}</p>
                        <div>
                            <p className="text-gray-400"><span className="text-black">{cardData[currentIndex].count}</span></p>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold max-w-[200px]">{cardData[currentIndex].description}</p>
                    </div>
                    <Divider color="black" size="xs"></Divider>

                    <div className="flex justify-between">
                        <p className="text-lg">What we need</p>
                        <IconArrowUpRight size={50} className="text-white bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-hoverbg hover:text-primary transition-all duration-300" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;