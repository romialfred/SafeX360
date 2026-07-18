import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, Stepper, Text, Badge, Paper, Alert } from '@mantine/core';
import { IconCheck, IconClipboardList, IconSearch, IconTool, IconArchive, IconSend } from '@tabler/icons-react';
import AnalysisStep from './steps/AnalysisStep';
import TreatmentStep from './steps/TreatmentStep';
import ClosureStep from './steps/ClosureStep';
import { useNavigate, useParams } from 'react-router-dom';
import DeclarationStep from './steps/DeclarationStep';
import { declarationRules } from './nonConformityValidation';
import { hasLessonsLearnedSection } from './nonConformityLabels';
import PageHeader from '../../UtilityComp/PageHeader';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { getAllActiveLocations } from '../../../services/LocationService';
import { getAllActiveIncidentCategories } from '../../../services/IncidentCategory';
import { getAllActiveWorkProcess } from '../../../services/WorkProcessService';
import { isValidRichText, mapIdToName } from '../../../utility/OtherUtilities';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { missingFieldsMessage } from '../../../utility/FormErrorUtility';
import { convertDocsToFiles, convertFilesToBase64New } from '../../../utility/DocumentUtility';
import { getEventAnalysisByNonConformityId, getNonConformity, updateNonConformity } from '../../../services/NonConformityService';
import { useAppDispatch } from '../../../slices/hooks';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { getActionsByNonConformityId } from '../../../services/CorrectiveActionService';
import { modals } from '@mantine/modals';
import NcHelp from './NcHelp';
import { useSelector } from 'react-redux';
import { toLocalDate } from '../../../utility/dateConversion';

