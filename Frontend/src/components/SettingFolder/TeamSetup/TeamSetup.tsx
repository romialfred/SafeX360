import { Breadcrumbs, Button, Text } from "@mantine/core"
import { Link, useNavigate } from "react-router-dom"
import TeamSetupData from "./TeamSetupData"
import { IconPlus } from "@tabler/icons-react"


const TeamSetup = () => {
    const navigate = useNavigate();
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    {/* LOT 40 P1: title color blue-500 -> slate-900 */}
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text ">H&S Committee</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumb variant=gradient -> c=dimmed / c=teal fw=500 */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text c="teal" fw={500}>H&S Committee</Text>
                    </Breadcrumbs>
                </div>
                <Button size='sm' leftSection={<IconPlus />} variant="gradient" onClick={() => navigate('/addTeam')}>
                    Add H&S Committee
                </Button>
            </div>

            <div className='mt-5   '>
                <TeamSetupData />
            </div>


        </div>
    )
}

export default TeamSetup