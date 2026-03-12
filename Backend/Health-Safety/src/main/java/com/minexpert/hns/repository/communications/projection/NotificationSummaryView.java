package com.minexpert.hns.repository.communications.projection;

import com.minexpert.hns.entity.communications.NotiRunStatus;
import com.minexpert.hns.entity.communications.Communication;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;

/**
 * Projection combining notification details with selected communication fields.
 */
public interface NotificationSummaryView {

    Long getId();

    NotiRunStatus getStatus();

    String getResponseMessage();

    LocalDateTime getCreatedAt();

    @Value("#{target.communication.id}")
    Long getCommunicationId();

    @Value("#{target.communication.type}")
    String getType();

    @Value("#{target.communication.recipients}")
    String getRecipients();

    @Value("#{target.communication.title}")
    String getTitle();

    @Value("#{target.communication.departmentId}")
    Long getDepartmentId();

    @Value("#{target.communication.urgency}")
    Communication.Urgency getUrgency();

    @Value("#{target.communication.zone != null ? target.communication.zone.id : null}")
    Long getZoneId();

    @Value("#{target.communication.zone != null ? target.communication.zone.name : null}")
    String getZoneName();
}
