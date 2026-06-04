import { useEffect, useRef, useState } from "react";
import {
    Breadcrumbs,
    Card,
    Text,
    Button,
    Group,
    Stack,
    TextInput,
    Grid,
    ActionIcon,
    Select,
    Fieldset,
    Stepper,
} from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import {
    IconCalendar,
    IconClock,
    IconFilePencil,
    IconPlus,
    IconTrash,
    IconUserCheck,
    IconUsers,
} from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TextEditor from "../../UtilityComp/TextEditor";
import { useForm } from "@mantine/form";
import { executeAudit, getAreasByAuditId, reportExists } from "../../../services/AuditService";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { GetAllAuditArea } from "../../../services/AuditAreaService";
import { mapIdToName } from "../../../utility/OtherUtilities";
import ImagePdfDropzone from "../../UtilityComp/ImagePdfDropzone";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { PickList } from "primereact/picklist";
import { recommendationStatus } from "../../../Data/DropdownData";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { getBase64 } from "../../../utility/DocumentUtility";


const sectionMap = ['audit-area', 'audit-report', 'recommendations'];
const ExecuteAudit = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [active, setActive] = useState(0); // step index (0 to 2)
    const section = sectionMap[active];
    const [selectedArea, setSelectedArea] = useState<any>({});
    const [areas, setAreas] = useState<any[]>([]);
    const [areaMap, setAreaMap] = useState<Record<string, any>>({});
    const [employees, setEmployees] = useState<any[]>([]);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const ref = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);
    const [submitted, setSubmitted] = useState(false);


    useEffect(() => {
        dispatch(showOverlay());
        reportExists(id).then((res) => {
            if (res) {

                setSubmitted(true);
                modals.openConfirmModal({
                    title: <span className="text-2xl">Report already exists</span>,
                    centered: true,
                    children: (
                        <span className="text-md">
                            You have already submitted the report for this audit.
                        </span>
                    ),
                    onConfirm: () => {
                        modals.closeAll();
                        navigate("/audit-management");
                    },
                    labels: { confirm: `OK`, cancel: "No" },
                    cancelProps: { color: "red", display: "none", variant: "filled" },
                    confirmProps: { color: "green", variant: "filled" },
                    closeOnEscape: false,
                    closeOnClickOutside: false,
                    withCloseButton: false,
                    closeOnConfirm: true
                });
            }
        }).catch((_err) => {

        })
        getAreasByAuditId(id).then((res) => {
            setAreas(res);
        }
        ).catch((_err) => {
        }).finally(() => {
            dispatch(hideOverlay());
        }
        );
        GetAllAuditArea({}).then((res) => {
            setAreaMap(mapIdToName(res));
        }).catch((_err) => {
        })
        getEmployeeDropdown().then((res) => {
            setEmployees(res);
        }).catch((_err) => {
        })
    }, []);

    const addRecommendation = () => {
        form.insertListItem("recommendations", {
            title: "",
            description: "",
            type: "",
            department: "",
            goal: "",
            startDate: "",
            endDate: "",
            assessment: "",
            areaId: "",
            auditId: id,
            status: undefined,
        })
    };

    const form = useForm({
        initialValues: {
            executions: [] as any[],
            report: {
                preparerName: "",
                preparerRole: "",
                preDate: "",
                validatorName: "",
                validatorRole: "",
                validatorStatus: "",
                rejectionComment: "",
                auditId: id,
                docs: [],
                description: "",
            },
            recommendations: [],
            contributors: [],
        },
        validate: {

        },
    })
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


    const addContributor = () => {
        form.insertListItem("contributors", {
            name: "",
            role: "",
            section: "",
            auditId: id,
        })

    }

    const removeContributor = (id: number) => {
        form.removeListItem("contributors", id);
    }


    const removeRecommendation = (id: number) => {
        form.removeListItem("recommendations", id);
    };


    const addInterview = () => {
        form.insertListItem("executions", {
            topic: "",
            interviewDate: "",
            location: "",
            startTime: "",
            endTime: "",
            attendees: [],
            findings: "",
            evidence: [],
            areaId: selectedArea.id,
            emps: employees,
            index: form.values.executions.length,
        })

    }

    const removeInterview = (index: number) => {

        let val = form.values.executions.filter((x: any) => x.index !== index);
        form.setFieldValue(`executions`, val.map((x: any, i: number) => ({ ...x, index: i })));
    };


    const onChange = (event: any, index: any) => {
        form.setFieldValue(`executions.${index}.emps`, event.source?.map((x: any) => ({ ...x, pos: "Source" })));
        form.setFieldValue(`executions.${index}.attendees`, (event.target?.map((x: any) => ({ ...x, pos: "Target" }))));
    };

    const handleRoleChange = (id: number, value: string, index: any) => {
        let selEmp: any = form.values.executions[index]?.attendees;
        form.setFieldValue(`executions.${index}.attendees`, selEmp.map((item: any) => item.id === id ? { ...item, role: value } : item)

        )
        setEditingRoleId(null); // hide dropdown after selection
    };


    const handleSubmit = () => {
        console.log(form.values);
        form.validate();
        if (!form.isValid()) return;
        modals.openConfirmModal({
            title: <span className="text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to execute this audit? You have filled all the details ( Area Execution, Audit Report, and Recommendations).
                </span>
            ),
            labels: { confirm: `Yes, Execute`, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                const values = form.values;
                const docs = await convertFilesToBase64(values.report.docs);
                const executions = await Promise.all(
                    values.executions.map(async (item: any) => {
                        const evidence = await convertFilesToBase64(item.evidence);
                        return {
                            ...item,
                            evidence: evidence,
                        };
                    }
                    )
                );


                dispatch(showOverlay());
                executeAudit({ ...values, report: { ...values.report, docs }, executions })
                    .then(() => {
                        successNotification("Audit executed successfully");
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
    }
    const convertFilesToBase64 = async (files: any[]) => {
        const fileObjects = await Promise.all(
            files.map(async (image) => {
                const base64: any = await getBase64(image.file);
                return {
                    id: image.id ?? null,
                    name: image.file.name,

                    file: base64.split(',')[1],
                };
            })
        );
        return fileObjects;
    };
    const itemTemplate = (item: any, index: any) => {
        return (
            <div className={`  flex gap-5 justify-between self-center`}>
                <div className='flex flex-col gap-1'>
                    <span className="font-medium">{item.name}</span>
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
                                onChange={(val) => handleRoleChange(item.id, val!, index)}
                                className="w-full"
                            />
                        ) : (
                            <div
                                className="cursor-pointer text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
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


    const renderAreaCards = () => (
        <div className="flex flex-col gap-4">
            {areas.map((area) => (
                <Card
                    key={area.id}
                    withBorder
                    p={10}
                    shadow={selectedArea.id === area.id ? "md" : "sm"}
                    bg={selectedArea.id === area.id ? "blue.1" : "white"}
                    bd={selectedArea.id === area.id ? "blue.5" : "gray.2"}
                    onClick={() => {
                        setSelectedArea(area);
                    }}
                    className="cursor-pointer hover:shadow-lg"
                >
                    <Stack gap={2}>
                        <p className="text-lg">{areaMap[area.auditAreaId]?.name}</p>
                        <Text>{areaMap[area.auditAreaId]?.type}</Text>
                        <Text color="dimmed" size="sm">{areaMap[area.auditAreaId]?.ownerName}</Text>
                    </Stack>
                </Card>
            ))}
        </div>
    );

    const renderInterviewForm = () => (
        <Card withBorder shadow="md" >
            <Stack>
                <div className="flex justify-between">
                    <p className="text-lg">Area Execution Details</p>
                    <Button leftSection={<IconPlus />} onClick={addInterview}>
                        Add Interview
                    </Button>
                </div>

                {/* LOT 40 P1: teal accent on legend + descriptive aria-label */}
                {form.values.executions.filter(x => x.areaId == selectedArea.id).map((x, index: any) => (
                    <Fieldset key={index} className="grid grid-cols-1 md:grid-cols-2 gap-5" legend={<div className="flex gap-5">
                        <div className="text-lg text-teal-700">Interview {index + 1}</div>
                        <ActionIcon onClick={() => removeInterview(x.index)} variant="filled" color="red" aria-label={`Remove interview ${index + 1}`}>
                            <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                        </ActionIcon>
                    </div>}>
                        <TextInput className="col-span-2" label="Topic"  {...form.getInputProps(`executions.${x.index}.topic`)} />
                        <DateInput {...form.getInputProps(`executions.${x.index}.interviewDate`)} label="Interview Date" placeholder="dd-mm-yyyy" />
                        <TextInput {...form.getInputProps(`executions.${x.index}.location`)} label="Location" placeholder="Enter interview location" />
                        <TimeInput label="Start Time" ref={ref} rightSection={pickerControl} withAsterisk {...form.getInputProps(`executions.${x.index}.startTime`)} />

                        <TimeInput label="End Time" ref={ref1} rightSection={pickerControl1} withAsterisk {...form.getInputProps(`executions.${x.index}.endTime`)} />


                        <div className="col-span-2">

                            <TextEditor form={form} id={`executions.${x.index}.findings`} title="Findings" />
                        </div>

                        <div className="col-span-2">

                            <PickList
                                dataKey="id"
                                filter
                                filterBy="name"
                                sourceFilterPlaceholder="Search by name"
                                showTargetControls={false}
                                showSourceControls={false}
                                targetFilterPlaceholder="Search by name"
                                source={form.getValues().executions[x.index]?.emps}
                                target={form.getValues().executions[x.index]?.attendees}
                                onChange={(event) => onChange(event, x.index)}
                                itemTemplate={(item) => itemTemplate(item, x.index)}
                                breakpoint="1280px"
                                sourceHeader={`Employees (${form.getValues().executions[x.index]?.emps.length})`}
                                targetHeader={`Members (${form.getValues().executions[x.index]?.attendees?.length})`}
                                sourceStyle={{ height: '24rem' }}
                                targetStyle={{ height: '24rem' }}
                            />

                        </div>

                        <div className="col-span-2">
                            <p className="text-lg ">Evidence</p>
                            <ImagePdfDropzone name="Evidence" id={`executions.${x.index}.evidence`} form={form} />
                        </div>

                    </Fieldset>
                ))}
            </Stack>
        </Card>
    );



    return (
        submitted ? <div></div> : <div>
            <div>
                {/* LOT 40 P1: page title color */}
                <div className="text-2xl text-slate-900 w-fit">Execute Audit</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/audit-management">
                        <Text variant="gradient">Audit Management</Text>
                    </Link>
                    <Text variant="gradient">Execute Audit</Text>
                </Breadcrumbs>
            </div>

            <Card className="bg-white" shadow="xl" withBorder radius="md">
                <Stepper allowNextStepsSelect={false} active={active} onStepClick={setActive} >
                    <Stepper.Step label="First" description="Audit Area" />
                    <Stepper.Step label="Second" description="Audit Report" />
                    <Stepper.Step label="Third" description="Recommendations" />
                </Stepper>
                <div className="mt-6">
                    {section === "audit-area" && (
                        <div className="grid grid-cols-4 gap-5 ">
                            {renderAreaCards()}
                            <div className="col-span-3">

                                {!selectedArea.id ? (
                                    <Text >Select an area to start recording execution details</Text>
                                ) : (
                                    renderInterviewForm()
                                )}
                            </div>
                        </div>
                    )}

                    {section === "audit-report" && (
                        <Stack>
                            {/* <Card shadow="md" withBorder className={`transition-all ${submitted ? "bg-yellow-100" : "bg-white"}`}>
                            <Group justify="space-between">
                                <div className="flex gap-2 ">
                                    <IconFileText color="gray" />
                                    <div className="flex flex-col gap-1 ">
                                        <p className="text-lg text-gray-600">Report Status</p>
                                        <p className="text-sm text-gray-400 ">Draft</p>
                                    </div>


                                </div>

                                {!submitted ? (
                                    <Button onClick={() => setSubmitted(true)}>Submit for Validation</Button>
                                ) : (
                                    <Text c="green">Submitted</Text>
                                )}
                            </Group>
                        </Card> */}

                            <Card shadow="md" withBorder>
                                <p className="flex items-center text-lg mb-2 text-gray-600"> <IconFilePencil stroke={1.5} size={20} /> Report Preparer</p>
                                <Grid>
                                    <Grid.Col span={4}><TextInput {...form.getInputProps("report.preparerName")} label="Name" placeholder="Enter preparer's name" /></Grid.Col>
                                    <Grid.Col span={4}><TextInput label="Role" placeholder="Enter preparer's role" {...form.getInputProps("report.preparerRole")} /></Grid.Col>
                                    <Grid.Col span={4}><DateInput leftSection={<IconCalendar />} label="Date" placeholder="dd-mm-yyyy" {...form.getInputProps("report.preDate")} /></Grid.Col>
                                </Grid>
                            </Card>

                            <Card shadow="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <p className="flex text-lg items-center text-gray-600"><IconUsers stroke={1.5} size={20} />  Contributors</p>
                                    <Button size="xs" leftSection={<IconPlus />} onClick={addContributor}>Add Contributor</Button>
                                </Group>
                                {form.values.contributors.map((_item, index) => (
                                    // LOT 40 P1: responsive grid + teal legend + descriptive aria-label
                                    <Fieldset key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5" legend={<div className="flex gap-5">
                                        <div className="text-lg text-teal-700">Contributor {index + 1}</div>
                                        <ActionIcon onClick={() => removeContributor(index)} variant="filled" color="red" aria-label={`Remove contributor ${index + 1}`}>
                                            <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                        </ActionIcon>
                                    </div>}>
                                        <TextInput label="Name" placeholder="Enter Contributor Name" {...form.getInputProps(`contributors.${index}.name`)} />
                                        <TextInput label="Role" placeholder="Enter Contributor Role"  {...form.getInputProps(`contributors.${index}.role`)} />
                                        <TextInput label="Section" placeholder="Enter Contributor Section"  {...form.getInputProps(`contributors.${index}.section`)} />

                                    </Fieldset>
                                ))}
                            </Card>

                            <Card shadow="md" withBorder>
                                <p className="flex items-center mb-2 text-lg text-gray-600"><IconUserCheck stroke={1.5} size={20} /> Report Validator</p>
                                <Grid mb={10}>
                                    <Grid.Col span={4}><TextInput {...form.getInputProps("report.validatorName")} label="Name" placeholder="Enter preparer's name" /></Grid.Col>
                                    <Grid.Col span={4}><TextInput label="Role" placeholder="Enter preparer's role" {...form.getInputProps("report.validatorRole")} /></Grid.Col>
                                    <Grid.Col span={4}><Select  {...form.getInputProps("report.validatorStatus")} placeholder="Select Status" data={["Pending Review", "Approved", "Rejected"]} label="Status" /></Grid.Col>
                                </Grid>
                                {form.values.report?.validatorStatus == "Rejected" && < TextInput label="Rejection Comment" placeholder="Enter comments" {...form.getInputProps("report.rejectionComment")} />}
                            </Card>

                            <Card shadow="md" withBorder>
                                <p className="text-lg text-gray-600">Supporting Documents</p>

                                <ImagePdfDropzone name="Supporting Documents" id="report.docs" form={form} />
                            </Card>

                            <Card shadow="md" withBorder>
                                <TextEditor form={form} id="report.description" title="Report Content" />
                            </Card>

                            {/* <div className="flex gap-4 justify-end">
                            <Button variant="default">Save as Draft</Button>
                            <Button color="blue">Submit for Validation</Button>
                        </div> */}
                        </Stack>
                    )}

                    {/* Recommendations section */}
                    {section === "recommendations" && (
                        <Stack>
                            <div className="flex justify-between">
                                <p className="text-lg text-gray-600">Audit Recommendations</p>
                                <Button leftSection={<IconPlus size={16} />} onClick={addRecommendation}>
                                    Add Recommendation
                                </Button>
                            </div>


                            {form.values.recommendations.map((_rec, index) => (
                                // LOT 40 P1: teal legend + descriptive aria-label
                                <Fieldset key={index} className="grid grid-cols-2 gap-5" legend={<div className="flex gap-5">
                                    <div className="text-lg text-teal-700">Recommendation {index + 1}</div>
                                    <ActionIcon onClick={() => removeRecommendation(index)} variant="filled" color="red" aria-label={`Remove recommendation ${index + 1}`}>
                                        <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                    </ActionIcon>
                                </div>}>
                                    <Select {...form.getInputProps(`recommendations.${index}.areaId`)}
                                        label="Select Audit Area"
                                        placeholder="Choose area"
                                        data={areas.map((a) => ({ value: "" + a.id, label: areaMap[a.auditAreaId]?.name }))}
                                    />
                                    <TextInput {...form.getInputProps(`recommendations.${index}.title`)}
                                        label="Title"
                                        placeholder="Enter recommendation title" />

                                    <div className="col-span-2">
                                        <TextEditor form={form} id={`recommendations.${index}.description`} title="Description" />
                                    </div>

                                    <Select {...form.getInputProps(`recommendations.${index}.type`)} label="Type" placeholder="Select Type" data={["Security", "Internal Compliance", "Regulatory", "Processes Improvement", "Other"]} />


                                    <TextInput
                                        {...form.getInputProps(`recommendations.${index}.department`)}
                                        label="Department"
                                        placeholder="Enter Assigned Department"

                                    />
                                    <div className="col-span-2">
                                        <TextEditor form={form} id={`recommendations.${index}.goal`} title="Goal" />
                                    </div>

                                    {/* LOT 40 P1: responsive grid breakpoints */}
                                    <div className="grid col-span-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                                        <DateInput label="Start Date" placeholder="dd-mm-yyyy" leftSection={<IconCalendar />} withAsterisk {...form.getInputProps(`recommendations.${index}.startDate`)} />

                                        <DateInput label="End Date" placeholder="dd-mm-yyyy" leftSection={<IconCalendar />} withAsterisk {...form.getInputProps(`recommendations.${index}.endDate`)} />
                                        <Select {...form.getInputProps(`recommendations.${index}.status`)}
                                            label="Status"
                                            placeholder="Select status"
                                            data={recommendationStatus}
                                        />
                                    </div>

                                    <div className="col-span-2">

                                        <TextEditor form={form} id={`recommendations.${index}.assessment`} title="Assesments" />
                                    </div>
                                </Fieldset>
                            ))}
                        </Stack>
                    )}
                </div>

                <Group justify="center" mt="xl">
                    <Button variant="default" onClick={() => setActive((a) => Math.max(a - 1, 0))} disabled={active === 0}>
                        Back
                    </Button>
                    {active < 2 ? (
                        <Button onClick={() => setActive((a) => Math.min(a + 1, 2))}>Next</Button>
                    ) : (
                        <Button variant="gradient" onClick={handleSubmit}>
                            Execute Audit
                        </Button>
                    )}
                </Group>
            </Card>
        </div>

    );
};

export default ExecuteAudit;