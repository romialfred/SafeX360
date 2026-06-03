import { useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import TestimonialsCard from "./TestimonialsCard";

import slider1 from "@/assets/img/Layout/slider-1.jpg";
import slider2 from "@/assets/img/Layout/slider-2.jpg";
import slider3 from "@/assets/img/Layout/slider-3.jpg";
import slider4 from "@/assets/img/Layout/slider-4.jpg";

const testimonials = [
    {
        id: 1,
        name: "John Smith",
        position: "CEO",
        feedback: "“The team delivered outstanding solutions for our construction projects. Their expertise, commitment, and on-time delivery truly exceeded our expectations.”",
        rating: 5,
        image: slider1,
    },
    {
        id: 2,
        name: "Sarah Johnson",
        position: "Head of Procurement",
        feedback: "“This awesome team provided us with cost-effective and high-quality solutions. Their professionalism and attention to detail have made them an invaluable partner.”",
        rating: 4,
        image: slider2,
    },
    {
        id: 3,
        name: "Michael Lee",
        position: "Director of Manufacturing",
        feedback: "“We’ve been working with their company for years. Their industry knowledge and reliable support have been crucial to our continued success and growth.”",
        rating: 5,
        image: slider3,
    },
    {
        id: 4,
        name: "Emily Davis",
        position: "Operations Manager",
        feedback: "“The team offers outstanding service. We were able to increase productivity in every department and streamline operations thanks to their customized solutions.”",
        rating: 4,
        image: slider4,
    },

];

const Testimonials = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const itemsPerPage = 2; // Har slide me 2 testimonials dikhane ke liye

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + itemsPerPage) % testimonials.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? testimonials.length - itemsPerPage : prevIndex - itemsPerPage
        );
    };

    return (
        <div className="p-20 bg-gray-100 flex flex-col gap-20">
            <div>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-2xl text-primary">Client Feedback</p>
                    <h1 className="text-5xl ">Our clients trust us to deliver exceptional results</h1>
                </div>
            </div>

            {/* SLIDER CONTAINER */}
            <div className="relative w-full   overflow-hidden">
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${(currentIndex / itemsPerPage) * 100}%)` }}
                >
                    {testimonials.map((testimonial: any) => (
                        <div key={testimonial.id} className=" min-w-[630px] flex justify-center  ">
                            <TestimonialsCard {...testimonial} />
                        </div>
                    ))}
                </div>
            </div>

            {/* CHEVRON BUTTONS */}
            <div className="flex gap-4 justify-center ">
                <IconChevronLeft
                    size={50}
                    className="text-white bg-primary p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-all duration-300"
                    onClick={prevSlide}
                />
                <IconChevronRight
                    size={50}
                    className="text-white bg-primary p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-all duration-300"
                    onClick={nextSlide}
                />
            </div>
        </div>
    );
};

export default Testimonials;
