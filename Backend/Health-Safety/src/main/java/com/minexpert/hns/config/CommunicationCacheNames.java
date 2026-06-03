package com.minexpert.hns.config;

public final class CommunicationCacheNames {

    private CommunicationCacheNames() {
    }

    public static final String COMMUNICATION_BY_ID = "communicationById";
    public static final String COMMUNICATION_SUMMARIES = "communicationSummaries";
    public static final String COMMUNICATION_RECENT_SUMMARIES = "communicationRecentSummaries";
    public static final String COMMUNICATION_BY_DEPARTMENT = "communicationByDepartment";
    public static final String COMMUNICATION_STATS = "communicationStats";

    public static final String NOTIFICATION_BY_ID = "notificationById";
    public static final String NOTIFICATION_SUMMARIES = "notificationSummaries";
    public static final String NOTIFICATION_ACTIVE = "notificationActive";
    public static final String NOTIFICATION_EXPIRED = "notificationExpired";
    public static final String NOTIFICATION_BY_COMMUNICATION = "notificationByCommunication";
}
