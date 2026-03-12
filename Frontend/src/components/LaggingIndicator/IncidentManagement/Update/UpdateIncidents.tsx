import { Alert, Breadcrumbs, Button, Group, Stepper, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "@mantine/form";
import { getEmployeesWithDepartment } from "../../../../services/EmployeeService";
import { getAllActiveIncidentCategories } from "../../../../services/IncidentCategory";
import { getAllActiveIncidentType } from "../../../../services/IncidentTypeService";
import { getAllActiveLocations } from "../../../../services/LocationService";
import { getAllActiveSeverityLevel } from "../../../../services/SeverityLevelService";
import { getAllActiveWeatherConditions } from "../../../../services/WeatherService";
import { base64ToFileWithNameNew, convertFilesToBase64New } from "../../../../utility/DocumentUtility";
import { getIncidentById, updateIncident } from "../../../../services/IncidentService";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { GetAllBodyParts } from "../../../../services/BodyPartsService";
import IncidentDetails from "./IncidentDetails";
import WitnessesSection from "./WitnessesSection";
import { isValidRichText, mapIdToName } from "../../../../utility/OtherUtilities";
import { getAllActiveWorkArea } from "../../../../services/WorkAreaService";
import { getAllActiveWorkProcess } from "../../../../services/WorkProcessService";
import { getAllDepartments } from "../../../../services/HrmsService";
import IncidentAnalysis from "./IncidentAnalysis";
import IncidentRisk from "./IncidentRisk";
import ReportHelp from "../Report/ReportHelp";



const UpdateIncidents = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate(); const [active, setActive] = useState(0);
    const [emps, setEmps] = useState<any[]>([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [weatherConditions, setWeatherConditions] = useState([]);
    const [incidentTypes, setIncidentTypes] = useState([]);
    const [severityLevels, setSeverityLevels] = useState([]);
    const [bodyParts, setBodyParts] = useState([]);
    const [severityLevelMap, setSeverityLevelMap] = useState<Record<number, any>>({});
    const [lockedInfo, setLockedInfo] = useState<{ locked: boolean; status: string }>({ locked: false, status: '' });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [workAreas, setWorkAreas] = useState<any[]>([]);
    const [workProcesses, setWorkProcesses] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const nextStep = () => {
        if (lockedInfo.locked) {
            errorNotification(lockedInfo.status === 'CLOSED' ? 'This incident is closed. Modifications are not allowed.' : 'This incident is rejected. Modifications are not allowed.');
            return;
        }
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
        if (!id) return;
        dispatch(showOverlay());
        getIncidentById(id).then((res: any) => {

            const evidenceFiles = res?.evidence.map((x: any) => {
                const mimeType = x?.type?.split(',')[0]?.split(':')[1]; // Extract MIME type
                const file = base64ToFileWithNameNew(x.file, x.name, mimeType);
                return {
                    id: x.id,
                    file
                };
            });
            form.setValues({ ...res, occurredAt: new Date(res.occurredAt), startDate: new Date(res.startDate), endDate: new Date(res.endDate), workAreaId: "" + res.workAreaId, workProcessId: "" + res.workProcessId, reporterId: "" + res.reporterId, probability: "" + res.probability, severity: "" + res.severity, discoveryTime: new Date(res.discoveryTime), incidentDetails: res.incidentDetails.map((x: any) => ({ ...x, incidentCategoryId: "" + x.incidentCategoryId, incidentTypeId: "" + x.incidentTypeId, severityLevelId: "" + x.severityLevelId, affectedBodyParts: x?.affectedBodyParts.map((y: any) => ("" + y)) })), locationId: "" + res.locationId, weatherConditions: res.weatherConditions?.map((x: any) => ("" + x)) ?? [], witnesses: res.witnesses.map((x: any) => ({ id: x })), involvedPersons: res.involvedPersons.map((x: any) => ({ id: x })), evidence: evidenceFiles });
            const statusUpper = String(res?.status || '').toUpperCase();
            if (['CLOSED', 'REJECTED'].includes(statusUpper)) {
                setLockedInfo({ locked: true, status: statusUpper });
            }
        }).catch((err: any) => {
            console.log(err);
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }).finally(() => {
            dispatch(hideOverlay());
        })
    }, [id])

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


    useEffect(() => {
        if (!workAreas || workAreas.length === 0 || !form.values.workAreaId || !departments || departments.length === 0) return;
        const selectedWorkArea = workAreas.find((item: any) => item.value === form.values.workAreaId);
        if (selectedWorkArea) {
            form.setValues({ department: selectedWorkArea.departmentId, workAreaId: form.values.workAreaId, workProcessId: form.values.workProcessId });
        }

    }, [departments, workAreas, form.values.workAreaId])



    const handleSubmit = async () => {
        if (lockedInfo.locked) {
            errorNotification(lockedInfo.status === 'CLOSED' ? 'This incident is closed. Modifications are not allowed.' : 'This incident is rejected. Modifications are not allowed.');
            return;
        }
        const values = form.values;
        const evidence = await convertFilesToBase64New(values.evidence);
        dispatch(showOverlay());
        const deptId = emps.find((emp: any) => emp.id == values.reporterId)?.departmentId;
        updateIncident({ ...values, departmentId: deptId, evidence: evidence, involvedPersons: values.involvedPersons?.map((x: any) => x.id), witnesses: values.witnesses?.map((x: any) => x.id) }).then((_res: any) => {
            successNotification("Incident updated successfully");
            navigate("/incidents");
        }
        ).catch((err: any) => {
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }
        ).finally(() => {
            dispatch(hideOverlay());
        })

    }

    const footer = () => (<div className="w-full">
        {errorMessage && <Text color="red" mx="auto" ta="center" mt="md">{errorMessage}</Text>}
        <Group justify="space-between" >
            <Button variant="default" onClick={prevStep}>Back</Button>
            <div className="flex items-center gap-2">

                {(active < 3) && <Button onClick={nextStep} variant="gradient" disabled={lockedInfo.locked}>Next step</Button>}
                <Button onClick={handleSubmit} variant="filled" color="red" disabled={lockedInfo.locked}>Submit</Button>
            </div>
        </Group>
    </div>
    )


    return (
        <div className="p-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">Update Incidents</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/incidents">
                            <Text variant="gradient">Incidents Management</Text>
                        </Link>
                        <Text variant="gradient">Update Incidents</Text>
                    </Breadcrumbs>
                </div>
            </div>
            {lockedInfo.locked && (
                <Alert color={lockedInfo.status === 'CLOSED' ? 'green' : 'red'} variant="light" className="mb-4 border">
                    <Text fw={600}>
                        {lockedInfo.status === 'CLOSED' ? 'This incident is closed. Modifications are not allowed.' : 'This incident is rejected. Modifications are not allowed.'}
                    </Text>
                </Alert>
            )}
            <div className="flex flex-col gap-5    [&_.mantine-Stepper-steps]:gap-5">
                <Stepper active={active} onStepClick={(s) => { if (!lockedInfo.locked) setActive(s as number); }}>
                    <Stepper.Step label="Step 1" description="Incident Details">
                        <div className="grid grid-cols-3 gap-5">
                            <div className="col-span-2 space-y-5">
                                <IncidentDetails
                                    form={form}
                                    weatherConditions={weatherConditions}
                                    locations={locations}
                                    categories={categories}
                                    incidentTypes={incidentTypes}
                                    severityLevels={severityLevels}
                                    severityLevelMap={severityLevelMap}
                                    bodyParts={bodyParts}
                                    workAreas={workAreas}
                                    workProcesses={workProcesses}
                                    departments={departments}
                                /> {footer()}
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
                        <div className="grid grid-cols-3 gap-5">
                            <div className="col-span-2 space-y-5">
                                <IncidentAnalysis form={form} employees={emps} /> {footer()}
                            </div>
                            <ReportHelp activeStep={active} />
                        </div>
                    </Stepper.Step>
                    <Stepper.Step label="Step 4" description="Risk Assessment">
                        <div className="grid grid-cols-3 gap-5">
                            <div className="col-span-2 space-y-5">
                                <IncidentRisk form={form} employees={emps} /> {footer()}
                            </div>
                            <ReportHelp activeStep={active} />
                        </div>
                    </Stepper.Step>
                </Stepper>

            </div>
        </div>
    )
}

export default UpdateIncidents
