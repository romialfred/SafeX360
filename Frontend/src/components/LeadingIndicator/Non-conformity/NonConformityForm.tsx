import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, Stepper, Text, Badge, Paper, Tooltip } from '@mantine/core';
import {
    IconCheck, IconClipboardList, IconSearch, IconTool, IconArchive, IconSend,
    IconAlertTriangle, IconDeviceFloppy, IconX, IconLayoutSidebarRightCollapse,
    IconLayoutSidebarRightExpand, IconArrowLeft, IconArrowRight, IconHash,
} from '@tabler/icons-react';
import AnalysisStep from './steps/AnalysisStep';
import TreatmentStep from './steps/TreatmentStep';
import ClosureStep from './steps/ClosureStep';
import { useNavigate } from 'react-router-dom';
import DeclarationStep from './steps/DeclarationStep';
import PageHeader from '../../UtilityComp/PageHeader';
import { getAllActiveLocations } from '../../../services/LocationService';
import { getAllActiveIncidentCategories } from '../../../services/IncidentCategory';
import { getAllActiveWorkProcess } from '../../../services/WorkProcessService';
import { isValidRichText, mapIdToName } from '../../../utility/OtherUtilities';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { convertFilesToBase64New } from '../../../utility/DocumentUtility';
import { reportNonConformity } from '../../../services/NonConformityService';
import { useAppDispatch } from '../../../slices/hooks';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { modals } from '@mantine/modals';
import NcHelp from './NcHelp';
import { useSelector } from 'react-redux';
import { toLocalDate } from '../../../utility/dateConversion';



