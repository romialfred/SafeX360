import { Alert, Breadcrumbs, Button, Group, Stepper, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconExclamationCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation('incidents');
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
            errorNotification(lockedInfo.status === 'CLOSED' ? t('investigation.lockedClosed') : t('investigation.lockedRejected'));
            return;
        }
        form.validate();
        if (form.isValid()) {
            setErrorMessage(null);
            setActive((current) => (current < 3 ? current + 1 : current));
        }
        else {
            setErrorMessage(t('investigation.fillRequired'));
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
            method: (value) => (value ? null : t('investigation.validation.methodRequired')),
            startDate: (value) => (value ? null : t('investigation.validation.startDateRequired')),

            // Chaque catégorie ICAM est satisfaite par une cause cochée OU une analyse rédigée
            // (les outils guidés — 5 Pourquoi, Ishikawa, Arbre — alimentent l'analyse).
            humanCauses: (value, values: any) => (value.length > 0 || isValidRichText(values.humanAnalysis) || active < 1 ? null : t('investigation.validation.humanCauseRequired')),
            taskCauses: (value, values: any) => (value.length > 0 || isValidRichText(values.taskAnalysis) || active < 1 ? null : t('investigation.validation.taskCauseRequired')),
            workingCauses: (value, values: any) => (value.length > 0 || isValidRichText(values.workingAnalysis) || active < 1 ? null : t('investigation.validation.workingCauseRequired')),
            organizationCauses: (value, values: any) => (value.length > 0 || isValidRichText(values.organizationAnalysis) || active < 1 ? null : t('investigation.validation.organizationCauseRequired')),
            taskAnalysis: (value, values: any) => (isValidRichText(value) || values.taskCauses.length > 0 || active < 1 ? null : t('investigation.validation.taskAnalysisRequired')),
            workingAnalysis: (value, values: any) => (isValidRichText(value) || values.workingCauses.length > 0 || active < 1 ? null : t('investigation.validation.workingAnalysisRequired')),
            humanAnalysis: (value, values: any) => (isValidRichText(value) || values.humanCauses.length > 0 || active < 1 ? null : t('investigation.validation.humanAnalysisRequired')),
            organizationAnalysis: (value, values: any) => (isValidRichText(value) || values.organizationCauses.length > 0 || active < 1 ? null : t('investigation.validation.organizationAnalysisRequired')),
            report: (value) => (isValidRichText(value) || active < 3 ? null : t('investigation.validation.reportRequired')),
            correctiveActions: {
                actionName: (value) => value.trim()?.length > 0 || active < 2 ? null : t('investigation.validation.actionNameRequired'),
                deadline: (value) => value || active < 2 ? null : t('investigation.validation.deadlineRequired'),

                status: (value) => value || active < 2 ? null : t('investigation.validation.statusRequired'),
                description: (value) => isValidRichText(value) || active < 2 ? null : t('investigation.validation.descriptionRequired')
            },
            team: (value: TeamMember[]) => {
                if (!value || value.length === 0) {
                    return t('investigation.validation.teamRequired');
                }
                for (let i = 0; i < value.length; i++) {
                    if (!value[i].role || value[i]?.role?.trim() === "") {
                        return t('investigation.validation.roleRequired');
                    }
                }
                return null;
            },
        }
    })

    const handleSubmit = async () => {
        if (lockedInfo.locked) {
            errorNotification(lockedInfo.status === 'CLOSED' ? t('investigation.lockedClosed') : t('investigation.lockedRejected'));
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
                    successNotification(t('investigation.updateSuccess'));
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
                    successNotification(t('investigation.createSuccess'));
                    form.reset();
                    navigate("/incidents")
                }).catch((err: any) => {
                    errorNotification(err.response?.data?.errorMessage);
                }).finally(() => {
                    dispatch(hideOverlay());
                });

            }
        } else {
            setErrorMessage(t('investigation.fillRequired'));
        }

    }




    return (
        <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-slate-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '22px', fontWeight: 600 }}>{t('investigation.title')}</h1>
                    <Breadcrumbs my="xs" className="!text-xs">
                        <Link className="hover:!underline" to="/"><Text size="xs" c="dimmed">{t('investigation.breadcrumbHome')}</Text></Link>
                        <Link className="hover:!underline" to="/incidents"><Text size="xs" c="dimmed">{t('investigation.breadcrumbManagement')}</Text></Link>
                        <Text size="xs" c="teal">{t('investigation.title')}</Text>
                    </Breadcrumbs>
                </div>
            </div>
            {/* <p className=' italic my-3'>Proactive workplace walkthroughs ensuring safety compliance, engagement, and continuous improvement</p> */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-red-100 p-2 text-red-600"><IconExclamationCircle size={26} /></span>
                    <div>
                        <h2 className="text-[15px] text-red-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>{incident.title}</h2>
                        <span className="font-mono text-xs text-red-700">{incident.number}</span>
                    </div>
                </div>
                <div className="text-right text-sm text-red-700">
                    <p>{formatDateWithDay(incident.incidentDate)}</p>
                    <p>{t('investigation.reportedBy')} <span className="font-medium">{empMap[incident.reporterId]?.name ?? "—"}</span></p>
                </div>
            </div>

            {lockedInfo.locked && (
                <Alert color={lockedInfo.status === 'CLOSED' ? 'green' : 'red'} variant="light" className="border">
                    <Text>
                        {lockedInfo.status === 'CLOSED' ? t('investigation.lockedClosed') : t('investigation.lockedRejected')}
                    </Text>
                </Alert>
            )}

            <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] [&_.mantine-Stepper-steps]:gap-4 [&_.mantine-Stepper-separator]:!mx-2">
                <Stepper active={active} onStepClick={(s) => { if (!lockedInfo.locked) setActive(s); }} color="teal" size="sm" iconSize={32}>
                    <Stepper.Step label={t('investigation.step1Label')} description={t('investigation.step1Desc')}>
                        <InvestigationDetails incident={incident} form={form} employees={emps} />
                    </Stepper.Step>

                    <Stepper.Step label={t('investigation.step2Label')} description={t('investigation.step2Desc')}>
                        <InvestigationAnalysis form={form} />
                    </Stepper.Step>
                    <Stepper.Step label={t('investigation.step3Label')} description={t('investigation.step3Desc')}>
                        <InvestigationPlan incident={incident} form={form} />
                    </Stepper.Step>
                    <Stepper.Step label={t('investigation.step4Label')} description={t('investigation.step4Desc')}>
                        <InvestigationReport form={form} />
                    </Stepper.Step>

                </Stepper>
                {errorMessage && <Text c="red" mx="auto" size="sm" mt="md">{errorMessage}</Text>}
                <Group justify="center" >
                    <Button variant="default" onClick={prevStep}>{t('investigation.previous')}</Button>
                    {(active < 3) ? <Button onClick={nextStep} variant="gradient" disabled={lockedInfo.locked}>{t('investigation.next')}</Button> : <Button onClick={handleSubmit} variant="gradient" disabled={lockedInfo.locked}>{t('investigation.submit')}</Button>}
                </Group>
            </div>
        </div>
    )
}

export default Investigation
