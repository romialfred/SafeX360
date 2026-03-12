import { Breadcrumbs, Button, Text } from "@mantine/core"
import { Link, useNavigate } from "react-router-dom"
import AuditData from "./AuditData"
import { IconCalendarCheck } from "@tabler/icons-react"


const Audit = () => {
    const navigate = useNavigate();
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Audit Management</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Audit Management</Text>
                    </Breadcrumbs>
                </div>
                <div className="flex gap-2">

                    <Button
                        size='sm'
                        onClick={() => navigate('new-audit')}
                        leftSection={<IconCalendarCheck />}
                        variant="gradient"
                    >
                        Schedule Audit
                    </Button>
                    <Button
                        size='sm'
                        onClick={() => navigate('/annual-audit-plan')}
                        leftSection={<IconCalendarCheck />}
                        color="red"
                        variant="outline"
                    >
                        Annual Audit Plan (AAP)
                    </Button>
                </div>

            </div>
            <p className=' italic my-3'>Comprehensive tracking of safety audits, findings, corrective actions, and compliance status</p>

            <div className='mt-5   '>
                <AuditData />
            </div>


        </div>
    )
}

export default Audit