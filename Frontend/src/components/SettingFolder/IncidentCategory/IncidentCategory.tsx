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
                    {/* LOT 40 P1: title color blue-500 -> slate-900 */}
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Incidents Category</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumb variant=gradient -> c=dimmed (non-leaf) / c=teal fw=500 (leaf) */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/settings" ><Text c="dimmed" className="hover:!underline cursor-pointer">Setting</Text></Link>
                        <Text c="teal" fw={500}>Incidents Category</Text>
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