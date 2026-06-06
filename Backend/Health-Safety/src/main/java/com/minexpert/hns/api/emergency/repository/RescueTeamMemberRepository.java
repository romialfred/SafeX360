package com.minexpert.hns.api.emergency.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.RescueTeamMember;

public interface RescueTeamMemberRepository extends JpaRepository<RescueTeamMember, Long> {
    List<RescueTeamMember> findByTeamId(Long teamId);
    void deleteByTeamIdAndEmployeeId(Long teamId, Long employeeId);
}
