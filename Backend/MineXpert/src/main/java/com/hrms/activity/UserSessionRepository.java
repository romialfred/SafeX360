package com.hrms.activity;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Page<UserSession> findByAccountIdOrderByStartedAtDesc(Long accountId, Pageable pageable);

    /** Session ouverte la plus recente d'un compte — celle a laquelle rattacher l'activite. */
    Optional<UserSession> findFirstByAccountIdAndEndedAtIsNullOrderByStartedAtDesc(Long accountId);

    long countByAccountId(Long accountId);

    /**
     * Cloture les sessions restees ouvertes au-dela du delai d'inactivite. Sans
     * cela, la session d'un utilisateur qui ferme simplement son navigateur
     * resterait « ouverte » indefiniment et fausserait tout comptage.
     */
    @Modifying
    @Query("update UserSession s set s.endedAt = :now, s.endReason = 'EXPIRED' "
            + "where s.endedAt is null and coalesce(s.lastSeenAt, s.startedAt) < :threshold")
    int closeStale(@Param("now") LocalDateTime now, @Param("threshold") LocalDateTime threshold);
}
