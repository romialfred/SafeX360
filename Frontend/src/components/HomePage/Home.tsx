import { Button, Menu } from "@mantine/core";
import { IconChevronDown, IconSearch, IconUsers, IconAlertTriangle, IconShieldPlus } from "@tabler/icons-react";

const cardData = [
    { icon: <IconUsers size={20} />, count: 234, label: "Total Employees" },
    { icon: <IconAlertTriangle size={20} />, count: 120, label: "Total Incidents Today" },
    { icon: <IconShieldPlus size={20} />, count: 50, label: "Days Without Incidents" },
];

const Home = () => {
    return (
        <div className="flex flex-col gap-10 w-full bg-home p-10 ">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <p className="text-2xl font-semibold text-white">Welcome Back, ROMUALD TIEGNAN!</p>
                    <p className="text-lg text-white">Monday, March 31, 2025</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconSearch stroke={2} className="bg-hoverbg p-3 text-primary rounded-3xl cursor-pointer" size={50} />
                    <Menu>
                        <Menu.Target>
                            <Button rightSection={<IconChevronDown size={18} />} color="primary">
                                Quick Actions
                            </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item onClick={() => console.log('Option 1')}>Submit Timesheet</Menu.Item>
                            <Menu.Item onClick={() => console.log('Option 2')}>Requets Leave</Menu.Item>
                            <Menu.Item onClick={() => console.log('Option 3')}>View Reports</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </div>
            </div>

            {/* Cards Section */}
            <div className="grid grid-cols-3 gap-6">
                {cardData.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 bg-primary/40  p-4 rounded-xl">


                        <div className="text-white ">{item.icon}</div>
                        <div>
                            <p className="text-lg text-white">{item.count}</p>
                            <p className="text-white/50">{item.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
