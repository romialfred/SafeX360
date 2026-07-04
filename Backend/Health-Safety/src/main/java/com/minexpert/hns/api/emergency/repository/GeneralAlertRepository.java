package com.minexpert.hns.api.emergency.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.api.emergency.entity.GeneralAlert;
import com.minexpert.hns.api.emergency.enums.GeneralAlertStatus;

import jakarta.persistence.LockModeType;

public interface GeneralAlertRepository extends JpaRepository<GeneralAlert, Long> {

    Optional<GeneralAlert> findFirstByCompanyIdAndStatusOrderByTriggeredAtDesc(
        Long companyId, GeneralAlertStatus status
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM GeneralAlert a WHERE a.companyId = :companyId AND a.status = :status ORDER BY a.triggeredAt DESC")
    Optional<GeneralAlert> findFirstActiveForUpdate(
        @Param("companyId") Long companyId,
        @Param("status") GeneralAlertStatus status
    );

    List<GeneralAlert> findByCompanyIdOrderByTriggeredAtDesc(Long companyId);
}
