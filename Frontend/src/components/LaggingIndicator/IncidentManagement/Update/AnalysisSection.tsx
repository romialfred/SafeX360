import { useState, useEffect } from 'react';
import { Select as MantineSelect, Text, Group, Loader, Accordion, NumberInput, Button, Fieldset, ActionIcon, Select, TextInput } from '@mantine/core';
import { IconMicroscope, IconLeaf, IconUsers, IconCurrencyDollar, IconCalendar, IconPlus, IconTrash } from '@tabler/icons-react';
import TextEditor from '../../../UtilityComp/TextEditor';
import { DateInput } from '@mantine/dates';
import UpdateImageDropzone from '../../../UtilityComp/UpdateImageDropzone';
import { modals } from '@mantine/modals';
import { errorNotification, successNotification } from '../../../../utility/NotificationUtility';
import { removeCorrectiveAction } from '../../../../services/CorrectiveActionService';


const AnalysisSection = ({ form, employees }: any) => {
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

    const severityLevels = [
        { value: 'low', label: '1 - Low Impact' },
        { value: 'medium', label: '2 - Medium Impact' },
        { value: 'high', label: '3 - High Impact' },
        { value: 'critical', label: '4 - Critical Impact' }
    ];


    const handleAddIncident = () => {
        form.insertListItem('correctiveActions', {
            actionName: '',
            deadline: '',
            assignedEmployeeId: "",
            status: "",
            description: ""
        });
    }

    const handleRemoveActionPlan = (index: number, id: any) => {
        console.log("ID", id);
        if (id) {
            modals.openConfirmModal({
                title: <span className='font-semibold text-2xl'>Are you sure?</span>,
                centered: true,
                children: (
                    <span className="text-md">
                        You want to remove this action plan? This action cannot be undone.
                    </span>
                ),
                labels: { confirm: `Yes, Remove`, cancel: 'Cancel' },
                cancelProps: { color: 'red', variant: "filled" },
                confirmProps: { color: 'green', variant: "filled" },

                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    form.removeListItem('correctiveActions', index);
                    removeCorrectiveAction(id)
                        .then((_res) => {
                            successNotification("Action Plan removed successfully");
                        }
                        ).catch((err) => {
                            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                        }
                        )
                },
            });
        }
        else {
            form.removeListItem('correctiveActions', index);
        }
    }

    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold mb-5 text-gray-800">Impact Assessment & Analysis</h2>
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
                    <Accordion.Control className='rounded-2xl' bg="blue.1" icon={<IconMicroscope size={20} />}>
                        Analysis Details
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="p-4 grid grid-cols-2 gap-5">
                            <DateInput minDate={form.values.occurredAt} withAsterisk {...form.getInputProps('startDate')} maxDate={form.values.endDate ? new Date(form.values.endDate) : undefined} label="Analysis Start Date" placeholder='Enter start date' />
                            <DateInput {...form.getInputProps('endDate')} minDate={form.values.startDate ? new Date(form.values.startDate) : undefined} label="Analysis End Date" placeholder='Enter end date' />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="investigation">
                    <Accordion.Control className='rounded-2xl' bg="pink.1" icon={<IconMicroscope size={20} />}>
                        Investigation Results
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="p-4 space-y-4">
                            <TextEditor id="investigationFindings" form={form} title="Investigation Findings" />
                            <UpdateImageDropzone form={form} id="supportingEvidence" title="Supporting Evidence" />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="environmental">
                    <Accordion.Control className='rounded-2xl' bg="green.1" icon={<IconLeaf size={20} />}>
                        Environmental Impact
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="p-4 space-y-4">
                            <MantineSelect {...form?.getInputProps('environmentalImpactSeverity')}
                                label="Environmental Impact Severity"
                                data={severityLevels}
                                placeholder="Select Severity"

                            />

                            <TextEditor form={form} id="environmentalImpactDescription" title="Environmental Impact Description" />

                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="financial">
                    <Accordion.Control className='rounded-2xl' bg="violet.1" icon={<IconCurrencyDollar size={20} />}>
                        Financial Impact
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="p-4 space-y-4">
                            <div className='grid grid-cols-2 gap-5'>
                                <NumberInput {...form?.getInputProps("directCosts")} label="Direct Costs(USD)" hideControls placeholder="Enter direct costs" />
                                <NumberInput  {...form?.getInputProps("indirectCosts")} label="Indirect Costs(USD)" hideControls placeholder="Enter indirect costs" />

                            </div>
                            <TextEditor form={form} id="financialImpactDetails" title="Financial Impact Details" />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

                {/* Community Impact */}
                <Accordion.Item value="community">
                    <Accordion.Control className='rounded-2xl' bg="yellow.1" icon={<IconUsers size={20} />}>
                        Community Impact
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="p-4 space-y-4">
                            <MantineSelect {...form.getInputProps('communityImpactSeverity')}
                                label="Community Impact Severity"
                                data={severityLevels}
                                placeholder="Select Severity"

                            />

                            <TextEditor form={form} id="communityImpactDescription" title="Community Impact Description" />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="actionPlans">
                    <Accordion.Control className='rounded-2xl' bg="orange.1" icon={<IconCalendar size={20} />}>
                        Action Plans
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div className="flex flex-col p-5 gap-5">
                            <div className="flex justify-between items-center">

                                <h3 className="font-medium text-lg text-gray-800 mb-4">Corrective Actions</h3>
                                <Button onClick={handleAddIncident} leftSection={<IconPlus />} >Add Action Plan</Button>
                            </div>
                            {form?.values.correctiveActions && form?.values.correctiveActions.map((x: any, index: any) => <Fieldset className="grid grid-cols-2 gap-6" legend={<div className="flex gap-5">
                                <div className="text-lg font-medium text-blue-500">Action {index + 1}</div>
                                {<ActionIcon onClick={() => handleRemoveActionPlan(index, x.id)} variant="filled" color="red" aria-label="Settings">
                                    <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                </ActionIcon>}
                            </div>}>
                                <TextInput withAsterisk {...form.getInputProps(`correctiveActions.${index}.actionName`)} label="Action Plan Name" placeholder='Enter action plan name' />
                                <Select {...form.getInputProps(`correctiveActions.${index}.assignedEmployeeId`)} data={employees?.map((x: any) => ({ value: "" + x.id, label: x.name }))} label="Assign Employee" placeholder="Select assigned employee" />
                                <DateInput withAsterisk {...form.getInputProps(`correctiveActions.${index}.deadline`)} label="Deadline" placeholder="Select deadline" />
                                <Select withAsterisk {...form.getInputProps(`correctiveActions.${index}.status`)} data={[{ label: "Pending", value: "PENDING" }, { label: "In-Progress", value: "IN_PROGRESS" }, { label: "Canceled", value: "CANCELED" }, { label: "Completed", value: "COMPLETED" }]} label="Status" placeholder="Select status" />
                                <div className='col-span-2'>

                                    <TextEditor withAsterisk form={form} id={`correctiveActions.${index}.description`} title="Description" />
                                </div>
                            </Fieldset>)}
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

            </Accordion>
        </div>
    );
};

export default AnalysisSection;