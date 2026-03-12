import { Breadcrumbs, Button, Text } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import PgiData from "./PgiData";
import { IconAlertTriangle } from "@tabler/icons-react";


const Pgi = () => {
    const navigate = useNavigate();
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Planned General Inspections</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Planned General Inspections</Text>
                    </Breadcrumbs>
                </div>
                <Button
                    size="sm"
                    onClick={() => navigate('report')}
                    leftSection={<IconAlertTriangle />}
                    variant="gradient"
                >
                    Add Inspections
                </Button>
            </div>
            <p className=' italic my-3'>Plan, track, and monitor workplace safety and hazard inspections</p>

            <div className='mt-5   '>
                <PgiData />
            </div>


        </div>
    )
}

export default Pgi