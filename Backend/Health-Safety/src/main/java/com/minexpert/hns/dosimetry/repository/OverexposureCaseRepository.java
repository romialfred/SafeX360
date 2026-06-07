package com.minexpert.hns.dosimetry.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.OverexposureCase;
import com.minexpert.hns.dosimetry.enums.CaseStatus;

@Repository
public interface OverexposureCaseRepository extends JpaRepository<OverexposureCase, Long> {

    List<OverexposureCase> findByWorkerId(Long workerId);

    List<OverexposureCase> findByStatus(CaseStatus status);
}
