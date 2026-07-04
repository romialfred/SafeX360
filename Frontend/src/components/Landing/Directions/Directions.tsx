import { Button } from "@mantine/core";
import { IconMail, IconMapPin, IconPhonePlus } from "@tabler/icons-react";

// Import image
import mapImage from "@/assets/img/Layout/map-image.png";

const Directions = () => {
    return (
        <div className="flex gap-20 p-2">
            <div className="flex flex-col gap-10 w-fit p-5">
                <div className="flex flex-col gap-5">
                    <p className="text-2xl text-primary">Get Directions</p>
                    <p className="text-4xl max-w-[500px]">Our services reach industries worldwide</p>
                </div>

                <div className="flex flex-col gap-5 w-[390px] p-5 bg-gray-100 shadow-xl">
                    <div>
                        <p className="text-2xl">Chicago office</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2 cursor-pointer">
                            <IconPhonePlus size={30} className="text-primary" />
                            <span className="text-lg">(312)454-4362</span>
                        </div>

                        <div className="flex gap-2 cursor-pointer">
                            <IconMapPin size={30} className="text-primary" />
                            <span className="text-lg">56 W Sample St, Chicago, IL 60601</span>
                        </div>

                        <div className="flex gap-2 cursor-pointer">
                            <IconMail size={30} className="text-primary" />
                            <span className="text-lg">contact@datauniverse.bf</span>
                        </div>
                    </div>
                    <div>
                        <Button>Contact Us</Button>
                    </div>
                </div>
            </div>

            <div className="w-2/2 flex flex-col gap-5 p-5">
                <div>
                    <img src={mapImage} alt="Map" className="w-full h-auto rounded-lg" />
                </div>

                <div className="flex gap-4 items-center">
                    <p className="text-6xl font-extrabold">1000+</p>
                    <p className="text-2xl text-primary">Total employees working across our industries.</p>
                </div>
            </div>
        </div>
    );
};

export default Directions;