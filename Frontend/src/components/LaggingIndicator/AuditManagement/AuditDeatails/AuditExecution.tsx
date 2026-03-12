import { useEffect, useState } from "react";
import { ActionIcon, Badge, Button, Group, Select, TextInput } from "@mantine/core";
import { IconPhoto, IconPlus, IconTrash } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { isValidRichText } from "../../../../utility/OtherUtilities";
import TextEditor from "../../../UtilityComp/TextEditor";
import FileUpdateDropzone from "../../../UtilityComp/FileUpdateDropzone";
import { formatDateShort } from "../../../../utility/DateFormats";
import { GetAllAuditArea } from "../../../../services/AuditAreaService";
import { mantineColorToLevel, observationTypes, severities, severitiesMap } from "../../../../Data/DropdownData";
import { modals } from "@mantine/modals";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { createObservation, getObservationByAuditId } from "../../../../services/ObservationService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { convertFilesToBase64New, handlePreview } from "../../../../utility/DocumentUtility";
import { useParams } from "react-router-dom";

const AuditExecution = ({ employees, empMap, audit, onObservationAdded }: any) => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [showForm, setShowForm] = useState(false);

    const [auditAreas, setAuditAreas] = useState<any[]>([]);
    const [observations, setObservations] = useState<any[]>([]);


    useEffect(() => {

        GetAllAuditArea({}).then((res) => {
            setAuditAreas(res.map((item: any) => {
                return {
                    ...item,
                    value: "" + item.id,
                    label: item.name,
                }
            }));
        }).catch((_err) => {
            setAuditAreas([]);
        });

        fetchObservations();
    }, []);

    const fetchObservations = () => {
        getObservationByAuditId(Number(id)).then((res) => {

            setObservations(res);
        }).catch((_err) => {
            setObservations([]);
        });

    }

    const empForm = useForm({
        initialValues: {
            id: '',
            date: new Date(),
        },
        validate: {
            id: (value) => (value ? null : 'Employee  is required'),
            date: (value) => (value ? null : 'Date is required'),
        }
    });


    const handleAddInterviewee = () => {
        empForm.validate();
        if (!empForm.isValid()) {
            return;
        }
        form.setFieldValue('interviews', [...form.values.interviews, empForm.values]);
        empForm.reset();
    };

    const handleRemoveInterviewee = (id: number) => {
        let updatedInterviewees = form.values.interviews.filter((entry: any) => entry.id !== id);
        form.setFieldValue('interviews', updatedInterviewees);
    };



    const handleCancel = () => {
        setShowForm(false);
    };


    const form = useForm({
        initialValues: {
            title: "",
            date: new Date() as any,
            observedFact: '',
            reference: '',
            type: '',

            severity: '',
            zoneId: '',
            description: '',
            evidence: [],
            interviews: [] as any,


        },
        validate: {
            date: (value) => (value ? null : 'Date is required'),
            type: (value) => (value ? null : 'Owner is required'),
            observedFact: (value) => (value?.trim()?.length > 0 ? null : 'Owner is required'),
            reference: (value) => (value?.trim()?.length > 0 ? null : 'Category is required'),
            severity: (value) => (value ? null : 'Severity is required'),
            zoneId: (value) => (value ? null : 'Zone is required'),
            description: (value) => (isValidRichText(value) ? null : 'Description is required'),


        }
    });


    const handleSubmit = () => {

        form.validate();
        if (!form.isValid()) return;


        let values = form.values;

        modals.openConfirmModal({
            title: <span className="font-semibold text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to create this observation?
                </span>
            ),
            labels: { confirm: `Yes, Create`, cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                const evidence = await convertFilesToBase64New(values.evidence);
                dispatch(showOverlay());
                createObservation({ ...values, evidence, auditId: id })
                    .then(() => {
                        successNotification("Observation created successfully");
                        form.reset();
                        empForm.reset();
                        setShowForm(false);
                        fetchObservations();
                        onObservationAdded?.();
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

    return (
        <div className="   p-6 bg-white rounded-xl shadow-sm border border-gray-300">
            {!showForm ? (
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <p className="text-xl font-semibold text-gray-700">Execution of Audit </p>
                        {audit.status !== "CLOSED" && audit.status != "CANCELLED" && <Button onClick={() => setShowForm(true)} leftSection={<IconPlus />}>New Observation</Button>}
                    </div>

                    {observations.length === 0 ? (
                        <p className="text-gray-500 italic">No observations found.</p>
                    ) : (
                        observations.map((obs: any) => (
                            <div
                                key={obs.id}
                                className="p-6 rounded-2xl border border-gray-200 shadow-md bg-white space-y-2 transition hover:shadow-lg"
                            >
                                {/* Top Info Row */}
                                <div className="flex flex-wrap justify-between items-center">
                                    <div className="flex gap-3 flex-wrap items-center">
                                        <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full uppercase">
                                            {obs.type}
                                        </span>
                                        <Badge variant="outline" color={mantineColorToLevel[obs.severity]} >
                                            {severitiesMap[obs.severity]}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500">{formatDateShort(obs.date)}</p>

                                </div>

                                {/* Observation Content */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-800 leading-snug">
                                        {obs.observedFact?.replace(/<\/?[^>]+(>|$)/g, "")}
                                    </h3>
                                    <p className="text-sm text-gray-600">Ref: {obs.reference}</p>
                                </div>

                                {/* Metadata Section */}
                                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                                    <div>
                                        <strong className="block text-gray-500 mb-1">Evidence Description:</strong>
                                        <div dangerouslySetInnerHTML={{ __html: obs.description }} />
                                    </div>
                                    <div>
                                        <strong className="block text-gray-500 mb-1">Zone:</strong>
                                        {auditAreas.find(area => area.value == obs.zoneId)?.label || "Unknown"}
                                    </div>
                                    {obs.interviews?.length > 0 && (
                                        <div className="md:col-span-2">
                                            <strong className="block text-gray-500 mb-1">Interviews:</strong>
                                            <div className="flex flex-wrap gap-2">
                                                {obs.interviews.map((emp: any, i: number) => (
                                                    <span key={i} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-xs">
                                                        {emp.name} ({formatDateShort(emp.date)})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {obs.evidence?.length > 0 && (
                                        <div className="md:col-span-2">
                                            <strong className="block text-gray-500 mb-1">Attachments:</strong>
                                            <Group className="flex flex-wrap gap-2">
                                                {obs.evidence.map((doc: any) => (
                                                    <Badge
                                                        key={doc.name}
                                                        size="lg"
                                                        className="!cursor-pointer"
                                                        onClick={() => handlePreview(doc)}
                                                        leftSection={<IconPhoto size={14} />}
                                                        color="orange"
                                                        variant="light"
                                                    >
                                                        {doc.name}
                                                    </Badge>
                                                ))}
                                            </Group>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {/* New Observation Form */}
                    <div className="flex justify-between items-center">

                        <h2 className="text-lg font-semibold text-gray-700 ">New Observation</h2>
                        <Button color="red" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </div>
                    <div className="flex flex-col gap-5">


                        <div className="grid grid-cols-2 gap-4">
                            <TextInput label="Title" placeholder="Enter observation Title" withAsterisk {...form.getInputProps('title')} />
                            <DateInput label="Valuation date" placeholder="Select Date" minDate={audit?.startDate ? new Date(audit?.startDate) : undefined} withAsterisk {...form.getInputProps('date')} />
                            <div className="col-span-2">

                                <TextEditor title="Observed fact" form={form} withAsterisk id='observedFact' />
                            </div>
                            <TextInput label="Reference to criterion" placeholder="ISO 45001:2018 - 8.1.1" withAsterisk {...form.getInputProps('reference')} />
                            <Select label="Type" placeholder=" Select type" data={observationTypes} withAsterisk  {...form.getInputProps('type')} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Severity" placeholder="Select Severity" withAsterisk data={severities}  {...form.getInputProps('severity')} />
                            <Select label="Location / Area " placeholder=" Select Location / Area " data={auditAreas} withAsterisk {...form.getInputProps('zoneId')} />
                        </div>

                        <div>

                            <TextEditor title="Description of evidence" form={form} withAsterisk id="description" />
                        </div>

                        <div className="flex flex-col ">
                            <p className="font-medium">Evidence files (PDF, Images)</p>
                            <FileUpdateDropzone form={form} id="evidence" />
                        </div>

                        <div className="flex flex-col gap-3">
                            <p className="font-medium ">Employees interviewed</p>
                            <div className=" bg-blue-50 p-4 rounded-lg flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        placeholder="Choose an employee"
                                        label="Select an employee"
                                        data={employees.filter((emp: any) => !(form.values.interviews.some((entry: any) => entry.id === emp.value) && emp.value !== empForm.values.id))}

                                        {...empForm.getInputProps('id')}
                                    />
                                    <DateInput label="Interview Date" placeholder="Enter Date" {...empForm.getInputProps('date')} maxDate={new Date()} />
                                </div>

                                <div className="">
                                    <Button leftSection={<IconPlus />} onClick={handleAddInterviewee}>
                                        Add to List
                                    </Button>
                                </div>
                            </div>

                            {/* Added Interviewee Cards */}
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {form.values.interviews?.map((entry: any) => (
                                    <div
                                        key={entry.id}
                                        className="bg-green-50 border flex items-center justify-between border-green-300 rounded-lg p-4 relative"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="text-green-600">
                                                <strong className="text-green-600 ">Employee:</strong> {empMap[entry.id] ? empMap[entry.id].name : 'Unknown Employee'}
                                            </div>
                                            <div className="text-green-600">
                                                <strong className="text-green-600 ">Interview date:</strong> {formatDateShort(entry.date)}
                                            </div>
                                        </div>
                                        <ActionIcon
                                            type="button"
                                            onClick={() => handleRemoveInterviewee(entry.id)}
                                            color="red"
                                        >
                                            <IconTrash size={18} />
                                        </ActionIcon>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 mt-6">

                        <Button onClick={handleSubmit}>Save</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AuditExecution
