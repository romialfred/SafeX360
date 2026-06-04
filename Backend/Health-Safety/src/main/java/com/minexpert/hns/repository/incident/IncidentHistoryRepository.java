package com.minexpert.hns.repository.incident;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.IncidentHistoryDetails;
import com.minexpert.hns.entity.incident.IncidentHistory;

public interface IncidentHistoryRepository extends CrudRepository<IncidentHistory, Long> {

    @Query("SELECT new com.minexpert.hns.dto.response.IncidentHistoryDetails(" +
            "i.id, i.ownerId, null, i.date, i.status, i.comment, i.incident.id, i.createdAt) " +
            "FROM IncidentHistory i WHERE i.incident.id = :incidentId " +
            "AND (:companyId IS NULL OR i.incident.companyId = :companyId)")
    List<IncidentHistoryDetails> findByIncidentIdAndCompanyId(@Param("incidentId") Long incidentId,
            @Param("companyId") Long companyId);

}
