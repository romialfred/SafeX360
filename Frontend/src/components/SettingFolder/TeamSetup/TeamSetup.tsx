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
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">H&S Committee</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">H&S Committee</Text>
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