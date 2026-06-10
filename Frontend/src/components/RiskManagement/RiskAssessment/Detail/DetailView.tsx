import { useEffect, useState } from 'react';
import { Button, Tabs } from '@mantine/core';
import { IconClipboardCheck, IconEye, IconFileText, IconHistory, IconPlus } from '@tabler/icons-react';
import { useLocation, useParams } from 'react-router-dom';
import PageHeader from '../../../UtilityComp/PageHeader';
import RiskHistoryTab from './RiskHistoryTab';
import RiskAssessmentTab from './RiskAssessmentTab';
import RiskDetailOverview from './RiskDetailOverview';
import { getRiskById } from '../../../../services/RiskRegisterService';
import { getAllDepartments } from '../../../../services/HrmsService';
import { mapIdToName } from '../../../../utility/OtherUtilities';
import { errorNotification } from '../../../../utility/NotificationUtility';
import { GetAllWorkProcess } from '../../../../services/WorkProcessService';
import { getEmployeeDropdown } from '../../../../services/EmployeeService';
import { getAnalysisByRisk } from '../../../../services/RiskAnalysisService';
import { riskStatusConfig } from '../../riskLabels';

/**
 * Fiche détaillée d'un risque (LOT 50) : synthèse, historique des
 * évaluations et saisie d'une nouvelle évaluation probabilité × gravité.
 * Servie depuis la vue d'ensemble, le registre et l'évaluation des risques.
 */
const DetailView = () => {
    const { id } = useParams();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<string | null>('details');
    const [showNewAssessment, setShowNewAssessment] = useState(false);
    const [risk, setRisk] = useState<any>({});
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [processMap, setProcessMap] = useState<Record<string, any>>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [assessments, setAssessments] = useState<any[]>([]);

    const fetchAssessments = () => {
        getAnalysisByRisk(id)
            .then((data) => setAssessments(data ?? []))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || "Échec du chargement de l'historique des évaluations");
            });
    };

    useEffect(() => {
        getRiskById(id)
            .then((data) => setRisk(data))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || "Le risque n'a pas pu être chargé");
            });
        getAllDepartments()
            .then((data) => setDepartmentMap(mapIdToName(data)))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || 'Échec du chargement des départements');
            });
        GetAllWorkProcess({})
            .then((data) => setProcessMap(mapIdToName(data)))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || 'Échec du chargement des processus');
            });
        getEmployeeDropdown()
            .then((data) => setEmpMap(mapIdToName(data)))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || 'Échec du chargement des employés');
            });
        fetchAssessments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const statusUpper = String(risk?.status || '').toUpperCase();
    const isLockedStatus = ['COMPLETED', 'CANCELLED', 'CANCELED', 'CLOSED'].includes(statusUpper);

    const handleNewAssessment = () => {
        if (isLockedStatus) return;
        setShowNewAssessment(true);
        setActiveTab('assessment');
    };

    // Le fil d'Ariane reflète la page d'origine (vue d'ensemble, registre ou évaluation)
    const parent = location.pathname.startsWith('/risks-overview')
        ? { label: "Vue d'ensemble", to: '/risks-overview' }
        : location.pathname.startsWith('/risks-assessment')
            ? { label: 'Évaluation des risques', to: '/risks-assessment' }
            : { label: 'Registre des risques', to: '/risks-register' };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Risques' },
                    parent,
                    { label: 'Détail du risque' },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="red"
                title={risk?.title || 'Détail du risque'}
                subtitle="Synthèse du risque, historique des évaluations et nouvelle évaluation"
                actions={
                    <Button
                        size="sm"
                        color="teal"
                        leftSection={<IconPlus size={14} />}
                        onClick={handleNewAssessment}
                        disabled={isLockedStatus}
                    >
                        Nouvelle évaluation
                    </Button>
                }
            />

            {isLockedStatus && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5">
                    <p className="text-[12px] text-slate-600">
                        Les évaluations sont verrouillées : ce risque est au statut « {riskStatusConfig(risk?.status).label} ».
                    </p>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <Tabs value={activeTab} onChange={setActiveTab} color="teal">
                    <Tabs.List>
                        <Tabs.Tab value="details" leftSection={<IconEye size={15} />}>
                            Synthèse
                        </Tabs.Tab>
                        <Tabs.Tab value="history" leftSection={<IconHistory size={15} />}>
                            Historique des évaluations
                        </Tabs.Tab>
                        {showNewAssessment && (
                            <Tabs.Tab value="assessment" leftSection={<IconClipboardCheck size={15} />}>
                                Nouvelle évaluation
                            </Tabs.Tab>
                        )}
                    </Tabs.List>

                    <Tabs.Panel value="details" pt="md">
                        <RiskDetailOverview
                            risk={risk}
                            departmentMap={departmentMap}
                            processMap={processMap}
                            empMap={empMap}
                            assessment={assessments?.length > 0 ? assessments[assessments.length - 1] : undefined}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="history" pt="md">
                        <RiskHistoryTab revisionHistory={assessments} />
                    </Tabs.Panel>

                    {showNewAssessment && (
                        <Tabs.Panel value="assessment" pt="md">
                            <RiskAssessmentTab
                                onCancel={() => {
                                    setShowNewAssessment(false);
                                    setActiveTab('details');
                                }}
                                assessments={assessments}
                                fetchAssessments={fetchAssessments}
                            />
                        </Tabs.Panel>
                    )}
                </Tabs>
            </div>
        </div>
    );
};

export default DetailView;