const NonConformityForm = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [helpPanelVisible, setHelpPanelVisible] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [workProcesses, setWorkProcesses] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const user = useSelector((state: any) => state.user);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const getNumberPrefix = (type: string) => {
        if (type === "NEAR_MISS") return "NM";
        return "NC";
    };
    const form = useForm({
        initialValues: {
            nonConformity: {
                type: '',
                number: getNumberPrefix('') + "-" + new Date().getFullYear() + "-XXX",
                title: '',
                date: new Date(),
                detectionDate: new Date(),
                reportedBy: '',
                workProcessId: '',
                locationId: '',
                categoryId: '',
                description: '',
                evidence: [],
                requirement: '',
                detectionSource: '',
                actionTaken: '',
                severityLevel: '',
                nearMissType: '',
                factors: [],
                improvement: '',
                events: [],
                preventiveAction: '',
                materialCost: 0,
                laborCost: 0,
                adminFees: 0,
                expenses: 0,
                details: '',
                docs: [],
                indirectImpacts: [],
                comments: '',
                supportComments: '',
                lessonLearned: '',
                sharingPlan: '',
                closingDate: null as Date | string | null,
                finalStatus: '',
                validator: '',
                validationDate: null as Date | string | null,
                validationComment: '',
                effectiveness: '',
                rating: null as number | null,
                risk: '',
                nextCheck: null as Date | string | null,
                feedback: '',
                currency: 'USD',
                archiveNumber: '',
                retentionPeriod: '',
                archiveLocationId: '',
                archiveManager: '',

            },
            analysis: {
                method: 'ICAM',
                origin: '',
                description: '',
                individualFactors: '',
                technicalFactors: '',
                organizationalFactors: '',
                rootCauses: '',
                team: [] as any,
                startDate: '',
                deadline: '',
                priority: '',
                severityLevel: '',
                status: '',
                summary: '',
                conclusion: '',
                // Données spécifiques à la méthode d'analyse non-ICAM (5 Pourquoi,
                // Ishikawa, AMDEC, Arbre, Brainstorming, Autre). Objet libre
                // sérialisé en JSON à la soumission (colonne methodData côté HNS).
                methodData: {} as Record<string, any>
            },


            correctiveActions: [
                // {
                //     actionName: '',
                //     deadline: '',
                //     assignedEmployeeId: "",
                //     status: "",
                //     description: ""
                // }
            ] as any,
        },
        validate: {
            nonConformity: {
                //première page
                type: (value) => value ? null : "Le type d'événement est requis",
                title: (value) => value ? null : "Le titre est requis",
                date: (value) => value ? null : "La date de l'événement est requise",
                detectionDate: (value) => value ? null : "La date de détection est requise",
                reportedBy: (value) => value ? null : "Le déclarant est requis",
                workProcessId: (value) => value ? null : "Le processus de travail est requis",
                locationId: (value) => value ? null : "Le lieu est requis",
                categoryId: (value) => value ? null : "La catégorie est requise",
                description: (value) => isValidRichText(value) ? null : "La description est requise",
                requirement: (value, values) => value || values.nonConformity.type == "NEAR_MISS" ? null : "L'exigence non respectée est requise",
                detectionSource: (value, values) => value || values.nonConformity.type == "NEAR_MISS" ? null : "La source de détection est requise",
                actionTaken: (value, values) => value || values.nonConformity.type == "NEAR_MISS" ? null : "L'action immédiate est requise",
                severityLevel: (value, values) => value || values.nonConformity.type == "NEAR_MISS" ? null : "Le niveau de gravité est requis",
                nearMissType: (value, values) => values.nonConformity.type == "NEAR_MISS" && !value ? "Le type de quasi-accident est requis" : null,
                factors: (value, values) => values.nonConformity.type == "NEAR_MISS" && value.length === 0 ? "Au moins un facteur contributif est requis" : null,
                preventiveAction: (value, values) => values.nonConformity.type == "NEAR_MISS" && !isValidRichText(value) ? "L'action préventive est requise" : null,
                improvement: (value, values) => values.nonConformity.type == "NEAR_MISS" && !isValidRichText(value) ? "L'opportunité d'amélioration est requise" : null,
                events: (value) => value.length === 0 ? "Au moins une nature d'événement est requise" : null,

                // Étapes 2 à 4 (Analyse, Traitement, Clôture & Diffusion) :
                // OPTIONNELLES. Règle métier : seule l'étape 1 (Déclaration) est
                // obligatoire. Un événement est enregistrable dès que les
                // informations principales sont saisies ; l'analyse causale, les
                // actions correctives et la clôture se complètent plus tard.
                // (Les anciennes règles verrouillées sur `activeStep` bloquaient
                //  la soumission une fois arrivé à l'étape 4.)
            },
            // Analyse causale — optionnelle (différable après l'étape 1).
            analysis: {},
            // Actions correctives — optionnelles (ajoutables ultérieurement).
            correctiveActions: {},
        },
    });

    useEffect(() => {
        const type = form.values.nonConformity.type;
        if (type) {
            form.setFieldValue(
                'nonConformity.number',
                getNumberPrefix(type) + '-' + new Date().getFullYear() + '-XXX'
            );
        }
    }, [form.values.nonConformity.type]);

    useEffect(() => {
        getEmployeesWithDepartment().then((data) => {
            setEmpMap(mapIdToName(data));
            setEmployees(data.map((emp: any) => ({
                value: "" + emp.id,
                label: emp.name
            })));
        }).catch((error) => {
            console.error("Failed to fetch employees:", error);
        });

        getAllActiveLocations().then((data) => {
            setLocations(data.map((loc: any) => ({
                value: "" + loc.id,
                label: loc.name
            })));
        }).catch((error) => {
            console.error("Failed to fetch locations:", error);
        });
        getAllActiveIncidentCategories().then((data) => {
            setCategories(data.map((cat: any) => ({
                value: "" + cat.id,
                label: cat.name
            })));
        }).catch((error) => {
            console.error("Failed to fetch categories:", error);
        });
        getAllActiveWorkProcess().then((data) => {
            setWorkProcesses(data.map((wp: any) => ({
                value: "" + wp.id,
                label: wp.name
            })));
        }).catch((error) => {
            console.error("Failed to fetch work processes:", error);
        });

    }, []);

    // const onBack = () => {
    // Logic to handle back navigation
    //     console.log('Back button clicked');
    // };
    const getEventTypeColor = (eventType: string) => {
        return eventType === 'Non-Conformity' ? 'red' : 'orange';
    };

    // const getEventTypeIcon = (eventType: string) => {
    //     return eventType === 'Non-Conformity' ? IconAlertTriangle : IconClipboardList;
    // };
    const steps = [
        {
            label: 'Déclaration',
            description: 'Informations générales',
            icon: IconClipboardList,
            color: getEventTypeColor(form.values.nonConformity.type || 'Non-Conformity')
        },
        {
            label: 'Analyse',
            description: 'Analyse causale',
            icon: IconSearch,
            color: 'yellow'
        },
        {
            label: 'Traitement',
            description: 'Actions correctives',
            icon: IconTool,
            color: 'orange'
        },
        {
            label: 'Clôture & Diffusion',
            description: 'Validation & partage',
            icon: IconArchive,
            color: 'green'
        }
    ];

    const handleNext = () => {
        form.validate();
        if (!form.isValid()) {
            errorNotification("Veuillez compléter tous les champs obligatoires avant de continuer.");
            return;
        }
        if (activeStep < steps.length - 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveStep(activeStep + 1);
        }
    };

    const handlePrev = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    };

    const handleFirstSubmit = () => {
        form.validate();
        if (!form.isValid()) {
            // Tous les champs obligatoires restants sont à l'étape 1 : on y ramène
            // l'utilisateur pour qu'il voie les erreurs inline (sinon, depuis
            // l'étape 4, seul un toast générique s'affichait).
            setActiveStep(0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            errorNotification("Veuillez compléter les champs obligatoires de l'étape 1 (Déclaration) avant de soumettre.");
            return;
        }

        modals.openConfirmModal({
            title: <span className="text-lg">Confirmer la soumission</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Souhaitez-vous soumettre la déclaration sans renseigner les étapes suivantes ?
                </span>
            ),
            labels: { confirm: "Oui, soumettre", cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: "default" },
            confirmProps: { color: 'green', variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                handleSubmit();
            },
        });
    }

    const handleSubmit = async () => {
        form.validate();
        if (!form.isValid()) {
            setActiveStep(0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            errorNotification("Veuillez compléter les champs obligatoires de l'étape 1 (Déclaration) avant de soumettre.");
            return;
        }
        const values = form.values;
        dispatch(showOverlay());
        const evidence = await convertFilesToBase64New(values.nonConformity.evidence);
        const docs = await convertFilesToBase64New(values.nonConformity.docs);
        // Transformation du payload nonConformity pour matcher le DTO backend :
        // - dates serialisees via toLocalDate (LocalDate Spring)
        // - validator -> validatorId (Long), archiveManager -> archiveManagerId (Long)
        // - rating null si non rempli (DTO attend Integer)
        const ncPayload: any = {
            ...values.nonConformity,
            evidence,
            docs,
            status: null,
            closingDate: toLocalDate(values.nonConformity.closingDate as any),
            validationDate: toLocalDate(values.nonConformity.validationDate as any),
            nextCheck: toLocalDate(values.nonConformity.nextCheck as any),
            rating: values.nonConformity.rating === null || values.nonConformity.rating === undefined
                ? null
                : Number(values.nonConformity.rating),
        };
        if (ncPayload.validator !== undefined && ncPayload.validator !== '' && ncPayload.validator !== null) {
            ncPayload.validatorId = Number(ncPayload.validator);
        }
        delete ncPayload.validator;
        if (ncPayload.archiveManager !== undefined && ncPayload.archiveManager !== '' && ncPayload.archiveManager !== null) {
            ncPayload.archiveManagerId = Number(ncPayload.archiveManager);
        }
        delete ncPayload.archiveManager;
        reportNonConformity({
            nonConformity: ncPayload,
            // methodData (objet libre par méthode d'analyse) sérialisé en JSON :
            // la colonne HNS methodData est un String/@Lob.
            analysis: { ...values.analysis, methodData: JSON.stringify(values.analysis.methodData || {}) },
            // `deadline` doit être normalisée comme les dates de la NC (toLocalDate) :
            // le spread propageait un objet Date brut, sérialisé en ISO UTC, alors que
            // CorrectiveActionDTO.deadline est un LocalDate -> échéance reculée d'un
            // jour et action signalée « en retard » 24 h trop tôt.
            correctiveActions: values.correctiveActions.map((action: any) => ({ ...action, deadline: toLocalDate(action.deadline), departmentId: action.assignedEmployeeId ? empMap[action.assignedEmployeeId]?.departmentId : user.departmentId, ownerId: action.assignedEmployeeId ?? user.id, assignedEmployeeId: action.assignedEmployeeId ?? user.id })),
        }).then((_response) => {
            successNotification("Constat central déclaré avec succès !");
            navigate("/non-conformity");
        }).catch((error) => {
            errorNotification(error?.response?.data?.errorMessage || "Échec de la déclaration. Veuillez réessayer.");
        }).finally(() => {
            dispatch(hideOverlay());
        })
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return <DeclarationStep form={form} employees={employees} locations={locations} workProcesses={workProcesses} categories={categories} />;
            case 1:
                return <AnalysisStep form={form} employees={employees} empMap={empMap} />;
            case 2:
                return <TreatmentStep form={form} employees={employees} empMap={empMap} />;
            case 3:
                return <ClosureStep form={form} employees={employees} locations={locations} />;
            default:
                return null;
        }
    };

    // const getStepStatus = (stepIndex: number) => {
    //     if (stepIndex < activeStep) return 'completed';
    //     if (stepIndex === activeStep) return 'active';
    //     return 'inactive';
    // };

    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Constats centraux', to: '/non-conformity' },
                    { label: "Nouvelle déclaration" },
                ]}
                icon={<IconAlertTriangle size={22} stroke={2} />}
                iconColor="red"
                title="Nouvelle déclaration de constat central"
                subtitle="Non-conformité ou quasi-accident — ISO 45001 §10.2 et ISO 9001 §10.2"
                badge={
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                        <IconHash size={13} className="text-slate-500" />
                        <span className="text-xs font-mono text-slate-700">
                            {form.values.nonConformity.number}
                        </span>
                    </div>
                }
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconX size={15} />} onClick={() => navigate(-1)}>
                            Annuler
                        </Button>
                        <Tooltip label={helpPanelVisible ? "Masquer le volet d'aide" : "Afficher le volet d'aide"}>
                            <Button
                                size="sm"
                                variant="default"
                                onClick={() => setHelpPanelVisible((v) => !v)}
                                leftSection={helpPanelVisible
                                    ? <IconLayoutSidebarRightCollapse size={15} />
                                    : <IconLayoutSidebarRightExpand size={15} />}
                            >
                                {helpPanelVisible ? "Masquer l'aide" : "Afficher l'aide"}
                            </Button>
                        </Tooltip>
                        <Button
                            color="green"
                            size="sm"
                            leftSection={<IconDeviceFloppy size={15} />}
                            onClick={handleFirstSubmit}
                        >
                            Enregistrer
                        </Button>
                    </>
                }
            />

            {/* Stepper sobre et pro */}
            <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                <Stepper
                    active={activeStep}
                    onStepClick={setActiveStep}
                    allowNextStepsSelect={true}
                    size="sm"
                    color="red"
                    classNames={{
                        step: 'hover:bg-slate-50 rounded-lg transition-colors duration-200',
                        stepIcon: 'border-2',
                        stepBody: 'ml-2'
                    }}
                >
                    {steps.map((step, index) => (
                        <Stepper.Step
                            key={index}
                            label={
                                <Text size="sm" className="text-slate-900">
                                    {step.label}
                                </Text>
                            }
                            description={
                                <Text size="xs" className="text-slate-500">
                                    {step.description}
                                </Text>
                            }
                            icon={<step.icon size={14} />}
                            completedIcon={<IconCheck size={14} />}
                        />
                    ))}
                </Stepper>
            </Paper>

            {/* Contenu du formulaire + volet d'aide collapsible */}
            <div className={`grid grid-cols-1 gap-5 ${helpPanelVisible ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
                <div className={helpPanelVisible ? 'lg:col-span-2 space-y-5' : 'lg:col-span-1 space-y-5'}>
                    {renderStepContent()}

                    {/* Barre de navigation */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                        <Group justify="space-between" wrap="wrap">
                            <Button
                                variant="default"
                                leftSection={<IconArrowLeft size={15} />}
                                onClick={handlePrev}
                                disabled={activeStep === 0}
                            >
                                Étape précédente
                            </Button>

                            <Group gap="md">
                                <Badge
                                    variant="light"
                                    color="gray"
                                    radius="sm"
                                    size="md"
                                >
                                    Étape {activeStep + 1} sur {steps.length}
                                </Badge>

                                {activeStep === steps.length - 1 ? (
                                    <Button
                                        color="green"
                                        leftSection={<IconSend size={15} />}
                                        onClick={handleSubmit}
                                    >
                                        Soumettre et clôturer
                                    </Button>
                                ) : (
                                    <Button
                                        color="red"
                                        rightSection={<IconArrowRight size={15} />}
                                        onClick={handleNext}
                                    >
                                        Étape suivante
                                    </Button>
                                )}
                                {activeStep < 3 && (
                                    <Button
                                        variant="light"
                                        color="green"
                                        leftSection={<IconCheck size={15} />}
                                        onClick={handleFirstSubmit}
                                    >
                                        Soumettre maintenant
                                    </Button>
                                )}
                            </Group>
                        </Group>
                    </div>
                </div>

                {helpPanelVisible && (
                    <div className="lg:col-span-1">
                        <NcHelp activeStep={activeStep} onClose={() => setHelpPanelVisible(false)} />
                    </div>
                )}
            </div>

            {/* Bouton flottant pour rouvrir le volet d'aide */}
            {!helpPanelVisible && (
                <Tooltip label="Afficher le volet d'aide" position="left" withArrow>
                    <button
                        type="button"
                        onClick={() => setHelpPanelVisible(true)}
                        className="fixed right-0 top-1/3 z-40 bg-red-600 hover:bg-red-700 text-white px-3 py-3 rounded-l-lg shadow-xl flex flex-col items-center gap-1 transition-colors"
                        aria-label="Afficher le volet d'aide"
                    >
                        <IconLayoutSidebarRightExpand size={18} />
                        <span className="text-[10px] uppercase tracking-wider">Aide</span>
                    </button>
                </Tooltip>
            )}
        </div>
    );
};

export default NonConformityForm;
