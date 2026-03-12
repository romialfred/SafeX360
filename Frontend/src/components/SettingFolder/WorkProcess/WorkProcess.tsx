import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import WorkProcessData from "./WorkProcessData"


const WorkProcess = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Work Process</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Work Process</Text>
                    </Breadcrumbs>
                </div>

            </div>

            <div className='mt-5   '>
                <WorkProcessData />
            </div>


        </div>
    )
}

export default WorkProcess