import { useEffect, useState } from 'react';
import { Group, Button, Tabs, Breadcrumbs, Text } from '@mantine/core';
import { IconClipboardCheck, IconEye, IconHistory, IconPlus } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { Link, useParams } from 'react-router-dom';
import { errorNotification } from '../../../utility/NotificationUtility';
import { getAllDepartments } from '../../../services/HrmsService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { GetAllWorkProcess } from '../../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../../services/EmployeeService';
import RiskDetailOverview from '../../RiskManagement/RiskAssessment/Detail/RiskDetailOverview';
import RiskHistoryTab from '../../RiskManagement/RiskAssessment/Detail/RiskHistoryTab';
import RiskAssesment from './RiskAssesment';
import { getChemicalRiskByID } from '../../../services/RiskIdentificationService';
import { getChemicalAnalysisByRisk } from '../../../services/ChemicalRiskAnalysisService';



const ChemicalDetails = () => {
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
        getChemicalRiskByID(id).then((data) => {
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
        getChemicalAnalysisByRisk(id).then((data) => {
            setAssessments(data);
        }).catch((error) => {
            errorNotification(error.response?.data?.errorMessage || "Failed to fetch assessment history");
        });
    }

    const fetchDepartments = () => {

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
    const handleNewAssessment = () => {
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
    return (
        <div className='p-5 flex flex-col gap-10'>
            <div>
                <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Chemical Risk Assesment</div>
                <Breadcrumbs className="" mt="xs">
                    <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                    <Link className="hover:!underline" to="/chemical-register" ><Text variant="gradient" className="hover:!underline cursor-pointer">Chemical Register</Text></Link>
                    <Text variant="gradient">Chemical Risk Assesment</Text>
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
                    >
                        New Assessment
                    </Button>
                </Group>

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
                            <RiskAssesment
                                onCancel={() => { setShowNewAssessment(false); setActiveTab('details'); }}
                                assessments={assessments}
                                fetchAssessments={fetchAssessments}
                            />
                        </Tabs.Panel>
                    )}
                </Tabs>
            </div>

        </div>
    )
}

export default ChemicalDetails