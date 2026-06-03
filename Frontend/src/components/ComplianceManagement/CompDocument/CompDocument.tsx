import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import CompDocData from "./CompDocData"


const CompDocument = () => {
    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Compliance Documents</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Compliance Documents</Text>
                    </Breadcrumbs>
                </div>
            </div>
            <p className=' italic my-3'>

                Centralized repository of policies, procedures, and records supporting regulatory compliance
            </p>
            <div className='mt-5   '>
                <CompDocData />
            </div>
        </div>
    )
}

export default CompDocument