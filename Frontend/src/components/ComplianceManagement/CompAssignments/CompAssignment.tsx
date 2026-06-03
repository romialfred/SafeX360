import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import AssignData from "./AssignData"

const CompAssignment = () => {
    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Position Compliance Assignments</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Position Compliance Assignments</Text>
                    </Breadcrumbs>
                </div>
            </div>
            <p className=' italic my-3'>

                Mapping job roles to mandatory safety requirements, ensuring compliance responsibilities are clearly assigned.
            </p>
            <div className='mt-5   '>
                <AssignData />
            </div>
        </div>
    )
}

export default CompAssignment