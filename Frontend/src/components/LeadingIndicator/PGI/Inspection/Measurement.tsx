import { Badge, Button, Card, Group, LoadingOverlay, Modal, NumberInput, Select, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { IconAlertCircle, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getAllActiveMeasurement } from "../../../../services/TechMeasurementService";
import { mapIdToName } from "../../../../utility/OtherUtilities";
import SearchableObjectDropdown from "../../../UtilityComp/SearchableDropdown";
import { useParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { removeInsMeasurement } from "../../../../services/InspectionProcessService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import TextEditor from "../../../UtilityComp/TextEditor";
import { createCorrectiveAction } from "../../../../services/CorrectiveActionService";


const Measurement = ({ form, employee }: any) => {
    const { id } = useParams();
    const [measurement, setMeasurement] = useState<any>([]);
    const [record, setMeasurementRecord] = useState<Record<string, any>>({});
    const [selectedMeasurement, setSelectedMeasurement] = useState<any>([]);

    const [opened, { open, close }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getAllActiveMeasurement().then((res) => {
            setMeasurement(res);
            setMeasurementRecord(mapIdToName(res));
        }
        ).catch((_err) => { })
    }, [])

    useEffect(() => {

        if (form.values.measurements && form.values.measurements.length > 0) {
            const selectedIds = form.values.measurements.map((item: any) => Number(item.measurementId));
            setSelectedMeasurement(selectedIds);
        }
    }, [form.values.measurements]);



    const handleItemSelect = (item: any) => {
        form.insertListItem('measurements', {
            measurementId: item.id,
            value: "",
            generalInspectionId: id
        });
        // setSelectedMeasurement((prev: any) => [...prev, item.id]);
    }

    const handleItemDelete = (index: number) => {
        form.removeListItem('measurements', index);
        setSelectedMeasurement((prev: any) => {
            const newSelectedChecklist = [...prev];
            newSelectedChecklist.splice(index, 1);
            return newSelectedChecklist;
        }
        );
    }
    const onAddActionPlan = () => {
        actionForm.reset();
        open();
    }

    const handleRemove = (index: number, id: any) => {
        if (id) {
            modals.openConfirmModal({
                title: <span className="text-2xl">Are you sure?</span>,
                centered: true,
                children: (
                    <span className="text-md">
                        You want to remove this measurement? This action cannot be undone.
                    </span>
                ),
                labels: { confirm: `Yes, Remove`, cancel: "Cancel" },
                cancelProps: { color: "red", variant: "filled" },
                confirmProps: { color: "green", variant: "filled" },
                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    handleItemDelete(index);
                    removeInsMeasurement(id)
                        .then(() => {
                            successNotification("Measurement removed successfully");
                        }
                        ).catch((err) => {
                            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                        }
                        )
                },
            });
        } else {
            handleItemDelete(index);
        }
    }

    const actionForm = useForm({
        initialValues: {
            actionName: "",
            assignedEmployeeId: "",
            deadline: "",
            status: "",
            description: "",
            generalInspectionId: id,
        },
        validate: {
            actionName: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Action Plan Name required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            assignedEmployeeId: (value) => (!value ? "Please select an employee" : null),
            deadline: (value) => (!value ? "Please select a deadline" : null),
            status: (value) => (!value ? "Please select a status" : null),

        }
    })


    const handleClose = () => {
        close();
        // form.resetField("measurements");
    }

    const handleSubmit = (values: any) => {
        console.log(values);

        modals.openConfirmModal({
            title: <span className="text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to add this action plan? This action cannot be undone.
                </span>
            ),
            labels: { confirm: `Yes, Add `, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                setLoading(true);
                createCorrectiveAction(values)
                    .then(() => {
                        successNotification("Action plan added successfully");
                        close();
                        actionForm.reset();
                    }
                    ).catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                    }
                    ).finally(() => {
                        setLoading(false);
                    }
                    )

            },
        });
    }

    return (
        <div className="flex flex-col gap-5">

            {form.values.measurements.map((x: any, index: any) => {
                const value = form.values.measurements[index].value;
                const isExceeded = typeof value === 'number' && (value > record[x.measurementId]?.threshold);

                return (
                    <Card key={index} shadow="sm" radius="md" withBorder className="bg-white p-4">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Group justify="space-between" align="center">
                                <Text size="lg">
                                    {record[x.measurementId]?.name}
                                </Text>

                                <Group gap="xs">
                                    <Badge size="lg" color={isExceeded ? 'red' : 'green'} variant="light">
                                        Threshold: {record[x.measurementId]?.threshold}{record[x.measurementId]?.unit}
                                    </Badge>

                                    <Tooltip label="Remove" withArrow>
                                        <Button
                                            size="xs"
                                            color="red"
                                            variant="light"
                                            leftSection={<IconTrash size={14} />}
                                            onClick={() => handleRemove(index, x.id)}
                                        >
                                            Remove
                                        </Button>
                                    </Tooltip>
                                </Group>
                            </Group>
                        </Card.Section>

                        <Stack gap="sm" mt="sm">
                            <NumberInput
                                label={`Value (${record[x.measurementId]?.unit})`}
                                {...form.getInputProps(`measurements.${index}.value`)}
                                error={isExceeded}
                                styles={{
                                    input: {
                                        borderColor: isExceeded
                                            ? 'red'
                                            : typeof value === 'number'
                                                ? 'green'
                                                : undefined,
                                    },
                                }}
                            />

                            {isExceeded && (
                                <div className=" flex space-x-2 items-center">
                                    <Button
                                        leftSection={<IconAlertCircle size={16} />}
                                        color="red"
                                        onClick={onAddActionPlan}
                                    >
                                        Add Action Plan
                                    </Button>

                                    <Text size="sm" c="dimmed" className="pl-1">
                                        * If not added already
                                    </Text>
                                </div>
                            )}
                        </Stack>
                    </Card>
                );
            })}
            <Modal
                opened={opened}
                size="xl"
                onClose={handleClose}
                centered
                closeOnClickOutside={false}
                closeOnEscape={false}
                title={
                    <h1 className="text-lg text-blue-500">
                        Add Action Plan
                    </h1>
                }
            >
                <LoadingOverlay
                    visible={loading}
                    zIndex={1000}
                    overlayProps={{ radius: "sm", blur: 2 }}
                />
                <form className="grid grid-col-2 gap-4" onSubmit={actionForm.onSubmit(handleSubmit)}>
                    <TextInput withAsterisk {...actionForm.getInputProps(`actionName`)} label="Action Plan Name" placeholder='Enter action plan name' />
                    <Select withAsterisk {...actionForm.getInputProps(`assignedEmployeeId`)} data={employee?.map((x: any) => ({ value: "" + x.id, label: x.name }))} label="Assign Employee" placeholder="Select assigned employee" />
                    <DateInput withAsterisk {...actionForm.getInputProps(`deadline`)} label="Deadline" placeholder="Select deadline" />
                    <Select withAsterisk {...actionForm.getInputProps(`status`)} data={[{ label: "Pending", value: "PENDING" }, { label: "In-Progress", value: "IN_PROGRESS" }, { label: "Canceled", value: "CANCELED" }, { label: "Completed", value: "COMPLETED" }]} label="Status" placeholder="Select status" />
                    <div className='col-span-2'>

                        <TextEditor withAsterisk form={actionForm} id={`description`} title="Description" />
                    </div>
                    <Button type="submit" variant="gradient" className="w-full">
                        Submit
                    </Button>
                    <Button type="button" onClick={close} color="red" className="w-full">
                        Cancel
                    </Button>
                </form></Modal>

            <SearchableObjectDropdown items={measurement.filter((x: any) => !selectedMeasurement.includes(x.id))} onItemSelect={handleItemSelect} />
        </div>
    )
}

export default Measurement


