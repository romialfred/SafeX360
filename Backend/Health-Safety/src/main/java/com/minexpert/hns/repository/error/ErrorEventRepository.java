package com.minexpert.hns.repository.error;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.error.ErrorEvent;
import com.minexpert.hns.enums.ErrorEventStatus;

public interface ErrorEventRepository extends CrudRepository<ErrorEvent, Long> {

    @Query("""
            SELECT e FROM ErrorEvent e
            WHERE e.id = :id
              AND (:companyId IS NULL OR e.companyId = :companyId)
            """)
    Optional<ErrorEvent> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);

    @Query("""
            SELECT e FROM ErrorEvent e
            WHERE (:companyId IS NULL OR e.companyId = :companyId)
            ORDER BY e.createdAt DESC
            """)
    List<ErrorEvent> findAllByCompany(@Param("companyId") Long companyId);

    @Query("""
            SELECT e FROM ErrorEvent e
            WHERE e.status = :status
              AND (:companyId IS NULL OR e.companyId = :companyId)
            ORDER BY e.createdAt DESC
            """)
    List<ErrorEvent> findByStatus(@Param("companyId") Long companyId, @Param("status") ErrorEventStatus status);

    @Query("""
            SELECT e FROM ErrorEvent e
            WHERE e.eventTypeId = :eventTypeId
              AND (:companyId IS NULL OR e.companyId = :companyId)
            ORDER BY e.createdAt DESC
            """)
    List<ErrorEvent> findByEventType(@Param("companyId") Long companyId, @Param("eventTypeId") Long eventTypeId);

    /** Compte les references deja generees pour une societe et une annee donnees. */
    @Query("""
            SELECT COUNT(e) FROM ErrorEvent e
            WHERE e.companyId = :companyId
              AND e.reference LIKE :prefix
            """)
    long countByReferencePrefix(@Param("companyId") Long companyId, @Param("prefix") String prefix);
}
