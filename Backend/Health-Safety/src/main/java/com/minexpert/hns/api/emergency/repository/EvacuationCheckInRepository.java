package com.minexpert.hns.api.emergency.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.EvacuationCheckIn;

public interface EvacuationCheckInRepository extends JpaRepository<EvacuationCheckIn, Long> {

    List<EvacuationCheckIn> findByGeneralAlertIdOrderByCheckedAtDesc(Long generalAlertId);

    Optional<EvacuationCheckIn> findByGeneralAlertIdAndEmployeeId(Long generalAlertId, Long employeeId);
}
