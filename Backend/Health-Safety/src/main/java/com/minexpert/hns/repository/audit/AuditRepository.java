package com.minexpert.hns.repository.audit;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.enums.AuditStatus;

public interface AuditRepository extends CrudRepository<Audit, Long> {
    // Génération robuste du numéro : garde anti-collision + reprise de séquence.
    boolean existsByRefNumber(String refNumber);

    java.util.Optional<Audit> findFirstByRefNumberStartingWithOrderByRefNumberDesc(String prefix);

    @Query("SELECT i FROM Audit i WHERE FUNCTION('YEAR', i.createdAt) = :year ORDER BY i.id DESC")
    List<Audit> findTopByYearOrderByIdDesc(@Param("year") int year, Pageable pageable);

    @Query("SELECT a FROM Audit a WHERE a.planningStatus IS NOT NULL")
    List<Audit> findAllWithNonNullPlanningStatus();

    Optional<Audit> findFirstByStartDateGreaterThanEqualOrderByStartDateAsc(LocalDate date);

    Optional<Audit> findFirstByEndDateGreaterThanEqualOrderByEndDateAsc(LocalDate date);

    // ─── LOT 52 — Programme d'audit (ISO 19011:2018 §5) ────────────────────

    List<Audit> findByProgramId(Long programId);

    /**
     * Dernière date de fin d'audit clôturé par domaine (via le périmètre direct).
     * Utilisé par le calcul de priorisation basé risques.
     */
    @Query("SELECT a.scope.id, MAX(a.endDate) FROM Audit a "
            + "WHERE a.status = :status AND a.endDate IS NOT NULL GROUP BY a.scope.id")
    List<Object[]> findLastEndDateByScopeAndStatus(@Param("status") AuditStatus status);
}
