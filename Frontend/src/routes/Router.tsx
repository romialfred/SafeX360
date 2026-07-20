import { lazy, Suspense } from 'react';
import { PageLoader } from '../components/UtilityComp/SandglassLoader';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoutes';
import PublicRoutes from './PublicRoutes';
import RootGate from './RootGate';
import CanonicalLandingRedirect from './CanonicalLandingRedirect';
import ModuleGuard from './ModuleGuard';
import DemoPermissionGuard from './DemoPermissionGuard';
import FirstLoginGuard from './FirstLoginGuard';
const DashboardLayout = lazy(() => import('../layouts/DashboardLayout'));
const EmergencySettingsPage = lazy(() => import('../components/EmergencyManagement/Settings/EmergencySettingsPage'));
const AssemblyPointsPage = lazy(() => import('../components/EmergencyManagement/AssemblyPoints/AssemblyPointsPage'));
const AssemblyPointFormPage = lazy(() => import('../components/EmergencyManagement/AssemblyPoints/AssemblyPointFormPage'));
const AssemblyPointDetailPage = lazy(() => import('../components/EmergencyManagement/AssemblyPoints/AssemblyPointDetailPage'));
const SosListPage = lazy(() => import('../components/EmergencyManagement/Sos/SosListPage'));
const SosDetailPage = lazy(() => import('../components/EmergencyManagement/Sos/SosDetailPage'));
const GeneralAlertDetailPage = lazy(() => import('../components/EmergencyManagement/GeneralAlert/GeneralAlertDetailPage'));
const EmergencyDashboardPage = lazy(() => import('../components/EmergencyManagement/Dashboard/EmergencyDashboardPage'));

const ProfilePage = lazy(() => import('../pages/dashboard/ProfilePage'));
const NotFound = lazy(() => import('../pages/NotFoundPage'));
const AboutPage = lazy(() => import('../pages/dashboard/AboutPage'));
const HomePage = lazy(() => import('../pages/dashboard/HomePage'));

