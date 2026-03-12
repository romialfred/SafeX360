import React, { useEffect, useRef, useState } from "react";
import {
    Breadcrumbs, Text, Card, TextInput, Select, Button, Stack, ActionIcon, Checkbox, Group, Grid, Fieldset, Stepper,
} from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import { IconCalendar, IconClock, IconFileText, IconMapPin, IconPlus, IconTrash, IconUsers } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import TextEditor from "../../UtilityComp/TextEditor";
import { useForm } from "@mantine/form";
import { auditCategories, auditTypes } from "../../../Data/DropdownData";
import { getEmployeeDropdownWithEmail } from "../../../services/EmployeeService";
import { PickList } from "primereact/picklist";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { createAudit } from "../../../services/AuditService";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { getAllActiveAuditArea } from "../../../services/AuditAreaService";
import { mapIdToName } from "../../../utility/OtherUtilities";

interface ListItem { id: number; name: string; }
interface MeetingItem {
    id: number;
    meetingDate: Date | null;
    startTime: Date | null;
    endTime: Date | null;
    agenda: string;
    minutes: string;
}

const NewAudit: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);

    const handleNext = () => {
        if (activeStep < 3) {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (activeStep > 0) {
            setActiveStep((prev) => prev - 1);
        }
    };
    const [auditAreas, setAuditAreas] = useState<any[]>([]);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const ref = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);

    const form = useForm({
        initialValues: {
            audit: {
                title: "",
                category: "",
                types: [] as String[],
                purpose: "",
                members: [],
                startDate: null,
                endDate: null,
            },
            auditors: [],
            areas: [],
            meetings: [],
            company: "",
        },
        validate: {

        },

    });
    useEffect(() => {
        getAllActiveAuditArea().then((res) => {
            setAuditAreas(res.map((item: any) => {
                return {
                    ...item,
                    value: "" + item.id,
                    label: item.name,
                }
            }));
        }).catch((_err) => {
        })

        getEmployeeDropdownWithEmail().then((res) => {
            setEmployees(res);
            setEmpMap(mapIdToName(res));
        }
        ).catch((_err) => {
        })
    }, []);


    const pickerControl = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    const pickerControl1 = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref1.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    const insertAuditor = () => {
        form.insertListItem("auditors", {
            name: "",
            role: "",
            email: "",
        })
    }
    const insertArea = () => {
        form.insertListItem("areas", {
            auditAreaId: "",
            purpose: "",
        })
    }
    const insertMeeting = () => {
        form.insertListItem("meetings", {
            meetingDate: null,
            startTime: null,
            endTime: null,
            agenda: "",
            minutes: "",
        })
    }




    const handleSubmit = () => {

        form.validate();
        if (!form.isValid()) return;
        let values = form.values;
        if (form.values.audit.category == "INTERNAL") {
            let auditors: any = values.auditors.map((auditor: any) => ({ ...auditor, name: empMap[auditor.name]?.name, company: null }));;
            values = { ...values, auditors: auditors };
        }
        else {
            let auditors: any = values.auditors.map((auditor: any) => ({ ...auditor, company: values.company }));;
            values = { ...values, auditors: auditors };
        }
        modals.openConfirmModal({
            title: <span className="font-semibold text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to create this audit? You have filled all the details.
                </span>
            ),
            labels: { confirm: `Yes, Create`, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                createAudit(values)
                    .then(() => {
                        successNotification("Audit created successfully");
                        navigate("/audit-management");
                    }
                    ).catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                    }
                    ).finally(() => {
                        dispatch(hideOverlay());
                    }
                    )
            },
        });



    };

    const onChange = (event: any) => {
        setEmployees(event.source?.map((x: any) => ({ ...x, pos: "Source" })));
        form.setFieldValue('audit.members', (event.target?.map((x: any) => ({ ...x, pos: "Target" }))));
    };

    const handleRoleChange = (id: number, value: string) => {
        let selEmp: any = form.values.audit.members;
        form.setFieldValue('audit.members', selEmp.map((item: any) =>

            item.id === id ? { ...item, role: value } : item)

        )
        setEditingRoleId(null); // hide dropdown after selection
    };
    useEffect(() => {
        form.setFieldValue('auditors', []);
    }, [form.values.audit.category])


    const itemTemplate = (item: any) => {
        return (
            <div className={`  flex gap-5 justify-between self-center`}>
                <div className='flex flex-col gap-1'>
                    <span className="font-bold">{item.name}</span>
                    <span className="text-400">{item.empNumber}</span>
                </div>
                {item.pos === "Target" && (
                    <div className='flex items-center gap-2 w-[220px]'>
                        {editingRoleId === item.id || !item.role ? (
                            <Select
                                autoFocus
                                placeholder="Select role"
                                data={["Committee Member", "Committee Chair", "Committee Secretary"]}
                                value={item.role}
                                onChange={(val) => handleRoleChange(item.id, val!)}
                                className="w-full"
                                withAsterisk
                            />
                        ) : (
                            <div
                                className="cursor-pointer text-sm font-medium px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                onClick={() => setEditingRoleId(item.id)}
                            >
                                {item.role}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };


    const renderAuditInfo = () => (
        <div className="p-2 flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-4 ">
                <TextInput label="Audit Title" placeholder="Enter audit title" {...form.getInputProps("audit.title")} withAsterisk />
                <Select label="Audit Category" placeholder="Select category" data={auditCategories} {...form.getInputProps("audit.category")} withAsterisk />
            </div>
            <Checkbox.Group size="md"
                {...form.getInputProps('audit.types')}
                label="Audit Types"
                withAsterisk
            >
                <Grid mt="xs">
                    {auditTypes.map((type) => (
                        <Grid.Col span={2} key={type}>
                            <Checkbox.Card
                                value={type}
                                radius="md"
                                className="group border border-gray-300 transition duration-150 cursor-pointer 
                     hover:!border-primary hover:!bg-primary/10 
                     data-[checked]:!border-primary data-[checked]:!bg-primary/20 
                     data-[checked]:shadow-sm"
                                p="md"
                            >
                                <Group align="center" gap="sm">
                                    <Checkbox.Indicator className="mt-1 text-blue-600" />
                                    <Text
                                        size="md"
                                        className="text-gray-800 group-data-[checked]:text-blue-900 group-data-[checked]:font-semibold"
                                    >
                                        {type}
                                    </Text>
                                </Group>
                            </Checkbox.Card>
                        </Grid.Col>
                    ))}
                </Grid>
            </Checkbox.Group>


            <TextEditor form={form} id="audit.purpose" title="Purpose" />

            <div className="grid grid-cols-2 gap-4">
                <DateInput label="Start Date" {...form.getInputProps("audit.startDate")} leftSection={<IconCalendar />} placeholder="Enter Start Date" withAsterisk />
                <DateInput label="End Date" {...form.getInputProps("audit.endDate")} leftSection={<IconCalendar />} placeholder="Enter End Date" withAsterisk />
            </div>
        </div>
    );

    const renderAuditorItem = (_item: ListItem, index: number) => (
        <Fieldset key={index} className="grid grid-cols-3 gap-6" legend={<div className="flex gap-5">
            <div className="text-lg font-medium text-blue-500">Auditor {index + 1}</div>
            <ActionIcon onClick={() => form.removeListItem("auditors", index)} variant="filled" color="red" aria-label="Settings">
                <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
        </div>}>

            {form.values.audit.category === "EXTERNAL" ? <TextInput {...form.getInputProps(`auditors.${index}.name`)} placeholder="Auditor Name" withAsterisk /> :
                <Select
                    {...form.getInputProps(`auditors.${index}.name`)} onChange={(e) => {
                        let emp = employees.find(emp => emp.id == e);
                        form.setFieldValue(`auditors.${index}.email`, emp?.email || "");
                        form.setFieldValue(`auditors.${index}.name`, e || "");
                    }}

                    placeholder="Select Auditor"
                    withAsterisk
                    data={employees.map((emp) => ({
                        value: "" + emp.id,
                        label: emp.name,

                    }))}
                />
            }
            <Select placeholder="Role"  {...form.getInputProps(`auditors.${index}.role`)} data={["Lead Auditor", "Auditor", "Observer", "Expert"]} withAsterisk />
            <TextInput readOnly={form.values.audit.category === "INTERNAL"} {...form.getInputProps(`auditors.${index}.email`)} placeholder="Email" withAsterisk />
        </Fieldset>
    );

    const renderAreaItem = (_item: ListItem, index: number) => (

        <Fieldset className="grid grid-cols-2 gap-6" key={index} legend={<div className="flex gap-5">
            <div className="text-lg font-medium text-blue-500">Area {index + 1}</div>
            <ActionIcon onClick={() => form.removeListItem("areas", index)} variant="filled" color="red" aria-label="Settings"> <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
        </div>}>

            <Select {...form.getInputProps(`areas.${index}.auditAreaId`)} label="Audit Area" placeholder="Select Area" data={auditAreas} withAsterisk />

            <TextInput label="Purpose" {...form.getInputProps(`areas.${index}.purpose`)} placeholder="Enter purpose" withAsterisk />
        </Fieldset>
    );

    const renderCommitteeItem = () => (
        <PickList
            dataKey="id"
            filter
            filterBy="name"
            sourceFilterPlaceholder="Search by name"
            showTargetControls={false}
            showSourceControls={false}
            targetFilterPlaceholder="Search by name"
            source={employees}
            target={form.getValues().audit.members}
            onChange={onChange}
            itemTemplate={itemTemplate}
            breakpoint="1280px"
            sourceHeader={`Employees (${employees.length})`}
            targetHeader={`Members (${form.getValues().audit.members?.length})`}
            sourceStyle={{ height: '24rem' }}
            targetStyle={{ height: '24rem' }}
        />
    );

    const renderCommitteeMeeting = (mt: MeetingItem, index: number) => (
        <Fieldset className="grid grid-cols-3 gap-6" key={index} legend={<div className="flex gap-5">
            <div className="text-lg font-medium text-blue-500">Meeting {index + 1}</div>
            <ActionIcon onClick={() => form.removeListItem("meetings", index)} variant="filled" color="red" aria-label="Settings"> <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
        </div>}>
            <DateInput {...form.getInputProps(`meetings.${index}.date`)} label="Meeting Date" placeholder="dd-mm-yyyy" leftSection={<IconCalendar />} withAsterisk />
            <TimeInput label="Start Time" ref={ref} rightSection={pickerControl} withAsterisk {...form.getInputProps(`meetings.${index}.startTime`)} />
            <TimeInput label="End Time" ref={ref1} rightSection={pickerControl1} withAsterisk {...form.getInputProps(`meetings.${index}.endTime`)} />
            <div className="col-span-3">
                <TextEditor form={form} id={`meetings.${index}.agenda`} title="Agenda" value={mt.agenda} />
            </div>
            <div className="col-span-3">
                <TextEditor form={form} id={`meetings.${index}.minutes`} title="Minutes" value={mt.minutes} />
            </div>

        </Fieldset>
    );

    const renderSection = () => {
        switch (activeStep) {
            case 0:
                return renderAuditInfo();

            case 1:
                return (
                    <Stack my={10}>
                        <div className="flex justify-between">
                            <Text size="lg">Auditors</Text>
                            <Button leftSection={<IconPlus />} onClick={insertAuditor}>
                                Add Auditor
                            </Button>
                        </div>
                        {form.values.audit.category === "EXTERNAL" && <TextInput {...form.getInputProps(`company`)} placeholder="Company" label="Auditors Company" />}
                        {form.values.auditors.map(renderAuditorItem)}
                    </Stack>
                );

            case 2:
                return (
                    <Stack>
                        <div className="flex justify-between">
                            <Text size="lg">Audit Areas</Text>
                            <Button leftSection={<IconPlus />} onClick={insertArea}>
                                Add Area
                            </Button>
                        </div>
                        {form.values.areas.map(renderAreaItem)}
                    </Stack>
                );

            case 3:
                return (
                    <Stack>
                        <div className="flex justify-between">
                            <Text size="lg">Committee Members</Text>

                        </div>
                        {renderCommitteeItem()}
                        <div className="flex justify-between mt-4">
                            <Text size="lg">Committee Meeting</Text>
                            <Button leftSection={<IconPlus />} onClick={insertMeeting}>
                                Add Meetings
                            </Button>
                        </div>
                        {form.values.meetings.map(renderCommitteeMeeting)}

                    </Stack>
                );

            default:
                return null;
        }
    };
    return (
        <div>
            <div>
                <div className="font-semibold text-2xl text-blue-500 w-fit">New Audit</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/audit-management">
                        <Text variant="gradient">Audit Management</Text>
                    </Link>
                    <Text variant="gradient">New Audit</Text>
                </Breadcrumbs>
            </div>

            <Card className="bg-white" shadow="xl" withBorder radius="md">
                <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false}>
                    <Stepper.Step icon={<IconFileText size={18} />} label="Audit Information" />
                    <Stepper.Step icon={<IconUsers size={18} />} label="Auditors" />
                    <Stepper.Step icon={<IconMapPin size={18} />} label="Audit Areas" />
                    <Stepper.Step icon={<IconUsers size={18} />} label="Committee" />
                </Stepper>

                <div className="mt-6">{renderSection()}</div>

                <div className="flex gap-4 justify-center mt-6">
                    {activeStep > 0 && (
                        <Button variant="default" onClick={handlePrev}>
                            Previous
                        </Button>
                    )}
                    {activeStep < 3 ? (
                        <Button onClick={handleNext} variant="gradient">
                            Next
                        </Button>
                    ) : (
                        <>
                            <Button type="button" onClick={handleSubmit} variant="gradient">
                                Create Audit
                            </Button>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default NewAudit;
