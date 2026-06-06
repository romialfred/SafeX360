package com.minexpert.hns.api.emergency.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.EmergencyMedia;

public interface EmergencyMediaRepository extends JpaRepository<EmergencyMedia, Long> {
    List<EmergencyMedia> findByCompanyIdOrderByMediaTypeAscLocaleAsc(Long companyId);
    List<EmergencyMedia> findByCompanyIdAndMediaType(Long companyId, String mediaType);
}
