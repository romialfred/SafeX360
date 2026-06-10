import { IconFileCheck } from "@tabler/icons-react"
import PageHeader from "../../UtilityComp/PageHeader"
import CompData from "./CompData"

const CompRequirement = () => {
    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Exigences légales' },
                ]}
                icon={<IconFileCheck size={22} stroke={2} />}
                iconColor="teal"
                title="Exigences réglementaires"
                subtitle="Obligations légales, réglementaires et organisationnelles applicables au site minier"
            />
            <CompData />
        </div>
    )
}

export default CompRequirement