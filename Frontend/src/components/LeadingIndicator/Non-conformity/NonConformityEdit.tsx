import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, Stepper, Text, Badge, Paper, Breadcrumbs, Alert } from '@mantine/core';
import { IconCheck, IconClipboardList, IconSearch, IconTool, IconArchive, IconSend } from '@tabler/icons-react';
import AnalysisStep from './steps/AnalysisStep';
import TreatmentStep from './steps/TreatmentStep';
import ClosureStep from './steps/ClosureStep';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DeclarationStep from './steps/DeclarationStep';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { getAllActiveLocations } from '../../../services/LocationService';
import { getAllActiveIncidentCategories } from '../../../services/IncidentCategory';
import { getAllActiveWorkProcess } from '../../../services/WorkProcessService';
import { isValidRichText, mapIdToName } from '../../../utility/OtherUtilities';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { convertDocsToFiles, convertFilesToBase64New } from '../../../utility/DocumentUtility';
import { getEventAnalysisByNonConformityId, getNonConformity, updateNonConformity } from '../../../services/NonConformityService';
import { useAppDispatch } from '../../../slices/hooks';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { getActionsByNonConformityId } from '../../../services/CorrectiveActionService';
import { modals } from '@mantine/modals';
import NcHelp from './NcHelp';
import { useSelector } from 'react-redux';

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
                closingDate: '',
                finalStatus: '',
                validator: '',
                validationDate: '',
                validationComment: '',
                effectiveness: '',
                rating: '',
                risk: '',
                nextCheck: '',
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
                conclusion: ''
            },


            correctiveActions: [
            ] as any,
        },
        validate: {
            nonConformity: {
                //first page
                type: (value) => value ? null : 'Type is required',
                title: (value) => value ? null : 'Title is required',
                date: (value) => value ? null : 'Date is required',
                detectionDate: (value) => value ? null : 'Detection date is required',
                reportedBy: (value) => value ? null : 'Reported by is required',
                workProcessId: (value) => value ? null : 'Work process is required',
                locationId: (value) => value ? null : 'Location is required',
                categoryId: (value) => value ? null : 'Category is required',
                description: (value) => isValidRichText(value) ? null : 'Description is required',
                requirement: (value, values) => value || values.nonConformity.type == "NEAR_MISS" ? null : 'Requirement is required',
                detectionSource: (value, values) => value || values.nonConformity.type == "NEAR_MISS" ? null : 'Detection source is required',
                actionTaken: (value, values) => value || values.nonConformity.type == "NEAR_MISS" ? null : 'Action taken is required',
                severityLevel: (value, values) => value || values.nonConformity.type == "NEAR_MISS" ? null : 'Severity level is required',
                nearMissType: (value, values) => values.nonConformity.type == "NEAR_MISS" && !value ? 'Near miss type is required' : null,
                factors: (value, values) => values.nonConformity.type == "NEAR_MISS" && value.length === 0 ? 'At least one factor is required' : null,
                preventiveAction: (value, values) => values.nonConformity.type == "NEAR_MISS" && !isValidRichText(value) ? 'Preventive action is required' : null,
                improvement: (value, values) => values.nonConformity.type == "NEAR_MISS" && !isValidRichText(value) ? 'Improvement is required' : null,
                events: (value) => value.length === 0 ? 'At least one event is required' : null,

                //third page

                details: (value) => isValidRichText(value) || activeStep < 2 ? null : 'Details are required',
                comments: (value) => isValidRichText(value) || activeStep < 2 ? null : 'Comments are required',
                // supportComments: (value) => isValidRichText(value) || activeStep < 2 ? null : 'Support comments are required',

                //fourth page
                lessonLearned: (value) => isValidRichText(value) || activeStep < 3 ? null : 'Lessons learned are required',
                sharingPlan: (value) => isValidRichText(value) || activeStep < 3 ? null : 'Knowledge sharing plan is required',
                closingDate: (value) => value || activeStep < 3 ? null : 'Closing date is required',
                finalStatus: (value) => value || activeStep < 3 ? null : 'Final status is required',
                validator: (value) => value || activeStep < 3 ? null : 'Validator is required',
                validationDate: (value) => value || activeStep < 3 ? null : 'Validation date is required',
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
                method: (value) => value || activeStep < 1 ? null : 'Analysis method is required',
                origin: (value) => value || activeStep < 1 ? null : 'Origin is required',
                description: (value) => value || activeStep < 1 ? null : 'Description is required',
                individualFactors: (value) => value || activeStep < 1 ? null : 'Individual factors are required',
                technicalFactors: (value) => value || activeStep < 1 ? null : 'Technical factors are required',
                organizationalFactors: (value) => value || activeStep < 1 ? null : 'Organizational factors are required',
                rootCauses: (value) => value || activeStep < 1 ? null : 'Root causes are required',
                startDate: (value) => value || activeStep < 1 ? null : 'Start date is required',
                deadline: (value) => value || activeStep < 1 ? null : 'Deadline is required',
                priority: (value) => value || activeStep < 1 ? null : 'Priority is required',
                severityLevel: (value) => value || activeStep < 1 ? null : 'Severity level is required',
                status: (value) => value || activeStep < 1 ? null : 'Status is required',
                summary: (value) => isValidRichText(value) || activeStep < 1 ? null : 'Summary is required',
                conclusion: (value) => isValidRichText(value) || activeStep < 1 ? null : 'Conclusion is required',

            },
            correctiveActions: {
                actionName: (value) => value || activeStep < 2 ? null : 'Action name is required',
                deadline: (value) => value || activeStep < 2 ? null : 'Deadline is required',
                assignedEmployeeId: (value) => value || activeStep < 2 ? null : 'Assigned employee is required',
                status: (value) => value || activeStep < 2 ? null : 'Status is required',
                description: (value) => value || activeStep < 2 ? null : 'Description is required',
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
            form.setFieldValue("nonConformity", { ...data, date: new Date(data.date), detectionDate: new Date(data.date), reportedBy: "" + data.reportedBy, workProcessId: "" + data.workProcessId, locationId: "" + data.locationId, categoryId: "" + data.categoryId, docs: convertDocsToFiles(data.docs), evidence: convertDocsToFiles(data.evidence), validationDate: data.validationDate ? new Date(data.validationDate) : new Date(), nextCheck: data.nextCheck ? new Date(data.nextCheck) : new Date(), closingDate: data.closingDate ? new Date(data.closingDate) : new Date() });
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
            form.setFieldValue("analysis", {
                ...data, startDate: data.startDate ? new Date(data.startDate) : new Date(), deadline: data.deadline ? new Date(data.deadline) : new Date()
            })
        }).catch((_error) => {

        })
        getActionsByNonConformityId(id).then((data) => {
            form.setFieldValue("correctiveActions", data?.map((x: any) => ({
                ...x,
                actionName: x.actionName,
                deadline: x.deadline ? new Date(x.deadline) : new Date(),
                assignedEmployeeId: "" + x.assignedEmployeeId,
                status: x.status,
                description: x.description
            })));
        }).catch((_error) => { });
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
            label: 'Declaration',
            description: 'General Information',
            icon: IconClipboardList,
            color: getEventTypeColor(form.values.nonConformity.type || 'Non-Conformity')
        },
        {
            label: 'Analysis',
            description: 'Root Cause Analysis',
            icon: IconSearch,
            color: 'yellow'
        },
        {
            label: 'Treatment',
            description: 'Corrective Actions',
            icon: IconTool,
            color: 'orange'
        },
        {
            label: 'Closure & Distribution',
            description: 'Validation & Distribution',
            icon: IconArchive,
            color: 'green'
        }
    ];

    const isLocked = lockedInfo.locked;
    const lockedMessage = lockedInfo.status === 'CLOSED'
        ? 'This event is closed. Modifications are not allowed.'
        : lockedInfo.status === 'CANCELLED'
            ? 'This event is cancelled. Modifications are not allowed.'
            : 'This event is rejected. Modifications are not allowed.';
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
            errorNotification("Please fill all required fields before proceeding.");
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
            errorNotification("Please fill all required fields before submitting.");
            return;
        }

        modals.openConfirmModal({
            title: <span className='font-semibold text-2xl'>Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to submit the form without filling next steps?
                </span>
            ),
            labels: { confirm: `Yes`, cancel: 'Cancel' },
            cancelProps: { color: 'red', variant: "filled" },
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
            errorNotification("Please fill all required fields before submitting.");
            return;
        }
        const values = form.values;
        dispatch(showOverlay());
        const evidence = await convertFilesToBase64New(values.nonConformity.evidence);
        const docs = await convertFilesToBase64New(values.nonConformity.docs);
        updateNonConformity({
            nonConformity: { ...values.nonConformity, evidence, docs, status: null },
            analysis: values.analysis,
            correctiveActions: values.correctiveActions.map((action: any) => ({ ...action, departmentId: action.assignedEmployeeId ? empMap[action.assignedEmployeeId]?.departmentId : user.departmentId, ownerId: action.assignedEmployeeId ?? user.id, assignedEmployeeId: action.assignedEmployeeId ?? user.id }))
        }).then((_response) => {
            successNotification("Non-conformity updated successfully!");
            navigate("/non-conformity");

        }).catch((error) => {

            errorNotification(error?.response?.data?.errorMessage || "Failed to update non-conformity. Please try again.");
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
        <div className="p-5 flex flex-col" >
            <div className='flex items-center justify-between'>
                <div>
                    <div className="font-semibold  text-2xl text-blue-500 w-fit">Update Central Finding Declaration</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/"><Text variant="gradient">Home</Text></Link>
                        <Link className="hover:!underline" to="/non-conformity"><Text variant="gradient">Central Findings Dashboard</Text></Link>
                        <Link className="hover:!underline" to=""><Text variant="gradient">Update Central Finding Declaration</Text></Link>

                    </Breadcrumbs>
                </div>

                <Button
                    leftSection={<IconCheck size={16} />}
                    onClick={handleFirstSubmit}
                    disabled={isLocked}
                    title={isLocked ? lockedMessage : undefined}
                    className="!bg-gradient-to-r !from-green-500 !to-green-600 hover:!from-green-600 hover:!to-green-700 text-white shadow-lg shadow-green-500/25 rounded-lg"
                >
                    Submit
                </Button>
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
                            <Title order={2} className="text-slate-800 font-semibold tracking-tight">
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
                        <Text fw={600}>{lockedMessage}</Text>
                    </Alert>
                )}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Text fw={700} size="lg" className="text-slate-800">
                        {form.values.nonConformity.title?.trim() || 'Untitled Central Finding'}
                    </Text>
                    <Badge
                        color="blue"
                        variant="filled"
                        className="rounded-full px-3 py-1 text-sm"
                    >
                        {form.values.nonConformity.number || 'Auto-generated number pending'}
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
                                    <Text fw={500} size="sm" className="text-slate-800">
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
                                        Previous Step
                                    </Button>

                                    <Group gap="md">
                                        <Badge
                                            variant="light"
                                            className="bg-slate-100 text-slate-700"
                                        >
                                            Step {activeStep + 1} of {steps.length}
                                        </Badge>

                                        {activeStep === steps.length - 1 ? (
                                            <Button
                                                leftSection={<IconSend size={16} />}
                                                onClick={handleSubmit}
                                                disabled={isLocked}
                                                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/25 rounded-lg"
                                            >
                                                Submit & Close
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleNext}
                                                disabled={isLocked}
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 rounded-lg"
                                            >
                                                Next Step
                                            </Button>
                                        )}
                                        {activeStep < 3 && (
                                            <Button
                                                leftSection={<IconCheck size={16} />}
                                                onClick={handleFirstSubmit}
                                                disabled={isLocked}
                                                className="!bg-gradient-to-r !from-green-500 !to-green-600 hover:!from-green-600 hover:!to-green-700 text-white shadow-lg shadow-green-500/25 rounded-lg"
                                            >
                                                Submit
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
