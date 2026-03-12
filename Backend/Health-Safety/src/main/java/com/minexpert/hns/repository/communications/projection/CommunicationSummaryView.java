package com.minexpert.hns.repository.communications.projection;

import com.minexpert.hns.entity.communications.CommStatus;
import com.minexpert.hns.entity.communications.Communication.Urgency;
import com.minexpert.hns.entity.communications.ScheduleType;

import java.time.Instant;
import java.time.LocalDateTime;

public interface CommunicationSummaryView {
    Long getId();

    String getCategory();

    LocalDateTime getCreatedAt();

    Long getDepartmentId();

    LocalDateTime getExpiresAt();

    String getRecipients();

    String getSenderName();

    String getTitle();

    String getType();

    Long getZoneId();

    Urgency getUrgency();

    ScheduleView getSchedule();

    interface ScheduleView {
        Long getId();

        ScheduleType getScheduleType();

        CommStatus getStatus();

        Instant getNextRunAt();
    }
}
