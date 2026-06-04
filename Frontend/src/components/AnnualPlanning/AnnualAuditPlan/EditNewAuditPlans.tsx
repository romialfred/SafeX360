import { useEffect, useState } from "react";
import {
    Breadcrumbs,
    Text,
    Card,
    TextInput,
    Select,
    Button,
    Stack,
    Checkbox,
    Group,
    Stepper,
    NumberInput,
    MultiSelect,
    Fieldset,
    ActionIcon,
    Divider,
    Radio,
    Alert,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconCalendar, IconFileText, IconInfoCircle, IconPlus, IconTrash, IconUsers } from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TextEditor from "../../UtilityComp/TextEditor";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { deleteAuditor, getAuditDetails, getAuditorsByAuditId, updateAudit } from "../../../services/AuditService";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { getAllActiveAuditArea } from "../../../services/AuditAreaService";
import { isValidRichText, mapIdToName } from "../../../utility/OtherUtilities";
import { auditorRoles, auditTypesLabels, criteriaByLabel } from "../../../Data/DropdownData";
import { getAllAuditors } from "../../../services/AuditorsService";
import { getDateDifferenceInDays } from "../../../utility/DateFormats";
import { getAllActiveWorkProcess } from "../../../services/WorkProcessService";

interface ListItem { id: number; name: string; }

const auditMethods = ["Individual interviews", "Group interviews", "Field observations", "Document verification", "Equipment Inspection", "Tests and measurements", "Sample analysis", "Emergency simulation"
];

const documents = [
    "Integrated Management Manual",
    "HSE Policy",
    "Operational procedures",
    "Work Instructions",
    "Prevention plans",
    "Risk analyses",
    "Compliance Records",
    "HSE Dashboards"
];


