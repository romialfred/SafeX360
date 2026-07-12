-- Migration enums ORDINAL -> STRING : schéma healthsafety (HNS)
-- Généré depuis l'ordre exact des enums (source) + noms vérifiés contre la base.
-- Idempotent : ne s'applique qu'aux colonnes encore numériques.
-- À appliquer AVANT le déploiement du code annoté @Enumerated(STRING).
SET SQL_SAFE_UPDATES=0;

-- action_process.status (ActionStatus)
ALTER TABLE `action_process` MODIFY `status` VARCHAR(255);
UPDATE `action_process` SET `status` = CASE `status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'IN_PROGRESS' WHEN '2' THEN 'COMPLETED' WHEN '3' THEN 'CANCELLED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- activity_report.status (ActivityReportStatus)
ALTER TABLE `activity_report` MODIFY `status` VARCHAR(255);
UPDATE `activity_report` SET `status` = CASE `status` WHEN '0' THEN 'SUBMITTED' WHEN '1' THEN 'APPROVED' WHEN '2' THEN 'REJECTED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- audit.category (AuditCategory)
ALTER TABLE `audit` MODIFY `category` VARCHAR(255);
UPDATE `audit` SET `category` = CASE `category` WHEN '0' THEN 'INTERNAL' WHEN '1' THEN 'EXTERNAL' ELSE `category` END WHERE `category` REGEXP '^[0-9]+$';

-- audit.planning_status (PlanningStatus)
ALTER TABLE `audit` MODIFY `planning_status` VARCHAR(255);
UPDATE `audit` SET `planning_status` = CASE `planning_status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'APPROVED' WHEN '2' THEN 'REJECTED' ELSE `planning_status` END WHERE `planning_status` REGEXP '^[0-9]+$';

