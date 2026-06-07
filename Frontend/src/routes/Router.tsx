import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import EmergencySettingsPage from '../components/EmergencyManagement/Settings/EmergencySettingsPage';
import AssemblyPointsPage from '../components/EmergencyManagement/AssemblyPoints/AssemblyPointsPage';
import AssemblyPointFormPage from '../components/EmergencyManagement/AssemblyPoints/AssemblyPointFormPage';
import AssemblyPointDetailPage from '../components/EmergencyManagement/AssemblyPoints/AssemblyPointDetailPage';
import SosListPage from '../components/EmergencyManagement/Sos/SosListPage';
import SosDetailPage from '../components/EmergencyManagement/Sos/SosDetailPage';
import GeneralAlertDetailPage from '../components/EmergencyManagement/GeneralAlert/GeneralAlertDetailPage';
import EmergencyDashboardPage from '../components/EmergencyManagement/Dashboard/EmergencyDashboardPage';

import DashboardPage from '../pages/dashboard/DashboardPage';
import ProfilePage from '../pages/dashboard/ProfilePage';
import NotFound from '../pages/NotFoundPage';
import AboutPage from '../pages/dashboard/AboutPage';
import LayoutPage from '../pages/LayoutPage';
import HomePage from '../pages/dashboard/HomePage';

