import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import BodyPartsData from "./BodyPartsData"


const BodyParts = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    {/* LOT 40 P1: title color blue-500 -> slate-900 */}
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Body Parts</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumb variant=gradient -> c=dimmed / c=teal fw=500 */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text c="teal" fw={500}>Body Parts</Text>
                    </Breadcrumbs>
                </div>

            </div>

            <div className='mt-5   '>
                <BodyPartsData />
            </div>


        </div>
    )
}

export default BodyParts