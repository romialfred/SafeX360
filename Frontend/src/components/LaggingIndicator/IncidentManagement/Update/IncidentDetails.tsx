import {
    ActionIcon,
    Badge,
    Button,
    Checkbox,
    Fieldset,
    Group,
    MultiSelect,
    Select,
    SelectProps,
    Text,
    TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import TextEditor from "../../../UtilityComp/TextEditor";
import BodyPartSelect from "./BodyPartSelect";
import { modals } from "@mantine/modals";
import { removeIncidentDetail } from "../../../../services/IncidentDetailService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { getColorForSeverityLevel } from "../../../../utility/OtherUtilities";
import { incidentStatuses } from "../../../../Data/DropdownData";

const IncidentDetails = ({ form, weatherConditions, locations, categories, incidentTypes, severityLevelMap, bodyParts, departments, workAreas, workProcesses }: any) => {


    const [ppe, _setPPE] = useState([
        { id: 'helmet', name: 'Safety Helmet', required: false, worn: false },
        { id: 'goggles', name: 'Safety Goggles', required: false, worn: false },
        { id: 'gloves', name: 'Safety Gloves', required: false, worn: false },
        { id: 'boots', name: 'Safety Boots', required: false, worn: false },
        { id: 'vest', name: 'High-Visibility Vest', required: false, worn: false },
        { id: 'mask', name: 'Respiratory Mask', required: false, worn: false },
        { id: 'harness', name: 'Safety Harness', required: false, worn: false }
    ]);




    // const bodyParts = [
    //     { value: 'head', label: 'Head' },
    //     { value: 'eyes', label: 'Eyes' },
    //     { value: 'neck', label: 'Neck' },
    //     { value: 'shoulders', label: 'Shoulders' },
    //     { value: 'arms', label: 'Arms' },
    //     { value: 'hands', label: 'Hands' },
    //     { value: 'chest', label: 'Chest' },
    //     { value: 'back', label: 'Back' },
    //     { value: 'legs', label: 'Legs' },
    //     { value: 'feet', label: 'Feet' },
    //     { value: 'multiple', label: 'Multiple Parts' }
    // ];



    const handleAddIncident = () => {
        form.insertListItem('incidentDetails', {
            incidentCategoryId: '',
            incidentTypeId: '',
            severityLevelId: '',
            affectedBodyParts: [],
            environmentalImpact: '',
            containmentMeasures: ''
        });
    }

    const handleRemoveIncident = (index: number, id: any) => {
        if (id) {
            modals.openConfirmModal({
                title: <span className='font-semibold text-2xl'>Are you sure?</span>,
                centered: true,
                children: (
                    <span className="text-md">
                        You want to remove this incident? This action cannot be undone.
                    </span>
                ),
                labels: { confirm: `Yes, Remove`, cancel: 'Cancel' },
                cancelProps: { color: 'red', variant: "filled" },
                confirmProps: { color: 'green', variant: "filled" },

                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    form.removeListItem('incidentDetails', index);
                    removeIncidentDetail(id)
                        .then((_res) => {
                            successNotification("Incident removed successfully");
                        }
                        ).catch((err) => {
                            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                        }
                        )
                },
            });
        }
        else {
            form.removeListItem('incidentDetails', index);
        }
    }
    const renderSelectOption: SelectProps['renderOption'] = ({ option }: any) => (

        <Group wrap='nowrap' >
            <div>
                <Text size="md" className="flex gap-2">{option.label} <Badge color={getColorForSeverityLevel(severityLevelMap[option.severityLevel]?.level)}>{severityLevelMap[option.severityLevel]?.name}</Badge> </Text>
                <Text size="xs" color="dimmed">
                    {severityLevelMap[option.severityLevel]?.description}
                </Text>
            </div>
        </Group>

    );

    const handleTypeChange = (value: string | null, index: any) => {
        form.setFieldValue(`incidentDetails.${index}.incidentTypeId`, value);
        formReset(index);

        form.setFieldValue(`incidentDetails.${index}.severityLevelId`, incidentTypes.find((x: any) => x.value == value)?.severityLevel);
    }

    const handleCategoryChange = (value: string | null, index: any) => {
        form.setFieldValue(`incidentDetails.${index}.incidentCategoryId`, value);
        form.setFieldValue(`incidentDetails.${index}.incidentTypeId`, null);
        formReset(index);
    }
    const formReset = (index: number) => {
        form.setFieldValue(`incidentDetails.${index}.affectedBodyParts`, []);
        form.setFieldValue(`incidentDetails.${index}.environmentalImpact`, '');
        form.setFieldValue(`incidentDetails.${index}.containmentMeasures`, '');
        form.setFieldValue(`incidentDetails.${index}.severityLevelId`, '');
    }

    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md">
            <div className="flex justify-between items-center mb-2">

                <h2 className="text-xl font-semibold text-gray-800 mb-4">Incident Information</h2>
                <Select {...form.getInputProps("status")} data={incidentStatuses} allowDeselect={false} />
            </div>
            <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <TextInput disabled {...form.getInputProps("number")} readOnly label="Incident Number" placeholder="Enter incident number" withAsterisk />
                    <TextInput {...form.getInputProps("title")} label="Incident Title" placeholder="Enter incident title" withAsterisk />

                    <DateTimePicker maxDate={form.values.discoveryTime}  {...form.getInputProps("occurredAt")} label="Incident Date and Time" placeholder="Pick date and time" withAsterisk />
                    <DateTimePicker minDate={form.values.occurredAt} maxDate={new Date()} {...form.getInputProps("discoveryTime")} label="Discovery Date and Time" placeholder="Pick date and time" withAsterisk />

                </div>

                <Checkbox.Group size="md"
                    {...form.getInputProps("ppe")}
                    label="Personal Protective Equipment (PPE)"
                >
                    <div className="flex flex-wrap mt-5 gap-2">
                        {ppe.map((item: any) => (
                            <div key={item.id} className="">

                                <Checkbox.Card key={item.id}
                                    value={item.id}
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
                                            {item.name}
                                        </Text>
                                    </Group>
                                </Checkbox.Card>

                            </div>
                        ))}
                    </div>
                </Checkbox.Group>
                <div className="flex flex-col gap-5">
                    <div className="flex justify-between items-center">

                        <h3 className="font-medium text-lg text-gray-800 mb-4">Incident Classification</h3>
                        <Button onClick={handleAddIncident} leftSection={<IconPlus />} variant="gradient" >Add Incident</Button>
                    </div>
                    {form.values.incidentDetails && form.values.incidentDetails.map((x: any, index: any) => <Fieldset key={index} className="grid grid-cols-2 gap-6" legend={<div className="flex gap-5">
                        <div className="text-lg font-medium text-blue-500">Incident {index + 1}</div>
                        <ActionIcon onClick={() => handleRemoveIncident(index, x.id)} variant="filled" color="red" aria-label="Settings">
                            <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                        </ActionIcon>
                    </div>}>
                        <Select withAsterisk {...form.getInputProps(`incidentDetails.${index}.incidentCategoryId`)} onChange={(e) => handleCategoryChange(e, index)} data={categories} label="Incident Category" placeholder="Select incident category" />
                        <div className="flex flex-col gap-1">

                            <Select
                                withAsterisk
                                renderOption={renderSelectOption}{...form.getInputProps(`incidentDetails.${index}.incidentTypeId`)} onChange={(e) => handleTypeChange(e, index)} data={incidentTypes.filter((x: any) => x.category == form.getInputProps(`incidentDetails.${index}.incidentCategoryId`)?.value)} label="Incident Type" placeholder="Select incident type" />
                            {severityLevelMap[x.severityLevelId]?.level > 3 && <Text color="red">This incident will require deep investigation</Text>}
                        </div>
                        {/* <Select readOnly {...form.getInputProps(`incidentDetails.${index}.severityLevelId`)} data={severityLevels} label="Severity Level" placeholder="Select severity level" /> */}

                        {(incidentTypes.find((x: any) => x.value == form.getInputProps(`incidentDetails.${index}.incidentTypeId`).value)?.label == "Blessure avec traitement" || incidentTypes.find((x: any) => x.value == form.getInputProps(`incidentDetails.${index}.incidentTypeId`).value)?.label == "Premiers soins" || incidentTypes.find((x: any) => x.value == form.getInputProps(`incidentDetails.${index}.incidentTypeId`).value)?.label == "First Aid" || incidentTypes.find((x: any) => x.value == form.getInputProps(`incidentDetails.${index}.incidentTypeId`).value)?.label == "Injury with treatment") &&
                            <div className="space-y-4 col-span-3 bg-red-50 p-4 rounded-lg mt-4">
                                <h3 className="font-medium text-gray-800">Injury Details</h3>

                                <BodyPartSelect bodyParts={bodyParts} form={form} id={`incidentDetails.${index}.affectedBodyParts`} />


                            </div>
                        }
                        {
                            categories.find((x: any) => x.value == form.getInputProps(`incidentDetails.${index}.incidentCategoryId`)?.value)?.label == "Environmental" && < div className="space-y-4 col-span-3 bg-green-50 p-4 rounded-lg mt-4">
                                <h3 className="font-medium text-gray-800">Environment Incident Details</h3>
                                <TextEditor form={form} id={`incidentDetails.${index}.environmentalImpact`} title="Environmental Impact" />
                                <TextEditor form={form} id={`incidentDetails.${index}.containmentMeasures`} title="Containment Measures" />
                            </div>
                        }
                    </Fieldset>)}
                </div>

                {/* <TextEditor withAsterisk form={form} id="description" title="Description" /> */}

                <div className="flex flex-col gap-3">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Location and Work Context</h2>
                    <div className="flex flex-col gap-4">
                        <div>
                            <Select {...form.getInputProps("locationId")} data={locations} label="Incident Location" placeholder="Select incident location" withAsterisk />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Select {...form.getInputProps("department")} label="Department" placeholder="Select department" withAsterisk data={departments} />
                            <Select {...form.getInputProps("workAreaId")} label="Work Area" placeholder="Select work area" withAsterisk data={workAreas.filter((x: any) => x.departmentId == form.values.department)} />
                            <Select {...form.getInputProps("workProcessId")} label="Work Process" placeholder="Select work process" withAsterisk data={workProcesses.filter((x: any) => x.departmentId == form.values.department)} />
                        </div>
                        <div>
                            <MultiSelect {...form.getInputProps("weatherConditions")} data={weatherConditions} label="Environmental Conditions" placeholder="Select environmental conditions" withAsterisk />
                        </div>
                    </div>

                </div>
            </div>


        </div >
    )
}

export default IncidentDetails