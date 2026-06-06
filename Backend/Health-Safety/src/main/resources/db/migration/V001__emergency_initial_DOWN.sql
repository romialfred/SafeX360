-- ============================================================================
-- LOT 48 — ROLLBACK migration V001__emergency_initial
-- ----------------------------------------------------------------------------
-- Rejoue l'état antérieur en supprimant toutes les tables / triggers créés.
-- Ordre de suppression : enfants (FK) puis parents.
-- ============================================================================

DROP TRIGGER IF EXISTS trg_emergency_audit_log_no_delete;
DROP TRIGGER IF EXISTS trg_emergency_audit_log_no_update;

DROP TABLE IF EXISTS emergency_audit_log;
DROP TABLE IF EXISTS emergency_media;
DROP TABLE IF EXISTS emergency_settings;
DROP TABLE IF EXISTS false_alarm_reason;
DROP TABLE IF EXISTS sos_reason_category;
DROP TABLE IF EXISTS escalation_rule;
DROP TABLE IF EXISTS rescue_shift;
DROP TABLE IF EXISTS rescue_team_member;
DROP TABLE IF EXISTS rescue_team;
DROP TABLE IF EXISTS assembly_point_department;
DROP TABLE IF EXISTS assembly_point;
DROP TABLE IF EXISTS emergency_user_permission;

-- ============================================================================
-- Fin du rollback : aucun reste structurel de la migration V001.
-- ============================================================================