import CorrectivePage from '../pages/dashboard/LaggingIndicator/CorrectiveAction/CorrectivePage';
import AddCorrectivePage from '../pages/dashboard/LaggingIndicator/CorrectiveAction/AddCorrectivePage';
import UpdateCorrectivePage from '../pages/dashboard/LaggingIndicator/CorrectiveAction/UpdateCorrectivePage';
import LaggingIndicatorPage from '../pages/dashboard/LaggingIndicator/Incident/LaggingIndicatorPage';
import AddIncidentsPage from '../pages/dashboard/LaggingIndicator/Incident/AddIncidentsPage';
import PgiPage from '../pages/dashboard/LeadingIndicator/PGI/PgiPage';
import AddPgiPage from '../pages/dashboard/LeadingIndicator/PGI/AddPgiPage';
import CalenderPage from '../pages/dashboard/LeadingIndicator/PGI/CalenderPage';
import AuditPage from '../pages/dashboard/LaggingIndicator/AuditManagement/AuditPage';
import AddAuditPage from '../pages/dashboard/LaggingIndicator/AuditManagement/AddAuditPage';
import EditUserPermission from '../components/NewComponents/UsersManagement/EditUserPermission';
import EditAuditPage from '../pages/dashboard/LaggingIndicator/AuditManagement/EditAuditPage';
import ProtectedRoute from './ProtectedRoutes';
import IncidentCategoryPage from '../pages/dashboard/SettingFolder/IncidentCategory/IncidentCategoryPage';
import IncidentTypePage from '../pages/dashboard/SettingFolder/IncidentType/IncidentTypePage';
import SeverityLevelPage from '../pages/dashboard/SettingFolder/Severity Level/SeverityLevelPage';
import LocationPage from '../pages/dashboard/SettingFolder/Location/LocationPage';
import WeatherPage from '../pages/dashboard/SettingFolder/WeatherConditions/WeatherPage';
import BodyPartsPage from '../pages/dashboard/SettingFolder/BodyParts/BodyPartsPage';
import ViewDetailsPage from '../pages/dashboard/LaggingIndicator/Incident/ViewDetailsPage';
import UpdateIncidentsPage from '../pages/dashboard/LaggingIndicator/Incident/UpdateIncidentsPage';
import TeamSetupPage from '../pages/dashboard/SettingFolder/TeamSetup/TeamSetupPage';
import AddTeamPage from '../pages/dashboard/SettingFolder/TeamSetup/AddTeamPage';
import DetailsPage from '../pages/dashboard/LaggingIndicator/CorrectiveAction/DetailsPage';
import CheckListPage from '../pages/dashboard/SettingFolder/CheckList/CheckListPage';
import TechMeasurementsPage from '../pages/dashboard/SettingFolder/TechMeasurement/TechMeasurementsPage';
import InspectionPage from '../pages/dashboard/LeadingIndicator/PGI/InspectionPage';
import ComingSoonPage from '../pages/ComingSoonPage';
import PublicRoutes from './PublicRoutes';
import ViewDeatailsPgiPage from '../pages/dashboard/LeadingIndicator/PGI/ViewDeatailsPgiPage';
import HealthMeetingPage from '../pages/dashboard/LeadingIndicator/Hs-Meetings/HealthMeetingPage';
import AddHealthMeetingPage from '../pages/dashboard/LeadingIndicator/Hs-Meetings/AddHealthMeetingPage';
import EditHealthMeetingPage from '../pages/dashboard/LeadingIndicator/Hs-Meetings/EditHealthMeetingPage';
import ActivityReportPage from '../pages/dashboard/LeadingIndicator/Hs-Meetings/ActivityReportPage';
import ExecuteAuditPage from '../pages/dashboard/LaggingIndicator/AuditManagement/ExecuteAuditPage';
import RecommendationPage from '../pages/dashboard/LaggingIndicator/AuditManagement/RecommendationPage';
import UpdateRecommendationPage from '../pages/dashboard/LaggingIndicator/AuditManagement/UpdateRecommendationPage';
import AuditAreaPage from '../pages/dashboard/SettingFolder/AuditArea/AuditAreaPage';
import ViewDetailsMeetingPage from '../pages/dashboard/LeadingIndicator/Hs-Meetings/ViewDetailsMeetingPage';
import UpdateTeamPage from '../pages/dashboard/SettingFolder/TeamSetup/UpdateTeamPage';
import TeamDetailsPage from '../pages/dashboard/SettingFolder/TeamSetup/TeamDetailsPage';
import RecommendationDetailsPage from '../pages/dashboard/LaggingIndicator/AuditManagement/RecommendationDetailsPage';
import CompDashboardPage from '../pages/dashboard/ComplianceManagemennt/CompDashboardPage';
import MbaCardPage from '../pages/dashboard/LeadingIndicator/MbaCard/MbaCardPage';
import AddCardPage from '../pages/dashboard/LeadingIndicator/MbaCard/AddCardPage';
import CompRequirementPage from '../pages/dashboard/ComplianceManagemennt/CompRequirementPage';
import AddRequirementPage from '../pages/dashboard/ComplianceManagemennt/AddRequirementPage';
import EditRequirementPage from '../pages/dashboard/ComplianceManagemennt/EditRequirementPage';
import CompAssignmentPage from '../pages/dashboard/ComplianceManagemennt/CompAssignmentPage';
import AssignDetailsPage from '../pages/dashboard/ComplianceManagemennt/AssignDetailsPage';
import CompDocumentPage from '../pages/dashboard/ComplianceManagemennt/CompDocumentPage';
import UploadDocumentPage from '../pages/dashboard/ComplianceManagemennt/UploadDocumentPage';
import DetailDocumentPage from '../pages/dashboard/ComplianceManagemennt/DetailDocumentPage';
import EmployeeAssignmentPage from '../pages/dashboard/ComplianceManagemennt/EmployeeAssignmentPage';
import EmployeeDetailsPage from '../pages/dashboard/ComplianceManagemennt/EmployeeDetailsPage';
import EditScheduleAuditPage from '../pages/dashboard/LaggingIndicator/AuditManagement/EditScheduleAuditPage';
import DocumentValidationPage from '../pages/dashboard/ComplianceManagemennt/DocumentValidationPage';
import LessonLearnPage from '../pages/dashboard/LaggingIndicator/LessonLearn/LessonLearnPage';
import LessonDetailsPage from '../pages/dashboard/LaggingIndicator/LessonLearn/LessonDetailsPage';
import OhsDashboardPage from '../pages/OhsDashboardPage';
import WorkAreaPage from '../pages/dashboard/SettingFolder/WorkArea/WorkAreaPage';
import WorkProcessPage from '../pages/dashboard/SettingFolder/WorkProcess/WorkProcessPage';
import InvestigationPage from '../pages/dashboard/LaggingIndicator/Incident/InvestigationPage';
import InvestigationFilePage from '../pages/dashboard/LaggingIndicator/Investigation/InvestigationFilePage';
import UpdateInvestigationPage from '../pages/dashboard/LaggingIndicator/Investigation/UpdateInvestigationPage';
import AuditorPage from '../pages/dashboard/SettingFolder/Auditor/AuditorPage';
import NewAuditPlanPage from '../pages/dashboard/LaggingIndicator/AuditManagement/NewAuditPlanPage';
import AuditDetailsTabsPage from '../pages/dashboard/LaggingIndicator/AuditManagement/AuditDetailsTabsPage';
import NonConformityDashboard from '../components/LeadingIndicator/Non-conformity/NonConformityDashboard';
import ModuleGuard from './ModuleGuard';
import DemoPermissionGuard from './DemoPermissionGuard';
import NonConformityForm from '../components/LeadingIndicator/Non-conformity/NonConformityForm';
import NonConformityDetails from '../components/LeadingIndicator/Non-conformity/details/NonConformityDetails';
import NonConformityEditPage from '../pages/NonConformityEditPage';
import AnnualPlaningGridPage from '../pages/dashboard/AnnualPlaning/AnnualPlaningGridPage';
import AnnualAuditPlanPage from '../pages/dashboard/AnnualPlaning/AnnualAuditPlanPage';
import ThemeManagementPage from '../pages/dashboard/AnnualPlaning/ThemeManagementPage';
import NewAuditPlanPages from '../pages/dashboard/AnnualPlaning/NewAuditPlanPages';
import EditNewAuditPlanPage from '../pages/dashboard/AnnualPlaning/EditNewAuditPlanPage';
import SteeringTourPage from '../pages/dashboard/LeadingIndicator/ManagementTour/SteeringTourPage';
import PgiDetailsTabPage from '../pages/dashboard/LeadingIndicator/PGI/PgiDetailsTabPage';
import MeetingDetailsTabsPage from '../pages/dashboard/LeadingIndicator/Hs-Meetings/MeetingDetailsTabsPage';
import AddTourPage from '../pages/dashboard/LeadingIndicator/ManagementTour/AddTourPage';
import SteeringDetailsPage from '../pages/dashboard/LeadingIndicator/ManagementTour/SteeringDetailsPage';
import EditPgiPage from '../pages/dashboard/LeadingIndicator/PGI/EditPgiPage';
import EditTourPage from '../pages/dashboard/LeadingIndicator/ManagementTour/EditTourPage';
import PpeManagementPage from '../pages/dashboard/RiskManagement/PpeManagementPage';
import RiskOverviewPage from '../pages/dashboard/RiskManagement/RiskOverviewPage';
import RiskRegisterPage from '../pages/dashboard/RiskManagement/RiskRegisterPage';
import PPECreateFormPage from '../pages/dashboard/RiskManagement/PPECreateFormPage';
import PPEStockEntryFormPage from '../pages/dashboard/RiskManagement/PPEStockEntryFormPage';
import PPERequestTablePage from '../pages/dashboard/RiskManagement/PPERequestTablePage';
import DetailViewPage from '../pages/dashboard/RiskManagement/DetailViewPage';
import RegisterFormPage from '../pages/dashboard/RiskManagement/RegisterFormPage';
import PPEEmployeeDetailsPage from '../pages/dashboard/RiskManagement/PPEEmployeeDetailsPage';
import NotificationsManagement from '../components/CommunicationManagement/NotificationsManagement';
import EmployeeCommunications from '../components/CommunicationManagement/EmployeeCommunications';
import DocumentManagement from '../components/DocumentManagment/DocumentManagement';
import NewCommunicationPage from '../pages/dashboard/Communication/NewCommunicationPage';
import EditCommunicationPage from '../pages/dashboard/Communication/EditCommunicationPage';
import CommunicationDetailsPage from '../pages/dashboard/Communication/CommunicationDetailsPage';
import NotificationTabsPage from '../pages/dashboard/Communication/NotificationTabsPage';
import CreateDocumentPage from '../pages/dashboard/DocumentsManagement/CreateDocumentPage';
import DocumentTabsPage from '../pages/dashboard/DocumentsManagement/DocumentTabsPage';
import CommunicationDashboardPage from '../pages/dashboard/Communication/CommunicationDashboardPage';
import PPEMonitoring from '../components/PPEManagement/PPEMonitoring';
import SettingsPage from '../components/NewComponents/Settings/Settings';
import ModulesManagementPage from '../components/NewComponents/Settings/ModulesManagementPage';
import OperationalReferencesPage from '../components/NewComponents/OperationalReferences/OperationalReferencesPage';
import ISODocuments from '../components/NewComponents/ISODocuments/ISODocuments';
import UserManagementTabsPage from '../pages/dashboard/UserManagementTabsPage';
import UserDetails from '../components/NewComponents/UsersManagement/UserDetails';
import Guide from '../components/NewComponents/HelpCenter/Guide';
import FeatureOverview from '../components/NewComponents/HelpCenter/FeatureOverview';
import LoginsPage from '../components/NewComponents/LoginPage/LoginsPage';
import PasswordPage from '../components/NewComponents/LoginPage/PasswordPage';
import AddUserForm from '../components/NewComponents/UsersManagement/AddUserForm';

