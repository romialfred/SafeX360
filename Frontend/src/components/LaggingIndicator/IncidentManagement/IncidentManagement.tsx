import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import IncidentManagementData from "./IncidentManagementData"


const IncidentManagement = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Incidents Management</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Incidents Management</Text>
                    </Breadcrumbs>
                </div>

            </div>
            <p className=' italic my-3'>Centralize and track reported incidents and hazards across departments</p>

            <div className='mt-5   '>
                <IncidentManagementData />
            </div>


        </div>
    )
}

export default IncidentManagement