package com.minexpert.hns.dosimetry.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.MonitoringCampaign;
import com.minexpert.hns.dosimetry.enums.CampaignStatus;

@Repository
public interface MonitoringCampaignRepository extends JpaRepository<MonitoringCampaign, Long> {

    List<MonitoringCampaign> findByMineId(Long mineId);

    List<MonitoringCampaign> findByMineIdAndStatus(Long mineId, CampaignStatus status);

    Optional<MonitoringCampaign> findByMineIdAndCode(Long mineId, String code);

    boolean existsByMineIdAndCode(Long mineId, String code);
}
