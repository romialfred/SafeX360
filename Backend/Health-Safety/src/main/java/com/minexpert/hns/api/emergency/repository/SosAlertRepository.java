package com.minexpert.hns.api.emergency.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.minexpert.hns.api.emergency.entity.SosAlert;
import com.minexpert.hns.api.emergency.enums.SosStatus;

public interface SosAlertRepository extends JpaRepository<SosAlert, Long> {

    List<SosAlert> findByCompanyIdAndStatusNotInOrderByTriggeredAtDesc(
        Long companyId, List<SosStatus> excludedStatuses
    );

    List<SosAlert> findByCompanyIdOrderByTriggeredAtDesc(Long companyId);

    List<SosAlert> findByEmployeeIdOrderByTriggeredAtDesc(Long employeeId);

    @Query("SELECT s FROM SosAlert s WHERE s.status = :status AND s.triggeredAt IS NOT NULL AND s.triggeredAt < :threshold")
    List<SosAlert> findEscalationCandidates(SosStatus status, LocalDateTime threshold);
}
