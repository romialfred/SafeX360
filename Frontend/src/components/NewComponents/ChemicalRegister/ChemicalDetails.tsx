import { useEffect, useState } from 'react';
import { Button, Tabs } from '@mantine/core';
import { IconClipboardCheck, IconEye, IconFlask2, IconHistory, IconPlus } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../UtilityComp/PageHeader';
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
import { normalizeRiskStatus, riskStatusConfig } from './chemicalLabels';

/**
 * Fiche détaillée d'un risque chimique (LOT 50) : synthèse, historique des
 * évaluations et saisie d'une nouvelle évaluation probabilité × gravité.
 */
const ChemicalDetails = () => {
    const { id } = useParams();
    const { t } = useTranslation('risk');
    const tStatusLabel = (status?: string | null): string =>
        t(`status.${normalizeRiskStatus(status)}`, { defaultValue: riskStatusConfig(status).label });
    const [activeTab, setActiveTab] = useState<string | null>('details');
    const [showNewAssessment, setShowNewAssessment] = useState(false);
    const [risk, setRisk] = useState<any>({});
    const [departmentMap, setDepartmentMap] = useState<Record<string, any>>({});
    const [processMap, setProcessMap] = useState<Record<string, any>>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [assessments, setAssessments] = useState<any[]>([]);

    const fetchAssessments = () => {
        getChemicalAnalysisByRisk(id)
            .then((data) => setAssessments(data ?? []))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('chemicalDetail.loadAssessmentsFailed'));
            });
    };

    useEffect(() => {
        getChemicalRiskByID(id)
            .then((data) => setRisk(data))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('chemicalDetail.loadFailed'));
            });
        getAllDepartments()
            .then((data) => setDepartmentMap(mapIdToName(data)))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('errors.loadDepartments'));
            });
        GetAllWorkProcess({})
            .then((data) => setProcessMap(mapIdToName(data)))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('errors.loadProcesses'));
            });
        getEmployeeDropdown()
            .then((data) => setEmpMap(mapIdToName(data)))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('errors.loadEmployees'));
            });
        fetchAssessments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isLockedStatus = ['COMPLETED', 'CANCELLED', 'CLOSED'].includes(normalizeRiskStatus(risk?.status));

    const handleNewAssessment = () => {
        if (isLockedStatus) return;
        setShowNewAssessment(true);
        setActiveTab('assessment');
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.home'), to: '/' },
                    { label: t('common.riskManagement') },
                    { label: t('chemicalRegister.breadcrumb'), to: '/chemical-register' },
                    { label: t('chemicalDetail.breadcrumbDetail') },
                ]}
                icon={<IconFlask2 size={22} stroke={2} />}
                iconColor="violet"
                title={risk?.chemicalName || risk?.title || t('chemicalDetail.fallbackTitle')}
                subtitle={t('chemicalDetail.subtitle')}
                actions={
                    <Button
                        size="sm"
                        color="teal"
                        leftSection={<IconPlus size={14} />}
                        onClick={handleNewAssessment}
                        disabled={isLockedStatus}
                    >
                        {t('chemicalDetail.newAssessment')}
                    </Button>
                }
            />

            {isLockedStatus && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5">
                    <p className="text-[12px] text-slate-600">
                        {t('chemicalDetail.locked', { status: tStatusLabel(risk?.status) })}
                    </p>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <Tabs value={activeTab} onChange={setActiveTab} color="violet">
                    <Tabs.List>
                        <Tabs.Tab value="details" leftSection={<IconEye size={15} />}>
                            {t('chemicalDetail.tabOverview')}
                        </Tabs.Tab>
                        <Tabs.Tab value="history" leftSection={<IconHistory size={15} />}>
                            {t('chemicalDetail.tabHistory')}
                        </Tabs.Tab>
                        {showNewAssessment && (
                            <Tabs.Tab value="assessment" leftSection={<IconClipboardCheck size={15} />}>
                                {t('chemicalDetail.tabNewAssessment')}
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
                            <RiskAssesment
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

export default ChemicalDetails;
