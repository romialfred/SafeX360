import { IconAlertTriangle, IconBuilding, IconCircleCheck, IconFlask2, IconLink } from "@tabler/icons-react";
import { TextInput, Textarea, Select, Button } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { createChemicalRisk } from "../../../services/RiskIdentificationService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllDepartments } from "../../../services/HrmsService";
import { GetAllWorkProcess } from "../../../services/WorkProcessService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";

const RiskIdentification = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<any[]>([]);
    const [workProcesses, setWorkProcesses] = useState<any[]>([]);
    const [emps, setEmps] = useState<any[]>([]);
    useEffect(() => {
        fetchDepartments();
        fetchWorkProcesses();
        fetchEmployees();
    }, [])


    const fetchEmployees = () => {
        // Fetch employees from API or service
        getEmployeeDropdown().then((data) => {
            setEmps(data);
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch employees");
        });
    };

    const fetchDepartments = () => {

        getAllDepartments().then((data) => {
            setDepartments(data.map((department: any) => ({ value: "" + department.id, label: department.name })));
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch departments");
        });
    };

    const fetchWorkProcesses = () => {
        // Fetch work processes from API or service
        GetAllWorkProcess({}).then((data) => {

            setWorkProcesses(data.map((workProcess: any) => ({ value: "" + workProcess.id, label: workProcess.name })));
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch work processes");
        });
    };
    const classifications = [
        "Flammable",
        "Toxic",
        "Corrosive",
        "Oxidizing",
        "Explosive",
        "Irritant",
        "Carcinogenic",
        "Mutagenic",
        "Reproductive Toxin",
    ];

    const hazardSources = [
        "Storage",
        "Handling",
        "Transport",
        "Mixing",
        "Heating",
        "Disposal",
        "Maintenance",
        "Emergency Response",
    ];

    // const FormField = ({
    //     label,
    //     children,
    //     required = false,
    //     className = "",
    // }: {
    //     label: string;
    //     children: React.ReactNode;
    //     helpKey: string;
    //     required?: boolean;
    //     sectionKey?: string;
    //     className?: string;
    // }) => (
    //     <div className={`${className}`}>
    //         <div className="w-full">
    //             <label className="block text-sm font-medium text-gray-700 mb-2">
    //                 {label}
    //                 {required && <span className="text-red-500 ml-1">*</span>}
    //             </label>
    //             {children}
    //         </div>
    //     </div>
    // );

    const sectionFields = {
        "general-info": {
            title: "General Information",
            icon: IconBuilding,
            color: "text-blue-600",
            bgColor: "bg-blue-50 border-blue-200",
            tips: [
                "Capture the date you identified the chemical risk for traceability.",
                "Select the department and process where this chemical is handled.",
                "Assign a responsible owner and note who reported the risk for follow-up.",
            ],
        },
        "hazard-info": {
            title: "Hazard Information",
            icon: IconFlask2,
            color: "text-orange-600",
            bgColor: "bg-orange-50 border-orange-200",
            tips: [
                "Use the chemical name and CAS number as listed on the SDS.",
                "Choose the best fitting GHS classification for the substance.",
                "Describe where the hazard comes from and how the chemical is used day-to-day.",
            ],
        },
        "risk-description": {
            title: "Risk Description",
            icon: IconAlertTriangle,
            color: "text-red-600",
            bgColor: "bg-red-50 border-red-200",
            tips: [
                "Explain the scenario: who is exposed, during which task, and under what conditions.",
                "Highlight existing controls or gaps that make the risk credible.",
                "List the most likely consequences for people, assets, or the environment.",
            ],
        },
        "link-assessments": {
            title: "Link to Assessments",
            icon: IconLink,
            color: "text-purple-600",
            bgColor: "bg-purple-50 border-purple-200",
            tips: [
                "Once the risk is saved, create assessments to evaluate severity and controls.",
                "Use revisions to document improvement actions and track progress over time.",
            ],
        },
    } as const;

    const SectionHelpPanel = ({ sectionKey }: { sectionKey: string }) => {
        const section = sectionFields[sectionKey as keyof typeof sectionFields];
        if (!section) return null;

        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 w-80 flex-shrink-0">
                <div className="flex items-center mb-6">
                    <div className={`p-2 rounded-lg ${section.bgColor} mr-3`}>
                        <section.icon className={`w-6 h-6 ${section.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                </div>

                <div className={`rounded-lg p-4 ${section.bgColor}`}>
                    <div className="space-y-3 text-sm text-gray-700">
                        {section.tips.map((tip, index) => (
                            <div key={index} className="flex items-start">
                                <div className={`w-2 h-2 rounded-full ${section.color.replace('text-', 'bg-')} mr-3 mt-2 flex-shrink-0`} />
                                <div>{tip}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const form = useForm({
        initialValues: {
            riskId: "CHR-2024-001",
            dateOfIdentification: new Date(),
            departmentId: "",
            workProcessId: "",
            personReporting: "",
            chemicalName: "",
            casNumber: "",
            classification: "",
            hazardSource: "",
            methodOfUse: "",
            title: "",
            riskDescription: "",
            potentialConsequences: "",
            status: 'OPEN',
        },
        validate: {
            riskId: (value) => (value?.trim().length > 0 ? null : 'Risk ID is required'),
            departmentId: (value) => (value ? null : 'Department is required'),
            dateOfIdentification: (value) => (value ? null : 'Date is required')
        }
    });
    useEffect(() => {
        const chemical = (form.values.chemicalName || '').trim();
        const hazard = (form.values.hazardSource || '').trim();
        const method = (form.values.methodOfUse || '').trim();
        const derivedTitle = [chemical, hazard || method].filter(Boolean).join(' - ').slice(0, 120);
        if (derivedTitle && derivedTitle !== form.values.title) {
            form.setFieldValue('title', derivedTitle);
        } else if (!derivedTitle && form.values.title) {
            form.setFieldValue('title', '');
        }
    }, [form.values.chemicalName, form.values.hazardSource, form.values.methodOfUse]);

    const handleSubmit = () => {
        dispatch(showOverlay());

        const payload = {
            ...form.values,
            dateOfIdentification: form.values.dateOfIdentification
                ? form.values.dateOfIdentification.toISOString().split("T")[0]
                : null,

            departmentId: form.values.departmentId ? Number(form.values.departmentId) : null,
            workProcessId: form.values.workProcessId ? Number(form.values.workProcessId) : null,
        };


        createChemicalRisk(payload)
            .then((_res) => {
                successNotification("Requirement created successfully");
                navigate("/chemical-register"); // 👈 navigate after success
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => dispatch(hideOverlay()));
    };

    return (
        <div>
            <div className="space-y-8">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    {/* ---- General Info Section ---- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex gap-8">
                            <div className="flex-1">
                                <div className="flex items-center mb-6">
                                    <IconBuilding className="w-6 h-6 text-blue-600 mr-3" />
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        General Information
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                                    <TextInput label="Risk ID" disabled {...form.getInputProps('riskId')} />


                                    <DateInput required label="Date of Identification" {...form.getInputProps('dateOfIdentification')} placeholder="When was this risk identified?"
                                        minDate={new Date()} />


                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                                    <Select
                                        required
                                        label="Department"
                                        placeholder="Select department"
                                        data={departments}

                                        {...form.getInputProps('departmentId')}
                                    />


                                    <Select
                                        required
                                        label="Work Process"
                                        placeholder="Select work process"
                                        data={workProcesses}

                                        {...form.getInputProps('workProcessId')}
                                    />


                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <Select
                                        label="Risk Owner"
                                        placeholder="Who is responsible for this risk?"
                                        data={emps.map(emp => ({ value: "" + emp.id, label: emp.name }))}
                                        required
                                        {...form.getInputProps('ownerId')}
                                    />
                                    <TextInput required label="Person Reporting" placeholder="Name and position" {...form.getInputProps('personReporting')} />
                                </div>


                            </div>
                            <div className="w-80 flex-shrink-0">
                                <SectionHelpPanel sectionKey="general-info" />
                            </div>
                        </div>
                    </div>

                    {/* ---- Hazard Info Section ---- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex gap-8">
                            <div className="flex-1">
                                <div className="flex items-center mb-6">
                                    <IconFlask2 className="w-6 h-6 text-orange-600 mr-3" />
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Hazard Information
                                    </h3>
                                </div>
                                <div className="flex flex-col gap-5">

                                    <TextInput required label="Chemical Name" placeholder="Official product name from SDS" {...form.getInputProps('chemicalName')} />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <TextInput required label="CAS Number" placeholder="e.g., 7664-93-9" {...form.getInputProps('casNumber')} />


                                        <Select required label="Classification" placeholder="Select Classification" data={classifications} {...form.getInputProps('classification')} />

                                    </div>

                                    <Select required label="Hazard Source" placeholder="Select Hazard Source" data={hazardSources} {...form.getInputProps('hazardSource')} />


                                    <Textarea required label="Method of Use" rows={3} placeholder="Describe how the chemical is applied or processed" {...form.getInputProps('methodOfUse')} />

                                </div>
                            </div>
                            <div className="w-80 flex-shrink-0">
                                <SectionHelpPanel sectionKey="hazard-info" />
                            </div>
                        </div>
                    </div>

                    {/* ---- Risk Description Section ---- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex gap-8">
                            <div className="flex-1">
                                <div className="flex items-center mb-6">
                                    <IconAlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Risk Description
                                    </h3>
                                </div>
                                <div className="flex flex-col gap-5">

                                    <TextInput
                                        required
                                        label="Risk Title"
                                        placeholder="Enter a short title for this risk"

                                        {...form.getInputProps('title')}
                                    />




                                    <Textarea
                                        label="Risk Description"
                                        placeholder="Describe the identified risk..."
                                        required
                                        rows={3}
                                        {...form.getInputProps('description')}
                                    />



                                    <Textarea required label="Potential Consequences" rows={4} placeholder="List possible effects on health, safety, or environment" {...form.getInputProps('potentialConsequences')} />

                                </div>
                            </div>
                            <div className="w-80 flex-shrink-0">
                                <SectionHelpPanel sectionKey="risk-description" />
                            </div>
                        </div>
                    </div>

                    {/* ---- Link Assessments Section ---- */}
                    {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex gap-8">
                            <div className="flex-1">
                                <div className="flex items-center mb-6">
                                    <IconLink className="w-6 h-6 text-purple-600 mr-3" />
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Link to Assessments
                                    </h3>
                                </div>
                                <FormField label="Related Assessments" helpKey="relatedAssessments">
                                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                        <p className="text-gray-600 text-sm mb-2">
                                            Assessments linked to this risk will appear here once created.
                                        </p>
                                        <div className="flex items-center text-blue-600">
                                            <IconPlus className="w-4 h-4 mr-2" />
                                            <span className="text-sm">Create New Assessment</span>
                                        </div>
                                    </div>
                                </FormField>
                            </div>
                            <div className="w-80 flex-shrink-0">
                                <SectionHelpPanel sectionKey="link-assessments" />
                            </div>
                        </div>
                    </div> */}

                    {/* ---- Footer ---- */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center text-sm text-gray-500">
                            <IconCircleCheck className="w-4 h-4 mr-2" />
                            Form auto-saves as you type
                        </div>
                        <div className="flex space-x-4">
                            <Button color="gray">Save as Draft</Button>
                            <Button type="submit">Submit for Review</Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RiskIdentification;