const CorrectivePage = lazy(() => import('../pages/dashboard/LaggingIndicator/CorrectiveAction/CorrectivePage'));
const AddCorrectivePage = lazy(() => import('../pages/dashboard/LaggingIndicator/CorrectiveAction/AddCorrectivePage'));
const UpdateCorrectivePage = lazy(() => import('../pages/dashboard/LaggingIndicator/CorrectiveAction/UpdateCorrectivePage'));
const LaggingIndicatorPage = lazy(() => import('../pages/dashboard/LaggingIndicator/Incident/LaggingIndicatorPage'));
const AddIncidentsPage = lazy(() => import('../pages/dashboard/LaggingIndicator/Incident/AddIncidentsPage'));
const AIIncidentDeclarationPage = lazy(() => import('../pages/dashboard/LaggingIndicator/Incident/AIIncidentDeclarationPage'));
const PgiPage = lazy(() => import('../pages/dashboard/LeadingIndicator/PGI/PgiPage'));
const AddPgiPage = lazy(() => import('../pages/dashboard/LeadingIndicator/PGI/AddPgiPage'));
const CalenderPage = lazy(() => import('../pages/dashboard/LeadingIndicator/PGI/CalenderPage'));
const AuditPage = lazy(() => import('../pages/dashboard/LaggingIndicator/AuditManagement/AuditPage'));
const EditUserPermission = lazy(() => import('../components/NewComponents/UsersManagement/EditUserPermission'));
const IncidentCategoryPage = lazy(() => import('../pages/dashboard/SettingFolder/IncidentCategory/IncidentCategoryPage'));
const IncidentTypePage = lazy(() => import('../pages/dashboard/SettingFolder/IncidentType/IncidentTypePage'));
const SeverityLevelPage = lazy(() => import('../pages/dashboard/SettingFolder/Severity Level/SeverityLevelPage'));
const LocationPage = lazy(() => import('../pages/dashboard/SettingFolder/Location/LocationPage'));
const WeatherPage = lazy(() => import('../pages/dashboard/SettingFolder/WeatherConditions/WeatherPage'));
const BodyPartsPage = lazy(() => import('../pages/dashboard/SettingFolder/BodyParts/BodyPartsPage'));
const ViewDetailsPage = lazy(() => import('../pages/dashboard/LaggingIndicator/Incident/ViewDetailsPage'));
const UpdateIncidentsPage = lazy(() => import('../pages/dashboard/LaggingIndicator/Incident/UpdateIncidentsPage'));
const TeamSetupPage = lazy(() => import('../pages/dashboard/SettingFolder/TeamSetup/TeamSetupPage'));
const AddTeamPage = lazy(() => import('../pages/dashboard/SettingFolder/TeamSetup/AddTeamPage'));
const DetailsPage = lazy(() => import('../pages/dashboard/LaggingIndicator/CorrectiveAction/DetailsPage'));
const CheckListPage = lazy(() => import('../pages/dashboard/SettingFolder/CheckList/CheckListPage'));
const InspectionTemplatesPage = lazy(() => import('../pages/dashboard/SettingFolder/InspectionTemplates/InspectionTemplatesPage'));
const TechMeasurementsPage = lazy(() => import('../pages/dashboard/SettingFolder/TechMeasurement/TechMeasurementsPage'));
const InspectionPage = lazy(() => import('../pages/dashboard/LeadingIndicator/PGI/InspectionPage'));
const ComingSoonPage = lazy(() => import('../pages/ComingSoonPage'));
const ViewDeatailsPgiPage = lazy(() => import('../pages/dashboard/LeadingIndicator/PGI/ViewDeatailsPgiPage'));
const HealthMeetingPage = lazy(() => import('../pages/dashboard/LeadingIndicator/Hs-Meetings/HealthMeetingPage'));
const AddHealthMeetingPage = lazy(() => import('../pages/dashboard/LeadingIndicator/Hs-Meetings/AddHealthMeetingPage'));
const EditHealthMeetingPage = lazy(() => import('../pages/dashboard/LeadingIndicator/Hs-Meetings/EditHealthMeetingPage'));
const ActivityReportPage = lazy(() => import('../pages/dashboard/LeadingIndicator/Hs-Meetings/ActivityReportPage'));
const ExecuteAuditPage = lazy(() => import('../pages/dashboard/LaggingIndicator/AuditManagement/ExecuteAuditPage'));
const RecommendationPage = lazy(() => import('../pages/dashboard/LaggingIndicator/AuditManagement/RecommendationPage'));
const UpdateRecommendationPage = lazy(() => import('../pages/dashboard/LaggingIndicator/AuditManagement/UpdateRecommendationPage'));
const AuditAreaPage = lazy(() => import('../pages/dashboard/SettingFolder/AuditArea/AuditAreaPage'));
const ViewDetailsMeetingPage = lazy(() => import('../pages/dashboard/LeadingIndicator/Hs-Meetings/ViewDetailsMeetingPage'));
const UpdateTeamPage = lazy(() => import('../pages/dashboard/SettingFolder/TeamSetup/UpdateTeamPage'));
const TeamDetailsPage = lazy(() => import('../pages/dashboard/SettingFolder/TeamSetup/TeamDetailsPage'));
const RecommendationDetailsPage = lazy(() => import('../pages/dashboard/LaggingIndicator/AuditManagement/RecommendationDetailsPage'));
const CompDashboardPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/CompDashboardPage'));
const MbaCardPage = lazy(() => import('../pages/dashboard/LeadingIndicator/MbaCard/MbaCardPage'));
const AddCardPage = lazy(() => import('../pages/dashboard/LeadingIndicator/MbaCard/AddCardPage'));
const CompRequirementPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/CompRequirementPage'));
const AddRequirementPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/AddRequirementPage'));
const EditRequirementPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/EditRequirementPage'));
const CompAssignmentPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/CompAssignmentPage'));
const AssignDetailsPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/AssignDetailsPage'));
const CompDocumentPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/CompDocumentPage'));
const UploadDocumentPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/UploadDocumentPage'));
const DetailDocumentPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/DetailDocumentPage'));
const EmployeeAssignmentPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/EmployeeAssignmentPage'));
const EmployeeDetailsPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/EmployeeDetailsPage'));
const EditScheduleAuditPage = lazy(() => import('../pages/dashboard/LaggingIndicator/AuditManagement/EditScheduleAuditPage'));
const DocumentValidationPage = lazy(() => import('../pages/dashboard/ComplianceManagemennt/DocumentValidationPage'));
const LessonLearnPage = lazy(() => import('../pages/dashboard/LaggingIndicator/LessonLearn/LessonLearnPage'));
const LessonDetailsPage = lazy(() => import('../pages/dashboard/LaggingIndicator/LessonLearn/LessonDetailsPage'));
const OhsDashboardPage = lazy(() => import('../pages/OhsDashboardPage'));
const WorkAreaPage = lazy(() => import('../pages/dashboard/SettingFolder/WorkArea/WorkAreaPage'));
const WorkProcessPage = lazy(() => import('../pages/dashboard/SettingFolder/WorkProcess/WorkProcessPage'));
const InvestigationPage = lazy(() => import('../pages/dashboard/LaggingIndicator/Incident/InvestigationPage'));
const InvestigationFilePage = lazy(() => import('../pages/dashboard/LaggingIndicator/Investigation/InvestigationFilePage'));
const UpdateInvestigationPage = lazy(() => import('../pages/dashboard/LaggingIndicator/Investigation/UpdateInvestigationPage'));
const AuditorPage = lazy(() => import('../pages/dashboard/SettingFolder/Auditor/AuditorPage'));
const NewAuditPlanPage = lazy(() => import('../pages/dashboard/LaggingIndicator/AuditManagement/NewAuditPlanPage'));
const AuditDetailsTabsPage = lazy(() => import('../pages/dashboard/LaggingIndicator/AuditManagement/AuditDetailsTabsPage'));
const NonConformityDashboard = lazy(() => import('../components/LeadingIndicator/Non-conformity/NonConformityDashboard'));
const CreateUserPage = lazy(() => import('../components/NewComponents/UsersManagement/CreateUserPage'));
const AuditProgramPage = lazy(() => import('../components/LaggingIndicator/AuditManagement/AuditProgramPage'));
const NonConformityForm = lazy(() => import('../components/LeadingIndicator/Non-conformity/NonConformityForm'));
const NonConformityDetails = lazy(() => import('../components/LeadingIndicator/Non-conformity/details/NonConformityDetails'));
const NonConformityEditPage = lazy(() => import('../pages/NonConformityEditPage'));
const AnnualPlaningGridPage = lazy(() => import('../pages/dashboard/AnnualPlaning/AnnualPlaningGridPage'));
const AnnualAuditPlanPage = lazy(() => import('../pages/dashboard/AnnualPlaning/AnnualAuditPlanPage'));
const ThemeManagementPage = lazy(() => import('../pages/dashboard/AnnualPlaning/ThemeManagementPage'));
const NewAuditPlanPages = lazy(() => import('../pages/dashboard/AnnualPlaning/NewAuditPlanPages'));
const EditNewAuditPlanPage = lazy(() => import('../pages/dashboard/AnnualPlaning/EditNewAuditPlanPage'));
const SteeringTourPage = lazy(() => import('../pages/dashboard/LeadingIndicator/ManagementTour/SteeringTourPage'));
const PgiDetailsTabPage = lazy(() => import('../pages/dashboard/LeadingIndicator/PGI/PgiDetailsTabPage'));
const MeetingDetailsTabsPage = lazy(() => import('../pages/dashboard/LeadingIndicator/Hs-Meetings/MeetingDetailsTabsPage'));
const AddTourPage = lazy(() => import('../pages/dashboard/LeadingIndicator/ManagementTour/AddTourPage'));
const SteeringDetailsPage = lazy(() => import('../pages/dashboard/LeadingIndicator/ManagementTour/SteeringDetailsPage'));
const EditPgiPage = lazy(() => import('../pages/dashboard/LeadingIndicator/PGI/EditPgiPage'));
const EditTourPage = lazy(() => import('../pages/dashboard/LeadingIndicator/ManagementTour/EditTourPage'));
const PpeManagementPage = lazy(() => import('../pages/dashboard/RiskManagement/PpeManagementPage'));
const RiskOverviewPage = lazy(() => import('../pages/dashboard/RiskManagement/RiskOverviewPage'));
const RiskRegisterPage = lazy(() => import('../pages/dashboard/RiskManagement/RiskRegisterPage'));
const OpportunitiesPage = lazy(() => import('../components/RiskManagement/Opportunities/OpportunitiesPage'));
const PPECreateFormPage = lazy(() => import('../pages/dashboard/RiskManagement/PPECreateFormPage'));
const PPEStockEntryFormPage = lazy(() => import('../pages/dashboard/RiskManagement/PPEStockEntryFormPage'));
const PPERequestTablePage = lazy(() => import('../pages/dashboard/RiskManagement/PPERequestTablePage'));
const DetailViewPage = lazy(() => import('../pages/dashboard/RiskManagement/DetailViewPage'));
const RegisterFormPage = lazy(() => import('../pages/dashboard/RiskManagement/RegisterFormPage'));
const PPEEmployeeDetailsPage = lazy(() => import('../pages/dashboard/RiskManagement/PPEEmployeeDetailsPage'));
const NotificationsManagement = lazy(() => import('../components/CommunicationManagement/NotificationsManagement'));
const EmployeeCommunications = lazy(() => import('../components/CommunicationManagement/EmployeeCommunications'));
const DocumentManagement = lazy(() => import('../components/DocumentManagment/DocumentManagement'));
const NewCommunicationPage = lazy(() => import('../pages/dashboard/Communication/NewCommunicationPage'));
const EditCommunicationPage = lazy(() => import('../pages/dashboard/Communication/EditCommunicationPage'));
const CommunicationDetailsPage = lazy(() => import('../pages/dashboard/Communication/CommunicationDetailsPage'));
const NotificationTabsPage = lazy(() => import('../pages/dashboard/Communication/NotificationTabsPage'));
const CreateDocumentPage = lazy(() => import('../pages/dashboard/DocumentsManagement/CreateDocumentPage'));
const DocumentTabsPage = lazy(() => import('../pages/dashboard/DocumentsManagement/DocumentTabsPage'));
const CommunicationDashboardPage = lazy(() => import('../pages/dashboard/Communication/CommunicationDashboardPage'));
const PPEMonitoring = lazy(() => import('../components/PPEManagement/PPEMonitoring'));
const SettingsPage = lazy(() => import('../components/NewComponents/Settings/Settings'));
const ModulesManagementPage = lazy(() => import('../components/NewComponents/Settings/ModulesManagementPage'));
const OperationalReferencesPage = lazy(() => import('../components/NewComponents/OperationalReferences/OperationalReferencesPage'));
const ISODocuments = lazy(() => import('../components/NewComponents/ISODocuments/ISODocuments'));
const UserDetails = lazy(() => import('../components/NewComponents/UsersManagement/UserDetails'));
const Guide = lazy(() => import('../components/NewComponents/HelpCenter/Guide'));
const FeatureOverview = lazy(() => import('../components/NewComponents/HelpCenter/FeatureOverview'));
const LoginsPage = lazy(() => import('../components/NewComponents/LoginPage/LoginsPage'));
const PasswordPage = lazy(() => import('../components/NewComponents/LoginPage/PasswordPage'));
const AddUserForm = lazy(() => import('../components/NewComponents/UsersManagement/AddUserForm'));

