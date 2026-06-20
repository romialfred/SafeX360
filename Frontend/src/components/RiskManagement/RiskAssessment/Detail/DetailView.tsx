import { useEffect, useState } from 'react';
import { Button, Tabs } from '@mantine/core';
import { IconClipboardCheck, IconEye, IconFileText, IconHistory, IconLayersIntersect, IconPlus } from '@tabler/icons-react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import RiskControlPanel from '../../RiskControlPanel';

/**
 * Fiche détaillée d'un risque (LOT 50) : synthèse, historique des
 * évaluations et saisie d'une nouvelle évaluation probabilité × gravité.
 * Servie depuis la vue d'ensemble, le registre et l'évaluation des risques.
 */
const DetailView = () => {
    const { id } = useParams();
    const location = useLocation();
    const { t } = useTranslation('risk');
    const tStatusLabel = (status?: string | null): string =>
        t(`status.${String(status ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')}`, { defaultValue: riskStatusConfig(status).label });
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
                errorNotification(error.response?.data?.errorMessage || t('detailView.loadAssessmentsFailed'));
            });
    };

    useEffect(() => {
        getRiskById(id)
            .then((data) => setRisk(data))
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || t('detailView.loadFailed'));
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

    const statusUpper = String(risk?.status || '').toUpperCase();
    const isLockedStatus = ['COMPLETED', 'CANCELLED', 'CANCELED', 'CLOSED'].includes(statusUpper);

    const handleNewAssessment = () => {
        if (isLockedStatus) return;
        setShowNewAssessment(true);
        setActiveTab('assessment');
    };

    // Le fil d'Ariane reflète la page d'origine (vue d'ensemble, registre ou évaluation)
    const parent = location.pathname.startsWith('/risks-overview')
        ? { label: t('detailView.overviewParent'), to: '/risks-overview' }
        : location.pathname.startsWith('/risks-assessment')
            ? { label: t('detailView.assessmentParent'), to: '/risks-assessment' }
            : { label: t('detailView.registerParent'), to: '/risks-register' };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: t('common.home'), to: '/' },
                    { label: t('common.riskManagement') },
                    parent,
                    { label: t('detailView.breadcrumbDetail') },
                ]}
                icon={<IconFileText size={22} stroke={2} />}
                iconColor="red"
                title={risk?.title || t('detailView.fallbackTitle')}
                subtitle={t('detailView.subtitle')}
                actions={
                    <Button
                        size="sm"
                        color="teal"
                        leftSection={<IconPlus size={14} />}
                        onClick={handleNewAssessment}
                        disabled={isLockedStatus}
                    >
                        {t('detailView.newAssessment')}
                    </Button>
                }
            />

            {isLockedStatus && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5">
                    <p className="text-[12px] text-slate-600">
                        {t('detailView.locked', { status: tStatusLabel(risk?.status) })}
                    </p>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <Tabs value={activeTab} onChange={setActiveTab} color="teal">
                    <Tabs.List>
                        <Tabs.Tab value="details" leftSection={<IconEye size={15} />}>
                            {t('detailView.tabOverview')}
                        </Tabs.Tab>
                        <Tabs.Tab value="history" leftSection={<IconHistory size={15} />}>
                            {t('detailView.tabHistory')}
                        </Tabs.Tab>
                        <Tabs.Tab value="controls" leftSection={<IconLayersIntersect size={15} />}>
                            Plan de maîtrise
                        </Tabs.Tab>
                        {showNewAssessment && (
                            <Tabs.Tab value="assessment" leftSection={<IconClipboardCheck size={15} />}>
                                {t('detailView.tabNewAssessment')}
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

                    <Tabs.Panel value="controls" pt="md">
                        {(risk?.id ?? id) && (
                            <RiskControlPanel sourceType="RISK" riskId={Number(risk?.id ?? id)} />
                        )}
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