const NonConformityEdit = () => {
    const { id } = useParams();
    const [activeStep, setActiveStep] = useState(0);
    const [employees, setEmployees] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [workProcesses, setWorkProcesses] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const user = useSelector((state: any) => state.user);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [lockedInfo, setLockedInfo] = useState<{ locked: boolean, status: string }>({ locked: false, status: '' });
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
                methodData: {} as Record<string, any>
            },


            correctiveActions: [
            ] as any,
        },
        validate: {
            nonConformity: {
                // Étape 1 (Déclaration) : règles PARTAGÉES avec l'autre écran
                // (voir nonConformityValidation). Ne jamais les recopier ici —
                // c'est la recopie qui avait rendu HAZARD indéclarable.
                ...declarationRules,

                //troisième page

                details: (value) => isValidRichText(value) || activeStep < 2 ? null : 'Les détails sont requis',
                comments: (value) => isValidRichText(value) || activeStep < 2 ? null : 'Les commentaires sont requis',

                //quatrième page
                // Exigé UNIQUEMENT si la carte « Leçons apprises » est rendue —
                // même prédicat que ClosureStep. Sans cette garde, clôturer une
                // situation dangereuse était impossible : le champ était requis
                // alors que sa carte n'est pas montée pour ce type.
                lessonLearned: (value, values) => !hasLessonsLearnedSection(values.nonConformity.type) || isValidRichText(value) || activeStep < 3 ? null : 'Les leçons apprises sont requises',
                // `sharingPlan` N'A PLUS DE RÈGLE : son éditeur est commenté dans
                // ClosureStep, donc le champ n'existe sur aucun écran. L'exiger
                // rendait le bouton « Soumettre et clôturer » définitivement
                // inopérant, sans rien à corriger pour l'utilisateur.
                closingDate: (value) => value || activeStep < 3 ? null : 'La date de clôture est requise',
                finalStatus: (value) => value || activeStep < 3 ? null : 'Le statut final est requis',
                validator: (value) => value || activeStep < 3 ? null : 'Le validateur est requis',
                validationDate: (value) => value || activeStep < 3 ? null : 'La date de validation est requise',
                // validationComment: (value) => isValidRichText(value) || activeStep < 3 ? null : 'Validation comment is required',
                // effectiveness: (value) => value || activeStep < 3 ? null : 'Effectiveness is required',
                // rating: (value) => value || activeStep < 3 ? null : 'Rating is required',
                // risk: (value) => value || activeStep < 3 ? null : 'Risk is required',

                // nextCheck: (value) => value || activeStep < 3 ? null : 'Next check is required',
                // feedback: (value) => isValidRichText(value) || activeStep < 3 ? null : 'Feedback is required',

                // archiveNumber: (value) => value || activeStep < 3 ? null : 'Archive number is required',
                // retentionPeriod: (value) => value || activeStep < 3 ? null : 'Retention period is required',
                // archiveLocationId: (value) => value || activeStep < 3 ? null : 'Archive location is required',
                // archiveManager: (value) => value || activeStep < 3 ? null : 'Archive manager is required',



            },
            analysis: {
                method: (value) => value || activeStep < 1 ? null : "La méthode d'analyse est requise",
                origin: (value) => value || activeStep < 1 ? null : "L'origine est requise",
                description: (value, values) => values.analysis.method !== 'ICAM' || value || activeStep < 1 ? null : 'La description est requise',
                individualFactors: (value, values) => values.analysis.method !== 'ICAM' || value || activeStep < 1 ? null : 'Les facteurs individuels sont requis',
                technicalFactors: (value, values) => values.analysis.method !== 'ICAM' || value || activeStep < 1 ? null : 'Les facteurs techniques sont requis',
                organizationalFactors: (value, values) => values.analysis.method !== 'ICAM' || value || activeStep < 1 ? null : 'Les facteurs organisationnels sont requis',
                rootCauses: (value, values) => values.analysis.method !== 'ICAM' || value || activeStep < 1 ? null : 'Les causes profondes sont requises',
                startDate: (value) => value || activeStep < 1 ? null : 'La date de début est requise',
                deadline: (value) => value || activeStep < 1 ? null : "L'échéance est requise",
                priority: (value) => value || activeStep < 1 ? null : 'La priorité est requise',
                severityLevel: (value) => value || activeStep < 1 ? null : 'Le niveau de gravité est requis',
                status: (value) => value || activeStep < 1 ? null : 'Le statut est requis',
                summary: (value) => isValidRichText(value) || activeStep < 1 ? null : 'Le résumé est requis',
                conclusion: (value) => isValidRichText(value) || activeStep < 1 ? null : 'La conclusion est requise',

            },
            correctiveActions: {
                actionName: (value) => value || activeStep < 2 ? null : "Le nom de l'action est requis",
                deadline: (value) => value || activeStep < 2 ? null : "L'échéance est requise",
                assignedEmployeeId: (value) => value || activeStep < 2 ? null : "L'employé assigné est requis",
                status: (value) => value || activeStep < 2 ? null : 'Le statut est requis',
                description: (value) => value || activeStep < 2 ? null : 'La description est requise',
            }

        }, // No validation yet
    });

    // Update number prefix when type changes
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
        dispatch(showOverlay())
        getNonConformity(id).then((data) => {
            form.setFieldValue("nonConformity", { ...data, date: new Date(data.date), detectionDate: data.detectionDate ? new Date(data.detectionDate) : new Date(), reportedBy: "" + data.reportedBy, workProcessId: "" + data.workProcessId, locationId: "" + data.locationId, categoryId: "" + data.categoryId, docs: convertDocsToFiles(data.docs), evidence: convertDocsToFiles(data.evidence), validationDate: data.validationDate ? new Date(data.validationDate) : new Date(), nextCheck: data.nextCheck ? new Date(data.nextCheck) : new Date(), closingDate: data.closingDate ? new Date(data.closingDate) : new Date() });
            const statusUpper = String(data?.status || '').toUpperCase();
            if (statusUpper === 'CLOSED' || statusUpper === 'REJECTED' || statusUpper === 'CANCELLED') {
                setLockedInfo({ locked: true, status: statusUpper });
            }
        }).catch((error) => {
            errorNotification(error?.response?.data?.errorMessage);
            navigate("/non-conformity");

        }).finally(() => {
            dispatch(hideOverlay());
        })
        getEventAnalysisByNonConformityId(id).then((data) => {
            // methodData est stocké en JSON (String) côté HNS : on le reparse en
            // objet pour réalimenter les champs des méthodes non-ICAM.
            let parsedMethodData: Record<string, any> = {};
            try { parsedMethodData = data.methodData ? JSON.parse(data.methodData) : {}; } catch { parsedMethodData = {}; }
            form.setFieldValue("analysis", {
                ...data, methodData: parsedMethodData, startDate: data.startDate ? new Date(data.startDate) : new Date(), deadline: data.deadline ? new Date(data.deadline) : new Date()
            })
        }).catch((_error) => console.error(_error))
        getActionsByNonConformityId(Number(id)).then((data) => {
            form.setFieldValue("correctiveActions", data?.map((x: any) => ({
                ...x,
                actionName: x.actionName,
                deadline: x.deadline ? new Date(x.deadline) : new Date(),
                assignedEmployeeId: "" + x.assignedEmployeeId,
                status: x.status,
                description: x.description
            })));
        }).catch((_error) => console.error(_error));
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

    const isLocked = lockedInfo.locked;
    const lockedMessage = lockedInfo.status === 'CLOSED'
        ? 'Cet événement est clôturé. Les modifications ne sont plus autorisées.'
        : lockedInfo.status === 'CANCELLED'
            ? 'Cet événement est annulé. Les modifications ne sont plus autorisées.'
            : 'Cet événement est rejeté. Les modifications ne sont plus autorisées.';
    const lockedAlertColor = lockedInfo.status === 'CLOSED'
        ? 'green'
        : lockedInfo.status === 'CANCELLED'
            ? 'orange'
            : 'red';

    const handleNext = () => {
        if (isLocked) {
            errorNotification(lockedMessage);
            return;
        }

        form.validate();
        if (!form.isValid()) {
            errorNotification(missingFieldsMessage(form.errors));
            return;
        }
        if (activeStep < steps.length - 1) {
            setActiveStep(activeStep + 1);
        }
    };

    const handlePrev = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    };

    const handleFirstSubmit = () => {
        if (isLocked) {
            errorNotification(lockedMessage);
            return;
        }
        form.validate();
        if (!form.isValid()) {
            errorNotification(missingFieldsMessage(form.errors, "Enregistrement impossible"));
            return;
        }

        modals.openConfirmModal({
            title: <span className='text-base'>Confirmer la soumission</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Souhaitez-vous soumettre la mise à jour sans renseigner les étapes suivantes ?
                </span>
            ),
            labels: { confirm: 'Oui, soumettre', cancel: 'Annuler' },
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
        if (isLocked) {
            errorNotification(lockedMessage);
            return;
        }

        form.validate();
        if (!form.isValid()) {
            errorNotification(missingFieldsMessage(form.errors, "Enregistrement impossible"));
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
        updateNonConformity({
            nonConformity: ncPayload,
            // methodData (objet) resérialisé en JSON pour la colonne HNS.
            analysis: { ...values.analysis, methodData: typeof values.analysis.methodData === 'string' ? values.analysis.methodData : JSON.stringify(values.analysis.methodData || {}) },
            // Idem création : `deadline` normalisée en date LOCALE (LocalDate côté
            // back). Sans cela le spread renvoyait un objet Date sérialisé en ISO
            // UTC -> échéance reculée d'un jour à CHAQUE enregistrement.
            correctiveActions: values.correctiveActions.map((action: any) => ({ ...action, deadline: toLocalDate(action.deadline), departmentId: action.assignedEmployeeId ? empMap[action.assignedEmployeeId]?.departmentId : user.departmentId, ownerId: action.assignedEmployeeId ?? user.id, assignedEmployeeId: action.assignedEmployeeId ?? user.id }))
        }).then((_response) => {
            successNotification("Constat central mis à jour");
            navigate("/non-conformity");

        }).catch((error) => {

            errorNotification(error?.response?.data?.errorMessage || "La mise à jour a échoué. Veuillez réessayer.");
        }).finally(() => {
            dispatch(hideOverlay());
        })
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return <DeclarationStep form={form} employees={employees} locations={locations} workProcesses={workProcesses} categories={categories} edit={true} />;
            case 1:
                return <AnalysisStep form={form} employees={employees} empMap={empMap} />;
            case 2:
                return <TreatmentStep form={form} employees={employees} />;
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
        <div className="p-5 flex flex-col w-full" >
            <div className='mb-4'>
                <PageHeader
                    breadcrumbs={[
                        { label: 'Accueil', to: '/' },
                        { label: 'Constats centraux', to: '/non-conformity' },
                        { label: 'Mettre à jour la déclaration' },
                    ]}
                    icon={<IconClipboardList size={22} stroke={2} />}
                    iconColor="red"
                    title="Mettre à jour le constat central"
                    subtitle="Modification de la déclaration, de l'analyse, du traitement et de la clôture"
                    actions={
                        <Button
                            leftSection={<IconCheck size={16} />}
                            onClick={handleFirstSubmit}
                            disabled={isLocked}
                            title={isLocked ? lockedMessage : undefined}
                            color="green"
                        >
                            Soumettre
                        </Button>
                    }
                />
            </div>
            {/* <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 mb-6">
                <Group justify="space-between" className="mb-4">
                    <Group>
                        <ActionIcon
                            onClick={onBack}
                            variant="light"
                            className="rounded-lg hover:bg-slate-100"
                            size="lg"
                        >
                            <IconArrowLeft size={18} />
                        </ActionIcon>
                        <div>
                            <Title order={2} className="text-slate-800 tracking-tight">
                                New Health and Safety Event Declaration
                            </Title>
                        </div>
                    </Group>

                    <Group gap="md">
                        <Button
                            leftSection={<IconDeviceFloppy size={16} />}
                            variant="outline"
                            onClick={handleSave}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                            Save Draft
                        </Button>
                        <Button
                            leftSection={<IconCheck size={16} />}
                            onClick={handleSubmit}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25 rounded-lg"
                        >
                            Submit
                        </Button>
                        <Button
                            leftSection={<IconX size={16} />}
                            variant="outline"
                            color="red"
                            onClick={onBack}
                            className="border-red-300 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                            Cancel
                        </Button>
                    </Group>
                </Group>

            </Paper> */}
            <div>
                {lockedInfo.locked && (
                    <Alert
                        color={lockedAlertColor}
                        variant="light"
                        className="mb-3 border"
                    >
                        <Text>{lockedMessage}</Text>
                    </Alert>
                )}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Text size="lg" className="text-slate-800">
                        {form.values.nonConformity.title?.trim() || 'Constat sans titre'}
                    </Text>
                    <Badge
                        color="blue"
                        variant="filled"
                        className="rounded-full px-3 py-1 text-sm"
                    >
                        {form.values.nonConformity.number || 'Numéro en attente de génération'}
                    </Badge>
                </div>
                <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 mb-4">
                    <Stepper
                        active={activeStep}
                        onStepClick={(s) => { if (!isLocked) setActiveStep(s); }}
                        allowNextStepsSelect={true}
                        size="sm"
                        classNames={{
                            step: 'hover:bg-slate-50 rounded-lg transition-colors duration-200',
                            stepIcon: 'border-2',
                            stepCompletedIcon: 'bg-gradient-to-r from-emerald-500 to-cyan-500 border-emerald-500',
                            stepBody: 'ml-2'
                        }}
                    >
                        {steps.map((step, index) => (
                            <Stepper.Step
                                key={index}
                                label={
                                    <Text size="sm" className="text-slate-800">
                                        {step.label}
                                    </Text>
                                }
                                description={
                                    <Text size="xs" className="text-slate-600">
                                        {step.description}
                                    </Text>
                                }
                                icon={<step.icon size={14} />}
                                completedIcon={<IconCheck size={14} />}
                            />
                        ))}
                    </Stepper>
                </Paper>

                {/* Form Content + Help */}
                <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 mb-4">
                    <div className="grid grid-cols-3 gap-5">
                        <div className="col-span-2 space-y-5">
                            {renderStepContent()}
                            <Paper className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                                <Group justify="space-between">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrev}
                                        disabled={activeStep === 0}
                                        className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg disabled:opacity-50"
                                    >
                                        Étape précédente
                                    </Button>

                                    <Group gap="md">
                                        <Badge
                                            variant="light"
                                            className="bg-slate-100 text-slate-700"
                                        >
                                            Étape {activeStep + 1} sur {steps.length}
                                        </Badge>

                                        {activeStep === steps.length - 1 ? (
                                            <Button
                                                leftSection={<IconSend size={16} />}
                                                onClick={handleSubmit}
                                                disabled={isLocked}
                                                color="green"
                                            >
                                                Soumettre et clôturer
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleNext}
                                                disabled={isLocked}
                                                color="blue"
                                            >
                                                Étape suivante
                                            </Button>
                                        )}
                                        {activeStep < 3 && (
                                            <Button
                                                leftSection={<IconCheck size={16} />}
                                                onClick={handleFirstSubmit}
                                                disabled={isLocked}
                                                variant="light"
                                                color="green"
                                            >
                                                Soumettre maintenant
                                            </Button>)}
                                    </Group>
                                </Group>
                            </Paper>
                        </div>
                        <NcHelp activeStep={activeStep} />
                    </div>
                </Paper>

                {/* Navigation */}

            </div>


        </div>
    )
}

export default NonConformityEdit