const TargetAndForecastPage = lazy(() => import('../pages/TargetAndForecastPage'));
const AdvancedConfigurationPage = lazy(() => import('../pages/AdvancedConfigurationPage'));

const PendingActions = lazy(() => import('../components/NewComponents/AdhocActions/PendingActions'));
const AIAssistant = lazy(() => import('../components/NewComponents/AiAssistant/AIAssistant'));
const AdhocActions = lazy(() => import('../components/NewComponents/AdhocActions/AdhocActions'));
const ChemicalRegister = lazy(() => import('../components/NewComponents/ChemicalRegister/ChemicalRegister'));
const ChemicalRiskForms = lazy(() => import('../components/NewComponents/ChemicalRegister/ChemicalRiskForms'));
const EditChemicalRisk = lazy(() => import('../components/NewComponents/ChemicalRegister/EditChemicalRisk'));
const MonthlyReports = lazy(() => import('../components/NewComponents/Reports/MonthlyReports'));
const KpiReview = lazy(() => import('../components/NewComponents/Reports/KpiReview'));
const PerformanceReport = lazy(() => import('../components/NewComponents/Reports/PerformanceReport'));
const CorporateReports = lazy(() => import('../components/NewComponents/Reports/CorporateReports'));
const ExecutiveReports = lazy(() => import('../components/NewComponents/Reports/ExecutiveReports'));
const TrendAnalysis = lazy(() => import('../components/NewComponents/Reports/TrendAnalysis'));
const TechnicalDocumentation = lazy(() => import('../components/NewComponents/HelpCenter/TechnicalDocumentation'));
const WorkProcess = lazy(() => import('../components/NewComponents/WorkProcess/WorkProcess'));
const RiskAssessmentPage = lazy(() => import('../pages/dashboard/RiskManagement/RiskAssessmentPage'));
const EditRegisterFormPage = lazy(() => import('../pages/dashboard/RiskManagement/EditRegisterFormPage'));
const AdhocActionsForm = lazy(() => import('../components/NewComponents/AdhocActions/AdhocActionsForm'));
const UpdateAdhocAction = lazy(() => import('../components/NewComponents/AdhocActions/UpdateAdhocAction'));
const AdhocActionDetails = lazy(() => import('../components/NewComponents/AdhocActions/AdhocActionDetails'));
const EditAdhocAction = lazy(() => import('../components/NewComponents/AdhocActions/EditAdhocAction'));
const ChemicalDetails = lazy(() => import('../components/NewComponents/ChemicalRegister/ChemicalDetails'));
const ModuleNotFoundPage = lazy(() => import('../pages/dashboard/ModuleNotFoundPage'));
const IsoMappingPage = lazy(() => import('../pages/dashboard/IsoMappingPage'));
// LOT 49 — Module Gestion Utilisateurs
const UsersAdminPage = lazy(() => import('../components/NewComponents/UsersManagement/UsersAdminPage'));
const FirstLoginPasswordChange = lazy(() => import('../pages/auth/FirstLoginPasswordChange'));
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
const EquipmentRegistryPage = lazy(() => import('../components/Inspection/EquipmentRegistryPage'));
const InspectionScheduleForm = lazy(() => import('../components/Inspection/InspectionScheduleForm'));
const InspectionExecutePage = lazy(() => import('../components/Inspection/InspectionExecutePage'));
const InspectionDetailPage = lazy(() => import('../components/Inspection/InspectionDetailPage'));

