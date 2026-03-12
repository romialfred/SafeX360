import { NavLink } from "react-router-dom";
import { Accordion, ActionIcon, List, Tooltip } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import './Sidebar.css';
import {
    Icon24Hours,
    IconCalendarUser,
    IconChevronDown,
    IconChevronRight,
    IconClockCog,
    IconFirstAidKit,
    IconHome,
    IconLayoutSidebarLeftCollapseFilled,
    IconSettings,
    IconUsersGroup,
    IconUserSquareRounded,
} from "@tabler/icons-react";
import { useState } from "react";

const Sidebar = () => {
    const [collapse, setCollapse] = useState(false);
    const { hovered } = useHover();
    const [value, setValue] = useState<string | null>(null);
    const [menu, setMenu] = useState<string[]>(["Dashboard", "Human Resource", "Rotation", "Timesheet", "Health & Safety", "System Settings"]);


    const menus = [
        {
            name: "Dashboard", color: "primary", menuItems: [{
                name: "Dashboard", icon: IconHome, url: "/",
                subMenu: [
                    { name: "My Dashboard", url: "/employee-dashboard" },
                    { name: "Admin Dashboard", url: "/admin-dashboard" },
                    // { name: "Manager Dashboard", url: "/manager-dashboard" },
                    // { name: "HR Dashboard", url: "/hr-dashboard" },
                    { name: "Headcount Dashboard", url: "/headcount-dashboard" },
                ]
            }]
        },
        {
            name: "Human Resource", color: "pink", menuItems: [{
                name: "Employee Management", icon: IconUsersGroup, url: "/employees",
                subMenu: [
                    { name: "Employee Directory", url: "/employees" },
                    { name: "Positions Management", url: "/position-management" },
                    { name: "Contracts Management", url: "/contract-management" },
                    { name: "Leaves Management", url: "/leaves-admin" },
                    { name: "Salary Advance Management", url: "/manage-advance" },

                ]
            },
            {
                name: "Employee Portal", icon: IconUserSquareRounded, url: "/employees",
                subMenu: [
                    { name: "Leaves Request", url: "/leaves-employee" },
                    { name: "HR Services Request", url: "/hr-services" },
                    { name: "Salary Advance", url: "/salary-advance" },
                    { name: "Job Portal", url: "" },

                ]
            }]
        },
        {

            name: "Rotation", color: "cyan", menuItems: [{
                name: "Rotation", icon: IconCalendarUser, url: "/timesheet",
                subMenu: [

                    { name: "Teams", url: "/teams" },
                    { name: "Rotation", url: "/rotation" },
                ]
            }]
        },
        {
            name: "Timesheet", color: "orange", menuItems: [{
                name: "Timesheet", icon: Icon24Hours, url: "/timesheet",
                subMenu: [
                    { name: "My Timesheet", url: "/my-timesheet" },
                    { name: "Team Timesheet", url: "/team-timesheet" },
                    { name: "Timesheet Management", url: "/timesheet-management" },
                    { name: "Departement Timesheet", url: "/timesheet-verification" },
                    { name: "Company Timesheet", url: "/company-timesheet" },
                    { name: "Team Payroll", url: "/team-payroll" },
                    { name: "Payroll History", url: "/payroll-history" },
                    // { name: "Import Employee", url: "/import-employee" },

                ]

            }]
        },
        {
            name: "Health & Safety", color: "teal", menuItems: [{
                name: "Incident Setting", icon: IconFirstAidKit, url: "/h&s",
                subMenu: [

                    { name: "Incident Management", url: "/incident-mgmt" },
                    { name: "IGP Management", url: "/igp-mgmt" },
                    { name: "Audit Management", url: "/audit-mgmt" },
                    { name: "Process Editor", url: "/process-editor" },
                    { name: "Measure Corrective", url: "/measure-corrective" },
                ]
            }]
        },
        {
            name: "System Settings", color: "brown", menuItems: [{
                name: "HRMS Settings", icon: IconSettings, url: "/projects",
                subMenu: [

                    { name: "Mining Company", url: "/companies" },
                    { name: "Departments", url: "/departments" },
                    { name: "Roster", url: "/rosters" },
                    { name: "Job Position  Categories", url: "/position-categories" },
                    { name: "Job Positions", url: "/job-positions" },
                    { name: "Leave", url: "/leave-settings" },
                    { name: "Holidays", url: "/holidays" },
                    { name: "Leave Balance", url: "/leave-balance" },
                    { name: "User Accounts & Roles", url: "/accounts" },
                ]
            },
            {
                name: "Timesheet Settings", icon: IconClockCog, url: "/projects",
                subMenu: [
                    { name: "Work Hour Category", url: "/workCategory" },
                    { name: "Work Hour Codes", url: "/work-hour-codes" },
                    { name: "Permissions", url: "/timesheet-permissions" },
                ]
            }]
        },
    ]

    const handleCollapse = () => {
        setValue(null);
        setCollapse(!collapse);
    };



    function AccordionControl(props: any) {
        return (
            <Accordion.Control p={0} chevron={<></>} className="!text-neutral-700 group hover:!text-neutral-50 ">
                <div className="flex gap-3 justify-between hover:!text-neutral-400 cursor-pointer text-base items-center">

                    <div className={`opacity - 100 uppercase text-sm font-medium tracking-wide`}>
                        {props.children}
                    </div>
                    <ActionIcon color="neutral" className={`${"group-hover:opacity-100  group-hover:translate-x-0 group-hover:visible opacity-0 translate-x-2 invisible"} ${menu.find((x) => x == props.name) ? " rotate-90" : ""} transition-all duration-300 min-w-40`} variant="transparent" >
                        <IconChevronRight style={{ width: '85%', height: '85%' }} />
                    </ActionIcon>
                </div >
            </Accordion.Control >
        );
    }

    return <div className="flex ">
        <div className={`${(hovered || !collapse) ? "w-72" : "w-[84px]"}   p-3  h-screen overflow-y-auto  flex-col flex   transition-[width] duration-500 `}>

        </div>
        <div className={`${(hovered || !collapse) ? "max-w-72 w-72" : "max-w-[84px]"} scrollbar-hide  p-3  h-screen overflow-y-auto fixed flex-col flex  z-[1001] transition-[max-width] duration-500 bg-dark-bg text-neutral-400 pb-16`}>
            <div className={`flex ${collapse ? "justify-center mb-2" : "justify-end"}`}>
                <ActionIcon color="primary" onClick={handleCollapse} size="xl" className={`${collapse ? "rotate-180" : "rotate-0"} transition duration-500`} variant="subtle" >
                    <IconLayoutSidebarLeftCollapseFilled style={{ width: '95%', height: '95%' }} stroke={1.5} />
                </ActionIcon>
            </div>
            <Accordion multiple value={menu} onChange={setMenu} variant="filled" transitionDuration={500} bg="bgDark" chevronSize="xl" >
                {
                    menus.map((menu, index) => <Accordion.Item key={index} bg="bgDark" value={menu.name} >
                        {!collapse && <AccordionControl name={menu.name}>{menu.name}</AccordionControl>}
                        {/* <Divider className={${!collapse ? "opacity-100 translate-x-0 visible" : "opacity-0 -translate-x-10 invisible"} transition-all duration-500  min-w-40} my={collapse ? 0 : "xs"} color={menu.color} label={collapse ? undefined : <Text className="!text-lg" color={menu.color}>{menu.name}</Text>} labelPosition="center" /> */}

                        {/* <Button fullWidth>{menu.name}</Button> */}
                        <Accordion.Panel className="[&>.mantine-Accordion-content]:p-0 transition-all duration-500">

                            <Accordion value={value} onChange={setValue} chevronPosition="right" variant="filled" transitionDuration={500} bg="bgDark" chevronSize="xl" >
                                {
                                    menu.menuItems.map((item, index) => <Accordion.Item className="menuItem" bg="bgDark" value={item.name} key={item.name}>
                                        <Accordion.Control my="xs" p={0} chevron={!collapse ? <IconChevronDown className=" hover:!text-neutral-50 transition-all duration-300" /> : <></>} className="!text-neutral-400 menus rounded-md !px-1 hover:!text-neutral-50 ">
                                            <div key={index} className="flex gap-3  hover:!text-neutral-50 cursor-pointer text-base items-center">
                                                <ActionIcon color="neutral" className="transition-all duration-300" size={!collapse ? "md" : "xl"} variant="transparent" >
                                                    {collapse ? <Tooltip zIndex={2000} label={item.name} color="primary">
                                                        <item.icon style={{ width: '85%', height: '85%' }} />
                                                    </Tooltip> : <item.icon style={{ width: '85%', height: '85%' }} />}
                                                </ActionIcon>
                                                <div className={`${!collapse ? "opacity-100 translate-x-0 visible" : "opacity-0 -translate-x-10 invisible"} transition-all duration-500  min-w-40`}>
                                                    {item.name}
                                                </div>
                                            </div>
                                        </Accordion.Control>
                                        {!collapse && <Accordion.Panel className="[&>.mantine-Accordion-content]:p-0 transition-all duration-500">
                                            <div className="rounded-md p-3 bg-[#373b3e]">
                                                <List spacing={10} size="sm">
                                                    {item.subMenu.map((subItem) => (
                                                        <List.Item key={subItem.url}>
                                                            {subItem.name == "Job Portal" ? <a href="https://www.opportunitesminieres.com/" target="_blank" className="block p-2 rounded-md transition hover:text-primary hover:bg-primary/10">Job Portal</a> : <NavLink
                                                                to={subItem.url}
                                                                className={({ isActive }) =>
                                                                    `block p-2 rounded-md transition ${isActive ? "text-primary active  bg-primary/20" : "hover:text-primary hover:bg-primary/10"}`
                                                                }
                                                            >
                                                                {subItem.name}
                                                            </NavLink>}
                                                        </List.Item>
                                                    ))}
                                                </List>
                                            </div>
                                        </Accordion.Panel>}
                                    </Accordion.Item>)

                                }

                            </Accordion>
                        </Accordion.Panel>
                    </Accordion.Item>)}
            </Accordion>
        </div>
    </div >
}

export default Sidebar