-- audit.status (AuditStatus)
ALTER TABLE `audit` MODIFY `status` VARCHAR(255);
UPDATE `audit` SET `status` = CASE `status` WHEN '0' THEN 'PLANNING' WHEN '1' THEN 'PREPARATION' WHEN '2' THEN 'EXECUTION' WHEN '3' THEN 'CLOSED' WHEN '4' THEN 'CANCELLED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- audit_areas.status (Status)
ALTER TABLE `audit_areas` MODIFY `status` VARCHAR(255);
UPDATE `audit_areas` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- audit_history.status (AuditStatus)
ALTER TABLE `audit_history` MODIFY `status` VARCHAR(255);
UPDATE `audit_history` SET `status` = CASE `status` WHEN '0' THEN 'PLANNING' WHEN '1' THEN 'PREPARATION' WHEN '2' THEN 'EXECUTION' WHEN '3' THEN 'CLOSED' WHEN '4' THEN 'CANCELLED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- body_part.status (Status)
ALTER TABLE `body_part` MODIFY `status` VARCHAR(255);
UPDATE `body_part` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- check_list.status (Status)
ALTER TABLE `check_list` MODIFY `status` VARCHAR(255);
UPDATE `check_list` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- compliance_docs.status (DocStatus)
ALTER TABLE `compliance_docs` MODIFY `status` VARCHAR(255);
UPDATE `compliance_docs` SET `status` = CASE `status` WHEN '0' THEN 'VALID' WHEN '1' THEN 'INVALID' WHEN '2' THEN 'PENDING' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- corrective_action.status (ActionStatus)
ALTER TABLE `corrective_action` MODIFY `status` VARCHAR(255);
UPDATE `corrective_action` SET `status` = CASE `status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'IN_PROGRESS' WHEN '2' THEN 'COMPLETED' WHEN '3' THEN 'CANCELLED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- hs_activity.type (ActivityType)
ALTER TABLE `hs_activity` MODIFY `type` VARCHAR(255);
UPDATE `hs_activity` SET `type` = CASE `type` WHEN '0' THEN 'HSM' WHEN '1' THEN 'ST' ELSE `type` END WHERE `type` REGEXP '^[0-9]+$';

-- hs_activity_history.status (ActivityStatus)
ALTER TABLE `hs_activity_history` MODIFY `status` VARCHAR(255);
UPDATE `hs_activity_history` SET `status` = CASE `status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'IN_PROGRESS' WHEN '2' THEN 'COMPLETED' WHEN '3' THEN 'CANCELLED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- incident.status (IncidentStatus)
ALTER TABLE `incident` MODIFY `status` VARCHAR(255);
UPDATE `incident` SET `status` = CASE `status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'REPORTED' WHEN '2' THEN 'INVESTIGATION' WHEN '3' THEN 'INVESTIGATION_COMPLETED' WHEN '4' THEN 'CORRECTIVE_ACTIONS' WHEN '5' THEN 'CLOSED' WHEN '6' THEN 'REJECTED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- incident_category.status (Status)
ALTER TABLE `incident_category` MODIFY `status` VARCHAR(255);
UPDATE `incident_category` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- incident_history.status (IncidentStatus)
ALTER TABLE `incident_history` MODIFY `status` VARCHAR(255);
UPDATE `incident_history` SET `status` = CASE `status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'REPORTED' WHEN '2' THEN 'INVESTIGATION' WHEN '3' THEN 'INVESTIGATION_COMPLETED' WHEN '4' THEN 'CORRECTIVE_ACTIONS' WHEN '5' THEN 'CLOSED' WHEN '6' THEN 'REJECTED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- incident_team.status (Status)
ALTER TABLE `incident_team` MODIFY `status` VARCHAR(255);
UPDATE `incident_team` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- incident_type.status (Status)
ALTER TABLE `incident_type` MODIFY `status` VARCHAR(255);
UPDATE `incident_type` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- inspection_history.status (InspectionStatus)
ALTER TABLE `inspection_history` MODIFY `status` VARCHAR(255);
UPDATE `inspection_history` SET `status` = CASE `status` WHEN '0' THEN 'COMPLETED' WHEN '1' THEN 'CANCELLED' WHEN '2' THEN 'IN_PROGRESS' WHEN '3' THEN 'SUBMITTED' WHEN '4' THEN 'APPROVED' WHEN '5' THEN 'REJECTED' WHEN '6' THEN 'ARCHIVED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- internal_auditor.status (Status)
ALTER TABLE `internal_auditor` MODIFY `status` VARCHAR(255);
UPDATE `internal_auditor` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- incident_investigation.status (InvestigationStatus)
ALTER TABLE `incident_investigation` MODIFY `status` VARCHAR(255);
UPDATE `incident_investigation` SET `status` = CASE `status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'IN_PROGRESS' WHEN '2' THEN 'COMPLETED' WHEN '3' THEN 'CANCELLED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- investigation_process.status (InvestigationStatus)
ALTER TABLE `investigation_process` MODIFY `status` VARCHAR(255);
UPDATE `investigation_process` SET `status` = CASE `status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'IN_PROGRESS' WHEN '2' THEN 'COMPLETED' WHEN '3' THEN 'CANCELLED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- lesson_learned.status (LessonStatus)
ALTER TABLE `lesson_learned` MODIFY `status` VARCHAR(255);
UPDATE `lesson_learned` SET `status` = CASE `status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'APPROVED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- location.status (Status)
ALTER TABLE `location` MODIFY `status` VARCHAR(255);
UPDATE `location` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- measurement.status (Status)
ALTER TABLE `measurement` MODIFY `status` VARCHAR(255);
UPDATE `measurement` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- non_conformity.type (EventType)
ALTER TABLE `non_conformity` MODIFY `type` VARCHAR(255);
UPDATE `non_conformity` SET `type` = CASE `type` WHEN '0' THEN 'NON_CONFORMITY' WHEN '1' THEN 'NEAR_MISS' WHEN '2' THEN 'HAZARD' ELSE `type` END WHERE `type` REGEXP '^[0-9]+$';

-- position_assignment.status (Status)
ALTER TABLE `position_assignment` MODIFY `status` VARCHAR(255);
UPDATE `position_assignment` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- ppe.status (PpeStatus)
ALTER TABLE `ppe` MODIFY `status` VARCHAR(255);
UPDATE `ppe` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- recommendation.status (RecommendationStatus)
ALTER TABLE `recommendation` MODIFY `status` VARCHAR(255);
UPDATE `recommendation` SET `status` = CASE `status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'IN_PROGRESS' WHEN '2' THEN 'COMPLETED' WHEN '3' THEN 'DELAYED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- recommendation_followup.status (RecommendationStatus)
ALTER TABLE `recommendation_followup` MODIFY `status` VARCHAR(255);
UPDATE `recommendation_followup` SET `status` = CASE `status` WHEN '0' THEN 'PENDING' WHEN '1' THEN 'IN_PROGRESS' WHEN '2' THEN 'COMPLETED' WHEN '3' THEN 'DELAYED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- report.status (AuditReportStatus)
ALTER TABLE `report` MODIFY `status` VARCHAR(255);
UPDATE `report` SET `status` = CASE `status` WHEN '0' THEN 'DRAFT' WHEN '1' THEN 'SUBMITTED' WHEN '2' THEN 'APPROVED' WHEN '3' THEN 'REJECTED' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- requirement.status (Status)
ALTER TABLE `requirement` MODIFY `status` VARCHAR(255);
UPDATE `requirement` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- severity_level.status (Status)
ALTER TABLE `severity_level` MODIFY `status` VARCHAR(255);
UPDATE `severity_level` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- team_member.role (Role)
ALTER TABLE `team_member` MODIFY `role` VARCHAR(255);
UPDATE `team_member` SET `role` = CASE `role` WHEN '0' THEN 'TEAM_LEAD' WHEN '1' THEN 'MEMBER' ELSE `role` END WHERE `role` REGEXP '^[0-9]+$';

-- team_member.status (Status)
ALTER TABLE `team_member` MODIFY `status` VARCHAR(255);
UPDATE `team_member` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- weather_condition.status (Status)
ALTER TABLE `weather_condition` MODIFY `status` VARCHAR(255);
UPDATE `weather_condition` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- work_area.status (Status)
ALTER TABLE `work_area` MODIFY `status` VARCHAR(255);
UPDATE `work_area` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

-- work_process.status (Status)
ALTER TABLE `work_process` MODIFY `status` VARCHAR(255);
UPDATE `work_process` SET `status` = CASE `status` WHEN '0' THEN 'ACTIVE' WHEN '1' THEN 'INACTIVE' ELSE `status` END WHERE `status` REGEXP '^[0-9]+$';

SET SQL_SAFE_UPDATES=1;