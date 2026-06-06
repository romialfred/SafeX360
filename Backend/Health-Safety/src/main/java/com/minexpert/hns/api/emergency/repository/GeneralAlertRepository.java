package com.minexpert.hns.api.emergency.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.GeneralAlert;
import com.minexpert.hns.api.emergency.enums.GeneralAlertStatus;

public interface GeneralAlertRepository extends JpaRepository<GeneralAlert, Long> {

    Optional<GeneralAlert> findFirstByCompanyIdAndStatusOrderByTriggeredAtDesc(
        Long companyId, GeneralAlertStatus status
    );

    List<GeneralAlert> findByCompanyIdOrderByTriggeredAtDesc(Long companyId);
}
