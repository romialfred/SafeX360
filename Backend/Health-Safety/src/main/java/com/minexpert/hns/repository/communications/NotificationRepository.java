package com.minexpert.hns.repository.communications;

import com.minexpert.hns.entity.communications.NotiRunStatus;
import com.minexpert.hns.entity.communications.Notification;
import com.minexpert.hns.repository.communications.projection.NotificationSummaryView;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByStatus(NotiRunStatus status);

    Optional<Notification> findByDedupedKey(String dedupedKey);

    List<Notification> findByCommunication_Id(Long communicationId);

    List<NotificationSummaryView> findAllProjectedBy();
}
