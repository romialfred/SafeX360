package com.minexpert.hns.repository.notification;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.notification.HseNotification;

public interface HseNotificationRepository extends JpaRepository<HseNotification, Long> {

    /** Garantit l'idempotence : une clé déjà présente = notification déjà émise. */
    boolean existsByDedupeKey(String dedupeKey);

    @Query("SELECT n FROM HseNotification n WHERE n.companyId = :companyId "
            + "ORDER BY n.createdAt DESC")
    List<HseNotification> findRecent(@Param("companyId") Long companyId, Pageable pageable);

    @Query("SELECT n FROM HseNotification n WHERE n.companyId = :companyId AND n.read = false "
            + "ORDER BY n.createdAt DESC")
    List<HseNotification> findUnread(@Param("companyId") Long companyId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM HseNotification n WHERE n.companyId = :companyId AND n.read = false")
    long countUnread(@Param("companyId") Long companyId);

    // Cloisonné : on ne marque « lu » qu'une notification de la mine ciblée.
    @Modifying
    @Query("UPDATE HseNotification n SET n.read = true WHERE n.id = :id AND n.companyId = :companyId")
    int markRead(@Param("companyId") Long companyId, @Param("id") Long id);

    @Modifying
    @Query("UPDATE HseNotification n SET n.read = true WHERE n.companyId = :companyId AND n.read = false")
    int markAllRead(@Param("companyId") Long companyId);
}
