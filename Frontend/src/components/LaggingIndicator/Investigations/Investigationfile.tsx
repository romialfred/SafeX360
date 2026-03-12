import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import InvestigationFileData from "./InvestigationFileData"


const Investigationfile = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Investigation</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Investigation</Text>
                    </Breadcrumbs>
                </div>

            </div>
            <p className=' italic my-3'>Analyze incident root causes and hazards to implement corrective actions</p>
            <div className='mt-5   '>
                <InvestigationFileData />

            </div>


        </div>
    )
}

export default Investigationfile