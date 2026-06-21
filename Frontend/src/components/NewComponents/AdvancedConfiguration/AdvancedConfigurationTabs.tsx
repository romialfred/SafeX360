import { Breadcrumbs, Tabs, Text } from "@mantine/core";
import { IconBell, IconDatabase, IconSettings, IconWorld } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import SystemTabs from "./SystemTabs";
import NotificationTabs from "./NotificationTabs";
import DataRetention from "./DataRetention";
import GlobalParameters from "./GlobalParameters";


const AdvancedConfigurationTabs = () => {
    const [activeTab, setActiveTab] = useState('details');


    const tabData = {
        details: {
            label: 'System Preferences',
            icon: IconSettings,
            content: <SystemTabs />,
            hide: false
        },
        analysis: {
            label: 'Notification',
            icon: IconBell,
            content: <NotificationTabs />,
            hide: false
        },
        data: {
            label: 'Data Retention',
            icon: IconDatabase,
            content: <DataRetention />,
            hide: false
        },
        global: {
            label: 'Global Parameters',
            icon: IconWorld,
            content: <GlobalParameters />,
            hide: false
        },



    };
    return (
        <div className=" space-y-6">
            <div className="flex justify-between items-center  ">
                <div>
                    {/* LOT 40 P1: page title — text-slate-900 (was text-blue-500 gradient) */}
                    <div className="text-2xl font-semibold text-slate-900">Advanced Configuration</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumbs — c="dimmed" non-leaf, c="teal" leaf (was gradient) */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/settings" ><Text c="dimmed" className="hover:!underline cursor-pointer">Setting</Text></Link>
                        <Text c="teal" fw={500}>Advanced Configuration</Text>
                    </Breadcrumbs>
                </div>

            </div>

            <div className="">
                <Tabs
                    value={activeTab}
                    onChange={(value) => value && setActiveTab(value)}
                    className=""

                >
                    <Tabs.List className="bg-white border border-slate-200 rounded-lg p-2 !flex !gap-1">
                        {Object.entries(tabData).map(([key, { label, icon: Icon, hide }]) => (
                            !hide && <Tabs.Tab key={key} value={key} leftSection={<Icon size={15} />} className="  !text-slate-500 hover:!text-slate-700 data-[active]:!bg-slate-100 data-[active]:!text-slate-800 data-[active]:!border-slate-300 data-[active]:!font-medium !rounded-lg px-3 py-1.5 text-sm transition-all duration-200">
                                {label}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>

                    {Object.entries(tabData).map(([key, { content }]) => (
                        <Tabs.Panel value={key} key={key} pt="md">

                            <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                <div className="p-2">{content}</div>
                            </div>

                        </Tabs.Panel>
                    ))}
                </Tabs>
            </div>
        </div>
    )
}

export default AdvancedConfigurationTabs