const EditNewAuditPlans: React.FC = () => {
    const [auditors, setAuditors] = useState<any[]>([]);
    const [auditorsMap, setAuditorsMap] = useState<Record<string, any>>({});
    const [auditorsNameMap, setAuditorsNameMap] = useState<Record<string, any>>({});
    const [activeStep, setActiveStep] = useState(0);
    const [auditAreas, setAuditAreas] = useState<any[]>([]);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [processes, setProcesses] = useState<any[]>([]);
    const [planStatus, setPlanStatus] = useState<string>('');
    const { id } = useParams();


    useEffect(() => {
        getAllAuditors().then((res) => {
            setAuditorsNameMap(res.reduce((acc: any, auditor: any) => {
                acc[auditor.email] = auditor;
                return acc;
            }, {}));
            setAuditors(res.map((item: any) => ({
                value: "" + item.id,
                label: item.employeeName
            })));
            setAuditorsMap(mapIdToName(res));


        }).catch(() => {

        })
        dispatch(showOverlay());
        getAuditDetails(id).then((res) => {
            console.log(res);
            setPlanStatus(String(res.planningStatus || ''));
            form.setFieldValue('audit', {
                ...res, startDate: new Date(res.startDate),
                endDate: new Date(res.endDate),
                processes: res.processes.map((item: any) => String(item)),
                scopeId: String(res.scopeId),
                types: Object.keys(res.auditTypes),

            })
        }).catch((_err) => {

        }).finally(() => {
            dispatch(hideOverlay());
        });

    }, []);

    useEffect(() => {
        if (auditorsNameMap && Object.keys(auditorsNameMap).length > 0) {
            getAuditorsByAuditId(id).then((res) => {

                form.setFieldValue("auditors", res.map((item: any) => ({
                    ...item,
                    name: "" + auditorsNameMap[item.email]?.id,
                    role: auditorsNameMap[item.email]?.role,
                    email: item?.email || ""
                })));
            }).catch((_err) => {

            })
        }
    }, [auditorsNameMap])

    const handleNext = () => {
        form.validate();
        if (!form.isValid()) return;
        if (activeStep < 1) {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (activeStep > 0) {
            setActiveStep((prev) => prev - 1);
        }
    };


    const AuditObjectives = ["Verify regulatory compliance", "Evaluate the effectiveness of the management system", "Identify areas for improvement"]
    const form = useForm({
        initialValues: {
            audit: {
                title: "",
                refNumber: "AUD-SSE-XXXX-XXX",
                objectives: [] as string[],
                processes: [],
                scopeId: "",
                methods: [] as string[],
                description: "",
                category: "INTERNAL",
                references: [] as string[],
                auditTypes: {},
                startDate: null,
                endDate: null,
                types: [] as string[],
            },
            auditors: [] as any,
            company: "",
            companyEmail: ""
        },
        validate: {
            audit: {

                title: (value) => (value ? null : "Title is required"),
                // refNumber: (value) => (value ? null : "Reference number is required"),
                objectives: (value) => (value.length > 0 ? null : "At least one objective is required"),
                processes: (value) => (value.length > 0 ? null : "At least one process is required"),
                scopeId: (value) => (value ? null : "Scope is required"),
                methods: (value) => (value.length > 0 ? null : "At least one method is required"),
                description: (value) => (isValidRichText(value) ? null : "Description is required"),
                startDate: (value) => (value ? null : "Start date is required"),
                endDate: (value) => (value ? null : "End date is required"),
                references: (value) => (value.length > 0 || activeStep == 0 ? null : "At least one reference is required"),

                types: (value) => (value?.length > 0 || activeStep == 0 ? null : "At least one type is required"),
            },
            auditors: {
                name: (value) => (value ? null : "Auditor is required"),
                role: (value) => (value ? null : "Role is required"),
                email: (value) => (value ? null : "Email is required"),
            },
            company: (value): string | null => ((form.values.audit.category === "INTERNAL" || value) ? null : "Company is required"),
            companyEmail: (value): string | null => ((form.values.audit.category === "INTERNAL" || value) ? null : "Company email is required"),



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

        getAllActiveWorkProcess().then((res) => {
            setProcesses(res.map((item: any) => {
                return {
                    ...item,
                    value: "" + item.id,
                    label: item.name,
                }
            }));
        }).catch((_err) => {
        })


    }, []);



    const insertAuditor = () => {
        form.insertListItem("auditors", {
            name: "",
            role: "",
            email: "",
        })
    }


    const handleSubmit = () => {

        form.validate();
        if (!form.isValid()) return;
        if (form.values.auditors.length === 0) {
            errorNotification("Please add at least one auditor");
            return;
        }

        let values = form.values;
        if (form.values.audit.category == "INTERNAL") {
            let auditors: any = values.auditors.map((auditor: any) => ({ ...auditor, name: auditorsMap[auditor.name]?.employeeName, company: null, companyMail: null }));;
            values = { ...values, auditors: auditors };
        }
        else {
            let auditors: any = values.auditors.map((auditor: any) => ({ ...auditor, company: values.company, companyEmail: values.companyEmail }));;
            values = { ...values, auditors: auditors };
        }
        modals.openConfirmModal({
            title: <span className="text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to update this audit?
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
                updateAudit(values)
                    .then(() => {
                        successNotification("Audit updated successfully");
                        navigate("/annual-audit-plan");
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


    useEffect(() => {
        form.setFieldValue('auditors', []);
    }, [form.values.audit.category])


    const handleRemoveAuditor = (item: any, index: any) => {
        if (item.id) {


            modals.openConfirmModal({
                title: <span className="text-2xl">Are you sure?</span>,
                centered: true,
                children: (
                    <span className="text-md">
                        You want to remove this auditor? This action cannot be undone.
                    </span>
                ),
                labels: { confirm: `Yes, remove `, cancel: "Cancel" },
                cancelProps: { color: "red", variant: "filled" },
                confirmProps: { color: "green", variant: "filled" },
                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    dispatch(showOverlay());
                    deleteAuditor(item.id)
                        .then(() => {
                            successNotification("Auditor removed successfully");
                            form.removeListItem("auditors", index);
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
        else {
            form.removeListItem("auditors", index);
        }
    }



    const renderAuditInfo = () => (
        <div className="p-2 flex flex-col gap-8">
            {/* LOT 40 P0 fix : grilles responsive (mobile=1 col, tablet=2 cols, desktop=3 cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DateInput label="Start Date" {...form.getInputProps("audit.startDate")} leftSection={<IconCalendar />} maxDate={form.values.audit.endDate ? new Date(form.values.audit.endDate) : undefined} placeholder="Enter Start Date" withAsterisk />
                <DateInput label="End Date" {...form.getInputProps("audit.endDate")} leftSection={<IconCalendar />} minDate={form.values.audit.startDate ? new Date(form.values.audit.startDate) : undefined} placeholder="Enter End Date" withAsterisk />
                <NumberInput value={getDateDifferenceInDays(form.values.audit.startDate, form.values.audit.endDate)} disabled label="Estimated time (days)" placeholder="Enter Time" withAsterisk />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput disabled {...form.getInputProps("audit.refNumber")} label="Audit Reference" placeholder="Enter reference number" withAsterisk />
                <TextInput label="Audit Title" placeholder="Enter audit title" {...form.getInputProps("audit.title")} withAsterisk />
            </div>
            <Checkbox.Group size="md"
                {...form.getInputProps('audit.objectives')}
                label="Audit Objectives"
                withAsterisk
            >
                <div className="flex flex-wrap mt-5 gap-2">
                    {AuditObjectives.map((type) => (
                        <div key={type}>
                            <Checkbox.Card
                                value={type}
                                radius="md"
                                className="group border border-gray-300 transition duration-150 cursor-pointer  hover:!border-primary hover:!bg-primary/10  data-[checked]:!border-primary data-[checked]:!bg-primary/20 data-[checked]:shadow-sm"
                                p="xs"
                            >
                                <Group align="center" gap="xs">
                                    <Checkbox.Indicator size="xs" className=" text-blue-600" />
                                    <Text
                                        size="sm"
                                        className="text-gray-800 group-data-[checked]:text-blue-900 group-data-[checked]:font-medium"
                                    >
                                        {type}
                                    </Text>
                                </Group>
                            </Checkbox.Card>
                        </div>
                    ))}
                </div>
            </Checkbox.Group>

            <div>
                <MultiSelect hidePickedOptions {...form.getInputProps("audit.processes")} label="Audited Processes " placeholder="Select Audited Processes " withAsterisk data={processes} />
            </div>

            <Select {...form.getInputProps("audit.scopeId")} label="Audit Scope " placeholder="Select Audit Scope " data={auditAreas} withAsterisk />
            <div className="flex flex-col gap-2">
                <h1 className="">Planned Method <span className="text-red-500">*</span></h1>
                <Checkbox.Group {...form.getInputProps("audit.methods")} className="p-4 border border-gray-300 rounded-lg ">
                    <Group className="!grid !grid-cols-4 gap-2">

                        {auditMethods.map((method) => (
                            <Checkbox
                                key={method}
                                value={method}
                                label={method}
                                className="!text-gray-700 !font-medium"
                            />))
                        }
                    </Group>
                </Checkbox.Group>
            </div>
            <TextEditor form={form} id="audit.description" title="Description of the methodology" />



        </div>
    );

    const renderAuditorItem = (item: ListItem, index: number) => (
        <div key={index} className="flex flex-col gap-6" >
            <Fieldset key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" legend={<div className="flex gap-5">
                <div className="text-lg text-blue-500">Auditor {index + 1}</div>
                <ActionIcon onClick={() => handleRemoveAuditor(item, index)} variant="filled" color="red" aria-label="Settings">
                    <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
            </div>}>

                {form.values.audit.category === "EXTERNAL" ? (
                    <TextInput
                        {...form.getInputProps(`auditors.${index}.name`)}
                        placeholder="Auditor Name"
                        withAsterisk
                    />
                ) : (
                    <Select
                        {...form.getInputProps(`auditors.${index}.name`)}
                        onChange={(e) => {
                            const emp = auditorsMap[e || ""] || {};
                            form.setFieldValue(`auditors.${index}.name`, e || "");
                            form.setFieldValue(`auditors.${index}.email`, emp.email || "");
                            form.setFieldValue(`auditors.${index}.role`, emp.role || "");
                        }}
                        placeholder="Select Auditor"
                        withAsterisk
                        searchable
                        data={auditors.filter((x: any) =>
                            !form.values.auditors.some((y: any, i: number) => x.value === y.name && i !== index)
                        )}
                    />
                )}
                <Select disabled={form.values.audit.category === "INTERNAL"} placeholder="Role"  {...form.getInputProps(`auditors.${index}.role`)} data={auditorRoles} withAsterisk />
                <TextInput disabled={form.values.audit.category === "INTERNAL"} {...form.getInputProps(`auditors.${index}.email`)} placeholder="Email" withAsterisk />
            </Fieldset>

        </div>
    );







    const renderSection = () => {
        switch (activeStep) {
            case 0:
                return renderAuditInfo()
                    ;

            case 1:
                return (
                    <Stack my={10}>


                        {/* HSE Audit Type Section */}
                        <div className="grid grid-cols-1 gap-4">
                            <MultiSelect maxValues={2}
                                {...form.getInputProps("audit.types")}
                                label="Type of HSE Audit"
                                description="Select the type of HSE audit you want to perform. You can select up to 2 types."
                                placeholder="Select the type to view the recommended criteria"

                                data={auditTypesLabels}

                                withAsterisk
                            />

                            {form.values.audit.types?.map((x, index) => (
                                <Card key={index} shadow="sm" radius="md" withBorder className="!bg-green-50">
                                    <Text size="md" mb="sm" className="!text-green-700">
                                        {x}
                                    </Text>
                                    <Checkbox.Group {...form.getInputProps(`audit.auditTypes.${x}`)} className="flex flex-col  text-gray-600">
                                        <Group className="!grid !grid-cols-1 sm:!grid-cols-2 !gap-2">
                                            {criteriaByLabel[x].map((item: any) => (
                                                <Checkbox size="xs"
                                                    key={item}
                                                    label={item}
                                                    value={item}
                                                />
                                            ))}
                                        </Group>
                                    </Checkbox.Group>
                                    <div className="mt-4 flex items-start gap-2 p-3 rounded-xl  bg-green-100">
                                        <IconInfoCircle size={18} className="mt-1 text-green-700" />
                                        <Text size="sm" color="dimmed" className="!text-green-700">
                                            You can check/uncheck according to the reality of your site.
                                        </Text>
                                    </div>
                                </Card>)
                            )}
                        </div>
                        {/* <div>
                            <Select label="Audit modality " placeholder="Select Audit modality " data={["INTERNAL", "External"]} withAsterisk />
                        </div> */}
                        <Radio.Group size="md" {...form.getInputProps("audit.category")}
                            label="Audit Method"
                            withAsterisk
                            readOnly
                        >
                            <Group mt="xs">
                                <Radio value="INTERNAL" label="Internal Audit" />
                                <Radio value="EXTERNAL" label="External Audit" />

                            </Group>
                        </Radio.Group>

                        <Divider />

                        <div className="flex justify-between">
                            <Text size="lg">Audit Auditor</Text>
                            <Button leftSection={<IconPlus />} onClick={insertAuditor}>
                                Add Auditor
                            </Button>
                        </div>
                        {form.values.audit.category === "EXTERNAL" && <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <TextInput withAsterisk {...form.getInputProps(`company`)} placeholder="Company" label="Auditors Company" />
                            <TextInput withAsterisk {...form.getInputProps(`companyEmail`)} placeholder="Email" label="Company Email" />
                        </div>
                        }

                        {form.values.auditors.map(renderAuditorItem)}
                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                            <h2 className="flex items-center gap-2 text-base text-yellow-800 mb-2">
                                <IconInfoCircle size={18} className="text-yellow-600" />
                                Validation rules:
                            </h2>
                            <ul className="list-disc pl-6 text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-yellow-700 space-y-1">
                                <li>Only one head of audit per audit team</li>
                                <li>Can't add the same employee multiple times</li>
                                <li>All fields are required</li>
                                <li>Only users with the "listener" role can be selected</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-2">
                            <h1 className="">Applicable internal literature references</h1>
                            <Checkbox.Group {...form.getInputProps("audit.references")} className="p-4 border border-gray-300 rounded-lg ">
                                <Group className="!grid !grid-cols-4 gap-2">
                                    {documents.map((doc) => (
                                        <Checkbox size="sm"
                                            key={doc}
                                            value={doc}
                                            label={doc}
                                            className="!text-gray-700 !font-medium"
                                        />
                                    ))}
                                </Group>

                            </Checkbox.Group>
                        </div>
                    </Stack>
                );




            default:
                return null;
        }
    };
    return (
        <div>
            <div>
                <div className="text-2xl text-blue-500 w-fit">Update Audit Plan</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/">
                        <Text variant="gradient">Home</Text>
                    </Link>
                    <Link className="hover:!underline" to="/hs-activities-planning" ><Text variant="gradient" className="hover:!underline cursor-pointer">HSE Planning</Text></Link>
                    <Link className="hover:!underline" to="/annual-audit-plan" ><Text variant="gradient" className="hover:!underline cursor-pointer">Annual Audit Plan (AAP)</Text></Link>
                    <Text variant="gradient">Update Audit Plan</Text>
                </Breadcrumbs>
            </div>

            {planStatus.toUpperCase() === 'APPROVED' && (
                <Alert color="green" variant="light" className="mb-3">
                    <Text>This audit plan is approved. Editing may be restricted.</Text>
                </Alert>
            )}
            <Card className="bg-white" shadow="xl" withBorder radius="md">
                <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect>
                    <Stepper.Step icon={<IconFileText size={18} />} label="Audit Details" />
                    <Stepper.Step icon={<IconUsers size={18} />} label="Process & Team" />

                </Stepper>

                <div className="mt-6">{renderSection()}</div>

                <div className="flex gap-4 justify-center mt-6">
                    {activeStep > 0 && (
                        <Button variant="default" onClick={handlePrev}>
                            Previous
                        </Button>
                    )}
                    {activeStep < 1 ? (
                        <Button onClick={handleNext} variant="gradient">
                            Next
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="default" onClick={() => navigate('/annual-audit-plan')}>Cancel</Button>
                            <Button type="button" onClick={handleSubmit} variant="gradient">
                                Update Audit
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
export default EditNewAuditPlans 
