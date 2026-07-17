import { Breadcrumbs, Button, Group, Progress, Stepper, Text, Anchor, Tooltip } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
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
import { IconAlertOctagon, IconArrowLeft, IconArrowRight, IconCheck, IconClipboardList, IconUsers, IconChartDots3, IconActivity, IconChevronLeft, IconBolt, IconInfoCircle, IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpand, IconClock, IconHash } from "@tabler/icons-react";
import IncidentAnalysis from "./IncidentAnalysis";
import IncidentRisk from "./IncidentRisk";
import { getAllActiveWorkArea } from "../../../../services/WorkAreaService";
import { getAllActiveWorkProcess } from "../../../../services/WorkProcessService";
import { getAllDepartments } from "../../../../services/HrmsService";
import ReportHelp from "./ReportHelp";
import { toIsoDateTimeLocal } from "../incidentLabels";
import { notifyError } from "../../../../utility/notifyError";

// type ActionPlan = {
//     actionName: '',
//     deadline: '',
//     assignedEmployeeId: "",
//     status: "",
//     description: ""
// }
// Formatte une durée en secondes au format HH:MM:SS pour le chrono
const formatElapsed = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

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

    // Chrono : durée passée sur le formulaire (en secondes)
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Volet d'aide latéral : visible/masqué pour agrandir le formulaire
    const [helpPanelVisible, setHelpPanelVisible] = useState(true);


    const nextStep = () => {
        form.validate();
        if (form.values.incidentDetails.length === 0) {
            setErrorMessage("Au moins un détail d'incident est requis");
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
            // `number` et `status` ne sont PAS des champs de saisie : le numéro est
            // attribué par le serveur à l'enregistrement (generateIncidentNumber) et
            // le statut initial est imposé (PENDING). Les porter dans le formulaire
            // laissait croire à une saisie que le serveur écrasait.
            title: '',
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
        getEmployeesWithDepartment().then((res: any) => {
            setEmps(res);
        }).catch(() => { errorNotification("Impossible de charger les employés"); });

        getAllActiveIncidentCategories().then((res: any) => {
            setCategories(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }).catch(() => { errorNotification("Impossible de charger les catégories d'incident"); });
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
            setErrorMessage("Veuillez remplir correctement tous les champs obligatoires.");
            return;
        }
        const values = form.values;
        const evidence = await Promise.all(values.evidence?.map(convertFileToBase64DTO));
        // Département = celui SÉLECTIONNÉ (champ obligatoire) en priorité ; repli
        // sur le département du déclarant. Auparavant seul le déclarant comptait →
        // en déclaration rapide (sans déclarant) departmentId partait null.
        const reporterDeptId = emps.find((emp: any) => emp.id == values.reporterId)?.departmentId;
        const deptId = values.department ? Number(values.department) : reporterDeptId;
        dispatch(showOverlay());
        reportIncident({
            ...values,
            evidence: evidence,
            departmentId: deptId,
            // Dates sérialisées en fuseau LOCAL. Auparavant l'objet Date brut partait
            // dans le payload : axios lui applique toJSON() = toISOString() = UTC, donc
            // « 17/07 00h30 » (UTC+1) était stocké '2026-07-16T23:30' — incident daté
            // de la veille (ISO 45001 §9.1).
            occurredAt: toIsoDateTimeLocal(values.occurredAt),
            discoveryTime: toIsoDateTimeLocal(values.discoveryTime),
            involvedPersons: values.involvedPersons?.map((x: any) => x.id),
            witnesses: values.witnesses?.map((x: any) => x.id),
        }).then((_res: any) => {
            successNotification("Incident déclaré avec succès");
            navigate("/incidents");
        }
        ).catch((err: any) => {
            // notifyError traduit les codes métier (REFERENCE_DATA_MISSING…) qui
            // étaient jusqu'ici affichés bruts à l'utilisateur.
            notifyError(err, "Impossible d'enregistrer la déclaration");
        }
        ).finally(() => {
            dispatch(hideOverlay());
        })

    }


    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formattedDate = currentTime.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const formattedTime = currentTime.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    // Configuration des étapes — pour réutilisation dans la barre de progression et le wizard
    const stepsConfig = useMemo(() => [
        { num: 1, label: "Identification", description: "Détails de l'incident, lieu, contexte", icon: IconClipboardList },
        { num: 2, label: "Témoins & Impliqués", description: "Personnes concernées et témoins", icon: IconUsers },
        { num: 3, label: "Analyse", description: "Causes, conséquences, mesures immédiates", icon: IconActivity },
        { num: 4, label: "Évaluation Risque", description: "Probabilité, gravité, ALARP", icon: IconChartDots3 },
    ], []);

    const progressPct = ((active + 1) / stepsConfig.length) * 100;

    // Sticky footer with action buttons + progress
    // Refonte 2.a — mode "Déclaration rapide" disponible dès l'étape 1 (conforme ISO 45001 §10.2.1.a : signalement immédiat)
    const footer = () => (
        <div className="w-full sticky bottom-0 bg-white border-t border-slate-200 -mx-5 px-5 py-3 mt-6 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
            {errorMessage && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <IconAlertOctagon size={18} className="text-red-600 flex-shrink-0" />
                    <Text c="red" size="sm">{errorMessage}</Text>
                </div>
            )}
            <Group justify="space-between">
                <Button variant="default" size="sm" leftSection={<IconArrowLeft size={15} />} onClick={prevStep} disabled={active === 0}>
                    Précédent
                </Button>
                <div className="text-xs text-slate-500 hidden md:flex items-center gap-2">
                    <span className="text-slate-700">Étape {active + 1} / {stepsConfig.length}</span>
                    <span>·</span>
                    <span>{stepsConfig[active]?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Déclaration rapide : disponible dès l'étape 1, sauf à la dernière étape */}
                    {active < 3 && (
                        <Button onClick={handleSubmit} variant="light" color="orange" size="sm" leftSection={<IconBolt size={15} />} title="Soumettre maintenant — le coordinateur HSE complétera l'investigation plus tard">
                            Déclaration rapide
                        </Button>
                    )}
                    {active < 3 && (
                        <Button onClick={nextStep} variant="filled" color="teal" size="sm" rightSection={<IconArrowRight size={15} />}>
                            Suivant
                        </Button>
                    )}
                    {active === 3 && (
                        <Button onClick={handleSubmit} variant="filled" color="red" size="sm" leftSection={<IconCheck size={15} />}>
                            Soumettre l'investigation complète
                        </Button>
                    )}
                </div>
            </Group>
        </div>
    );

    return (
        <div className="p-5 flex flex-col gap-5 w-full">
            {/* Page header avec breadcrumb + N° auto + chrono + actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-3 border-b border-slate-200">
                <div className="flex-1 min-w-0">
                    <Breadcrumbs separator="›" className="!text-xs">
                        <Anchor component={Link} to="/" size="xs" c="dimmed">Accueil</Anchor>
                        <Anchor component={Link} to="/incidents" size="xs" c="dimmed">Gestion des Incidents</Anchor>
                        <Text size="xs" c="teal">Nouvelle déclaration</Text>
                    </Breadcrumbs>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                            <IconAlertOctagon className="text-red-600" size={22} stroke={2} />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl text-slate-900 tracking-tight leading-tight">Déclaration d'Incident HSE</h1>
                                {/* Le numéro est attribué par le SERVEUR à l'enregistrement.
                                    On affichait ici un numéro fabriqué côté navigateur, présenté
                                    comme définitif puis écrasé au submit : le déclarant notait un
                                    numéro qui n'a jamais existé et ne retrouvait plus son dossier.
                                    On annonce donc l'attribution, sans inventer de valeur. */}
                                <Tooltip label="Le numéro définitif est généré par le serveur au moment de l'enregistrement, puis affiché sur la fiche de l'incident." multiline w={280} withArrow>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                                        <IconHash size={13} className="text-slate-500" />
                                        <span className="text-xs text-slate-600">N° attribué à l'enregistrement</span>
                                    </div>
                                </Tooltip>
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">Formulaire conforme à <span className="text-slate-700">ISO 45001:2018</span> § 10.2, Investigation des incidents</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Chrono : temps passé sur le formulaire */}
                    <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200">
                        <IconClock size={13} className="text-teal-700" />
                        <span className="text-xs font-mono text-teal-800 tabular-nums">{formatElapsed(elapsedSeconds)}</span>
                    </div>
                    {/* Toggle volet d'aide */}
                    <Tooltip label={helpPanelVisible ? "Masquer le volet d'aide" : "Afficher le volet d'aide"}>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setHelpPanelVisible((v) => !v)}
                            leftSection={helpPanelVisible
                                ? <IconLayoutSidebarRightCollapse size={15} />
                                : <IconLayoutSidebarRightExpand size={15} />
                            }
                        >
                            {helpPanelVisible ? 'Masquer l\'aide' : 'Afficher l\'aide'}
                        </Button>
                    </Tooltip>
                    <Button variant="default" size="sm" leftSection={<IconChevronLeft size={15} />} onClick={() => navigate('/incidents')}>
                        Retour
                    </Button>
                </div>
            </div>

            {/* Status bar — référentiel, date, progression */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs uppercase tracking-wider text-slate-500">Brouillon en cours</span>
                        </div>
                        <div className="hidden md:block h-4 w-px bg-slate-300"></div>
                        <div className="text-xs text-slate-600">
                            <span className="text-slate-800">{formattedDate}</span> · {formattedTime}
                        </div>
                    </div>
                    <div className="flex-1 max-w-md">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-slate-500 uppercase tracking-wider">Progression</span>
                            <span className="text-[11px] text-teal-700">{Math.round(progressPct)} %</span>
                        </div>
                        <Progress value={progressPct} color="teal" size="sm" radius="xl" />
                    </div>
                </div>
            </div>

            {/* Mode rapide : bandeau information conforme ISO 45001 §10.2.1.a */}
            <div className="rounded-lg border border-orange-200 bg-orange-50/60 px-4 py-2.5 flex items-start gap-3">
                <IconInfoCircle size={18} className="text-orange-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-orange-900 leading-relaxed">
                    <span className="font-medium">Mode "Déclaration rapide" disponible :</span> seuls les champs de l'étape 1 sont obligatoires pour signaler immédiatement.
                    Les étapes <span className="font-medium">Témoins</span>, <span className="font-medium">Analyse</span> et <span className="font-medium">Évaluation risque</span> peuvent être complétées plus tard.
                </div>
            </div>

            {/* Wizard */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5">
                    <Stepper
                        active={active}
                        onStepClick={setActive}
                        size="sm"
                        color="teal"
                        iconSize={32}
                    >
                        {stepsConfig.map((step) => (
                            <Stepper.Step
                                key={step.num}
                                label={`Étape ${step.num}`}
                                description={step.label}
                                icon={<step.icon size={16} stroke={2} />}
                            />
                        ))}
                    </Stepper>
                </div>

                <div className="px-5 pb-5">
                    <div className={`grid grid-cols-1 gap-5 ${helpPanelVisible ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
                        <div className={helpPanelVisible ? 'lg:col-span-2 space-y-5' : 'lg:col-span-1 space-y-5'}>
                            {active === 0 && (
                                <IncidentDetails form={form} weatherConditions={weatherConditions} locations={locations} categories={categories} incidentTypes={incidentTypes} severityLevels={severityLevels} bodyParts={bodyParts} severityLevelMap={severityLevelMap} workAreas={workAreas} workProcesses={workProcesses} departments={departments} />
                            )}
                            {active === 1 && <WitnessesSection form={form} employees={emps} />}
                            {active === 2 && <IncidentAnalysis form={form} employees={emps} />}
                            {active === 3 && <IncidentRisk form={form} employees={emps} />}
                            {footer()}
                        </div>
                        {helpPanelVisible && (
                            <div className="lg:col-span-1">
                                <ReportHelp activeStep={active} onClose={() => setHelpPanelVisible(false)} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bouton flottant pour ré-ouvrir le volet d'aide quand il est fermé */}
            {!helpPanelVisible && (
                <Tooltip label="Afficher le volet d'aide" position="left" withArrow>
                    <button
                        type="button"
                        onClick={() => setHelpPanelVisible(true)}
                        className="fixed right-0 top-1/3 z-40 bg-teal-600 hover:bg-teal-700 text-white px-3 py-3 rounded-l-lg shadow-xl flex flex-col items-center gap-1 transition-colors"
                        aria-label="Afficher le volet d'aide"
                    >
                        <IconLayoutSidebarRightExpand size={18} />
                        <span className="text-[10px] uppercase tracking-wider">Aide</span>
                    </button>
                </Tooltip>
            )}
        </div>
    )
}

export default ReportIncidents