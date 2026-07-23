-- ---------------------------------------------------------------------------
-- permission_management : colonne CSV des modules autorises (source de verite)
--
-- POURQUOI. Les droits etaient stockes dans une colonne PAR MODULE. Tout module
-- livre apres la creation de ces colonnes n'avait donc nulle part ou etre ecrit :
-- « Gestion des erreurs » etait propose par la matrice de droits et perdu en
-- silence a l'enregistrement, et registre des equipements, opportunites SST,
-- programme d'audit, standards ISO, processus de travail, cibles et previsions,
-- gestion des modules n'etaient pas attribuables du tout.
--
-- ZERO PERTE D'ACCES. Le rattrapage se fait en deux temps :
--   1. allowed_modules est initialise depuis les colonnes existantes — un profil
--      garde exactement les droits qu'il avait ;
--   2. les modules nouvellement attribuables sont AJOUTES a tous les profils
--      existants : faute de controle, ils etaient visibles par tous jusqu'ici ;
--      les retirer d'office aurait supprime des acces en place. L'administrateur
--      peut les revoquer ensuite, profil par profil.
--
-- Idempotent : rejouable sans effet de bord (colonne creee si absente, CSV
-- recalcule seulement quand il est vide, modules ajoutes sans doublon).
-- A appliquer sur la base LOCALE **et** sur Aiven (schema healthsafety).
-- ---------------------------------------------------------------------------

SET @schema := DATABASE();

SET @needs_column := (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'permission_management'
      AND COLUMN_NAME = 'allowed_modules');

SET @ddl := IF(@needs_column,
    'ALTER TABLE permission_management ADD COLUMN allowed_modules VARCHAR(4000) NULL',
    'SELECT ''colonne allowed_modules deja presente''');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1. Reprise des droits existants depuis les colonnes « une par module ».
--    CONCAT_WS ignore les NULL : seules les colonnes renseignees sont reprises.
UPDATE permission_management
SET allowed_modules = CONCAT_WS(',',
        IF(home IS NOT NULL AND home <> '', 'home', NULL),
        IF(notifications IS NOT NULL AND notifications <> '', 'notifications', NULL),
        IF(incident_management IS NOT NULL AND incident_management <> '', 'incidentManagement', NULL),
        IF(investigations IS NOT NULL AND investigations <> '', 'investigations', NULL),
        IF(action_plans_inc IS NOT NULL AND action_plans_inc <> '', 'actionPlansInc', NULL),
        IF(non_conformity IS NOT NULL AND non_conformity <> '', 'nonConformity', NULL),
        IF(inspections IS NOT NULL AND inspections <> '', 'inspections', NULL),
        IF(meetings IS NOT NULL AND meetings <> '', 'meetings', NULL),
        IF(management_tour IS NOT NULL AND management_tour <> '', 'managementTour', NULL),
        IF(pending_actions IS NOT NULL AND pending_actions <> '', 'pendingActions', NULL),
        IF(action_plan IS NOT NULL AND action_plan <> '', 'actionPlan', NULL),
        IF(recommendations IS NOT NULL AND recommendations <> '', 'recommendations', NULL),
        IF(adhoc_actions IS NOT NULL AND adhoc_actions <> '', 'adhocActions', NULL),
        IF(risk_overview IS NOT NULL AND risk_overview <> '', 'riskOverview', NULL),
        IF(risk_register IS NOT NULL AND risk_register <> '', 'riskRegister', NULL),
        IF(risk_assessment IS NOT NULL AND risk_assessment <> '', 'riskAssessment', NULL),
        IF(chemical_register IS NOT NULL AND chemical_register <> '', 'chemicalRegister', NULL),
        IF(ppe_overview IS NOT NULL AND ppe_overview <> '', 'ppeOverview', NULL),
        IF(ppe_monitoring IS NOT NULL AND ppe_monitoring <> '', 'ppeMonitoring', NULL),
        IF(ppe_request IS NOT NULL AND ppe_request <> '', 'ppeRequest', NULL),
        IF(audit_plan IS NOT NULL AND audit_plan <> '', 'auditPlan', NULL),
        IF(audits IS NOT NULL AND audits <> '', 'audits', NULL),
        IF(audit_recommendations IS NOT NULL AND audit_recommendations <> '', 'auditRecommendations', NULL),
        IF(compliance_dashboard IS NOT NULL AND compliance_dashboard <> '', 'complianceDashboard', NULL),
        IF(requirements IS NOT NULL AND requirements <> '', 'requirements', NULL),
        IF(position_assignments IS NOT NULL AND position_assignments <> '', 'positionAssignments', NULL),
        IF(employee_assignments IS NOT NULL AND employee_assignments <> '', 'employeeAssignments', NULL),
        IF(documents IS NOT NULL AND documents <> '', 'documents', NULL),
        IF(document_validation IS NOT NULL AND document_validation <> '', 'documentValidation', NULL),
        IF(lessons_learned IS NOT NULL AND lessons_learned <> '', 'lessonsLearned', NULL),
        IF(document_manager IS NOT NULL AND document_manager <> '', 'documentManager', NULL),
        IF(comm_dashboard IS NOT NULL AND comm_dashboard <> '', 'commDashboard', NULL),
        IF(employee_comm IS NOT NULL AND employee_comm <> '', 'employeeComm', NULL),
        IF(users_management IS NOT NULL AND users_management <> '', 'usersManagement', NULL),
        IF(settings IS NOT NULL AND settings <> '', 'settings', NULL))
WHERE allowed_modules IS NULL OR allowed_modules = '';

-- 2. Modules nouvellement attribuables : ajoutes s'ils manquent (sans doublon).
--    FIND_IN_SET evite qu'un rejeu duplique une cle.
UPDATE permission_management
SET allowed_modules = CONCAT_WS(',', NULLIF(allowed_modules, ''),
        IF(FIND_IN_SET('errorManagement',   allowed_modules) = 0, 'errorManagement',   NULL),
        IF(FIND_IN_SET('equipmentRegistry', allowed_modules) = 0, 'equipmentRegistry', NULL),
        IF(FIND_IN_SET('riskOpportunities', allowed_modules) = 0, 'riskOpportunities', NULL),
        IF(FIND_IN_SET('auditProgram',      allowed_modules) = 0, 'auditProgram',      NULL),
        IF(FIND_IN_SET('isoDocuments',      allowed_modules) = 0, 'isoDocuments',      NULL),
        IF(FIND_IN_SET('processDocs',       allowed_modules) = 0, 'processDocs',       NULL),
        IF(FIND_IN_SET('targetForecast',    allowed_modules) = 0, 'targetForecast',    NULL),
        IF(FIND_IN_SET('modulesManagement', allowed_modules) = 0, 'modulesManagement', NULL),
        IF(FIND_IN_SET('emergency',         allowed_modules) = 0, 'emergency',         NULL),
        IF(FIND_IN_SET('dosimetry',         allowed_modules) = 0, 'dosimetry',         NULL),
        IF(FIND_IN_SET('blast',             allowed_modules) = 0, 'blast',             NULL),
        IF(FIND_IN_SET('planning',          allowed_modules) = 0, 'planning',          NULL),
        IF(FIND_IN_SET('reports',           allowed_modules) = 0, 'reports',           NULL));

SELECT id, account_id, LEFT(allowed_modules, 200) AS modules FROM permission_management;
