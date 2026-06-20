package com.minexpert.hns.repository.error;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.error.ErrorEventType;

public interface ErrorEventTypeRepository extends CrudRepository<ErrorEventType, Long> {

    /** Types globaux (companyId null) + types propres a la societe. */
    @Query("""
            SELECT t FROM ErrorEventType t
            WHERE t.companyId IS NULL
               OR (:companyId IS NOT NULL AND t.companyId = :companyId)
            ORDER BY t.id ASC
            """)
    List<ErrorEventType> findVisibleForCompany(@Param("companyId") Long companyId);
}
