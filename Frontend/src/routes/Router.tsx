import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

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
        path: '/about',
        element: <AboutPage />,
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

            { path: "performance", element: <TargetAndForecastPage /> },


            { path: "advanced-configuration", element: <AdvancedConfigurationPage /> },

            { path: "ai-assistant", element: <AIAssistant /> },


            { path: "users-management", element: <UserManagementTabsPage /> },
            {
                path: 'users-management/create-user', element: <AddUserForm onBackToUsers={handleBackToUsers}
                    onCreateUser={handleCreateUser} />,
            },
            { path: 'users-management/edit/:id', element: <EditUserPermission />, },
            { path: 'users-management/usersManagement-details/:id', element: <UserDetails />, },

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

            {
                path: '*',
                element: <ComingSoonPage />,
            }


        ],
    },

    {
        path: '/not-found',
        element: <NotFound />,
    },
    {
        path: '*',
        element: <ComingSoonPage />,
    }
]);

export function Router() {
    return <RouterProvider router={router} />;
}
