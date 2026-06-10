import TextEditor from "../../../UtilityComp/TextEditor";
import { Title } from "@mantine/core";


const InvestigationReport = ({ form }: any) => {

    return (
        <div className="p-5 mt-3 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <div className="">
                <TextEditor withAsterisk form={form} id="report" title="Rapport d'investigation" className="h-![400px]" />
            </div>
            <div className="bg-blue-50 border border-blue-600 rounded-xl shadow-sm p-4">

                <Title order={4} className="text-blue-500">
                    Consignes de rédaction
                </Title>


                <ul className="p-5 list-disc list-inside text-sm text-blue-800 space-y-2">
                    <li>Résumer clairement les faits et leur déroulement</li>
                    <li>Décrire la démarche et la méthode d'investigation employée</li>
                    <li>Présenter les constats dans un ordre logique</li>
                    <li>Inclure l'analyse des causes profondes et des facteurs contributifs</li>
                    <li>Formuler des recommandations de prévention précises</li>
                    <li>Joindre les preuves et la documentation à l'appui</li>
                </ul>
            </div>
        </div>
    )
}

export default InvestigationReport