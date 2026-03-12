package com.minexpert.hns.repository.incident;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.response.IncidentHistoryDetails;
import com.minexpert.hns.entity.incident.IncidentHistory;

public interface IncidentHistoryRepository extends CrudRepository<IncidentHistory, Long> {

    @Query("SELECT new com.minexpert.hns.dto.response.IncidentHistoryDetails(" +
            "i.id, i.ownerId, null, i.date, i.status, i.comment, i.incident.id, i.createdAt) " +
            "FROM IncidentHistory i WHERE i.incident.id = ?1")
    List<IncidentHistoryDetails> findByIncidentId(Long incidentId);

}
