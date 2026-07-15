package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.PpeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PpeRequestRepository extends JpaRepository<PpeRequest, Long> {

    // --- Cloisonnement par mine (companyId) ; companyId null = pas de filtre ---
    @Query("SELECT r FROM PpeRequest r WHERE (:companyId IS NULL OR r.companyId = :companyId)")
    List<PpeRequest> findAllByCompany(@Param("companyId") Long companyId);
}
