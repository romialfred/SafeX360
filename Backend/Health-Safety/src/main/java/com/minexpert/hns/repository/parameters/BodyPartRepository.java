package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.parameters.BodyPart;
import com.minexpert.hns.enums.Status;

public interface BodyPartRepository extends CrudRepository<BodyPart, Long> {
    Optional<BodyPart> findByCompanyIdAndNameIgnoreCase(Long companyId, String name);

    @Query("SELECT b FROM BodyPart b WHERE (:companyId IS NULL OR b.companyId = :companyId)")
    List<BodyPart> findAllByCompanyId(@Param("companyId") Long companyId);

    @Query("SELECT b FROM BodyPart b WHERE b.status = :status AND (:companyId IS NULL OR b.companyId = :companyId)")
    List<BodyPart> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);

}
