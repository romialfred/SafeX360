
import { Icon } from "@iconify-icon/react";
import { Avatar, Indicator, Drawer, Button, ScrollArea, SegmentedControl, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconBellRinging, IconClipboardData, IconUrgent, IconBroadcast } from '@tabler/icons-react';
import { useTranslation } from "react-i18next";

import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import LanguageSwitcher from "../../UtilityComp/LanguageSwitcher";

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
    const { t } = useTranslation(['navigation', 'common']);
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
            {/* LOT 43 v10 — Header dynamique + titre agrandi + h-18 pour respirer */}
            <div className="safex-header-wave relative bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 h-[72px] flex justify-between items-center px-6 overflow-hidden">
                {/* Couche 1 : vague lumineuse parcourant le header (animée via CSS) */}
                <span aria-hidden className="safex-header-wave__shine"></span>
                {/* Couche 2 : second voile décalé pour effet de profondeur */}
                <span aria-hidden className="safex-header-wave__shine safex-header-wave__shine--delay"></span>
                {/* Couche 3 : grain subtil (radial gradient noise simulé) */}
                <span aria-hidden className="safex-header-wave__grain"></span>

                <div className="flex items-center gap-4 relative min-w-0 z-10">
                    <div className="leading-tight min-w-0">
                        {/* Titre principal — taille augmentée pour impact (clamp 21-28px) */}
                        <h1
                            className="text-white tracking-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(20px, 2vw, 26px)',
                                letterSpacing: '-0.022em',
                                lineHeight: 1.05,
                                textShadow: '0 1px 2px rgba(0,0,0,0.22)',
                            }}
                        >
                            {t('navigation:header.platformTitle')}
                        </h1>
                        {/* Sous-titre — slogan signature, taille ajustée à l'agrandissement du titre */}
                        <p
                            className="mt-1 text-teal-50/95 truncate italic"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: '13.5px',
                                fontWeight: 400,
                                letterSpacing: '0.005em',
                            }}
                        >
                            {t('navigation:header.platformSlogan')}
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex gap-2 items-center">
                    {/* LOT 44 — Sélecteur de langue (FR / EN) */}
                    <LanguageSwitcher tone="light" />

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
                    {/* LOT 45 — Boutons CTA pleins (vrai look "bouton d'action", plus "onglet") */}
                    <Tooltip label={t('navigation:header.incidentTooltip')}>
                        <button
                            onClick={() => navigate("/incidents/report")}
                            className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white text-[12.5px] font-semibold shadow-[0_2px_8px_rgba(225,29,72,0.35)] hover:shadow-[0_3px_12px_rgba(225,29,72,0.5)] ring-1 ring-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <IconAlertTriangle stroke={2.2} size={14} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
                            {t('navigation:header.reportIncident')}
                        </button>
                    </Tooltip>
                    <Tooltip label={t('navigation:header.eventTooltip')}>
                        <button
                            onClick={() => navigate("/non-conformity/create")}
                            className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-[12.5px] font-semibold shadow-[0_2px_8px_rgba(13,148,136,0.35)] hover:shadow-[0_3px_12px_rgba(13,148,136,0.5)] ring-1 ring-teal-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <IconClipboardData stroke={2.2} size={14} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
                            {t('navigation:header.newEvent')}
                        </button>
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
