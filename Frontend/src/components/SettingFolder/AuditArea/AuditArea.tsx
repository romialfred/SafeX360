import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import AuditAreaData from "./AuditAreaData"


const AuditArea = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    {/* LOT 40 P1: title color blue-500 -> slate-900 */}
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Audit Area</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumb variant=gradient -> c=dimmed / c=teal fw=500 */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/settings" ><Text c="dimmed" className="hover:!underline cursor-pointer">Setting</Text></Link>
                        <Text c="teal" fw={500}>Audit Area</Text>
                    </Breadcrumbs>
                </div>

            </div>

            <div className='mt-5   '>
                <AuditAreaData />
            </div>


        </div>
    )
}

export default AuditArea