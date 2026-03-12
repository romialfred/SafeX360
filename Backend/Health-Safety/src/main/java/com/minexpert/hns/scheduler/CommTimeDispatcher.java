package com.minexpert.hns.scheduler;

import com.minexpert.hns.entity.communications.CommStatus;
import com.minexpert.hns.entity.communications.CommTime;
import com.minexpert.hns.entity.communications.Communication;
import com.minexpert.hns.entity.communications.NotiRunStatus;
import com.minexpert.hns.entity.communications.Notification;
import com.minexpert.hns.entity.communications.ScheduleType;
import com.minexpert.hns.repository.communications.CommTimeRepository;
import com.minexpert.hns.repository.communications.NotificationRepository;
import com.minexpert.hns.service.communications.CommunicationSendService;
import com.minexpert.hns.service.communications.ScheduleCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Scheduled dispatcher that claims due CommTime rows, sends communications, and records notifications.
 */
@Service
public class CommTimeDispatcher {

    private static final Logger log = LoggerFactory.getLogger(CommTimeDispatcher.class);

    private final CommTimeRepository commTimeRepository;
    private final NotificationRepository notificationRepository;
    private final CommunicationSendService communicationSendService;
    private final ScheduleCalculator scheduleCalculator;

    @Value("${scheduler.batch-size:50}")
    private int batchSize;

    @Value("${scheduler.retry-backoff-seconds:300}")
    private long retryBackoffSeconds;

    public CommTimeDispatcher(CommTimeRepository commTimeRepository,
                              NotificationRepository notificationRepository,
                              CommunicationSendService communicationSendService,
                              ScheduleCalculator scheduleCalculator) {
        this.commTimeRepository = commTimeRepository;
        this.notificationRepository = notificationRepository;
        this.communicationSendService = communicationSendService;
        this.scheduleCalculator = scheduleCalculator;
    }

    @Scheduled(fixedDelayString = "${scheduler.poll-ms:60000}")
    @Transactional
    public void dispatch() {
        Instant now = Instant.now();
        List<CommTime> due = commTimeRepository.findDueForRun(CommStatus.ACTIVE, now, PageRequest.of(0, batchSize));
        for (CommTime commTime : due) {
            processCommTime(commTime, now);
        }
    }

    private void processCommTime(CommTime commTime, Instant now) {
        Instant scheduled = commTime.getNextRunAt();
        if (scheduled == null) {
            return;
        }

        String dedupeKey = commTime.getId() + ":" + scheduled.toEpochMilli();
        Optional<Notification> existing = notificationRepository.findByDedupedKey(dedupeKey);
        if (existing.isPresent()) {
            return;
        }

        Communication communication = commTime.getCommunication();
        if (communication == null) {
            log.error("CommTime {} is missing its communication relationship", commTime.getId());
            return;
        }

        Notification notification = new Notification();
        notification.setCommTime(commTime);
        notification.setCommunication(communication);
        notification.setDedupedKey(dedupeKey);

        try {
            String response = communicationSendService.send(communication);
            notification.setStatus(NotiRunStatus.SUCCESS);
            notification.setResponseMessage(truncate(response));
            notificationRepository.save(notification);

            commTime.setLastRunAt(now);
            if (commTime.getScheduleType() == ScheduleType.ONE_TIME) {
                commTime.setStatus(CommStatus.COMPLETED);
                commTime.setNextRunAt(null);
            } else {
                Instant next = scheduleCalculator.computeNextAfterSuccess(commTime, now);
                commTime.setNextRunAt(next);
            }
            commTimeRepository.save(commTime);

        } catch (Exception ex) {
            log.error("Failed to send communication {} for commTime {}", communication.getId(), commTime.getId(), ex);
            notification.setStatus(NotiRunStatus.FAILURE);
            notification.setResponseMessage(truncate(ex.getMessage()));
            notificationRepository.save(notification);

            commTime.setNextRunAt(now.plusSeconds(retryBackoffSeconds));
            commTimeRepository.save(commTime);
        }
    }

    private String truncate(String message) {
        if (message == null) {
            return null;
        }
        return message.length() <= 500 ? message : message.substring(0, 500);
    }
}

