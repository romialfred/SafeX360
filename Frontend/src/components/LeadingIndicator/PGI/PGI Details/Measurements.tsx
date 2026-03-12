import { Badge, Button, Card, Group, NumberInput, Select, Stack, Text, Tooltip, Modal, LoadingOverlay, TextInput } from "@mantine/core";
import { IconAlertCircle, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getAllActiveMeasurement } from "../../../../services/TechMeasurementService";
import { mapIdToName } from "../../../../utility/OtherUtilities";
import { useParams } from "react-router-dom";
import { modals } from "@mantine/modals";
import { successNotification, errorNotification } from "../../../../utility/NotificationUtility";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import TextEditor from "../../../UtilityComp/TextEditor";
import { createCorrectiveAction } from "../../../../services/CorrectiveActionService";
import { useDispatch, useSelector } from "react-redux";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { addInspectionMeasurement, getMeasurementsByInspectionId, removeInsMeasurement } from "../../../../services/InspectionProcessService";

const Measurements = ({ employee, empMap }: any) => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [measurement, setMeasurement] = useState<any>([]);
    const [record, setMeasurementRecord] = useState<Record<string, any>>({});
    const [measurementsData, setMeasurementsData] = useState<any[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState<any>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);
    const [_actionIndex, setActionIndex] = useState<number | null>(null);
    const user = useSelector((state: any) => state.user)
    // const [opened, { open, close }] = useDisclosure(false);
    // const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            measurementId: '',
            value: '',
            generalInspectionId: id,
        },
    });
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
    });

    useEffect(() => {
        getAllActiveMeasurement().then((res) => {
            setMeasurement(res);
            setMeasurementRecord(mapIdToName(res));
        }).catch((_err) => { });
        fetchData();
    }, []);

    const fetchData = () => {
        getMeasurementsByInspectionId(id).then((res) => {
            setMeasurementsData(res);
        }).catch((_error) => {

        })
    };

    useEffect(() => {
        if (measurementsData && measurementsData.length > 0) {
            const selectedIds = measurementsData.map((item: any) => Number(item.measurementId));
            setSelectedMeasurement(selectedIds);
        } else {
            setSelectedMeasurement([]);
        }
    }, [measurementsData]);

    const handleAddMeasurement = (values: any) => {

        dispatch(showOverlay());
        addInspectionMeasurement(values).then((_res) => {
            successNotification("Measurement added successfully");
            form.reset();
            setShowAddForm(false);
            fetchData();

        }).catch((error) => {
            errorNotification(error?.response?.data?.errorMessage)

        }).finally(() => {
            dispatch(hideOverlay());
        })
    };

    const handleShowAddForm = () => {
        setShowAddForm(true);
    };

    const handleCancelAddForm = () => {
        setShowAddForm(false);
    };

    const handleRemove = (id: any) => {
        modals.openConfirmModal({
            title: <span className="font-semibold text-2xl">Are you sure?</span>,
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
                removeInsMeasurement(id)
                    .then(() => {
                        setMeasurementsData([...measurementsData.filter((x) => x.id !== id)]);
                        successNotification("Measurement removed successfully");
                    })
                    .catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                    });

            },
        });
    };

    const onAddActionPlan = (index: number) => {
        setActionIndex(index);
        actionForm.reset();
        open();
    };

    const handleClose = () => {
        close();
        setActionIndex(null);
    };

    const handleSubmit = (values: any) => {

        modals.openConfirmModal({
            title: <span className="font-semibold text-2xl">Are you sure?</span>,
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
                const data = { ...values, departmentId: values.assignedEmployeeId ? empMap[values.assignedEmployeeId]?.departmentId : user.departmentId, ownerId: values.assignedEmployeeId ?? user.id, assignedEmployeeId: values.assignedEmployeeId ?? user.id };
                setLoading(true);
                createCorrectiveAction(data)
                    .then(() => {
                        successNotification("Action plan added successfully");
                        close();
                        actionForm.reset();
                    })
                    .catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            },
        });
    };
    const isExceeded = typeof form.values.value === 'number' && (form.values.value > record[form.values.measurementId]?.threshold);
    return (
        <div className="flex flex-col gap-5">
            <Group justify="space-between">
                <div className="text-lg font-medium">Measurements</div>
                {!showAddForm && <Button color="green" onClick={handleShowAddForm}>
                    Add Measurement
                </Button>}
            </Group>
            {showAddForm && (
                <form className="bg-white p-6 rounded-lg shadow space-y-4" onSubmit={form.onSubmit(handleAddMeasurement)}>
                    <Group grow>
                        <Select
                            label="Measurement"
                            placeholder="Select measurement"
                            data={measurement.filter((x: any) => !selectedMeasurement.includes(x.id)).map((x: any) => ({ value: "" + x.id, label: x.name }))}
                            {...form.getInputProps("measurementId")}
                            withAsterisk
                        />
                        <div className="relative">

                            <Badge className="!absolute right-0 !font-medium " size="md" color={isExceeded ? 'red' : 'green'} variant="light">
                                Threshold: {record[form.values.measurementId]?.threshold}{record[form.values.measurementId]?.unit}
                            </Badge>
                            <NumberInput
                                label="Value"
                                {...form.getInputProps("value")}
                                withAsterisk
                            />
                        </div>
                    </Group>
                    <Group justify="end">
                        <Button type="button" color="gray" variant="light" onClick={handleCancelAddForm}>
                            Cancel
                        </Button>
                        <Button type="submit" color="green" disabled={!form.values.measurementId}>
                            Add Measurement
                        </Button>
                    </Group>
                </form>
            )}
            {!showAddForm && measurementsData?.length === 0 && (
                <Text color="dimmed" ta="center">No measurements added yet.</Text>
            )}
            {!showAddForm && measurementsData?.map((x: any, index: number) => {
                const value = x.value;
                const threshold = record[x.measurementId]?.threshold;
                const unit = record[x.measurementId]?.unit;
                const isExceeded = typeof value === 'number' && (value > threshold);
                return (
                    <Card key={x.id} shadow="sm" radius="md" withBorder className="bg-white p-4">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Group justify="space-between" align="center">
                                <Text size="lg" fw={500}>
                                    {record[x.measurementId]?.name}
                                </Text>
                                <Group gap="xs">
                                    <Badge size="lg" color={isExceeded ? 'red' : 'green'} variant="light">
                                        Threshold: {threshold}{unit}
                                    </Badge>
                                    <Tooltip label="Remove" withArrow>
                                        <Button
                                            size="xs"
                                            color="red"
                                            variant="light"
                                            leftSection={<IconTrash size={14} />}
                                            onClick={() => handleRemove(x.id)}
                                        >
                                            Remove
                                        </Button>
                                    </Tooltip>
                                </Group>
                            </Group>
                        </Card.Section>
                        <Stack gap="sm" mt="sm">
                            <Text size="sm"><b>Value:</b> {value}{unit}</Text>
                            {isExceeded && (
                                <div className=" flex space-x-2 items-center">
                                    <Button
                                        leftSection={<IconAlertCircle size={16} />}
                                        color="red"
                                        onClick={() => onAddActionPlan(index)}
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
                    <h1 className="text-lg font-medium text-blue-500">
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
                    <Select withAsterisk {...actionForm.getInputProps(`assignedEmployeeId`)} data={employee} label="Assign Employee" placeholder="Select assigned employee" />
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
                </form>
            </Modal>
        </div>
    );
}

export default Measurements;