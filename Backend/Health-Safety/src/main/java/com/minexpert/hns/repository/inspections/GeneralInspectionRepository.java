package com.minexpert.hns.repository.inspections;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.GeneralInspectionResponse;
import com.minexpert.hns.dto.response.InspectionInfo;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.enums.InspectionTemplateType;
import com.minexpert.hns.repository.projection.LabelCount;

public interface GeneralInspectionRepository extends CrudRepository<GeneralInspection, Long> {

        // Cloisonnement par mine : companyId null (appel système / allMines) ne filtre pas.
        @Query("SELECT gi.id AS id, gi.activity.title AS title, gi.activity.id as activityId, gi.site.id AS siteId, gi.site.name AS siteName,  gi.site.id as locationId, "
                        + "gi.plannedDate AS plannedDate, gi.startTime AS startTime, gi.endTime AS endTime, gi.status AS status "
                        + "FROM GeneralInspection gi WHERE (:companyId IS NULL OR gi.companyId = :companyId)")
        List<GeneralInspectionResponse> findAllInspections(@Param("companyId") Long companyId);

        @Query("SELECT gi.id AS id,  gi.activity.title AS title, gi.activity.id as activityId,  gi.site.id AS siteId,  gi.site.name as location, "
                        + "gi.plannedDate AS plannedDate, gi.startTime AS startTime, gi.endTime AS endTime, gi.status AS status "
                        + "FROM GeneralInspection gi  WHERE gi.id = :id AND (:companyId IS NULL OR gi.companyId = :companyId)")
        Optional<InspectionInfo> findInspectionInfo(@Param("id") Long id, @Param("companyId") Long companyId);

        /** Registre des inspections (entités) filtré par mine. Utilisé par le workflow. */
        @Query("SELECT gi FROM GeneralInspection gi WHERE (:companyId IS NULL OR gi.companyId = :companyId)")
        List<GeneralInspection> findAllByCompany(@Param("companyId") Long companyId);

        Optional<GeneralInspection> findFirstByPlannedDateGreaterThanEqualOrderByPlannedDateAsc(LocalDate date);

        /**
         * Dernière inspection pour une cible donnée (type du template +
         * targetRefId), scopée mine. Renvoyée la plus récente en tête
         * (plannedDate puis id décroissants) ; le service prend le premier
         * élément via Pageable(0,1). companyId null ne filtre pas (allMines).
         */
        @Query("SELECT gi FROM GeneralInspection gi "
                        + "WHERE gi.template.type = :type AND gi.targetRefId = :refId "
                        + "AND (:companyId IS NULL OR gi.companyId = :companyId) "
                        + "ORDER BY gi.plannedDate DESC, gi.id DESC")
        List<GeneralInspection> findLastInspection(@Param("type") InspectionTemplateType type,
                        @Param("refId") Long refId, @Param("companyId") Long companyId, Pageable pageable);

        // ─── Tableau de bord : surveillance planifiée (ISO 45001 §9.1) ───

        /**
         * Répartition des inspections de l'exercice par statut. L'exercice est
         * défini par la DATE PRÉVUE (et non la date de création) : c'est la
         * planification que la norme demande de suivre.
         *
         * <p>Les inspections sans date prévue sont exclues — leur rattacher un
         * exercice serait une invention.</p>
         */
        @Query("""
                        SELECT CAST(gi.status AS string) AS label, COUNT(gi) AS total
                        FROM GeneralInspection gi
                        WHERE FUNCTION('YEAR', gi.plannedDate) = :year
                          AND (:companyId IS NULL OR gi.companyId = :companyId)
                        GROUP BY gi.status
                        ORDER BY COUNT(gi) DESC
                        """)
        List<LabelCount> findInspectionCountByStatus(@Param("year") int year,
                        @Param("companyId") Long companyId);

        /**
         * Inspections de l'exercice encore PLANIFIÉES alors que leur date est
         * passée — écart de conformité ISO 45001 §9.1, à rendre visible.
         * Le statut est passé en paramètre plutôt qu'écrit en dur dans le JPQL :
         * une référence de constante d'énumération dans la requête casse dès
         * que l'énumération est renommée, sans que la compilation le signale.
         */
        @Query("""
                        SELECT COUNT(gi) FROM GeneralInspection gi
                        WHERE gi.status = :scheduledStatus
                          AND gi.plannedDate < :today
                          AND FUNCTION('YEAR', gi.plannedDate) = :year
                          AND (:companyId IS NULL OR gi.companyId = :companyId)
                        """)
        long countOverdueInspections(@Param("year") int year,
                        @Param("companyId") Long companyId,
                        @Param("today") LocalDate today,
                        @Param("scheduledStatus") InspectionStatus scheduledStatus);
}
