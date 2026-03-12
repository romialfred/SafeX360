import { Avatar, Button, Drawer, Modal, ScrollArea } from '@mantine/core';
import { useAppSelector } from '../../../slices/hooks';
import { IconHome, IconLayersDifference, IconSettings2, IconUser } from '@tabler/icons-react';
import { NavLink } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import useLogout from '../../../hooks/useLogout';

const navLinks = [
    {
        label: "Home",
        icon: <IconHome stroke={2} />,
        url: "/"
    },
    {
        label: "My Profile",
        icon: <IconUser stroke={2} />,
        url: "/profile"
    },
    // {
    //     label: "Projects",
    //     icon: <IconFileText stroke={2} />,
    // },
    {
        label: "Active Module",
        icon: <IconLayersDifference stroke={2} />,
    },
    // {
    //     label: "Security",
    //     icon: <IconShieldHalf stroke={2} />,
    // },
    {
        label: "Account Settings",
        icon: <IconSettings2 stroke={2} />,
    },


];
const ProfileMenu = ({ drawerOpened, setDrawerOpened }: any) => {
    const user: any = useAppSelector((state) => state.user);
    const logoutUser = useLogout();
    const [opened, { open, close }] = useDisclosure(false);
    const handleLogout = () => {
        open();
    }
    const logout = () => {
        logoutUser();
    }
    return (
        <Drawer
            opened={drawerOpened}
            onClose={() => setDrawerOpened(false)}
            padding="sm"
            size="xs"
            position="right"
        >
            <div className="flex flex-col items-center justify-between  ">
                {/* Scrollable Content */}
                <ScrollArea className="flex-1 w-full px-2" type="hover">
                    <div className="flex flex-col items-center gap-8">
                        <div className="flex flex-col items-center">
                            <Avatar src="" color='initials' size={80} name={user?.name} variant='filled' alt="Profile Picture" />
                            <h2 className="text-lg font-semibold">{user?.name}</h2>
                        </div>

                        {/* <div className="flex gap-2">
                            <Avatar src="/avatar4.png" size={40} alt="Profile Picture" />
                            <Avatar src="/avatar5.png" size={40} alt="Profile Picture" />
                            <Avatar src="/avatar6.png" size={40} alt="Profile Picture" />
                        </div> */}

                        <div className="flex flex-col self-start w-full">
                            {navLinks.map((link, index) => (
                                <NavLink
                                    to=""
                                    key={index}
                                    className={({ isActive }) =>
                                        `flex gap-3 font-medium text-textprimary text-base px-2 py-3 rounded-lg w-full transition-all duration-200 
                ${isActive ? "text-neutral-500" : "text-textprimary"}
                hover:bg-hoverbg hover:text-primary`
                                    }
                                >
                                    {link.icon}
                                    <span className="flex-1">{link.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </ScrollArea>

                {/* Fixed Logout Button */}
                <div className="w-full px-4 py-3 bg-white shadow-md absolute bottom-0">
                    <Button variant="filled" size="md" radius="md" onClick={handleLogout} fullWidth color='red'>
                        Logout
                    </Button>
                </div>
            </div>
            <Modal opened={opened} centered onClose={close} title={<span className='font-semibold text-2xl'>Are you sure?</span>}>
                You want to logout?
                <div className='mt-5 flex gap-5'>

                    <Button variant='filled' color='red' onClick={logout} >Logout</Button>
                    <Button variant='outline' onClick={close} >Cancel</Button>
                </div>

            </Modal>
        </Drawer>
    )
}

export default ProfileMenu