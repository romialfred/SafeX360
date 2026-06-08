package com.minexpert.hns.blast.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.blast.entity.BlastSetting;

@Repository
public interface BlastSettingRepository extends JpaRepository<BlastSetting, Long> {

    Optional<BlastSetting> findByMineId(Long mineId);
}
