package com.minexpert.hns.repository.incident;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.CorrectiveActionResponse;
import com.minexpert.hns.entity.incident.CorrectiveAction;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.repository.projection.LabelCount;

public interface CorrectiveActionRepository extends CrudRepository<CorrectiveAction, Long> {

    @Query("SELECT c FROM CorrectiveAction c WHERE c.incident.id = :incidentId AND (:companyId IS NULL OR c.companyId = :companyId)")
    List<CorrectiveAction> findByIncidentId(@Param("companyId") Long companyId, @Param("incidentId") Long incidentId);

    @Query("""
                SELECT new com.minexpert.hns.dto.response.CorrectiveActionResponse(
                    c.id,
                    c.actionName,
                    COALESCE(i.id, g.id, h.id, n.id),
                    CASE
                        WHEN i IS NOT NULL THEN i.title
                        WHEN ha IS NOT NULL THEN ha.title
                        WHEN ga IS NOT NULL THEN ga.title
                        WHEN n IS NOT NULL THEN n.title
                        ELSE 'Untitled'
                    END,
                    c.assignedEmployeeId,
                    null,
                    c.departmentId,
                    c.ownerId,
                    c.companyId,
                    c.deadline,
                    c.status,
                    null,
                    c.progress,
                    CASE
                        WHEN i IS NOT NULL THEN 'INCIDENT'
                        WHEN h IS NOT NULL THEN 'HS_ACTIVITY'
                        WHEN g IS NOT NULL THEN 'GENERAL_INSPECTION'
                        WHEN n IS NOT NULL THEN
                            CASE n.type
                                WHEN 'NON_CONFORMITY' THEN 'NON_CONFORMITY'
                                WHEN 'NEAR_MISS' THEN 'NEAR_MISS'
                                ELSE 'HAZARD'
                            END
                        ELSE 'GENERAL_INSPECTION'
                    END
                )
                FROM CorrectiveAction c
                LEFT JOIN c.incident i
                LEFT JOIN c.generalInspection g
                LEFT JOIN g.activity ga
                LEFT JOIN c.hsActivity h
                LEFT JOIN h.activity ha
                LEFT JOIN c.nonConformity n
                WHERE (i.id IS NOT NULL OR g.id IS NOT NULL OR h.id IS NOT NULL OR n.id IS NOT NULL)
                  AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveActionResponse> findAllActions(@Param("companyId") Long companyId);

    @Query("""
            SELECT new com.minexpert.hns.dto.response.CorrectiveActionResponse(
            c.id,
            c.actionName,
            c.incident.id,
            c.incident.title,
            c.assignedEmployeeId,
            null,
            c.departmentId,
            c.ownerId,
            c.companyId,
            c.deadline,
            c.status,
            c.description,
            c.progress,
            'INCIDENT'
            )
            FROM CorrectiveAction c
            WHERE c.incident.id = :incidentId
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveActionResponse> findActionsByIncidentId(@Param("companyId") Long companyId,
            @Param("incidentId") Long incidentId);

    @Query("""
            SELECT new com.minexpert.hns.dto.response.CorrectiveActionResponse(
            c.id,
            c.actionName,
            c.generalInspection.id,
            c.generalInspection.activity.title,
            c.assignedEmployeeId,
            null,
            c.departmentId,
            c.ownerId,
            c.companyId,
            c.deadline,
            c.status,
            c.description,
            c.progress,
            'GENERAL_INSPECTION'
            )
            FROM CorrectiveAction c
            WHERE c.generalInspection.id = :inspectionId
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveActionResponse> findActionsByInspectionId(@Param("companyId") Long companyId,
            @Param("inspectionId") Long inspectionId);

    @Query("""
            SELECT new com.minexpert.hns.dto.response.CorrectiveActionResponse(
            c.id,
            c.actionName,
            c.hsActivity.id,
            c.hsActivity.activity.title,
            c.assignedEmployeeId,
            null,
            c.departmentId,
            c.ownerId,
            c.companyId,
            c.deadline,
            c.status,
            c.description,
            c.progress,
            'HS_ACTIVITY'
            )
            FROM CorrectiveAction c
            WHERE c.hsActivity.id = :activityId
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveActionResponse> findActionsByActivityId(@Param("companyId") Long companyId,
            @Param("activityId") Long activityId);

    @Query("""
            SELECT new com.minexpert.hns.dto.response.CorrectiveActionResponse(
                c.id,
                c.actionName,
                COALESCE(i.id, g.id, h.id, n.id),
                CASE
                    WHEN i IS NOT NULL THEN i.title
                    WHEN ha IS NOT NULL THEN ha.title
                    WHEN ga IS NOT NULL THEN ga.title
                    WHEN n IS NOT NULL THEN n.title
                    ELSE 'ADHOC'
                END,
                c.assignedEmployeeId,
                null,
                c.departmentId,
                c.ownerId,
                c.companyId,
                c.deadline,
                c.status,
                null,
                c.progress,
                CASE
                    WHEN i IS NOT NULL THEN 'INCIDENT'
                    WHEN h IS NOT NULL THEN 'HS_ACTIVITY'
                    WHEN g IS NOT NULL THEN 'GENERAL_INSPECTION'
                    WHEN n IS NOT NULL THEN
                        CASE n.type
                            WHEN 'NON_CONFORMITY' THEN 'NON_CONFORMITY'
                            WHEN 'NEAR_MISS' THEN 'NEAR_MISS'
                            ELSE 'HAZARD'
                        END
                    ELSE 'ADHOC'
                END
            )
            FROM CorrectiveAction c
            LEFT JOIN c.incident i
            LEFT JOIN c.generalInspection g
            LEFT JOIN g.activity ga
            LEFT JOIN c.hsActivity h
            LEFT JOIN h.activity ha
            LEFT JOIN c.nonConformity n
            WHERE (i.id IS NOT NULL OR g.id IS NOT NULL OR h.id IS NOT NULL OR n.id IS NOT NULL)
              AND (c.departmentId = :departmentId OR c.departmentId IS NULL)
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveActionResponse> findActionsByDepartmentId(@Param("companyId") Long companyId,
            @Param("departmentId") Long departmentId);

    @Query("""
            SELECT new com.minexpert.hns.dto.response.CorrectiveActionResponse(
            c.id,
            c.actionName,
            c.nonConformity.id,
            c.nonConformity.title,
            c.assignedEmployeeId,
            null,
            c.departmentId,
            c.ownerId,
            c.companyId,
            c.deadline,
            c.status,
            c.description,
            c.progress,
            c.nonConformity.type
            )
            FROM CorrectiveAction c
            WHERE c.nonConformity.id = :nonConformityId
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveActionResponse> findActionsByNonConformityId(@Param("companyId") Long companyId,
            @Param("nonConformityId") Long nonConformityId);

    @Query("""
            SELECT new com.minexpert.hns.dto.response.CorrectiveActionResponse(
                    c.id,
                    c.actionName,
                    null,
                    'ADHOC',
                    c.assignedEmployeeId,
                    null,
                    c.departmentId,
                    c.ownerId,
                    c.companyId,
                    c.deadline,
                    c.status,
                    null,
                    c.progress,
                    'ADHOC'
            )
            FROM CorrectiveAction c
            WHERE c.incident IS NULL
                AND c.generalInspection IS NULL
                AND c.hsActivity IS NULL
                AND c.nonConformity IS NULL
                AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveActionResponse> findAdhocActions(@Param("companyId") Long companyId);

    @Query("""
                SELECT new com.minexpert.hns.dto.response.CorrectiveActionResponse(
                    c.id,
                    c.actionName,
                    COALESCE(i.id, g.id, h.id, n.id),
                    CASE
                        WHEN i IS NOT NULL THEN i.title
                        WHEN ha IS NOT NULL THEN ha.title
                        WHEN ga IS NOT NULL THEN ga.title
                        WHEN n IS NOT NULL THEN n.title
                        ELSE 'ADHOC'
                    END,
                    c.assignedEmployeeId,
                    null,
                    c.departmentId,
                    c.ownerId,
                    c.companyId,
                    c.deadline,
                    c.status,
                    null,
                    c.progress,
                    CASE
                        WHEN i IS NOT NULL THEN 'INCIDENT'
                        WHEN h IS NOT NULL THEN 'HS_ACTIVITY'
                        WHEN g IS NOT NULL THEN 'GENERAL_INSPECTION'
                        WHEN n IS NOT NULL THEN
                            CASE n.type
                                WHEN 'NON_CONFORMITY' THEN 'NON_CONFORMITY'
                                WHEN 'NEAR_MISS' THEN 'NEAR_MISS'
                                ELSE 'NOT_MATCHED'
                            END
                        ELSE 'ADHOC'
                    END
                )
                FROM CorrectiveAction c
                LEFT JOIN c.incident i
                LEFT JOIN c.generalInspection g
                LEFT JOIN g.activity ga
                LEFT JOIN c.hsActivity h
                LEFT JOIN h.activity ha
                LEFT JOIN c.nonConformity n
                WHERE c.status = :status
                  AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveActionResponse> findAllActionsByStatus(@Param("companyId") Long companyId,
            @Param("status") ActionStatus status);

    // ─── Module Gestion des Erreurs : CAPA rattachees a un evenement erreur ───

    /** CAPA liees a un evenement erreur (lien federateur), filtrees par societe. */
    @Query("""
            SELECT c FROM CorrectiveAction c
            WHERE c.errorEventId IS NOT NULL
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveAction> findByErrorEventLink(@Param("companyId") Long companyId);

    /** CAPA d'un evenement erreur donne. */
    @Query("""
            SELECT c FROM CorrectiveAction c
            WHERE c.errorEventId = :errorEventId
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveAction> findByErrorEventId(@Param("companyId") Long companyId,
            @Param("errorEventId") Long errorEventId);

    /** Nombre de CAPA en retard (echeance depassee, statut non terminal) liees a une erreur. */
    @Query("""
            SELECT COUNT(c) FROM CorrectiveAction c
            WHERE c.errorEventId IS NOT NULL
              AND c.deadline < :today
              AND c.status NOT IN :closedStatuses
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    long countOverdueErrorCapa(@Param("companyId") Long companyId,
            @Param("today") LocalDate today,
            @Param("closedStatuses") List<ActionStatus> closedStatuses);

    /**
     * Tableau de bord HSE — nombre TOTAL d'actions correctives en retard
     * (échéance dépassée, statut non terminal), toutes origines confondues.
     *
     * <p>Reprend le motif de {@link #countOverdueErrorCapa} SANS le prédicat
     * {@code c.errorEventId IS NOT NULL} : celui-ci restreint le décompte aux
     * seules CAPA du module Gestion des Erreurs, alors que le tableau de bord
     * doit alerter sur toutes les actions correctives en retard (incidents,
     * audits, risques, ad hoc…).</p>
     *
     * <p>SCOPING : (:companyId IS NULL OR c.companyId = :companyId) — companyId
     * null = vue consolidée, sinon filtre strict par mine. Les actions dont
     * l'échéance est nulle sont naturellement exclues (comparaison NULL) : on
     * ne peut pas affirmer qu'une action sans échéance est « en retard ».</p>
     */
    @Query("""
            SELECT COUNT(c) FROM CorrectiveAction c
            WHERE c.deadline < :today
              AND c.status NOT IN :closedStatuses
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    long countOverdueActions(@Param("companyId") Long companyId,
            @Param("today") LocalDate today,
            @Param("closedStatuses") List<ActionStatus> closedStatuses);

    // ─── Tableau de bord : suivi des actions correctives (ISO 45001 §10.2) ───
    //
    // Ces deux requêtes sont bornées à l'EXERCICE (année de création) pour
    // rester cohérentes avec le sélecteur d'année de l'écran. Elles ne
    // remplacent pas countOverdueActions ci-dessus, qui alimente l'ALERTE et
    // reste volontairement au présent, toutes années confondues : une action
    // de 2024 encore en retard aujourd'hui doit alerter même si l'utilisateur
    // consulte l'exercice 2026.

    /**
     * Répartition des actions correctives de l'exercice par statut. Série
     * EXCLUSIVE (une action porte un seul statut) : sa somme est le total.
     */
    @Query("""
            SELECT CAST(c.status AS string) AS label, COUNT(c) AS total
            FROM CorrectiveAction c
            WHERE FUNCTION('YEAR', c.createdAt) = :year
              AND (:companyId IS NULL OR c.companyId = :companyId)
            GROUP BY c.status
            ORDER BY COUNT(c) DESC
            """)
    List<LabelCount> findActionCountByStatus(@Param("year") int year, @Param("companyId") Long companyId);

    /**
     * Actions de l'exercice dont l'échéance est dépassée sans être closes.
     * Les actions sans échéance sont naturellement exclues (comparaison NULL) :
     * on ne peut pas affirmer qu'une action sans date est « en retard ».
     */
    @Query("""
            SELECT COUNT(c) FROM CorrectiveAction c
            WHERE FUNCTION('YEAR', c.createdAt) = :year
              AND c.deadline < :today
              AND c.status NOT IN :closedStatuses
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    long countOverdueActionsByYear(@Param("year") int year,
            @Param("companyId") Long companyId,
            @Param("today") LocalDate today,
            @Param("closedStatuses") List<ActionStatus> closedStatuses);

    // ─── Module Gestion des Risques : CAPA rattachees a un controle du Plan de maitrise ───

    /** CAPA liees a un controle du Plan de maitrise d'un risque (lien federateur). */
    @Query("SELECT c FROM CorrectiveAction c WHERE c.riskControlId = :riskControlId AND (:companyId IS NULL OR c.companyId = :companyId)")
    List<CorrectiveAction> findByRiskControlId(@Param("companyId") Long companyId, @Param("riskControlId") Long riskControlId);

    long countByIncident_CompanyIdAndDepartmentIdAndStatusInAndDeadlineBetween(Long companyId, Long departmentId,
            List<ActionStatus> statuses,
            LocalDate fromDate, LocalDate toDate);

    long countByDepartmentIdAndStatusInAndDeadlineBetween(Long departmentId, List<ActionStatus> statuses,
            LocalDate fromDate, LocalDate toDate);

    @Query("""
            SELECT new com.minexpert.hns.dto.response.CorrectiveActionResponse(
            c.id,
            c.actionName,
            null,
            'ADHOC',
            c.assignedEmployeeId,
            null,
            c.departmentId,
            c.ownerId,
            c.companyId,
            c.deadline,
            c.status,
            null,
            c.progress,
            'ADHOC'
            )
            FROM CorrectiveAction c
            WHERE c.incident IS NULL
              AND c.generalInspection IS NULL
              AND c.hsActivity IS NULL
              AND c.nonConformity IS NULL
              AND c.status = :status
              AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    List<CorrectiveActionResponse> findAdhocActionsByStatus(@Param("companyId") Long companyId,
            @Param("status") ActionStatus status);

    @Query("""
                SELECT new com.minexpert.hns.dto.response.CorrectiveActionResponse(
                    c.id,
                    c.actionName,
                    COALESCE(i.id, g.id, h.id, n.id),
                    CASE
                        WHEN i IS NOT NULL THEN i.title
                        WHEN ha IS NOT NULL THEN ha.title
                        WHEN ga IS NOT NULL THEN ga.title
                        WHEN n IS NOT NULL THEN n.title
                        ELSE 'ADHOC'
                    END,
                    c.assignedEmployeeId,
                    null,
                    c.departmentId,
                    c.ownerId,
                    c.companyId,
                    c.deadline,
                    c.status,
                    c.description,
                    c.progress,
                    CASE
                        WHEN i IS NOT NULL THEN 'INCIDENT'
                        WHEN h IS NOT NULL THEN 'HS_ACTIVITY'
                        WHEN g IS NOT NULL THEN 'GENERAL_INSPECTION'
                        WHEN n IS NOT NULL THEN
                            CASE n.type
                                WHEN 'NON_CONFORMITY' THEN 'NON_CONFORMITY'
                                WHEN 'NEAR_MISS' THEN 'NEAR_MISS'
                                ELSE 'NOT_MATCHED'
                            END
                        ELSE 'ADHOC'
                    END
                )
                FROM CorrectiveAction c
                LEFT JOIN c.incident i
                LEFT JOIN c.generalInspection g
                LEFT JOIN g.activity ga
                LEFT JOIN c.hsActivity h
                LEFT JOIN h.activity ha
                LEFT JOIN c.nonConformity n
                WHERE c.id = :id
                  AND (:companyId IS NULL OR c.companyId = :companyId)
            """)
    CorrectiveActionResponse getCorrectiveActionById(@Param("companyId") Long companyId, @Param("id") Long id);
}
