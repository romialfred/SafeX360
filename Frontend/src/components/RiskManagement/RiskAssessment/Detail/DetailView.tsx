import { useEffect, useState } from 'react';
import { Box, Group, Button, Tabs, Breadcrumbs, Text } from '@mantine/core';
import { IconClipboardCheck, IconEye, IconHistory, IconPlus } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { Link, useParams } from 'react-router-dom';
import RiskHistoryTab from './RiskHistoryTab';
import RiskAssessmentTab from './RiskAssessmentTab';
import { getRiskById } from '../../../../services/RiskRegisterService';
import RiskDetailOverview from './RiskDetailOverview';
import { getAllDepartments } from '../../../../services/HrmsService';
import { mapIdToName } from '../../../../utility/OtherUtilities';
import { errorNotification } from '../../../../utility/NotificationUtility';
import { GetAllWorkProcess } from '../../../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../../../services/EmployeeService';
import { getAnalysisByRisk } from '../../../../services/RiskAnalysisService';



const DetailView = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState<any>('details');
    const [showNewAssessment, setShowNewAssessment] = useState(false);
    const [risk, setRisk] = useState<any>({});
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [processMap, setProcessMap] = useState<Record<string, any>>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [assessments, setAssessments] = useState<any[]>([]);


    const assessmentForm = useForm({
        initialValues: {
            reason: '',
            gravity: '',
            probability: '',
            severity: '',
            newControls: '',
            comments: ''
        }
    });

    useEffect(() => {
        getRiskById(id).then((data) => {
            setRisk(data);
        }).catch((error) => {
            console.error("Error fetching risk data:", error);
        });
        fetchDepartments();
        fetchWorkProcesses();
        fetchEmployees();
        fetchAssessments();
    }, [])




    const fetchAssessments = () => {
        getAnalysisByRisk(id).then((data) => {
            setAssessments(data);
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch assessment history");
        });
    }

    const fetchDepartments = () => {
        // Fetch departments from API or service
        getAllDepartments().then((data) => {
            setDepartmentMap(mapIdToName(data));
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch departments");
        });
    };
    const fetchWorkProcesses = () => {
        // Fetch work processes from API or service
        GetAllWorkProcess({}).then((data) => {
            setProcessMap(mapIdToName(data))
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch work processes");
        });
    };
    const fetchEmployees = () => {
        // Fetch employees from API or service
        getEmployeeDropdown().then((data) => {
            setEmpMap(mapIdToName(data))
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch employees");
        });
    };
    const statusUpper = String(risk?.status || '').toUpperCase();
    const isLockedStatus = ['COMPLETED', 'CANCELLED', 'CANCELED', 'CLOSED'].includes(statusUpper);

    const handleNewAssessment = () => {
        if (isLockedStatus) {
            return;
        }
        setShowNewAssessment(true);
        setActiveTab('assessment');
        if (risk) {
            assessmentForm.setValues({
                reason: '',
                gravity: risk.gravity,
                probability: risk.probability,
                severity: risk.severity,
                newControls: '',
                comments: ''
            });
        }
    };


    return <Box>
        <div>
            <div className="text-2xl text-blue-500 w-fit">Risk Details</div>
            <Breadcrumbs mt="xs" mb="lg">
                <Link className="hover:!underline" to="/">
                    <Text variant="gradient">Home</Text>
                </Link>
                <Link className="hover:!underline" to="/risks-register">
                    <Text variant="gradient">Risk Catalog & Tracking</Text>
                </Link>
                <Text variant="gradient">Risk Details</Text>
            </Breadcrumbs>
        </div>

        <div className='border border-gray-300 p-4 rounded-xl shadow-sm bg-white'>
            <Group justify="space-between" mb="md">
                <Group>

                    <p className='text-lg text-blue-500'>{risk?.title}</p>
                </Group>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleNewAssessment}
                    color="green"
                    disabled={isLockedStatus}
                >
                    New Assessment
                </Button>
            </Group>
            {isLockedStatus && (
                <Text size="sm" c="dimmed" mb="sm">
                    Assessments are locked because this risk is {statusUpper.toLowerCase()}.
                </Text>
            )}

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="details" leftSection={<IconEye size={16} />}>
                        Details
                    </Tabs.Tab>
                    <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                        Assessment History
                    </Tabs.Tab>
                    {showNewAssessment && (
                        <Tabs.Tab value="assessment" leftSection={<IconClipboardCheck size={16} />}>
                            New Assessment
                        </Tabs.Tab>
                    )}
                </Tabs.List>

                <Tabs.Panel value="details" pt="md">
                    <RiskDetailOverview risk={risk} departmentMap={departmentMap} processMap={processMap} empMap={empMap} assessment={assessments?.length > 0 ? assessments[assessments.length - 1] : undefined} />
                </Tabs.Panel>

                <Tabs.Panel value="history" pt="md">
                    <RiskHistoryTab revisionHistory={assessments} />
                </Tabs.Panel>

                {showNewAssessment && (
                    <Tabs.Panel value="assessment" pt="md">
                        <RiskAssessmentTab
                            onCancel={() => { setShowNewAssessment(false); setActiveTab('details'); }}
                            assessments={assessments}
                            fetchAssessments={fetchAssessments}
                        />
                    </Tabs.Panel>
                )}
            </Tabs>
        </div>

    </Box>

}

export default DetailView;
