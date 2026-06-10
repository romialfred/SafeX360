import { lazy, Suspense } from 'react';
import { Loader } from '@mantine/core';
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
import AIIncidentDeclarationPage from '../pages/dashboard/LaggingIndicator/Incident/AIIncidentDeclarationPage';
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
import RootGate from './RootGate';
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
// LOT 49 — Module Gestion Utilisateurs
import UsersAdminPage from '../components/NewComponents/UsersManagement/UsersAdminPage';
import FirstLoginPasswordChange from '../pages/auth/FirstLoginPasswordChange';
import FirstLoginGuard from './FirstLoginGuard';
// LOT — Module Dosimetrie & Expositions (2026-06-07: code-splitting actif)
// Les 33 pages Dosimetrie sont lazy-loaded pour reduire la taille du bundle
// initial (de ~5.4MB a ~3.6MB observe). Chaque page est telechargee a la
// demande lors de la premiere navigation vers /dosimetry/*.
const DosimetryParametersPage = lazy(() => import('../components/Dosimetry/DosimetryParametersPage'));
const ExposedWorkersRegistryPage = lazy(() => import('../components/Dosimetry/ExposedWorkersRegistryPage'));
const ExposedWorkerDetailPage = lazy(() => import('../components/Dosimetry/ExposedWorkerDetailPage'));
const ExposedWorkerForm = lazy(() => import('../components/Dosimetry/ExposedWorkerForm'));
const DosimetersInventoryPage = lazy(() => import('../components/Dosimetry/DosimetersInventoryPage'));
const DosimeterForm = lazy(() => import('../components/Dosimetry/DosimeterForm'));
const DosimeterAssignmentForm = lazy(() => import('../components/Dosimetry/DosimeterAssignmentForm'));
const QRScannerPage = lazy(() => import('../components/Dosimetry/QRScannerPage'));
const DoseEntryForm = lazy(() => import('../components/Dosimetry/DoseEntryForm'));
const DoseTrackingPage = lazy(() => import('../components/Dosimetry/DoseTrackingPage'));
const CsvImportWizard = lazy(() => import('../components/Dosimetry/CsvImportWizard'));
const DosimetryThresholdsPage = lazy(() => import('../components/Dosimetry/DosimetryThresholdsPage'));
const ExposureAlertsPage = lazy(() => import('../components/Dosimetry/ExposureAlertsPage'));
const OverexposureCasesPage = lazy(() => import('../components/Dosimetry/OverexposureCasesPage'));
const OverexposureCaseDetailPage = lazy(() => import('../components/Dosimetry/OverexposureCaseDetailPage'));
const OverexposureCaseForm = lazy(() => import('../components/Dosimetry/OverexposureCaseForm'));
const MeasurementPointsPage = lazy(() => import('../components/Dosimetry/MeasurementPointsPage'));
const MeasurementPointForm = lazy(() => import('../components/Dosimetry/MeasurementPointForm'));
const MeasurementPointDetailPage = lazy(() => import('../components/Dosimetry/MeasurementPointDetailPage'));
const AmbientMonitoringMapPage = lazy(() => import('../components/Dosimetry/AmbientMonitoringMapPage'));
const MonitoringCampaignsPage = lazy(() => import('../components/Dosimetry/MonitoringCampaignsPage'));
const MonitoringCampaignForm = lazy(() => import('../components/Dosimetry/MonitoringCampaignForm'));
const MonitoringCampaignDetailPage = lazy(() => import('../components/Dosimetry/MonitoringCampaignDetailPage'));
const ExposureProfileLinksPage = lazy(() => import('../components/Dosimetry/ExposureProfileLinksPage'));
const ExposureProfileLinkEditor = lazy(() => import('../components/Dosimetry/ExposureProfileLinkEditor'));
const MedicalVisitsPlanningPage = lazy(() => import('../components/Dosimetry/MedicalVisitsPlanningPage'));
const MedicalVisitForm = lazy(() => import('../components/Dosimetry/MedicalVisitForm'));
const WorkerMedicalDossierPage = lazy(() => import('../components/Dosimetry/WorkerMedicalDossierPage'));
const FitnessAssessmentForm = lazy(() => import('../components/Dosimetry/FitnessAssessmentForm'));
const MyMedicalAreaPage = lazy(() => import('../components/Dosimetry/MyMedicalAreaPage'));
const DosimetryReportsPage = lazy(() => import('../components/Dosimetry/DosimetryReportsPage'));
const RegulatoryExportsPage = lazy(() => import('../components/Dosimetry/RegulatoryExportsPage'));
const DosimetryDashboardPage = lazy(() => import('../components/Dosimetry/DosimetryDashboardPage'));

