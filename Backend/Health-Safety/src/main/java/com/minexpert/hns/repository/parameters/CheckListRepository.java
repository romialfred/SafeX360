package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.CheckListDetails;
import com.minexpert.hns.entity.parameters.CheckList;
import com.minexpert.hns.enums.Status;

public interface CheckListRepository extends CrudRepository<CheckList, Long> {

    Optional<CheckList> findByCompanyIdAndNameIgnoreCase(Long companyId, String name);

    @Query("SELECT i.id AS id, i.name AS name, i.description AS description, c.id AS incidentCategoryId, c.name AS incidentCategoryName, i.status AS status, i.companyId AS companyId FROM CheckList i JOIN i.incidentCategory c WHERE (:companyId IS NULL OR i.companyId = :companyId)")
    List<CheckListDetails> findAllWithName(@Param("companyId") Long companyId);

    @Query("SELECT i.id AS id, i.name AS name, c.id AS incidentCategoryId, c.name AS incidentCategoryName, i.description AS description, i.status AS status, i.companyId AS companyId FROM CheckList i JOIN i.incidentCategory c WHERE i.status = :status AND (:companyId IS NULL OR i.companyId = :companyId)")
    List<CheckListDetails> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);
}
