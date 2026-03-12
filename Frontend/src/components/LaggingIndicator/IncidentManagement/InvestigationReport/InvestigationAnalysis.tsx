import { useState, useEffect } from 'react';
import { Text, Group, Loader, Accordion, Checkbox, Title } from '@mantine/core';
import { IconUser, IconPencil, IconCalculator, IconAlertTriangle, IconFile } from '@tabler/icons-react';
import TextEditor from '../../../UtilityComp/TextEditor';
import FileUpdateDropzone from '../../../UtilityComp/FileUpdateDropzone';


const InvestigationAnalysis = ({ form }: any) => {
    const [activeSections, setActiveSections] = useState<string[]>(['details']);
    const [isSaving, setIsSaving] = useState(false);

    const auditTypes = ["Errors", "Procedural violations", "Fatigue", "Distraction", "Work overload", "Insufficient training or skills"]
    const factors = ["Inadequate procedures", "Unsuitable tools or equipment", "Difficult working conditions"]
    const working = ["Ineffective supervision", "Failed communication", "Dangerous or uncontrolled environment"]
    const latent = ["Insufficient security policy", "Lack of training across the organization", "Poor safety culture", "Defects in the design of systems/processes"]


    useEffect(() => {
        const saveData = async () => {
            setIsSaving(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setIsSaving(false);
        };
        saveData();
    }, []);

    const progressItems = [
        { label: "Human Actions", status: form.values.humanCauses.length > 0 ? "done" : "pending" },
        { label: "Task-related Factors", status: form.values.taskCauses.length > 0 ? "done" : "pending" },
        { label: "Working Conditions", status: form.values.workingCauses.length > 0 ? "done" : "pending" },
        { label: "Organizational & Latent Failures", status: form.values.organizationCauses.length > 0 ? "done" : "pending" },
        { label: "Evidence", status: form.values.evidence.length > 0 ? "done" : "pending" },
    ];



    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold  text-gray-800">Investigation Analysis</h2>
                    <p className='text-gray-500'>Incident Cause Analysis Method - Select potential causes and provide detailed analysis</p>
                </div>

                {isSaving && (
                    <Group gap="xs">
                        <Loader size="xs" />
                        <Text size="sm" color="dimmed">Saving...</Text>
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
                        Human Actions
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="flex mt-3 flex-col gap-5">
                            <Checkbox.Group size="md"
                                {...form.getInputProps('humanCauses')}
                                label="Select Potential Causes:"
                                withAsterisk
                            >
                                <div className="flex flex-wrap mt-5 gap-2">
                                    {auditTypes.map((type) => (
                                        <div key={type} className="">
                                            <Checkbox.Card
                                                value={type}
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
                                                        className="text-gray-800 group-data-[checked]:text-blue-900 group-data-[checked]:font-semibold"
                                                    >
                                                        {type}
                                                    </Text>
                                                </Group>
                                            </Checkbox.Card>
                                        </div>
                                    ))}
                                </div>
                            </Checkbox.Group>

                            <TextEditor withAsterisk form={form} id="humanAnalysis" title="Detailed Analysis:" />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="investigation">
                    <Accordion.Control className='rounded-2xl' bg="pink.1" icon={<IconPencil size={20} />}>
                        Task-related Factors
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="flex mt-3 flex-col gap-5">
                            <Checkbox.Group size="md"
                                {...form.getInputProps('taskCauses')}
                                label="Select Potential Causes:"
                                withAsterisk
                            >
                                <div className="flex flex-wrap mt-5 gap-2">
                                    {factors.map((type) => (
                                        <div key={type} className="">
                                            <Checkbox.Card
                                                value={type}
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
                                                        className="text-gray-800 group-data-[checked]:text-blue-900 group-data-[checked]:font-semibold"
                                                    >
                                                        {type}
                                                    </Text>
                                                </Group>
                                            </Checkbox.Card>
                                        </div>
                                    ))}
                                </div>
                            </Checkbox.Group>

                            <TextEditor withAsterisk form={form} id="taskAnalysis" title="Detailed Analysis:" />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="environmental">
                    <Accordion.Control className='rounded-2xl' bg="green.1" icon={<IconCalculator size={20} />}>
                        Working Condtions
                    </Accordion.Control>
                    <Accordion.Panel>

                        <div className="flex mt-3 flex-col gap-5">
                            <Checkbox.Group size="md"
                                {...form.getInputProps('workingCauses')}
                                label="Select Potential Causes:"
                                withAsterisk
                            >
                                <div className="flex flex-wrap mt-5 gap-2">
                                    {working.map((type) => (
                                        <div key={type} className="">
                                            <Checkbox.Card
                                                value={type}
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
                                                        className="text-gray-800 group-data-[checked]:text-blue-900 group-data-[checked]:font-semibold"
                                                    >
                                                        {type}
                                                    </Text>
                                                </Group>
                                            </Checkbox.Card>
                                        </div>
                                    ))}
                                </div>
                            </Checkbox.Group>

                            <TextEditor withAsterisk form={form} id="workingAnalysis" title="Detailed Analysis:" />
                        </div>

                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="financial">
                    <Accordion.Control className='rounded-2xl' bg="violet.1" icon={<IconAlertTriangle size={20} />}>
                        Organizational & Latent Faliures
                    </Accordion.Control>
                    <Accordion.Panel>

                        <div className="flex mt-3 flex-col gap-5">
                            <Checkbox.Group size="md"
                                {...form.getInputProps('organizationCauses')}
                                label="Select Potential Causes:"
                                withAsterisk
                            >
                                <div className="flex flex-wrap mt-5 gap-2">
                                    {latent.map((type) => (
                                        <div key={type} className="">
                                            <Checkbox.Card
                                                value={type}
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
                                                        className="text-gray-800 group-data-[checked]:text-blue-900 group-data-[checked]:font-semibold"
                                                    >
                                                        {type}
                                                    </Text>
                                                </Group>
                                            </Checkbox.Card>
                                        </div>
                                    ))}
                                </div>
                            </Checkbox.Group>

                            <TextEditor withAsterisk form={form} id="organizationAnalysis" title="Detailed Analysis:" />
                        </div>

                    </Accordion.Panel>
                </Accordion.Item>

                {/* Community Impact */}
                <Accordion.Item value="community">
                    <Accordion.Control className='rounded-2xl' bg="yellow.1" icon={<IconFile size={20} />}>
                        Evidence
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className='flex mt-3 flex-col gap-5'>
                            <FileUpdateDropzone form={form} id="evidence" />
                            <div className="bg-blue-50 border border-blue-600 rounded-xl shadow-sm p-4">

                                <Title order={4} className="text-blue-500 font-semibold">
                                    Evidence Guidelines
                                </Title>


                                <ul className="p-5 list-disc list-inside text-sm text-blue-800 space-y-2">
                                    <li>Upload photos of the incident scene, damaged equipment, or safety violations</li>
                                    <li>Include relevant documents such as procedures, training records, or maintenance logs</li>
                                    <li>Add witness statements, expert reports, or technical analyses</li>
                                    <li>Ensure all evidence is relevant to the incident investigation</li>
                                    <li>Maximum file size: <strong>2MB</strong> per file</li>
                                </ul>
                            </div>
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-600 shadow-sm">
                <h2 className="text-lg font-semibold text-blue-500 mb-4">Analysis Progress</h2>

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