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
            errorNotification(lockedInfo.status === 'CLOSED' ? 'Cet incident est clôturé. Les modifications ne sont plus autorisées.' : 'Cet incident est rejeté. Les modifications ne sont pas autorisées.');
            return;
        }
        form.validate();
        if (form.values.incidentDetails.length === 0) {
            setErrorMessage("Au moins une classification d'incident est requise");
            return;
        } else {
            setErrorMessage(null);
        }
        if (form.isValid())
            setActive((current) => (current < 3 ? current + 1 : current));
        else {
            setErrorMessage("Veuillez remplir correctement tous les champs obligatoires.");
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
            title: (value) => value.trim()?.length > 0 ? null : "Le titre est requis",
            locationId: (value) => value ? null : "Le lieu est requis",
            weatherConditions: (value) => value.length > 0 ? null : "Les conditions environnementales sont requises",
            occurredAt: (value) => value ? null : "La date et l'heure de survenance sont requises",
            discoveryTime: (value) => value ? null : "La date et l'heure de découverte sont requises",
            incidentDetails: {
                incidentCategoryId: (value) => value ? null : "La catégorie d'incident est requise",
                incidentTypeId: (value) => value ? null : "Le type d'incident est requis",
                severityLevelId: (value) => value ? null : "Le niveau de gravité est requis",
            },
            department: (value) => value ? null : "Le département est requis",
            workAreaId: (value) => value ? null : "La zone de travail est requise",
            workProcessId: (value) => value ? null : "Le processus de travail est requis",
            reporterId: (value) => value || active == 0 ? null : "Le déclarant est requis",
            factualDescription: (value) => isValidRichText(value) || active < 2 ? null : "La description factuelle est requise",
            immediateCauses: (value) => isValidRichText(value) || active < 2 ? null : "Les causes immédiates sont requises",
            rootCauses: (value) => isValidRichText(value) || active < 2 ? null : "Les causes profondes sont requises",
            contributingFactors: (value) => isValidRichText(value) || active < 2 ? null : "Les facteurs contributifs sont requis",
            immediateConsequences: (value) => isValidRichText(value) || active < 2 ? null : "Les conséquences immédiates sont requises",
            potentialConsequences: (value) => isValidRichText(value) || active < 2 ? null : "Les conséquences potentielles sont requises",
            immediateActions: (value) => isValidRichText(value) || active < 2 ? null : "Les actions immédiates sont requises",
            probability: (value) => value ? null : "La probabilité est requise",
            severity: (value) => value ? null : "La gravité est requise",
            existingControlMeasures: (value) => isValidRichText(value) || active < 3 ? null : "Les mesures de maîtrise existantes sont requises",
            residualRiskAssessment: (value) => isValidRichText(value) || active < 3 ? null : "L'évaluation du risque résiduel est requise",

        }
    })


    useEffect(() => {
        if (!id) return;
        dispatch(showOverlay());
        getIncidentById(Number(id)).then((res: any) => {

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
            errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
        }).finally(() => {
            dispatch(hideOverlay());
        })
    }, [id])

    useEffect(() => {
        getEmployeesWithDepartment().then((res: any) => {
            setEmps(res);
        }).catch(() => { errorNotification("Impossible de charger les employés"); });
        getAllActiveIncidentCategories().then((res: any) => {
            setCategories(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }).catch(() => { errorNotification("Impossible de charger les catégories"); });
        getAllActiveIncidentType().then((res: any) => {
            setIncidentTypes(res.map((item: any) => ({ label: item.name, value: "" + item.id, category: "" + item.incidentCategoryId, severityLevel: "" + item.severityLevelId })));
        }).catch(() => { errorNotification("Impossible de charger les types d'incident"); });
        getAllActiveLocations().then((res: any) => {
            setLocations(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }).catch(() => { errorNotification("Impossible de charger les lieux"); });
        getAllActiveSeverityLevel().then((res: any) => {
            setSeverityLevelMap(mapIdToName(res))
            setSeverityLevels(res.map((item: any) => ({ label: item.name, value: "" + item.id, severityLevel: item.level })));
        }).catch(() => { errorNotification("Impossible de charger les niveaux de gravité"); });
        getAllActiveWeatherConditions().then((res: any) => {
            setWeatherConditions(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }).catch(() => { errorNotification("Impossible de charger les conditions météo"); });
        GetAllBodyParts({}).then((res: any) => {
            setBodyParts(res.map((item: any) => ({ ...item, label: item.name, value: "" + item.id })));
        }).catch(() => { errorNotification("Impossible de charger les parties du corps"); });
        getAllActiveWorkArea().then((res: any) => {
            setWorkAreas(res.map((item: any) => ({ label: item.name, value: "" + item.id, departmentId: "" + item.departmentId })));
        }).catch(() => { errorNotification("Impossible de charger les zones de travail"); });
        getAllActiveWorkProcess().then((res: any) => {
            setWorkProcesses(res.map((item: any) => ({ label: item.name, value: "" + item.id, departmentId: "" + item.departmentId })));
        }).catch(() => { errorNotification("Impossible de charger les processus de travail"); });
        getAllDepartments().then((res: any) => {
            setDepartments(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }).catch(() => { errorNotification("Impossible de charger les départements"); });
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
            errorNotification(lockedInfo.status === 'CLOSED' ? 'Cet incident est clôturé. Les modifications ne sont plus autorisées.' : 'Cet incident est rejeté. Les modifications ne sont pas autorisées.');
            return;
        }
        const values = form.values;
        const evidence = await convertFilesToBase64New(values.evidence);
        dispatch(showOverlay());
        const deptId = emps.find((emp: any) => emp.id == values.reporterId)?.departmentId;
        updateIncident({ ...values, departmentId: deptId, evidence: evidence, involvedPersons: values.involvedPersons?.map((x: any) => x.id), witnesses: values.witnesses?.map((x: any) => x.id) }).then((_res: any) => {
            successNotification("Incident mis à jour avec succès");
            navigate("/incidents");
        }
        ).catch((err: any) => {
            errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
        }
        ).finally(() => {
            dispatch(hideOverlay());
        })

    }

    const footer = () => (<div className="w-full">
        {errorMessage && <Text c="red" mx="auto" ta="center" mt="md">{errorMessage}</Text>}
        <Group justify="space-between" >
            <Button variant="default" onClick={prevStep}>Précédent</Button>
            <div className="flex items-center gap-2">

                {(active < 3) && <Button onClick={nextStep} variant="gradient" disabled={lockedInfo.locked}>Suivant</Button>}
                <Button onClick={handleSubmit} variant="filled" color="red" disabled={lockedInfo.locked}>Enregistrer</Button>
            </div>
        </Group>
    </div>
    )


    return (
        <div className="p-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl text-blue-500 w-fit">Modifier l'incident</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Accueil</Text>
                        </Link>
                        <Link className="hover:!underline" to="/incidents">
                            <Text variant="gradient">Gestion des incidents</Text>
                        </Link>
                        <Text variant="gradient">Modifier l'incident</Text>
                    </Breadcrumbs>
                </div>
            </div>
            {lockedInfo.locked && (
                <Alert color={lockedInfo.status === 'CLOSED' ? 'green' : 'red'} variant="light" className="mb-4 border">
                    <Text>
                        {lockedInfo.status === 'CLOSED' ? 'Cet incident est clôturé. Les modifications ne sont plus autorisées.' : 'Cet incident est rejeté. Les modifications ne sont pas autorisées.'}
                    </Text>
                </Alert>
            )}
            <div className="flex flex-col gap-5    [&_.mantine-Stepper-steps]:gap-5">
                <Stepper active={active} onStepClick={(s) => { if (!lockedInfo.locked) setActive(s as number); }}>
                    <Stepper.Step label="Étape 1" description="Détails de l'incident">
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
                    <Stepper.Step label="Étape 2" description="Témoins et personnes impliquées">
                        <div className="grid grid-cols-3 gap-5">
                            <div className="col-span-2 space-y-5">
                                <WitnessesSection form={form} employees={emps} />
                                {footer()}
                            </div>
                            <ReportHelp activeStep={active} />
                        </div>
                    </Stepper.Step>
                    <Stepper.Step label="Étape 3" description="Analyse de l'incident">
                        <div className="grid grid-cols-3 gap-5">
                            <div className="col-span-2 space-y-5">
                                <IncidentAnalysis form={form} employees={emps} /> {footer()}
                            </div>
                            <ReportHelp activeStep={active} />
                        </div>
                    </Stepper.Step>
                    <Stepper.Step label="Étape 4" description="Évaluation du risque">
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
