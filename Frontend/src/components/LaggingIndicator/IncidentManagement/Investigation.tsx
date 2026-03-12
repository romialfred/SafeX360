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
            errorNotification(lockedInfo.status === 'CLOSED' ? 'This incident is closed. Investigation is not allowed.' : 'This incident is rejected. Investigation is not allowed.');
            return;
        }
        form.validate();
        if (form.isValid()) {
            setErrorMessage(null);
            setActive((current) => (current < 3 ? current + 1 : current));
        }
        else {
            setErrorMessage("Please fill all required fields correctly.");
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
            method: (value) => (value ? null : "Investigation method is required"),
            startDate: (value) => (value ? null : "Investigation start date is required"),

            humanCauses: (value) => (value.length > 0 || active < 1 ? null : "At least one human cause is required"),
            taskCauses: (value) => (value.length > 0 || active < 1 ? null : "At least one task cause is required"),
            workingCauses: (value) => (value.length > 0 || active < 1 ? null : "At least one working cause is required"),
            organizationCauses: (value) => (value.length > 0 || active < 1 ? null : "At least one organizational cause is required"),
            taskAnalysis: (value) => (isValidRichText(value) || active < 1 ? null : "Task analysis is required"),
            workingAnalysis: (value) => (isValidRichText(value) || active < 1 ? null : "Working analysis is required"),
            humanAnalysis: (value) => (isValidRichText(value) || active < 1 ? null : "Human analysis is required"),
            organizationAnalysis: (value) => (isValidRichText(value) || active < 1 ? null : "Organizational analysis is required"),
            report: (value) => (isValidRichText(value) || active < 3 ? null : "Investigation report is required"),
            correctiveActions: {
                actionName: (value) => value.trim()?.length > 0 || active < 2 ? null : "Action name is required",
                deadline: (value) => value || active < 2 ? null : "Deadline is required",

                status: (value) => value || active < 2 ? null : "Status is required",
                description: (value) => isValidRichText(value) || active < 2 ? null : "Description is required"
            },
            team: (value: TeamMember[]) => {
                if (!value || value.length === 0) {
                    return "At least one team member is required";
                }
                for (let i = 0; i < value.length; i++) {
                    if (!value[i].role || value[i]?.role?.trim() === "") {
                        return `Role is required for team member `;
                    }
                }
                return null;
            },
        }
    })

    const handleSubmit = async () => {
        if (lockedInfo.locked) {
            errorNotification(lockedInfo.status === 'CLOSED' ? 'This incident is closed. Investigation is not allowed.' : 'This incident is rejected. Investigation is not allowed.');
            return;
        }
        form.validate();
        if (form.isValid()) {
            setErrorMessage(null);
            const evidence = await convertFilesToBase64New(form.values.evidence);
            const data = {
                investigation: { ...investigation, ...form.values, evidence: evidence, incidentId: id, correctiveActions: undefined },
                correctiveActions: form.values.correctiveActions.map(x => ({ ...x, departmentId: x.assignedEmployeeId ? empMap[x.assignedEmployeeId]?.departmentId : user.departmentId, ownerId: x.assignedEmployeeId ?? user.id, assignedEmployeeId: x.assignedEmployeeId ?? user.id }))
            };
            dispatch(showOverlay());
            if (investigation) {
                updateInvestigation(data).then((_res: any) => {
                    successNotification("Investigation Updated Successfully");
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
                    successNotification("Investigation Reported Successfully");
                    form.reset();
                    navigate("/incidents")
                }).catch((err: any) => {
                    errorNotification(err.response?.data?.errorMessage);
                }).finally(() => {
                    dispatch(hideOverlay());
                });

            }
        } else {
            setErrorMessage("Please fill all required fields correctly.");
        }

    }




    return (
        <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">Incident Investigation</div>
                    <Breadcrumbs my="xs" >
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/incidents">
                            <Text variant="gradient">Incidents Management</Text>
                        </Link>
                        <Text variant="gradient">Incident Investigation</Text>
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
                        <h2 className="text-xl font-bold text-red-800 ">{incident.title}</h2>
                        <span className="bg-red-200 rounded-md text-sm p-1 text-red-600">
                            {incident.number}
                        </span>

                    </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <p className="text-sm  text-red-700">{formatDateWithDay(incident.incidentDate)}</p>
                    <p className="text-sm text-red-700">
                        Reported by: <span className="font-medium">
                            {empMap[incident.reporterId] ? empMap[incident.reporterId]?.name : "Unknown"}</span>
                    </p>
                </div>

            </div>

            {lockedInfo.locked && (
                <Alert color={lockedInfo.status === 'CLOSED' ? 'green' : 'red'} variant="light" className="border">
                    <Text fw={600}>
                        {lockedInfo.status === 'CLOSED' ? 'This incident is closed. Investigation is not allowed.' : 'This incident is rejected. Investigation is not allowed.'}
                    </Text>
                </Alert>
            )}

            <div className="flex flex-col gap-5   [&_.mantine-Stepper-steps]:p-5  [&_.mantine-Stepper-steps]:gap-5">
                <Stepper active={active} onStepClick={(s) => { if (!lockedInfo.locked) setActive(s); }}>
                    <Stepper.Step label="Step 1" description="Investigation Details">
                        <InvestigationDetails incident={incident} form={form} employees={emps} />
                    </Stepper.Step>

                    <Stepper.Step label="Step 2" description="Investigation Analysis">
                        <InvestigationAnalysis form={form} />
                    </Stepper.Step>
                    <Stepper.Step label="Step 3" description="Action Plans">
                        <InvestigationPlan incident={incident} form={form} />
                    </Stepper.Step>
                    <Stepper.Step label="Step 4" description="Report & Submit">
                        <InvestigationReport form={form} />
                    </Stepper.Step>

                </Stepper>
                {errorMessage && <Text color="red" mx="auto" size="nd" mt="md">{errorMessage}</Text>}
                <Group justify="center" >
                    <Button variant="default" onClick={prevStep}>Back</Button>
                    {(active < 3) ? <Button onClick={nextStep} variant="gradient" disabled={lockedInfo.locked}>Next step</Button> : <Button onClick={handleSubmit} variant="gradient" disabled={lockedInfo.locked}>Submit</Button>}
                </Group>
            </div>
        </div>
    )
}

export default Investigation
