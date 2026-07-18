package com.minexpert.hns.repository.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.IncidentResponse;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.repository.incident.projection.MonthlyClosureSummary;
import com.minexpert.hns.repository.projection.IdCount;
import com.minexpert.hns.repository.projection.LabelCount;

public interface IncidentRepository extends CrudRepository<Incident, Long> {
    Optional<Incident> findByIdAndCompanyId(Long id, Long companyId);

    // Génération robuste du numéro d'incident : la contrainte UNIQUE est GLOBALE
    // et des formats de numéro hétérogènes coexistent (INC-2026-000001 sur 3
    // segments ET INC-SYR-2026-0014 sur 4 segments). existsByNumber garantit
    // l'absence de collision ; findFirst...StartingWith récupère le dernier
    // numéro du format standard de l'année pour repartir de la bonne séquence.
    boolean existsByNumber(String number);

    Optional<Incident> findFirstByNumberStartingWithOrderByNumberDesc(String prefix);

    @Query("SELECT i FROM Incident i WHERE i.id = :id AND (:companyId IS NULL OR i.companyId = :companyId)")
    Optional<Incident> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);

    @Query("SELECT i.id as id, i.title AS title, i.location AS location, i.occurredAt AS occurredAt, i.status AS status FROM Incident i WHERE (:companyId IS NULL OR i.companyId = :companyId)")
    List<IncidentResponse> findAllIncidents(@Param("companyId") Long companyId);

    @Query(value = """
                            SELECT
                                i.id AS id,
                                i.title AS title,
                                i.department_id as departmentId,
                                i.occurred_at AS incidentDate,
                                i.reporter_id AS reporterId,
                                i.source AS source,
                                i.ai_confidence AS aiConfidence,
                               i.status AS status,
                                severity_info.level AS maxSeverityLevel,
                                severity_info.name AS severityLevelName,
                                severity_info.incident_category_name AS incidentCategoryName
                            FROM incident i
                            LEFT JOIN (
                                SELECT
                                    idt.incident_id,
                                    sl.level,
                                    sl.name,
                                    ic.name AS incident_category_name
                                FROM incident_detail idt
                                JOIN severity_level sl ON idt.severity_level_id = sl.id
                                JOIN incident_category ic ON sl.incident_category_id = ic.id
                                WHERE (idt.incident_id, sl.level) IN (
                                    SELECT
                                        idt2.incident_id,
                                        MAX(sl2.level)
                                    FROM incident_detail idt2
                                    JOIN severity_level sl2 ON idt2.severity_level_id = sl2.id
                                    GROUP BY idt2.incident_id
                                )
                            ) AS severity_info ON severity_info.incident_id = i.id
                            WHERE (:companyId IS NULL OR i.company_id = :companyId)
                        """, nativeQuery = true)
    List<IncidentResponse> findAllIncidentsWithMaxSeverity(@Param("companyId") Long companyId);

    @Query(value = """
                            SELECT
                                i.id AS id,
                                i.title AS title,
                                i.occurred_at AS incidentDate,
                                i.status AS status,
                                severity_info.level AS maxSeverityLevel,
                                severity_info.name AS severityLevelName,
                                severity_info.incident_category_name AS incidentCategoryName
                            FROM incident i
                            LEFT JOIN (
                                SELECT
                                    idt.incident_id,
                                    sl.level,
                                    sl.name,
                                    ic.name AS incident_category_name
                                FROM incident_detail idt
                                JOIN severity_level sl ON idt.severity_level_id = sl.id
                                JOIN incident_category ic ON sl.incident_category_id = ic.id
                                WHERE (idt.incident_id, sl.level) IN (
                                    SELECT
                                        idt2.incident_id,
                                        MAX(sl2.level)
                                    FROM incident_detail idt2
                                    JOIN severity_level sl2 ON idt2.severity_level_id = sl2.id
                                    GROUP BY idt2.incident_id
                                )
                            ) AS severity_info ON severity_info.incident_id = i.id
                                                        WHERE (:companyId IS NULL OR i.company_id = :companyId)
                                                            AND severity_info.level > 3
                        """, nativeQuery = true)
    List<IncidentResponse> findIncidentsWithSeverityAboveThree(@Param("companyId") Long companyId);

    // Projection complète : la version historique n'exposait ni gravité max, ni
    // catégorie, ni source/aiConfidence — le détail mobile/web affichait '—'.
    @Query(value = """
                            SELECT
                                i.id AS id,
                                i.title AS title,
                                loc.name AS location,
                                i.occurred_at AS incidentDate,
                                i.discovery_time AS discoveryDate,
                                i.number AS number,
                                i.reporter_id AS reporterId,
                                i.department_id AS departmentId,
                                i.source AS source,
                                i.ai_confidence AS aiConfidence,
                               i.status AS status,
                                severity_info.level AS maxSeverityLevel,
                                severity_info.name AS severityLevelName,
                                severity_info.incident_category_name AS incidentCategoryName
                            FROM incident i
                            LEFT JOIN location loc ON i.location_id = loc.id
                            LEFT JOIN (
                                SELECT
                                    idt.incident_id,
                                    sl.level,
                                    sl.name,
                                    ic.name AS incident_category_name
                                FROM incident_detail idt
                                JOIN severity_level sl ON idt.severity_level_id = sl.id
                                JOIN incident_category ic ON sl.incident_category_id = ic.id
                                WHERE (idt.incident_id, sl.level) IN (
                                    SELECT
                                        idt2.incident_id,
                                        MAX(sl2.level)
                                    FROM incident_detail idt2
                                    JOIN severity_level sl2 ON idt2.severity_level_id = sl2.id
                                    GROUP BY idt2.incident_id
                                )
                            ) AS severity_info ON severity_info.incident_id = i.id
                            WHERE i.id = :id AND (:companyId IS NULL OR i.company_id = :companyId)
                        """, nativeQuery = true)
    Optional<IncidentResponse> findByIncidentId(@Param("id") Long id, @Param("companyId") Long companyId);

    @Query("SELECT i FROM Incident i WHERE FUNCTION('YEAR', i.createdAt) = :year AND (:companyId IS NULL OR i.companyId = :companyId) ORDER BY i.id DESC")
    List<Incident> findTopByYearOrderByIdDesc(@Param("year") int year, @Param("companyId") Long companyId,
            Pageable pageable);

    @Query("""
            SELECT FUNCTION('MONTH', COALESCE(i.occurredAt, i.createdAt)) AS month,
                   COUNT(i.id) AS totalIncidents,
                   SUM(CASE WHEN i.status = com.minexpert.hns.enums.IncidentStatus.CLOSED THEN 1 ELSE 0 END) AS closedIncidents
            FROM Incident i
                        WHERE FUNCTION('YEAR', COALESCE(i.occurredAt, i.createdAt)) = :year
                            AND (:companyId IS NULL OR i.companyId = :companyId)
            GROUP BY FUNCTION('MONTH', COALESCE(i.occurredAt, i.createdAt))
            """)
    List<MonthlyClosureSummary> findMonthlyClosureSummaryByYear(@Param("year") int year,
            @Param("companyId") Long companyId);

    long countByCompanyIdAndDepartmentIdAndCreatedAtGreaterThanEqual(Long companyId, Long departmentId,
            LocalDateTime fromDate);

    long countByDepartmentIdAndCreatedAtGreaterThanEqual(Long departmentId, LocalDateTime fromDate);

    // ─────────────────────────────────────────────────────────────────────────
    // Tableau de bord HSE (GET /dashboard/ohs)
    //
    // SCOPING : toutes les requêtes ci-dessous portent le prédicat
    // (:companyId IS NULL OR <colonne société> = :companyId). companyId est
    // validé/clampé en amont par le CompanyScopeFilter ; null signifie « vue
    // consolidée toutes mines » (réservée aux comptes allMinesAccess) et ne
    // filtre alors rien. NE JAMAIS retirer ce prédicat : sans lui les compteurs
    // fuiteraient d'une mine à l'autre.
    //
    // DATE DE RÉFÉRENCE : COALESCE(occurredAt, createdAt) — occurredAt est la
    // date de survenue réelle mais reste nullable sur des déclarations partielles
    // (et sur des lignes legacy) ; on retombe alors sur la date de création pour
    // ne pas perdre l'incident du décompte annuel.
    //
    // Certaines requêtes portent sur IncidentDetail : elles sont volontairement
    // placées ici (et non dans IncidentDetailRepository) parce qu'elles
    // comptent des INCIDENTS et parce que les méthodes d'agrégation existantes
    // d'IncidentDetailRepository (countIncidentDetailsByCategory,
    // countIncidentDetailsBySeverityLevel, countByCategoryAndSeverityLevel)
    // n'ont AUCUN filtre société ni date — les réutiliser provoquerait une fuite
    // inter-entreprises. On repasse donc systématiquement par
    // d.incident.companyId.
    // ─────────────────────────────────────────────────────────────────────────

    /** Nombre d'incidents d'une année, scopé mine. */
    @Query("""
            SELECT COUNT(i) FROM Incident i
            WHERE FUNCTION('YEAR', COALESCE(i.occurredAt, i.createdAt)) = :year
              AND (:companyId IS NULL OR i.companyId = :companyId)
            """)
    long countByYearAndCompany(@Param("year") int year, @Param("companyId") Long companyId);

    /**
     * Date du dernier incident GRAVE, tous exercices confondus, scopée mine.
     * « Grave » = l'incident porte au moins un IncidentDetail dont le niveau de
     * gravité est >= 4. Renvoie null si aucun incident grave n'est enregistré :
     * le service traduit ce null par daysWithoutSeriousIncident = null (et non
     * 0, qui signifierait à tort « un incident grave aujourd'hui »).
     */
    @Query("""
            SELECT MAX(COALESCE(d.incident.occurredAt, d.incident.createdAt))
            FROM IncidentDetail d
            WHERE d.severityLevel.level >= :minLevel
              AND (:companyId IS NULL OR d.incident.companyId = :companyId)
            """)
    LocalDateTime findLastSeriousIncidentDate(@Param("minLevel") int minLevel,
            @Param("companyId") Long companyId);

    /**
     * Répartition des incidents par catégorie, via le lien DIRECT
     * incident_detail.incident_category_id. Un incident pouvant porter
     * plusieurs détails (donc plusieurs catégories), on compte des incidents
     * DISTINCTS par catégorie : la somme des barres peut donc dépasser le total
     * d'incidents, ce qui est le comportement correct pour un incident
     * multi-catégories.
     */
    @Query("""
            SELECT c.name AS label, COUNT(DISTINCT d.incident.id) AS total
            FROM IncidentDetail d
            JOIN d.incidentCategory c
            WHERE FUNCTION('YEAR', COALESCE(d.incident.occurredAt, d.incident.createdAt)) = :year
              AND (:companyId IS NULL OR d.incident.companyId = :companyId)
            GROUP BY c.name
            ORDER BY COUNT(DISTINCT d.incident.id) DESC
            """)
    List<LabelCount> findIncidentCountByCategory(@Param("year") int year, @Param("companyId") Long companyId);

    /**
     * Répartition des incidents par gravité. Incident et IncidentDetail ne
     * portent pas de gravité « de tête » : on dérive UNE gravité par incident
     * en retenant le MAX(sl.level) de ses détails, exactement le motif déjà
     * éprouvé par findAllIncidentsWithMaxSeverity. Requête native car le motif
     * IN (colonne, MAX(colonne)) n'a pas d'équivalent JPQL portable.
     */
    @Query(value = """
            SELECT sl.name AS label, COUNT(DISTINCT idt.incident_id) AS total
            FROM incident i
            JOIN incident_detail idt ON idt.incident_id = i.id
            JOIN severity_level sl ON idt.severity_level_id = sl.id
            WHERE (idt.incident_id, sl.level) IN (
                    SELECT idt2.incident_id, MAX(sl2.level)
                    FROM incident_detail idt2
                    JOIN severity_level sl2 ON idt2.severity_level_id = sl2.id
                    GROUP BY idt2.incident_id
                  )
              AND YEAR(COALESCE(i.occurred_at, i.created_at)) = :year
              AND (:companyId IS NULL OR i.company_id = :companyId)
            GROUP BY sl.name
            ORDER BY COUNT(DISTINCT idt.incident_id) DESC
            """, nativeQuery = true)
    List<LabelCount> findIncidentCountBySeverity(@Param("year") int year, @Param("companyId") Long companyId);

    /**
     * Répartition des incidents par mine — n'a de sens qu'en vue consolidée.
     * Le libellé lisible n'est pas résolu ici : HNS ne connaît pas le
     * référentiel des sociétés (porté par MineXpert/HRMS), l'IHM fait la
     * correspondance id → nom.
     */
    @Query("""
            SELECT i.companyId AS id, COUNT(i) AS total
            FROM Incident i
            WHERE FUNCTION('YEAR', COALESCE(i.occurredAt, i.createdAt)) = :year
              AND i.companyId IS NOT NULL
            GROUP BY i.companyId
            ORDER BY COUNT(i) DESC
            """)
    List<IdCount> findIncidentCountByCompany(@Param("year") int year);
}
