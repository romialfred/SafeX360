
import { Icon } from "@iconify-icon/react";
import { Avatar, Indicator, Drawer, Button, ScrollArea, SegmentedControl, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconBellRinging, IconClipboardData, IconUrgent, IconBroadcast, IconMenu2 } from '@tabler/icons-react';
import { useTranslation } from "react-i18next";

import { useDispatch, useSelector } from "react-redux";
import { toggleMobileSidebar } from "../../../slices/MobileSidebarSlice";
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
    const [value, setValue] = useState("all");
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
        // user vaut {} avant la fin de l'auth : sans le check empId on tirait
        // une requête getProfilePicture(undefined) à chaque chargement.
        if (user?.empId) {
            getProfilePicture(user.empId).then((res) => {
                dispatch(setProfile(res));
            }).catch((_err) => {
            })
        }
    }, [user])
    const notification = [

        {
            label: t('navigation:notifications.items.newEmail'),
            icon: <Icon icon="fluent-color:mail-multiple-28" width="28" height="28" />
        },
        {
            label: t('navigation:notifications.items.newMessage'),
            icon: <Icon icon="fluent-color:chat-multiple-16" width="28" height="28" />
        },

        {
            label: t('navigation:notifications.items.orderShipped'),
            icon: <Icon icon="fluent-color:alert-28" width="28" height="28" />
        },
        {
            label: t('navigation:notifications.items.orderLate'),
            icon: <Icon icon="fluent-color:alert-28" width="28" height="28" />
        },
        {
            label: t('navigation:notifications.items.newOffer'),
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
        // LOT 48 P6.j — Responsive : sur mobile (< md), le header occupe TOUTE la largeur
        // (sidebar = drawer overlay). Sur desktop, on conserve l'offset gauche selon collapsed.
        // z-[200] = Z.header (constants/zIndex.ts) : à z-[100] le header partageait
        // le niveau de la sidebar — empilement fragile dépendant de l'ordre DOM.
        <header role="banner" className={`fixed right-0 left-0 ${collapsed ? "md:left-20" : "md:left-72"} z-[200] transition-all duration-500 ${scrolled ? "shadow-lg" : "shadow-sm"}`}>
            {/* Header clair — image montagne minière à droite, fondu vers le blanc à gauche */}
            <div className="relative bg-white h-[64px] sm:h-[92px] flex justify-between items-center px-3 sm:px-8 overflow-hidden border-b border-slate-100">
                {/* Image de fond (paysage minier), pleine largeur, visible à travers le voile */}
                <span
                    aria-hidden
                    className="absolute inset-0 bg-cover"
                    style={{ backgroundImage: "url('/hero/mine-aerial.jpg')", backgroundPosition: 'center 28%', opacity: 0.9 }}
                ></span>
                {/* Voile blanc SEMI-TRANSPARENT : translucide sur tout le header (l'image
                    reste visible derrière) ; un peu plus dense à gauche pour la lisibilité
                    du titre, plus léger à droite. */}
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.74) 0%, rgba(255,255,255,0.58) 42%, rgba(255,255,255,0.34) 74%, rgba(255,255,255,0.12) 100%)' }}
                ></span>

                <div className="flex items-center gap-2 sm:gap-4 relative min-w-0 z-10 flex-1">
                    {/* Hamburger : MOBILE uniquement (< md) - ouvre le drawer sidebar */}
                    <button
                        type="button"
                        onClick={() => dispatch(toggleMobileSidebar())}
                        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors flex-shrink-0"
                        aria-label="Open navigation menu"
                    >
                        <IconMenu2 size={20} stroke={2} className="text-slate-700" />
                    </button>

                    <div className="leading-tight min-w-0">
                        {/* Titre principal : clamp + truncate sur mobile */}
                        <p
                            className="tracking-tight truncate"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 700,
                                fontSize: 'clamp(16px, 2.1vw, 29px)',
                                letterSpacing: '-0.022em',
                                lineHeight: 1.05,
                                color: '#0f172a',
                                textShadow: '0 1px 3px rgba(255,255,255,0.85), 0 0 1px rgba(255,255,255,0.9)',
                            }}
                        >
                            {t('navigation:header.platformTitle')}
                        </p>
                        {/* Sous-titre : MASQUÉ sur mobile (< sm) pour libérer de l'espace */}
                        <p
                            className="hidden sm:block mt-1 truncate italic"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: '14px',
                                fontWeight: 500,
                                letterSpacing: '0.005em',
                                color: '#475569',
                                textShadow: '0 1px 2px rgba(255,255,255,0.85)',
                            }}
                        >
                            {t('navigation:header.platformSlogan')}
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex gap-1 sm:gap-2 items-center flex-shrink-0">
                    {/* LOT 44 — Sélecteur de langue (masqué sur très petits écrans pour gagner de l'espace) */}
                    <div className="hidden sm:block">
                        <LanguageSwitcher tone="dark" />
                    </div>

                    <Indicator inline color="red" label="4" offset={6} size={16}>
                        <button
                            type="button"
                            className="flex items-center cursor-pointer transition-colors duration-200 justify-center rounded-full hover:bg-slate-100 p-2"
                            onClick={() => setNotificationDrawerOpened(true)}
                            aria-label={t('navigation:notifications.title')}
                        >
                            <IconBellRinging stroke={1.8} size={22} strokeLinecap="round" strokeLinejoin="round" className="text-slate-600" />
                        </button>
                    </Indicator>

                    <ProfileMenu drawerOpened={drawerOpened} setDrawerOpened={setDrawerOpened} />
                <Drawer
                    opened={notificationDrawerOpened}
                    onClose={() => setNotificationDrawerOpened(false)}
                    padding="md"
                    size="sm"
                    position="right"
                    title={t('navigation:notifications.title')}

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
                                    { label: t('navigation:notifications.all'), value: "all" },
                                    { label: t('navigation:notifications.unread'), value: "unread" },
                                    { label: t('navigation:notifications.archived'), value: "archived" },
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
                                                {t('navigation:notifications.friendRequest', { name: 'Deja Brady' })}
                                            </p>
                                            <p className="text-xs text-textprimary">{t('navigation:notifications.minutesAgo', { count: 37 })}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="filled" size="md" radius="md" className="!bg-primary-500">{t('navigation:notifications.accept')}</Button>
                                            <Button variant="outline" size="md" radius="md" className="!border-primary-500 !text-primary-500">{t('navigation:notifications.reject')}</Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-5 hover:bg-hoverbg p-2 rounded-lg">
                                    <Avatar src="/avatar6.png" size={50} alt="Profile Picture" />
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <p className="text-base text-textprimary hover:text-primary">
                                                {t('navigation:notifications.sentMessage', { name: 'Luis Sen' })}
                                            </p>
                                            <p className="text-xs text-textprimary">{t('navigation:notifications.minutesAgo', { count: 37 })}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="filled" size="md" radius="md" className="!bg-primary-500">{t('navigation:notifications.reply')}</Button>
                                            <Button variant="outline" size="md" radius="md" className="!border-primary-500 !text-primary-500">{t('navigation:notifications.delete')}</Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-5 hover:bg-hoverbg p-2 rounded-lg">
                                    <Avatar src="/avatar5.png" size={50} alt="Profile Picture" />
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <p className="text-base text-textprimary hover:text-primary">
                                                {t('navigation:notifications.friendRequest', { name: 'Rwan' })}
                                            </p>
                                            <p className="text-xs text-textprimary">{t('navigation:notifications.minutesAgo', { count: 37 })}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="filled" size="md" radius="md" className="!bg-primary-500">{t('navigation:notifications.accept')}</Button>
                                            <Button variant="outline" size="md" radius="md" className="!border-primary-500 !text-primary-500">{t('navigation:notifications.reject')}</Button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </ScrollArea>

                        {/* Fixed View All Button */}
                        <div className="bg-white p-3 shadow-md sticky bottom-0">
                            <Button variant="filled" size="md" radius="md" fullWidth className="!bg-primary-500">
                                {t('navigation:notifications.viewAll')}
                            </Button>
                        </div>
                    </div>
                </Drawer>

                </div>
            </div>

            {/* Deuxième ligne : actions rapides sobres + urgences gyrophare
                LOT 48 P6.j — Responsive : scroll horizontal sur mobile pour eviter le wrap,
                labels masques sur mobile (icones seules), gaps reduits.
                FIX 2026-06-07 : min-h + contain:layout pour stopper l'oscillation propagee
                par les anneaux pulses des boutons SOS / Alerte. */}
            <div className="bg-white border-b border-slate-200 h-14 min-h-14 flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-3 overflow-hidden" style={{ contain: 'layout style paint' }}>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {/* LOT 45 — Boutons CTA pleins. Ordre design : New Event puis Report Incident. */}
                    <Tooltip label={t('navigation:header.newEvent')}>
                        <button
                            onClick={() => navigate("/non-conformity/create")}
                            className="group inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-md bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-[12.5px] font-semibold shadow-[0_2px_8px_rgba(13,148,136,0.35)] hover:shadow-[0_3px_12px_rgba(13,148,136,0.5)] ring-1 ring-teal-500/40 hover:brightness-110 transition-[filter,box-shadow,background-color] flex-shrink-0"
                        >
                            <IconClipboardData stroke={2.2} size={14} className="text-white drop-shadow-sm" />
                            <span className="hidden sm:inline">{t('navigation:header.newEvent')}</span>
                        </button>
                    </Tooltip>
                    <Tooltip label={t('navigation:header.reportIncident')}>
                        <button
                            onClick={() => navigate("/incidents/report")}
                            className="group inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-md bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white text-[12.5px] font-semibold shadow-[0_2px_8px_rgba(225,29,72,0.35)] hover:shadow-[0_3px_12px_rgba(225,29,72,0.5)] ring-1 ring-rose-500/40 hover:brightness-110 transition-[filter,box-shadow,background-color] flex-shrink-0"
                        >
                            <IconAlertTriangle stroke={2.2} size={14} className="text-white drop-shadow-sm" />
                            {/* Label masqué sur mobile (< sm) */}
                            <span className="hidden sm:inline">{t('navigation:header.reportIncident')}</span>
                        </button>
                    </Tooltip>
                    <div className="hidden md:block h-6 w-px bg-slate-200 mx-1" />
                    {/* CompanySelector : masque sur les tres petits ecrans pour gagner de la place */}
                    <div className="hidden xs:block sm:block">
                        <CompanySelector isEnabled={isMultiSiteEnabled} />
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <SosButton />
                    <GeneralAlertButton />
                </div>
            </div>
        </header>
    );
};

export default Header;
