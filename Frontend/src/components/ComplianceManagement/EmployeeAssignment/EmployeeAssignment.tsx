import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import EmpData from "./EmpData"

const EmployeeAssignment = () => {
    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Employee Assignments</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Employee Assignments</Text>
                    </Breadcrumbs>
                </div>
            </div>
            <p className=' italic my-3'>
                Allocation of compliance tasks and responsibilities to individual employees
            </p>

            <div className='mt-5   '>
                <EmpData />
            </div>
        </div>
    )
}

export default EmployeeAssignment