package com.minexpert.hns.dosimetry.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.enums.AlertStatus;

@Repository
public interface ExposureAlertRepository extends JpaRepository<ExposureAlert, Long> {

    List<ExposureAlert> findByWorkerId(Long workerId);

    List<ExposureAlert> findByStatus(AlertStatus status);

    List<ExposureAlert> findByStatusAndWorkerId(AlertStatus status, Long workerId);

    List<ExposureAlert> findByWorkerIdAndStatus(Long workerId, AlertStatus status);
}
