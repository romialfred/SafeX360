import { Breadcrumbs, Button, Text } from "@mantine/core";
// import { IconUsers } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import UsersContent from "./UsersContent";
import { IconPlus } from "@tabler/icons-react";

const UserManagementTabs = () => {
    const navigate = useNavigate();
    return (
        <div className=" space-y-6">
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-2xl font-semibold text-slate-900 ">Users Management</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>

                        <Text variant="gradient">Users Management</Text>
                    </Breadcrumbs>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('create-user')}>
                    New User
                </Button>
            </div>
            <UsersContent />
        </div>
    )
}

export default UserManagementTabs
