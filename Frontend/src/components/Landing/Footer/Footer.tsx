import { Button, TextInput } from "@mantine/core";
import {
    IconBrandFacebook,
    IconBrandInstagramFilled,
    IconBrandLinkedinFilled,
    IconBrandXFilled,
} from "@tabler/icons-react";
import FooterCard from "./FooterCard";

// Import the image
import footerImage from "@/assets/img/Layout/footer.jpg";

const Footer = () => {
    return (
        <div className="grid grid-col-2">
            <div className="relative grid grid-cols-3">
                <div className="h-[490px] w-full relative">
                    <img src={footerImage} alt="Footer" className="w-full h-full object-cover" />
                </div>

                <div className="absolute top-0 left-0 w-full h-full flex flex-col px-4 p-30 text-white bg-black/50 backdrop-blur-md gap-10">
                    <h1 className="text-5xl font-bold uppercase text-blue-500">Mine Xpert</h1>
                    <p className="text-xl max-w-[400px]">
                        Crafted with care and precision to deliver unmatched quality, innovation, and excellence in industrial services worldwide.
                    </p>

                    <div className="flex gap-1">
                        <a href="#" className="text-3xl bg-gray-500/30 p-2 hover:bg-primary transition-all"><IconBrandFacebook size={30} /></a>
                        <a href="#" className="bg-gray-500/30 p-2 hover:bg-primary transition-all"><IconBrandXFilled size={30} /></a>
                        <a href="#" className="text-3xl bg-gray-500/30 p-2 hover:bg-primary transition-all"><IconBrandLinkedinFilled size={30} /></a>
                        <a href="#" className="text-3xl bg-gray-500/30 p-2 hover:bg-primary transition-all"><IconBrandInstagramFilled stroke={2} size={30} /></a>
                    </div>
                </div>

                {/* Floating Card on Image */}
                <div className="absolute top-[-50px] right-10 w-[60%] h-[350px] bg-primary text-white p-10 shadow-lg flex flex-col gap-15">
                    <div className="max-w-[400px]">
                        <h2 className="text-5xl font-bold">Transform Your Space with Us!</h2>
                    </div>

                    <div>
                        <TextInput placeholder="Subscribe to our newsletter " size="xl" className="w-full "
                            rightSection={
                                <div className="flex items-center h-full pr-10">
                                    <Button size="sm" className="bg-primary text-white">Send</Button>
                                </div>
                            }
                        />
                    </div>
                </div>
            </div>

            <div>
                <FooterCard />
            </div>
        </div>
    );
};

export default Footer;