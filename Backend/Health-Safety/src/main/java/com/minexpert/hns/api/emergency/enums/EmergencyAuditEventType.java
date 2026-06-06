package com.minexpert.hns.api.emergency.enums;

/**
 * Types d'événements écrits dans le journal d'audit immuable
 * ({@code emergency_audit_log}). Liste évolutive — étendre prudemment,
 * car les valeurs persistent en clair conformément à ISO 45001 §9.1.2.
 */
public enum EmergencyAuditEventType {
    // Permissions
    PERMISSION_GRANTED,
    PERMISSION_REVOKED,

    // Settings
    SETTINGS_UPDATED,
    MEDIA_UPLOADED,

    // Assembly point
    ASSEMBLY_POINT_CREATED,
    ASSEMBLY_POINT_UPDATED,
    ASSEMBLY_POINT_ARCHIVED,

    // Rescue team
    RESCUE_TEAM_CREATED,
    RESCUE_TEAM_UPDATED,
    RESCUE_TEAM_MEMBER_ADDED,
    RESCUE_TEAM_MEMBER_REMOVED,
    SHIFT_CREATED,
    SHIFT_UPDATED,

    // Escalation
    ESCALATION_RULE_CREATED,
    ESCALATION_RULE_UPDATED,

    // SOS lifecycle (Phase 3 — déjà déclaré pour cohérence)
    SOS_RECEIVED,
    SOS_ACKNOWLEDGED,
    SOS_CALL_STARTED,
    SOS_DISPATCHED,
    SOS_ON_SITE,
    SOS_CLOSED,
    SOS_ESCALATED,
    SOS_FALSE_ALARM,

    // General alert (Phase 4 — déjà déclaré pour cohérence)
    ALERT_TRIGGERED,
    ALERT_ACKNOWLEDGED,
    ALERT_ENDED
}
