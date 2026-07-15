package com.minexpert.hns.repository.communications;

import com.minexpert.hns.entity.communications.NotiRunStatus;
import com.minexpert.hns.entity.communications.Notification;
import com.minexpert.hns.repository.communications.projection.NotificationSummaryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByStatus(NotiRunStatus status);

    Optional<Notification> findByDedupedKey(String dedupedKey);

    List<Notification> findByCommunication_Id(Long communicationId);

    List<NotificationSummaryView> findAllProjectedBy();

    // ── Cloisonnement par mine via la Communication parente. null = pas de
    //    filtre (systeme/allMines). La Notification n'a pas de company_id
    //    propre : elle herite du scope de sa Communication (parent scope).

    @Query("SELECT n FROM Notification n WHERE "
            + "(:companyId IS NULL OR n.communication.companyId = :companyId)")
    List<NotificationSummaryView> findAllProjectedByCompany(@Param("companyId") Long companyId);

    @Query("SELECT n FROM Notification n WHERE n.status = :status "
            + "AND (:companyId IS NULL OR n.communication.companyId = :companyId)")
    List<Notification> findByStatusAndCompany(@Param("status") NotiRunStatus status,
            @Param("companyId") Long companyId);

    /** companyId de la Communication parente d'une notification. */
    @Query("SELECT n.communication.companyId FROM Notification n WHERE n.id = :id")
    Optional<Long> findParentCompanyId(@Param("id") Long id);
}
