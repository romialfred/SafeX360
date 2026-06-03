import { Breadcrumbs, Button, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import IncidentCategoryData from "./IncidentCategoryData"
import { IconPlus } from "@tabler/icons-react"
import { useDisclosure } from "@mantine/hooks"

const IncidentCategory = () => {
    const [opened, { open, close }] = useDisclosure(false);
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Incidents Category</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/settings" ><Text variant="gradient" className="hover:!underline cursor-pointer">Setting</Text></Link>
                        <Text variant="gradient">Incidents Category</Text>
                    </Breadcrumbs>
                </div>
                <Button size='sm' leftSection={<IconPlus />} variant="gradient" onClick={open}>
                    New Incident Category
                </Button>
            </div>

            <div className='mt-5   '>
                <IncidentCategoryData open={open} close={close} opened={opened} />
            </div>


        </div>
    )
}

export default IncidentCategory