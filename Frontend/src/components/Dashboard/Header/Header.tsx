
import { Icon } from "@iconify-icon/react";
import { Avatar, Indicator, Drawer, Button, ScrollArea, SegmentedControl, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconBellRinging, IconClipboardData, IconUrgent, IconBroadcast } from '@tabler/icons-react';

import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";

import { getProfilePicture } from "../../../services/EmployeeService";
import { setProfile } from "../../../slices/ProfileSlice";
import CompanySelector from "./CompanySelector";
import SosButton from "./SosButton";
import GeneralAlertButton from "./GeneralAlertButton";
import { useActivePageTitle } from "./useActivePageTitle";

const Header = () => {
    const collapsed = useSelector((state: any) => state.collapse);
    const user = useSelector((state: any) => state.user);
    const [drawerOpened, setDrawerOpened] = useState(false);
    const [notificationDrawerOpened, setNotificationDrawerOpened] = useState(false);
    const [value, setValue] = useState("react");
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const dispatch = useDispatch();
    // LOT 41 — titre dynamique du module métier actif (gardé pour usage interne / SEO)
    const activePageTitle = useActivePageTitle();
    void activePageTitle;
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
        <div className={`fixed right-0 ${collapsed ? "left-20" : "left-72"} z-[100] transition-all duration-500 ${scrolled ? "shadow-lg" : "shadow-sm"}`}>
            {/* LOT 41 — Header : titre principal = positionnement plateforme, sous-titre = slogan signature */}
            <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 h-16 flex justify-between items-center px-6">
                <div className="flex items-center gap-4 relative min-w-0">
                    <div className="leading-tight min-w-0">
                        {/* Titre principal — large et raffiné */}
                        <h1
                            className="text-white tracking-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(18px, 1.85vw, 24px)',
                                letterSpacing: '-0.022em',
                                lineHeight: 1.05,
                                textShadow: '0 1px 2px rgba(0,0,0,0.18)',
                            }}
                        >
                            Plateforme HSE pour l'industrie minière
                        </h1>
                        {/* Sous-titre — slogan signature */}
                        <p
                            className="mt-1 text-teal-50/95 truncate italic"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: '12.5px',
                                fontWeight: 400,
                                letterSpacing: '0.005em',
                            }}
                        >
                            La Santé &amp; Sécurité au cœur des opérations minières
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 items-center">
                    <Indicator inline color="red" label="4" offset={15} size={15}>
                        <div
                            className="flex items-center cursor-pointer transition duration-300 justify-center rounded-full group p-2"
                            onClick={() => setNotificationDrawerOpened(true)}
                        >
                            <IconBellRinging stroke={2} width={42} height={42} strokeLinecap="round" strokeLinejoin="round" className="text-white hover:text-amber-200 rounded-4xl p-2 cursor-pointer" />
                        </div>
                    </Indicator>

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
                                            `flex items-center gap-3 w-full text-sm text-textprimary px-2 py-3 rounded-lg 
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
                                            <p className="text-base text-textprimary hover:text-primary">
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
                                            <p className="text-base text-textprimary hover:text-primary">
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
                                            <p className="text-base text-textprimary hover:text-primary">
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
            </div>

            {/* Deuxième ligne : actions rapides sobres + urgences gyrophare */}
            <div className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 gap-3">
                <div className="flex items-center gap-2">
                    <Tooltip label="Déclarer un incident ou un danger">
                        <Button
                            onClick={() => navigate("/incidents/report")}
                            leftSection={<IconAlertTriangle stroke={2} size={15} />}
                            size="sm"
                            radius="md"
                            variant="default"
                            className="!border-slate-300 !text-slate-700 hover:!bg-red-50 hover:!text-red-700 hover:!border-red-200 transition-colors"
                        >
                            Déclarer Incident
                        </Button>
                    </Tooltip>
                    <Tooltip label="Non-conformité ou quasi-accident">
                        <Button
                            leftSection={<IconClipboardData size={15} />}
                            onClick={() => navigate("/non-conformity/create")}
                            radius="md"
                            variant="default"
                            size="sm"
                            className="!border-slate-300 !text-slate-700 hover:!bg-violet-50 hover:!text-violet-700 hover:!border-violet-200 transition-colors"
                        >
                            Nouvel Événement
                        </Button>
                    </Tooltip>
                    <div className="hidden md:block h-6 w-px bg-slate-200 mx-1" />
                    <CompanySelector isEnabled={isMultiSiteEnabled} />
                </div>

                <div className="flex items-center gap-2">
                    <SosButton />
                    <GeneralAlertButton />
                </div>
            </div>
        </div >
    );
};

export default Header;
