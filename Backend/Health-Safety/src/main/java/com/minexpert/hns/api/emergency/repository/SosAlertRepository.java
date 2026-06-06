package com.minexpert.hns.api.emergency.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.SosAlert;
import com.minexpert.hns.api.emergency.enums.SosStatus;

public interface SosAlertRepository extends JpaRepository<SosAlert, Long> {

    /** Alertes actives (non clôturées) d'une mine, plus récentes en premier. */
    List<SosAlert> findByCompanyIdAndStatusNotInOrderByTriggeredAtDesc(
        Long companyId, List<SosStatus> excludedStatuses
    );

    /** Toutes les alertes d'une mine (historique inclus). */
    List<SosAlert> findByCompanyIdOrderByTriggeredAtDesc(Long companyId);

    /** Alertes d'un employé. */
    List<SosAlert> findByEmployeeIdOrderByTriggeredAtDesc(Long employeeId);
}
