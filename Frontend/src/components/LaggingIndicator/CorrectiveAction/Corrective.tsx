import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import CorrectiveData from "./CorrectiveData"


const Corrective = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Action Plans</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Action Plans</Text>
                    </Breadcrumbs>
                </div>

            </div>
            <p className=' italic my-3'>Assign, monitor, and complete corrective and preventive action plans</p>
            <div className='mt-5   '>
                <CorrectiveData />
            </div>


        </div>
    )
}

export default Corrective