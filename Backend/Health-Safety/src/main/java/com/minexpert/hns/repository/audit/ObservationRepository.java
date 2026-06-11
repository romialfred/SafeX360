package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.ObsTitle;
import com.minexpert.hns.entity.audit.Observation;

public interface ObservationRepository extends CrudRepository<Observation, Long> {

    List<Observation> findByAudit_Id(Long auditId);

    @Query("SELECT new com.minexpert.hns.dto.response.ObsTitle(o.id, o.title) FROM Observation o WHERE o.audit.id = ?1")
    List<ObsTitle> findTitlesByAuditId(Long auditId);

    // ─── LOT 52 — Programme d'audit et classification ISO ──────────────────

    List<Observation> findByAudit_IdIn(List<Long> auditIds);

    /**
     * Nombre de non-conformités centrales ouvertes traçables par domaine
     * (via les constats escaladés : observation.zone → NonConformity ouverte).
     */
    @Query("SELECT o.zone.id, COUNT(DISTINCT o.nonConformityId) FROM Observation o, "
            + "com.minexpert.hns.entity.nonConformity.NonConformity nc "
            + "WHERE o.nonConformityId = nc.id AND nc.status NOT IN (:excludedStatuses) "
            + "GROUP BY o.zone.id")
    List<Object[]> countOpenNonConformitiesByZone(
            @Param("excludedStatuses") List<com.minexpert.hns.enums.EventStatus> excludedStatuses);
}
