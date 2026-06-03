import { Button, Divider } from "@mantine/core";
import { IconBulb, IconTargetArrow } from "@tabler/icons-react";

// Import image for Vite optimization
import missionImage from "@/assets/img/Layout/mission-image.jpg";

const MissionPage = () => {
    return (
        <div className="flex relative">
            {/* Left Side - Background Image */}
            <div className="relative w-1/2">
                <img src={missionImage} alt="Mission" className="w-full h-full object-cover" />
            </div>

            {/* Right Side Content */}
            <div className="flex flex-col gap-5 w-1/2 relative">
                <div className="p-10 flex flex-col gap-4">
                    <p className="text-primary text-2xl">Core Values</p>
                    <h1 className="text-4xl">Trusted Global Partner for Manufacturing and Construction</h1>
                    <p className="text-xl text-gray-500">With a wealth of experience and a strong commitment to excellence, we have consistently built a reputation as a trusted partner for businesses worldwide.</p>
                    <div>
                        <Button>Core Values</Button>
                    </div>
                </div>

                {/* Cards Section */}
                <div className="flex">
                    {/* Floating 25+ Years of Experience Card on Image */}
                    <div className="absolute right-174 p-10 flex flex-col items-center text-white shadow-lg bg-gray-500/50 backdrop-blur-md rounded-tl-sm w-[310px] h-[244px]">
                        <p className="text-9xl text-primary">25</p>
                        <p className="text-2xl">Years of Experience</p>
                    </div>

                    <div className="flex bg-gray-100">
                        <div className="flex flex-col gap-4 p-10 items-center">
                            <div>
                                <IconTargetArrow size={50} stroke={1} className="text-primary" />
                            </div>
                            <h1 className="text-2xl">Our mission</h1>
                            <p className="text-gray-500">Empowering businesses with high-quality services for sustainable growth.</p>
                        </div>
                        <Divider size="sm" orientation="vertical" />
                        <div className="flex flex-col gap-4 p-10 items-center">
                            <div>
                                <IconBulb className="text-primary" size={50} stroke={1} />
                            </div>
                            <h1 className="text-2xl">Our vision</h1>
                            <p className="text-base font-normal text-gray-500">To lead globally in industrial services, with new standards.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MissionPage;