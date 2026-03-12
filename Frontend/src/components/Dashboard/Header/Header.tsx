
import { Icon } from "@iconify-icon/react";
import { Avatar, Indicator, Drawer, Button, ScrollArea, SegmentedControl, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconBellRinging, IconClipboardData } from '@tabler/icons-react';

import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";

import name from "@/assets/name.png";
import { getProfilePicture } from "../../../services/EmployeeService";
import { setProfile } from "../../../slices/ProfileSlice";
import CompanySelector from "./CompanySelector";
const Header = () => {
    const collapsed = useSelector((state: any) => state.collapse);
    const user = useSelector((state: any) => state.user);
    const [drawerOpened, setDrawerOpened] = useState(false);
    const [notificationDrawerOpened, setNotificationDrawerOpened] = useState(false);
    const [value, setValue] = useState("react");
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const dispatch = useDispatch();
    const isMultiSiteEnabled = true;
    // false karoge to sirf site name dikhega

    useEffect(() => {
        if (user) {
            getProfilePicture(user.empId).then((res) => {
                dispatch(setProfile(res));
            }).catch((_err) => {
            })
        }
    }, [user])
    const notification = [

        {
            label: "You have a new email",
            icon: <Icon icon="fluent-color:mail-multiple-28" width="28" height="28" />
        },
        {
            label: "You have a new message",
            icon: <Icon icon="fluent-color:chat-multiple-16" width="28" height="28" />
        },

        {
            label: "Delivery  your order is being shipped",
            icon: <Icon icon="fluent-color:alert-28" width="28" height="28" />
        },
        {
            label: "Delivery  your order is being late",
            icon: <Icon icon="fluent-color:alert-28" width="28" height="28" />
        },
        {
            label: "You have a new offer",
            icon: <Icon icon="fluent-color:chat-multiple-16" width="28" height="28" />
        },
    ]

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
        <div className={`bg-gradient-to-r fixed right-0  ${collapsed ? "left-20" : "left-72"} flex justify-between items-center z-[100] from-primary to-secondary h-16 transition-all duration-500 px-5  ${scrolled ? " shadow-md " : ""}`}>


            <div className="flex items-center gap-4 relative">
                <Link
                    to="/"
                    className="text-3xl font-bold text-white flex items-center gap-3"
                >
                    <img src={name} className="h-12" alt="logo" />
                </Link>


                <CompanySelector isEnabled={isMultiSiteEnabled} />
            </div>

            <div className="flex gap-2 items-center">
                <Tooltip label="Report Incident & Hazard">
                    <Button onClick={() => navigate("/incidents/report")} leftSection={<IconAlertTriangle stroke={2} size={18} />} variant="white" radius="md" color="red">Report Incidents</Button>
                </Tooltip>
                <Tooltip label="Non-Conformity & Near Miss">
                    <Button
                        leftSection={<IconClipboardData size={18} />}
                        onClick={() => navigate("/non-conformity/create")}
                        color="purple"
                        radius="md"
                        variant="white"

                    >
                        New Event
                    </Button>
                </Tooltip>





                {/* Notification Bell */}
                <Indicator inline color="red" label="4" offset={15} size={15}>
                    <div
                        className="flex items-center cursor-pointer transition duration-300 justify-center hover:bg-hover text-neutral-500  rounded-full group p-2"
                        onClick={() => setNotificationDrawerOpened(true)} // Open Notification Drawer
                    >
                        <IconBellRinging stroke={2} width={45} height={45} strokeLinecap="round" strokeLinejoin="round" className=" text-white hover:text-primary hover:bg-hoverbg rounded-4xl p-2 cursor-pointer" />

                    </div>
                </Indicator>

                {/* Avatar */}
                <div className="cursor-pointer transition duration-300  !bg-hoverbg rounded-full p-[2px]">
                    <Avatar
                        src=""
                        variant='filled'
                        size={45}
                        name={user?.name}
                        alt={user?.name}
                        color="initials"
                        autoContrast
                        onClick={() => setDrawerOpened(true)}
                    />
                </div>



                <ProfileMenu drawerOpened={drawerOpened} setDrawerOpened={setDrawerOpened} />
                <Drawer
                    opened={notificationDrawerOpened}
                    onClose={() => setNotificationDrawerOpened(false)}
                    padding="md"
                    size="sm"
                    position="right"
                    title="Notification"

                >
                    <div className="flex flex-col h-full">
                        {/* Fixed Segmented Control */}
                        <div className="bg-white z-10 py-3 sticky top-0">
                            <SegmentedControl
                                value={value}
                                onChange={setValue}
                                color="primary"
                                fullWidth
                                data={[
                                    { label: "All", value: "all" },
                                    { label: "Unread", value: "unread" },
                                    { label: "Archived", value: "archived" },
                                ]}

                            />
                        </div>

                        {/* Scrollable Notifications */}
                        <ScrollArea className="flex-grow w-full">
                            <div className="flex flex-col self-start gap-3 p-2">
                                {notification.map((link, index) => (
                                    <NavLink
                                        to=""
                                        key={index}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 w-full font-medium text-sm text-textprimary px-2 py-3 rounded-lg 
                            ${isActive ? " text-neutral-500 hover:bg-hoverbg hover:text-primary "
                                                : "hover:bg-hover "}`
                                        }
                                    >
                                        {link.icon}
                                        <span>{link.label}</span>
                                    </NavLink>
                                ))}

                                {/* Notification Cards */}
                                <div className="flex gap-5 hover:bg-hoverbg p-2 rounded-lg">
                                    <Avatar src="/avatar4.png" size={50} alt="Profile Picture" />
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <p className="text-base font-semibold text-textprimary hover:text-primary">
                                                Deja Brady sent you a friend request
                                            </p>
                                            <p className="text-xs text-textprimary">37 minutes ago</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="filled" size="md" radius="md" className="!bg-primary-500">Accept</Button>
                                            <Button variant="outline" size="md" radius="md" className="!border-primary-500 !text-primary-500">Reject</Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-5 hover:bg-hoverbg p-2 rounded-lg">
                                    <Avatar src="/avatar6.png" size={50} alt="Profile Picture" />
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <p className="text-base font-semibold text-textprimary hover:text-primary">
                                                Luis Sen sent you a message
                                            </p>
                                            <p className="text-xs text-textprimary">37 minutes ago</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="filled" size="md" radius="md" className="!bg-primary-500">Reply</Button>
                                            <Button variant="outline" size="md" radius="md" className="!border-primary-500 !text-primary-500">Delete</Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-5 hover:bg-hoverbg p-2 rounded-lg">
                                    <Avatar src="/avatar5.png" size={50} alt="Profile Picture" />
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <p className="text-base font-semibold text-textprimary hover:text-primary">
                                                Rwan sent you a friend request
                                            </p>
                                            <p className="text-xs text-textprimary">37 minutes ago</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="filled" size="md" radius="md" className="!bg-primary-500">Accept</Button>
                                            <Button variant="outline" size="md" radius="md" className="!border-primary-500 !text-primary-500">Reject</Button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </ScrollArea>

                        {/* Fixed View All Button */}
                        <div className="bg-white p-3 shadow-md sticky bottom-0">
                            <Button variant="filled" size="md" radius="md" fullWidth className="!bg-primary-500">
                                View All
                            </Button>
                        </div>
                    </div>
                </Drawer>

            </div>
        </div >
    );
};

export default Header;
