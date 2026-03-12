import { Breadcrumbs, Button, Group, Stepper, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import IncidentDetails from "./IncidentDetails";
import WitnessesSection from "./WitnessesSection";
import { useForm } from "@mantine/form";
import { getEmployeesWithDepartment } from "../../../../services/EmployeeService";
import { getAllActiveIncidentCategories } from "../../../../services/IncidentCategory";
import { getAllActiveIncidentType } from "../../../../services/IncidentTypeService";
import { getAllActiveLocations } from "../../../../services/LocationService";
import { getAllActiveSeverityLevel } from "../../../../services/SeverityLevelService";
import { getAllActiveWeatherConditions } from "../../../../services/WeatherService";
import { convertFileToBase64DTO } from "../../../../utility/DocumentUtility";
import { reportIncident } from "../../../../services/IncidentService";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { GetAllBodyParts } from "../../../../services/BodyPartsService";
import { isValidRichText, mapIdToName } from "../../../../utility/OtherUtilities";
import { IconCalendar, IconShield } from "@tabler/icons-react";
import IncidentAnalysis from "./IncidentAnalysis";
import IncidentRisk from "./IncidentRisk";
import { getAllActiveWorkArea } from "../../../../services/WorkAreaService";
import { getAllActiveWorkProcess } from "../../../../services/WorkProcessService";
import { getAllDepartments } from "../../../../services/HrmsService";
import ReportHelp from "./ReportHelp";

// type ActionPlan = {
//     actionName: '',
//     deadline: '',
//     assignedEmployeeId: "",
//     status: "",
//     description: ""
// }
const ReportIncidents = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [active, setActive] = useState(0);
    const [emps, setEmps] = useState<any[]>([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [weatherConditions, setWeatherConditions] = useState([]);
    const [incidentTypes, setIncidentTypes] = useState([]);
    const [severityLevels, setSeverityLevels] = useState([]);
    const [bodyParts, setBodyParts] = useState([]);
    const [severityLevelMap, setSeverityLevelMap] = useState<Record<number, any>>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [workAreas, setWorkAreas] = useState<any[]>([]);
    const [workProcesses, setWorkProcesses] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);


    const nextStep = () => {
        form.validate();
        if (form.values.incidentDetails.length === 0) {
            setErrorMessage("At least one incident detail is required");
            return;
        } else {
            setErrorMessage(null);
        }
        if (form.isValid())
            setActive((current) => (current < 3 ? current + 1 : current));
        else {
            setErrorMessage("Please fill all required fields correctly.");
            return;
        }
    }
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));
    const form = useForm({
        initialValues: {
            number: 'INC-' + (new Date()).getFullYear() + '-XXXXXX',
            title: '',
            status: "REPORTED",
            locationId: '',
            weatherConditions: [],
            occurredAt: new Date(),
            discoveryTime: new Date(),
            reporterId: '',
            workAreaId: '',
            workProcessId: '',
            ppe: [],
            involvedPersons: [],
            witnesses: [],
            evidence: [],
            department: "",
            incidentDetails: [
                {
                    incidentCategoryId: '',
                    incidentTypeId: '',
                    severityLevelId: '',
                    affectedBodyParts: [],
                    environmentalImpact: '',
                    containmentMeasures: ''
                }
            ],
            factualDescription: '',
            immediateCauses: '',
            rootCauses: '',
            contributingFactors: '',
            immediateConsequences: '',
            potentialConsequences: '',
            immediateActions: '',

            probability: '1',
            severity: '1',
            existingControlMeasures: '',
            residualRiskAssessment: '',


        },
        validate: {
            title: (value) => value.trim()?.length > 0 ? null : "Title is required",
            locationId: (value) => value ? null : "Location is required",
            weatherConditions: (value) => value.length > 0 ? null : "Weather condition is required",
            occurredAt: (value) => value ? null : "Occurrence date and time is required",
            discoveryTime: (value) => value ? null : "Discovery date and time is required",
            incidentDetails: {
                incidentCategoryId: (value) => value ? null : "Incident category is required",
                incidentTypeId: (value) => value ? null : "Incident type is required",
                severityLevelId: (value) => value ? null : "Severity level is required",
            },
            department: (value) => value ? null : "Department is required",
            workAreaId: (value) => value ? null : "Work area is required",
            workProcessId: (value) => value ? null : "Work process is required",
            reporterId: (value) => value || active == 0 ? null : "Reporter is required",
            factualDescription: (value) => isValidRichText(value) || active < 2 ? null : "Factual description is required",
            immediateCauses: (value) => isValidRichText(value) || active < 2 ? null : "Immediate causes is required",
            rootCauses: (value) => isValidRichText(value) || active < 2 ? null : "Root causes is required",
            contributingFactors: (value) => isValidRichText(value) || active < 2 ? null : "Contributing factors is required",
            immediateConsequences: (value) => isValidRichText(value) || active < 2 ? null : "Immediate consequences is required",
            potentialConsequences: (value) => isValidRichText(value) || active < 2 ? null : "Potential consequences is required",
            immediateActions: (value) => isValidRichText(value) || active < 2 ? null : "Immediate actions is required",
            probability: (value) => value ? null : "Probability is required",
            severity: (value) => value ? null : "Severity is required",
            existingControlMeasures: (value) => isValidRichText(value) || active < 3 ? null : "Existing control measures is required",
            residualRiskAssessment: (value) => isValidRichText(value) || active < 3 ? null : "Residual risk assessment is required",

        }
    })


    useEffect(() => {
        getEmployeesWithDepartment().then((res: any) => {
            setEmps(res);
        }).catch((_err: any) => { });

        getAllActiveIncidentCategories().then((res: any) => {
            setCategories(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }).catch((_err: any) => { });
        getAllActiveIncidentType().then((res: any) => {
            setIncidentTypes(res.map((item: any) => ({ label: item.name, value: "" + item.id, category: "" + item.incidentCategoryId, severityLevel: "" + item.severityLevelId })));
        }).catch((_err: any) => { });
        getAllActiveLocations().then((res: any) => {
            setLocations(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }
        ).catch((_err: any) => { });
        getAllActiveSeverityLevel().then((res: any) => {
            setSeverityLevelMap(mapIdToName(res))
            setSeverityLevels(res.map((item: any) => ({ label: item.name, value: "" + item.id, severityLevel: item.level })));
        }
        ).catch((_err: any) => { });
        getAllActiveWeatherConditions().then((res: any) => {
            setWeatherConditions(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }
        ).catch((_err: any) => { });
        GetAllBodyParts({}).then((res: any) => {
            setBodyParts(res.map((item: any) => ({ ...item, label: item.name, value: "" + item.id })));
        }
        ).catch((_err: any) => { });
        getAllActiveWorkArea().then((res: any) => {
            setWorkAreas(res.map((item: any) => ({ label: item.name, value: "" + item.id, departmentId: item.departmentId })));
        }).catch((_err: any) => { });
        getAllActiveWorkProcess().then((res: any) => {
            setWorkProcesses(res.map((item: any) => ({ label: item.name, value: "" + item.id, departmentId: item.departmentId })));
        }).catch((_err: any) => { });
        getAllDepartments().then((res: any) => {
            setDepartments(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }).catch((_err: any) => { });
    }, []);

    // useEffect(() => {
    //     let stp = false;
    //     form.values.incidentDetails.forEach((x: any) => {
    //         if (x.severityLevelId) {
    //            const selectedSeverity: any = severityLevels.find((item: any) => item.value == x.severityLevelId);
    //             if (selectedSeverity) {
    //                 let x = selectedSeverity?.severityLevel

    //                 if (x > 3) {
    //                     stp = true;
    //                 }
    //             }
    //         }

    //     })
    // }, [form.values.incidentDetails]); 

    const handleSubmit = async () => {
        form.validate();
        if (!form.isValid()) {
            setErrorMessage("Please fill all required fields correctly.");
            return;
        }
        const values = form.values;
        const evidence = await Promise.all(values.evidence?.map(convertFileToBase64DTO));
        const deptId = emps.find((emp: any) => emp.id == values.reporterId)?.departmentId;
        dispatch(showOverlay());
        reportIncident({ ...values, evidence: evidence, departmentId: deptId, involvedPersons: values.involvedPersons?.map((x: any) => x.id), witnesses: values.witnesses?.map((x: any) => x.id) }).then((_res: any) => {
            successNotification("Incident reported successfully");
            navigate("/incidents");
        }
        ).catch((err: any) => {
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }
        ).finally(() => {
            dispatch(hideOverlay());
        })

    }


    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formattedDate = currentTime.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const formattedTime = currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const footer = () => (<div className="w-full">
        {errorMessage && <Text color="red" mx="auto" ta="center" mt="md">{errorMessage}</Text>}
        <Group justify="space-between" >
            <Button variant="default" onClick={prevStep}>Back</Button>
            <div className="flex items-center gap-2">

                {(active < 3) && <Button onClick={nextStep} variant="gradient">Next step</Button>}
                <Button onClick={handleSubmit} variant="filled" color="red">Submit</Button>
            </div>
        </Group>
    </div>
    )

    return (
        <div className="p-5 flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">Report Incidents</div>
                    <Breadcrumbs mt="xs" >
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/incidents">
                            <Text variant="gradient">Incidents Management</Text>
                        </Link>
                        <Text variant="gradient">Report Incidents</Text>
                    </Breadcrumbs>
                </div>
            </div>
            <div className="  shadow-md rounded-lg bg-home  p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-home rounded-3xl p-2">
                            <IconShield className="text-white " size={30} />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white ">ISO 45001 Incident Declaration</h2>
                            <p className="text-sm text-white">
                                Compliant with ISO 45001:2018 Occupational Health and Safety Management
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col  gap-2  text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-home rounded-3xl p-1">
                                <IconCalendar size={15} className="text-white" />
                            </div>

                            <span className="text-sm ">{formattedDate}</span>
                            <span className="text-sm ">{formattedTime}</span>
                        </div>

                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-5  [&_.mantine-Stepper-steps]:gap-5">
                <Stepper active={active} onStepClick={setActive}>
                    <Stepper.Step label="Step 1" description="Incident Details">
                        <div className="grid grid-cols-3 gap-5 ">
                            <div className="col-span-2 space-y-5">
                                <IncidentDetails form={form} weatherConditions={weatherConditions} locations={locations} categories={categories} incidentTypes={incidentTypes} severityLevels={severityLevels} bodyParts={bodyParts} severityLevelMap={severityLevelMap} workAreas={workAreas} workProcesses={workProcesses} departments={departments} />
                                {footer()}
                            </div>

                            <ReportHelp activeStep={active} />
                        </div>
                    </Stepper.Step>
                    <Stepper.Step label="Step 2" description="Witnesses & Involved Persons">
                        <div className="grid grid-cols-3 gap-5">
                            <div className="col-span-2 space-y-5">
                                <WitnessesSection form={form} employees={emps} />
                                {footer()}
                            </div>
                            <ReportHelp activeStep={active} />
                        </div>
                    </Stepper.Step>
                    <Stepper.Step label="Step 3" description="Incident Analysis">
                        {/* <UploadSection form={form} employees={emps} /> */}
                        <div className="grid grid-cols-3 gap-5">
                            <div className="col-span-2 space-y-5">
                                <IncidentAnalysis form={form} employees={emps} />
                                {footer()}
                            </div>
                            <ReportHelp activeStep={active} />
                        </div>
                    </Stepper.Step>
                    <Stepper.Step label="Step 4" description="Risk Assessment">
                        <div className="grid grid-cols-3 gap-5">
                            <div className="col-span-2 space-y-5">
                                <IncidentRisk form={form} employees={emps} />
                                {footer()}
                            </div>
                            <ReportHelp activeStep={active} />
                        </div>
                    </Stepper.Step>

                    {/* <Stepper.Completed>
                        <div>Completed</div>
                    </Stepper.Completed> */}
                </Stepper>

            </div>
        </div>
    )
}

export default ReportIncidents