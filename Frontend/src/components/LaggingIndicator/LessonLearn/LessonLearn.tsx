import { IconBook } from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";
import LessonData from "./LessonData";

const LessonLearn = () => {
    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Centre de Connaissances' },
                    { label: "Retours d'expérience" },
                ]}
                icon={<IconBook size={22} stroke={2} />}
                iconColor="cyan"
                title="Retours d'expérience"
                subtitle="Documentation et partage des enseignements tirés des incidents — ISO 45001 §10.2.1.e"
            />
            <LessonData />
        </div>
    );
};

export default LessonLearn;
