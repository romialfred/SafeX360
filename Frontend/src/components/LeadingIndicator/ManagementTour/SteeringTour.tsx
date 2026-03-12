import { Breadcrumbs, Button, Text } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import TourData from "./TourData";
import { IconPlus } from "@tabler/icons-react";

const SteeringTour = () => {
    const navigate = useNavigate();
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Leadership Walk</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Leadership Walk</Text>
                    </Breadcrumbs>
                </div>
                <Button
                    size="sm"
                    onClick={() => navigate('/add-tour')}
                    leftSection={<IconPlus />}
                    variant="gradient"
                >
                    Add New Tour
                </Button>
            </div>
            <p className=' italic my-3'>Proactive workplace walkthroughs ensuring safety compliance, engagement, and continuous improvement</p>
            <div className='mt-5   '>
                <TourData />
            </div>


        </div>
    )
}


export default SteeringTour