package com.minexpert.hns.repository.nonConformity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.nonConformity.NcInfo;
import com.minexpert.hns.entity.nonConformity.NonConformity;
import com.minexpert.hns.enums.EventStatus;
import com.minexpert.hns.enums.EventType;
import com.minexpert.hns.repository.projection.MonthCount;

public interface NonConformityRepository extends CrudRepository<NonConformity, Long> {
    // Génération robuste du numéro : garde anti-collision (contrainte UNIQUE globale).
    boolean existsByNumber(String number);
    @Query("SELECT i FROM NonConformity i WHERE FUNCTION('YEAR', i.createdAt) = :year ORDER BY i.id DESC")
    List<NonConformity> findTopByYearOrderByIdDesc(@Param("year") int year, Pageable pageable);

    @Query("""
                SELECT new com.minexpert.hns.dto.nonConformity.NcInfo(
                    nc.id,
                    nc.type,
                    nc.number,
                    nc.title,
                    nc.date,
                    nc.reportedBy,
                    null,
                    ea.severityLevel,
                    ea.priority,
                    ea.deadline,
                    nc.status
                )
                FROM NonConformity nc
                LEFT JOIN EventAnalysis ea ON ea.nonConformity.id = nc.id
                WHERE (:companyId IS NULL OR nc.companyId = :companyId)
            """)
    List<NcInfo> findAllNcInfo(@Param("companyId") Long companyId);

    @Query("SELECT new com.minexpert.hns.dto.nonConformity.NcInfo(" +
            "nc.id, nc.type, nc.number, nc.title, nc.date, nc.reportedBy, " +
            "null, ea.severityLevel, ea.priority,  null,  nc.status) " +
            "FROM NonConformity nc LEFT JOIN EventAnalysis ea ON ea.nonConformity.id = nc.id " +
            "WHERE nc.id = :id AND (:companyId IS NULL OR nc.companyId = :companyId)")
    Optional<NcInfo> findNcInfoById(@Param("id") Long id, @Param("companyId") Long companyId);

    Optional<NonConformity> findFirstByTypeAndDateGreaterThanEqualAndStatusNotInOrderByDateAsc(EventType type,
            LocalDate date, List<EventStatus> excludedStatuses);

    /** LOT 52 — total des non-conformités ouvertes (fallback du score de risque). */
    long countByStatusNotIn(List<EventStatus> excludedStatuses);

    // ─────────────────────────────────────────────────────────────────────────
    // Tableau de bord HSE (GET /dashboard/ohs) — presqu'accidents
    //
    // SCOPING : prédicat (:companyId IS NULL OR nc.companyId = :companyId) sur
    // chaque requête. companyId null = vue consolidée (aucun filtre) ; sinon
    // filtre strict. Sans ce prédicat les presqu'accidents d'une mine
    // remonteraient sur le tableau de bord d'une autre.
    //
    // DATE DE RÉFÉRENCE : COALESCE(nc.date, nc.detectionDate) — `date` est la
    // date de l'événement mais reste nullable ; on replie alors sur la date de
    // détection plutôt que de perdre la ligne du décompte annuel.
    // ─────────────────────────────────────────────────────────────────────────

    /** Nombre de presqu'accidents (EventType.NEAR_MISS) de l'année, scopé mine. */
    @Query("""
            SELECT COUNT(nc) FROM NonConformity nc
            WHERE nc.type = com.minexpert.hns.enums.EventType.NEAR_MISS
              AND FUNCTION('YEAR', COALESCE(nc.date, nc.detectionDate)) = :year
              AND (:companyId IS NULL OR nc.companyId = :companyId)
            """)
    long countNearMissByYear(@Param("year") int year, @Param("companyId") Long companyId);

    /**
     * Presqu'accidents groupés par mois. Les mois sans presqu'accident sont
     * ABSENTS du résultat : le service complète les 12 mois à 0.
     */
    @Query("""
            SELECT FUNCTION('MONTH', COALESCE(nc.date, nc.detectionDate)) AS month,
                   COUNT(nc) AS total
            FROM NonConformity nc
            WHERE nc.type = com.minexpert.hns.enums.EventType.NEAR_MISS
              AND FUNCTION('YEAR', COALESCE(nc.date, nc.detectionDate)) = :year
              AND (:companyId IS NULL OR nc.companyId = :companyId)
            GROUP BY FUNCTION('MONTH', COALESCE(nc.date, nc.detectionDate))
            """)
    List<MonthCount> findMonthlyNearMissByYear(@Param("year") int year, @Param("companyId") Long companyId);
}
