package com.minexpert.hns.dosimetry.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.ExposureProfile;

@Repository
public interface ExposureProfileRepository extends JpaRepository<ExposureProfile, Long> {

    List<ExposureProfile> findByWorkerId(Long workerId);

    List<ExposureProfile> findByZoneId(Long zoneId);

    List<ExposureProfile> findByPostId(Long postId);
}
