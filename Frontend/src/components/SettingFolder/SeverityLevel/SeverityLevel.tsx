import { Breadcrumbs, Button, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import SeverityLevelData from "./SeverityLevelData";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";


const SeverityLevel = () => {
    const [opened, { open, close }] = useDisclosure(false);
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    {/* LOT 40 P1: title color blue-500 -> slate-900 */}
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Niveaux de gravité</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumb variant=gradient -> c=dimmed / c=teal fw=500 */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Accueil</Text></Link>
                        <Link className="hover:!underline" to="/settings" ><Text c="dimmed" className="hover:!underline cursor-pointer">Paramètres</Text></Link>
                        <Text c="teal" fw={500}>Niveaux de gravité</Text>
                    </Breadcrumbs>
                </div>
                <Button size='sm' leftSection={<IconPlus />} variant="gradient" onClick={open}>
                    Nouveau niveau de gravité
                </Button>
            </div>

            <div className='mt-5   '>
                <SeverityLevelData opened={opened} open={open} close={close} />
            </div>


        </div>
    )
}

export default SeverityLevel