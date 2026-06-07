package com.minexpert.hns.dosimetry.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.ExposureProfileLink;

@Repository
public interface ExposureProfileLinkRepository extends JpaRepository<ExposureProfileLink, Long> {

    List<ExposureProfileLink> findByExposureProfileId(Long exposureProfileId);

    List<ExposureProfileLink> findByMeasurementPointId(Long measurementPointId);

    void deleteByExposureProfileId(Long exposureProfileId);
}
