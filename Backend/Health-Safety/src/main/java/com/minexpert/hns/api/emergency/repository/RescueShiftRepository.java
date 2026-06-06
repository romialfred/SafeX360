package com.minexpert.hns.api.emergency.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.RescueShift;

public interface RescueShiftRepository extends JpaRepository<RescueShift, Long> {
    List<RescueShift> findByTeamIdOrderByStartTimeAsc(Long teamId);
}
