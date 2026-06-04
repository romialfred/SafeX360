import { Button } from "@mantine/core"
import { useNavigate } from "react-router-dom"
import AuditData from "./AuditData"
import { IconCalendarCheck, IconClipboardCheck, IconPlus, IconFileExport } from "@tabler/icons-react"
import PageHeader from "../../UtilityComp/PageHeader"

const Audit = () => {
    const navigate = useNavigate();
    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des audits' },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="indigo"
                title="Gestion des audits"
                subtitle="Programme d'audits internes ISO 19011 et suivi des constats, recommandations et clôtures"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconFileExport size={15} />}>
                            Exporter
                        </Button>
                        <Button
                            size="sm"
                            variant="default"
                            leftSection={<IconCalendarCheck size={15} />}
                            onClick={() => navigate('/annual-audit-plan')}
                        >
                            Plan annuel
                        </Button>
                        <Button
                            size="sm"
                            color="indigo"
                            leftSection={<IconPlus size={15} />}
                            onClick={() => navigate('new-audit')}
                        >
                            Programmer un audit
                        </Button>
                    </>
                }
            />
            <AuditData />
        </div>
    )
}

export default Audit
