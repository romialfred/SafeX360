package com.minexpert.hns.config;

public final class AuditCacheNames {

    private AuditCacheNames() {
    }

    public static final String AUDIT_BY_ID = "auditById";
    public static final String AUDIT_LIST = "auditList";
    public static final String AUDIT_PLANNING_LIST = "auditPlanningList";
    public static final String AUDIT_DETAILS = "auditDetails";
    public static final String AUDIT_HISTORY_BY_AUDIT = "auditHistoryByAudit";

    public static final String REPORT_BY_ID = "auditReportById";
    public static final String REPORT_BY_AUDIT = "auditReportByAudit";
    public static final String REPORT_EXISTS_BY_AUDIT = "auditReportExists";

    public static final String AUDITOR_BY_ID = "auditorById";
    public static final String AUDITORS_BY_AUDIT = "auditorsByAudit";
    public static final String LEAD_AUDITORS = "leadAuditors";
    public static final String LEAD_AUDITORS_PLANNING = "leadAuditorsPlanning";

    public static final String CONTRIBUTOR_BY_ID = "contributorById";
    public static final String CONTRIBUTORS_BY_AUDIT = "contributorsByAudit";

    public static final String AREA_BY_ID = "auditAreaById";
    public static final String AREAS_BY_AUDIT = "auditAreasByAudit";
    public static final String AREA_DETAILS_BY_AUDIT = "auditAreaDetailsByAudit";

    public static final String AREA_EXECUTION_BY_ID = "areaExecutionById";
    public static final String AREA_EXECUTIONS_BY_AREA = "areaExecutionsByArea";

    public static final String MEETING_BY_ID = "auditMeetingById";
    public static final String MEETINGS_BY_AUDIT = "auditMeetingsByAudit";

    public static final String OBSERVATIONS_BY_AUDIT = "observationsByAudit";
    public static final String OBSERVATION_TITLES_BY_AUDIT = "observationTitlesByAudit";

    public static final String RECOMMENDATION_BY_ID = "recommendationById";
    public static final String RECOMMENDATIONS_BY_AUDIT = "recommendationsByAudit";
    public static final String RECOMMENDATION_DETAILS_ALL = "recommendationDetailsAll";
    public static final String RECOMMENDATION_DETAILS_BY_STATUS = "recommendationDetailsByStatus";

    public static final String RECOMMENDATION_FOLLOWUPS_BY_RECOMMENDATION = "recommendationFollowupsByRecommendation";
}
