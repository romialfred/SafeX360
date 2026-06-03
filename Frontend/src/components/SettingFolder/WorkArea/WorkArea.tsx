import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import WorkAreaData from "./WorkAreaData"

const WorkArea = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Work Area</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/settings" ><Text variant="gradient" className="hover:!underline cursor-pointer">Setting</Text></Link>
                        <Text variant="gradient">Work Area</Text>
                    </Breadcrumbs>
                </div>

            </div>

            <div className='mt-5   '>
                <WorkAreaData />
            </div>


        </div>
    )
}

export default WorkArea