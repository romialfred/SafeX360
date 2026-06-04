import { Breadcrumbs, Button, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import IncidentTypeData from "./IncidentTypeData";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";


const IncidentType = () => {
    const [opened, { open, close }] = useDisclosure(false);
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    {/* LOT 40 P1: title color blue-500 -> slate-900 */}
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Incidents Type</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumb variant=gradient -> c=dimmed / c=teal fw=500 */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/settings" ><Text c="dimmed" className="hover:!underline cursor-pointer">Setting</Text></Link>
                        <Text c="teal" fw={500}>Incidents Type</Text>
                    </Breadcrumbs>
                </div>
                <Button size='sm' leftSection={<IconPlus />} variant="gradient" onClick={open}>
                    New Incident Type
                </Button>
            </div>

            <div className='mt-5   '>
                <IncidentTypeData open={open} close={close} opened={opened} />
            </div>


        </div>
    )
}

export default IncidentType