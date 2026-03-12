import { Breadcrumbs, Button, Text } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import HealthData from "./HealthData";
import { IconPlus } from "@tabler/icons-react";


const HealthMeeting = () => {
    const navigate = useNavigate();
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Meeting Managers</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Meeting Managers</Text>
                    </Breadcrumbs>
                </div>
                <Button
                    size='sm'
                    onClick={() => navigate('/add-NewActivity')}
                    leftSection={<IconPlus />}
                    variant='gradient'
                >
                    Add New Activity
                </Button>
            </div>
            <p className=' italic my-3'>Record, follow up, and close action points within Meeting Managers</p>
            <div className='mt-5   '>
                <HealthData />
            </div>


        </div>
    )
}

export default HealthMeeting
