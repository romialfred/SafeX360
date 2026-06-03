import { NavLink, useLocation } from "react-router-dom";

import {
    IconActivityHeartbeat,
    IconAlertTriangle,
    IconBell,
    IconBook,
    IconBrandSpeedtest,
    IconBuilding,
    IconBuildingFactory,
    IconBuildingFactory2,
    IconCalendarCheck,
    IconCalendarClock,
    IconCategory,
    IconChartBar,
    IconChecklist,
    IconChevronLeft,
    IconChevronRight,
    IconClipboardCheck,
    IconClipboardData,
    IconClipboardList,
    IconClock24,
    IconCloudRain,
    IconComponents,
    IconDashboardFilled,
    IconFileCheck,
    IconFileInvoice,
    IconFileText,
    IconFirstAidKit,
    IconHome2,
    IconHomeFilled,
    IconLayoutDashboard,
    IconLogout2,
    IconMapPin,
    IconReportAnalytics,
    IconScale,
    IconSearch,
    IconSectionFilled,
    IconSettings,
    IconSettingsBolt,
    IconSettingsCog,
    IconShield,
    IconSquareCheck,
    IconTools,
    IconTrendingDown,
    IconTrendingUp,
    IconUser,
    IconUsers,
    IconUsersGroup,
    IconUserShield,
    IconUsersPlus,
} from "@tabler/icons-react";
import React, { useState } from "react";
import { Accordion, ActionIcon, Divider, Tooltip } from "@mantine/core";
import { useAppDispatch, useAppSelector } from "../../../slices/hooks";
import { collapse, expand } from "../../../slices/CollapseSlice";
import { setMenu } from "../../../slices/MenuSlice";
import './Sidebar.css';
const Sidebar = () => {
    const collapsed = useAppSelector((state) => state.collapse);
    const menu = useAppSelector((state) => state.menu);
    const dispatch = useAppDispatch();
    // const [menu, setMenu] = useState<keyof typeof menuRecord>("dashboard");
    // const [pos, setPos] = useState(true);
    const location = useLocation();
    const [openedSections, setOpenedSections] = useState<string[]>([]);

    const menuRecord: Record<string, { name: string; icon: React.FC<any> }> = {
        home: { name: "Dashboard", icon: IconHomeFilled },
        preventionActivities: { name: "Prevention Activities", icon: IconTrendingUp },
        monitoringActivities: { name: "Monitoring Activities", icon: IconTrendingDown },
        processManagement: { name: "Process Management", icon: IconClipboardList },
        complianceManagement: { name: "Compliance Management", icon: IconComponents },
        planning: { name: "Annual Planning", icon: IconClipboardList },
        newDashboard: { name: "New Dashboard", icon: IconDashboardFilled },
        auditManagement: { name: "Audits Management", icon: IconClipboardCheck },
        lessons: { name: "Lessons Learned", icon: IconBook },
        risk: { name: "Lessons Learned", icon: IconAlertTriangle },
        setting: { name: "Settings", icon: IconSettings },

    };

    const outerMenu = [
        {
            name: "Home",
            id: "home",
            color: "text-emerald-400",
            mColor: "teal",
            description: "Go to Dashboard - Overview of safety and KPI status",
            icon: IconHome2,
        },
        {
            name: "Prevention Activities",
            description: "Safety Management and Risk Prevention - Plan and track safety measures",
            id: "preventionActivities",
            color: "text-red-400",
            mColor: "red",

            icon: IconShield,
        },
        {
            name: "Monitoring Activities",
            description: "Incident and Hazard Monitoring - Track events, alerts, Assess",
            id: "monitoringActivities",
            color: "text-purple-400",
            mColor: "grape",
            icon: IconActivityHeartbeat,
        },
        {
            name: "Audits Management",
            description: "Allows users to plan, execute, document, and track internal or external audits related to quality, health, safety, environment, and compliance",
            id: "auditManagement",
            color: "text-orange-400",
            mColor: "orange",
            icon: IconClipboardCheck
        },


        {
            name: "Compliance Management",
            description: "Ensure Regulatory Compliance - Track standards, policies, and audits",
            id: "complianceManagement",
            color: "text-green-400",
            mColor: "green",
            icon: IconComponents,
        },
        // {
        //     name: "Annual Review",
        //     id: "annualReview",
        //     color: "text-cyan-400",
        //     mColor: "cyan",
        //     icon: IconCalendarStats,
        // },
        // {
        //     name: "MBA Card Management",
        //     id: "mbaCard",
        //     color: "text-orange-400",
        //     mColor: "orange",
        //     icon: IconIdBadge,
        // },
        {
            name: "Annual Planning",
            description: "Manage Safety Processes and Workflows",
            id: "planning",
            color: "text-yellow-400",
            mColor: "yellow",
            icon: IconClipboardList,
        },
        {
            name: "Lesson Learned",
            description: "Lessons learned are documented insights, experiences, and knowledge gained from past activities",
            id: "lessons",
            color: "text-cyan-400",
            mColor: "cyan",
            icon: IconBook
        },
        {
            name: "Risk Management",
            description: "Lessons learned are documented insights, experiences, and knowledge gained from past activities",
            id: "risk",
            color: "text-purple-500",
            mColor: "cyan",
            icon: IconAlertTriangle
        },
        {
            name: "Settings",
            description: "Application Settings - Customize preferences, and configurations",
            id: "setting",
            color: "text-blue-400",
            mColor: "blue",
            icon: IconSettings,
        },


    ];
    const subMenus = {
        home: [
            { url: 'old', name: 'Dashboard', icon: IconLayoutDashboard },
            { url: 'dashboard', name: 'Dashboard', icon: IconClipboardData },
            { url: 'home', name: 'Home', icon: IconBuilding },
        ],
        monitoringActivities: [
            { name: "Incidents Management", url: "incidents", icon: IconAlertTriangle },
            { name: "Investigations", url: "investigation", icon: IconSearch },
            { name: "Action Plans", url: "corrective", icon: IconChecklist },


        ],
        auditManagement: [
            { name: "Audits", url: "audit-management", icon: IconFileInvoice },
            { name: "Recommendations", url: "audit-recommendations", icon: IconClipboardList },
        ],
        processManagement: [
            { name: "Business Process", url: "/business-process", icon: IconClipboardData },
            { name: "Workflow Management", url: "/workflow-management", icon: IconChartBar },
            { name: "Process Documentation", url: "/process-docs", icon: IconFileText },
            { name: "Annual Performance Review", url: "/performance-review", icon: IconTrendingUp },
            { name: "Process Analytics", url: "/process-analytics", icon: IconReportAnalytics },
        ],

        complianceManagement: [
            { name: "Dashboard", url: "compliance-dashboard", icon: IconLayoutDashboard },
            { name: "Requirements", url: "compliance-requirements", icon: IconFileCheck },
            { name: "Postions Assignments", url: "compliance-assignment", icon: IconClipboardCheck },
            { name: "Employee Assignments", url: "employee-assignment", icon: IconUsersPlus },
            { name: "Documents", url: "compliance-documents", icon: IconFileText },
            { name: "Document Validation", url: "document-validation", icon: IconSquareCheck },


        ],
        planning: [
            { name: "HS activities Planning", url: "hs-activities-planning", icon: IconCalendarClock },
            { name: "Month Theme / Subjects", url: "month-theme-subjects", icon: IconBook },
            { name: "Annual Audit Plan", url: "annual-audit-plan", icon: IconCalendarCheck }

        ],
        lessons: [
            { name: "Lessons", url: "lesson-learn", icon: IconBook },
        ],

        risk: [
            { name: "Communication Dashboard", url: "communication-dashboard", icon: IconBell },
            { name: "Risks Overview", url: "risks-overview", icon: IconClipboardData },
            { name: "Risks Register", url: "risks-register", icon: IconClipboardData },
            { name: "PPE Management", url: "ppe-management", icon: IconFileText },
            { name: "Employee Communication", url: "communications", icon: IconClipboardData },
            { name: "Notifications", url: "notifications", icon: IconBell },
            { name: "Document Management", url: "document-management", icon: IconFileText }

        ],

        // annualReview: [
        //     { name: "Annual Reports", url: "/teams", icon: IconFileInvoice },
        //     { name: "Performance Metrics", url: "/rotation", icon: IconTrendingUp },
        //     { name: "Action Planning", url: "/rotation", icon: IconChecklist },
        // ],

        // mbaCard: [
        //     { name: "View Cards", url: "/my-timesheet", icon: IconIdBadge },
        //     { name: "Issue Card", url: "/team-timesheet", icon: IconUserPlus },
        //     { name: "Card Reports", url: "/timesheet-management", icon: IconReportAnalytics },
        // ],



        setting: [
            {
                heading: "Incident Management",
                icon: IconAlertTriangle,
                color: "text-red-600",
                items: [
                    { name: "Incident Category", url: "incidentCategory", icon: IconCategory },
                    { name: "Incident Type", url: "incidentType", icon: IconAlertTriangle },
                    { name: "Severity Level", url: "severityLevel", icon: IconScale },
                ],
            },
            {
                heading: "Places & Environment",
                icon: IconCloudRain,
                color: "text-green-600",
                items: [
                    { name: "Locations", url: "location", icon: IconMapPin },
                    { name: "Environmental Conditions", url: "weatherCondition", icon: IconCloudRain },

                    { name: "Audit Area", url: "audit-area", icon: IconFileInvoice },
                    { name: "Work Area", url: "work-area", icon: IconBuildingFactory2 },
                ],
            },
            {
                heading: "Resources & Staff",
                icon: IconUsersGroup,
                color: "text-pink-600",
                items: [
                    { name: "H&S Committee", url: "team-setup", icon: IconUsers },

                    { name: "Body Parts", url: "bodyParts", icon: IconUser },

                    { name: "Work Process", url: "work-process", icon: IconSettingsCog },
                    { name: "Auditor", url: "auditor", icon: IconUsersPlus },
                ],
            },

            {
                heading: "Tools & Measurements",
                icon: IconTools,
                color: "text-purple-600",
                items: [

                    { name: "CheckList", url: "checkList", icon: IconChecklist },
                    { name: "Technical Measurements", url: "technical-Measurements", icon: IconBrandSpeedtest },



                ],
            },

            {
                heading: "Advanced Configuration",
                icon: IconSettingsBolt,
                color: "text-blue-600",
                items: [

                    { name: "Duration", url: "Duration", icon: IconClock24 },
                    { name: "Investigation Setting", url: "Investigation Setting", icon: IconSectionFilled },
                    { name: "Target KPIs", url: "Target KPIs", icon: IconFileInvoice },



                ],
            },
        ],


        // newDashboard: [
        //     { name: "New Dashboard", url: "new-dashboard", icon: IconDashboardFilled }
        // ],

        preventionActivities: [
            {
                name: "Non-Conformity & Near Miss",
                url: "/non-conformity",
                icon: IconChecklist,
            },
            {
                name: "Planned General Inspections",
                url: "/PGI",
                icon: IconChecklist,
            },
            {
                name: "Meeting Managers",
                url: "/hs-Meetings",
                icon: IconUserShield,
            },
            {
                name: "Leadership Walk(TDM)",
                url: "/steering-tours",
                icon: IconCalendarClock,
            },
            // {
            //     name: "MBA Card Management",
            //     url: "mba-management",
            //     icon: IconCreditCard,
            // },
            // {
            //     name: "One-On-One Meetings",
            //     url: "/one-one-meetings",
            //     icon: IconUserCog,
            // },
            // {
            //     name: "Emergency Management",
            //     url: "/emergency-management",
            //     icon: IconClipboardList,
            // },

        ],




        settings: [
            { name: "Risk Assessment", url: "/risk-assessment", icon: IconClipboardData },
            { name: "Safety Protocols", url: "/safety-protocols", icon: IconClipboardList },
            { name: "Audit Schedule", url: "/audit-schedule", icon: IconCalendarClock },
            { name: "Facility Safety", url: "/facility-safety", icon: IconBuildingFactory },
            { name: "Medical Equipment", url: "/medical-equipment", icon: IconFirstAidKit },
        ]
    };


    const handleMenuClick = (e: any) => {
        dispatch(setMenu({ id: e.id, pos: false }));
        // setPos(false);

    }


    return (
        <div className="flex z-[100] relative">
            <div className={`${collapsed ? "w-20" : "w-72"}    p-3  relative h-screen overflow-y-auto  flex-col flex   transition-[width] duration-500 `}>

            </div>
            <div className={` ${collapsed ? "w-20 max-w-20" : "max-w-72 w-72"} scrollbar-hide bg-blackbg  p-3  h-screen overflow-y-auto fixed flex-col flex gap-2  transition-[max-width] duration-500  text-neutral-400  justify-between `} >
                <div className={`flex flex-col ${collapsed ? "items-center" : ""} gap-2`}>
                    <div className="py-2  flex items-center justify-between">
                        {!collapsed && <div className="text-white text-xl">My Applications</div>}
                        <Tooltip position="right" zIndex={1001} disabled={!collapsed} label={collapsed ? "Expand" : "Collapse"}>
                            <ActionIcon color="gray" onClick={() => dispatch(collapsed ? expand() : collapse())} variant="subtle" size={collapsed ? "xl" : "lg"} >
                                {collapsed ? <IconChevronRight size={collapsed ? 40 : 25} className="" /> : <IconChevronLeft size={30} className="" />} </ActionIcon></Tooltip>

                    </div>
                    <div className="w-full">

                        <Divider size="xs" color="gray.6" className="!text-neutral-900 self-start" />
                    </div>

                    {
                        menu.pos && <div className={`flex ${collapsed ? "gap-5" : "gap-2 mt-2"} flex-col`}>

                            {outerMenu.map((item, index) => (
                                <Tooltip position="right" zIndex={1001} color={item.mColor} key={index} label={collapsed ? item.name : item.description}>
                                    {item.id == "home" ? <NavLink to={"/"} className={({ isActive }) => `flex mt-2 gap-3 items-center hover:bg-neutral-950 !border border-transparent hover:!border-primary rounded-md p-2   cursor-pointer transition-all duration-200 ${isActive ? "bg-neutral-900" : ""}`}>
                                        <item.icon size={collapsed ? 35 : 20} className={`text-orange-400`} />
                                        {!collapsed && <div className="text-sm">{item.name}</div>}
                                    </NavLink> :
                                        <div key={index} onClick={() => handleMenuClick(item)} className={`flex gap-3 items-center hover:bg-neutral-950 rounded-md p-2 cursor-pointer transition-all duration-200 !border border-transparent hover:!border-primary ${location.pathname.includes(item.name.toLowerCase()) ? "bg-neutral-900" : ""}`}>
                                            <item.icon size={collapsed ? 35 : 20} className={`${item.color}`} />
                                            {!collapsed && <div className="text-sm">{item.name}</div>}
                                        </div>}
                                </Tooltip>
                            ))}
                        </div>
                    }


                    {
                        !menu.pos && <div className="flex flex-col  gap-2">
                            <Tooltip position="right" disabled={!collapsed} zIndex={1001} color="red" label={`Back to  main menu`}>
                                <div onClick={() => dispatch(setMenu({ id: "dashboard", pos: true }))} className={`flex gap-3 items-center hover:bg-neutral-950 rounded-md p-2  cursor-pointer transition-all duration-200 `}>
                                    <IconChevronLeft size={collapsed ? 35 : 20} className={`text-primary`} />
                                    {!collapsed && <div className="text-sm">Back to main menu</div>}
                                </div>
                            </Tooltip>

                            <Divider size="xs" my={collapsed ? -5 : 0} color="gray.6" className="!text-neutral-900" />
                            <Tooltip position="right" disabled={!collapsed} zIndex={1001} color="primary" label={menuRecord[menu.id]?.name}>
                                <div className={`p-2 bg-primary/30 rounded-md ${collapsed ? "text-center" : "text-left"} text-primary text-sm mt-2 `}>
                                    {collapsed
                                        ? React.createElement(menuRecord[menu.id].icon, { size: collapsed ? 40 : 25 })
                                        : menuRecord[menu.id]?.name}
                                </div>
                            </Tooltip>




                            {menu.id === "setting" && (
                                <Accordion
                                    multiple
                                    value={openedSections}
                                    onChange={setOpenedSections}
                                    variant="separated"
                                    chevronPosition="right"
                                    className="flex flex-col gap-1"
                                >
                                    {subMenus.setting.map((section: any, sectionIndex: number) => (
                                        <Accordion.Item
                                            key={sectionIndex}
                                            value={section.heading}
                                            className={`transition-all duration-300 ${collapsed
                                                ? "!bg-transparent !border-none !p-0"
                                                : "!bg-[#1a1a1a]  hover:!border-primary !rounded-2xl "
                                                }`}
                                        >
                                            <Accordion.Control
                                                className={`transition-all duration-300 flex items-center !rounded-2xl relative
            ${collapsed ? "!justify-center !p-0 chevron-hidden" : "!justify-between !py-2 !px-3 hover:!bg-neutral-900"}   !text-base !!text-gray-300`}
                                            >
                                                <Tooltip
                                                    label={section.heading}
                                                    position="right"
                                                    withArrow
                                                    disabled={!collapsed}
                                                    color="orange"
                                                >
                                                    <div className={`flex ${collapsed ? "justify-center w-full" : "items-center gap-2"}`}>
                                                        {section.icon &&
                                                            React.createElement(section.icon, {
                                                                size: collapsed ? 30 : 20,
                                                                className: `${section.color}`,
                                                            })}
                                                        {!collapsed && <span>{section.heading}</span>}
                                                    </div>
                                                </Tooltip>
                                            </Accordion.Control>

                                            {/* ✅ Panel content — hidden if collapsed, shown if expanded */}
                                            {!collapsed && (
                                                <Accordion.Panel className="px-2 pb-2 pt-0  ">
                                                    {section.items.map((item: any,) => (
                                                        <Tooltip
                                                            position="right"
                                                            zIndex={1001}
                                                            color="orange"
                                                            label={item.name}
                                                        >
                                                            <NavLink
                                                                to={item.url}
                                                                className={({ isActive }) =>
                                                                    `menus flex gap-3 items-center hover:bg-neutral-950 !border border-transparent hover:!border-primary rounded-md p-2 cursor-pointer transition-all duration-200 ${isActive ? "active bg-neutral-900" : ""
                                                                    }`
                                                                }
                                                            >
                                                                {item.icon &&
                                                                    React.createElement(item.icon, {
                                                                        size: 20,
                                                                        className: "text-orange-400",
                                                                    })}
                                                                {!collapsed && (
                                                                    <div className="text-sm ">{item.name}</div>
                                                                )}
                                                            </NavLink>
                                                        </Tooltip>
                                                    ))}
                                                </Accordion.Panel>
                                            )}
                                            {collapsed && (
                                                <div className="flex flex-col items-center gap-2 ">
                                                    {section.items.map((item: any, index: number) => (
                                                        <div key={index}>
                                                            <Tooltip
                                                                label={item.name}
                                                                position="right"
                                                                withArrow
                                                                color="orange"
                                                                openDelay={200}
                                                                transitionProps={{ duration: 200 }}
                                                            >
                                                                <NavLink
                                                                    to={item.url}
                                                                    className={({ isActive }) =>
                                                                        `menus flex items-center justify-center 
              w-18  
              hover:bg-neutral-950 !border border-transparent 
              hover:!border-primary rounded-md cursor-pointer transition-all duration-200 
              ${isActive ? "active bg-neutral-900" : ""}`
                                                                    }
                                                                >
                                                                    {item.icon &&
                                                                        React.createElement(item.icon, {
                                                                            size: 22,
                                                                            className: "text-orange-400",
                                                                        })}
                                                                </NavLink>
                                                            </Tooltip>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Accordion.Item>
                                    ))}
                                </Accordion>
                            )}


                            {menu.id != "setting" && subMenus[menu.id as keyof typeof subMenus]?.map((item: any, index: number) => (

                                <Tooltip position="right" disabled={!collapsed} zIndex={1001} color="orange" label={item.name} key={index} >
                                    <NavLink to={item.url} className={({ isActive }) => `flex  gap-3 items-center hover:bg-neutral-950 !border border-transparent hover:!border-primary rounded-md p-2   cursor-pointer transition-all duration-200 ${isActive ? "bg-neutral-900" : ""}`}>
                                        <item.icon size={collapsed ? 35 : 20} className={`text-orange-400`} />
                                        {!collapsed && <div className="text-sm">{item.name}</div>}
                                    </NavLink>
                                </Tooltip>
                            ))}

                        </div>
                    }
                </div>
                {
                    menu.pos && <div className={`flex ${collapsed ? "gap-5" : "gap-2"}  flex-col`}>
                        <Divider size="xs" color="gray.6" className="!text-neutral-900" />
                        <Tooltip position="right" disabled={!collapsed} zIndex={1001} color="red" label="Go to MINE XPERT">
                            <a href="https://mine-xpert.data-univers.com/" target="_blank" className={`flex gap-3 items-center hover:bg-red-500/20 rounded-md p-2 py-3 cursor-pointer transition-all duration-200 hover:text-red-500 !border border-transparent hover:!border-red-500`}>
                                <IconLogout2 size={collapsed ? 32 : 20} className="text-red-500" />
                                {!collapsed && <div className="text-xs">Go to MINE XPERT</div>}
                            </a>
                        </Tooltip>
                    </div>
                }
            </div>
        </div >
    );
}

export default Sidebar
