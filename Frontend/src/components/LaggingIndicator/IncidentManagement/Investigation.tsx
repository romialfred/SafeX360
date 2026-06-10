import { Alert, Breadcrumbs, Button, Group, Stepper, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconExclamationCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import InvestigationDetails from "./InvestigationReport/InvestigationDetails";
import InvestigationAnalysis from "./InvestigationReport/InvestigationAnalysis";
import InvestigationPlan from "./InvestigationReport/InvestigationPlan";
import InvestigationReport from "./InvestigationReport/InvestigationReport";
import { getIncidentDetails } from "../../../services/IncidentService";
import { formatDateWithDay } from "../../../utility/DateFormats";
import { getEmployeesWithDepartment } from "../../../services/EmployeeService";
import { isValidRichText, mapIdToName } from "../../../utility/OtherUtilities";
import { getInvestigationByIncidentId, reportInvestigation, updateInvestigation } from "../../../services/InvestigationService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { useDispatch, useSelector } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { base64ToFileWithNameNew, convertFilesToBase64New } from "../../../utility/DocumentUtility";
import { getCorrectiveActionByIncidentId } from "../../../services/CorrectiveActionService";


type ActionPlan = {
    actionName: '',
    deadline: '',
    assignedEmployeeId: "",
    status: "",
    description: ""
}
type TeamMember = {
    id: number;
    name: string;
    empNumber: string;
    pos: "Source" | "Target";
    role?: string;
}

const Investigation = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [active, setActive] = useState(0);
    const navigate = useNavigate();
    const [incident, setIncident] = useState<any>({});
    const [lockedInfo, setLockedInfo] = useState<{ locked: boolean; status: string }>({ locked: false, status: '' });
    const [emps, setEmps] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<number, any>>({});
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [investigation, setInvestigation] = useState<any>(null);
    const [actions, setActions] = useState<any>(undefined);
    const user = useSelector((state: any) => state.user)

    useEffect(() => {
        dispatch(showOverlay());
        getIncidentDetails(id).then((res: any) => {
            setIncident(res);
            const statusUpper = String(res?.status || '').toUpperCase();
            if (['CLOSED', 'REJECTED'].includes(statusUpper)) {
                setLockedInfo({ locked: true, status: statusUpper });
            }
        }).catch((_err: any) => {
        });
        getEmployeesWithDepartment().then((res: any) => {
            setEmps(res);
            setEmpMap(mapIdToName(res));
        }).catch((_err: any) => { });
        getInvestigationByIncidentId(id).then((res: any) => {
            setInvestigation(res);


        }).catch((_err: any) => {
        }).finally(() => {
            dispatch(hideOverlay());
        });
        getCorrectiveActionByIncidentId(id).then((res: any) => {
            setActions(res);
        }).catch((_err: any) => {
        });
    }, [])

    useEffect(() => {
        if (!investigation || !actions) return;
        const evidenceFiles = investigation?.evidence.map((x: any) => {
            const mimeType = x?.type?.split(',')[0]?.split(':')[1]; // Extract MIME type
            const file = base64ToFileWithNameNew(x.file, x.name, mimeType);
            return {
                id: x.id,
                file
            };
        });
        form.setValues({ ...form.values, ...investigation, startDate: new Date(investigation.startDate), endDate: investigation.endDate ? new Date(investigation.endDate) : undefined, evidence: evidenceFiles, correctiveActions: actions.map((x: any) => ({ ...x, deadline: new Date(x.deadline), assignedEmployeeId: "" + x.assignedEmployeeId })) });

    }, [actions, investigation])


    const nextStep = () => {
        if (lockedInfo.locked) {
            errorNotification(lockedInfo.status === 'CLOSED' ? 'Cet incident est clôturé. L\'investigation n\'est plus autorisée.' : 'Cet incident est rejeté. L\'investigation n\'est pas autorisée.');
            return;
        }
        form.validate();
        if (form.isValid()) {
            setErrorMessage(null);
            setActive((current) => (current < 3 ? current + 1 : current));
        }
        else {
            setErrorMessage("Veuillez remplir correctement tous les champs obligatoires.");
            return;
        }
    }

    const form = useForm({
        initialValues: {

            method: "ICAM",

            startDate: new Date(),
            endDate: undefined,
            team: [] as TeamMember[],
            humanCauses: [],
            humanAnalysis: "",
            taskCauses: [],
            taskAnalysis: "",
            workingCauses: [],
            workingAnalysis: "",
            organizationCauses: [],
            organizationAnalysis: "",
            evidence: [],
            correctiveActions: [] as ActionPlan[],
            report: "",
            incidentId: id

        },
        validate: {
            method: (value) => (value ? null : "La méthode d'investigation est requise"),
            startDate: (value) => (value ? null : "La date de début de l'investigation est requise"),

            humanCauses: (value) => (value.length > 0 || active < 1 ? null : "Au moins une cause humaine est requise"),
            taskCauses: (value) => (value.length > 0 || active < 1 ? null : "Au moins une cause liée à la tâche est requise"),
            workingCauses: (value) => (value.length > 0 || active < 1 ? null : "Au moins une cause liée aux conditions de travail est requise"),
            organizationCauses: (value) => (value.length > 0 || active < 1 ? null : "Au moins une cause organisationnelle est requise"),
            taskAnalysis: (value) => (isValidRichText(value) || active < 1 ? null : "L'analyse des tâches est requise"),
            workingAnalysis: (value) => (isValidRichText(value) || active < 1 ? null : "L'analyse des conditions de travail est requise"),
            humanAnalysis: (value) => (isValidRichText(value) || active < 1 ? null : "L'analyse des actions humaines est requise"),
            organizationAnalysis: (value) => (isValidRichText(value) || active < 1 ? null : "L'analyse organisationnelle est requise"),
            report: (value) => (isValidRichText(value) || active < 3 ? null : "Le rapport d'investigation est requis"),
            correctiveActions: {
                actionName: (value) => value.trim()?.length > 0 || active < 2 ? null : "L'intitulé de l'action est requis",
                deadline: (value) => value || active < 2 ? null : "L'échéance est requise",

                status: (value) => value || active < 2 ? null : "Le statut est requis",
                description: (value) => isValidRichText(value) || active < 2 ? null : "La description est requise"
            },
            team: (value: TeamMember[]) => {
                if (!value || value.length === 0) {
                    return "Au moins un membre d'équipe est requis";
                }
                for (let i = 0; i < value.length; i++) {
                    if (!value[i].role || value[i]?.role?.trim() === "") {
                        return `Un rôle est requis pour chaque membre de l'équipe`;
                    }
                }
                return null;
            },
        }
    })

    const handleSubmit = async () => {
        if (lockedInfo.locked) {
            errorNotification(lockedInfo.status === 'CLOSED' ? 'Cet incident est clôturé. L\'investigation n\'est plus autorisée.' : 'Cet incident est rejeté. L\'investigation n\'est pas autorisée.');
            return;
        }
        form.validate();
        if (form.isValid()) {
            setErrorMessage(null);
            const evidence = await convertFilesToBase64New(form.values.evidence);
            const data = {
                investigation: { ...investigation, ...form.values, evidence: evidence, incidentId: id, correctiveActions: undefined },
                correctiveActions: form.values.correctiveActions.map(x => ({ ...x, departmentId: x.assignedEmployeeId ? empMap[x.assignedEmployeeId]?.departmentId : user.departmentId, ownerId: (x.assignedEmployeeId || user.id), assignedEmployeeId: (x.assignedEmployeeId || user.id) }))
            };
            dispatch(showOverlay());
            if (investigation) {
                updateInvestigation(data).then((_res: any) => {
                    successNotification("Investigation mise à jour avec succès");
                    form.reset();
                    navigate("/incidents")
                }).catch((err: any) => {
                    errorNotification(err.response?.data?.errorMessage);
                }).finally(() => {
                    dispatch(hideOverlay());
                });

            }
            else {
                reportInvestigation(data).then((_res: any) => {
                    successNotification("Investigation enregistrée avec succès");
                    form.reset();
                    navigate("/incidents")
                }).catch((err: any) => {
                    errorNotification(err.response?.data?.errorMessage);
                }).finally(() => {
                    dispatch(hideOverlay());
                });

            }
        } else {
            setErrorMessage("Veuillez remplir correctement tous les champs obligatoires.");
        }

    }




    return (
        <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl text-blue-500 w-fit">Investigation d'incident</div>
                    <Breadcrumbs my="xs" >
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Accueil</Text>
                        </Link>
                        <Link className="hover:!underline" to="/incidents">
                            <Text variant="gradient">Gestion des incidents</Text>
                        </Link>
                        <Text variant="gradient">Investigation d'incident</Text>
                    </Breadcrumbs>
                </div>
            </div>
            {/* <p className=' italic my-3'>Proactive workplace walkthroughs ensuring safety compliance, engagement, and continuous improvement</p> */}
            <div className="  shadow-md rounded-lg bg-red-100 border-red-400 border-1 p-3 flex justify-between items-center">

                <div className="flex items-center gap-3">
                    <div className="bg-red-100 rounded-3xl p-1">
                        <IconExclamationCircle className="text-red-600 " size={50} />
                    </div>

                    <div>
                        <h2 className="text-lg text-red-800 ">{incident.title}</h2>
                        <span className="bg-red-200 rounded-md text-sm p-1 text-red-600">
                            {incident.number}
                        </span>

                    </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <p className="text-sm  text-red-700">{formatDateWithDay(incident.incidentDate)}</p>
                    <p className="text-sm text-red-700">
                        Déclaré par : <span className="font-medium">
                            {empMap[incident.reporterId] ? empMap[incident.reporterId]?.name : "—"}</span>
                    </p>
                </div>

            </div>

            {lockedInfo.locked && (
                <Alert color={lockedInfo.status === 'CLOSED' ? 'green' : 'red'} variant="light" className="border">
                    <Text>
                        {lockedInfo.status === 'CLOSED' ? 'Cet incident est clôturé. L\'investigation n\'est plus autorisée.' : 'Cet incident est rejeté. L\'investigation n\'est pas autorisée.'}
                    </Text>
                </Alert>
            )}

            <div className="flex flex-col gap-5   [&_.mantine-Stepper-steps]:p-5  [&_.mantine-Stepper-steps]:gap-5">
                <Stepper active={active} onStepClick={(s) => { if (!lockedInfo.locked) setActive(s); }}>
                    <Stepper.Step label="Étape 1" description="Détails de l'investigation">
                        <InvestigationDetails incident={incident} form={form} employees={emps} />
                    </Stepper.Step>

                    <Stepper.Step label="Étape 2" description="Analyse des causes">
                        <InvestigationAnalysis form={form} />
                    </Stepper.Step>
                    <Stepper.Step label="Étape 3" description="Plan d'actions">
                        <InvestigationPlan incident={incident} form={form} />
                    </Stepper.Step>
                    <Stepper.Step label="Étape 4" description="Rapport et soumission">
                        <InvestigationReport form={form} />
                    </Stepper.Step>

                </Stepper>
                {errorMessage && <Text c="red" mx="auto" size="sm" mt="md">{errorMessage}</Text>}
                <Group justify="center" >
                    <Button variant="default" onClick={prevStep}>Précédent</Button>
                    {(active < 3) ? <Button onClick={nextStep} variant="gradient" disabled={lockedInfo.locked}>Suivant</Button> : <Button onClick={handleSubmit} variant="gradient" disabled={lockedInfo.locked}>Soumettre</Button>}
                </Group>
            </div>
        </div>
    )
}

export default Investigation