import TargetAndForecastPage from '../pages/TargetAndForecastPage';
import AdvancedConfigurationPage from '../pages/AdvancedConfigurationPage';

import PendingActions from '../components/NewComponents/AdhocActions/PendingActions';
import AIAssistant from '../components/NewComponents/AiAssistant/AIAssistant';
import AdhocActions from '../components/NewComponents/AdhocActions/AdhocActions';
import ChemicalRegister from '../components/NewComponents/ChemicalRegister/ChemicalRegister';
import ChemicalRiskForms from '../components/NewComponents/ChemicalRegister/ChemicalRiskForms';
import EditChemicalRisk from '../components/NewComponents/ChemicalRegister/EditChemicalRisk';
import MonthlyReports from '../components/NewComponents/Reports/MonthlyReports';
import KpiReview from '../components/NewComponents/Reports/KpiReview';
import PerformanceReport from '../components/NewComponents/Reports/PerformanceReport';
import CorporateReports from '../components/NewComponents/Reports/CorporateReports';
import ExecutiveReports from '../components/NewComponents/Reports/ExecutiveReports';
import TrendAnalysis from '../components/NewComponents/Reports/TrendAnalysis';
import TechnicalDocumentation from '../components/NewComponents/HelpCenter/TechnicalDocumentation';
import WorkProcess from '../components/NewComponents/WorkProcess/WorkProcess';
import RiskAssessmentPage from '../pages/dashboard/RiskManagement/RiskAssessmentPage';
import EditRegisterFormPage from '../pages/dashboard/RiskManagement/EditRegisterFormPage';
import AdhocActionsForm from '../components/NewComponents/AdhocActions/AdhocActionsForm';
import UpdateAdhocAction from '../components/NewComponents/AdhocActions/UpdateAdhocAction';
import AdhocActionDetails from '../components/NewComponents/AdhocActions/AdhocActionDetails';
import EditAdhocAction from '../components/NewComponents/AdhocActions/EditAdhocAction';
import ChemicalDetails from '../components/NewComponents/ChemicalRegister/ChemicalDetails';
import ModuleNotFoundPage from '../pages/dashboard/ModuleNotFoundPage';
import IsoMappingPage from '../pages/dashboard/IsoMappingPage';
// LOT — Module Dosimetrie & Expositions
import DosimetryParametersPage from '../components/Dosimetry/DosimetryParametersPage';
import ExposedWorkersRegistryPage from '../components/Dosimetry/ExposedWorkersRegistryPage';
import ExposedWorkerDetailPage from '../components/Dosimetry/ExposedWorkerDetailPage';
import ExposedWorkerForm from '../components/Dosimetry/ExposedWorkerForm';
import DosimetersInventoryPage from '../components/Dosimetry/DosimetersInventoryPage';
import DosimeterAssignmentForm from '../components/Dosimetry/DosimeterAssignmentForm';
import QRScannerPage from '../components/Dosimetry/QRScannerPage';
import DoseEntryForm from '../components/Dosimetry/DoseEntryForm';
import DoseTrackingPage from '../components/Dosimetry/DoseTrackingPage';
import CsvImportWizard from '../components/Dosimetry/CsvImportWizard';
import DosimetryThresholdsPage from '../components/Dosimetry/DosimetryThresholdsPage';
import ExposureAlertsPage from '../components/Dosimetry/ExposureAlertsPage';
import OverexposureCasesPage from '../components/Dosimetry/OverexposureCasesPage';
import OverexposureCaseDetailPage from '../components/Dosimetry/OverexposureCaseDetailPage';
import OverexposureCaseForm from '../components/Dosimetry/OverexposureCaseForm';
// Phase 6 Frontend-A — gestion des points de mesure d'ambiance
import MeasurementPointsPage from '../components/Dosimetry/MeasurementPointsPage';
import MeasurementPointForm from '../components/Dosimetry/MeasurementPointForm';
import MeasurementPointDetailPage from '../components/Dosimetry/MeasurementPointDetailPage';
import AmbientMonitoringMapPage from '../components/Dosimetry/AmbientMonitoringMapPage';
// Phase 6 Frontend-B — campagnes de surveillance d'ambiance
import MonitoringCampaignsPage from '../components/Dosimetry/MonitoringCampaignsPage';
import MonitoringCampaignForm from '../components/Dosimetry/MonitoringCampaignForm';
import MonitoringCampaignDetailPage from '../components/Dosimetry/MonitoringCampaignDetailPage';
// Phase 6 Frontend-C — profils d'exposition et liens point de mesure x fraction
import ExposureProfileLinksPage from '../components/Dosimetry/ExposureProfileLinksPage';
import ExposureProfileLinkEditor from '../components/Dosimetry/ExposureProfileLinkEditor';
// Phase 7 Frontend-A — Surveillance medicale (visites + aptitudes)
import MedicalVisitsPlanningPage from '../components/Dosimetry/MedicalVisitsPlanningPage';
import MedicalVisitForm from '../components/Dosimetry/MedicalVisitForm';
import WorkerMedicalDossierPage from '../components/Dosimetry/WorkerMedicalDossierPage';
import FitnessAssessmentForm from '../components/Dosimetry/FitnessAssessmentForm';
// Phase 7 Frontend-B — Espace personnel travailleur (My Medical)
import MyMedicalAreaPage from '../components/Dosimetry/MyMedicalAreaPage';
// Phase 9-B Frontend : rapports PDF + exports reglementaires (ASN/IRSN/Ministere)
import DosimetryReportsPage from '../components/Dosimetry/DosimetryReportsPage';
import RegulatoryExportsPage from '../components/Dosimetry/RegulatoryExportsPage';
// Phase 8 Frontend — Dashboard executif KPI dosimetrie
import DosimetryDashboardPage from '../components/Dosimetry/DosimetryDashboardPage';






