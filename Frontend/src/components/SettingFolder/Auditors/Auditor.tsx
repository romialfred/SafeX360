import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import AuiditorData from "./AuiditorData"

const Auditor = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Auditor Management</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Auditor Management</Text>
                    </Breadcrumbs>
                </div>

            </div>

            <div className='mt-5   '>
                <AuiditorData />
            </div>


        </div>
    )
}

export default Auditor