// LOT — Module Gestion des Dynamitages / Blast Management (Phase 2 Frontend)
// Code-splitting actif pour eviter d'alourdir le bundle initial.
const BlastRegistryPage = lazy(() => import('../components/Blast/BlastRegistryPage'));
const BlastForm = lazy(() => import('../components/Blast/BlastForm'));
const BlastDetailPage = lazy(() => import('../components/Blast/BlastDetailPage'));
// LOT — P6 : rapport d'evacuation post-tir (signature + export PDF).
const BlastEvacuationReportPage = lazy(() => import('../components/Blast/BlastEvacuationReportPage'));
// LOT — P7 : tableau de bord blast (landing par defaut + alias /blast/dashboard).
const BlastDashboardPage = lazy(() => import('../components/Blast/BlastDashboardPage'));

// LOT — Inspections HSE (refonte 2026-06, Phase 3 Frontend).
const InspectionRegistryPage = lazy(() => import('../components/Inspection/InspectionRegistryPage'));
const InspectionScheduleForm = lazy(() => import('../components/Inspection/InspectionScheduleForm'));
const InspectionExecutePage = lazy(() => import('../components/Inspection/InspectionExecutePage'));
const InspectionDetailPage = lazy(() => import('../components/Inspection/InspectionDetailPage'));

// LOT — SafeX 360 Field (mobile Android Phase M0+M1+M2+M3)
const MobileShell = lazy(() => import('../m/MobileShell'));
const MobileHome = lazy(() => import('../m/pages/MobileHome'));
const MobilePlaceholder = lazy(() => import('../m/pages/MobilePlaceholder'));
const MobileInspectionsList = lazy(() => import('../m/pages/MobileInspectionsList'));
const MobileSosScreen = lazy(() => import('../m/pages/MobileSosScreen'));
const MobileIncidentQuickDeclare = lazy(() => import('../m/pages/MobileIncidentQuickDeclare'));
const MobileBlastNext = lazy(() => import('../m/pages/MobileBlastNext'));
const MobileProfile = lazy(() => import('../m/pages/MobileProfile'));
// Phase M3 — sous-pages profil (lecture seule, garde biometrique sur 2 d'entre elles)
const MobilePersonalPpe = lazy(() => import('../m/pages/MobilePersonalPpe'));
const MobilePersonalTrainings = lazy(() => import('../m/pages/MobilePersonalTrainings'));
const MobilePersonalDosimetry = lazy(() => import('../m/pages/MobilePersonalDosimetry'));
const MobilePersonalMedical = lazy(() => import('../m/pages/MobilePersonalMedical'));
// Phase M6 — detail incident + historique signalements
const MobileIncidentDetail = lazy(() => import('../m/pages/MobileIncidentDetail'));
const MobileIncidentsHistory = lazy(() => import('../m/pages/MobileIncidentsHistory'));

/**
 * Fallback Suspense pour les pages Blast Management lazy-loaded.
 * Aligne sur DosimetrySuspense (meme bg, meme loader Mantine centre).
 */
const BlastSuspense = ({ children }: { children: React.ReactNode }) => (
    <Suspense
        fallback={
            <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF8F3]">
                <div className="flex flex-col items-center gap-3">
                    <Loader size="md" color="orange" />
                    <p className="text-[12px] text-slate-500 tracking-wide">Chargement du module Dynamitages…</p>
                </div>
            </div>
        }
    >
        {children}
    </Suspense>
);

