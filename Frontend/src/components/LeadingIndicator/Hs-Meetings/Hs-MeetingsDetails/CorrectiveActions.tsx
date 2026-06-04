import { useEffect, useState } from "react";
import { statusColors, statusLabels } from "../../../../Data/IncidentsData";
import { formatDateWithDay } from "../../../../utility/DateFormats";
import { Badge, Button, LoadingOverlay, Modal, Select, TextInput } from "@mantine/core";
import { createCorrectiveAction, getCorrectiveActionByActivityId } from "../../../../services/CorrectiveActionService";
import { useParams } from "react-router-dom";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import TextEditor from "../../../UtilityComp/TextEditor";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { IconAlertCircle } from "@tabler/icons-react";
import { useSelector } from "react-redux";

const CorrectiveActions = ({ employee, empMap }: any) => {
    const { id } = useParams();
    const [actions, setActions] = useState<any[]>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);
    const user = useSelector((state: any) => state.user)
    useEffect(() => {
        fetch();
    }, []);
    const fetch = () => {
        getCorrectiveActionByActivityId(id).then((res) => {
            setActions(res);
        }).catch((err) => {
            console.log(err);
        });
    }
    const actionForm = useForm({
        initialValues: {
            actionName: "",
            assignedEmployeeId: "",
            deadline: "",
            status: "",
            description: "",
            hsActivityId: id,
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

    const handleSubmit = (values: any) => {
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
                const data = { ...values, departmentId: values.assignedEmployeeId ? empMap[values.assignedEmployeeId]?.departmentId : user.departmentId, ownerId: values.assignedEmployeeId ?? user.id, assignedEmployeeId: values.assignedEmployeeId ?? user.id };
                setLoading(true);
                createCorrectiveAction(data)
                    .then(() => {
                        successNotification("Action plan added successfully");
                        close();
                        actionForm.reset();
                        fetch();
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

    const onAddActionPlan = () => {
        actionForm.reset();
        open();
    }
    return (
        <div>
            <div className="flex justify-between items-center mb-4">

                <h4 className="text-lg mb-4 text-gray-800">Corrective Actions</h4>
                <Button
                    leftSection={<IconAlertCircle size={16} />}
                    color="red"
                    onClick={onAddActionPlan}
                >
                    Add Corrective Action
                </Button>
            </div>


            {actions?.length === 0 && (
                <div className="text-center text-gray-500 my-8">No actions available.</div>
            )}
            {actions?.map((x: any, index: any) => (
                <div
                    key={index}
                    className="border border-gray-300 bg-white rounded-lg p-4 shadow-sm mb-4 flex flex-col gap-1"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className=" text-gray-800">{x.actionName}</p>
                            <p className="text-sm text-gray-500">Assigned To: <strong>{x.assignedEmployeeName}</strong></p>
                        </div>

                        <Badge variant="light" color={statusColors[x.status]}>
                            {statusLabels[x.status]}
                        </Badge>
                    </div>

                    {/* LOT 41 P0 XSS fix */}
                    <SafeHtml html={x.description} className="text-gray-600 text-sm" />

                    <div className="text-sm text-gray-700">
                        <b>Deadline:</b>{' '}
                        <span className="text-blue-700">{formatDateWithDay(x.deadline)}</span>
                    </div>
                </div>
            ))}

            <Modal
                opened={opened}
                size="xl"
                onClose={close}
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
                </form></Modal>
        </div>
    )

}

export default CorrectiveActions