const handleBackToUsers = () => {
    console.log("Back to users clicked");
};

const handleCreateUser = (userData: Partial<any>) => {
    console.log("New user created:", userData);
};

const router = createBrowserRouter([
    {
        path: '/landing',
        element: <LayoutPage />,
    },
    {
        path: '/login',
        element: <PublicRoutes><LoginsPage /></PublicRoutes>,

    },

    {
        path: '/forget-password',
        element: <PublicRoutes><PasswordPage /></PublicRoutes>,
    },

    {
        path: '/',
        element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
        children: [
            { path: '', element: <HomePage /> },
            { path: 'module-not-found', element: <ModuleNotFoundPage /> },
            { path: 'old', element: <DashboardPage /> },
            { path: 'dashboard', element: <OhsDashboardPage /> },
            { path: 'profile', element: <ProfilePage /> },
            { path: 'about', element: <AboutPage /> },
            { path: 'iso-mapping', element: <IsoMappingPage /> },
            { path: 'incidents', element: <ModuleGuard moduleId='incident-management'><LaggingIndicatorPage /></ModuleGuard>, },
            { path: 'incidents/report', element: <ModuleGuard moduleId='incident-management'><AddIncidentsPage /></ModuleGuard> },
            { path: 'incidents/:id', element: <ModuleGuard moduleId='incident-management'><ViewDetailsPage /></ModuleGuard> },
            { path: 'incidents/investigation/:id', element: <ModuleGuard moduleId='investigations'><InvestigationPage /></ModuleGuard> },
            { path: 'incidents/edit/:id', element: <ModuleGuard moduleId='incident-management'><UpdateIncidentsPage /></ModuleGuard> },


            { path: 'investigation', element: <InvestigationFilePage />, },
            { path: 'investigation/update/:id', element: <UpdateInvestigationPage />, },

            { path: 'hs-activities-planning', element: <AnnualPlaningGridPage />, },
            { path: 'month-theme-subjects', element: <ThemeManagementPage />, },
            { path: 'annual-audit-plan', element: <AnnualAuditPlanPage />, },
            { path: 'annual-audit-plan/details/:id', element: <AuditDetailsTabsPage />, },
            { path: 'annual-audit-plan/new-auditplan', element: <NewAuditPlanPages />, },
            { path: 'annual-audit-plan/edit-auditplan/:id', element: <EditNewAuditPlanPage />, },



            { path: 'corrective', element: <CorrectivePage />, },
            { path: 'corrective/report', element: <AddCorrectivePage />, },
            { path: 'corrective/details/:id/:type', element: <DetailsPage />, },
            { path: 'corrective/update/:id', element: <UpdateCorrectivePage />, },

            { path: 'PGI', element: <PgiPage />, },
            { path: 'PGI/report', element: <AddPgiPage />, },
            { path: 'PGI/calendar', element: <CalenderPage />, },
            { path: 'PGI/inspection/:id', element: <InspectionPage />, },
            { path: 'PGI/edit/:id', element: <EditPgiPage />, },
            { path: 'PGI/viewPgi/:id', element: <ViewDeatailsPgiPage />, },
            { path: 'PGI/details-pgi/:id', element: <PgiDetailsTabPage />, },

            { path: 'audit-recommendations', element: <RecommendationPage />, },
            { path: 'audit-recommendations/details/:id', element: <RecommendationDetailsPage />, },
            { path: 'audit-recommendations/update/:id', element: <UpdateRecommendationPage />, },

            { path: 'ppe-management', element: <ModuleGuard moduleId='ppe-overview'><PpeManagementPage /></ModuleGuard>, },
            { path: 'ppe-management/create-ppe', element: <ModuleGuard moduleId='ppe-overview'><PPECreateFormPage /></ModuleGuard>, },
            { path: 'ppe-management/stock-form', element: <ModuleGuard moduleId='ppe-overview'><PPEStockEntryFormPage /></ModuleGuard>, },
            { path: 'ppe-management/request-table', element: <ModuleGuard moduleId='ppe-request'><PPERequestTablePage /></ModuleGuard>, },
            { path: 'ppe-request', element: <ModuleGuard moduleId='ppe-request'><PPERequestTablePage /></ModuleGuard>, },
            { path: "ppe-management/ppe-details/:id", element: <ModuleGuard moduleId='ppe-overview'><PPEEmployeeDetailsPage /></ModuleGuard> },

            { path: 'notifications', element: <ModuleGuard moduleId='notifications'><NotificationsManagement /></ModuleGuard>, },
            { path: "notifications/notifications-details/:id", element: <NotificationTabsPage /> },

            { path: 'communications', element: <ModuleGuard moduleId='employee-comm'><EmployeeCommunications /></ModuleGuard>, },
            { path: 'communications/create-communications', element: <ModuleGuard moduleId='employee-comm'><NewCommunicationPage /></ModuleGuard>, },
            { path: 'communications/edit/:id', element: <ModuleGuard moduleId="employee-comm"><EditCommunicationPage /></ModuleGuard> },
            { path: "communications/communications-details/:id", element: <ModuleGuard moduleId='employee-comm'><CommunicationDetailsPage /></ModuleGuard> },

            { path: 'communication-dashboard', element: <ModuleGuard moduleId='comm-dashboard'><CommunicationDashboardPage /></ModuleGuard>, },

            { path: 'document-management', element: <ModuleGuard moduleId='documents'><DocumentManagement /></ModuleGuard>, },
            { path: 'document-management/create-document', element: <ModuleGuard moduleId='documents'><CreateDocumentPage /></ModuleGuard>, },
            { path: "document-management/document-details/:id", element: <ModuleGuard moduleId='documents'><DocumentTabsPage /></ModuleGuard> },

            { path: "risks-overview", element: <ModuleGuard moduleId='risk-overview'><RiskOverviewPage /></ModuleGuard> },
            { path: "risks-overview/risk-details/:id", element: <ModuleGuard moduleId='risk-overview'><DetailViewPage /></ModuleGuard> },
            { path: "risks-assessment", element: <ModuleGuard moduleId='risk-assessment'><RiskAssessmentPage /></ModuleGuard> },
            { path: "risks-assessment/register-details/:id", element: <ModuleGuard moduleId='risk-assessment'><DetailViewPage /></ModuleGuard> },
            { path: "ppe-monitoring", element: <ModuleGuard moduleId='ppe-monitoring'><PPEMonitoring /></ModuleGuard> },
            { path: "ppe-monitoring/details/:id", element: <ModuleGuard moduleId='ppe-monitoring'><PPEEmployeeDetailsPage /></ModuleGuard> },
            { path: "risks-register", element: <ModuleGuard moduleId='risk-register'><RiskRegisterPage /></ModuleGuard> },
            { path: 'risks-register/register-form', element: <ModuleGuard moduleId='risk-register'><RegisterFormPage /></ModuleGuard>, },
            { path: 'risks-register/edit/:id', element: <ModuleGuard moduleId='risk-register'><EditRegisterFormPage /></ModuleGuard>, },
            { path: "risks-register/register-details/:id", element: <ModuleGuard moduleId='risk-register'><DetailViewPage /></ModuleGuard> },

            { path: 'lesson-learn', element: <LessonLearnPage />, },
            { path: 'lesson-learn/lesson-details/:id', element: <LessonDetailsPage /> },

            { path: 'audit-management', element: <AuditPage />, },
            { path: 'audit-management/schedule', element: <AddAuditPage />, },
            { path: 'audit-management/new-audit', element: <NewAuditPlanPage />, },
            { path: 'audit-management/edit-audit', element: <EditAuditPage />, },
            { path: 'audit-management/execute/:id', element: <ExecuteAuditPage />, },
            // { path: 'audit-management/details/:id', element: <ViewDetailsAuditPage />, },
            { path: 'audit-management/details/:id', element: <AuditDetailsTabsPage />, },
            { path: 'audit-management/edit-schedule/:id', element: <EditScheduleAuditPage />, },


            { path: 'incidentCategory', element: <IncidentCategoryPage />, },
            { path: 'incidentType', element: <IncidentTypePage />, },
            { path: 'severityLevel', element: <SeverityLevelPage />, },
            { path: 'location', element: <LocationPage />, },
            { path: 'weatherCondition', element: <WeatherPage />, },
            { path: 'bodyParts', element: <BodyPartsPage />, },
            { path: 'team-setup', element: <TeamSetupPage />, },
            { path: 'team-setup/edit/:id', element: <UpdateTeamPage />, },
            { path: 'team-setup/details/:id', element: <TeamDetailsPage />, },
            { path: 'addTeam', element: <AddTeamPage />, },
            { path: 'checkList', element: <CheckListPage />, },
            { path: 'technical-Measurements', element: <TechMeasurementsPage />, },
            { path: 'audit-area', element: <AuditAreaPage />, },
            { path: 'work-area', element: <WorkAreaPage />, },
            { path: 'work-process', element: <WorkProcessPage />, },
            { path: 'auditor', element: <AuditorPage />, },


            { path: 'mba-management', element: <MbaCardPage />, },
            { path: 'mba-management/new-card', element: <AddCardPage />, },

            { path: 'non-conformity', element: <ModuleGuard moduleId='non-conformity'><NonConformityDashboard /></ModuleGuard>, },
            { path: 'non-conformity/create', element: <ModuleGuard moduleId='non-conformity'><NonConformityForm /></ModuleGuard>, },
            { path: 'non-conformity/:id', element: <ModuleGuard moduleId='non-conformity'><NonConformityDetails /></ModuleGuard> },
            { path: 'non-conformity/edit/:id', element: <ModuleGuard moduleId='non-conformity'><NonConformityEditPage /></ModuleGuard>, },

            // LOT 48 Phase 1 — Routes Module Gestion des Urgences (settings opérationnels, autres pages V2-V6)
            { path: 'emergency/settings', element: <EmergencySettingsPage /> },
            // LOT 48 Phase 2 — Points de rassemblement (carte + table + GPS capture + history)
            { path: 'emergency/assembly-points', element: <AssemblyPointsPage /> },
            { path: 'emergency/assembly-points/new', element: <AssemblyPointFormPage /> },
            { path: 'emergency/assembly-points/:id', element: <AssemblyPointDetailPage /> },
            { path: 'emergency/assembly-points/:id/edit', element: <AssemblyPointFormPage /> },
            // LOT 48 Phase 3.b — Suivi SOS
            { path: 'emergency/sos', element: <SosListPage /> },
            { path: 'emergency/sos/:id', element: <SosDetailPage /> },
            // LOT 48 Phase 4 — Alerte Générale + Évacuation
            { path: 'emergency/alerts/general/:id', element: <GeneralAlertDetailPage /> },
            // LOT 48 Phase 5 — Tableau de bord temps réel + KPI
            { path: 'emergency/dashboard', element: <EmergencyDashboardPage /> },


            { path: 'hs-Meetings', element: <ModuleGuard moduleId='meetings'><HealthMeetingPage /></ModuleGuard>, },
            { path: 'add-NewActivity', element: <AddHealthMeetingPage />, },
            { path: 'hs-Meetings/editActivity/:id', element: <ModuleGuard moduleId='meetings'><EditHealthMeetingPage /></ModuleGuard>, },
            { path: 'hs-Meetings/activity-report/:id', element: <ModuleGuard moduleId='meetings'><ActivityReportPage /></ModuleGuard>, },
            { path: 'hs-Meetings/viewDetails-meeting/:id', element: <ModuleGuard moduleId='meetings'><ViewDetailsMeetingPage /></ModuleGuard>, },
            { path: 'hs-Meetings/details-meeting/:id', element: <ModuleGuard moduleId='meetings'><MeetingDetailsTabsPage /></ModuleGuard>, },

            { path: 'steering-tours', element: <ModuleGuard moduleId='management-tour'><SteeringTourPage /></ModuleGuard>, },
            { path: "add-tour", element: <AddTourPage /> },
            { path: 'steering-tours/activity-report/:id', element: <ModuleGuard moduleId='management-tour'><ActivityReportPage /></ModuleGuard>, },
            { path: 'steering-tours/details-meeting/:id', element: <ModuleGuard moduleId='management-tour'><SteeringDetailsPage /></ModuleGuard>, },
            { path: 'steering-tours/viewDetails-meeting/:id', element: <ModuleGuard moduleId='management-tour'><ViewDetailsMeetingPage /></ModuleGuard>, },
            { path: 'steering-tours/edit/:id', element: <ModuleGuard moduleId='management-tour'><EditTourPage /></ModuleGuard>, },

            { path: 'compliance-dashboard', element: <ModuleGuard moduleId='compliance-dashboard'><CompDashboardPage /></ModuleGuard>, },
            { path: 'compliance-requirements', element: <ModuleGuard moduleId='requirements'><CompRequirementPage /></ModuleGuard>, },
            { path: 'compliance-requirements/add-requirement', element: <ModuleGuard moduleId='requirements'><AddRequirementPage /></ModuleGuard>, },
            { path: 'compliance-requirements/edit-requirement/:id', element: <ModuleGuard moduleId='requirements'><EditRequirementPage /></ModuleGuard>, },
            { path: 'compliance-assignment', element: <ModuleGuard moduleId='employee-assignments'><CompAssignmentPage /></ModuleGuard>, },
            { path: 'compliance-assignment/view-details/:id', element: <ModuleGuard moduleId='employee-assignments'><AssignDetailsPage /></ModuleGuard>, },
            { path: 'compliance-documents', element: <ModuleGuard moduleId='documents'><CompDocumentPage /></ModuleGuard>, },
            { path: 'compliance-documents/upload-document', element: <ModuleGuard moduleId='documents'><UploadDocumentPage /></ModuleGuard>, },
            { path: 'compliance-documents/details-documents/:id', element: <ModuleGuard moduleId='documents'><DetailDocumentPage /></ModuleGuard>, },
            { path: 'employee-assignment', element: <ModuleGuard moduleId='employee-assignments'><EmployeeAssignmentPage /></ModuleGuard>, },
            { path: 'employee-assignment/employee-details/:id', element: <ModuleGuard moduleId='employee-assignments'><EmployeeDetailsPage /></ModuleGuard>, },
            { path: 'document-validation', element: <ModuleGuard moduleId='document-validation'><DocumentValidationPage /></ModuleGuard>, },

            { path: 'new-dashboard', element: <OhsDashboardPage />, },



            { path: "settings", element: <SettingsPage /> },

            { /* LOT 48 P6.f — Page dédiée Gestion des Modules (séparée d'Administration) */
              path: "modules-management", element: <ModulesManagementPage /> },

            { /* LOT 48 P6.g — Données de Références (refonte par onglets) */
              path: "operational-references", element: <OperationalReferencesPage /> },

            { path: "performance", element: <TargetAndForecastPage /> },


            { path: "advanced-configuration", element: <AdvancedConfigurationPage /> },

            { path: "ai-assistant", element: <AIAssistant /> },


            { path: "users-management", element: <DemoPermissionGuard moduleLabel="Gestion des utilisateurs"><UserManagementTabsPage /></DemoPermissionGuard> },
            {
                path: 'users-management/create-user', element: <DemoPermissionGuard moduleLabel="Gestion des utilisateurs"><AddUserForm onBackToUsers={handleBackToUsers}
                    onCreateUser={handleCreateUser} /></DemoPermissionGuard>,
            },
            { path: 'users-management/edit/:id', element: <DemoPermissionGuard moduleLabel="Gestion des utilisateurs"><EditUserPermission /></DemoPermissionGuard>, },
            { path: 'users-management/usersManagement-details/:id', element: <DemoPermissionGuard moduleLabel="Gestion des utilisateurs"><UserDetails /></DemoPermissionGuard>, },

            { path: "process-docs", element: <WorkProcess /> },

            { path: "how-to", element: <Guide /> },
            { path: "features-overview", element: <FeatureOverview /> },
            { path: "technical-docs", element: <TechnicalDocumentation /> },


            { path: "iso-documents", element: <ISODocuments /> },

            { path: "adhoc-actions", element: <AdhocActions /> },
            { path: 'adhoc-actions/create-adhocAction', element: <AdhocActionsForm />, },
            { path: 'adhoc-actions/adhocAction-details/:id', element: <AdhocActionDetails />, },
            { path: 'adhoc-actions/edit/:id', element: <EditAdhocAction />, },
            { path: 'adhoc-actions/updateAdhocAction-details/:id', element: <UpdateAdhocAction />, },

            { path: "pending-actions", element: <PendingActions /> },

            { path: "chemical-register", element: <ChemicalRegister /> },
            { path: 'chemical-register/create-chemical', element: <ChemicalRiskForms />, },
            { path: 'chemical-register/edit/:id', element: <EditChemicalRisk />, },
            { path: 'chemical-register/chemicalRegister-details/:id', element: <ChemicalDetails />, },

            { path: "monthly-reports", element: <MonthlyReports /> },
            { path: "KPI-reports", element: <KpiReview /> },
            { path: "performance-reports", element: <PerformanceReport /> },
            { path: "corporate-reports", element: <CorporateReports /> },
            { path: "executive-reports", element: <ExecutiveReports /> },
            { path: "trend-analysis", element: <TrendAnalysis /> },

            // LOT — Module Dosimetrie & Expositions
            // Phase 8 Frontend : Dashboard executif KPI — landing par defaut du module.
            { path: 'dosimetry', element: <DosimetryDashboardPage /> },
            { path: 'dosimetry/dashboard', element: <DosimetryDashboardPage /> },
            // Phase 2 Frontend-A : registre des travailleurs exposes
            // (les autres sous-modules de la sidebar pointent vers /coming-soon).
            { path: 'dosimetry/settings', element: <DosimetryParametersPage /> },
            { path: 'dosimetry/workers', element: <ExposedWorkersRegistryPage /> },
            // Phase 2 Frontend-B : fiche 360 d'un travailleur expose
            { path: 'dosimetry/workers/detail/:id', element: <ExposedWorkerDetailPage /> },
            // Phase 2 Frontend-C : formulaire d'enregistrement / edition (stepper)
            { path: 'dosimetry/workers/new', element: <ExposedWorkerForm /> },
            { path: 'dosimetry/workers/edit/:id', element: <ExposedWorkerForm /> },
            // Phase 3 Frontend-A : inventaire des dosimetres et instruments
            { path: 'dosimetry/dosimeters', element: <DosimetersInventoryPage /> },
            // Phase 3 Frontend-B : attribution / restitution d'un dosimetre
            { path: 'dosimetry/dosimeters/assign', element: <DosimeterAssignmentForm mode="ASSIGN" /> },
            { path: 'dosimetry/dosimeters/return', element: <DosimeterAssignmentForm mode="RETURN" /> },
            // Phase 3 Frontend-C : scanner QR mobile-friendly (placeholder camera + saisie manuelle)
            { path: 'dosimetry/dosimeters/scan', element: <QRScannerPage /> },
            // Phase 4 Frontend-A : saisie / edition append-only d'un enregistrement de dose
            { path: 'dosimetry/doses/new', element: <DoseEntryForm /> },
            { path: 'dosimetry/doses/edit/:id', element: <DoseEntryForm /> },
            // Phase 4 Frontend-B : suivi des doses cote travailleur (table + trend + gauges)
            { path: 'dosimetry/doses/by-worker/:workerId', element: <DoseTrackingPage /> },
            // Phase 4 Frontend-C : wizard d'import CSV en masse (4 etapes)
            { path: 'dosimetry/doses/import', element: <CsvImportWizard /> },
            // Phase 5 Frontend-A : gestion des seuils parametrables (filtres + inline edit + modal custom)
            { path: 'dosimetry/thresholds', element: <DosimetryThresholdsPage /> },
            // Phase 5 Frontend-B : dashboard des alertes graduees (APPROACH/INVESTIGATION/ACTION/EXCEEDED)
            { path: 'dosimetry/alerts', element: <ExposureAlertsPage /> },
            // Phase 5 Frontend-C : workflow des dossiers de depassement (OPEN/INVESTIGATING/CLOSED)
            { path: 'dosimetry/overexposure', element: <OverexposureCasesPage /> },
            { path: 'dosimetry/overexposure/new', element: <OverexposureCaseForm /> },
            { path: 'dosimetry/overexposure/:caseId', element: <OverexposureCaseDetailPage /> },
            // Phase 6 Frontend-A — Points de mesure d'ambiance (registre + form + detail + carte)
            { path: 'dosimetry/measurement-points', element: <MeasurementPointsPage /> },
            { path: 'dosimetry/measurement-points/new', element: <MeasurementPointForm /> },
            { path: 'dosimetry/measurement-points/edit/:id', element: <MeasurementPointForm /> },
            { path: 'dosimetry/measurement-points/detail/:id', element: <MeasurementPointDetailPage /> },
            { path: 'dosimetry/ambient-map', element: <AmbientMonitoringMapPage /> },
            // Phase 6 Frontend-B — Campagnes de surveillance d'ambiance
            { path: 'dosimetry/campaigns', element: <MonitoringCampaignsPage /> },
            { path: 'dosimetry/campaigns/new', element: <MonitoringCampaignForm /> },
            { path: 'dosimetry/campaigns/:id', element: <MonitoringCampaignDetailPage /> },
            // Phase 6 Frontend-C — Profils d'exposition agent (liaison worker x point de mesure)
            { path: 'dosimetry/exposure-profiles', element: <ExposureProfileLinksPage /> },
            { path: 'dosimetry/exposure-profiles/:profileId/edit', element: <ExposureProfileLinkEditor /> },
            // Phase 7 Frontend-A — Surveillance medicale (medecin du travail)
            { path: 'dosimetry/medical/planning', element: <MedicalVisitsPlanningPage /> },
            { path: 'dosimetry/medical/visit/new', element: <MedicalVisitForm /> },
            { path: 'dosimetry/medical/visit/:id/perform', element: <MedicalVisitForm /> },
            { path: 'dosimetry/medical/worker/:workerId', element: <WorkerMedicalDossierPage /> },
            { path: 'dosimetry/medical/fitness/new', element: <FitnessAssessmentForm /> },
            // Phase 7 Frontend-B — Espace personnel travailleur
            { path: 'dosimetry/my-medical', element: <MyMedicalAreaPage /> },
            // Phase 9-B Frontend — Rapports PDF + exports reglementaires
            { path: 'dosimetry/reports', element: <DosimetryReportsPage /> },
            { path: 'dosimetry/regulatory-exports', element: <RegulatoryExportsPage /> },
            // Placeholder partagé pour les sous-modules pas encore implémentés
            { path: 'coming-soon', element: <ComingSoonPage /> },

            // LOT 40 P0 fix : route catch-all interne au layout
            // affiche une vraie page 404 (NotFound) avec le shell propre,
            // au lieu d'un placeholder ComingSoon.
            {
                path: '*',
                element: <NotFound />,
            }


        ],
    },

    {
        path: '/not-found',
        element: <NotFound />,
    },
    // LOT 40 P0 fix : catch-all racine — fallback pour les URLs hors layout
    // (ex: bug de redirect). Renvoie sur la page 404 dédiée.
    {
        path: '*',
        element: <NotFound />,
    }
]);

export function Router() {
    return <RouterProvider router={router} />;
}