// LOT — Module Gestion des Erreurs (Phase 3 Frontend). Code-splitting actif.
const ErrorEventListPage = lazy(() => import('../components/ErrorManagement/ErrorEventListPage'));
const ErrorEventDetailPage = lazy(() => import('../components/ErrorManagement/ErrorEventDetailPage'));
const ErrorDashboardPage = lazy(() => import('../components/ErrorManagement/ErrorDashboardPage'));
const ErrorDeclarationPage = lazy(() => import('../components/ErrorManagement/ErrorDeclarationPage'));

// LOT — SafeX 360 Field (mobile Android Phase M0+M1+M2+M3)
const MobileShell = lazy(() => import('../m/MobileShell'));
const MobileHome = lazy(() => import('../m/pages/MobileHome'));
const MobileInspectionsList = lazy(() => import('../m/pages/MobileInspectionsList'));
// SafeX 360 Field V3 — modules métier complets
const MobileModulesHub = lazy(() => import('../m/pages/MobileModulesHub'));
const MobilePpeCatalog = lazy(() => import('../m/pages/MobilePpeCatalog'));
const MobilePpeRequests = lazy(() => import('../m/pages/MobilePpeRequests'));
const MobilePpeRequestNew = lazy(() => import('../m/pages/MobilePpeRequestNew'));
const MobileDocumentsList = lazy(() => import('../m/pages/MobileDocumentsList'));
const MobileCommunicationsList = lazy(() => import('../m/pages/MobileCommunicationsList'));
const MobileCommunicationDetail = lazy(() => import('../m/pages/MobileCommunicationDetail'));
const MobileComplianceMine = lazy(() => import('../m/pages/MobileComplianceMine'));
const MobileBlastRegistry = lazy(() => import('../m/pages/MobileBlastRegistry'));
const MobileBlastDetail = lazy(() => import('../m/pages/MobileBlastDetail'));
const MobileAuditDetail = lazy(() => import('../m/pages/MobileAuditDetail'));
const MobileMeetingDetail = lazy(() => import('../m/pages/MobileMeetingDetail'));
const MobileNonConformityDeclare = lazy(() => import('../m/pages/MobileNonConformityDeclare'));
const MobileNonConformityDetail = lazy(() => import('../m/pages/MobileNonConformityDetail'));
const MobileCorrectiveActionDetail = lazy(() => import('../m/pages/MobileCorrectiveActionDetail'));
const MobileRiskDetail = lazy(() => import('../m/pages/MobileRiskDetail'));
const MobileOpportunities = lazy(() => import('../m/pages/MobileOpportunities'));
const MobileAnnualPlanning = lazy(() => import('../m/pages/MobileAnnualPlanning'));
const MobileErrorEventDetail = lazy(() => import('../m/pages/MobileErrorEventDetail'));
const MobileInspectionDetail = lazy(() => import('../m/pages/MobileInspectionDetail'));
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
// Phase M7 — alerte generale
const MobileGeneralAlertScreen = lazy(() => import('../m/pages/MobileGeneralAlertScreen'));
// Phase M8 — declaration IA (photo) + declaration evenement Juste Culture
const MobileAIIncidentDeclare = lazy(() => import('../m/pages/MobileAIIncidentDeclare'));
const MobileErrorEventDeclare = lazy(() => import('../m/pages/MobileErrorEventDeclare'));
// Phase M9 — pages liste/registre modules complets
const MobileErrorEventList = lazy(() => import('../m/pages/MobileErrorEventList'));
const MobileNonConformityList = lazy(() => import('../m/pages/MobileNonConformityList'));
const MobileRiskOverview = lazy(() => import('../m/pages/MobileRiskOverview'));
const MobileAuditList = lazy(() => import('../m/pages/MobileAuditList'));
const MobileMeetingsList = lazy(() => import('../m/pages/MobileMeetingsList'));
const MobileCorrectiveActionsList = lazy(() => import('../m/pages/MobileCorrectiveActionsList'));
const MobileDashboardOhs = lazy(() => import('../m/pages/MobileDashboardOhs'));

