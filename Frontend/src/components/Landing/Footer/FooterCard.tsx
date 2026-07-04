
import { Divider } from "@mantine/core";
import {
    IconBrandFacebook,
    IconBrandInstagramFilled,
    IconBrandLinkedinFilled,
    IconBrandXFilled,
    IconPhoneCall,
    IconMail,
    IconMapPin,
} from "@tabler/icons-react";

const footerLinks = [
    {
        title: "Pages",
        links: ["Home", "About Us", "Services", "Services Single", "Blog"]
    },
    {
        title: "Sub Pages",
        links: ["Careers", "Projects", "Pricing", "Team", "Contact"]
    },
    {
        title: "Utility Pages",
        links: ["Style Guide", "Licenses", "Changelog", "Password Protected", "Not Found"]
    }
];

const contactInfo = [
    { icon: <IconPhoneCall size={20} className="text-primary" />, text: "+756 235 9043" },
    { icon: <IconMail size={20} className="text-primary" />, text: "contact@datauniverse.bf" },
    { icon: <IconMapPin size={20} className="text-primary" />, text: "KESWICK, South Australia (SA)" }
];

const socialIcons = [
    { icon: <IconBrandFacebook size={24} />, link: "#" },
    { icon: <IconBrandXFilled size={24} />, link: "#" },
    { icon: <IconBrandLinkedinFilled size={24} />, link: "#" },
    { icon: <IconBrandInstagramFilled size={24} />, link: "#" }
];
const FooterCard = () => {
    return (
        <footer className=" text-black py-12 px-10 flex flex-col gap-10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
                {footerLinks.map((section, index) => (
                    <div key={index} className="">
                        <h3 className="text-2xl mb-4">{section.title}</h3>
                        <ul className="space-y-6  ">
                            {section.links.map((link, idx) => (
                                <li key={idx}><a href="#" className="hover:text-primary text-xl">{link}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}

                <div>
                    <h3 className="text-2xl mb-4">Contact Us</h3>
                    {contactInfo.map((contact, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                            {contact.icon}
                            <p className="text-lg hover:text-primary ">{contact.text}</p>
                        </div>
                    ))}
                </div>
            </div>
            <Divider></Divider>
            {/* Footer Bottom */}
            <div className=" flex flex-col md:flex-row justify-between items-center">
                <p className=" text-2xl">Copyright © <span className="text-xl font-extrabold text-blue-500 uppercase" >Mine Xpert</span> </p>
                <div className="flex gap-5">
                    <a href="#" className="hover:text-primary underline">Terms & Condition</a>
                    <a href="#" className="hover:text-primary underline">Privacy Policy</a>
                </div>
                <div className="flex gap-4 mt-4 md:mt-0">
                    {socialIcons.map((social, index) => (
                        <a key={index} href={social.link} className="hover:text-primary">{social.icon}</a>
                    ))}
                </div>
            </div>
        </footer>
    )
}

export default FooterCard
