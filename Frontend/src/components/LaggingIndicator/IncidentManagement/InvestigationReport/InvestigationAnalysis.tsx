import { useState, useEffect } from 'react';
import { Text, Group, Loader, Accordion, Checkbox, Title } from '@mantine/core';
import { IconUser, IconPencil, IconCalculator, IconAlertTriangle, IconFile } from '@tabler/icons-react';
import TextEditor from '../../../UtilityComp/TextEditor';
import FileUpdateDropzone from '../../../UtilityComp/FileUpdateDropzone';
import {
    HUMAN_CAUSE_OPTIONS,
    TASK_CAUSE_OPTIONS,
    WORKING_CAUSE_OPTIONS,
    ORGANIZATION_CAUSE_OPTIONS,
} from '../incidentLabels';

/**
 * Étape 2 du wizard d'investigation — analyse des causes (méthode ICAM).
 * Les valeurs des causes restent les codes historiques anglais du backend ;
 * seul l'affichage est traduit (voir incidentLabels.ts).
 */

/** Groupe de cases à cocher des causes potentielles (valeur backend, libellé FR). */
const CauseCheckboxGroup = ({ form, fieldId, options }: {
    form: any;
    fieldId: string;
    options: { value: string; label: string }[];
}) => (
    <Checkbox.Group size="md"
        {...form.getInputProps(fieldId)}
        label="Causes potentielles :"
        withAsterisk
    >
        <div className="flex flex-wrap mt-5 gap-2">
            {options.map((opt) => (
                <div key={opt.value} className="">
                    <Checkbox.Card
                        value={opt.value}
                        radius="md"
                        className="group border border-gray-300 transition duration-150 cursor-pointer
                     hover:!border-primary hover:!bg-primary/10
                     data-[checked]:!border-primary data-[checked]:!bg-primary/20
                     data-[checked]:shadow-sm"
                        p="xs"
                    >
                        <Group align="center" gap="xs">
                            <Checkbox.Indicator size="xs" className=" text-blue-600" />
                            <Text
                                size="xs"
                                className="text-gray-800 group-data-[checked]:text-blue-900 group-data-[checked]:font-medium"
                            >
                                {opt.label}
                            </Text>
                        </Group>
                    </Checkbox.Card>
                </div>
            ))}
        </div>
    </Checkbox.Group>
);

const InvestigationAnalysis = ({ form }: any) => {
    const [activeSections, setActiveSections] = useState<string[]>(['details']);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const saveData = async () => {
            setIsSaving(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setIsSaving(false);
        };
        saveData();
    }, []);

    const progressItems = [
        { label: "Actions humaines", status: form.values.humanCauses.length > 0 ? "done" : "pending" },
        { label: "Facteurs liés à la tâche", status: form.values.taskCauses.length > 0 ? "done" : "pending" },
        { label: "Conditions de travail", status: form.values.workingCauses.length > 0 ? "done" : "pending" },
        { label: "Défaillances organisationnelles", status: form.values.organizationCauses.length > 0 ? "done" : "pending" },
        { label: "Preuves", status: form.values.evidence.length > 0 ? "done" : "pending" },
    ];

    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg  text-gray-800">Analyse des causes</h2>
                    <p className='text-gray-500'>Méthode ICAM — sélectionner les causes potentielles et détailler l'analyse</p>
                </div>

                {isSaving && (
                    <Group gap="xs">
                        <Loader size="xs" />
                        <Text size="sm" c="dimmed">Enregistrement…</Text>
                    </Group>
                )}
            </div>

            <Accordion
                radius="lg"
                multiple
                value={activeSections}
                onChange={setActiveSections}
                variant="separated"
            >
                <Accordion.Item value="details">
                    <Accordion.Control className='rounded-2xl' bg="blue.1" icon={<IconUser size={20} />}>
                        Actions humaines
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="flex mt-3 flex-col gap-5">
                            <CauseCheckboxGroup form={form} fieldId="humanCauses" options={HUMAN_CAUSE_OPTIONS} />
                            <TextEditor withAsterisk form={form} id="humanAnalysis" title="Analyse détaillée" />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="investigation">
                    <Accordion.Control className='rounded-2xl' bg="pink.1" icon={<IconPencil size={20} />}>
                        Facteurs liés à la tâche
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="flex mt-3 flex-col gap-5">
                            <CauseCheckboxGroup form={form} fieldId="taskCauses" options={TASK_CAUSE_OPTIONS} />
                            <TextEditor withAsterisk form={form} id="taskAnalysis" title="Analyse détaillée" />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="environmental">
                    <Accordion.Control className='rounded-2xl' bg="green.1" icon={<IconCalculator size={20} />}>
                        Conditions de travail
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="flex mt-3 flex-col gap-5">
                            <CauseCheckboxGroup form={form} fieldId="workingCauses" options={WORKING_CAUSE_OPTIONS} />
                            <TextEditor withAsterisk form={form} id="workingAnalysis" title="Analyse détaillée" />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="financial">
                    <Accordion.Control className='rounded-2xl' bg="violet.1" icon={<IconAlertTriangle size={20} />}>
                        Défaillances organisationnelles et latentes
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="flex mt-3 flex-col gap-5">
                            <CauseCheckboxGroup form={form} fieldId="organizationCauses" options={ORGANIZATION_CAUSE_OPTIONS} />
                            <TextEditor withAsterisk form={form} id="organizationAnalysis" title="Analyse détaillée" />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

                {/* Preuves */}
                <Accordion.Item value="community">
                    <Accordion.Control className='rounded-2xl' bg="yellow.1" icon={<IconFile size={20} />}>
                        Preuves
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className='flex mt-3 flex-col gap-5'>
                            <FileUpdateDropzone form={form} id="evidence" />
                            <div className="bg-blue-50 border border-blue-600 rounded-xl shadow-sm p-4">

                                <Title order={4} className="text-blue-500">
                                    Consignes pour les preuves
                                </Title>


                                <ul className="p-5 list-disc list-inside text-sm text-blue-800 space-y-2">
                                    <li>Joindre des photos de la scène, des équipements endommagés ou des manquements constatés</li>
                                    <li>Inclure les documents pertinents : procédures, dossiers de formation, registres de maintenance</li>
                                    <li>Ajouter les témoignages, rapports d'experts ou analyses techniques</li>
                                    <li>Vérifier que chaque pièce est en lien direct avec l'investigation</li>
                                    <li>Taille maximale : <strong>2 Mo</strong> par fichier</li>
                                </ul>
                            </div>
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-600 shadow-sm">
                <h2 className="text-lg text-blue-500 mb-4">Avancement de l'analyse</h2>

                <div className="flex  gap-3">
                    {progressItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <span
                                className={`w-3 h-3 rounded-full ${item.status === "done" ? "bg-green-500" : "bg-gray-300"
                                    }`}
                            />
                            <span className="text-sm text-gray-800">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default InvestigationAnalysis
