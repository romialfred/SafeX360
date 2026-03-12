package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.response.ObsTitle;
import com.minexpert.hns.entity.audit.Observation;

public interface ObservationRepository extends CrudRepository<Observation, Long> {

    List<Observation> findByAudit_Id(Long auditId);

    @Query("SELECT new com.minexpert.hns.dto.response.ObsTitle(o.id, o.title) FROM Observation o WHERE o.audit.id = ?1")
    List<ObsTitle> findTitlesByAuditId(Long auditId);

}
