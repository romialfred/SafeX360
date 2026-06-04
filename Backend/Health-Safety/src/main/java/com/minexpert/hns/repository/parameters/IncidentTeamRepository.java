package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.parameters.IncidentTeam;
import com.minexpert.hns.enums.Status;

public interface IncidentTeamRepository extends CrudRepository<IncidentTeam, Long> {
    Optional<IncidentTeam> findByCompanyIdAndDepartmentId(Long companyId, Long id);

    Optional<IncidentTeam> findByCompanyIdAndNameIgnoreCase(Long companyId, String name);

    @Query("SELECT t FROM IncidentTeam t WHERE t.status = :status AND (:companyId IS NULL OR t.companyId = :companyId)")
    List<IncidentTeam> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);

    @Query("SELECT t FROM IncidentTeam t WHERE (:companyId IS NULL OR t.companyId = :companyId)")
    List<IncidentTeam> findAllByCompanyId(@Param("companyId") Long companyId);

}