/**
 * Fallback Suspense pour les pages Blast Management lazy-loaded.
 * Aligne sur DosimetrySuspense (meme bg, meme loader Mantine centre).
 */
const BlastSuspense = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<PageLoader label="Chargement de la page…" sublabel="Module Dynamitages" />}>
        {children}
    </Suspense>
);

/**
 * Fallback Suspense pour les pages dosimetrie lazy-loaded.
 * Reste discret : un loader Mantine centre, sans flash visuel desagreable
 * (delai naturel <200ms sur les chunks deja en cache).
 */
const DosimetrySuspense = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<PageLoader label="Chargement de la page…" sublabel="Module Dosimétrie" />}>
        {children}
    </Suspense>
);

/**
 * Fallback Suspense pour les pages du module Gestion des Erreurs (lazy-loaded).
 * Aligne sur les autres modules (meme bg cream + loader Mantine centre).
 */
const ErrorManagementSuspense = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<PageLoader label="Chargement de la page…" sublabel="Gestion des erreurs" />}>
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
        element: <CanonicalLandingRedirect />,
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
        element: <ProtectedRoute><FirstLoginPasswordChange /></ProtectedRoute>,
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
            { path: 'alert', element: <BlastSuspense><MobileGeneralAlertScreen /></BlastSuspense> },
            { path: 'incident/new', element: <BlastSuspense><MobileIncidentQuickDeclare /></BlastSuspense> },
            { path: 'incident/:id', element: <BlastSuspense><MobileIncidentDetail /></BlastSuspense> },
            { path: 'error-event/new', element: <BlastSuspense><MobileErrorEventDeclare /></BlastSuspense> },
            { path: 'incident/ai', element: <BlastSuspense><MobileAIIncidentDeclare /></BlastSuspense> },
            { path: 'errors', element: <BlastSuspense><MobileErrorEventList /></BlastSuspense> },
            { path: 'non-conformities', element: <BlastSuspense><MobileNonConformityList /></BlastSuspense> },
            { path: 'risks', element: <BlastSuspense><MobileRiskOverview /></BlastSuspense> },
            { path: 'audits', element: <BlastSuspense><MobileAuditList /></BlastSuspense> },
            { path: 'meetings', element: <BlastSuspense><MobileMeetingsList /></BlastSuspense> },
            { path: 'corrective-actions', element: <BlastSuspense><MobileCorrectiveActionsList /></BlastSuspense> },
            { path: 'dashboard', element: <BlastSuspense><MobileDashboardOhs /></BlastSuspense> },
            { path: 'incidents/history', element: <BlastSuspense><MobileIncidentsHistory /></BlastSuspense> },
            { path: 'blast/next', element: <BlastSuspense><MobileBlastNext /></BlastSuspense> },
            // ── SafeX 360 Field V3 — couverture complète des modules métier ──
            { path: 'modules', element: <BlastSuspense><MobileModulesHub /></BlastSuspense> },
            { path: 'ppe/catalog', element: <BlastSuspense><MobilePpeCatalog /></BlastSuspense> },
            { path: 'ppe/requests', element: <BlastSuspense><MobilePpeRequests /></BlastSuspense> },
            { path: 'ppe/requests/new', element: <BlastSuspense><MobilePpeRequestNew /></BlastSuspense> },
            { path: 'documents', element: <BlastSuspense><MobileDocumentsList /></BlastSuspense> },
            { path: 'communications', element: <BlastSuspense><MobileCommunicationsList /></BlastSuspense> },
            { path: 'communications/:id', element: <BlastSuspense><MobileCommunicationDetail /></BlastSuspense> },
            { path: 'compliance', element: <BlastSuspense><MobileComplianceMine /></BlastSuspense> },
            { path: 'blast/registry', element: <BlastSuspense><MobileBlastRegistry /></BlastSuspense> },
            { path: 'blast/:id', element: <BlastSuspense><MobileBlastDetail /></BlastSuspense> },
            { path: 'audit/:id', element: <BlastSuspense><MobileAuditDetail /></BlastSuspense> },
            { path: 'meeting/:id', element: <BlastSuspense><MobileMeetingDetail /></BlastSuspense> },
            { path: 'non-conformities/new', element: <BlastSuspense><MobileNonConformityDeclare /></BlastSuspense> },
            { path: 'non-conformities/:id', element: <BlastSuspense><MobileNonConformityDetail /></BlastSuspense> },
            { path: 'action/:id', element: <BlastSuspense><MobileCorrectiveActionDetail /></BlastSuspense> },
            { path: 'risk/:id', element: <BlastSuspense><MobileRiskDetail /></BlastSuspense> },
            { path: 'opportunities', element: <BlastSuspense><MobileOpportunities /></BlastSuspense> },
            { path: 'planning', element: <BlastSuspense><MobileAnnualPlanning /></BlastSuspense> },
            { path: 'error-event/:id', element: <BlastSuspense><MobileErrorEventDetail /></BlastSuspense> },
            { path: 'inspection-detail/:id', element: <BlastSuspense><MobileInspectionDetail /></BlastSuspense> },
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
            // LOT 52 B — programme d'audit annuel ISO 19011 §5 (risques + KPI)
            { path: 'audit-program', element: <AuditProgramPage />, },
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
            { path: "notifications/notifications-details/:id", element: <ModuleGuard moduleId='notifications'><NotificationTabsPage /></ModuleGuard> },

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
            { path: "risk-management/opportunities", element: <ModuleGuard moduleId='risk-register'><OpportunitiesPage /></ModuleGuard> },

            { path: 'lesson-learn', element: <LessonLearnPage />, },
            { path: 'lesson-learn/lesson-details/:id', element: <LessonDetailsPage /> },

            { path: 'audit-management', element: <AuditPage />, },
            { path: 'audit-management/schedule', element: <NewAuditPlanPage />, },
            { path: 'audit-management/new-audit', element: <NewAuditPlanPage />, },
            { path: 'audit-management/edit-audit', element: <Navigate to="/audit-management" replace />, },
            { path: 'audit-management/execute/:id', element: <ExecuteAuditPage />, },
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
            { path: 'inspection-templates', element: <InspectionTemplatesPage />, },
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




            { path: "settings", element: <SettingsPage /> },

            { /* LOT 48 P6.f — Page dédiée Gestion des Modules (séparée d'Administration) */
              path: "modules-management", element: <ModulesManagementPage /> },

            { /* LOT 48 P6.g — Données de Références (refonte par onglets) */
              path: "operational-references", element: <OperationalReferencesPage /> },

            { path: "performance", element: <TargetAndForecastPage /> },


            { path: "advanced-configuration", element: <AdvancedConfigurationPage /> },

            { path: "ai-assistant", element: <AIAssistant /> },


            // LOT 61 — l'unique experience premium vit sous /users-admin (UsersAdminPage).
            // L'ancien chemin /users-management redirige vers /users-admin (le legacy
            // UserManagementTabsPage / UsersContent / CreateUserWizard a ete supprime).
            { path: "users-management", element: <Navigate to="/users-admin" replace /> },
            // LOT 49 — Page admin premium Gestion utilisateurs (creation + permissions modules)
            { path: "users-admin", element: <DemoPermissionGuard moduleLabel="Gestion des utilisateurs"><UsersAdminPage /></DemoPermissionGuard> },
            // LOT 52 A2 — création d'utilisateur en page pleine largeur (remplace le modal)
            { path: "users-admin/new", element: <DemoPermissionGuard moduleLabel="Gestion des utilisateurs"><CreateUserPage /></DemoPermissionGuard> },
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

            { path: "chemical-register", element: <ModuleGuard moduleId='chemical-register'><ChemicalRegister /></ModuleGuard> },
            { path: 'chemical-register/create-chemical', element: <ModuleGuard moduleId='chemical-register'><ChemicalRiskForms /></ModuleGuard>, },
            { path: 'chemical-register/edit/:id', element: <ModuleGuard moduleId='chemical-register'><EditChemicalRisk /></ModuleGuard>, },
            { path: 'chemical-register/chemicalRegister-details/:id', element: <ModuleGuard moduleId='chemical-register'><ChemicalDetails /></ModuleGuard>, },

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
            // Registre des équipements (données de référence du module Inspections)
            { path: 'inspections/equipment', element: <BlastSuspense><EquipmentRegistryPage /></BlastSuspense> },
            { path: 'inspections/schedule', element: <BlastSuspense><InspectionScheduleForm /></BlastSuspense> },
            { path: 'inspections/execute/:id', element: <BlastSuspense><InspectionExecutePage /></BlastSuspense> },
            { path: 'inspections/detail/:id', element: <BlastSuspense><InspectionDetailPage /></BlastSuspense> },

            // LOT — Module Gestion des Erreurs (Phase 3 Frontend).
            // Registre + Déclaration + Fiche détaillée. RBAC enforcement côté
            // backend (GET ouverts authentifiés ; POST/PUT/DELETE réservés admin).
            { path: 'error-management', element: <ModuleGuard moduleId='error-events'><ErrorManagementSuspense><ErrorEventListPage /></ErrorManagementSuspense></ModuleGuard> },
            { path: 'error-management/dashboard', element: <ModuleGuard moduleId='error-dashboard'><ErrorManagementSuspense><ErrorDashboardPage /></ErrorManagementSuspense></ModuleGuard> },
            // La déclaration est désormais une action (volet de droite depuis le
            // registre), plus une page. On redirige l'ancienne URL vers le registre.
            { path: 'error-management/declare', element: <ModuleGuard moduleId='error-declare'><ErrorManagementSuspense><ErrorDeclarationPage /></ErrorManagementSuspense></ModuleGuard> },
            { path: 'error-management/:id', element: <ModuleGuard moduleId='error-events'><ErrorManagementSuspense><ErrorEventDetailPage /></ErrorManagementSuspense></ModuleGuard> },

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
    return (
        <Suspense fallback={<PageLoader label="Chargement de la page…" sublabel="SafeX" />}>
            <RouterProvider router={router} />
        </Suspense>
    );
}
