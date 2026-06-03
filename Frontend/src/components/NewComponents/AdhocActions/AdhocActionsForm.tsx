import { Breadcrumbs, Text, TextInput, Button, Select, Alert, Badge, Group } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { createCorrectiveAction } from "../../../services/CorrectiveActionService";
import { useEffect, useState } from "react";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import CaHelp from "../../LaggingIndicator/CorrectiveAction/CaHelp";
import { IconInfoCircle, IconClockHour3, IconUserCheck } from "@tabler/icons-react";
import TextEditor from "../../UtilityComp/TextEditor";
import { isValidRichText } from "../../../utility/OtherUtilities";

const AdhocActionsForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<any[]>([]);
    const user = useSelector((state: any) => state.user);

    const form = useForm({
        initialValues: {
            actionName: '',
            assignedEmployeeId: '',
            deadline: new Date(),
            status: 'PENDING',
            description: '',
            ownerId: user?.id || null,
            departmentId: user?.departmentId || null,
        },
        validate: {
            actionName: (value) => (value.trim().length < 5 ? 'Title must be at least 5 characters' : null),

            description: (value) => (isValidRichText(value) ? null : 'Description must be at least 10 characters'),
        },
    });

    useEffect(() => {
        getEmployeeDropdown().then((res) => {
            setEmployees(res);
        }).catch((err) => {
            console.error("Failed to fetch employees", err);
        });
    }, []);

    const handleSubmit = () => {
        dispatch(showOverlay());

        const payload = {
            ...form.values,
            deadline: form.values.deadline instanceof Date
                ? form.values.deadline.toISOString().split("T")[0] // yyyy-MM-dd format
                : null,
        };

        createCorrectiveAction(payload)
            .then((_res) => {
                successNotification("Improvement idea created successfully");
                navigate("/adhoc-actions");
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

    return (
        <div className="p-5 flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">
                        New Improvement Idea
                    </div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient" className="hover:!underline cursor-pointer">
                                Home
                            </Text>
                        </Link>
                        <Link className="hover:!underline" to="/adhoc-actions">
                            <Text variant="gradient" className="hover:!underline cursor-pointer">
                                Improvement Ideas
                            </Text>
                        </Link>
                        <Text variant="gradient">New Improvement Idea</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-5 ">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <TextInput
                                    withAsterisk
                                    label="Idea Title "
                                    placeholder="Enter Idea title"
                                    {...form.getInputProps('actionName')}
                                />

                                <Select
                                    data={employees.map(emp => ({ value: "" + emp.id, label: emp.name }))}

                                    label="Assigned To "
                                    placeholder="Person responsible"
                                    {...form.getInputProps('assignedEmployeeId')}
                                />
                            </div>
                            <TextEditor form={form} id="description" title="Idea Description" withAsterisk />
                            <DateInput
                                label="Due Date "
                                placeholder="Pick a date"
                                minDate={new Date()}
                                {...form.getInputProps('deadline')}
                            />

                            <Alert
                                color="indigo"
                                variant="light"
                                radius="md"
                                icon={<IconInfoCircle size={18} />}
                                className="border border-indigo-200"
                            >
                                <div className="flex flex-col gap-1">
                                    <Text size="sm" c="indigo.9">Submission Notice</Text>
                                    <Text size="sm" c="dimmed">This idea will be created as pending and routed for manager approval.</Text>
                                    <Group gap="xs" mt={4}>
                                        <Badge leftSection={<IconClockHour3 size={12} />} color="yellow" variant="light">Status: Pending</Badge>
                                        <Badge leftSection={<IconUserCheck size={12} />} color="blue" variant="light">Approval Required</Badge>
                                    </Group>
                                </div>
                            </Alert>
                            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                                <Button variant="default">Cancel</Button>
                                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">Create Idea</Button>
                            </div>
                        </form>
                    </div>
                    <div className="">
                        <CaHelp />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdhocActionsForm
