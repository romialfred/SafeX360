package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.audit.AreaDetails;
import com.minexpert.hns.entity.audit.Area;

public interface AreaRepository extends CrudRepository<Area, Long> {
    List<Area> findByAudit_Id(Long auditId);

    @Query("SELECT a.id AS id, a.auditArea.name AS areaName, a.auditArea.id AS areaId, a.purpose AS purpose "
            + "FROM Area a WHERE a.audit.id = ?1")
    List<AreaDetails> findDetailsByAuditId(Long auditId);

}
