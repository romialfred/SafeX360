import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import TechMeasurementData from "./TechMeasurementData"


const TechMeasurements = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Technical Measurements</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Technical Measurements</Text>
                    </Breadcrumbs>
                </div>

            </div>

            <div className='mt-5   '>
                <TechMeasurementData />
            </div>


        </div>
    )
}

export default TechMeasurements