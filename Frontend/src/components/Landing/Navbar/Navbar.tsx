import { Button, Popover } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
    const [opened, setOpened] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    // Detect Scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all ${scrolled ? "bg-white/20 backdrop-blur-lg shadow-md rounded-t-2xl" : "bg-white/20 backdrop-blur-md rounded-t-sm"}`}
        >
            <div className="flex justify-between items-center p-4 ">
                {/* Logo */}
                <div>
                    <h1 className="text-2xl font-extrabold text-blue-500 italic uppercase">Mine Xpert</h1>
                </div>

                {/* Navigation Links */}
                <nav className="flex gap-5">
                    {["Home", "About Us", "Services", "Projects"].map((item) => (
                        <li
                            key={item}
                            className="list-none text-lg font-medium cursor-pointer px-4 py-2 hover:text-primary"

                        >
                            {item}
                        </li>
                    ))}

                    {/* Pages Dropdown */}
                    <Popover opened={opened} onChange={setOpened} position="bottom" shadow="md">
                        <Popover.Target>
                            <li
                                className="flex gap-2 items-center list-none text-lg font-medium cursor-pointer px-4 py-2 hover:text-primary"
                                onMouseEnter={() => setOpened(true)}
                                onMouseLeave={() => setOpened(false)}
                            >
                                Pages <IconChevronDown stroke={2} />
                            </li>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <ul className="flex flex-col gap-2">
                                {["Pricing", "Team", "Career", "Blog", "Contact"].map((page) => (
                                    <li key={page} className="px-4 py-2 hover:bg-gray-100 cursor-pointer rounded-md">
                                        {page}
                                    </li>
                                ))}
                            </ul>
                        </Popover.Dropdown>
                    </Popover>
                </nav>

                {/* Button */}
                <div>
                    <Button onClick={() => navigate("/dashboard/home")}>Dashboard</Button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