/**
 * Fallback Suspense pour les pages dosimetrie lazy-loaded.
 * Reste discret : un loader Mantine centre, sans flash visuel desagreable
 * (delai naturel <200ms sur les chunks deja en cache).
 */
const DosimetrySuspense = ({ children }: { children: React.ReactNode }) => (
    <Suspense
        fallback={
            <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF8F3]">
                <div className="flex flex-col items-center gap-3">
                    <Loader size="md" color="indigo" />
                    <p className="text-[12px] text-slate-500 tracking-wide">Chargement du module Dosimétrie…</p>
                </div>
            </div>
        }
    >
        {children}
    </Suspense>
);






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

    // LOT 49 — Page bloquante de premier changement de mot de passe.
    // Accessible uniquement quand l'utilisateur a un JWT valide ET firstLogin=true.
    // Pas de layout dashboard : on isole completement l'utilisateur de l'app.
    {
        path: '/first-login',
        element: <FirstLoginPasswordChange />,
    },

    // ── SafeX 360 Field — version mobile Android (Phase M0) ─────────────
    // Routes prefixees /m/ sous un shell dedie (bottom nav + safe areas).
    // Pas de DashboardLayout : la version mobile a sa propre chrome.
    // Protege par ProtectedRoute pour exiger l'authentification.
    {
        path: '/m',
        element: <ProtectedRoute><BlastSuspense><MobileShell /></BlastSuspense></ProtectedRoute>,
        children: [
            { index: true, element: <BlastSuspense><MobileHome /></BlastSuspense> },
            { path: 'home', element: <BlastSuspense><MobileHome /></BlastSuspense> },
            { path: 'inspections', element: <BlastSuspense><MobileInspectionsList /></BlastSuspense> },
            // Inspection execution mobile : reutilise le composant web existant qui est deja mobile-first.
            { path: 'inspections/:id', element: <BlastSuspense><InspectionExecutePage /></BlastSuspense> },
            { path: 'sos', element: <BlastSuspense><MobileSosScreen /></BlastSuspense> },
            { path: 'incident/new', element: <BlastSuspense><MobileIncidentQuickDeclare /></BlastSuspense> },
            { path: 'incident/:id', element: <BlastSuspense><MobileIncidentDetail /></BlastSuspense> },
            { path: 'incidents/history', element: <BlastSuspense><MobileIncidentsHistory /></BlastSuspense> },
            { path: 'blast/next', element: <BlastSuspense><MobileBlastNext /></BlastSuspense> },
            { path: 'profile', element: <BlastSuspense><MobileProfile /></BlastSuspense> },
            { path: 'profile/ppe', element: <BlastSuspense><MobilePersonalPpe /></BlastSuspense> },
            { path: 'profile/trainings', element: <BlastSuspense><MobilePersonalTrainings /></BlastSuspense> },
            { path: 'profile/dosimetry', element: <BlastSuspense><MobilePersonalDosimetry /></BlastSuspense> },
            { path: 'profile/medical', element: <BlastSuspense><MobilePersonalMedical /></BlastSuspense> },
        ],
    },

    {
        path: '/',
        // RootGate : non-auth → LandingPage (vitrine commerciale)
        //            auth → DashboardLayout (application)
        // LOT 49 — FirstLoginGuard verifie firstLogin et redirige vers /first-login
        // si l'utilisateur doit changer son MDP avant d'acceder a l'application.
        element: <RootGate><FirstLoginGuard><DashboardLayout /></FirstLoginGuard></RootGate>,
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
            { path: 'incidents/ai-declare', element: <ModuleGuard moduleId='incident-management'><AIIncidentDeclarationPage /></ModuleGuard> },
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
            { path: 'compliance-assignment', element: <ModuleGuard moduleId='position-assignments'><CompAssignmentPage /></ModuleGuard>, },
            { path: 'compliance-assignment/view-details/:id', element: <ModuleGuard moduleId='position-assignments'><AssignDetailsPage /></ModuleGuard>, },
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
            // LOT 49 — Nouvelle page admin Gestion utilisateurs (creation+ permissions modules)
            { path: "users-admin", element: <DemoPermissionGuard moduleLabel="Gestion des utilisateurs"><UsersAdminPage /></DemoPermissionGuard> },
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

            // LOT — Module Dosimetrie & Expositions (2026-06-07 : lazy-loaded)
            // Toutes les pages sont enveloppees dans <DosimetrySuspense> pour
            // afficher un loader Mantine pendant le chargement du chunk dynamique.
            { path: 'dosimetry', element: <DosimetrySuspense><DosimetryDashboardPage /></DosimetrySuspense> },
            { path: 'dosimetry/dashboard', element: <DosimetrySuspense><DosimetryDashboardPage /></DosimetrySuspense> },
            { path: 'dosimetry/settings', element: <DosimetrySuspense><DosimetryParametersPage /></DosimetrySuspense> },
            { path: 'dosimetry/workers', element: <DosimetrySuspense><ExposedWorkersRegistryPage /></DosimetrySuspense> },
            { path: 'dosimetry/workers/detail/:id', element: <DosimetrySuspense><ExposedWorkerDetailPage /></DosimetrySuspense> },
            { path: 'dosimetry/workers/new', element: <DosimetrySuspense><ExposedWorkerForm /></DosimetrySuspense> },
            { path: 'dosimetry/workers/edit/:id', element: <DosimetrySuspense><ExposedWorkerForm /></DosimetrySuspense> },
            { path: 'dosimetry/dosimeters', element: <DosimetrySuspense><DosimetersInventoryPage /></DosimetrySuspense> },
            { path: 'dosimetry/dosimeters/new', element: <DosimetrySuspense><DosimeterForm /></DosimetrySuspense> },
            { path: 'dosimetry/dosimeters/edit/:id', element: <DosimetrySuspense><DosimeterForm /></DosimetrySuspense> },
            { path: 'dosimetry/dosimeters/assign', element: <DosimetrySuspense><DosimeterAssignmentForm mode="ASSIGN" /></DosimetrySuspense> },
            { path: 'dosimetry/dosimeters/return', element: <DosimetrySuspense><DosimeterAssignmentForm mode="RETURN" /></DosimetrySuspense> },
            { path: 'dosimetry/dosimeters/scan', element: <DosimetrySuspense><QRScannerPage /></DosimetrySuspense> },
            { path: 'dosimetry/doses/new', element: <DosimetrySuspense><DoseEntryForm /></DosimetrySuspense> },
            { path: 'dosimetry/doses/edit/:id', element: <DosimetrySuspense><DoseEntryForm /></DosimetrySuspense> },
            { path: 'dosimetry/doses/by-worker/:workerId', element: <DosimetrySuspense><DoseTrackingPage /></DosimetrySuspense> },
            { path: 'dosimetry/doses/import', element: <DosimetrySuspense><CsvImportWizard /></DosimetrySuspense> },
            { path: 'dosimetry/thresholds', element: <DosimetrySuspense><DosimetryThresholdsPage /></DosimetrySuspense> },
            { path: 'dosimetry/alerts', element: <DosimetrySuspense><ExposureAlertsPage /></DosimetrySuspense> },
            { path: 'dosimetry/overexposure', element: <DosimetrySuspense><OverexposureCasesPage /></DosimetrySuspense> },
            { path: 'dosimetry/overexposure/new', element: <DosimetrySuspense><OverexposureCaseForm /></DosimetrySuspense> },
            { path: 'dosimetry/overexposure/:caseId', element: <DosimetrySuspense><OverexposureCaseDetailPage /></DosimetrySuspense> },
            { path: 'dosimetry/measurement-points', element: <DosimetrySuspense><MeasurementPointsPage /></DosimetrySuspense> },
            { path: 'dosimetry/measurement-points/new', element: <DosimetrySuspense><MeasurementPointForm /></DosimetrySuspense> },
            { path: 'dosimetry/measurement-points/edit/:id', element: <DosimetrySuspense><MeasurementPointForm /></DosimetrySuspense> },
            { path: 'dosimetry/measurement-points/detail/:id', element: <DosimetrySuspense><MeasurementPointDetailPage /></DosimetrySuspense> },
            { path: 'dosimetry/ambient-map', element: <DosimetrySuspense><AmbientMonitoringMapPage /></DosimetrySuspense> },
            { path: 'dosimetry/campaigns', element: <DosimetrySuspense><MonitoringCampaignsPage /></DosimetrySuspense> },
            { path: 'dosimetry/campaigns/new', element: <DosimetrySuspense><MonitoringCampaignForm /></DosimetrySuspense> },
            { path: 'dosimetry/campaigns/:id', element: <DosimetrySuspense><MonitoringCampaignDetailPage /></DosimetrySuspense> },
            { path: 'dosimetry/exposure-profiles', element: <DosimetrySuspense><ExposureProfileLinksPage /></DosimetrySuspense> },
            { path: 'dosimetry/exposure-profiles/:profileId/edit', element: <DosimetrySuspense><ExposureProfileLinkEditor /></DosimetrySuspense> },
            { path: 'dosimetry/medical/planning', element: <DosimetrySuspense><MedicalVisitsPlanningPage /></DosimetrySuspense> },
            { path: 'dosimetry/medical/visit/new', element: <DosimetrySuspense><MedicalVisitForm /></DosimetrySuspense> },
            { path: 'dosimetry/medical/visit/:id/perform', element: <DosimetrySuspense><MedicalVisitForm /></DosimetrySuspense> },
            { path: 'dosimetry/medical/worker/:workerId', element: <DosimetrySuspense><WorkerMedicalDossierPage /></DosimetrySuspense> },
            { path: 'dosimetry/medical/fitness/new', element: <DosimetrySuspense><FitnessAssessmentForm /></DosimetrySuspense> },
            { path: 'dosimetry/my-medical', element: <DosimetrySuspense><MyMedicalAreaPage /></DosimetrySuspense> },
            { path: 'dosimetry/reports', element: <DosimetrySuspense><DosimetryReportsPage /></DosimetrySuspense> },
            { path: 'dosimetry/regulatory-exports', element: <DosimetrySuspense><RegulatoryExportsPage /></DosimetrySuspense> },

            // LOT — Module Gestion des Dynamitages / Blast Management (Phase 2)
            // Registre + Formulaire + Detail. RBAC enforcement cote backend
            // (BLAST_VIEW / BLAST_PLAN / BLAST_CONFIRM / BLAST_ADMIN).
            // P7 : /blast est desormais le tableau de bord (landing). L'ancienne
            // page registre est accessible via /blast/registry. L'alias
            // /blast/dashboard reste valide pour les liens directs.
            { path: 'blast', element: <BlastSuspense><BlastDashboardPage /></BlastSuspense> },
            { path: 'blast/dashboard', element: <BlastSuspense><BlastDashboardPage /></BlastSuspense> },
            { path: 'blast/registry', element: <BlastSuspense><BlastRegistryPage /></BlastSuspense> },
            { path: 'blast/new', element: <BlastSuspense><BlastForm /></BlastSuspense> },
            { path: 'blast/edit/:id', element: <BlastSuspense><BlastForm /></BlastSuspense> },
            { path: 'blast/detail/:id', element: <BlastSuspense><BlastDetailPage /></BlastSuspense> },
            // P6 — Rapport d'evacuation post-tir (RBAC enforcement cote backend :
            // BLAST_VIEW pour la lecture, BLAST_REPORT pour signer / ajouter incident).
            { path: 'blast/evacuation-report/:blastId', element: <BlastSuspense><BlastEvacuationReportPage /></BlastSuspense> },

            // LOT — Module Inspections HSE (refonte 2026-06, Phase 3 Frontend)
            // Reuse BlastSuspense (meme look & feel cream + Loader Mantine).
            { path: 'inspections', element: <BlastSuspense><InspectionRegistryPage /></BlastSuspense> },
            { path: 'inspections/schedule', element: <BlastSuspense><InspectionScheduleForm /></BlastSuspense> },
            { path: 'inspections/execute/:id', element: <BlastSuspense><InspectionExecutePage /></BlastSuspense> },
            { path: 'inspections/detail/:id', element: <BlastSuspense><InspectionDetailPage /></BlastSuspense> },

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
